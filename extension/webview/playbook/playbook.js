(function () {
    const vscode = acquireVsCodeApi();

    let playbookData = null;

    function init() {
        const dataElement = document.getElementById('playbook-data');
        if (dataElement) {
            try {
                playbookData = JSON.parse(dataElement.textContent);
                render(playbookData);
            } catch (error) {
                console.error('Failed to parse playbook data:', error);
            }
        }

        document.getElementById('refresh-btn').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });
    }

    function render(data) {
        const contentEl = document.getElementById('playbook-content');
        const emptyStateEl = document.getElementById('empty-state');
        const countEl = document.getElementById('key-points-count');

        const keyPoints = data.key_points || [];

        if (keyPoints.length === 0) {
            contentEl.style.display = 'none';
            emptyStateEl.style.display = 'flex';
            countEl.textContent = '';
            return;
        }

        contentEl.style.display = 'block';
        emptyStateEl.style.display = 'none';
        countEl.textContent = `${keyPoints.length} key point${keyPoints.length > 1 ? 's' : ''}`;

        let html = '';

        if (data.version || data.last_updated) {
            html += '<div class="meta-info">';
            if (data.version) {
                html += `<span class="meta-item"><i class="fas fa-code-branch"></i> Version ${escapeHtml(data.version)}</span>`;
            }
            if (data.last_updated) {
                html += `<span class="meta-item"><i class="fas fa-clock"></i> Updated ${formatDate(data.last_updated)}</span>`;
            }
            html += '</div>';
        }

        html += '<div class="key-points-grid">';

        keyPoints.forEach(keyPoint => {
            const scoreClass = keyPoint.score > 0 ? 'positive' : keyPoint.score < 0 ? 'negative' : 'neutral';
            const scoreDisplay = keyPoint.score > 0 ? `+${keyPoint.score}` : keyPoint.score;

            html += `
                <div class="key-point-card" data-name="${escapeHtml(keyPoint.name)}">
                    <div class="card-header">
                        <span class="key-point-name">${escapeHtml(keyPoint.name)}</span>
                        <span class="key-point-score ${scoreClass}">
                            ${scoreDisplay}
                        </span>
                    </div>
                    <div class="card-body">
                        <p class="key-point-text">${escapeHtml(keyPoint.text)}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn-delete" data-name="${escapeHtml(keyPoint.name)}" title="Delete key point">
                            <i class="fas fa-trash-alt"></i>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        contentEl.innerHTML = html;

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.getAttribute('data-name');
                vscode.postMessage({
                    command: 'deleteKeyPoint',
                    name: name
                });
            });
        });
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleString();
        } catch {
            return isoString;
        }
    }

    window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'update') {
            playbookData = message.data;
            render(playbookData);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
