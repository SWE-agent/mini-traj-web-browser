class TrajectoryViewer {
    constructor() {
        this.experiments = [];
        this.currentExperiment = null;
        this.currentInstance = null;
        this.trajectoryData = null;
        
        this.init();
    }

    async init() {
        this.initTheme();
        await this.loadExperiments();
        this.setupEventListeners();
        this.initFromURL();
        this.updateUI();
    }

    async loadExperiments() {
        // Use discovery method to automatically find experiments and instances
        await this.discoverExperiments();
    }

    async discoverExperiments() {
        console.log('Discovering experiments...');
        this.experiments = [];
        
        // Common experiment name patterns to try
        const experimentPatterns = [
            'example-experiemnt',
            'example-experiment', 
            'experiment-1',
            'experiment-2',
            'test-experiment',
            'demo',
            'sample'
        ];
        
        // Common instance name patterns to try
        const instancePatterns = [
            'example_instance',
            'instance_1',
            'instance_2', 
            'test_instance',
            'demo_instance',
            'sample_instance'
        ];
        
        for (const experimentName of experimentPatterns) {
            const instances = await this.discoverInstancesForExperiment(experimentName, instancePatterns);
            if (instances.length > 0) {
                this.experiments.push({
                    name: experimentName,
                    instances: instances
                });
                console.log(`Found experiment: ${experimentName} with instances:`, instances);
            }
        }
        
        // If no experiments found with patterns, try to read from current directory structure
        if (this.experiments.length === 0) {
            console.log('No experiments found with common patterns, checking if data directory is accessible...');
            // Try some basic paths that might exist
            const basicPatterns = ['data', 'experiments', 'test'];
            for (const pattern of basicPatterns) {
                const instances = await this.discoverInstancesForExperiment(pattern, instancePatterns);
                if (instances.length > 0) {
                    this.experiments.push({
                        name: pattern,
                        instances: instances
                    });
                }
            }
        }
        
        console.log('Discovery complete. Found experiments:', this.experiments);
    }

    initFromURL() {
        const { experimentName, instanceName } = this.parseURLSegments();
        if (experimentName && this.experiments.some(exp => exp.name === experimentName)) {
            this.selectExperiment(experimentName).then(() => {
                // If instance is specified in URL and exists, select it
                if (instanceName && this.currentExperiment && 
                    this.currentExperiment.instances.includes(instanceName)) {
                    this.selectInstance(instanceName);
                }
            });
        }
    }

    parseURLSegments() {
        const path = window.location.pathname;
        // Remove leading slash and extract segments
        const segments = path.replace(/^\//, '').split('/').filter(s => s);
        return {
            experimentName: segments[0] || null,
            instanceName: segments[1] || null
        };
    }

    parseURLForExperiment() {
        // Keep this method for backward compatibility
        return this.parseURLSegments().experimentName;
    }

    updateURL(experimentName, instanceName = null) {
        let newPath = '/';
        if (experimentName) {
            newPath += experimentName;
            if (instanceName) {
                newPath += `/${instanceName}`;
            }
        }
        
        // Update URL without reloading the page
        if (window.location.pathname !== newPath) {
            window.history.pushState(
                { experiment: experimentName, instance: instanceName }, 
                '', 
                newPath
            );
        }
    }

    handlePopState(event) {
        // Handle browser back/forward navigation
        const { experimentName, instanceName } = this.parseURLSegments();
        if (experimentName && this.experiments.some(exp => exp.name === experimentName)) {
            this.selectExperiment(experimentName).then(() => {
                // If instance is specified in URL and exists, select it
                if (instanceName && this.currentExperiment && 
                    this.currentExperiment.instances.includes(instanceName)) {
                    this.selectInstance(instanceName);
                }
            });
        } else {
            // No experiment in URL, clear selection
            this.currentExperiment = null;
            this.currentInstance = null;
            this.trajectoryData = null;
            this.updateUI();
        }
    }
    
    async discoverInstancesForExperiment(experimentName, instancePatterns) {
        const foundInstances = [];
        
        for (const instanceName of instancePatterns) {
            const trajPath = `/mini-traj-web-browser/data/${experimentName}/${instanceName}/${instanceName}.traj.json`;
            
            try {
                const response = await fetch(trajPath, { method: 'HEAD' });
                if (response.ok) {
                    foundInstances.push(instanceName);
                    console.log(`Found instance: ${instanceName} in experiment: ${experimentName}`);
                }
            } catch (error) {
                // Instance doesn't exist, continue checking others
            }
        }
        
        return foundInstances;
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

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Browser navigation (back/forward)
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });
    }

    initTheme() {
        // Initialize theme from localStorage with thread-safe access
        const savedTheme = this.getStoredTheme();
        this.setTheme(savedTheme);
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('trajectory-viewer-theme') || 'light';
        } catch (error) {
            console.warn('Failed to access localStorage for theme:', error);
            return 'light';
        }
    }

    setStoredTheme(theme) {
        try {
            localStorage.setItem('trajectory-viewer-theme', theme);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
    }

    setTheme(theme) {
        const validThemes = ['light', 'dark'];
        const currentTheme = validThemes.includes(theme) ? theme : 'light';
        
        // Apply theme to document
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Update theme toggle icon
        this.updateThemeIcon(currentTheme);
        
        // Store theme preference
        this.setStoredTheme(currentTheme);
    }

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return document.documentElement.hasAttribute('data-theme') ? 'dark' : 'light';
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            // Use moon icon for light mode (to switch to dark), sun icon for dark mode (to switch to light)
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
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
        if (!experimentName) {
            this.currentExperiment = null;
            this.currentInstance = null;
            this.trajectoryData = null;
            this.updateURL('');
            this.updateUI();
            return;
        }
        
        this.currentExperiment = this.experiments.find(exp => exp.name === experimentName);
        this.currentInstance = null;
        this.trajectoryData = null;
        
        // Update URL with experiment name
        this.updateURL(experimentName);
        
        // Auto-select first instance if available
        if (this.currentExperiment && this.currentExperiment.instances.length > 0) {
            await this.selectInstance(this.currentExperiment.instances[0]);
        }
        
        this.updateUI();
    }

    async selectInstance(instanceName) {
        if (!instanceName || !this.currentExperiment) return;
        
        this.currentInstance = instanceName;
        
        // Update URL with both experiment and instance
        this.updateURL(this.currentExperiment.name, instanceName);
        
        await this.loadTrajectoryData();
        this.updateUI();
    }

    async loadTrajectoryData() {
        if (!this.currentExperiment || !this.currentInstance) return;
        
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.style.display = 'block';
        
        try {
            const trajPath = `/mini-traj-web-browser/data/${this.currentExperiment.name}/${this.currentInstance}/${this.currentInstance}.traj.json`;
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
                    <p>Path: /mini-traj-web-browser/data/${this.currentExperiment.name}/${this.currentInstance}/${this.currentInstance}.traj.json</p>
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