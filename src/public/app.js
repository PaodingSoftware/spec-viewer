class SpecViewer {
    constructor() {
        // Initialize core state
        this.socket = io();
        this.tabs = new Map();
        this.activeTabId = null;
        this.fileTree = null;

        // Initialize UI state
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.viewMode = 'preview';
        this.outlineVisible = false;
        this.currentOutline = [];

        // Initialize resize state
        this.isResizing = false;
        this.isOutlineResizing = false;

        // Theme configuration
        this.THEMES = {
            light: {
                icon: 'fas fa-moon',
                title: 'Toggle dark mode',
                highlightCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css'
            },
            dark: {
                icon: 'fas fa-sun',
                title: 'Toggle light mode',
                highlightCss: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css'
            }
        };

        this.init();
    }

    // ===== INITIALIZATION =====
    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.setupResizeHandlers();
        this.loadFileTree();
        this.updateUI();
    }

    setupEventListeners() {
        const events = [
            ['theme-toggle', 'click', () => this.toggleTheme()],
            ['refresh-btn', 'click', () => this.loadFileTree()],
            ['close-all-tabs', 'click', () => this.closeAllTabs()],
            ['view-toggle', 'click', () => this.toggleViewMode()],
            ['outline-toggle', 'click', () => this.toggleOutline()],
            ['tab-list', 'click', (e) => this.handleTabClick(e)],
            ['search-files', 'input', (e) => this.filterFiles(e.target.value)],
            ['search-files', 'keydown', (e) => this.handleSearchKeydown(e)]
        ];

        events.forEach(([id, event, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener(event, handler);
        });
    }

    setupSocketListeners() {
        this.socket.on('file-changed', (data) => this.handleFileChange(data.path));
        this.socket.on('tree-changed', () => this.loadFileTree());
        this.socket.on('connect', () => console.log('Connected to server'));
        this.socket.on('disconnect', () => console.log('Disconnected from server'));
    }

    setupResizeHandlers() {
        this.setupResizeHandle('resize-handle', 'sidebar', false);
        this.setupResizeHandle('outline-resize-handle', 'outline-panel', true);
    }

    setupResizeHandle(handleId, panelId, isOutline) {
        const handle = document.getElementById(handleId);
        const panel = document.getElementById(panelId);
        if (!handle || !panel) return;

        handle.addEventListener('mousedown', (e) => {
            const resizeProperty = isOutline ? 'isOutlineResizing' : 'isResizing';
            this[resizeProperty] = true;

            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';

            const startX = e.clientX;
            const startWidth = panel.offsetWidth;

            const handleMouseMove = (e) => {
                if (!this[resizeProperty]) return;
                const deltaX = isOutline ? startX - e.clientX : e.clientX - startX;
                const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
                panel.style.width = `${newWidth}px`;
            };

            const handleMouseUp = () => {
                this[resizeProperty] = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    // ===== THEME MANAGEMENT =====
    setupTheme() {
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
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const icon = toggle.querySelector('i');
        const theme = this.THEMES[this.currentTheme];
        if (icon && theme) {
            icon.className = theme.icon;
            toggle.title = theme.title;
        }
    }

    updateHighlightTheme() {
        const existingTheme = document.querySelector('link[href*="highlight.js"]');
        const theme = this.THEMES[this.currentTheme];

        if (existingTheme && theme) {
            existingTheme.addEventListener('load', () => this.rehighlightCode(), { once: true });
            existingTheme.href = theme.highlightCss;
        } else {
            this.rehighlightCode();
        }
    }

    // ===== FILE TREE MANAGEMENT =====
    async loadFileTree() {
        const container = document.getElementById('fileTree');
        if (!container) return;

        try {
            container.innerHTML = this.createLoadingHTML();
            const response = await fetch('/api/tree');
            if (!response.ok) throw new Error('Failed to load file tree');

            const tree = await response.json();
            this.fileTree = tree;
            this.renderFileTree(tree, container);
        } catch (error) {
            console.error('Error loading file tree:', error);
            container.innerHTML = this.createErrorHTML('Failed to load files');
        }
    }

    renderFileTree(items, container, level = 0) {
        container.innerHTML = '';

        items.forEach(item => {
            const element = this.createTreeItem(item, level);
            container.appendChild(element);

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
        if (item.name.endsWith('.md')) element.classList.add('markdown');

        element.style.paddingLeft = `${16 + level * 12}px`;
        Object.assign(element.dataset, {
            path: item.path,
            type: item.type,
            name: item.name.toLowerCase()
        });

        element.innerHTML = `
            <div class="tree-icon">
                <i class="${this.getFileIcon(item)}"></i>
            </div>
            <span class="tree-item-name">${item.name}</span>
        `;

        element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.type === 'directory') {
                this.toggleDirectory(element);
            } else {
                this.selectTreeItem(element);
                this.openFile(item.path);
            }
        });

        return element;
    }

    getFileIcon(item) {
        if (item.type === 'directory') return 'fas fa-folder';

        const iconMap = {
            'md': 'fab fa-markdown', 'json': 'fas fa-file-code', 'js': 'fab fa-js-square',
            'ts': 'fab fa-js-square', 'css': 'fab fa-css3-alt', 'html': 'fab fa-html5',
            'py': 'fab fa-python', 'java': 'fab fa-java', 'php': 'fab fa-php',
            'xml': 'fas fa-file-code', 'yml': 'fas fa-file-code', 'yaml': 'fas fa-file-code',
            'txt': 'fas fa-file-alt', 'pdf': 'fas fa-file-pdf', 'png': 'fas fa-file-image',
            'jpg': 'fas fa-file-image', 'jpeg': 'fas fa-file-image', 'gif': 'fas fa-file-image',
            'svg': 'fas fa-file-image'
        };

        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        return iconMap[ext] || 'fas fa-file';
    }

    filterFiles(query) {
        const items = document.querySelectorAll('.tree-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const name = item.dataset.name || '';
            const path = item.dataset.path?.toLowerCase() || '';
            const isVisible = !query || name.includes(lowerQuery) || path.includes(lowerQuery);
            item.classList.toggle('hidden', !isVisible);
        });

        if (query) {
            // Expand all directories when searching
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

        if (childrenContainer?.classList.contains('tree-children')) {
            element.classList.toggle('expanded', !isExpanded);
            childrenContainer.classList.toggle('collapsed', isExpanded);
            if (icon) {
                icon.className = isExpanded ? 'fas fa-folder' : 'fas fa-folder-open';
            }
        }
    }

    // ===== TAB MANAGEMENT =====
    async openFile(filePath) {
        // Check if tab already exists
        let tabId = this.findTabByPath(filePath);
        if (tabId) {
            this.switchTab(tabId);
            return;
        }

        // Create new tab
        tabId = this.generateTabId();

        try {
            const response = await fetch(`/api/file/${filePath}`);
            if (!response.ok) throw new Error('Failed to load file');

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

        // Create tab element
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tabId = tabId;
        tab.innerHTML = `
            <span class="tab-title" title="${filePath}">${fileName}</span>
            <button class="tab-close" title="Close tab">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.getElementById('tab-list')?.appendChild(tab);

        // Create content element
        const content = document.createElement('div');
        content.className = 'tab-content';
        content.dataset.tabId = tabId;
        this.renderFileContent(content, fileData);
        document.getElementById('content-area')?.appendChild(content);

        // Store tab data
        this.tabs.set(tabId, {
            id: tabId, path: filePath, type: fileData.type,
            element: tab, content: content,
            rawContent: fileData.content, htmlContent: fileData.html || null
        });

        this.hideWelcomeScreen();
    }

    switchTab(tabId) {
        // Clear active state from all tabs
        document.querySelectorAll('.tab, .tab-content').forEach(el => {
            el.classList.remove('active');
        });

        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.element.classList.add('active');
            tab.content.classList.add('active');
            this.activeTabId = tabId;
            this.updateOutlineIfVisible();
        }
    }

    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.element.remove();
        tab.content.remove();
        this.tabs.delete(tabId);

        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                this.showWelcomeScreen();
                this.activeTabId = null;
            }
        }
    }

    closeAllTabs() {
        this.tabs.forEach(tab => {
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

    // ===== VIEW MODE MANAGEMENT =====
    toggleViewMode() {
        this.viewMode = this.viewMode === 'preview' ? 'source' : 'preview';
        this.refreshActiveTabContent();
        this.updateUI();
    }

    refreshActiveTabContent() {
        this.tabs.forEach(tab => {
            if (tab.type === 'markdown') {
                this.renderTabContent(tab);
            }
        });
        this.updateOutlineIfVisible();
    }

    renderTabContent(tab) {
        if (tab.type !== 'markdown') return;

        if (this.viewMode === 'source') {
            tab.content.className = 'tab-content source-content';
            tab.content.innerHTML = `<pre class="source-view"><code class="language-markdown">${this.escapeHtml(tab.rawContent)}</code></pre>`;
        } else {
            tab.content.className = 'tab-content markdown-content';
            tab.content.innerHTML = tab.htmlContent;
        }

        setTimeout(() => this.rehighlightCodeInElement(tab.content), 0);

        if (this.activeTabId === tab.id) {
            tab.content.classList.add('active');
        }
    }

    renderFileContent(contentElement, fileData) {
        if (fileData.type === 'markdown') {
            this.renderTabContent({
                content: contentElement,
                type: fileData.type,
                rawContent: fileData.content,
                htmlContent: fileData.html
            });
        } else {
            contentElement.innerHTML = `<div class="text-content">${this.escapeHtml(fileData.content)}</div>`;
        }
    }

    // ===== OUTLINE MANAGEMENT =====
    toggleOutline() {
        this.outlineVisible = !this.outlineVisible;
        this.updateOutlinePanel();
        this.updateUI();
    }

    updateOutlinePanel() {
        const panel = document.getElementById('outline-panel');
        const handle = document.getElementById('outline-resize-handle');

        if (this.outlineVisible) {
            if (panel) panel.style.display = 'flex';
            if (handle) handle.style.display = 'block';
            this.generateOutline();
        } else {
            if (panel) panel.style.display = 'none';
            if (handle) handle.style.display = 'none';
        }
    }

    generateOutline() {
        if (!this.activeTabId) {
            this.showOutlinePlaceholder();
            return;
        }

        const tab = this.tabs.get(this.activeTabId);
        if (!tab || tab.type !== 'markdown') {
            this.showOutlinePlaceholder();
            return;
        }

        this.currentOutline = this.parseMarkdownOutline(tab.rawContent);
        this.renderOutline();
    }

    parseMarkdownOutline(content) {
        const outline = [];
        const lines = content.split('\n');
        let headingId = 0;
        let inCodeBlock = false;
        let inIndentedCodeBlock = false;

        lines.forEach((line, i) => {
            const trimmedLine = line.trim();

            // Check for fenced code blocks
            if (trimmedLine.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                return;
            }

            // Check for indented code blocks
            if (line.match(/^(\s{4,}|\t)/)) {
                inIndentedCodeBlock = true;
            } else if (trimmedLine === '' && inIndentedCodeBlock) {
                return; // Empty line in indented code block
            } else {
                inIndentedCodeBlock = false;
            }

            // Skip heading detection if inside code blocks
            if (inCodeBlock || inIndentedCodeBlock) return;

            const match = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                outline.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    id: `heading-${++headingId}`,
                    lineNumber: i + 1
                });
            }
        });

        return outline;
    }

    renderOutline() {
        const container = document.getElementById('outline-content');
        if (!container) return;

        if (this.currentOutline.length === 0) {
            this.showOutlinePlaceholder();
            return;
        }

        container.innerHTML = '';

        this.currentOutline.forEach(item => {
            const element = document.createElement('div');
            element.className = `outline-item level-${item.level}`;
            element.dataset.id = item.id;
            element.dataset.lineNumber = item.lineNumber;
            element.innerHTML = `<div class="outline-item-content">${this.escapeHtml(item.text)}</div>`;

            element.addEventListener('click', () => {
                this.scrollToHeading(item);
                this.setActiveOutlineItem(element);
            });

            container.appendChild(element);
        });
    }

    scrollToHeading(headingItem) {
        if (!this.activeTabId) return;

        const tab = this.tabs.get(this.activeTabId);
        if (!tab || tab.type !== 'markdown') return;

        // For source mode, scroll to line number
        if (this.viewMode === 'source') {
            this.scrollToLineInSource(headingItem.lineNumber);
            return;
        }

        // For preview mode, try multiple matching strategies
        const headings = tab.content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let target = null;

        // Strategy 1: Exact text match
        target = Array.from(headings).find(h => h.textContent.trim() === headingItem.text);

        // Strategy 2: Match by level and position (for translated content)
        if (!target) {
            const headingsOfSameLevel = Array.from(headings).filter(h =>
                h.tagName.toLowerCase() === `h${headingItem.level}`
            );

            const sameStyleHeadings = this.currentOutline.filter(item => item.level === headingItem.level);
            const indexInSameLevel = sameStyleHeadings.indexOf(headingItem);

            if (indexInSameLevel >= 0 && indexInSameLevel < headingsOfSameLevel.length) {
                target = headingsOfSameLevel[indexInSameLevel];
            }
        }

        // Strategy 3: Fallback to outline index
        if (!target) {
            const outlineIndex = this.currentOutline.indexOf(headingItem);
            if (outlineIndex >= 0 && outlineIndex < headings.length) {
                target = headings[outlineIndex];
            }
        }

        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    scrollToLineInSource(lineNumber) {
        const tab = this.tabs.get(this.activeTabId);
        if (!tab) return;

        const sourceContent = tab.content.querySelector('.source-view code');
        if (!sourceContent) return;

        const lines = tab.rawContent.split('\n');
        if (lineNumber <= lines.length) {
            const lineHeight = 20;
            const scrollPosition = Math.max(0, (lineNumber - 5) * lineHeight);
            tab.content.scrollTop = scrollPosition;
        }
    }

    setActiveOutlineItem(activeItem) {
        document.querySelectorAll('.outline-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    showOutlinePlaceholder() {
        const container = document.getElementById('outline-content');
        if (container) {
            container.innerHTML = `
                <div class="outline-placeholder">
                    <i class="fas fa-info-circle"></i>
                    <span>No outline available</span>
                </div>
            `;
        }
    }

    updateOutlineIfVisible() {
        if (this.outlineVisible) this.generateOutline();
    }

    // ===== UI UPDATES =====
    updateUI() {
        this.updateViewToggleButton();
        this.updateOutlineButton();
    }

    updateViewToggleButton() {
        const button = document.getElementById('view-toggle');
        this.setButtonState(button, this.viewMode === 'source', 'Switch to preview view', 'Switch to source view');
    }

    updateOutlineButton() {
        const button = document.getElementById('outline-toggle');
        const icon = button?.querySelector('i');

        this.setButtonState(button, this.outlineVisible, 'Hide outline panel', 'Show outline panel');
        if (icon) {
            icon.className = this.outlineVisible ? 'fas fa-list-alt' : 'fas fa-list';
        }
    }

    setButtonState(button, isActive, activeTitle, inactiveTitle) {
        if (!button) return;

        button.title = isActive ? activeTitle : inactiveTitle;
        if (isActive) {
            button.style.backgroundColor = 'var(--color-accent-emphasis)';
            button.style.color = '#ffffff';
        } else {
            button.style.backgroundColor = '';
            button.style.color = '';
        }
    }

    // ===== EVENT HANDLERS =====
    handleTabClick(e) {
        if (e.target.classList.contains('tab-close') || e.target.closest('.tab-close')) {
            e.stopPropagation();
            const tabElement = e.target.closest('.tab');
            if (tabElement) {
                this.closeTab(tabElement.dataset.tabId);
            }
        } else if (e.target.closest('.tab')) {
            const tabElement = e.target.closest('.tab');
            if (tabElement) {
                this.switchTab(tabElement.dataset.tabId);
            }
        }
    }

    handleSearchKeydown(e) {
        if (e.key === 'Escape') {
            e.target.value = '';
            this.filterFiles('');
        }
    }

    async handleFileChange(filePath) {
        const tabId = this.findTabByPath(filePath);
        if (!tabId) return;

        try {
            const response = await fetch(`/api/file/${filePath}`);
            if (!response.ok) throw new Error('Failed to reload file');

            const fileData = await response.json();
            const tab = this.tabs.get(tabId);

            // Update tab data
            Object.assign(tab, {
                rawContent: fileData.content,
                htmlContent: fileData.html || null,
                type: fileData.type
            });

            // Re-render content
            this.renderFileContent(tab.content, fileData);

            if (this.activeTabId === tabId) {
                tab.content.classList.add('active');
                this.updateOutlineIfVisible();
            }

            console.log(`Reloaded content for: ${filePath}`);
        } catch (error) {
            console.error('Error reloading file:', error);
        }
    }

    // ===== UTILITY METHODS =====
    findTabByPath(filePath) {
        for (const [tabId, tab] of this.tabs) {
            if (tab.path === filePath) return tabId;
        }
        return null;
    }

    generateTabId() {
        return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    rehighlightCode() {
        this.rehighlightCodeInElement(document);
    }

    rehighlightCodeInElement(element) {
        element.querySelectorAll('pre code').forEach(block => {
            block.removeAttribute('data-highlighted');
            block.className = block.className.replace(/hljs[^\s]*/g, '').trim();
            hljs.highlightElement(block);
        });
    }

    hideWelcomeScreen() {
        const screen = document.getElementById('welcome-screen');
        if (screen) screen.style.display = 'none';
    }

    showWelcomeScreen() {
        const screen = document.getElementById('welcome-screen');
        if (screen) screen.style.display = 'flex';
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
        if (contentArea) {
            contentArea.appendChild(errorDiv);
        }

        errorDiv.querySelector('.delete')?.addEventListener('click', () => errorDiv.remove());
        setTimeout(() => errorDiv.remove(), 5000);
    }

    createLoadingHTML() {
        return `
            <div class="loading-container">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading files...</span>
            </div>
        `;
    }

    createErrorHTML(message) {
        return `
            <div class="notification error">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => new SpecViewer());