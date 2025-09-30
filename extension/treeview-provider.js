const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;

class SpecTreeItem extends vscode.TreeItem {
    constructor(label, type, filePath, collapsibleState, children) {
        super(label, collapsibleState);

        this.type = type;
        this.filePath = filePath;
        this.children = children;

        if (type === 'file') {
            this.command = {
                command: 'spec-viewer.openFile',
                title: 'Open File',
                arguments: [filePath]
            };
            this.contextValue = 'file';
            this.iconPath = this.getFileIcon(label);
        } else {
            this.contextValue = 'directory';
            this.iconPath = new vscode.ThemeIcon('folder');
        }

        this.tooltip = filePath;
    }

    getFileIcon(fileName) {
        const ext = path.extname(fileName).toLowerCase();

        const iconMap = {
            '.md': new vscode.ThemeIcon('markdown'),
            '.json': new vscode.ThemeIcon('json'),
            '.js': new vscode.ThemeIcon('javascript'),
            '.ts': new vscode.ThemeIcon('code'),
            '.css': new vscode.ThemeIcon('css'),
            '.html': new vscode.ThemeIcon('html'),
            '.py': new vscode.ThemeIcon('python'),
            '.txt': new vscode.ThemeIcon('file-text'),
            '.pdf': new vscode.ThemeIcon('file-pdf'),
            '.png': new vscode.ThemeIcon('file-media'),
            '.jpg': new vscode.ThemeIcon('file-media'),
            '.jpeg': new vscode.ThemeIcon('file-media'),
            '.gif': new vscode.ThemeIcon('file-media'),
            '.svg': new vscode.ThemeIcon('file-media')
        };

        return iconMap[ext] || new vscode.ThemeIcon('file');
    }
}

class SpecTreeDataProvider {
    constructor(workspaceFolder, includeFile = '.specinclude') {
        this.workspaceFolder = workspaceFolder;
        this.includeFile = includeFile;
        this.includePatterns = [];
        this.useWhitelist = false;

        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    async initialize() {
        await this.loadIncludeFile();
    }

    async loadIncludeFile() {
        try {
            const includePath = path.join(this.workspaceFolder, this.includeFile);
            const includeContent = await fs.readFile(includePath, 'utf8');

            const lines = includeContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));

            if (lines.length > 0) {
                this.includePatterns = lines;
                this.useWhitelist = true;
                console.log(`Loaded include patterns from ${this.includeFile}:`, lines);
            } else {
                console.log(`Empty include file ${this.includeFile}, serving all files`);
                this.useWhitelist = false;
            }
        } catch (error) {
            console.log(`No include file found at ${this.includeFile}, serving all files`);
            this.useWhitelist = false;
            this.includePatterns = [];
        }
    }

    isFileIncluded(filePath) {
        if (!this.useWhitelist) {
            return true;
        }

        // Normalize path separators
        const normalizedPath = filePath.replace(/\\/g, '/');

        for (const pattern of this.includePatterns) {
            if (this.matchPattern(normalizedPath, pattern)) {
                return true;
            }
        }
        return false;
    }

    matchPattern(filePath, pattern) {
        if (pattern.endsWith('/')) {
            return filePath.startsWith(pattern) || filePath.startsWith(pattern.slice(0, -1));
        } else if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(filePath);
        } else {
            return filePath === pattern ||
                   filePath.startsWith(pattern + '/') ||
                   filePath.startsWith(pattern + '\\');
        }
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!this.workspaceFolder) {
            return [];
        }

        if (!element) {
            // Root level
            return this.getDirectoryChildren(this.workspaceFolder, '');
        } else if (element.type === 'directory') {
            // Directory children
            const fullPath = path.join(this.workspaceFolder, element.filePath);
            return this.getDirectoryChildren(fullPath, element.filePath);
        }

        return [];
    }

    async getDirectoryChildren(dirPath, relativePath) {
        const items = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(relativePath, entry.name);
                const normalizedPath = entryPath.replace(/\\/g, '/');

                if (!this.isFileIncluded(normalizedPath)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    items.push(new SpecTreeItem(
                        entry.name,
                        'directory',
                        entryPath,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        []
                    ));
                } else {
                    items.push(new SpecTreeItem(
                        entry.name,
                        'file',
                        entryPath,
                        vscode.TreeItemCollapsibleState.None,
                        null
                    ));
                }
            }
        } catch (error) {
            console.error(`Error reading directory ${dirPath}:`, error);
        }

        // Sort: directories first, then files, alphabetically
        return items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.label.localeCompare(b.label);
        });
    }
}

module.exports = { SpecTreeDataProvider };