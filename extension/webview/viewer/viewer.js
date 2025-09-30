const vscode = acquireVsCodeApi();

// Read initial data from script tag
const dataElement = document.getElementById('viewer-data');
let currentViewMode = dataElement?.dataset.viewMode || 'preview';
let rawContent = '';
try {
    rawContent = JSON.parse(dataElement?.textContent || '""');
} catch (e) {
    console.error('Failed to parse raw content:', e);
}

let outlineVisible = false;
let currentOutline = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    hljs.highlightAll();
    generateOutline();
});

function setupEventListeners() {
    document.getElementById('view-toggle')?.addEventListener('click', toggleViewMode);
    document.getElementById('outline-toggle')?.addEventListener('click', toggleOutline);
    setupResizeHandle();
}

function toggleViewMode() {
    currentViewMode = currentViewMode === 'preview' ? 'source' : 'preview';
    const isSource = currentViewMode === 'source';

    document.getElementById('markdown-preview').style.display = isSource ? 'none' : 'block';
    document.getElementById('markdown-source').style.display = isSource ? 'block' : 'none';
    document.getElementById('view-toggle-text').textContent = isSource ? 'Preview' : 'Source';

    if (isSource) hljs.highlightAll();
    generateOutline();
}

function toggleOutline() {
    outlineVisible = !outlineVisible;
    const panel = document.getElementById('outline-panel');
    const handle = document.getElementById('outline-resize-handle');
    const button = document.getElementById('outline-toggle');

    panel.style.display = outlineVisible ? 'flex' : 'none';
    handle.style.display = outlineVisible ? 'block' : 'none';
    button.style.backgroundColor = outlineVisible ? 'var(--vscode-button-background)' : '';
    button.style.color = outlineVisible ? 'var(--vscode-button-foreground)' : '';

    if (outlineVisible) generateOutline();
}

function generateOutline() {
    currentOutline = parseMarkdownOutline(rawContent);
    renderOutline();
}

function parseMarkdownOutline(content) {
    const outline = [];
    let headingId = 0;
    let inCodeBlock = false;

    content.split('\n').forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
        } else if (!inCodeBlock) {
            const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                outline.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    id: `heading-${++headingId}`,
                    lineNumber: i + 1
                });
            }
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
    if (currentViewMode !== 'preview') return;

    const contentArea = document.getElementById('markdown-preview');
    const target = Array.from(contentArea.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .find(h => h.textContent.trim() === headingItem.text);

    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setActiveOutlineItem(activeItem) {
    document.querySelectorAll('.outline-item').forEach(item => item.classList.remove('active'));
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