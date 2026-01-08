import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class OfficeViewerProvider implements vscode.CustomReadonlyEditorProvider {

    public static readonly viewType = 'multiViewer.officeViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new OfficeViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(OfficeViewerProvider.viewType, provider);
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
        console.log('[OfficeViewerProvider] resolveCustomEditor called for:', document.uri.fsPath);
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        webviewPanel.webview.onDidReceiveMessage(async e => {
            console.log('[OfficeViewerProvider] Received message from webview:', e.type);
            if (e.type === 'ready') {
                const ext = path.extname(document.uri.fsPath).toLowerCase();
                console.log('[OfficeViewerProvider] Loading office document:', ext);
                await this.loadOffice(document, webviewPanel.webview, ext);
            }
        });
    }

    private async loadOffice(document: vscode.CustomDocument, webview: vscode.Webview, ext: string) {
        try {
            console.log('[OfficeViewerProvider] Reading file...');
            const fileData = await fs.promises.readFile(document.uri.fsPath);
            console.log('[OfficeViewerProvider] File read complete. Size:', fileData.byteLength);
            webview.postMessage({
                type: 'office-data',
                fileType: ext,
                data: fileData.buffer
            });
            console.log('[OfficeViewerProvider] Sent office-data message');
        } catch (error) {
            console.error('[OfficeViewerProvider] Error:', error);
            vscode.window.showErrorMessage(`Failed to load Office document: ${error}`);
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
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; worker-src blob:;">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Office Viewer</title>
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
