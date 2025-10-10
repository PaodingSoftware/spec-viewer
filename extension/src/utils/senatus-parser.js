const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

/**
 * Senatus data parser utility
 * Parses specify/ directory structure and extracts structured information
 */
class SenatusParser {
    constructor(workspaceFolder) {
        this.workspaceFolder = workspaceFolder;
        this.specifyPath = path.join(workspaceFolder, 'specify');
    }

    /**
     * Parse all topics and return structured data
     * @returns {Promise<Object>} Parsed data object
     */
    async parseAll() {
        try {
            const topics = await this.scanTopics();
            const currentTopic = this.getCurrentTopic(topics);

            return {
                topics: topics,
                currentTopic: currentTopic,
                hasTopics: topics.length > 0
            };
        } catch (error) {
            console.error('Error parsing Senatus data:', error);
            return {
                topics: [],
                currentTopic: null,
                hasTopics: false
            };
        }
    }

    /**
     * Scan specify directory for all topics
     * @returns {Promise<Array>} Array of topic objects
     */
    async scanTopics() {
        try {
            const entries = await fs.readdir(this.specifyPath, { withFileTypes: true });
            const topics = [];

            for (const entry of entries) {
                if (entry.isDirectory() && /^\d{3}-/.test(entry.name)) {
                    const topicPath = path.join(this.specifyPath, entry.name);
                    const topicData = await this.parseTopic(entry.name, topicPath);
                    if (topicData) {
                        topics.push(topicData);
                    }
                }
            }

            // Sort by sequence number
            topics.sort((a, b) => a.sequence - b.sequence);
            return topics;
        } catch (error) {
            // specify directory doesn't exist or can't be read
            return [];
        }
    }

    /**
     * Parse a single topic directory
     * @param {string} dirName - Directory name (e.g., "001-topic-name")
     * @param {string} topicPath - Full path to topic directory
     * @returns {Promise<Object|null>} Topic data object or null if parsing fails
     */
    async parseTopic(dirName, topicPath) {
        try {
            // Extract sequence and name
            const match = dirName.match(/^(\d{3})-(.+)$/);
            if (!match) return null;

            const sequence = parseInt(match[1]);
            const name = match[2].replace(/-/g, ' ');

            // Check which files exist
            const files = await this.getTopicFiles(topicPath);

            // Parse discuss.md if exists
            const discussData = files.has('discuss.md')
                ? await this.parseDiscuss(path.join(topicPath, 'discuss.md'))
                : { discussionCount: 0, discussions: [] };

            // Parse plan.md if exists
            const planData = files.has('plan.md')
                ? await this.parsePlan(path.join(topicPath, 'plan.md'))
                : { taskCount: 0, completedCount: 0, tasks: [] };

            // Determine stage based on files and discussion count
            const stage = this.determineStage(files, discussData.discussionCount);

            // Update stage to 'completed' if all tasks are done
            let finalStage = stage;
            if (stage === 'action' && planData.taskCount > 0 && planData.taskCount === planData.completedCount) {
                finalStage = 'completed';
            }

            // Check if research is completed
            const hasResearch = files.has('research.md');

            // Calculate completion rate based on stages
            const completionRate = this.calculateCompletionRate(finalStage, planData.taskCount, planData.completedCount);

            return {
                sequence,
                name,
                dirName,
                stage: finalStage,
                files: Array.from(files),
                hasResearch: hasResearch,
                discussionCount: discussData.discussionCount,
                discussions: discussData.discussions,
                taskCount: planData.taskCount,
                completedCount: planData.completedCount,
                completionRate: completionRate,
                tasks: planData.tasks
            };
        } catch (error) {
            console.error(`Error parsing topic ${dirName}:`, error);
            return null;
        }
    }

    /**
     * Get list of files in topic directory
     * @param {string} topicPath - Path to topic directory
     * @returns {Promise<Set<string>>} Set of file names
     */
    async getTopicFiles(topicPath) {
        const files = new Set();
        try {
            const entries = await fs.readdir(topicPath);
            entries.forEach(entry => files.add(entry));
        } catch (error) {
            // Ignore errors
        }
        return files;
    }

