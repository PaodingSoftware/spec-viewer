const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { WebviewUtils } = require('../utils/webview-utils');
const { ResourceUri } = require('../utils/resource-uri');
const { SenatusParser } = require('../utils/senatus-parser');

class DashboardProvider {
    constructor(context, workspaceFolder) {
        this.context = context;
        this.workspaceFolder = workspaceFolder;
        this.panel = null;
        this.parser = new SenatusParser(workspaceFolder);
        this.watcher = null;
        this.refreshTimeout = null;
        this.isHtmlLoaded = false;
        this.webviewUtils = new WebviewUtils(context);
    }

    async openDashboard() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

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

        this.panel.iconPath = {
            light: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-light.svg')),
            dark: vscode.Uri.file(path.join(this.context.extensionPath, 'extension/icons/spec-dark.svg'))
        };

        this.isHtmlLoaded = false;
        await this.updatePanelContent();

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
                    case 'rollbackPlanOnly':
                        await this.rollbackPlanOnly(message.topicDirName);
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

    setupFileWatcher() {
        if (this.watcher) {
            this.watcher.dispose();
        }

        const pattern = new vscode.RelativePattern(this.workspaceFolder, '{specify,knowledge}/**/*');
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

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

    async updatePanelContent() {
        if (!this.panel) return;

        try {
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

    async getDashboardHtml(data) {
        const template = await this.webviewUtils.loadTemplate('extension/webview/dashboard/dashboard.html');
        const uris = ResourceUri.getDashboardUris(this.context, this.panel.webview);

        const dataJson = JSON.stringify(data);

        return WebviewUtils.renderTemplate(template, {
            fontAwesomeUri: uris.fontAwesome,
            sharedVariablesUri: uris.sharedVariables,
            styleUri: uris.style,
            scriptUri: uris.script,
            dataJson: dataJson
        });
    }

    async getErrorHtml(message) {
        const template = await this.webviewUtils.loadTemplate('extension/webview/dashboard/error.html');
        const uris = ResourceUri.getDashboardUris(this.context, this.panel.webview);
        return WebviewUtils.renderTemplate(template, {
            fontAwesomeUri: uris.fontAwesome,
            message: WebviewUtils.escapeHtml(message)
        });
    }

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

    async deleteTopic(topicDirName) {
        try {
            const topicPath = this.validateTopicPath(topicDirName);

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

    async deleteResearch(topicDirName) {
        try {
            const topicPath = this.validateTopicPath(topicDirName);
            const researchPath = path.join(topicPath, 'research.md');

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

    async rollbackToDiscuss(topicDirName) {
        try {
            const topicPath = this.validateTopicPath(topicDirName);

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

    async rollbackPlanOnly(topicDirName) {
        try {
            const topicPath = this.validateTopicPath(topicDirName);

            const data = await this.parser.parseAll();
            if (!data.currentTopic || data.currentTopic.dirName !== topicDirName) {
                vscode.window.showWarningMessage('Only the current topic can be rolled back.');
                return;
            }

            // Check if topic is in a stage that allows this operation
            const allowedStages = ['plan', 'action', 'completed'];
            if (!allowedStages.includes(data.currentTopic.stage)) {
                vscode.window.showWarningMessage(`Cannot rollback plan from ${data.currentTopic.stage} stage.`);
                return;
            }

            // Confirm rollback
            const choice = await vscode.window.showWarningMessage(
                'Rollback plan only?\n\nThis will delete:\n• plan.md (action plan)\n\nImplementation records, discussion records and research report will be preserved.\n\nThis action cannot be undone.',
                { modal: true },
                'Rollback Plan',
                'Cancel'
            );

            if (choice !== 'Rollback Plan') {
                return;
            }

            // Delete plan.md if exists
            const planPath = path.join(topicPath, 'plan.md');
            try {
                await fs.unlink(planPath);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    vscode.window.showWarningMessage('plan.md does not exist');
                    return;
                }
                throw error;
            }

            vscode.window.showInformationMessage('Plan rolled back successfully');

            // Refresh dashboard
            await this.updatePanelContent();
        } catch (error) {
            console.error('Error rolling back plan:', error);
            vscode.window.showErrorMessage(`Failed to rollback plan: ${error.message}`);
        }
    }
}

module.exports = { DashboardProvider };