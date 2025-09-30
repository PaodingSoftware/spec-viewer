const vscode = require('vscode');
const path = require('path');
const { SpecViewer } = require('../src/server');

let currentServer = null;
let currentPanel = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Spec Viewer extension is now active');

    let disposable = vscode.commands.registerCommand('spec-viewer.open', async function () {
        // Get workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open. Please open a folder first.');
            return;
        }

        const directory = workspaceFolders[0].uri.fsPath;

        try {
            // Create server with port 0 (random port)
            const viewer = new SpecViewer({
                directory: directory,
                port: 0,
                host: 'localhost',
                ignoreFile: '.specinclude'
            });

            // Start server and get actual port
            await new Promise((resolve, reject) => {
                viewer.server.listen(0, 'localhost', () => {
                    const actualPort = viewer.server.address().port;
                    console.log(`Spec viewer started on port ${actualPort}`);

                    // Store server reference
                    currentServer = viewer;

                    // Create webview
                    createWebviewPanel(context, actualPort, directory);

                    resolve();
                });

                viewer.server.on('error', (error) => {
                    reject(error);
                });
            });

            // Load include file and setup file watcher
            await viewer.loadIncludeFile();
            viewer.setupFileWatcher();

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start Spec Viewer: ${error.message}`);
            console.error('Error starting spec viewer:', error);
        }
    });

    context.subscriptions.push(disposable);
}

function createWebviewPanel(context, port, directory) {
    // If panel already exists, reveal it
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.One);
        return;
    }

    // Create new panel
    currentPanel = vscode.window.createWebviewPanel(
        'specViewer',
        'Spec Viewer',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Set webview content
    currentPanel.webview.html = getWebviewContent(port);

    // Handle panel disposal
    currentPanel.onDidDispose(
        () => {
            currentPanel = null;

            // Close server when panel is closed
            if (currentServer) {
                console.log('Closing spec viewer server...');

                // Close watcher
                if (currentServer.watcher) {
                    currentServer.watcher.close();
                }

                // Close socket.io
                if (currentServer.io) {
                    currentServer.io.close();
                }

                // Close server
                currentServer.server.close(() => {
                    console.log('Spec viewer server closed');
                });

                currentServer = null;
            }
        },
        null,
        context.subscriptions
    );
}

function getWebviewContent(port) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spec Viewer</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
        }
        iframe {
            border: none;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <iframe src="http://localhost:${port}" allow="scripts"></iframe>
</body>
</html>`;
}

function deactivate() {
    // Cleanup when extension is deactivated
    if (currentServer) {
        if (currentServer.watcher) {
            currentServer.watcher.close();
        }
        if (currentServer.io) {
            currentServer.io.close();
        }
        currentServer.server.close();
        currentServer = null;
    }
}

module.exports = {
    activate,
    deactivate
};