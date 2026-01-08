import React, { useEffect, useState, useRef } from 'react';
import { ViewerProps } from './index';

interface LogViewerProps extends ViewerProps {
    rowHeight?: number;
}

export const LogViewer: React.FC<LogViewerProps> = ({ vscode, initialData, rowHeight = 20 }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [totalLines, setTotalLines] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(600);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleChunk = (newLines: string[]) => {
        setLines(prev => [...prev, ...newLines]);
        setTotalLines(prev => prev + newLines.length);
    };

    useEffect(() => {
        // Initialize from initialData if available
        if (initialData && initialData.type === 'chunk') {
            handleChunk(initialData.lines);
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'chunk':
                    handleChunk(message.lines);
                    break;
                case 'clear':
                    setLines([]);
                    setTotalLines(0);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        const handleResize = () => {
            if (containerRef.current) {
                setViewportHeight(containerRef.current.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('resize', handleResize);
        };
    }, [initialData]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    // Virtualization Logic
    const startIndex = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const endIndex = Math.min(totalLines, startIndex + visibleCount + 5); // buffer

    const visibleLines = [];
    for (let i = startIndex; i < endIndex; i++) {
        if (lines[i] !== undefined) {
            visibleLines.push(
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: i * rowHeight,
                        height: rowHeight,
                        width: '100%',
                        whiteSpace: 'pre',
                        fontFamily: 'monospace'
                    }}
                >
                    {lines[i]}
                </div>
            );
        }
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            style={{ height: '100vh', width: '100%', overflowY: 'auto', position: 'relative' }}
        >
            <div style={{ height: totalLines * rowHeight, position: 'relative' }}>
                {visibleLines}
            </div>
        </div>
    );
};
