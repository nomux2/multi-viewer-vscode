import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class PdfViewerProvider implements vscode.CustomReadonlyEditorProvider {

    public static readonly viewType = 'multiViewer.pdfViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new PdfViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(PdfViewerProvider.viewType, provider);
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
            if (e.type === 'ready') {
                await this.loadPdf(document, webviewPanel.webview);
            }
        });
    }

    private async loadPdf(document: vscode.CustomDocument, webview: vscode.Webview) {
        try {
            const fileData = await fs.promises.readFile(document.uri.fsPath);
            // Converting to base64 to avoid some binary passing issues with pdf.js in webview
            // Though passing ArrayBuffer is better for perf, let's start with standard message.
            webview.postMessage({
                type: 'pdf-data',
                data: fileData.buffer // Pass underlying ArrayBuffer
            });
        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage(`Failed to load PDF: ${error}`);
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
                <title>PDF Viewer</title>
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
