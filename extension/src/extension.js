const vscode = require('vscode');
const path = require('path');
const { SidebarProvider } = require('./providers/sidebar-provider');
const { FileViewerProvider } = require('./providers/file-viewer-provider');
const { DashboardProvider } = require('./providers/dashboard-provider');
const { PlaybookProvider } = require('./providers/playbook-provider');
const { SenatusInstaller } = require('./utils/senatus-installer');
const { CopilotMcpInstaller } = require('./utils/copilot-mcp-installer');

let sidebarProvider = null;
let fileViewerProvider = null;
let dashboardProvider = null;
let playbookProvider = null;

async function refreshFileTree() {
    if (sidebarProvider && sidebarProvider.view) {
        await sidebarProvider.fileUtils.initialize();
        const tree = await sidebarProvider.getDirectoryTree(sidebarProvider.workspaceFolder);
        sidebarProvider.view.webview.postMessage({
            command: 'refresh',
            tree: tree
        });
    }
}

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

    // Watch for file system changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');

    // Debounce refresh to avoid too many updates
    let refreshTimeout = null;
    const debouncedRefresh = () => {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }
        refreshTimeout = setTimeout(() => {
            refreshFileTree();
        }, 300);
    };

    context.subscriptions.push(watcher.onDidCreate(debouncedRefresh));
    context.subscriptions.push(watcher.onDidDelete(debouncedRefresh));
    context.subscriptions.push(watcher.onDidChange((uri) => {
        // Only refresh if .specinclude changed
        if (uri.fsPath.endsWith('.specinclude')) {
            debouncedRefresh();
        }
    }));
    context.subscriptions.push(watcher);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('specViewerExplorer', sidebarProvider)
    );

    // Initialize file viewer provider
    fileViewerProvider = new FileViewerProvider(context, workspaceFolder);

    // Initialize dashboard provider
    dashboardProvider = new DashboardProvider(context, workspaceFolder);

    // Initialize playbook provider
    playbookProvider = new PlaybookProvider(context, workspaceFolder);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.openFile', async (filePath) => {
            // Check if it's a playbook.json file
            if (path.basename(filePath) === 'playbook.json') {
                const fullPath = path.join(workspaceFolder, filePath);
                await playbookProvider.openPlaybook(fullPath);
            } else {
                await fileViewerProvider.openFile(filePath);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.openDashboard', async () => {
            await dashboardProvider.openDashboard();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.collapseAll', () => {
            if (sidebarProvider.view) {
                sidebarProvider.view.webview.postMessage({ command: 'collapseAll' });
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.refresh', async () => {
            await refreshFileTree();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.installSenatus', async () => {
            const installer = new SenatusInstaller(context.extensionPath);
            await installer.install(workspaceFolder);

            // Refresh the file tree after installation
            await refreshFileTree();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-viewer.installCopilotMcp', async () => {
            const installer = new CopilotMcpInstaller(context.extensionPath);
            await installer.install(workspaceFolder);
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