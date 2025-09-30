# Extension Directory Structure

This directory contains the VSCode extension implementation for Spec Viewer.

## Directory Layout

```
extension/
├── src/                           # Source code
│   ├── extension.js              # Extension entry point
│   ├── providers/                # Provider classes
│   │   ├── sidebar-provider.js   # Sidebar webview provider
│   │   └── file-viewer-provider.js # File viewer webview provider
│   └── utils/                    # Shared utilities
│       ├── file-filter.js        # File filtering (.specinclude support)
│       └── font-awesome.js       # Font Awesome CSS generator
├── webview/                      # Webview UI files
│   ├── sidebar/                  # Sidebar webview
│   │   ├── sidebar.html          # Sidebar HTML template
│   │   ├── sidebar.css           # Sidebar styles
│   │   └── sidebar.js            # Sidebar client-side logic
│   └── viewer/                   # File viewer webview
│       ├── viewer.html           # Viewer template
│       ├── viewer.css            # Viewer styles
│       └── viewer.js             # Viewer client-side logic
└── assets/                       # Static assets
    ├── webfonts/                 # Font Awesome fonts
    │   ├── fa-brands-400.woff2
    │   ├── fa-regular-400.woff2
    │   └── fa-solid-900.woff2
    └── highlight.js/             # Highlight.js for code syntax
        ├── highlight.min.js
        ├── github-dark.min.css
        └── github.min.css
```

## Code Organization

### Providers
- **SidebarProvider**: Manages the sidebar file tree navigation
- **FileViewerProvider**: Manages file viewer panels for markdown and text files

### Utils
- **FileFilter**: Handles `.specinclude` pattern matching and file filtering
- **FontAwesomeGenerator**: Generates Font Awesome CSS with webview URIs

### Webviews
- **Sidebar**: Tree view for navigating files with search and collapse functionality
- **Viewer**: Markdown/text file viewer with preview/source toggle and outline panel

## Key Features

1. **File Filtering**: Uses `.specinclude` patterns to show/hide files
2. **State Persistence**: Remembers expanded directories and selected files
3. **Full Offline Support**: All external resources (Font Awesome, Highlight.js) loaded from local files
4. **Consistent Styling**: Unified dimensions and spacing across all UI elements
5. **No Code Duplication**: Shared utilities for common functionality
6. **Template-Based**: HTML templates for maintainable webview content