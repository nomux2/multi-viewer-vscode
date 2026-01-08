import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ViewerProps } from './index';

// Configure worker. 
// In a typical web app we point to a worker file. 
// In VS Code Webview with Webpack, it's tricky.
// We will try running without worker (disableWorker = true) for simplicity first,
// or use the embedded worker entry if possible.
// Setting workerSrc to module export often works in bundlers.
// Configure worker. 
// In a typical web app we point to a worker file. 
// In VS Code Webview with Webpack, it's tricky.
// We will try running without worker (disableWorker = true) for simplicity first,
// or use the embedded worker entry if possible.
// Setting workerSrc to module export often works in bundlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// (pdfjsLib.GlobalWorkerOptions as any).workerSrc = undefined; // This crashes pdfjs 4.x/5.x

export const PdfViewer: React.FC<ViewerProps> = ({ vscode, initialData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [pageNum, setPageNum] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [scale, setScale] = useState(1.5);
    const [error, setError] = useState<string | null>(null);

    const loadPdf = async (data: any) => {
        try {
            // pdfjsLib.getDocument accepts Uint8Array or ArrayBuffer
            const loadingTask = pdfjsLib.getDocument({ data: data });
            const pdf = await loadingTask.promise;
            setPdfDoc(pdf);
            setPageCount(pdf.numPages);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load PDF: ' + err.message);
        }
    };

    useEffect(() => {
        // Initialize from initialData if available
        if (initialData && initialData.type === 'pdf-data') {
            loadPdf(initialData.data);
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'pdf-data') {
                loadPdf(message.data);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [initialData]);

    useEffect(() => {
        if (pdfDoc) {
            renderPage(pageNum);
        }
    }, [pdfDoc, pageNum, scale]);

    const renderPage = async (num: number) => {
        if (!pdfDoc || !canvasRef.current) return;

        try {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: scale });

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
            }
        } catch (err: any) {
            console.error(err);
            setError('Error rendering page: ' + err.message);
        }
    };

    if (error) {
        return <div style={{ color: 'red', padding: 20 }}>{error}</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 10, backgroundColor: '#525659' }}>
            <div style={{ marginBottom: 10, color: 'white' }}>
                <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}>Prev</button>
                <span style={{ margin: '0 10px' }}>Page {pageNum} of {pageCount}</span>
                <button onClick={() => setPageNum(p => Math.min(pageCount, p + 1))} disabled={pageNum >= pageCount}>Next</button>
                <span style={{ marginLeft: 20 }}>
                    <button onClick={() => setScale(s => s - 0.2)}>-</button>
                    <span style={{ margin: '0 5px' }}>{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => s + 0.2)}>+</button>
                </span>
            </div>
            <canvas ref={canvasRef} style={{ border: '1px solid #ccc', maxWidth: '100%' }} />
        </div>
    );
};
