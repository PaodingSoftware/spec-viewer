const vscode = require('vscode');
const path = require('path');
const { WebviewBase } = require('../utils/webview-base');
const { WebviewUtils } = require('../utils/webview-utils');
const { ResourceUri } = require('../utils/resource-uri');
const { SenatusParser } = require('../utils/senatus-parser');

/**
 * Dashboard provider for displaying Senatus project overview
 */
class DashboardProvider extends WebviewBase {
    constructor(context, workspaceFolder) {
        super(context);
        this.workspaceFolder = workspaceFolder;
        this.panel = null; // Singleton panel reference
        this.parser = new SenatusParser(workspaceFolder);
        this.watcher = null;
        this.refreshTimeout = null;
        this.isHtmlLoaded = false; // Track if HTML is loaded
    }

    /**
     * Open dashboard (singleton pattern)
     */
    async openDashboard() {
        // If panel already exists, reveal it
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create new panel
        this.panel = vscode.window.createWebviewPanel(
            'senatussDashboard',
            'Senatus Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'extension'))
                ]
            }
        );

        // Set custom icon (using built-in icon)
        this.panel.iconPath = {
            light: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-light.svg')),
            dark: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-dark.svg'))
        };

        // Initialize content
        this.isHtmlLoaded = false;
        await this.updatePanelContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'openFile':
                        await vscode.commands.executeCommand('spec-viewer.openFile', message.path);
                        break;
                    case 'refresh':
                        await this.updatePanelContent();
                        break;
                }
            },
            null,
            this.context.subscriptions
        );

        // Setup file watcher
        this.setupFileWatcher();

        // Handle panel disposal
        this.panel.onDidDispose(
            () => {
                this.cleanupResources();
                this.panel = null;
                this.isHtmlLoaded = false;
            },
            null,
            this.context.subscriptions
        );
    }

    /**
     * Setup file watcher for specify directory
     */
    setupFileWatcher() {
        // Clean up existing watcher
        if (this.watcher) {
            this.watcher.dispose();
        }

        // Create new watcher for specify directory
        const pattern = new vscode.RelativePattern(this.workspaceFolder, 'specify/**/*');
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

        // Debounced refresh (1000ms)
        const debouncedRefresh = () => {
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout);
            }
            this.refreshTimeout = setTimeout(() => {
                if (this.panel) {
                    this.updatePanelContent();
                }
            }, 1000);
        };

        this.watcher.onDidCreate(debouncedRefresh);
        this.watcher.onDidChange(debouncedRefresh);
        this.watcher.onDidDelete(debouncedRefresh);

        this.context.subscriptions.push(this.watcher);
    }

    /**
     * Update panel content with latest data
     */
    async updatePanelContent() {
        if (!this.panel) return;

        try {
            // Parse Senatus data
            const data = await this.parser.parseAll();

            // Send update message to webview instead of replacing HTML
            if (this.isHtmlLoaded) {
                // If HTML already loaded, just send data update
                this.panel.webview.postMessage({
                    command: 'update',
                    data: data
                });
            } else {
                // Initial load - set HTML
                const html = await this.getDashboardHtml(data);
                this.panel.webview.html = html;
                this.isHtmlLoaded = true;
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.panel.webview.html = await this.getErrorHtml(error.message);
        }
    }

    /**
     * Generate dashboard HTML content
     * @param {Object} data - Parsed Senatus data
     * @returns {Promise<string>} HTML content
     */
    async getDashboardHtml(data) {
        const template = await super.loadTemplate('extension/webview/dashboard/dashboard.html');
        const uris = ResourceUri.getDashboardUris(this.context, this.panel.webview);

        // Prepare data for template
        const dataJson = JSON.stringify(data);

        return WebviewUtils.renderTemplate(template, {
            fontAwesomeUri: uris.fontAwesome,
            styleUri: uris.style,
            scriptUri: uris.script,
            dataJson: dataJson
        });
    }

    /**
     * Generate error HTML content
     * @param {string} message - Error message
     * @returns {Promise<string>} HTML content
     */
    async getErrorHtml(message) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                    }
                    .error {
                        color: var(--vscode-errorForeground);
                    }
                </style>
            </head>
            <body>
                <h2 class="error">Error Loading Dashboard</h2>
                <p>${WebviewUtils.escapeHtml(message)}</p>
            </body>
            </html>
        `;
    }

    /**
     * Clean up resources
     */
    cleanupResources() {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = null;
        }
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }
}

module.exports = { DashboardProvider };