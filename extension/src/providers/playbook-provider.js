const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { WebviewUtils } = require('../utils/webview-utils');
const { ResourceUri } = require('../utils/resource-uri');

class PlaybookProvider {
    constructor(context, workspaceFolder) {
        this.context = context;
        this.workspaceFolder = workspaceFolder;
        this.panels = new Map();
        this.webviewUtils = new WebviewUtils(context);
    }

    async openPlaybook(filePath) {
        if (this.panels.has(filePath)) {
            const panel = this.panels.get(filePath);
            panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const fileName = path.basename(filePath);
        const panel = vscode.window.createWebviewPanel(
            'playbookViewer',
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

        panel.iconPath = {
            light: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-light.svg')),
            dark: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-dark.svg'))
        };

        this.panels.set(filePath, panel);

        await this.updatePanelContent(panel, filePath);

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'deleteKeyPoint':
                        await this.deleteKeyPoint(filePath, message.name);
                        break;
                    case 'refresh':
                        await this.updatePanelContent(panel, filePath);
                        break;
                }
            },
            null,
            this.context.subscriptions
        );

        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(path.dirname(filePath), path.basename(filePath))
        );

        const refreshListener = async () => {
            if (this.panels.has(filePath)) {
                await this.updatePanelContent(panel, filePath);
            }
        };

        watcher.onDidChange(refreshListener);
        watcher.onDidCreate(refreshListener);

        panel.onDidDispose(() => {
            this.panels.delete(filePath);
            watcher.dispose();
        }, null, this.context.subscriptions);
    }

    async updatePanelContent(panel, filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            const html = await this.getPlaybookHtml(panel, data);
            panel.webview.html = html;
        } catch (error) {
            panel.webview.html = await this.getErrorHtml(panel, `Failed to load playbook: ${error.message}`);
        }
    }

    async getPlaybookHtml(panel, data) {
        const template = await this.webviewUtils.loadTemplate('extension/webview/playbook/playbook.html');
        const uris = ResourceUri.getPlaybookUris(this.context, panel.webview);

        return WebviewUtils.renderTemplate(template, {
            fontAwesomeUri: uris.fontAwesome,
            sharedVariablesUri: uris.sharedVariables,
            styleUri: uris.style,
            scriptUri: uris.script,
            dataJson: JSON.stringify(data)
        });
    }

    async getErrorHtml(panel, message) {
        const template = await this.webviewUtils.loadTemplate('extension/webview/playbook/error.html');
        const uris = ResourceUri.getPlaybookUris(this.context, panel.webview);
        return WebviewUtils.renderTemplate(template, {
            fontAwesomeUri: uris.fontAwesome,
            message: WebviewUtils.escapeHtml(message)
        });
    }

    async deleteKeyPoint(filePath, keyPointName) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);

            const index = data.key_points.findIndex(kp => kp.name === keyPointName);
            if (index === -1) {
                vscode.window.showWarningMessage(`Key point "${keyPointName}" not found.`);
                return;
            }

            const keyPoint = data.key_points[index];
            const choice = await vscode.window.showWarningMessage(
                `Delete key point "${keyPoint.name}"?\n\n"${keyPoint.text.substring(0, 100)}${keyPoint.text.length > 100 ? '...' : ''}"`,
                { modal: true },
                'Delete',
                'Cancel'
            );

            if (choice !== 'Delete') {
                return;
            }

            data.key_points.splice(index, 1);
            data.last_updated = new Date().toISOString();

            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

            vscode.window.showInformationMessage('Key point deleted successfully');
        } catch (error) {
            console.error('Error deleting key point:', error);
            vscode.window.showErrorMessage(`Failed to delete key point: ${error.message}`);
        }
    }
}

module.exports = { PlaybookProvider };
