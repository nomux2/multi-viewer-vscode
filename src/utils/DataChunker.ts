import * as fs from 'fs';
import * as util from 'util';

const open = util.promisify(fs.open);
const read = util.promisify(fs.read);
const close = util.promisify(fs.close);
const stat = util.promisify(fs.stat);

export interface ChunkResult {
    data: Uint8Array;
    bytesRead: number;
    totalSize: number;
}

export class DataChunker {
    /**
     * Reads a chunk of a file using Node.js filesystem API.
     * @param filePath Absolute path to the file
     * @param startByte Position to start reading (0-indexed)
     * @param length Number of bytes to read
     */
    public static async readChunk(filePath: string, startByte: number, length: number): Promise<ChunkResult> {
        let fd: number | null = null;
        try {
            const fileStat = await stat(filePath);
            const totalSize = fileStat.size;

            if (startByte >= totalSize) {
                return { data: new Uint8Array(0), bytesRead: 0, totalSize };
            }

            // Adjust length if it exceeds file size
            const readLength = Math.min(length, totalSize - startByte);

            fd = await open(filePath, 'r');
            const buffer = new Uint8Array(readLength);

            // fs.read(fd, buffer, offset, length, position)
            const result = await read(fd, buffer, 0, readLength, startByte);

            return {
                data: buffer.slice(0, result.bytesRead),
                bytesRead: result.bytesRead,
                totalSize
            };
        } catch (error) {
            console.error(`Error reading chunk from ${filePath}:`, error);
            throw error;
        } finally {
            if (fd !== null) {
                await close(fd);
            }
        }
    }
}
