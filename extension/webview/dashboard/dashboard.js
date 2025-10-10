(function () {
    const vscode = acquireVsCodeApi();

    let dashboardData = null;

    // Initialize
    window.addEventListener('load', () => {
        loadData();
        setupEventListeners();
        renderDashboard();
    });

    /**
     * Load data from script tag
     */
    function loadData() {
        const dataElement = document.getElementById('dashboard-data');
        if (dataElement) {
            try {
                dashboardData = JSON.parse(dataElement.textContent);
            } catch (error) {
                console.error('Error parsing dashboard data:', error);
                dashboardData = { topics: [], currentTopic: null, hasTopics: false };
            }
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'refresh' });
                showLoading();
            });
        }
    }

    /**
     * Listen for messages from extension
     */
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.command) {
            case 'update':
                dashboardData = message.data;
                renderDashboard();
                break;
        }
    });

    /**
     * Render the entire dashboard
     */
    function renderDashboard() {
        const contentContainer = document.getElementById('dashboard-content');
        const emptyState = document.getElementById('empty-state');

        if (!dashboardData || !dashboardData.hasTopics) {
            contentContainer.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        contentContainer.style.display = 'block';
        emptyState.style.display = 'none';

        contentContainer.innerHTML = '';

        // Render current topic card
        if (dashboardData.currentTopic) {
            contentContainer.appendChild(renderCurrentTopicCard(dashboardData.currentTopic));
        }

        // Render statistics
        if (dashboardData.currentTopic) {
            contentContainer.appendChild(renderStatsGrid(dashboardData.currentTopic));
        }

        // Render all topics list
        contentContainer.appendChild(renderTopicsSection(dashboardData.topics, dashboardData.currentTopic));
    }

    /**
     * Render current topic card
     */
    function renderCurrentTopicCard(topic) {
        const card = document.createElement('div');
        card.className = 'current-topic-card';

        const header = document.createElement('div');
        header.className = 'current-topic-header';

        const title = document.createElement('h2');
        title.className = 'current-topic-title';
        title.textContent = topic.name;

        const stageBadge = document.createElement('span');
        stageBadge.className = `stage-badge stage-${topic.stage}`;
        stageBadge.innerHTML = `<i class="fas ${getStageIcon(topic.stage)}"></i> ${formatStage(topic.stage)}`;

        // Add research completion indicator
        const researchIndicator = document.createElement('span');
        researchIndicator.className = `research-indicator ${topic.hasResearch ? 'completed' : 'pending'}`;
        researchIndicator.title = topic.hasResearch ? 'Research completed' : 'Research not completed';
        researchIndicator.innerHTML = `<i class="fas fa-search"></i> ${topic.hasResearch ? 'Researched' : 'Not Researched'}`;

        // Click handler for research indicator - open research.md
        if (topic.hasResearch) {
            researchIndicator.addEventListener('click', () => {
                const filePath = `specify/${topic.dirName}/research.md`;
                vscode.postMessage({
                    command: 'openFile',
                    path: filePath
                });
            });
            researchIndicator.style.cursor = 'pointer';
        }

        header.appendChild(title);
        header.appendChild(researchIndicator);
        header.appendChild(stageBadge);

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-bar-container';

        const progressLabel = document.createElement('div');
        progressLabel.className = 'progress-bar-label';
        progressLabel.innerHTML = `<span>Progress</span><span>${topic.completionRate}%</span>`;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-bar-fill';
        progressFill.style.width = `${topic.completionRate}%`;

        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressLabel);
        progressContainer.appendChild(progressBar);

        card.appendChild(header);
        card.appendChild(progressContainer);

        // Show task list if exists, otherwise show discussion list
        if (topic.tasks && topic.tasks.length > 0) {
            const taskList = renderTaskList(topic.tasks); // Show all tasks
            card.appendChild(taskList);
        } else if (topic.discussions && topic.discussions.length > 0) {
            // When no tasks exist yet (early stage), show discussions instead
            const discussionList = renderDiscussionList(topic.discussions);
            card.appendChild(discussionList);
        }

        return card;
    }

    /**
     * Render statistics grid
     */
    function renderStatsGrid(topic) {
        const grid = document.createElement('div');
        grid.className = 'stats-grid';

        // Discussions stat
        grid.appendChild(createStatCard(
            'Discussions',
            topic.discussionCount,
            'fa-comments'
        ));

        // Tasks stat
        grid.appendChild(createStatCard(
            'Tasks',
            topic.taskCount,
            'fa-tasks'
        ));

        // Completed stat
        grid.appendChild(createStatCard(
            'Completed',
            topic.completedCount,
            'fa-check-circle'
        ));

        return grid;
    }

    /**
     * Create a stat card
     */
    function createStatCard(label, value, iconClass) {
        const card = document.createElement('div');
        card.className = 'stat-card';

        const labelEl = document.createElement('div');
        labelEl.className = 'stat-label';
        labelEl.innerHTML = `<i class="fas ${iconClass} stat-icon"></i> ${label}`;

        const valueEl = document.createElement('div');
        valueEl.className = 'stat-value';
        valueEl.textContent = value;

        card.appendChild(labelEl);
        card.appendChild(valueEl);

        return card;
    }

    /**
     * Render topics section
     */
    function renderTopicsSection(topics, currentTopic) {
        const section = document.createElement('div');
        section.className = 'topics-section';

        const header = document.createElement('div');
        header.className = 'section-header';

        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = 'All Topics';

        const count = document.createElement('span');
        count.className = 'topics-count';
        count.textContent = `${topics.length} topic${topics.length !== 1 ? 's' : ''}`;

        header.appendChild(title);
        header.appendChild(count);

        section.appendChild(header);

        // Render topic items
        topics.forEach(topic => {
            section.appendChild(renderTopicItem(topic, currentTopic));
        });

        return section;
    }

    /**
     * Render a single topic item
     */
    function renderTopicItem(topic, currentTopic) {
        const item = document.createElement('div');
        item.className = 'topic-item';
        if (currentTopic && topic.sequence === currentTopic.sequence) {
            item.classList.add('current');
        }

        // If discuss.md doesn't exist (new-topic stage without discussions), make it non-clickable
        const canClick = topic.discussionCount > 0;
        if (!canClick) {
            item.classList.add('disabled');
        }

        const sequence = document.createElement('div');
        sequence.className = 'topic-sequence';
        sequence.textContent = String(topic.sequence).padStart(3, '0');

        const info = document.createElement('div');
        info.className = 'topic-info';

        const name = document.createElement('div');
        name.className = 'topic-name';
        name.textContent = topic.name;

        const meta = document.createElement('div');
        meta.className = 'topic-meta';

        meta.appendChild(createMetaItem('fa-layer-group', formatStage(topic.stage)));
        meta.appendChild(createMetaItem('fa-comments', `${topic.discussionCount} discussions`));
        meta.appendChild(createMetaItem('fa-tasks', `${topic.completedCount}/${topic.taskCount} tasks`));

        info.appendChild(name);
        info.appendChild(meta);

        const stageBadge = document.createElement('span');
        stageBadge.className = `stage-badge stage-${topic.stage}`;
        stageBadge.innerHTML = `<i class="fas ${getStageIcon(topic.stage)}"></i>`;

        const researchIndicator = document.createElement('span');
        researchIndicator.className = `research-indicator ${topic.hasResearch ? 'completed' : 'pending'}`;
        researchIndicator.title = topic.hasResearch ? 'Research completed' : 'Research not completed';
        researchIndicator.innerHTML = `<i class="fas fa-search"></i>`;

        // Click handler for research indicator - open research.md
        if (topic.hasResearch) {
            researchIndicator.addEventListener('click', (e) => {
                e.stopPropagation();
                const filePath = `specify/${topic.dirName}/research.md`;
                vscode.postMessage({
                    command: 'openFile',
                    path: filePath
                });
            });
            researchIndicator.style.cursor = 'pointer';
        }

        // Create a container for the icons on the right
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'topic-icons';
        iconsContainer.appendChild(researchIndicator);
        iconsContainer.appendChild(stageBadge);

        item.appendChild(sequence);
        item.appendChild(info);
        item.appendChild(iconsContainer);

        // Click handler - open discuss.md (only if it has discussions)
        if (canClick) {
            item.addEventListener('click', () => {
                const filePath = `specify/${topic.dirName}/discuss.md`;
                vscode.postMessage({
                    command: 'openFile',
                    path: filePath
                });
            });
        }

        return item;
    }

    /**
     * Create a metadata item
     */
    function createMetaItem(iconClass, text) {
        const item = document.createElement('div');
        item.className = 'topic-meta-item';
        item.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
        return item;
    }

    /**
     * Render discussion list
     */
    function renderDiscussionList(discussions) {
        const list = document.createElement('div');
        list.className = 'discussion-list';

        discussions.forEach(discussion => {
            const item = document.createElement('div');
            item.className = 'discussion-item';

            const icon = document.createElement('i');
            icon.className = 'fas fa-comment discussion-icon';

            const discussionInfo = document.createElement('div');
            discussionInfo.className = 'discussion-info';

            const discussionId = document.createElement('span');
            discussionId.className = 'discussion-id';
            discussionId.textContent = discussion.id;

            const discussionQuestion = document.createElement('span');
            discussionQuestion.className = 'discussion-question';
            discussionQuestion.textContent = discussion.question;

            const discussionTime = document.createElement('span');
            discussionTime.className = 'discussion-time';
            discussionTime.textContent = discussion.timestamp;

            discussionInfo.appendChild(discussionId);
            discussionInfo.appendChild(discussionQuestion);
            discussionInfo.appendChild(discussionTime);

            item.appendChild(icon);
            item.appendChild(discussionInfo);

            list.appendChild(item);
        });

        return list;
    }

    /**
     * Render task list
     */
    function renderTaskList(tasks) {
        const list = document.createElement('div');
        list.className = 'task-list';

        tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item';

            const statusIcon = document.createElement('i');
            statusIcon.className = `fas task-status-icon ${task.status}`;
            statusIcon.classList.add(task.status === 'completed' ? 'fa-check-circle' : 'fa-circle');

            const taskInfo = document.createElement('div');
            taskInfo.className = 'task-info';

            const taskId = document.createElement('span');
            taskId.className = 'task-id';
            taskId.textContent = task.id;

            const taskDesc = document.createElement('span');
            taskDesc.className = 'task-description';
            taskDesc.textContent = task.description;

            taskInfo.appendChild(taskId);
            taskInfo.appendChild(taskDesc);

            item.appendChild(statusIcon);
            item.appendChild(taskInfo);

            list.appendChild(item);
        });

        return list;
    }

    /**
     * Get icon for stage
     */
    function getStageIcon(stage) {
        const icons = {
            'new-topic': 'fa-plus-circle',
            'discuss': 'fa-comments',
            'plan': 'fa-clipboard-list',
            'action': 'fa-bolt',
            'completed': 'fa-check-circle'
        };
        return icons[stage] || 'fa-circle';
    }

    /**
     * Format stage name
     */
    function formatStage(stage) {
        const names = {
            'new-topic': 'New Topic',
            'discuss': 'Discussion',
            'plan': 'Planning',
            'action': 'In Action',
            'completed': 'Completed'
        };
        return names[stage] || stage;
    }

    /**
     * Show loading state
     */
    function showLoading() {
        const contentContainer = document.getElementById('dashboard-content');
        contentContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Refreshing...</div>';
    }

})();