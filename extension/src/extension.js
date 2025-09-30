const vscode = require('vscode');
const { SidebarProvider } = require('./providers/sidebar-provider');
const { FileViewerProvider } = require('./providers/file-viewer-provider');

let sidebarProvider = null;
let fileViewerProvider = null;

/**
 * Activate the extension
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

    // Initialize sidebar provider
    sidebarProvider = new SidebarProvider(context, workspaceFolder);
    sidebarProvider.initialize();

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('specViewerExplorer', sidebarProvider)
    );

    // Initialize file viewer provider
    fileViewerProvider = new FileViewerProvider(context, workspaceFolder);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.openFile', async (filePath) => {
            await fileViewerProvider.openFile(filePath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.collapseAll', () => {
            if (sidebarProvider.view) {
                sidebarProvider.view.webview.postMessage({ command: 'collapseAll' });
            }
        })
    );
}

/**
 * Deactivate the extension
 */
function deactivate() {
    // Cleanup when extension is deactivated
}

module.exports = {
    activate,
    deactivate
};