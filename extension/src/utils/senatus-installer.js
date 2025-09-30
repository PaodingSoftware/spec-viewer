const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;

/**
 * Senatus Framework Installer
 */
class SenatusInstaller {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this.senatusPath = path.join(extensionPath, 'senatus');
    }

    /**
     * Check if senatus submodule exists
     */
    async checkSenatusExists() {
        try {
            await fs.access(this.senatusPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Install Senatus framework to workspace
     * @param {string} workspaceFolder - Target workspace folder
     */
    async install(workspaceFolder) {
        const exists = await this.checkSenatusExists();
        if (!exists) {
            vscode.window.showErrorMessage('Senatus submodule not found. Please ensure the extension includes the senatus submodule.');
            return false;
        }

        try {
            // Confirm installation
            const choice = await vscode.window.showInformationMessage(
                'Install Senatus Framework? This will copy Claude commands and Specify templates to your project.',
                { modal: true },
                'Install'
            );

            if (choice !== 'Install') {
                return false;
            }

            // Create target directories
            const commandsDir = path.join(workspaceFolder, '.claude', 'commands');
            const promptsDir = path.join(workspaceFolder, '.github', 'prompts');
            const specifyDir = path.join(workspaceFolder, '.specify');

            await fs.mkdir(commandsDir, { recursive: true });
            await fs.mkdir(promptsDir, { recursive: true });
            await fs.mkdir(specifyDir, { recursive: true });

            // Copy claude commands
            const sourceCommandsDir = path.join(this.senatusPath, '.claude', 'commands');
            await this.copyDirectory(sourceCommandsDir, commandsDir);

            // Copy copilot prompts
            const sourcePromptsDir = path.join(this.senatusPath, '.github', 'prompts');
            await this.copyDirectory(sourcePromptsDir, promptsDir);

            // Copy specify templates
            const sourceSpecifyDir = path.join(this.senatusPath, '.specify');
            await this.copyDirectory(sourceSpecifyDir, specifyDir);

            // Copy .specinclude file
            const sourceSpecinclude = path.join(this.extensionPath, '.specinclude');
            const targetSpecinclude = path.join(workspaceFolder, '.specinclude');
            try {
                await fs.copyFile(sourceSpecinclude, targetSpecinclude);
            } catch (error) {
                console.warn('Failed to copy .specinclude:', error.message);
            }

            vscode.window.showInformationMessage('Senatus Framework installed successfully!');
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to install Senatus: ${error.message}`);
            return false;
        }
    }

    /**
     * Copy directory recursively
     * @param {string} source - Source directory
     * @param {string} target - Target directory
     */
    async copyDirectory(source, target) {
        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                await fs.mkdir(targetPath, { recursive: true });
                await this.copyDirectory(sourcePath, targetPath);
            } else {
                await fs.copyFile(sourcePath, targetPath);
            }
        }
    }
}

module.exports = { SenatusInstaller };