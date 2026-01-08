import { TextDecoder } from 'util';

export class StreamParser {

    // 改行コード (LF: 10)
    private static readonly NEW_LINE = 10;

    /**
     * バッファを行に分割します。
     * 最後の行が不完全な場合は remainder として返します。
     */
    public static splitLines(buffer: Uint8Array, decoder: TextDecoder = new TextDecoder('utf-8')): { lines: string[], remainder: Uint8Array } {
        const lines: string[] = [];
        let start = 0;
        let foundNewLine = false;

        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] === StreamParser.NEW_LINE) {
                // subarray はメモリをコピーせずビューを作成するだけなので高速
                const lineBuffer = buffer.subarray(start, i);
                lines.push(decoder.decode(lineBuffer));
                start = i + 1; // 次の行の開始位置 (LFの次)
                foundNewLine = true;
            }
        }

        // 最後の部分 (改行で終わっていない場合、または改行で終わった後の空)
        const remainder = buffer.subarray(start);

        return { lines, remainder };
    }
}
