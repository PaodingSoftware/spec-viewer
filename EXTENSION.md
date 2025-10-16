# Spec Viewer - VS Code Extension

The Spec Viewer VS Code extension allows you to view and manage specification documents directly within VS Code and Cursor IDE.

## Compatibility

This extension is compatible with:
- **VS Code** - Modern versions with Webview API support
- **Cursor IDE** - Fully compatible with Cursor's VS Code fork

The extension uses standard VS Code Extension APIs and works seamlessly in both environments.

## Features

- 📁 **File Tree Navigation** - Browse workspace files in the sidebar
- 📊 **Dashboard View** - View an organized dashboard of all specification documents
- 📝 **Markdown Rendering** - Render Markdown documents with syntax highlighting
- 🔄 **Live Refresh** - Automatically detect workspace file changes
- 🎨 **File Icons** - Automatically recognize file types and display appropriate icons
- 📥 **Senatus Framework** - One-click installation of the Senatus specification framework

## Installation

### For VS Code

#### Method 1: Using npm Script (Recommended)

```bash
# Clone the repository
git clone https://github.com/PaodingSoftware/spec-viewer.git
cd spec-viewer

# Install dependencies
npm install

# Package and install the extension
npm run install-extension
```

#### Method 2: Manual Installation

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/PaodingSoftware/spec-viewer.git
cd spec-viewer
npm install
```

2. Package the extension:
```bash
npm run package
```

3. Install in VS Code:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette
   - Type "Install from VSIX" and select `Extensions: Install from VSIX...`
   - Select the generated `spec-viewer-1.0.0.vsix` file

### For Cursor IDE

#### Method 1: Using npm Script (Recommended)

```bash
# Clone the repository
git clone https://github.com/PaodingSoftware/spec-viewer.git
cd spec-viewer

# Install dependencies
npm install

# Package and install the extension to Cursor
npm run install-extension-cursor
```

#### Method 2: Manual Installation

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/PaodingSoftware/spec-viewer.git
cd spec-viewer
npm install
```

2. Package the extension:
```bash
npm run package
```

3. Install in Cursor:
   - Open Cursor IDE
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette
   - Type "Install from VSIX" and select `Extensions: Install from VSIX...`
   - Select the generated `spec-viewer-1.0.0.vsix` file

**Note**: Cursor IDE is fully compatible with VS Code extensions, so all features work identically in both environments.

## Usage Guide

### Opening Spec Viewer

1. Click the **Spec Viewer** icon in the VS Code Activity Bar (left sidebar, book icon)
2. The Spec Viewer sidebar will open, displaying the workspace file tree

### Main Features

#### 📊 Dashboard View

Open the interactive dashboard to view all specification documents:

1. Click the **Dashboard icon** in the sidebar title bar
2. The dashboard will open in the editor
3. Features include:
   - View an organized display of all specification documents
   - Browse different specification sections
   - View document statistics and progress
   - Quick navigation to specific documents

#### 📁 File Explorer

Browse and open files in the sidebar:

- **Browse Files**: Expand/collapse directories to view file structure
- **Open Files**: Click any file to open it in the viewer
- **Markdown Rendering**: Automatically render Markdown files with syntax highlighting
- **File Icons**: Automatically display appropriate icons based on file type

#### 🔄 Refresh File Tree

Reload workspace files:

- Click the **Refresh icon** in the sidebar title bar
- Automatically detect file changes in the workspace
- Update the file tree display

#### 🗂️ Collapse All

Quickly organize your view:

- Click the **Collapse All icon** in the sidebar title bar
- All directories will be collapsed
- Convenient for quick navigation and file finding

#### 📥 Install Senatus Framework

Automatically install the Senatus specification framework:

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Spec Viewer: Install Senatus Framework"
3. Select the command
4. The framework will be automatically installed to your workspace

**What Gets Installed:**
- `.claude/commands/` - Claude AI custom commands
- `.github/prompts/` - GitHub Copilot prompt files
- `.cursor/commands/` - Cursor IDE custom commands (auto-generated from GitHub Copilot prompts)
- `.specify/` - Senatus specification templates

