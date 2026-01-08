import * as vscode from 'vscode';
import * as path from 'path';
import { DataChunker } from '../utils/DataChunker';

export class HexViewerProvider implements vscode.CustomReadonlyEditorProvider {

    public static readonly viewType = 'multiViewer.hexViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new HexViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(HexViewerProvider.viewType, provider);
    }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => { } };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        webviewPanel.webview.onDidReceiveMessage(async e => {
            switch (e.type) {
                case 'ready':
                    // Initial chunks
                    await this.loadHexChunk(document, webviewPanel.webview, 0);
                    break;
                case 'request-hex-chunk':
                    await this.loadHexChunk(document, webviewPanel.webview, e.offset);
                    break;
            }
        });
    }

    private async loadHexChunk(document: vscode.CustomDocument, webview: vscode.Webview, offset: number) {
        try {
            const filePath = document.uri.fsPath;
            const chunkSize = 4096; // 4KB per chunk request
            const result = await DataChunker.readChunk(filePath, offset, chunkSize);

            webview.postMessage({
                type: 'hex-chunk',
                offset: offset,
                data: Array.from(result.data), // Convert Uint8Array to array for JSON serialization if needed, or pass as arraybuffer?
                // Using Array.from is safer for JSON.stringify but slower.
                // Let's pass array of numbers for now.
                totalSize: result.totalSize
            });
        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage(`Failed to load Hex chunk: ${error}`);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'webview.bundle.js')
        ));
        const nonce = getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hex Viewer</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
