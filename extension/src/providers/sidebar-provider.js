const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { FileUtils } = require('../utils/file-utils');
const { WebviewUtils } = require('../utils/webview-utils');
const { ResourceUri } = require('../utils/resource-uri');

class SidebarProvider {
    constructor(context, workspaceFolder) {
        this.context = context;
        this.workspaceFolder = workspaceFolder;
        this.view = null;
        this.fileUtils = new FileUtils(workspaceFolder);
        this.webviewUtils = new WebviewUtils(context);
    }

    async initialize() {
        await this.fileUtils.initialize();
    }

    async getDirectoryTree(dirPath, relativePath = '') {
        const items = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(relativePath, entry.name);
                const normalizedPath = entryPath.replace(/\\/g, '/');

                if (!this.fileUtils.isFileIncluded(normalizedPath)) {
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

        return items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    async resolveWebviewView(webviewView) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'extension'))
            ]
        };

        webviewView.webview.html = await this.getHtmlContent(webviewView.webview);

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
            }
        });
    }


    async getHtmlContent(webview) {
        const template = await this.webviewUtils.loadTemplate('extension/webview/sidebar/sidebar.html');
        const uris = ResourceUri.getSidebarUris(this.context, webview);

        return WebviewUtils.renderTemplate(template, {
            fontAwesomeUri: uris.fontAwesome,
            sharedVariablesUri: uris.sharedVariables,
            styleUri: uris.style,
            fileIconsUri: uris.fileIcons,
            scriptUri: uris.script
        });
    }
}

module.exports = { SidebarProvider };