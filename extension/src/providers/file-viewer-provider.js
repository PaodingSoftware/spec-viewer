const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { marked } = require('marked');
const { WebviewBase } = require('../utils/webview-base');
const { WebviewUtils } = require('../utils/webview-utils');
const { ResourceUri } = require('../utils/resource-uri');

/**
 * File viewer provider for displaying markdown and other files
 */
class FileViewerProvider extends WebviewBase {
    constructor(context, workspaceFolder) {
        super(context);
        this.workspaceFolder = workspaceFolder;
        this.panels = new Map(); // filePath -> panel
        this.panelStates = new Map(); // filePath -> { viewMode }

        // Listen for theme changes
        vscode.window.onDidChangeActiveColorTheme(() => {
            this.onThemeChanged();
        }, null, context.subscriptions);
    }


    /**
     * Open a file in a webview panel
     * @param {string} filePath - Relative file path
     */
    async openFile(filePath) {
        // Check if panel already exists
        if (this.panels.has(filePath)) {
            const panel = this.panels.get(filePath);
            panel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create new panel
        const fileName = path.basename(filePath);
        const panel = vscode.window.createWebviewPanel(
            'specViewerFile',
            fileName,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(this.workspaceFolder),
                    vscode.Uri.file(path.join(this.context.extensionPath, 'extension'))
                ]
            }
        );

        // Store panel reference and initial state
        this.panels.set(filePath, panel);
        this.panelStates.set(filePath, { viewMode: 'preview' });

        // Load and render content
        await this.updatePanelContent(panel, filePath);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'viewModeChanged') {
                    this.panelStates.set(filePath, { viewMode: message.viewMode });
                }
            },
            null,
            this.context.subscriptions
        );

        // Watch for file changes
        const fullPath = path.join(this.workspaceFolder, filePath);
        const watcher = vscode.workspace.createFileSystemWatcher(fullPath);
        watcher.onDidChange(async () => {
            if (this.panels.has(filePath)) {
                await this.updatePanelContent(panel, filePath);
            }
        });

        // Handle panel disposal
        panel.onDidDispose(() => {
            this.panels.delete(filePath);
            this.panelStates.delete(filePath);
            watcher.dispose();
        }, null, this.context.subscriptions);
    }

    /**
     * Update panel content
     * @param {vscode.WebviewPanel} panel
     * @param {string} filePath
     * @param {string} viewMode
     */
    async updatePanelContent(panel, filePath, viewMode = 'preview') {
        try {
            const fullPath = path.join(this.workspaceFolder, filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();

            let html;
            if (ext === '.md') {
                const markdownHtml = marked(content);
                html = await this.getMarkdownWebviewContent(panel, content, markdownHtml, viewMode);
            } else {
                html = await this.getTextWebviewContent(content, path.basename(filePath));
            }

            panel.webview.html = html;
        } catch (error) {
            panel.webview.html = await this.getErrorWebviewContent(`Failed to load file: ${error.message}`);
        }
    }


    /**
     * Generate markdown webview content
     */
    async getMarkdownWebviewContent(panel, rawContent, htmlContent, viewMode = 'preview') {
        const highlightTheme = this.getHighlightTheme();
        const uris = ResourceUri.getViewerUris(this.context, panel.webview, highlightTheme);
        const htmlTemplate = await super.loadTemplate('extension/webview/viewer/viewer.html');

        return WebviewUtils.renderTemplate(htmlTemplate, {
            fontAwesomeUri: uris.fontAwesome,
            styleUri: uris.style,
            highlightThemeUri: uris.highlightTheme,
            highlightJsUri: uris.highlightJs,
            scriptUri: uris.script,
            viewMode: viewMode,
            rawContentJson: JSON.stringify(rawContent),
            previewDisplay: viewMode === 'preview' ? 'block' : 'none',
            sourceDisplay: viewMode === 'source' ? 'block' : 'none',
            htmlContent: htmlContent,
            rawContent: WebviewUtils.escapeHtml(rawContent)
        });
    }

    /**
     * Generate text file webview content
     */
    async getTextWebviewContent(content, fileName) {
        const template = await super.loadTemplate('extension/webview/viewer/text.html');
        return WebviewUtils.renderTemplate(template, {
            fileName: fileName,
            content: WebviewUtils.escapeHtml(content)
        });
    }

    /**
     * Generate error webview content
     */
    async getErrorWebviewContent(message) {
        const template = await super.loadTemplate('extension/webview/viewer/error.html');
        return WebviewUtils.renderTemplate(template, {
            message: WebviewUtils.escapeHtml(message)
        });
    }

    /**
     * Get highlight.js theme based on VSCode theme
     */
    getHighlightTheme() {
        const themeKind = vscode.window.activeColorTheme.kind;

        // ColorThemeKind: Light = 1, Dark = 2, HighContrast = 3, HighContrastLight = 4
        if (themeKind === vscode.ColorThemeKind.Light || themeKind === vscode.ColorThemeKind.HighContrastLight) {
            return 'github.min.css';
        } else {
            return 'github-dark.min.css';
        }
    }

    /**
     * Handle theme changes by refreshing all open panels
     */
    async onThemeChanged() {
        for (const [filePath, panel] of this.panels.entries()) {
            const state = this.panelStates.get(filePath) || { viewMode: 'preview' };
            await this.updatePanelContent(panel, filePath, state.viewMode);
        }
    }

}

module.exports = { FileViewerProvider };