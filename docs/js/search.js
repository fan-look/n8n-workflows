/**
 * Client-side search functionality for N8N Workflow Collection
 * Handles searching, filtering, and displaying workflow results
 */

class WorkflowSearch {
    constructor() {
        this.searchIndex = null;
        this.currentResults = [];
        this.displayedCount = 0;
        this.resultsPerPage = 20;
        this.isLoading = false;
        this.workflowDocs = null;

        // DOM elements
        this.searchInput = document.getElementById('search-input');
        this.categoryFilter = document.getElementById('category-filter');
        this.complexityFilter = document.getElementById('complexity-filter');
        this.triggerFilter = document.getElementById('trigger-filter');
        this.resultsGrid = document.getElementById('results-grid');
        this.resultsTitle = document.getElementById('results-title');
        this.resultsCount = document.getElementById('results-count');
        this.loadingEl = document.getElementById('loading');
        this.noResultsEl = document.getElementById('no-results');
        this.loadMoreBtn = document.getElementById('load-more');

        this.init();
    }

    async init() {
        try {
            await this.loadSearchIndex();
            await this.loadWorkflowDocs();
            this.setupEventListeners();
            this.populateFilters();
            this.updateStats();
            this.showFeaturedWorkflows();
        } catch (error) {
            console.error('Failed to initialize search:', error);
            this.showError('Failed to load workflow data. Please try again later.');
        }
    }

    async loadSearchIndex() {
        this.showLoading(true);
        try {
            const response = await fetch('api/search-index.json');
            if (!response.ok) {
                throw new Error('Failed to load search index');
            }
            this.searchIndex = await response.json();
        } finally {
            this.showLoading(false);
        }
    }

    async loadWorkflowDocs() {
        try {
            const resp = await fetch('api/workflow-docs.json');
            if (resp.ok) {
                this.workflowDocs = await resp.json();
            } else {
                this.workflowDocs = {};
            }
        } catch {
            this.workflowDocs = {};
        }
    }

    setupEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Filters
        this.categoryFilter.addEventListener('change', this.handleSearch.bind(this));
        this.complexityFilter.addEventListener('change', this.handleSearch.bind(this));
        this.triggerFilter.addEventListener('change', this.handleSearch.bind(this));

        // Load more button
        this.loadMoreBtn.addEventListener('click', this.loadMoreResults.bind(this));

