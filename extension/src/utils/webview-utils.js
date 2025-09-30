/**
 * Webview utility functions
 */
class WebviewUtils {
    /**
     * Escape HTML special characters
     * @param {string} unsafe - Unsafe string
     * @returns {string} Escaped string
     */
    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Render template with variables
     * @param {string} template - Template content
     * @param {Object} variables - Variables to replace
     * @returns {string} Rendered template
     */
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