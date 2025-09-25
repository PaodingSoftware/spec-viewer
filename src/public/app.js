class SpecViewer {
    constructor() {
        this.socket = io();
        this.tabs = new Map();
        this.activeTabId = null;
        this.fileTree = null;
        this.isResizing = false;
        this.currentTheme = localStorage.getItem('theme') || 'light';

        // Theme constants
        this.THEMES = {
            LIGHT: {
                name: 'light',
                icon: 'fas fa-moon',
                title: 'Toggle dark mode',
                highlightCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css'
            },
            DARK: {
                name: 'dark',
                icon: 'fas fa-sun',
                title: 'Toggle light mode',
                highlightCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css'
            }
        };

        this.initializeTheme();
        this.initializeEventListeners();
        this.setupSocketListeners();
        this.setupResizeHandle();
        this.loadFileTree();
    }

    initializeEventListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadFileTree();
        });

        document.getElementById('close-all-tabs').addEventListener('click', () => {
            this.closeAllTabs();
        });

        document.getElementById('tab-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close') || e.target.closest('.tab-close')) {
                e.stopPropagation();
                const tabId = e.target.closest('.tab').dataset.tabId;
                this.closeTab(tabId);
            } else if (e.target.closest('.tab')) {
                const tabId = e.target.closest('.tab').dataset.tabId;
                this.switchTab(tabId);
            }
        });

        const searchInput = document.getElementById('search-files');
        searchInput.addEventListener('input', (e) => {
            this.filterFiles(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                this.filterFiles('');
            }
        });
    }

    setupSocketListeners() {
        this.socket.on('file-changed', (data) => {
            console.log('File changed:', data.path);
            this.handleFileChange(data.path);
        });

        this.socket.on('tree-changed', () => {
            console.log('Directory tree changed');
            this.loadFileTree();
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    setupResizeHandle() {
        const resizeHandle = document.getElementById('resize-handle');
        const sidebar = document.getElementById('sidebar');

        resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';

            const startX = e.clientX;
            const startWidth = sidebar.offsetWidth;

            const handleMouseMove = (e) => {
                if (!this.isResizing) return;

                const deltaX = e.clientX - startX;
                const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));

                sidebar.style.width = `${newWidth}px`;
            };

            const handleMouseUp = () => {
                this.isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    async loadFileTree() {
        const treeContainer = document.getElementById('fileTree');

        try {
            treeContainer.innerHTML = `
                <div class="loading-container">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading files...</span>
                </div>
            `;

            const response = await fetch('/api/tree');
            if (!response.ok) {
                throw new Error('Failed to load file tree');
            }

            const tree = await response.json();
            this.fileTree = tree;
            this.renderFileTree(tree, treeContainer);

        } catch (error) {
            console.error('Error loading file tree:', error);
            treeContainer.innerHTML = `
                <div class="notification error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load files
                </div>
            `;
        }
    }

    renderFileTree(items, container, level = 0) {
        container.innerHTML = '';

        items.forEach(item => {
            const itemElement = this.createTreeItem(item, level);
            container.appendChild(itemElement);

            if (item.type === 'directory' && item.children) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children collapsed';
                this.renderFileTree(item.children, childrenContainer, level + 1);
                container.appendChild(childrenContainer);
            }
        });
    }

    createTreeItem(item, level) {
        const element = document.createElement('div');
        element.className = `tree-item ${item.type}`;
        if (item.name.endsWith('.md')) {
            element.classList.add('markdown');
        }

        element.style.paddingLeft = `${16 + level * 12}px`;
        element.dataset.path = item.path;
        element.dataset.type = item.type;
        element.dataset.name = item.name.toLowerCase();

        const iconClass = this.getFileIcon(item);

        element.innerHTML = `
            <div class="tree-icon">
                <i class="${iconClass}"></i>
            </div>
            <span class="tree-item-name">${item.name}</span>
        `;

        if (item.type === 'directory') {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDirectory(element);
            });
        } else {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectTreeItem(element);
                this.openFile(item.path);
            });
        }

        return element;
    }

    getFileIcon(item) {
        if (item.type === 'directory') {
            return 'fas fa-folder';
        }

        const ext = item.name.split('.').pop().toLowerCase();
        const iconMap = {
            'md': 'fab fa-markdown',
            'json': 'fas fa-file-code',
            'js': 'fab fa-js-square',
            'ts': 'fab fa-js-square',
            'css': 'fab fa-css3-alt',
            'html': 'fab fa-html5',
            'py': 'fab fa-python',
            'java': 'fab fa-java',
            'php': 'fab fa-php',
            'xml': 'fas fa-file-code',
            'yml': 'fas fa-file-code',
            'yaml': 'fas fa-file-code',
            'txt': 'fas fa-file-alt',
            'pdf': 'fas fa-file-pdf',
            'png': 'fas fa-file-image',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'svg': 'fas fa-file-image'
        };

        return iconMap[ext] || 'fas fa-file';
    }

    selectTreeItem(element) {
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('selected');
        });
        element.classList.add('selected');
    }

    toggleDirectory(element) {
        const isExpanded = element.classList.contains('expanded');
        const childrenContainer = element.nextElementSibling;
        const icon = element.querySelector('i');

        if (childrenContainer && childrenContainer.classList.contains('tree-children')) {
            if (isExpanded) {
                element.classList.remove('expanded');
                childrenContainer.classList.add('collapsed');
                icon.className = 'fas fa-folder';
            } else {
                element.classList.add('expanded');
                childrenContainer.classList.remove('collapsed');
                icon.className = 'fas fa-folder-open';
            }
        }
    }

    filterFiles(query) {
        const items = document.querySelectorAll('.tree-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const name = item.dataset.name;
            const path = item.dataset.path?.toLowerCase() || '';

            if (!query || name.includes(lowerQuery) || path.includes(lowerQuery)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });

        if (query) {
            document.querySelectorAll('.tree-children').forEach(children => {
                children.classList.remove('collapsed');
            });
            document.querySelectorAll('.tree-item.directory').forEach(dir => {
                dir.classList.add('expanded');
                const icon = dir.querySelector('i');
                if (icon) icon.className = 'fas fa-folder-open';
            });
        }
    }

    async openFile(filePath) {
        let tabId = this.findTabByPath(filePath);

        if (tabId) {
            this.switchTab(tabId);
            return;
        }

        tabId = this.generateTabId();

        try {
            const response = await fetch(`/api/file/${filePath}`);
            if (!response.ok) {
                throw new Error('Failed to load file');
            }

            const fileData = await response.json();
            this.createTab(tabId, filePath, fileData);
            this.switchTab(tabId);

        } catch (error) {
            console.error('Error opening file:', error);
            this.showError(`Failed to open file: ${filePath}`);
        }
    }

    createTab(tabId, filePath, fileData) {
        const fileName = filePath.split(/[/\\]/).pop();

        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tabId = tabId;
        tab.innerHTML = `
            <span class="tab-title" title="${filePath}">${fileName}</span>
            <button class="tab-close" title="Close tab">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.getElementById('tab-list').appendChild(tab);

        const content = document.createElement('div');
        content.className = 'tab-content';
        content.dataset.tabId = tabId;

        this.renderFileContent(content, fileData);

        document.getElementById('content-area').appendChild(content);

        this.tabs.set(tabId, {
            path: filePath,
            type: fileData.type,
            element: tab,
            content: content
        });

        this.hideWelcomeScreen();
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.element.classList.add('active');
            tab.content.classList.add('active');
            this.activeTabId = tabId;
        }
    }

    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.element.remove();
            tab.content.remove();
            this.tabs.delete(tabId);

            if (this.activeTabId === tabId) {
                const remainingTabs = Array.from(this.tabs.keys());
                if (remainingTabs.length > 0) {
                    this.switchTab(remainingTabs[remainingTabs.length - 1]);
                } else {
                    this.showWelcomeScreen();
                }
            }
        }
    }

    closeAllTabs() {
        this.tabs.forEach((tab) => {
            tab.element.remove();
            tab.content.remove();
        });

        this.tabs.clear();
        this.activeTabId = null;
        this.showWelcomeScreen();

        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('selected');
        });
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }

    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
        }
    }

    findTabByPath(filePath) {
        for (const [tabId, tab] of this.tabs) {
            if (tab.path === filePath) {
                return tabId;
            }
        }
        return null;
    }

    generateTabId() {
        return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async handleFileChange(filePath) {
        const tabId = this.findTabByPath(filePath);
        if (tabId) {
            try {
                const response = await fetch(`/api/file/${filePath}`);
                if (!response.ok) {
                    throw new Error('Failed to reload file');
                }

                const fileData = await response.json();
                const tab = this.tabs.get(tabId);

                tab.content.className = 'tab-content';
                this.renderFileContent(tab.content, fileData);

                this.tabs.set(tabId, { ...tab, type: fileData.type });

                if (this.activeTabId === tabId) {
                    tab.content.classList.add('active');
                }

                console.log(`Reloaded content for: ${filePath}`);

            } catch (error) {
                console.error('Error reloading file:', error);
            }
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notification error';
        errorDiv.innerHTML = `
            <button class="delete" title="Close">&times;</button>
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        `;

        const contentArea = document.getElementById('content-area');
        contentArea.appendChild(errorDiv);

        errorDiv.querySelector('.delete').addEventListener('click', () => {
            errorDiv.remove();
        });

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    renderFileContent(contentElement, fileData) {
        if (fileData.type === 'markdown') {
            contentElement.className += ' markdown-content';
            contentElement.innerHTML = fileData.html;
            setTimeout(() => {
                this.rehighlightCodeInElement(contentElement);
            }, 0);
        } else {
            contentElement.innerHTML = `<div class="text-content">${this.escapeHtml(fileData.content)}</div>`;
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
        this.updateHighlightTheme();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeIcon();
        this.updateHighlightTheme();
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        const icon = themeToggle.querySelector('i');
        const currentThemeConfig = this.currentTheme === 'dark' ? this.THEMES.DARK : this.THEMES.LIGHT;

        icon.className = currentThemeConfig.icon;
        themeToggle.title = currentThemeConfig.title;
    }

    updateHighlightTheme() {
        const existingTheme = document.querySelector('link[href*="highlight.js"]');
        const currentThemeConfig = this.currentTheme === 'dark' ? this.THEMES.DARK : this.THEMES.LIGHT;

        if (existingTheme) {
            existingTheme.addEventListener('load', () => {
                this.rehighlightCode();
            }, { once: true });
            existingTheme.href = currentThemeConfig.highlightCss;
        } else {
            this.rehighlightCode();
        }
    }

    rehighlightCode() {
        this.rehighlightCodeInElement(document);
    }

    rehighlightCodeInElement(element) {
        element.querySelectorAll('pre code').forEach((block) => {
            // Clear existing highlight.js classes and styles
            block.removeAttribute('data-highlighted');
            block.className = block.className.replace(/hljs[^\s]*/g, '').trim();

            // Reapply syntax highlighting
            hljs.highlightElement(block);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpecViewer();
});