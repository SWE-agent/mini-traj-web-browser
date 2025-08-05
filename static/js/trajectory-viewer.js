class TrajectoryViewer {
    constructor() {
        this.experiments = [];
        this.currentExperiment = null;
        this.currentInstance = null;
        this.trajectoryData = null;
        
        this.init();
    }

    async init() {
        await this.loadExperiments();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadExperiments() {
        try {
            // Since we're in a static site, we'll scan the data directory structure
            // This assumes the data directory is accessible via static serving
            const response = await fetch('/data-index.json');
            if (response.ok) {
                const data = await response.json();
                this.experiments = data.experiments;
            } else {
                // Fallback: try to discover experiments from known structure
                await this.discoverExperiments();
            }
        } catch (error) {
            console.warn('Could not load experiments index, using discovery method');
            await this.discoverExperiments();
        }
    }

    async discoverExperiments() {
        // Since we can't dynamically scan directories in a static site,
        // we'll need to manually specify known experiments for now
        // In a real implementation, you'd generate a data-index.json during build
        this.experiments = [
            {
                name: 'example-experiemnt',
                instances: ['example_instance']
            }
        ];
    }

    setupEventListeners() {
        // Experiment navigation
        document.getElementById('prev-experiment').addEventListener('click', () => {
            this.navigateExperiment(-1);
        });
        
        document.getElementById('next-experiment').addEventListener('click', () => {
            this.navigateExperiment(1);
        });
        
        document.getElementById('experiment-select').addEventListener('change', (e) => {
            this.selectExperiment(e.target.value);
        });

        // Instance navigation
        document.getElementById('prev-instance').addEventListener('click', () => {
            this.navigateInstance(-1);
        });
        
        document.getElementById('next-instance').addEventListener('click', () => {
            this.navigateInstance(1);
        });
        
        document.getElementById('instance-select').addEventListener('change', (e) => {
            this.selectInstance(e.target.value);
        });
    }

    populateExperimentDropdown() {
        const select = document.getElementById('experiment-select');
        select.innerHTML = '';
        
        if (this.experiments.length === 0) {
            select.innerHTML = '<option value="">No experiments found</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Select an experiment...</option>';
        this.experiments.forEach(exp => {
            const option = document.createElement('option');
            option.value = exp.name;
            option.textContent = exp.name;
            if (this.currentExperiment && this.currentExperiment.name === exp.name) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    populateInstanceDropdown() {
        const select = document.getElementById('instance-select');
        select.innerHTML = '';
        
        if (!this.currentExperiment || !this.currentExperiment.instances) {
            select.innerHTML = '<option value="">No instances available</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Select an instance...</option>';
        this.currentExperiment.instances.forEach(instance => {
            const option = document.createElement('option');
            option.value = instance;
            option.textContent = instance;
            if (this.currentInstance === instance) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    navigateExperiment(direction) {
        if (!this.experiments.length) return;
        
        const currentIndex = this.experiments.findIndex(exp => 
            this.currentExperiment && exp.name === this.currentExperiment.name
        );
        
        let newIndex;
        if (currentIndex === -1) {
            newIndex = direction > 0 ? 0 : this.experiments.length - 1;
        } else {
            newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = this.experiments.length - 1;
            if (newIndex >= this.experiments.length) newIndex = 0;
        }
        
        this.selectExperiment(this.experiments[newIndex].name);
    }

    navigateInstance(direction) {
        if (!this.currentExperiment || !this.currentExperiment.instances.length) return;
        
        const currentIndex = this.currentExperiment.instances.findIndex(instance => 
            instance === this.currentInstance
        );
        
        let newIndex;
        if (currentIndex === -1) {
            newIndex = direction > 0 ? 0 : this.currentExperiment.instances.length - 1;
        } else {
            newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = this.currentExperiment.instances.length - 1;
            if (newIndex >= this.currentExperiment.instances.length) newIndex = 0;
        }
        
        this.selectInstance(this.currentExperiment.instances[newIndex]);
    }

    async selectExperiment(experimentName) {
        if (!experimentName) return;
        
        this.currentExperiment = this.experiments.find(exp => exp.name === experimentName);
        this.currentInstance = null;
        this.trajectoryData = null;
        
        // Auto-select first instance if available
        if (this.currentExperiment && this.currentExperiment.instances.length > 0) {
            await this.selectInstance(this.currentExperiment.instances[0]);
        }
        
        this.updateUI();
    }

    async selectInstance(instanceName) {
        if (!instanceName || !this.currentExperiment) return;
        
        this.currentInstance = instanceName;
        await this.loadTrajectoryData();
        this.updateUI();
    }

    async loadTrajectoryData() {
        if (!this.currentExperiment || !this.currentInstance) return;
        
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.style.display = 'block';
        
        try {
            const trajPath = `/data/${this.currentExperiment.name}/${this.currentInstance}/${this.currentInstance}.traj.json`;
            const response = await fetch(trajPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.trajectoryData = await response.json();
        } catch (error) {
            console.error('Error loading trajectory data:', error);
            this.trajectoryData = null;
            // Show error in UI
            document.getElementById('overview-content').innerHTML = `
                <div class="error">
                    <p><strong>Error loading trajectory data:</strong></p>
                    <p>${error.message}</p>
                    <p>Path: /data/${this.currentExperiment.name}/${this.currentInstance}/${this.currentInstance}.traj.json</p>
                </div>
            `;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    updateUI() {
        this.populateExperimentDropdown();
        this.populateInstanceDropdown();
        this.updateNavigationButtons();
        this.updateOverview();
        this.updateMessages();
    }

    updateNavigationButtons() {
        const prevExpBtn = document.getElementById('prev-experiment');
        const nextExpBtn = document.getElementById('next-experiment');
        const prevInstBtn = document.getElementById('prev-instance');
        const nextInstBtn = document.getElementById('next-instance');
        
        // Enable/disable experiment navigation
        const hasExperiments = this.experiments.length > 0;
        prevExpBtn.disabled = !hasExperiments;
        nextExpBtn.disabled = !hasExperiments;
        
        // Enable/disable instance navigation
        const hasInstances = this.currentExperiment && this.currentExperiment.instances.length > 0;
        prevInstBtn.disabled = !hasInstances;
        nextInstBtn.disabled = !hasInstances;
    }

    updateOverview() {
        const content = document.getElementById('overview-content');
        
        if (!this.trajectoryData) {
            content.innerHTML = '<p>Select an experiment and instance to view trajectory data.</p>';
            return;
        }
        
        const info = this.trajectoryData.info || {};
        const modelStats = info.model_stats || {};
        
        let overviewHtml = `
            <div class="overview-info">
                <div class="info-item">
                    <div class="info-label">Exit Status</div>
                    <div class="info-value">${info.exit_status !== null ? info.exit_status : 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Instance Cost</div>
                    <div class="info-value">$${modelStats.instance_cost || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">API Calls</div>
                    <div class="info-value">${modelStats.api_calls || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total Messages</div>
                    <div class="info-value">${this.trajectoryData.messages ? this.trajectoryData.messages.length : 'N/A'}</div>
                </div>
            </div>
        `;
        
        // Add submission as a separate field if it exists and has content
        if (info.submission !== null && info.submission !== undefined && info.submission !== '') {
            overviewHtml += `
                <div class="submission-section">
                    <h3>Submission</h3>
                    <div class="submission-content">${this.escapeHtml(info.submission)}</div>
                </div>
            `;
        }
        
        content.innerHTML = overviewHtml;
    }

    updateMessages() {
        const content = document.getElementById('messages-content');
        
        if (!this.trajectoryData || !this.trajectoryData.messages) {
            content.innerHTML = '<p>No messages to display.</p>';
            return;
        }
        
        const messagesHtml = this.trajectoryData.messages.map((message, index) => {
            const content = this.formatMessageContent(message.content);
            return `
                <div class="message ${message.role}">
                    <div class="message-header">
                        <span class="message-role">${message.role}</span>
                        <span class="message-index">#${index + 1}</span>
                    </div>
                    <div class="message-content">${content}</div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = messagesHtml;
    }

    formatMessageContent(content) {
        if (typeof content === 'string') {
            return this.escapeHtml(content);
        }
        
        if (Array.isArray(content)) {
            return content.map(item => {
                if (item.type === 'text') {
                    return this.escapeHtml(item.text);
                }
                return this.escapeHtml(JSON.stringify(item, null, 2));
            }).join('\n\n');
        }
        
        return this.escapeHtml(JSON.stringify(content, null, 2));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the trajectory viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TrajectoryViewer();
});