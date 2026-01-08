import React, { useEffect, useState } from 'react';
import initSqlJs from 'sql.js';
import { ViewerProps } from './index';

interface QueryResult {
    columns: string[];
    values: any[][];
}

export const SqliteViewer: React.FC<ViewerProps> = ({ vscode, initialData }) => {
    const [db, setDb] = useState<any>(null);
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [results, setResults] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadDb = async (wasmUrl: string, data: any) => {
        try {
            const SQL = await initSqlJs({
                locateFile: (file) => wasmUrl
            });
            const database = new SQL.Database(new Uint8Array(data));
            setDb(database);

            // Get table list
            const res = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            if (res.length > 0) {
                const tableNames = res[0].values.flat() as string[];
                setTables(tableNames);
            }
        } catch (err: any) {
            setError('Failed to load DB: ' + err.message);
        }
    };

    useEffect(() => {
        // Initialize from initialData if available
        if (initialData && initialData.type === 'sqlite-data') {
            loadDb(initialData.wasmUrl, initialData.data);
        }

        const handleMessage = async (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'sqlite-data') {
                loadDb(message.wasmUrl, message.data);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [initialData]);

    const handleTableClick = (tableName: string) => {
        setSelectedTable(tableName);
        if (db) {
            try {
                // Limit 100 for safety
                const res = db.exec(`SELECT * FROM "${tableName}" LIMIT 100`);
                if (res.length > 0) {
                    setResults({
                        columns: res[0].columns,
                        values: res[0].values
                    });
                } else {
                    setResults({ columns: [], values: [] });
                }
            } catch (err: any) {
                setError('Query error: ' + err.message);
            }
        }
    };

    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ width: 200, borderRight: '1px solid #444', padding: 10, overflowY: 'auto' }}>
                <h3>Tables</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {tables.map(t => (
                        <li
                            key={t}
                            onClick={() => handleTableClick(t)}
                            style={{
                                cursor: 'pointer',
                                padding: '5px 0',
                                color: selectedTable === t ? '#fff' : '#aaa',
                                fontWeight: selectedTable === t ? 'bold' : 'normal'
                            }}
                        >
                            {t}
                        </li>
                    ))}
                </ul>
            </div>
            <div style={{ flex: 1, padding: 10, overflow: 'auto' }}>
                {results ? (
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                            <tr>
                                {results.columns.map(c => (
                                    <th key={c} style={{ border: '1px solid #555', padding: 5, textAlign: 'left' }}>{c}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.values.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell: any, j) => (
                                        <td key={j} style={{ border: '1px solid #555', padding: 5 }}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div>Select a table to view data</div>
                )}
            </div>
        </div>
    );
};
