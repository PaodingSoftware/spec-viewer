# Spec Viewer

A Node.js CLI tool for viewing spec-kit generated documentation in a local web browser.

## Features

- 📁 Interactive directory tree navigation
- 📑 Multi-tab file viewer
- 🔄 Hot reload with live updates
- 📝 Markdown rendering with syntax highlighting
- ✅ Whitelist-based file serving
- 🌙 Dark/light theme toggle

## Installation

```bash
# Install from source
git clone <repository>
cd spec-viewer
npm install
npm run install-cli
```

## Usage

```bash
# Serve current directory
spec-viewer .

# Serve specific directory
spec-viewer /path/to/docs

# Custom port
spec-viewer . --port 8080
```

### Options

| Option           | Description  | Default        |
| ---------------- | ------------ | -------------- |
| `--port` `-p`    | Server port  | `3000`         |
| `--host`         | Server host  | `localhost`    |
| `--include` `-i` | Include file | `.specinclude` |

## Configuration

Create a `.specinclude` file to specify which files to serve:

```
# Configuration directories
.claude/
.github/
.specify/

# Documentation directories
spec/
docs/
specify/

# Specific files
README.md
AGENTS.md
CLAUDE.md
```

## Demo

```bash
npm run demo
```

Open http://localhost:3003 to view the demo.

## License

MIT