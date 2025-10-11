const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
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
                    case 'deleteTopic':
                        await this.deleteTopic(message.topicDirName);
                        break;
                    case 'deleteResearch':
                        await this.deleteResearch(message.topicDirName);
                        break;
                    case 'rollbackToDiscuss':
                        await this.rollbackToDiscuss(message.topicDirName);
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

    /**
     * Validate path is within specify directory
     * @param {string} topicDirName - Topic directory name
     * @returns {string} Validated absolute path
     */
    validateTopicPath(topicDirName) {
        const specifyPath = path.join(this.workspaceFolder, 'specify');
        const topicPath = path.resolve(specifyPath, topicDirName);

        // Ensure path is within specify directory
        if (!topicPath.startsWith(specifyPath)) {
            throw new Error('Invalid path: must be within specify directory');
        }

        // Prevent deletion of constitution.md
        const constitutionPath = path.join(specifyPath, 'constitution.md');
        if (topicPath === constitutionPath) {
            throw new Error('Cannot delete constitution.md');
        }

        return topicPath;
    }

    /**
     * Delete current topic
     * @param {string} topicDirName - Topic directory name
     */
    async deleteTopic(topicDirName) {
        try {
            // Validate path
            const topicPath = this.validateTopicPath(topicDirName);

            // Get current topic to verify it's the latest
            const data = await this.parser.parseAll();
            if (!data.currentTopic || data.currentTopic.dirName !== topicDirName) {
                vscode.window.showWarningMessage('Only the current topic can be deleted.');
                return;
            }

            // Confirm deletion with modal dialog
            const choice = await vscode.window.showWarningMessage(
                `Delete topic "${data.currentTopic.name}"?\n\nThis will permanently delete the entire topic directory and cannot be undone.`,
                { modal: true },
                'Delete',
                'Cancel'
            );

            if (choice !== 'Delete') {
                return;
            }

            // Delete the topic directory recursively
            await fs.rm(topicPath, { recursive: true, force: true });

            vscode.window.showInformationMessage('Topic deleted successfully');

            // Refresh dashboard
            await this.updatePanelContent();
        } catch (error) {
            console.error('Error deleting topic:', error);
            vscode.window.showErrorMessage(`Failed to delete topic: ${error.message}`);
        }
    }

    /**
     * Delete research report
     * @param {string} topicDirName - Topic directory name
     */
    async deleteResearch(topicDirName) {
        try {
            // Validate path
            const topicPath = this.validateTopicPath(topicDirName);
            const researchPath = path.join(topicPath, 'research.md');

            // Get current topic to verify it's the latest
            const data = await this.parser.parseAll();
            if (!data.currentTopic || data.currentTopic.dirName !== topicDirName) {
                vscode.window.showWarningMessage('Only the current topic research can be deleted.');
                return;
            }

            // Check if research file exists
            try {
                await fs.access(researchPath);
            } catch {
                vscode.window.showWarningMessage('Research report does not exist.');
                return;
            }

            // Confirm deletion
            const choice = await vscode.window.showWarningMessage(
                'Delete research report?\n\nThis action cannot be undone.',
                { modal: true },
                'Delete',
                'Cancel'
            );

            if (choice !== 'Delete') {
                return;
            }

            // Delete research.md
            await fs.unlink(researchPath);

            vscode.window.showInformationMessage('Research report deleted successfully');

            // Refresh dashboard
            await this.updatePanelContent();
        } catch (error) {
            console.error('Error deleting research:', error);
            vscode.window.showErrorMessage(`Failed to delete research: ${error.message}`);
        }
    }

    /**
     * Rollback to discuss stage by removing plan and implementation
     * @param {string} topicDirName - Topic directory name
     */
    async rollbackToDiscuss(topicDirName) {
        try {
            // Validate path
            const topicPath = this.validateTopicPath(topicDirName);

            // Get current topic to verify it's the latest
            const data = await this.parser.parseAll();
            if (!data.currentTopic || data.currentTopic.dirName !== topicDirName) {
                vscode.window.showWarningMessage('Only the current topic can be rolled back.');
                return;
            }

            // Check if topic is in a stage that allows rollback
            const allowedStages = ['plan', 'action', 'completed'];
            if (!allowedStages.includes(data.currentTopic.stage)) {
                vscode.window.showWarningMessage(`Cannot rollback from ${data.currentTopic.stage} stage.`);
                return;
            }

            // Confirm rollback
            const choice = await vscode.window.showWarningMessage(
                'Rollback to discussion stage?\n\nThis will delete:\n• plan.md (action plan)\n• implementation/ directory (all implementation records)\n\nDiscussion records and research report will be preserved.\n\nThis action cannot be undone.',
                { modal: true },
                'Rollback',
                'Cancel'
            );

            if (choice !== 'Rollback') {
                return;
            }

            // Delete plan.md if exists
            const planPath = path.join(topicPath, 'plan.md');
            try {
                await fs.unlink(planPath);
            } catch (error) {
                // File may not exist, continue
            }

            // Delete implementation directory if exists
            const implPath = path.join(topicPath, 'implementation');
            try {
                await fs.rm(implPath, { recursive: true, force: true });
            } catch (error) {
                // Directory may not exist, continue
            }

            vscode.window.showInformationMessage('Rolled back to discussion stage successfully');

            // Refresh dashboard
            await this.updatePanelContent();
        } catch (error) {
            console.error('Error rolling back:', error);
            vscode.window.showErrorMessage(`Failed to rollback: ${error.message}`);
        }
    }
}

module.exports = { DashboardProvider };