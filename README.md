# Multi-Viewer for VS Code

**Multi-Viewer** is an all-in-one extension that empowers Visual Studio Code to render and view a wide variety of binary, document, and data file formats that are not natively supported.

Stop switching context to external applications. View spreadsheets, PDFs, Office documents, logs, and databases directly within your editor.

---

## 🚀 Features

### 📊 Spreadsheet Viewer
View Excel and CSV files with a high-performance data grid.
- **Formats**: `.xlsx`, `.xls`, `.csv`, `.tsv`
- **Features**: 
    - Full dark mode supports (matches VS Code theme).
    - Virtualized rendering for performance with large files.
    - Automatic column sizing and "A, B, C..." Excel-style headers.
    - Handles empty rows and irregular data gracefully.

### 📝 Log Viewer
Analyze large log files without freezing your editor.
- **Formats**: `.log`
- **Features**:
    - Virtual scrolling efficiently handles files with thousands of lines. 
    - Clean, readable text layout.

### 📄 PDF Viewer
Read PDF documents without leaving VS Code.
- **Formats**: `.pdf`
- **Features**:
    - Built-in rendering using PDF.js.
    - Pagination and zoom support.

### 📘 Office Viewer
Preview Microsoft Office documents.
- **Formats**: `.docx`, `.pptx`
- **Features**:
    - **DOCX**: Renders document layout, formatting, and images.
    - **PPTX**: Lightweight text preview mode (slides text extraction). *Note: Full layout rendering is currently experimental.*

### 🔢 Hex Viewer
Inspect binary files in a traditional hex editor layout.
- **Formats**: `.bin`, `.dll`, `.exe`, `.dat`, `.so`
- **Features**:
    - Dual view: Hexadecimal and ASCII representation.
    - Offset addressing.
    - Efficient loading for binary analysis.

### 🗄️ SQLite Viewer
Explore local SQLite databases.
- **Formats**: `.sqlite`, `.db`, `.sqlite3`
- **Features**:
    - View tables and data.
    - Execute basic queries (depending on implementation).

---

## 🛠️ Usage

1. **Open a file**: Simply click on any supported file in the VS Code Explorer.
2. **Auto-detection**: The extension automatically associates with the supported file extensions.
3. **Manual Open**: If a file doesn't open automatically or you want to force this viewer:
    - Right-click the file in Explorer.
    - Select **"Open With..."**.
    - Choose **"Multi-Viewer: [Type] Viewer"**.

## ⚙️ Configuration

Multi-Viewer is designed to work out of the box with zero configuration. It inherits your VS Code theme settings (colors, fonts) to ensure a seamless experience.

## ⚠️ Known Issues

- **PPTX Support**: The PowerPoint viewer currently offers a text-based preview. Complex layouts, animations, and some images may not be rendered in this version.
- **Large Excel Files**: Extremely large spreadsheet files may take a moment to parse initially before rendering.

---

**Enjoy a unified viewing experience in VS Code!**
