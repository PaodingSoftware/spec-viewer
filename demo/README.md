# Demo Documentation

Welcome to the **Spec Viewer** demo! This project showcases a beautiful interface for viewing documentation with browser translation support.

## Features

- 🎨 **Modern UI** with Bulma CSS framework
- 🎯 **FontAwesome icons** for better visual experience
- 📱 **Responsive design** that works on all devices
- 🌍 **Translation ready** for international users

## Getting Started

Navigate through the files in the sidebar to explore different types of content:

- **API Documentation** - View REST API specifications
- **Database Schema** - Understand data structures
- **Configuration** - See project settings

## Code Examples

Here's a simple JavaScript example:

```javascript
class SpecViewer {
    constructor(options) {
        this.directory = options.directory;
        this.port = options.port || 3000;
    }

    async start() {
        console.log('Starting Spec Viewer...');
    }
}
```

## Tables

| Feature | Status | Notes |
|---------|---------|-------|
| File Tree | ✅ Complete | Expandable directory structure |
| Multi-tabs | ✅ Complete | Open multiple files simultaneously |
| Hot Reload | ✅ Complete | Real-time file watching |
| Translation | ✅ Complete | Browser plugin support |

> **Note**: This is a demo to showcase the beautiful interface powered by Bulma and FontAwesome!