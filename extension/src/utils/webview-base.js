const fs = require('fs').promises;
const path = require('path');

/**
 * Base class for webview providers with template loading
 */
class WebviewBase {
    constructor(context) {
        this.context = context;
        this.templateCache = new Map();
    }

    /**
     * Load template file from disk with caching
     * @param {string} templatePath - Relative path from extension root
     * @returns {Promise<string>} Template content
     */
    async loadTemplate(templatePath) {
        if (!this.templateCache.has(templatePath)) {
            const fullPath = path.join(this.context.extensionPath, templatePath);
            const content = await fs.readFile(fullPath, 'utf8');
            this.templateCache.set(templatePath, content);
        }
        return this.templateCache.get(templatePath);
    }

    /**
     * Load multiple templates at once
     * @param {Object} templateMap - Map of key to template path
     * @returns {Promise<Object>} Map of key to template content
     */
    async loadTemplates(templateMap) {
        const results = {};
        for (const [key, templatePath] of Object.entries(templateMap)) {
            results[key] = await this.loadTemplate(templatePath);
        }
        return results;
    }

    /**
     * Clear template cache
     */
    clearTemplateCache() {
        this.templateCache.clear();
    }
}

module.exports = { WebviewBase };