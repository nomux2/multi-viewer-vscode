import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { ViewerProps } from './index';

interface Slide {
    id: number;
    text: string[];
}

export const PptxViewer: React.FC<ViewerProps> = ({ vscode, initialData }) => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [pptxData, setPptxData] = useState<ArrayBuffer | null>(null);

    useEffect(() => {
        if (initialData?.type === 'office-data' && initialData.fileType === '.pptx') {
            setPptxData(initialData.data);
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'office-data' && message.fileType === '.pptx') {
                setPptxData(message.data);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [initialData]);

    useEffect(() => {
        if (!pptxData) return;

        const loadPptx = async () => {
            try {
                setLoading(true);
                setError(null);
                const zip = await JSZip.loadAsync(pptxData);

                const slideFiles: { name: string; content: string }[] = [];

                // Find all slide XML files
                zip.forEach((relativePath, file) => {
                    if (relativePath.match(/ppt\/slides\/slide\d+\.xml/)) {
                        slideFiles.push({ name: relativePath, content: '' });
                    }
                });

                // Sort by slide number (e.g., slide1.xml, slide2.xml)
                slideFiles.sort((a, b) => {
                    const numA = parseInt(a.name.match(/slide(\d+)\.xml/)![1]);
                    const numB = parseInt(b.name.match(/slide(\d+)\.xml/)![1]);
                    return numA - numB;
                });

                // Extract text from each slide
                const parsedSlides: Slide[] = [];
                for (let i = 0; i < slideFiles.length; i++) {
                    const file = zip.file(slideFiles[i].name);
                    if (file) {
                        const xmlContent = await file.async('string');
                        // Simple regex to extract text inside <a:t> tags
                        const texts = xmlContent.match(/<a:t.*?>(.*?)<\/a:t>/g)?.map(t => {
                            return t.replace(/<\/?a:t.*?>/g, '');
                        }) || [];

                        parsedSlides.push({
                            id: i + 1,
                            text: texts.filter(t => t.trim().length > 0)
                        });
                    }
                }

                setSlides(parsedSlides);
            } catch (err) {
                console.error('[PptxViewer] Error parsing PPTX:', err);
                setError('Failed to parse PPTX file.');
            } finally {
                setLoading(false);
            }
        };

        loadPptx();
    }, [pptxData]);

    if (!pptxData && !loading) {
        return <div style={{ padding: 20 }}>Waiting for PPTX data...</div>;
    }

    if (loading) {
        return <div style={{ padding: 20 }}>Loading slides...</div>;
    }

    if (error) {
        return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h2>Presentation Preview ({slides.length} Slides)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {slides.map(slide => (
                    <div key={slide.id} style={{
                        border: '1px solid var(--vscode-widget-border)',
                        background: 'var(--vscode-editor-background)',
                        padding: '20px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            fontWeight: 'bold',
                            marginBottom: '10px',
                            color: 'var(--vscode-descriptionForeground)',
                            borderBottom: '1px solid var(--vscode-widget-border)',
                            paddingBottom: '5px'
                        }}>
                            Slide {slide.id}
                        </div>
                        <div style={{ lineHeight: '1.6' }}>
                            {slide.text.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    {slide.text.map((t, idx) => (
                                        <li key={idx}>{t}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span style={{ color: 'var(--vscode-disabledForeground)' }}>(No text content)</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
