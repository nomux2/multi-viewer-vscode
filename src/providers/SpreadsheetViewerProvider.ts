import * as vscode from 'vscode';
import * as path from 'path';
import { DataChunker } from '../utils/DataChunker';
import * as fs from 'fs';

export class SpreadsheetViewerProvider implements vscode.CustomReadonlyEditorProvider {

    public static readonly viewType = 'multiViewer.spreadsheetViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new SpreadsheetViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(SpreadsheetViewerProvider.viewType, provider);
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
        console.log('[SpreadsheetViewerProvider] resolveCustomEditor called for:', document.uri.fsPath);
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        webviewPanel.webview.onDidReceiveMessage(async e => {
            console.log('[SpreadsheetViewerProvider] Received message:', e.type);
            switch (e.type) {
                case 'ready':
                    await this.loadDocument(document, webviewPanel.webview);
                    break;
            }
        });
    }

    private async loadDocument(document: vscode.CustomDocument, webview: vscode.Webview) {
        const filePath = document.uri.fsPath;
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.csv' || ext === '.tsv') {
            // For now, load first chunk for CSV. Ideally we implement streaming or use DataChunker nicely.
            // Simplified: Load first 100KB to preview
            await this.loadCsvChunk(filePath, webview);
        } else {
            // For XLSX, we might need to load the whole file bytes and send to webview to parse with SheetJS
            // OR parse in extension host.
            // Parsing in extension host is safer for performance but passing huge JSON is slow.
            // Let's pass the binary data and let Webview parse for now (common pattern for SheetJS in browser).
            await this.loadBinaryFile(filePath, webview);
        }
    }

    private async loadCsvChunk(filePath: string, webview: vscode.Webview) {
        try {
            console.log('[SpreadsheetViewerProvider] Reading CSV chunk...');
            const chunkSize = 100 * 1024;
            const result = await DataChunker.readChunk(filePath, 0, chunkSize);
            const text = new TextDecoder().decode(result.data);
            console.log('[SpreadsheetViewerProvider] CSV read complete. Text length:', text.length);

            webview.postMessage({
                type: 'csv-chunk',
                data: text,
                totalSize: result.totalSize
            });
            console.log('[SpreadsheetViewerProvider] Sent csv-chunk message');
        } catch (error) {
            console.error('[SpreadsheetViewerProvider] CSV Error:', error);
            vscode.window.showErrorMessage(`Failed to load CSV: ${error}`);
        }
    }

    private async loadBinaryFile(filePath: string, webview: vscode.Webview) {
        try {
            console.log('[SpreadsheetViewerProvider] Reading binary file...');
            const fileData = await fs.promises.readFile(filePath);
            console.log('[SpreadsheetViewerProvider] File read complete. Size:', fileData.byteLength);

            // Send as plain Array (slow) or Uint8Array. 
            // VS Code webview messaging handles TypedArrays efficiently.
            // fileData is a Buffer. Passing it directly might cause serialization issues or arrive as { type: 'Buffer', data: [...] }.
            // Convert to Uint8Array explicitly.
            const dataToSend = new Uint8Array(fileData);

            webview.postMessage({
                type: 'xlsx-file',
                data: dataToSend
            });
            console.log('[SpreadsheetViewerProvider] Sent xlsx-file message');
        } catch (error) {
            console.error('[SpreadsheetViewerProvider] Binary Error:', error);
            vscode.window.showErrorMessage(`Failed to load Spreadsheet: ${error}`);
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
                <title>Spreadsheet Viewer</title>
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
