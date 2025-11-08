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
    renderGraphviz();
    renderMermaid();
    generateOutline();
});

function setupEventListeners() {
    document.getElementById('refresh-btn')?.addEventListener('click', refreshFile);
    document.getElementById('view-toggle')?.addEventListener('click', toggleViewMode);
    document.getElementById('outline-toggle')?.addEventListener('click', toggleOutline);
    setupResizeHandle();
    setupLinkHandler();
}

function setupLinkHandler() {
    // Intercept clicks on links in markdown preview
    document.getElementById('markdown-preview')?.addEventListener('click', (e) => {
        // Check if clicked element is a link or inside a link
        let target = e.target;
        while (target && target.tagName !== 'A') {
            target = target.parentElement;
            if (target === e.currentTarget) {
                return;
            }
        }

        if (target && target.tagName === 'A') {
            const href = target.getAttribute('href');
            if (!href) return;

            // Check if this is a relative link (not http/https/mailto/etc)
            if (!href.match(/^([a-z]+:)?\/\//i) && !href.startsWith('mailto:') && !href.startsWith('#')) {
                e.preventDefault();

                // Send message to extension to open the file
                vscode.postMessage({
                    command: 'openLinkedFile',
                    href: href
                });
            }
        }
    });
}

async function renderGraphviz() {
    // Check if Viz is available
    if (typeof Viz === 'undefined') {
        console.warn('Viz.js library not loaded');
        return;
    }

    const containers = document.querySelectorAll('.graphviz-container');
    if (containers.length === 0) return;

    try {
        // Initialize Viz instance (only once for all graphs)
        const viz = await Viz.instance();

        for (const container of containers) {
            const dotCode = container.dataset.dot;
            if (!dotCode) continue;

            try {
                // Render DOT to SVG
                const svg = viz.renderSVGElement(dotCode);

                // Clear loading message and add SVG
                container.innerHTML = '';
                container.appendChild(svg);

                // Add rendered class
                container.classList.add('graphviz-rendered');
            } catch (error) {
                console.error('Graphviz rendering error:', error);
                container.innerHTML = `<div class="graphviz-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Failed to render Graphviz diagram:</strong><br>
                    <code>${escapeHtml(error.message)}</code>
                </div>`;
            }
        }
    } catch (error) {
        console.error('Failed to initialize Viz.js:', error);
    }
}

async function renderMermaid() {
    // Check if Mermaid is available
    if (typeof window.mermaid === 'undefined') {
        console.warn('Mermaid library not loaded');
        return;
    }

    const containers = document.querySelectorAll('.mermaid-container');
    if (containers.length === 0) return;

    try {
        // Initialize Mermaid
        window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });

        for (const container of containers) {
            const mermaidCode = container.dataset.mermaid;
            if (!mermaidCode) continue;

            try {
                // Generate unique ID for each diagram
                const diagramId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                
                // Render Mermaid diagram
                const { svg } = await window.mermaid.render(diagramId, mermaidCode);

                // Clear loading message and set SVG
                container.innerHTML = svg;

                // Add rendered class
                container.classList.add('mermaid-rendered');
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                container.innerHTML = `<div class="mermaid-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Failed to render Mermaid diagram:</strong><br>
                    <code>${escapeHtml(error.message)}</code>
                </div>`;
            }
        }
    } catch (error) {
        console.error('Failed to initialize Mermaid:', error);
    }
}

function refreshFile() {
    const refreshBtn = document.getElementById('refresh-btn');
    const icon = refreshBtn.querySelector('i');

    // Add spinning animation
    icon.style.animation = 'spin 1s linear';

    // Send refresh request to extension
    vscode.postMessage({
        command: 'refreshFile'
    });

    // Remove animation after 1 second
    setTimeout(() => {
        icon.style.animation = '';
    }, 1000);
}

function toggleViewMode() {
    currentViewMode = currentViewMode === 'preview' ? 'source' : 'preview';
    const isSource = currentViewMode === 'source';

    document.getElementById('markdown-preview').style.display = isSource ? 'none' : 'block';
    document.getElementById('markdown-source').style.display = isSource ? 'block' : 'none';
    document.getElementById('view-toggle-text').textContent = isSource ? 'Preview' : 'Source';

    if (isSource) {
        hljs.highlightAll();
    } else {
        // Re-render diagrams when switching back to preview
        renderGraphviz();
        renderMermaid();
    }
    generateOutline();

    // Notify extension about view mode change
    vscode.postMessage({
        command: 'viewModeChanged',
        viewMode: currentViewMode
    });
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
