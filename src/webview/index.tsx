import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LogViewer } from './LogViewer';
import { SpreadsheetViewer } from './SpreadsheetViewer';
import { PdfViewer } from './PdfViewer';
import { OfficeViewer } from './OfficeViewer';
import { HexViewer } from './HexViewer';
import { SqliteViewer } from './SqliteViewer';
import './index.css';

// Declare VS Code API types
declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage: (message: any) => void;
            getState: () => any;
            setState: (state: any) => void;
        };
    }
}

// Acquire API once per session
const vscode = window.acquireVsCodeApi();

export interface ViewerProps {
    vscode: any;
    initialData: any;
}

const App = () => {
    const [mode, setMode] = useState<'log' | 'spreadsheet' | 'pdf' | 'office' | 'hex' | 'sqlite' | null>(null);
    // Store the first message that triggered the mode switch to pass it to the component
    const [initialData, setInitialData] = useState<any>(null);
    const sentReady = useRef(false);

    useEffect(() => {
        console.log('[Webview:App] Mounted');
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            console.log('[Webview:App] Received message:', message.type, message);
            if (!mode) {
                // Determine mode from the first message
                if (message.type === 'chunk') {
                    console.log('[Webview:App] Setting mode to LOG');
                    setMode('log');
                    setInitialData(message);
                } else if (message.type === 'csv-chunk' || message.type === 'xlsx-file') {
                    console.log('[Webview:App] Setting mode to SPREADSHEET');
                    setMode('spreadsheet');
                    setInitialData(message);
                } else if (message.type === 'pdf-data') {
                    console.log('[Webview:App] Setting mode to PDF');
                    setMode('pdf');
                    setInitialData(message);
                } else if (message.type === 'office-data') {
                    console.log('[Webview:App] Setting mode to OFFICE');
                    setMode('office');
                    setInitialData(message);
                } else if (message.type === 'hex-chunk') {
                    console.log('[Webview:App] Setting mode to HEX');
                    setMode('hex');
                    setInitialData(message);
                } else if (message.type === 'sqlite-data') {
                    console.log('[Webview:App] Setting mode to SQLITE');
                    setMode('sqlite');
                    setInitialData(message);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        // Send ready signal immediately to start the flow
        if (!sentReady.current) {
            console.log('[Webview:App] Sending READY signal');
            vscode.postMessage({ type: 'ready' });
            sentReady.current = true;
        }

        return () => window.removeEventListener('message', handleMessage);
    }, [mode]);

    if (!mode) {
        return (
            <div style={{ color: 'gray', padding: 20 }}>
                Waiting for content...
            </div>
        );
    }

    const commonProps = { vscode, initialData };

    if (mode === 'log') {
        return <LogViewer {...commonProps} rowHeight={20} />;
    }
    if (mode === 'spreadsheet') {
        return <SpreadsheetViewer {...commonProps} />;
    }
    if (mode === 'pdf') {
        return <PdfViewer {...commonProps} />;
    }
    if (mode === 'office') {
        return <OfficeViewer {...commonProps} />;
    }
    if (mode === 'hex') {
        return <HexViewer {...commonProps} />;
    }
    if (mode === 'sqlite') {
        return <SqliteViewer {...commonProps} />;
    }

    return null;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
