# awsm-http

**awsm-http** is a modern, lightweight, and powerful HTTP client built with Tauri and React. It provides a seamless experience for testing and debugging APIs with a beautiful and intuitive user interface.

![awsm-http](https://i.ibb.co/GQhCx7yj/993shots-so.png)

## ✨ Features

- **🚀 Fast & Lightweight**: Built on [Tauri](https://tauri.app/), ensuring high performance and low resource usage.
- **🎨 Modern UI**: Crafted with [Shadcn UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/) for a sleek, dark-themed aesthetic.
- **🔌 Real-time Protocols**:
  - **WebSocket**: Full support for raw WebSocket connections with persistent message history.
  - **Socket.IO**: Native support for Socket.IO v4, including custom Event/Group emitting and listening.
- **📝 Advanced Request Editor**:
  - Support for all standard HTTP methods (GET, POST, PUT, DELETE, PATCH).
  - **Params**: Easy-to-use key-value editor for query parameters.
  - **Auth**: Built-in support for Basic Auth, Bearer Token, API Key, and **OAuth 2.0** (Client Credentials).
  - **Body**: Support for JSON, Form Data, x-www-form-urlencoded, and Raw text/XML/HTML.
  - **QS Builder**: Visual query string builder with support for nested objects and arrays (using `qs` syntax).
  - **Monaco Editor**: Integrated [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code's editor) for a powerful coding experience when editing JSON bodies.
- **📄 Response Viewer**:
  - Syntax-highlighted JSON viewer.
  - Raw response view.
  - Detailed headers inspection.
  - Status code, time, and size metrics.
- **📂 Workspace Management**:
  - Organize requests into Workspaces and Folders.
  - **Drag & Drop**: Intuitive reordering of requests, folders, and environment variables.
  - **Environments**: Manage variables (e.g., `{{base_url}}`) across different environments.
  - **Import/Export**: Share your workspace via JSON files or import from Postman.
  - **Reset**: "Danger Zone" to wipe data and restore defaults.
  - **Local Persistence**: Your workspace is automatically saved to local storage.
- **⚡ Keyboard First**: Designed for developer productivity.
  - **Command Palette**: `Ctrl+K` to access quick actions and Faker.
  - **Tabs**: Middle-click to close tabs.
- **🛠️ Mock Server**:
  - **Visual Schema Editor**: Design your database schema with a node-based graph editor.
  - **Data Generation**: Generate realistic fake data using Faker.js.
  - **REST API**: Auto-generated REST endpoints for your tables with pagination and filtering.
  - **Data Editor**: Manage your mock data with a built-in spreadsheet-like editor.
  - **Relationships**: Define Foreign Keys and relationships between tables visually.

## 🔮 Advanced Capabilities

### 🧪 Automated Testing

Write tests in JavaScript to validate your API responses automatically.

- **Test Runner**: Tests run immediately after a request.
- **Visual Results**: See pass/fail status in the dedicated "Tests" sidebar.
- **Dynamic Descriptions**: Log custom messages for your tests.

```javascript
awsm.test("Status is 200", (log) => {
  if (awsm.response.status !== 200) throw new Error("Failed");
  log("Server responded with " + awsm.response.status);
});
```

### 🎲 Dynamic Data (Faker.js)

Generate realistic test data on the fly using the built-in Faker.js integration.

- **Quick Insert**: Press `Ctrl+K` (or `Cmd+K`) in any editor to open the Faker dialog.
- **Syntax**: Use `{{faker.module.method()}}` in your JSON bodies.
- **Arguments**: Pass arguments like `{{faker.date.future({ years: 1 })}}`.

### 📜 Scripting Engine

Powerful pre-request and test scripts with the `awsm` global object.

- **Variables**: `awsm.variables.set("token", "...")`
- **Logging**: `awsm.log("Message")`
- **Access**: Full access to request and response objects.

### 📚 Built-in Documentation

Access the full documentation directly within the app by clicking the book icon in the navigation bar.

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