This ensures compatibility with multiple AI coding assistants (Claude AI, GitHub Copilot, and Cursor) while maintaining a single source of truth for command definitions.

### Available Commands

The following commands are available in the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

| Command                                  | Description                         |
| ---------------------------------------- | ----------------------------------- |
| `Spec Viewer: Open Dashboard`            | Open interactive dashboard view     |
| `Spec Viewer: Refresh`                   | Refresh the file tree               |
| `Spec Viewer: Collapse All`              | Collapse all directories            |
| `Spec Viewer: Install Senatus Framework` | Install Senatus specification setup |

### File Filtering Configuration

The extension supports a `.specinclude` configuration file to filter displayed files. Only files and directories listed in `.specinclude` will be shown in the sidebar.

#### Creating a .specinclude File

Create a `.specinclude` file in the workspace root directory:

```
# Specification directories
specify/
spec/
docs/

# Configuration directories
.claude/
.specify/
.github/

# Documentation files
README.md
AGENTS.md
CLAUDE.md

# Wildcard support
*.md
docs/**/*.md
```

#### Configuration Details

- **Directories**: End with `/` to indicate a directory, which will include all files under that directory
- **Files**: Write the filename or path directly
- **Comments**: Lines starting with `#` are comments
- **Wildcards**: Supports glob pattern matching

If no `.specinclude` file exists in the workspace, the extension will display all files.

## How It Works

1. **File Scanning**: The extension reads the `.specinclude` file to determine which files to display
2. **File Tree Generation**: Generates a file tree structure based on the configuration
3. **Sidebar Display**: Displays an interactive file tree in a WebView
4. **File Viewing**: When a file is clicked, renders the file content in a new WebView
5. **Dashboard**: Displays a structured view aggregating all specification documents

## Supported File Types

The extension supports viewing the following file types:

- **Markdown** (`.md`) - Rendered view with syntax highlighting
- **Plain Text** (`.txt`)
- **JSON** (`.json`)
- **YAML** (`.yaml`, `.yml`)
- **JavaScript** (`.js`)
- **TypeScript** (`.ts`)
- **HTML** (`.html`)
- **CSS** (`.css`)
- Other text files

Code files will automatically have syntax highlighting applied.

## Keyboard Shortcuts

| Shortcut           | Function               |
| ------------------ | ---------------------- |
| `Ctrl+Shift+P`     | Open Command Palette   |
| Click sidebar icon | Open/close Spec Viewer |

You can also customize shortcuts for Spec Viewer commands in VS Code's keyboard shortcut settings.

## Troubleshooting

### Extension Not Showing in Activity Bar

1. Ensure the extension is properly installed
2. Reload the VS Code window (`Ctrl+R` or "Reload Window" in Command Palette)
3. Check if the extension is enabled (in the Extensions view)

### Files Not Showing in Sidebar

1. Check if the `.specinclude` file exists
2. Confirm file paths are correctly configured in `.specinclude`
3. Click the refresh button to reload the file tree

### Markdown Rendering Issues

1. Ensure file encoding is UTF-8
2. Check if the Markdown syntax is correct
3. Try refreshing the file tree

### Dashboard Won't Open

1. Ensure specification documents exist in the workspace
2. Check the `.specinclude` configuration
3. View error messages in VS Code Developer Tools (`Help` > `Toggle Developer Tools`)

## Development & Debugging

If you want to modify or debug the extension:

1. Open the project folder in VS Code
2. Press `F5` to launch the Extension Development Host
3. Test the extension in the new window
4. After modifying code, press `Ctrl+R` in the Extension Development Host window to reload

## Related Projects

- **CLI Tool**: See the main README.md for command-line tool usage
- **Senatus Framework**: Specification document organization framework

## License

MIT

## Contributing

Issues and Pull Requests are welcome!

## Changelog

### v1.0.0
- Initial release
- File tree navigation
- Dashboard view
- Markdown rendering
- Senatus framework installation
