import React, { useEffect, useState, useRef } from 'react';
import { ViewerProps } from './index';

interface HexChunk {
    offset: number;
    data: number[]; // array of bytes
    totalSize: number;
}

export const HexViewer: React.FC<ViewerProps> = ({ vscode, initialData }) => {
    const [chunks, setChunks] = useState<Map<number, number[]>>(new Map());
    const [totalSize, setTotalSize] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const BYTES_PER_ROW = 16;
    const ROW_HEIGHT = 20;

    const handleChunk = (offset: number, data: number[], totalSize: number) => {
        setTotalSize(totalSize);
        setChunks(prev => {
            const newMap = new Map(prev);
            for (let i = 0; i < data.length; i += BYTES_PER_ROW) {
                const rowIdx = Math.floor((offset + i) / BYTES_PER_ROW);
                const rowBytes = data.slice(i, i + BYTES_PER_ROW);
                newMap.set(rowIdx, rowBytes);
            }
            return newMap;
        });
    };

    useEffect(() => {
        // Initialize from initialData if available
        if (initialData && initialData.type === 'hex-chunk') {
            const { offset, data, totalSize } = initialData;
            handleChunk(offset, data, totalSize);
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'hex-chunk') {
                const { offset, data, totalSize } = message;
                handleChunk(offset, data, totalSize);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [initialData]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const newTop = e.currentTarget.scrollTop;
        setScrollTop(newTop);

        // Simple pre-fetching logic
        // Calculate needed offset
        const startRow = Math.floor(newTop / ROW_HEIGHT);
        const byteOffset = startRow * BYTES_PER_ROW;

        // If we don't have this data, request it.
        // Debouncing would be good here.
        if (!chunks.has(startRow)) {
            // Request a 4KB chunk around here
            vscode.postMessage({ type: 'request-hex-chunk', offset: byteOffset });
        }
    };

    // Virtualization
    const totalRows = Math.ceil(totalSize / BYTES_PER_ROW);
    const viewportHeight = 600; // approximation or use ref
    const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT);
    const endIndex = Math.min(totalRows, startIndex + visibleCount + 5);

    const visibleRows = [];
    for (let i = startIndex; i < endIndex; i++) {
        const rowData = chunks.get(i) || [];
        const address = (i * BYTES_PER_ROW).toString(16).padStart(8, '0').toUpperCase();

        // Hex part
        const hexStr = Array.from({ length: BYTES_PER_ROW }, (_, idx) => {
            const b = rowData[idx];
            return b !== undefined ? b.toString(16).padStart(2, '0').toUpperCase() : '  ';
        }).join(' ');

        // ASCII part
        const asciiStr = Array.from({ length: BYTES_PER_ROW }, (_, idx) => {
            const b = rowData[idx];
            // 32-126 are printable ASCII
            return (b !== undefined && b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
        }).join('');

        visibleRows.push(
            <div
                key={i}
                style={{
                    position: 'absolute',
                    top: i * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                    width: '100%',
                    fontFamily: 'monospace',
                    display: 'flex',
                    gap: 20
                }}
            >
                <span style={{ color: '#888' }}>{address}</span>
                <span style={{ color: '#ce9178' }}>{hexStr}</span>
                <span style={{ color: '#a0a0a0' }}>{asciiStr}</span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            style={{ height: '100vh', width: '100%', overflowY: 'auto', position: 'relative', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
        >
            <div style={{ height: totalRows * ROW_HEIGHT, position: 'relative' }}>
                {visibleRows}
            </div>
        </div>
    );
};