        // Search button
        document.getElementById('search-btn').addEventListener('click', this.handleSearch.bind(this));
    }

    populateFilters() {
        // Populate category filter
        this.searchIndex.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.categoryFilter.appendChild(option);
        });
    }

    updateStats() {
        const stats = this.searchIndex.stats;

        document.getElementById('total-count').textContent = stats.total_workflows.toLocaleString();
        document.getElementById('workflows-count').textContent = stats.total_workflows.toLocaleString();
        document.getElementById('active-count').textContent = stats.active_workflows.toLocaleString();
        document.getElementById('integrations-count').textContent = stats.unique_integrations.toLocaleString();
        document.getElementById('categories-count').textContent = stats.categories.toLocaleString();
    }

    handleSearch() {
        const query = this.searchInput.value.trim().toLowerCase();
        const category = this.categoryFilter.value;
        const complexity = this.complexityFilter.value;
        const trigger = this.triggerFilter.value;

        this.currentResults = this.searchWorkflows(query, { category, complexity, trigger });
        this.displayedCount = 0;
        this.displayResults(true);
        this.updateResultsHeader(query, { category, complexity, trigger });
    }

    searchWorkflows(query, filters = {}) {
        let results = [...this.searchIndex.workflows];

        // Text search
        if (query) {
            results = results.filter(workflow =>
                workflow.searchable_text.includes(query)
            );

            // Sort by relevance (name matches first, then description)
            results.sort((a, b) => {
                const aNameMatch = a.name.toLowerCase().includes(query);
                const bNameMatch = b.name.toLowerCase().includes(query);

                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;

                return 0;
            });
        }

        // Apply filters
        if (filters.category) {
            results = results.filter(workflow => workflow.category === filters.category);
        }

        if (filters.complexity) {
            results = results.filter(workflow => workflow.complexity === filters.complexity);
        }

        if (filters.trigger) {
            results = results.filter(workflow => workflow.trigger_type === filters.trigger);
        }

        return results;
    }

    showFeaturedWorkflows() {
        // Show recent workflows or popular ones when no search
        const featured = this.searchIndex.workflows
            .filter(w => w.integrations.length > 0)
            .slice(0, this.resultsPerPage);

        this.currentResults = featured;
        this.displayedCount = 0;
        this.displayResults(true);
        this.resultsTitle.textContent = 'Featured Workflows';
        this.resultsCount.textContent = '';
    }

    displayResults(reset = false) {
        if (reset) {
            this.resultsGrid.innerHTML = '';
            this.displayedCount = 0;
        }

        if (this.currentResults.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();

        const startIndex = this.displayedCount;
        const endIndex = Math.min(startIndex + this.resultsPerPage, this.currentResults.length);
        const resultsToShow = this.currentResults.slice(startIndex, endIndex);

        resultsToShow.forEach(workflow => {
            const card = this.createWorkflowCard(workflow);
            this.resultsGrid.appendChild(card);
        });

        this.displayedCount = endIndex;

        // Update load more button
        if (this.displayedCount < this.currentResults.length) {
            this.loadMoreBtn.classList.remove('hidden');
        } else {
            this.loadMoreBtn.classList.add('hidden');
        }
    }

    createWorkflowCard(workflow) {
        const card = document.createElement('div');
        card.className = 'workflow-card';
        card.onclick = () => this.openWorkflowDetails(workflow);

        const integrationTags = workflow.integrations
            .slice(0, 3)
            .map(integration => `<span class="integration-tag">${integration}</span>`)
            .join('');

        const moreIntegrations = workflow.integrations.length > 3
            ? `<span class="integration-tag">+${workflow.integrations.length - 3} more</span>`
            : '';

        card.innerHTML = `
            <h3 class="workflow-title">${this.escapeHtml(workflow.name)}</h3>
            <p class="workflow-description">${this.escapeHtml(workflow.description)}</p>

            <div class="workflow-meta">
                <span class="meta-tag category">${workflow.category}</span>
                <span class="meta-tag trigger">${workflow.trigger_type}</span>
                <span class="meta-tag">${workflow.complexity} complexity</span>
                <span class="meta-tag">${workflow.node_count} nodes</span>
            </div>

            <div class="workflow-integrations">
                ${integrationTags}
                ${moreIntegrations}
            </div>

            <div class="workflow-actions">
                <a href="${workflow.download_url}" class="btn btn-primary" target="_blank" onclick="event.stopPropagation()">
                    📥 Download JSON
                </a>
                <button class="btn btn-secondary" onclick="event.stopPropagation(); window.copyWorkflowId('${workflow.filename}')">
                    📋 Copy ID
                </button>
            </div>
        `;

        return card;
    }

    openWorkflowDetails(workflow) {
        // Create modal or expand card with more details
        const modal = this.createDetailsModal(workflow);
        document.body.appendChild(modal);

        // Add event listener to close modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    createDetailsModal(workflow) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;

        const allIntegrations = workflow.integrations
            .map(integration => `<span class="integration-tag">${integration}</span>`)
            .join('');

        const allTags = workflow.tags
            .map(tag => `<span class="meta-tag">${tag}</span>`)
            .join('');

        const doc = this.getWorkflowDoc(workflow);
        const overview = doc ? this.escapeHtml(doc.overview_zh || '') : this.escapeHtml(workflow.description || '');
        const flow = doc ? this.escapeHtml(doc.flow_zh || '') : '';
        const tools = doc && doc.tools_zh ? doc.tools_zh.map(t => `<span class="integration-tag">${this.escapeHtml(t)}</span>`).join('') : allIntegrations;
        const params = doc && doc.parameters_zh ? this.renderParameters(doc.parameters_zh) : '<em>暂无参数信息</em>';
        const scenarios = doc && doc.scenarios_zh ? doc.scenarios_zh.map(s => `<li>${this.escapeHtml(s)}</li>`).join('') : '';
        modalContent.innerHTML = `
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            <h2 style="margin-bottom: 1rem;">${this.escapeHtml(workflow.name)}</h2>
            <div style="margin-bottom: 1rem; display:grid; grid-template-columns: repeat(2, 1fr); gap: .5rem;">
                <div><strong>分类:</strong> ${workflow.category}</div>
                <div><strong>触发:</strong> ${workflow.trigger_type}</div>
                <div><strong>复杂度:</strong> ${workflow.complexity}</div>
                <div><strong>节点数:</strong> ${workflow.node_count}</div>
                <div><strong>状态:</strong> ${workflow.active ? 'Active' : 'Inactive'}</div>
                <div><strong>文件:</strong> ${workflow.filename}</div>
            </div>
            <div>
                <div style="display:flex; gap:.5rem; margin-bottom:.5rem;">
                    <button class="btn" data-tab="overview" onclick="window._switchTab(this)">详介</button>
                    <button class="btn" data-tab="flow" onclick="window._switchTab(this)">流程</button>
                    <button class="btn" data-tab="tools" onclick="window._switchTab(this)">工具/参数</button>
                    <button class="btn" data-tab="scenarios" onclick="window._switchTab(this)">场景</button>
                </div>
                <div id="tab-overview" class="tab-pane">${overview}</div>
                <div id="tab-flow" class="tab-pane" style="display:none;">${flow || '<em>暂无流程信息</em>'}</div>
                <div id="tab-tools" class="tab-pane" style="display:none;">
                    <div style="margin-bottom:.5rem; display:flex; flex-wrap:wrap; gap:.25rem;">${tools}</div>
                    <div>${params}</div>
                </div>
                <div id="tab-scenarios" class="tab-pane" style="display:none;"><ul>${scenarios}</ul></div>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <a href="${workflow.download_url}" class="btn btn-primary" target="_blank">📥 下载 JSON</a>
                <button class="btn btn-secondary" onclick="window.copyWorkflowId('${workflow.filename}')">📋 复制文件名</button>
            </div>
        `;

        modal.appendChild(modalContent);
        return modal;
    }

    getWorkflowDoc(workflow) {
        const key = workflow.filename.replace('.json', '');
        return (this.workflowDocs && this.workflowDocs[key]) ? this.workflowDocs[key] : null;
    }

    renderParameters(parameters) {
        const sections = Object.entries(parameters).slice(0, 6).map(([type, keys]) => {
            const items = keys.slice(0, 20).map(k => `<code>${this.escapeHtml(k)}</code>`).join(', ');
            return `<div style="margin:.5rem 0;"><strong>${this.escapeHtml(type)}</strong>: ${items}</div>`;
        }).join('');
        return sections || '<em>暂无参数信息</em>';
    }

    updateResultsHeader(query, filters) {
        let title = 'Search Results';
        let filterDesc = [];

        if (query) {
            title = `Search: "${query}"`;
        }

        if (filters.category) filterDesc.push(`Category: ${filters.category}`);
        if (filters.complexity) filterDesc.push(`Complexity: ${filters.complexity}`);
        if (filters.trigger) filterDesc.push(`Trigger: ${filters.trigger}`);

        if (filterDesc.length > 0) {
            title += ` (${filterDesc.join(', ')})`;
        }

        this.resultsTitle.textContent = title;
        this.resultsCount.textContent = `${this.currentResults.length} workflows found`;
    }

    loadMoreResults() {
        this.displayResults(false);
    }

    showLoading(show) {
        this.isLoading = show;
        this.loadingEl.classList.toggle('hidden', !show);
    }

    showNoResults() {
        this.noResultsEl.classList.remove('hidden');
        this.loadMoreBtn.classList.add('hidden');
    }

    hideNoResults() {
        this.noResultsEl.classList.add('hidden');
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.style.cssText = `
            background: #fed7d7;
            color: #c53030;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
        `;
        errorEl.textContent = message;

        this.resultsGrid.innerHTML = '';
        this.resultsGrid.appendChild(errorEl);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions
window.copyWorkflowId = function(filename) {
    navigator.clipboard.writeText(filename).then(() => {
        // Show temporary success message
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = filename;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
};

window._switchTab = function(btn) {
    const paneIds = ['tab-overview','tab-flow','tab-tools','tab-scenarios'];
    paneIds.forEach(id => {
        const el = btn.closest('div').parentElement.querySelector(`#${id}`);
        if (el) el.style.display = 'none';
    });
    const target = btn.getAttribute('data-tab');
    const activeEl = btn.closest('div').parentElement.querySelector(`#tab-${target}`);
    if (activeEl) activeEl.style.display = 'block';
};

// Initialize search when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WorkflowSearch();
});
