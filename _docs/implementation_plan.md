# Multi-Viewer 実装計画書

## 概要
`_docs/overview.md` に基づき、Multi-Viewer VS Code 拡張機能の実装を以下のフェーズに分けて進めます。

## Phase 1: プロジェクト基盤とコアロジックの確立
拡張機能の骨子を作成し、巨大ファイルを扱うための共通ユーティリティを実装します。

### 実装項目
1.  **プロジェクト初期化**: Yeoman (yo code) を使用した拡張機能の雛形作成。
2.  **Webview アーキテクチャ構築**: React 等を用いたフロントエンド基盤のセットアップ。
3.  **部分読み込みユーティリティ (`DataChunker.ts`)**:
    *   Node.js `fs.open`, `fs.read` を使用し、指定したバイト範囲のみを読み込む機能を実装。
4.  **ストリーム解析 (`StreamParser.ts`)**:
    *   行単位での分割、バイナリデータの扱いなどの基礎ロジック。

## Phase 2: Log Viewer (ログビューアー) の実装
技術的難易度が高い「仮想スクロール」と「チャンク読み込み」を先行して実装・検証します。

### 実装項目
1.  **Custom Editor Provider (`LogViewerProvider`)**: `.log` ファイルとの紐付け。
2.  **Webview UI (Virtual Scrolling)**:
    *   数万〜数百万行のログを表示するための仮想スクロールコンポーネントの実装。
3.  **バックエンド連携**:
    *   Extension Host 側でのファイル監視 (`fs.watch`) と差分読み込み (Tail)。
    *   検索機能: ファイル全体をメモリに乗せず、ストリームで検索してヒット行を返すロジック。
4.  **ANSI カラー対応**: エスケープシーケンスの HTML 変換。

## Phase 3: Spreadsheet (CSV/XLSX) の実装
表計算データのグリッド表示を実装します。

### 実装項目
1.  **ライブラリ統合**: `xlsx` (SheetJS) の導入。
2.  **Grid UI**: 高速なグリッド描画ライブラリ (SlickGrid / ag-Grid 等) の選定と実装。
3.  **CSV 巨大ファイル対応**: Phase 1 の `DataChunker` を応用し、CSV を少しずつ読み込んで Grid に流し込む仕組み。

## Phase 4: Document Viewers (PDF/DOCX/PPTX)
ドキュメント系ファイルのプレビュー機能を実装します。

### 実装項目
1.  **PDF**: `pdfjs-dist` を用いた Canvas 描画プロバイダーの実装。
2.  **DOCX**: `docx-preview` を用いた HTML 変換表示。
3.  **PPTX**: スライド一覧表示とプレビューの実装。

## Phase 5: Binary & Database
バイナリおよびローカルデータベースの閲覧機能を実装します。

### 実装項目
1.  **Hex Viewer**: バイナリファイルを 16進数 + ASCII で表示。仮想スクロール必須。
2.  **SQLite Viewer**: `sql.js` (WASM) をロードし、`.sqlite` / `.db` ファイルのテーブル構造表示と SQL クエリ実行 UI を作成。

## Phase 6: 最適化と仕上げ
全体的なパフォーマンスチューニングとリリース準備を行います。

### 実装項目
1.  **パフォーマンス検証**: GB単位のファイルでのメモリ使用量チェック。
2.  **エラーハンドリング**: 読み込み失敗時や破損ファイルへの対応。
3.  **パッケージング**: 不要ファイルの除外、Webview ビルドの最適化。
