# Multi-Viewer VS Code 拡張機能 概要設計書

## 1. 目的
VS Code上で標準ではプレビューできない、または閲覧しにくいバイナリ形式・データ形式のファイルを、エディタ内でシームレスに閲覧可能にする拡張機能を提供します。

## 2. アーキテクチャ
VS Codeの **Custom Editor API (Webview-based)** を使用します。

### 構成要素
1.  **Extension Host**: ファイル読み込み、Webview管理、メッセージパッシング。**巨大ファイルの部分読み込み（Chunk Reading）を担当します。**
2.  **Webview**: サンドボックス化されたUI描画環境。

## 3. 機能要件

### 3.1 ターゲットフォーマット
以下の拡張子に対して Custom Editor を提供します。

| カテゴリ | 拡張子 | 機能要件 |
| :--- | :--- | :--- |
| **Document** | `.pdf`, `.docx` | ページめくり、拡大縮小、レイアウト保持 |
| **Presentation** | `.pptx` | スライド一覧表示、スライドプレビュー |
| **Spreadsheet** | `.xlsx`, `.csv`, `.tsv` | グリッド表示、ソート、フィルタ。<br>**CSV/TSVは巨大ファイル対応 (仮想スクロール)** が必須。 |
| **Database** | `.sqlite`, `.db` | テーブル一覧、データ参照 (SELECTクエリ実行) |
| **Binary** | `.bin` 等 (その他全般) | Hex Dump表示 (16進数 + ASCII) |
| **Log (NEW)** | `.log` | **巨大テキスト可視化**, ANSIカラー対応, 検索/フィルタ, Live Tailing |

## 4. ライブラリ選定と実装方針

### 4.1 Document & Presentation
- **PDF**: `pdfjs-dist` (Canvas描画)
- **DOCX**: `docx-preview` (HTML変換)
- **PPTX**: `pptxjs` または `jszip` で解析してSVG/Canvas描画。

### 4.2 Spreadsheet & Data
- **XLSX**: `xlsx` (SheetJS) でパース。UI描画には `SlickGrid` または `ag-Grid` を採用。
- **CSV/TSV/Log**: Extension Host側でストリーム読み込みを行い、必要な行だけWebviewに送る「オンデマンド読み込み」を採用。
- **SQLite**: `sql.js` (WASM) を使用。

### 4.3 Binary
- **Hex Viewer**: ファイル全体をメモリに展開せず、必要な部分だけを表示する仮想スクロール。

### 4.4 Log Viewer (Specifics)
- **Virtual Scrolling**: 数GBクラスのログでも快適にスクロールできるよう、行ベースの仮想化を行う。
- **Chunk-based Search**: Webview内だけでなく、バックエンド（Extension Host）側でのストリーム検索を実装し、巨大ファイル内の検索を可能にする。
- **ANSI Support**: `ansicolor` 等を用いてエスケープシーケンスを色付きHTMLに変換。
- **Auto-Reload / Tail**: ファイル更新を検知し、自動的に末尾を表示する機能。

## 6. パフォーマンス最適化戦略（重要）
巨大ファイル読み込み時の負荷を極限まで低減するため、以下の施策を徹底します。

1.  **チャンク読み込み (Chunk Loading)**
    *   Node.jsの `fs.read` を用い、必要なバイト範囲のみをExtension Host側で読み取ります。
2.  **UIの仮想化 (Virtualization)**
    *   **Virtual Scrolling**: 画面に見えている範囲のDOMのみを描画します。
3.  **メインスレッドの保護 (Off-main-thread)**
    *   重いパース処理は Web Worker または Extension Host プロセスで実行します。

## 7. プロジェクト構成案
```
src/
  ├── extension.ts
  ├── providers/
  │   ├── LogViewerProvider.ts # Log専用
  ├── webview/
  │   ├── app/
  │   └── renderers/
  └── utils/
      ├── DataChunker.ts
      ├── StreamParser.ts
```
