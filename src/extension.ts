import * as vscode from 'vscode';
import { LogViewerProvider } from './providers/LogViewerProvider';
import { SpreadsheetViewerProvider } from './providers/SpreadsheetViewerProvider';
import { PdfViewerProvider } from './providers/PdfViewerProvider';
import { OfficeViewerProvider } from './providers/OfficeViewerProvider';
import { HexViewerProvider } from './providers/HexViewerProvider';
import { SqliteViewerProvider } from './providers/SqliteViewerProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Multi-Viewer is now active!');

    context.subscriptions.push(LogViewerProvider.register(context));
    context.subscriptions.push(SpreadsheetViewerProvider.register(context));
    context.subscriptions.push(PdfViewerProvider.register(context));
    context.subscriptions.push(OfficeViewerProvider.register(context));
    context.subscriptions.push(HexViewerProvider.register(context));
    context.subscriptions.push(SqliteViewerProvider.register(context));
}

export function deactivate() { }

