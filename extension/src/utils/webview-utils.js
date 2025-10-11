const fs = require('fs').promises;
const path = require('path');

class WebviewUtils {
    constructor(context) {
        this.context = context;
        this.templateCache = new Map();
    }

    async loadTemplate(templatePath) {
        if (!this.templateCache.has(templatePath)) {
            const fullPath = path.join(this.context.extensionPath, templatePath);
            const content = await fs.readFile(fullPath, 'utf8');
            this.templateCache.set(templatePath, content);
        }
        return this.templateCache.get(templatePath);
    }

    async loadTemplates(templateMap) {
        const results = {};
        for (const [key, templatePath] of Object.entries(templateMap)) {
            results[key] = await this.loadTemplate(templatePath);
        }
        return results;
    }

    clearTemplateCache() {
        this.templateCache.clear();
    }

    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static renderTemplate(template, variables) {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
}

module.exports = { WebviewUtils };