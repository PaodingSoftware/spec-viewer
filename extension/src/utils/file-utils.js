const fs = require('fs').promises;
const path = require('path');

class FileUtils {
    constructor(workspaceFolder, includeFile = '.specinclude') {
        this.workspaceFolder = workspaceFolder;
        this.includeFile = includeFile;
        this.includePatterns = [];
        this.useWhitelist = false;
    }

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

    matchPattern(filePath, pattern) {
        if (pattern.endsWith('/')) {
            const patternBase = pattern.slice(0, -1);
            return filePath === patternBase || filePath.startsWith(pattern);
        } else if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            return regex.test(filePath);
        } else {
            return filePath === pattern || filePath.startsWith(pattern + '/');
        }
    }

    static validatePath(basePath, targetPath, protectedFiles = []) {
        const resolvedBase = path.resolve(basePath);
        const resolvedTarget = path.resolve(basePath, targetPath);

        if (!resolvedTarget.startsWith(resolvedBase)) {
            throw new Error('Invalid path: Directory traversal detected');
        }

        const relativePath = path.relative(resolvedBase, resolvedTarget);
        for (const protectedFile of protectedFiles) {
            if (relativePath === protectedFile || relativePath.startsWith(protectedFile + path.sep)) {
                throw new Error(`Invalid path: Cannot access protected file ${protectedFile}`);
            }
        }

        return resolvedTarget;
    }

    static debounce(func, delay) {
        let timeoutId;
        const debounced = function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
        debounced.cancel = function () {
            clearTimeout(timeoutId);
        };
        return debounced;
    }
}

module.exports = { FileUtils };