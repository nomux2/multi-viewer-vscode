import React, { useEffect, useState } from 'react';
import * as ReactDataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import * as XLSX from 'xlsx';
import { ViewerProps } from './index';

// Fix for react-data-grid import issues in VS Code webview
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataGrid = (ReactDataGrid as any).default || ReactDataGrid;

interface Row {
    [key: string]: string;
}

export const SpreadsheetViewer: React.FC<ViewerProps> = ({ vscode, initialData }) => {
    const [rows, setRows] = useState<Row[]>([]);
    const [columns, setColumns] = useState<ReactDataGrid.Column<Row>[]>([]);

    const handleCsvData = (csvText: string) => {
        const workbook = XLSX.read(csvText, { type: 'string', raw: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1 });

        if (data.length > 0) {
            setupGrid(data);
        }
    };

    const handleXlsxData = (data: ArrayBuffer | Uint8Array) => {
        // Uint8Array for buffer
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1 });

        if (jsonData.length > 0) {
            setupGrid(jsonData);
        }
    };

    const setupGrid = (data: any[]) => {
        // Calculate maximum number of columns to ensure all data is shown
        const maxCols = data.reduce((max, row) => Math.max(max, (row as any[]).length), 0);

        if (maxCols === 0) {
            return;
        }

        // Generate columns with Excel-style headers (A, B, C...)
        const cols: ReactDataGrid.Column<Row>[] = Array.from({ length: maxCols }, (_, i) => ({
            key: i.toString(),
            name: XLSX.utils.encode_col(i),
            resizable: true
        }));

        // Convert all rows
        const gridRows: Row[] = data.map((row, i) => {
            const rowObj: Row = {};
            (row as any[]).forEach((cell, idx) => {
                rowObj[idx.toString()] = cell !== undefined && cell !== null ? String(cell) : '';
            });
            return rowObj;
        });

        setColumns(cols);
        setRows(gridRows);
    };

    useEffect(() => {
        // Initialize from initialData if available
        if (initialData) {
            if (initialData.type === 'csv-chunk') {
                handleCsvData(initialData.data);
            } else if (initialData.type === 'xlsx-file') {
                handleXlsxData(initialData.data);
            }
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'csv-chunk':
                    handleCsvData(message.data);
                    break;
                case 'xlsx-file':
                    handleXlsxData(message.data);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [initialData]);

    if (!DataGrid) {
        return <div style={{ color: 'red', padding: 20 }}>Error: DataGrid component not found.</div>;
    }

    const safeColumns = columns || [];
    const safeRows = rows || [];

    return (
        <div style={{ height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <DataGrid
                    columns={safeColumns}
                    rows={safeRows}
                    style={{ blockSize: '100%', height: '100%' }}
                    className="fill-grid"
                />
            </div>
        </div>
    );
};
