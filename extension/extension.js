const vscode = require('vscode');
const path = require('path');
const { SpecTreeDataProvider } = require('./treeview-provider');
const { FileWebviewManager } = require('./webview-content');

let treeDataProvider = null;
let webviewManager = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Spec Viewer extension is now active');

    // Get workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('Spec Viewer: No workspace folder open.');
        return;
    }

    const workspaceFolder = workspaceFolders[0].uri.fsPath;

    // Create and register tree data provider
    treeDataProvider = new SpecTreeDataProvider(workspaceFolder, '.specinclude');
    treeDataProvider.initialize();

    const treeView = vscode.window.createTreeView('specViewerExplorer', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });

    context.subscriptions.push(treeView);

    // Create webview manager
    webviewManager = new FileWebviewManager(context, workspaceFolder);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.openFile', async (filePath) => {
            await webviewManager.openFile(filePath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.refresh', () => {
            treeDataProvider.refresh();
            vscode.window.showInformationMessage('Spec Viewer: Refreshed file tree');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.closeAllTabs', async () => {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        })
    );
}

function deactivate() {
    // Cleanup when extension is deactivated
}

module.exports = {
    activate,
    deactivate
};