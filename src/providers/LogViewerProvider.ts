import * as vscode from 'vscode';
import * as path from 'path';
import { DataChunker } from '../utils/DataChunker';
import { StreamParser } from '../utils/StreamParser';

export class LogViewerProvider implements vscode.CustomReadonlyEditorProvider {

    public static readonly viewType = 'multiViewer.logViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new LogViewerProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(LogViewerProvider.viewType, provider);
        return providerRegistration;
    }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        // Simple document, no specialized data model yet
        return { uri, dispose: () => { } };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        // Setup Webview
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Receive messages from Webview
        webviewPanel.webview.onDidReceiveMessage(e => {
            switch (e.type) {
                case 'ready':
                    // Initial load (read first 64KB)
                    this.loadInitialChunk(document, webviewPanel.webview);
                    break;
            }
        });
    }

    private async loadInitialChunk(document: vscode.CustomDocument, webview: vscode.Webview) {
        try {
            const filePath = document.uri.fsPath;
            const chunkSize = 64 * 1024; // 64KB
            const result = await DataChunker.readChunk(filePath, 0, chunkSize);

            // Assume parsing lines from binary (handling UTF-8)
            const { lines } = StreamParser.splitLines(result.data);

            webview.postMessage({
                type: 'chunk',
                lines: lines,
                totalSize: result.totalSize
            });
        } catch (error) {
            console.error('Failed to load log chunk:', error);
            vscode.window.showErrorMessage(`Failed to load log file: ${error}`);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'webview.bundle.js')
        ));

        // Use a secure nonce
        const nonce = getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Log Viewer</title>
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