    /**
     * Determine topic stage based on existing files and discussion count
     * Stage progression: new-topic → discuss → plan → action → completed
     * Research is independent and tracked separately via hasResearch field
     * @param {Set<string>} files - Set of file names
     * @param {number} discussionCount - Number of discussions in discuss.md
     * @returns {string} Stage name
     */
    determineStage(files, discussionCount = 0) {
        // Check implementation directory for action stage
        if (files.has('implementation')) {
            return 'action';
        }
        if (files.has('plan.md')) {
            return 'plan';
        }
        // Enter discuss stage when discussion list is not empty
        if (files.has('discuss.md') && discussionCount > 0) {
            return 'discuss';
        }
        // Default to new-topic stage
        if (files.has('discuss.md')) {
            return 'new-topic';
        }
        return 'new-topic';
    }

    /**
     * Parse discuss.md to extract discussion records
     * @param {string} filePath - Path to discuss.md
     * @returns {Promise<Object>} Discussion data
     */
    async parseDiscuss(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');

            // Remove HTML comments to avoid matching example patterns
            content = content.replace(/<!--[\s\S]*?-->/g, '');

            // Use regex to extract discussion records: ### D01 - YYYY-MM-DD HH:MM:SS
            const discussionRegex = /### (D\d+) - (.+?)\n\*\*问题\*\*:\s*(.+?)\n+\*\*结论\*\*:/gs;
            const discussions = [];
            let match;

            while ((match = discussionRegex.exec(content)) !== null) {
                discussions.push({
                    id: match[1],
                    timestamp: match[2].trim(),
                    question: match[3].trim()
                });
            }

            return {
                discussionCount: discussions.length,
                discussions
            };
        } catch (error) {
            return { discussionCount: 0, discussions: [] };
        }
    }

    /**
     * Parse plan.md to extract tasks
     * @param {string} filePath - Path to plan.md
     * @returns {Promise<Object>} Plan data
     */
    async parsePlan(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');

            // Remove HTML comments to avoid matching example patterns
            content = content.replace(/<!--[\s\S]*?-->/g, '');

            // Use regex to extract tasks: A01. [⏳待执行] or A01. [✅已完成]
            const taskRegex = /^(A\d+)\. \[(⏳|✅)[^\]]*\] (.+?)$/gm;
            const tasks = [];
            let completedCount = 0;
            let match;

            while ((match = taskRegex.exec(content)) !== null) {
                const isCompleted = match[2] === '✅';
                if (isCompleted) completedCount++;

                tasks.push({
                    id: match[1],
                    status: isCompleted ? 'completed' : 'pending',
                    description: match[3].trim()
                });
            }

            return {
                taskCount: tasks.length,
                completedCount,
                tasks
            };
        } catch (error) {
            return { taskCount: 0, completedCount: 0, tasks: [] };
        }
    }

    /**
     * Calculate completion rate based on stage
     * Stage weights: new-topic(10%), discuss(30%), plan(50%), action(50-100% based on tasks)
     * Research is independent and does not affect stage progression
     * @param {string} stage - Current stage
     * @param {number} taskCount - Total task count
     * @param {number} completedCount - Completed task count
     * @returns {number} Completion rate (0-100)
     */
    calculateCompletionRate(stage, taskCount, completedCount) {
        const stageWeights = {
            'new-topic': 10,
            'discuss': 30,
            'plan': 50,
            'action': 50,
            'completed': 100
        };

        const baseProgress = stageWeights[stage] || 0;

        // For action and completed stages, calculate task-based progress
        if (stage === 'action' && taskCount > 0) {
            const taskProgress = (completedCount / taskCount) * 50; // 50% weight for tasks (50% to 100%)
            return Math.round(baseProgress + taskProgress);
        } else if (stage === 'completed') {
            return 100;
        }

        return baseProgress;
    }

    /**
     * Get current topic (latest by sequence number)
     * @param {Array} topics - Array of topic objects
     * @returns {Object|null} Current topic or null
     */
    getCurrentTopic(topics) {
        if (topics.length === 0) return null;
        return topics[topics.length - 1]; // Last item (highest sequence)
    }
}

module.exports = { SenatusParser };