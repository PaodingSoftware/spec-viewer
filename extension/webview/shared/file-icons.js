/**
 * Shared file icon mapping for webviews
 * This file is used in browser context, not Node.js
 */

/**
 * Get Font Awesome icon class for a file
 * @param {string} fileName - File name
 * @returns {string} Font Awesome icon class
 */
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        // Markdown
        'md': 'fab fa-markdown',
        'markdown': 'fab fa-markdown',

        // Programming languages
        'js': 'fab fa-js',
        'jsx': 'fab fa-react',
        'ts': 'fa-file-code',
        'tsx': 'fab fa-react',
        'py': 'fab fa-python',
        'java': 'fab fa-java',
        'php': 'fab fa-php',
        'rb': 'fa-file-code',
        'go': 'fa-file-code',
        'rs': 'fa-file-code',
        'c': 'fa-file-code',
        'cpp': 'fa-file-code',
        'cs': 'fa-file-code',
        'swift': 'fab fa-swift',

        // Web files
        'html': 'fab fa-html5',
        'htm': 'fab fa-html5',
        'css': 'fab fa-css3-alt',
        'scss': 'fab fa-sass',
        'sass': 'fab fa-sass',
        'less': 'fa-file-code',
        'vue': 'fab fa-vuejs',

        // Data files
        'json': 'fa-braces',
        'xml': 'fa-file-code',
        'yaml': 'fa-file-code',
        'yml': 'fa-file-code',
        'toml': 'fa-file-code',
        'csv': 'fa-file-csv',

        // Documents
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'txt': 'fa-file-lines',

        // Images
        'png': 'fa-file-image',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'gif': 'fa-file-image',
        'bmp': 'fa-file-image',
        'webp': 'fa-file-image',
        'svg': 'fa-file-image',
        'ico': 'fa-file-image',

        // Archives
        'zip': 'fa-file-zipper',
        'rar': 'fa-file-zipper',
        'tar': 'fa-file-zipper',
        'gz': 'fa-file-zipper',
        '7z': 'fa-file-zipper',

        // Audio/Video
        'mp3': 'fa-file-audio',
        'wav': 'fa-file-audio',
        'ogg': 'fa-file-audio',
        'mp4': 'fa-file-video',
        'avi': 'fa-file-video',
        'mov': 'fa-file-video',
        'wmv': 'fa-file-video',

        // Config files
        'env': 'fa-gear',
        'config': 'fa-gear',
        'ini': 'fa-gear',
        'conf': 'fa-gear',

        // Git
        'gitignore': 'fab fa-git-alt',
        'gitattributes': 'fab fa-git-alt',

        // Docker
        'dockerfile': 'fab fa-docker',

        // Node
        'npmignore': 'fab fa-npm'
    };

    // Check full filename for special cases
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName === 'dockerfile' || lowerFileName.startsWith('dockerfile.')) {
        return 'fab fa-docker';
    }
    if (lowerFileName === '.gitignore' || lowerFileName === '.gitattributes') {
        return 'fab fa-git-alt';
    }
    if (lowerFileName === '.npmignore' || lowerFileName === 'package.json' || lowerFileName === 'package-lock.json') {
        return 'fab fa-npm';
    }
    if (lowerFileName === '.env' || lowerFileName.startsWith('.env.')) {
        return 'fa-gear';
    }

    return iconMap[ext] || 'fa-file';
}