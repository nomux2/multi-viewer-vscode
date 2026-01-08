import React, { useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxViewerProps {
    data: ArrayBuffer;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (data && containerRef.current) {
            renderAsync(data, containerRef.current, undefined, {
                className: 'docx', // class name for wrapper
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false
            }).catch(err => {
                console.error('Failed to render DOCX:', err);
                if (containerRef.current) {
                    containerRef.current.innerText = 'Error rendering DOCX: ' + err.message;
                }
            });
        }
    }, [data]);

    return (
        <div
            ref={containerRef}
            style={{ padding: 20, backgroundColor: 'white', height: '100vh', overflow: 'auto', boxSizing: 'border-box', color: 'black' }}
        />
    );
};
