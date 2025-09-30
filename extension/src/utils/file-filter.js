const fs = require('fs').promises;
const path = require('path');

/**
 * File filtering utility for .specinclude patterns
 */
class FileFilter {
    constructor(workspaceFolder, includeFile = '.specinclude') {
        this.workspaceFolder = workspaceFolder;
        this.includeFile = includeFile;
        this.includePatterns = [];
        this.useWhitelist = false;
    }

    /**
     * Load include patterns from .specinclude file
     */
    async initialize() {
        try {
            const includePath = path.join(this.workspaceFolder, this.includeFile);
            const includeContent = await fs.readFile(includePath, 'utf8');

            const lines = includeContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));

            if (lines.length > 0) {
                this.includePatterns = lines;
                this.useWhitelist = true;
                console.log(`Loaded include patterns from ${this.includeFile}:`, lines);
            } else {
                console.log(`Empty include file ${this.includeFile}, serving all files`);
                this.useWhitelist = false;
            }
        } catch (error) {
            console.log(`No include file found at ${this.includeFile}, serving all files`);
            this.useWhitelist = false;
            this.includePatterns = [];
        }
    }

    /**
     * Check if a file path should be included based on patterns
     * @param {string} filePath - Relative file path
     * @returns {boolean}
     */
    isFileIncluded(filePath) {
        if (!this.useWhitelist) {
            return true;
        }

        const normalizedPath = filePath.replace(/\\/g, '/');

        for (const pattern of this.includePatterns) {
            const normalizedPattern = pattern.replace(/\\/g, '/');
            if (this.matchPattern(normalizedPath, normalizedPattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Match a file path against a pattern
     * @param {string} filePath - Normalized file path
     * @param {string} pattern - Normalized pattern
     * @returns {boolean}
     */
    matchPattern(filePath, pattern) {
        if (pattern.endsWith('/')) {
            // Directory pattern: matches the directory itself or anything inside it
            const patternBase = pattern.slice(0, -1);
            return filePath === patternBase || filePath.startsWith(pattern);
        } else if (pattern.includes('*')) {
            // Wildcard pattern
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            return regex.test(filePath);
        } else {
            // Exact file or directory name
            return filePath === pattern || filePath.startsWith(pattern + '/');
        }
    }
}

module.exports = { FileFilter };