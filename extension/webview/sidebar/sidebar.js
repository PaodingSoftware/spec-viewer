(function() {
    const vscode = acquireVsCodeApi();

    let fileTree = [];
    let expandedDirs = new Set();
    let selectedFile = null;

    // Restore previous state
    const previousState = vscode.getState();
    if (previousState) {
        expandedDirs = new Set(previousState.expandedDirs || []);
        selectedFile = previousState.selectedFile || null;
    }

    // Initialize
    window.addEventListener('load', () => {
        setupEventListeners();
        requestFileTree();
    });

    function setupEventListeners() {
        document.getElementById('search-input').addEventListener('input', (e) => {
            filterTree(e.target.value);
        });

        document.getElementById('file-tree').addEventListener('click', (e) => {
            const treeItem = e.target.closest('.tree-item');
            if (!treeItem) return;

            const filePath = treeItem.dataset.path;
            const isDirectory = treeItem.dataset.type === 'directory';

            if (isDirectory) {
                toggleDirectory(filePath);
            } else {
                selectFile(filePath);
                vscode.postMessage({
                    command: 'openFile',
                    path: filePath
                });
            }
        });
    }

    function requestFileTree() {
        vscode.postMessage({ command: 'getTree' });
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'treeData':
                fileTree = message.tree;
                renderTree();
                break;
            case 'collapseAll':
                collapseAll();
                break;
        }
    });

    function renderTree(filter = '') {
        const container = document.getElementById('file-tree');
        container.innerHTML = '';

        if (fileTree.length === 0) {
            container.innerHTML = '<div class="loading">No files found</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        renderTreeItems(fileTree, fragment, 0, filter);
        container.appendChild(fragment);
    }

    function renderTreeItems(items, container, level, filter) {
        items.forEach(item => {
            const matchesFilter = !filter || item.name.toLowerCase().includes(filter.toLowerCase());
            const hasMatchingChildren = item.children && hasMatchInChildren(item.children, filter);

            if (!matchesFilter && !hasMatchingChildren) {
                return;
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = item.type === 'directory' ? 'tree-item directory' : 'tree-item';
            if (selectedFile === item.path) itemDiv.classList.add('selected');
            itemDiv.dataset.path = item.path;
            itemDiv.dataset.type = item.type;

            const indent = document.createElement('span');
            indent.className = 'tree-item-indent';
            indent.style.width = (level * 16) + 'px';
            itemDiv.appendChild(indent);

            if (item.type === 'directory') {
                const isExpanded = expandedDirs.has(item.path);
                const chevron = document.createElement('i');
                chevron.className = 'tree-item-icon tree-item-chevron fas fa-chevron-right';
                if (isExpanded) chevron.classList.add('expanded');
                itemDiv.appendChild(chevron);

                const folderIcon = document.createElement('i');
                folderIcon.className = `tree-item-icon fas ${isExpanded ? 'fa-folder-open' : 'fa-folder'}`;
                itemDiv.appendChild(folderIcon);
            } else {
                const fileIcon = document.createElement('i');
                fileIcon.className = `tree-item-icon fas ${getFileIcon(item.name)}`;
                itemDiv.appendChild(fileIcon);
            }

            const label = document.createElement('span');
            label.className = 'tree-item-label';
            label.textContent = item.name;
            itemDiv.appendChild(label);

            container.appendChild(itemDiv);

            if (item.type === 'directory' && item.children && expandedDirs.has(item.path)) {
                renderTreeItems(item.children, container, level + 1, filter);
            }
        });
    }

    function hasMatchInChildren(children, filter) {
        if (!filter) return false;
        return children.some(child =>
            child.name.toLowerCase().includes(filter.toLowerCase()) ||
            (child.children && hasMatchInChildren(child.children, filter))
        );
    }

    function toggleDirectory(path) {
        expandedDirs.has(path) ? expandedDirs.delete(path) : expandedDirs.add(path);
        saveState();
        renderTree(document.getElementById('search-input').value);
    }

    function selectFile(path) {
        selectedFile = path;
        saveState();
        renderTree(document.getElementById('search-input').value);
    }

    function saveState() {
        vscode.setState({
            expandedDirs: Array.from(expandedDirs),
            selectedFile: selectedFile
        });
    }

    function collapseAll() {
        expandedDirs.clear();
        saveState();
        renderTree(document.getElementById('search-input').value);
    }

    function filterTree(filter) {
        if (filter) {
            // Auto-expand all directories when filtering
            expandAllDirs(fileTree);
        }
        renderTree(filter);
    }

    function expandAllDirs(items) {
        items.forEach(item => {
            if (item.type === 'directory') {
                expandedDirs.add(item.path);
                if (item.children) {
                    expandAllDirs(item.children);
                }
            }
        });
    }

})();