# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-03

### Added

- **Socket.IO Support**: Full support for Socket.IO connections, including custom Event/Group handling.
- **WebSocket Improvements**: Enhanced WebSocket editor with persistent tabs and better state management.
- **Drag & Drop Organization**:
  - Reorder items in the Sidebar.
  - Move requests into Folders.
  - Reorder Environment Variables with drag handles.
- **UI Enhancements**:
  - **Method Badges**: Color-coded HTTP method badges (GET, POST, etc.) in the sidebar.
  - **Safety Dialogs**: Confirmation alerts when deleting environments.
  - **Context Menus**: Added "New Workspace" option to sidebar context menus.

### Changed

- **Hierarchy Refactor**: Renamed "Collections" to "Folders" for clarity.
- **Strict Nesting Rules**: Enforced structure where Workspaces cannot be nested inside other Workspaces.
- **Environment UX**: Moved the delete button to the edit form and fixed scrollbar issues for better usability.
- **Performance**: Optimized sidebar rendering and state updates.

## [0.0.3-alpha] - 2025-12-03

### Added

- **Faker.js Integration**: Generate dynamic test data using `{{faker.module.method()}}`.
- **Quick Insert Dialog**: Press `Ctrl+K` in JSON/Text editors to open the Faker generator.
- **Test Results Sidebar**: Visual feedback for tests in a dedicated sidebar tab.
- **Scripting API**: New `awsm.test(name, callback)` function for writing structured tests.
- **Documentation**: Built-in documentation dialog accessible from the navbar.
- **UI Improvements**: Added `ScrollArea` to Command Palette for better scrolling.

### Changed

- Updated `README.md` with comprehensive feature documentation.
- Improved test script execution to support dynamic descriptions in logs.
