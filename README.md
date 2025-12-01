# awsm-http

**awsm-http** is a modern, lightweight, and powerful HTTP client built with Tauri and React. It provides a seamless experience for testing and debugging APIs with a beautiful and intuitive user interface.

![awsm-http](https://i.ibb.co/gLrx9pBF/945shots-so.png)

## ✨ Features

- **🚀 Fast & Lightweight**: Built on [Tauri](https://tauri.app/), ensuring high performance and low resource usage.
- **🎨 Modern UI**: Crafted with [Shadcn UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/) for a sleek, dark-themed aesthetic.
- **📝 Advanced Request Editor**:
  - Support for all standard HTTP methods (GET, POST, PUT, DELETE, PATCH).
  - **Params**: Easy-to-use key-value editor for query parameters.
  - **Auth**: Built-in support for Basic Auth, Bearer Token, and API Key.
  - **Body**: Support for JSON, Form Data, x-www-form-urlencoded, and Raw text/XML/HTML.
  - **Monaco Editor**: Integrated [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code's editor) for a powerful coding experience when editing JSON bodies.
- **📄 Response Viewer**:
  - Syntax-highlighted JSON viewer.
  - Raw response view.
  - Detailed headers inspection.
  - Status code, time, and size metrics.
- **📂 Workspace Management**:
  - Organize requests into Workspaces and Collections (Folders).
  - Drag-and-drop organization (planned).
  - **Local Persistence**: Your workspace is automatically saved to local storage.
- **⚡ Keyboard First**: Designed for developer productivity.

## 🛠️ Tech Stack

- **Core**: [Tauri v2](https://tauri.app/) (Rust + Webview)
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- [Bun](https://bun.sh/) (optional, but recommended) or npm/pnpm/yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/awsm-http.git
   cd awsm-http
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Run in Development Mode**

   ```bash
   npm run tauri dev
   # or
   bun tauri dev
   ```

4. **Build for Production**
   ```bash
   npm run tauri build
   # or
   bun tauri build
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
