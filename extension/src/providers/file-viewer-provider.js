const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { marked } = require('marked');
const { instance } = require('@viz-js/viz');
const { WebviewUtils } = require('../utils/webview-utils');
const { ResourceUri } = require('../utils/resource-uri');

class FileViewerProvider {
    constructor(context, workspaceFolder) {
        this.context = context;
        this.workspaceFolder = workspaceFolder;
        this.panels = new Map();
        this.panelStates = new Map();
        this.webviewUtils = new WebviewUtils(context);
        this.vizInstance = null;

        // Initialize viz.js
        this.initViz();

        vscode.window.onDidChangeActiveColorTheme(() => {
            this.onThemeChanged();
        }, null, context.subscriptions);
    }

    async initViz() {
        try {
            this.vizInstance = await instance();
        } catch (error) {
            console.error('Failed to initialize viz.js:', error);
        }
    }


    async openFile(filePath) {
        if (this.panels.has(filePath)) {
            const panel = this.panels.get(filePath);
            panel.reveal(vscode.ViewColumn.One);
            return;
        }

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

        // Set custom wizard hat icon for the tab
        panel.iconPath = {
            light: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-light.svg')),
            dark: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-dark.svg'))
        };

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
                } else if (message.command === 'openLinkedFile') {
                    await this.handleOpenLinkedFile(filePath, message.href);
                }
            },
            null,
            this.context.subscriptions
        );

        // Watch for file changes
        const watchPattern = new vscode.RelativePattern(this.workspaceFolder, filePath);
        const watcher = vscode.workspace.createFileSystemWatcher(watchPattern);
        const changeListener = watcher.onDidChange(async () => {
            if (this.panels.has(filePath)) {
                const state = this.panelStates.get(filePath) || { viewMode: 'preview' };
                await this.updatePanelContent(panel, filePath, state.viewMode);
            }
        });
        const createListener = watcher.onDidCreate(async () => {
            if (this.panels.has(filePath)) {
                const state = this.panelStates.get(filePath) || { viewMode: 'preview' };
                await this.updatePanelContent(panel, filePath, state.viewMode);
            }
        });

        // Handle panel disposal
        panel.onDidDispose(() => {
            this.panels.delete(filePath);
            this.panelStates.delete(filePath);
            changeListener.dispose();
            createListener.dispose();
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
                const markdownHtml = await this.renderMarkdown(content);
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
     * Render markdown with support for Graphviz DOT
     * @param {string} content
     * @returns {Promise<string>}
     */
    async renderMarkdown(content) {
        // Configure marked with custom renderer
        const renderer = new marked.Renderer();
        const originalCode = renderer.code.bind(renderer);

        renderer.code = (code, language) => {
            // Check if this is a DOT/Graphviz code block
            if (language === 'dot' || language === 'graphviz') {
                // Wrap the DOT code in a special div that will be processed client-side
                const escapedCode = code.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
                return `<div class="graphviz-container" data-dot="${escapedCode}"><div class="graphviz-loading">Loading graph...</div></div>`;
            }
            // Use default code rendering for other languages
            return originalCode(code, language);
        };

        marked.setOptions({ renderer });
        return marked(content);
    }


    /**
     * Handle opening a linked file from markdown
     * @param {string} currentFilePath - The path of the current file
     * @param {string} href - The href from the clicked link (relative to workspace root)
     */
    async handleOpenLinkedFile(currentFilePath, href) {
        try {
            // Treat all paths as relative to workspace root
            // path.join handles leading slashes automatically
            const linkedFilePath = path.join(this.workspaceFolder, href);

            // Check if the linked file is within the workspace
            if (!linkedFilePath.startsWith(this.workspaceFolder)) {
                vscode.window.showWarningMessage('Cannot open files outside of workspace');
                return;
            }

            // Get relative path from workspace
            const relativeLinkedPath = path.relative(this.workspaceFolder, linkedFilePath);

            // Check if file exists
            const fileExists = await fs.access(linkedFilePath).then(() => true).catch(() => false);
            if (!fileExists) {
                vscode.window.showWarningMessage(`File not found: ${relativeLinkedPath}`);
                return;
            }

            // Determine if this should be opened in spec viewer or default editor
            const ext = path.extname(linkedFilePath).toLowerCase();
            if (ext === '.md') {
                // Open in spec viewer
                await this.openFile(relativeLinkedPath);
            } else {
                // Open in default VSCode editor
                const document = await vscode.workspace.openTextDocument(linkedFilePath);
                await vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open linked file: ${error.message}`);
        }
    }

    async getMarkdownWebviewContent(panel, rawContent, htmlContent, viewMode = 'preview') {
        const highlightTheme = this.getHighlightTheme();
        const uris = ResourceUri.getViewerUris(this.context, panel.webview, highlightTheme);
        const htmlTemplate = await this.webviewUtils.loadTemplate('extension/webview/viewer/viewer.html');

        return WebviewUtils.renderTemplate(htmlTemplate, {
            fontAwesomeUri: uris.fontAwesome,
            sharedVariablesUri: uris.sharedVariables,
            styleUri: uris.style,
            highlightThemeUri: uris.highlightTheme,
            highlightJsUri: uris.highlightJs,
            vizJsUri: uris.vizJs,
            sharedUtilsUri: uris.sharedUtils,
            scriptUri: uris.script,
            viewMode: viewMode,
            rawContentJson: JSON.stringify(rawContent),
            previewDisplay: viewMode === 'preview' ? 'block' : 'none',
            sourceDisplay: viewMode === 'source' ? 'block' : 'none',
            htmlContent: htmlContent,
            rawContent: WebviewUtils.escapeHtml(rawContent)
        });
    }

    async getTextWebviewContent(content, fileName) {
        const template = await this.webviewUtils.loadTemplate('extension/webview/viewer/text.html');
        return WebviewUtils.renderTemplate(template, {
            fileName: fileName,
            content: WebviewUtils.escapeHtml(content)
        });
    }

    async getErrorWebviewContent(message) {
        const template = await this.webviewUtils.loadTemplate('extension/webview/viewer/error.html');
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