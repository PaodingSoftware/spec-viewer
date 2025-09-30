const vscode = acquireVsCodeApi();

let currentViewMode = '{{viewMode}}';
let outlineVisible = false;
let currentOutline = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    detectAndSetTheme();
    setupEventListeners();
    hljs.highlightAll();
    generateOutline();
});

function detectAndSetTheme() {
    // Detect VSCode theme by checking computed styles
    const bgColor = getComputedStyle(document.body).getPropertyValue('--vscode-editor-background');
    const themeLink = document.getElementById('highlight-theme');

    if (!themeLink) return;

    // Calculate brightness from background color
    const isDark = isColorDark(bgColor);

    if (isDark) {
        themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css';
    } else {
        themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
    }

    // Re-highlight after theme loads
    themeLink.addEventListener('load', () => {
        hljs.highlightAll();
    }, { once: true });
}

function isColorDark(color) {
    if (!color) return false;

    // Parse RGB values
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return false;

    // Calculate relative luminance
    const r = parseInt(rgb[0]);
    const g = parseInt(rgb[1]);
    const b = parseInt(rgb[2]);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5;
}

function setupEventListeners() {
    document.getElementById('view-toggle')?.addEventListener('click', toggleViewMode);
    document.getElementById('outline-toggle')?.addEventListener('click', toggleOutline);
    setupResizeHandle();
}

function toggleViewMode() {
    currentViewMode = currentViewMode === 'preview' ? 'source' : 'preview';

    const previewEl = document.getElementById('markdown-preview');
    const sourceEl = document.getElementById('markdown-source');
    const toggleText = document.getElementById('view-toggle-text');

    if (currentViewMode === 'source') {
        previewEl.style.display = 'none';
        sourceEl.style.display = 'block';
        toggleText.textContent = 'Preview';
        hljs.highlightAll();
    } else {
        previewEl.style.display = 'block';
        sourceEl.style.display = 'none';
        toggleText.textContent = 'Source';
    }

    generateOutline();
}

function toggleOutline() {
    outlineVisible = !outlineVisible;
    const panel = document.getElementById('outline-panel');
    const handle = document.getElementById('outline-resize-handle');
    const button = document.getElementById('outline-toggle');

    if (outlineVisible) {
        panel.style.display = 'flex';
        handle.style.display = 'block';
        button.style.backgroundColor = 'var(--vscode-button-background)';
        button.style.color = 'var(--vscode-button-foreground)';
        generateOutline();
    } else {
        panel.style.display = 'none';
        handle.style.display = 'none';
        button.style.backgroundColor = '';
        button.style.color = '';
    }
}

function generateOutline() {
    const rawContent = {{rawContentJson}};
    currentOutline = parseMarkdownOutline(rawContent);
    renderOutline();
}

function parseMarkdownOutline(content) {
    const outline = [];
    const lines = content.split('\n');
    let headingId = 0;
    let inCodeBlock = false;

    lines.forEach((line, i) => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            return;
        }

        if (inCodeBlock) return;

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

function renderOutline() {
    const container = document.getElementById('outline-content');
    if (!container) return;

    if (currentOutline.length === 0) {
        container.innerHTML = `
            <div class="outline-placeholder">
                <i class="fas fa-info-circle"></i>
                <span>No outline available</span>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    currentOutline.forEach(item => {
        const element = document.createElement('div');
        element.className = `outline-item level-${item.level}`;
        element.dataset.id = item.id;
        element.innerHTML = `<div class="outline-item-content">${escapeHtml(item.text)}</div>`;

        element.addEventListener('click', () => {
            scrollToHeading(item);
            setActiveOutlineItem(element);
        });

        container.appendChild(element);
    });
}

function scrollToHeading(headingItem) {
    if (currentViewMode === 'preview') {
        const contentArea = document.getElementById('markdown-preview');
        const headings = contentArea.querySelectorAll('h1, h2, h3, h4, h5, h6');

        let target = Array.from(headings).find(h => h.textContent.trim() === headingItem.text);

        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function setActiveOutlineItem(activeItem) {
    document.querySelectorAll('.outline-item').forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

function setupResizeHandle() {
    const handle = document.getElementById('outline-resize-handle');
    const panel = document.getElementById('outline-panel');
    if (!handle || !panel) return;

    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        const startX = e.clientX;
        const startWidth = panel.offsetWidth;

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const deltaX = startX - e.clientX;
            const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
            panel.style.width = newWidth + 'px';
        };

        const handleMouseUp = () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}