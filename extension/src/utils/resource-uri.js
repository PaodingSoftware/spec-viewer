const vscode = require('vscode');
const path = require('path');

class ResourceUri {
    static _toUri(context, webview, ...pathSegments) {
        return webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'extension', ...pathSegments))
        );
    }

    static getViewerUris(context, webview, highlightTheme = 'github-dark.min.css') {
        return {
            fontAwesome: this._toUri(context, webview, 'assets', 'fontawesome', 'fontawesome.css'),
            sharedVariables: this._toUri(context, webview, 'webview', 'shared', 'variables.css'),
            style: this._toUri(context, webview, 'webview', 'viewer', 'viewer.css'),
            highlightTheme: this._toUri(context, webview, 'assets', 'highlight.js', highlightTheme),
            highlightJs: this._toUri(context, webview, 'assets', 'highlight.js', 'highlight.min.js'),
            sharedUtils: this._toUri(context, webview, 'webview', 'shared', 'utils.js'),
            script: this._toUri(context, webview, 'webview', 'viewer', 'viewer.js')
        };
    }

    static getSidebarUris(context, webview) {
        return {
            fontAwesome: this._toUri(context, webview, 'assets', 'fontawesome', 'fontawesome.css'),
            sharedVariables: this._toUri(context, webview, 'webview', 'shared', 'variables.css'),
            style: this._toUri(context, webview, 'webview', 'sidebar', 'sidebar.css'),
            fileIcons: this._toUri(context, webview, 'webview', 'shared', 'file-icons.js'),
            script: this._toUri(context, webview, 'webview', 'sidebar', 'sidebar.js')
        };
    }

    static getDashboardUris(context, webview) {
        return {
            fontAwesome: this._toUri(context, webview, 'assets', 'fontawesome', 'fontawesome.css'),
            sharedVariables: this._toUri(context, webview, 'webview', 'shared', 'variables.css'),
            style: this._toUri(context, webview, 'webview', 'dashboard', 'dashboard.css'),
            script: this._toUri(context, webview, 'webview', 'dashboard', 'dashboard.js')
        };
    }
}

module.exports = { ResourceUri };