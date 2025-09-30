const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { marked } = require('marked');

class FileWebviewManager {
    constructor(context, workspaceFolder) {
        this.context = context;
        this.workspaceFolder = workspaceFolder;
        this.panels = new Map(); // filePath -> panel

        // Cache templates
        this.templates = {
            html: null,
            css: null,
            js: null
        };
    }

    async loadTemplates() {
        if (!this.templates.html) {
            const templateDir = path.join(__dirname, 'templates');
            this.templates.html = await fs.readFile(path.join(templateDir, 'viewer.html'), 'utf8');
            this.templates.css = await fs.readFile(path.join(templateDir, 'viewer.css'), 'utf8');
            this.templates.js = await fs.readFile(path.join(templateDir, 'viewer.js'), 'utf8');
        }
    }

    renderTemplate(template, variables) {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }

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
                localResourceRoots: [vscode.Uri.file(this.workspaceFolder)]
            }
        );

        // Store panel reference
        this.panels.set(filePath, panel);

        // Load and render content
        await this.updatePanelContent(panel, filePath);

        // Handle panel disposal
        panel.onDidDispose(() => {
            this.panels.delete(filePath);
        }, null, this.context.subscriptions);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'toggleViewMode':
                        await this.updatePanelContent(panel, filePath, message.viewMode);
                        break;
                    case 'toggleOutline':
                        // Outline visibility is handled in webview
                        break;
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

        panel.onDidDispose(() => {
            watcher.dispose();
        }, null, this.context.subscriptions);
    }

    async updatePanelContent(panel, filePath, viewMode = 'preview') {
        try {
            await this.loadTemplates();

            const fullPath = path.join(this.workspaceFolder, filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();

            let html;
            if (ext === '.md') {
                const markdownHtml = marked(content);
                html = this.getMarkdownWebviewContent(panel, content, markdownHtml, viewMode);
            } else {
                html = this.getTextWebviewContent(content, path.basename(filePath));
            }

            panel.webview.html = html;
        } catch (error) {
            panel.webview.html = this.getErrorWebviewContent(`Failed to load file: ${error.message}`);
        }
    }

    getMarkdownWebviewContent(panel, rawContent, htmlContent, viewMode = 'preview') {
        const nonce = this.getNonce();
        const cspContent = `default-src 'none'; style-src ${panel.webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com; script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com; img-src ${panel.webview.cspSource} https: data:; font-src https://cdnjs.cloudflare.com;`;

        const script = this.renderTemplate(this.templates.js, {
            viewMode: viewMode,
            rawContentJson: JSON.stringify(rawContent)
        });

        return this.renderTemplate(this.templates.html, {
            cspContent: cspContent,
            styles: this.templates.css,
            previewDisplay: viewMode === 'preview' ? 'block' : 'none',
            sourceDisplay: viewMode === 'source' ? 'block' : 'none',
            htmlContent: htmlContent,
            rawContent: this.escapeHtml(rawContent),
            nonce: nonce,
            script: script
        });
    }

    getTextWebviewContent(content, fileName) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
            font-size: 13px;
            line-height: 1.6;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
        }
        .text-content {
            white-space: pre-wrap;
            overflow-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="text-content">${this.escapeHtml(content)}</div>
</body>
</html>`;
    }

    getErrorWebviewContent(message) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-editor-background);
        }
        .error-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <span>⚠️</span>
        <span>${this.escapeHtml(message)}</span>
    </div>
</body>
</html>`;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

module.exports = { FileWebviewManager };