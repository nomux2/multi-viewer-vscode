import React, { useEffect, useState } from 'react';
import { DocxViewer } from './DocxViewer';
import { PptxViewer } from './PptxViewer';
import { ViewerProps } from './index';

export const OfficeViewer: React.FC<ViewerProps> = ({ vscode, initialData }) => {
    const [fileType, setFileType] = useState<string | null>(null);
    const [fileData, setFileData] = useState<ArrayBuffer | null>(null);

    useEffect(() => {
        // Initialize from initialData if available
        if (initialData && initialData.type === 'office-data') {
            console.log('[OfficeViewer] Initializing with initialData');
            setFileType(initialData.fileType);
            setFileData(initialData.data);
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            console.log('[OfficeViewer] Received message:', message.type);
            if (message.type === 'office-data') {
                setFileType(message.fileType);
                setFileData(message.data);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [initialData]);

    if (!fileData) {
        return <div>Loading Office Document...</div>;
    }

    if (fileType === '.docx') {
        return <DocxViewer data={fileData} />;
    } else if (fileType === '.pptx') {
        return <PptxViewer vscode={vscode} initialData={{ type: 'office-data', fileType: '.pptx', data: fileData }} />;
    }

    return <div>Unsupported office file type: {fileType}</div>;
};
