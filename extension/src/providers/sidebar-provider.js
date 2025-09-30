const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { FileFilter } = require('../utils/file-filter');
const { WebviewBase } = require('../utils/webview-base');
const { WebviewUtils } = require('../utils/webview-utils');
const { ResourceUri } = require('../utils/resource-uri');

/**
 * Sidebar webview provider for file tree navigation
 */
class SidebarProvider extends WebviewBase {
    constructor(context, workspaceFolder) {
        super(context);
        this.workspaceFolder = workspaceFolder;
        this.view = null;
        this.fileFilter = new FileFilter(workspaceFolder);
    }

    /**
     * Initialize the provider
     */
    async initialize() {
        await this.fileFilter.initialize();
    }

    /**
     * Build directory tree recursively
     * @param {string} dirPath - Full directory path
     * @param {string} relativePath - Relative path from workspace
     * @returns {Promise<Array>} Tree items
     */
    async getDirectoryTree(dirPath, relativePath = '') {
        const items = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(relativePath, entry.name);
                const normalizedPath = entryPath.replace(/\\/g, '/');

                if (!this.fileFilter.isFileIncluded(normalizedPath)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    const children = await this.getDirectoryTree(
                        path.join(dirPath, entry.name),
                        entryPath
                    );
                    items.push({
                        name: entry.name,
                        path: normalizedPath,
                        type: 'directory',
                        children: children
                    });
                } else {
                    items.push({
                        name: entry.name,
                        path: normalizedPath,
                        type: 'file'
                    });
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
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Resolve the webview view
     * @param {vscode.WebviewView} webviewView
     */
    async resolveWebviewView(webviewView) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'extension'))
            ]
        };

        webviewView.webview.html = await this.getHtmlContent(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'getTree':
                    const tree = await this.getDirectoryTree(this.workspaceFolder);
                    webviewView.webview.postMessage({
                        command: 'treeData',
                        tree: tree
                    });
                    break;
                case 'openFile':
                    vscode.commands.executeCommand('spec-viewer.openFile', message.path);
                    break;
                case 'refresh':
                    await this.fileFilter.initialize();
                    const newTree = await this.getDirectoryTree(this.workspaceFolder);
                    webviewView.webview.postMessage({
                        command: 'treeData',
                        tree: newTree
                    });
                    break;
            }
        });
    }


    /**
     * Generate HTML content for sidebar webview
     * @param {vscode.Webview} webview
     * @returns {Promise<string>} HTML content
     */
    async getHtmlContent(webview) {
        const template = await super.loadTemplate('extension/webview/sidebar/sidebar.html');
        const uris = ResourceUri.getSidebarUris(this.context, webview);

        return WebviewUtils.renderTemplate(template, {
            fontAwesomeUri: uris.fontAwesome,
            styleUri: uris.style,
            fileIconsUri: uris.fileIcons,
            scriptUri: uris.script
        });
    }
}

module.exports = { SidebarProvider };