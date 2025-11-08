const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;

/**
 * Claude Code MCP Tools Installer
 * Installs copilot-instructions.md and mcp.json configuration files
 * to enable GitHub Copilot to use Claude Code MCP tools
 */
class CopilotMcpInstaller {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
    }

    /**
     * Install Claude Code MCP configuration to workspace
     * @param {string} workspaceFolder - Target workspace folder
     */
    async install(workspaceFolder) {
        try {
            // Confirm installation
            const choice = await vscode.window.showInformationMessage(
                'Install Claude Code MCP Tools? This will enable GitHub Copilot to use Claude Code MCP tools for enhanced file operations.',
                { modal: true },
                'Install'
            );

            if (choice !== 'Install') {
                return false;
            }

            // Create target directories
            const githubDir = path.join(workspaceFolder, '.github');
            const vscodeDir = path.join(workspaceFolder, '.vscode');

            await fs.mkdir(githubDir, { recursive: true });
            await fs.mkdir(vscodeDir, { recursive: true });

            // Copy copilot-instructions.md
            const sourceCopilotInstructions = path.join(this.extensionPath, '.github', 'copilot-instructions.md');
            const targetCopilotInstructions = path.join(githubDir, 'copilot-instructions.md');

            try {
                await fs.copyFile(sourceCopilotInstructions, targetCopilotInstructions);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy copilot-instructions.md: ${error.message}`);
                return false;
            }

            // Copy mcp.json
            const sourceMcpJson = path.join(this.extensionPath, '.vscode', 'mcp.json');
            const targetMcpJson = path.join(vscodeDir, 'mcp.json');

            try {
                await fs.copyFile(sourceMcpJson, targetMcpJson);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy mcp.json: ${error.message}`);
                return false;
            }

            vscode.window.showInformationMessage('Claude Code MCP Tools installed successfully! Please restart VS Code to apply changes.');
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to install Claude Code MCP Tools: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if configuration files already exist
     * @param {string} workspaceFolder - Target workspace folder
     */
    async checkExists(workspaceFolder) {
        const copilotInstructions = path.join(workspaceFolder, '.github', 'copilot-instructions.md');
        const mcpJson = path.join(workspaceFolder, '.vscode', 'mcp.json');

        try {
            await fs.access(copilotInstructions);
            await fs.access(mcpJson);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = { CopilotMcpInstaller };
