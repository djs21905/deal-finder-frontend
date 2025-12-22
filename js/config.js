// Configuration App main module
// Orchestrates state management and connects API with UI

// Application state
const ConfigState = {
    activeConfig: null,
    activeVersion: null,
    previewConfig: null,
    previewVersion: null,
    versions: [],
    currentView: 'active', // 'active', 'history', 'editor'
    isLoading: false,
    editMode: false
};

/**
 * Configuration Application Controller
 */
const ConfigApp = {
    /**
     * Initialize the application
     */
    async init() {
        // Set up navigation
        this.setupNavigation();

        // Load initial data
        await this.loadActiveConfig();
    },

    /**
     * Set up bottom navigation handlers
     */
    setupNavigation() {
        // Navigation is handled via onclick in HTML
        this.updateNavActive('active');
    },

    /**
     * Update navigation active state
     * @param {string} view - The current view
     */
    updateNavActive(view) {
        document.querySelectorAll('.config-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
    },

    /**
     * Navigate to a specific view
     * @param {string} view - View name ('active', 'history', 'editor')
     */
    async navigateTo(view) {
        ConfigState.currentView = view;
        this.updateNavActive(view);

        const container = document.getElementById('config-content');

        switch (view) {
            case 'active':
                await this.loadActiveConfig();
                break;
            case 'history':
                await this.loadVersionHistory();
                break;
            case 'editor':
                this.showEditor();
                break;
        }
    },

    /**
     * Load and display the active configuration
     */
    async loadActiveConfig() {
        const container = document.getElementById('config-content');
        ConfigUI.renderLoading(container);

        const { data, error } = await ConfigAPI.getActiveConfig();

        if (error) {
            if (error.status === 404) {
                ConfigState.activeConfig = null;
                ConfigState.activeVersion = null;
                ConfigUI.renderEmptyState(container);
            } else {
                ConfigUI.renderError(container, error.detail);
            }
            return;
        }

        ConfigState.activeConfig = data.config_data;
        ConfigState.activeVersion = data.version;
        ConfigUI.renderConfigView(container, data, false);
    },

    /**
     * Load and display version history
     */
    async loadVersionHistory() {
        const container = document.getElementById('config-content');
        ConfigUI.renderLoading(container);

        const { data, error } = await ConfigAPI.getAllVersions();

        if (error) {
            ConfigUI.renderError(container, error.detail);
            return;
        }

        ConfigState.versions = data;
        ConfigUI.renderVersionHistory(container, data, ConfigState.activeVersion);
    },

    /**
     * Preview a specific version
     * @param {number} version - Version number to preview
     */
    async previewVersion(version) {
        const container = document.getElementById('config-content');
        ConfigUI.renderLoading(container);

        const { data, error } = await ConfigAPI.getConfigByVersion(version);

        if (error) {
            ConfigUI.renderError(container, error.detail);
            return;
        }

        ConfigState.previewConfig = data.config_data;
        ConfigState.previewVersion = data.version;

        // Show in preview mode (read-only with activate button if not active)
        const isActive = data.version === ConfigState.activeVersion;
        ConfigUI.renderConfigView(container, data, !isActive);
    },

    /**
     * Activate a specific version
     * @param {number} version - Version number to activate
     */
    async activateVersion(version) {
        const container = document.getElementById('config-content');

        // Show loading state on button
        const activateBtn = container.querySelector('.config-btn-activate');
        if (activateBtn) {
            activateBtn.disabled = true;
            activateBtn.innerHTML = '<span class="config-spinner-small"></span> Activating...';
        }

        const { data, error } = await ConfigAPI.activateVersion(version);

        if (error) {
            ConfigUI.showToast(error.detail, 'error');
            if (activateBtn) {
                activateBtn.disabled = false;
                activateBtn.innerHTML = '<span class="config-btn-icon">✓</span> Activate This Version';
            }
            return;
        }

        // Update state
        ConfigState.activeConfig = data.config_data;
        ConfigState.activeVersion = data.version;

        ConfigUI.showToast(`Version ${version} is now active!`, 'success');

        // Navigate to active view
        this.navigateTo('active');
    },

    /**
     * Show the editor form
     * @param {object|null} config - Configuration to edit (null for new)
     */
    showEditor(config = null) {
        const container = document.getElementById('config-content');
        const configToEdit = config || ConfigState.activeConfig;
        ConfigUI.renderEditor(container, configToEdit);
        ConfigState.editMode = true;
    },

    /**
     * Edit the current configuration
     */
    editConfig() {
        ConfigState.currentView = 'editor';
        this.updateNavActive('editor');
        this.showEditor(ConfigState.activeConfig);
    },

    /**
     * Cancel editing and return to active view
     */
    cancelEdit() {
        ConfigState.editMode = false;
        this.navigateTo('active');
    },

    /**
     * Submit the configuration form
     * @param {Event} event - Form submit event
     */
    async submitConfig(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Build the configuration object from form
        const config = this.buildConfigFromForm(form);

        if (!config) return; // Validation failed

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="config-spinner-small"></span> Saving...';

        const { data, error, validationErrors } = await ConfigAPI.createConfig(config);

        if (error) {
            if (error.status === 422 && validationErrors) {
                ConfigUI.displayValidationErrors(validationErrors);
                ConfigUI.showToast('Please fix the validation errors', 'error');
            } else {
                ConfigUI.showToast(error.detail, 'error');
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="config-btn-icon">💾</span> Save Configuration';
            return;
        }

        // Success! 
        ConfigState.activeConfig = data.config_data;
        ConfigState.activeVersion = data.version;
        ConfigState.editMode = false;

        ConfigUI.showToast(`Configuration v${data.version} created!`, 'success');

        // Navigate to view the newly created version (AC 3.5)
        this.navigateTo('active');
    },

    /**
     * Build configuration object from form data
     * @param {HTMLFormElement} form - The form element
     * @returns {object|null} Configuration object or null if validation fails
     */
    buildConfigFromForm(form) {
        try {
            // Get defaults
            const allowedStates = ConfigUI.getChipsValues('allowed-states-chips');

            // Parse JSON for platform settings
            const facebookText = form.querySelector('[name="facebook"]').value.trim();
            const craigslistText = form.querySelector('[name="craigslist"]').value.trim();
            const ebayText = form.querySelector('[name="ebay"]').value.trim();

            let facebook = {};
            let craigslist = {};
            let ebay = {};

            try {
                if (facebookText) facebook = JSON.parse(facebookText);
            } catch (e) {
                ConfigUI.showToast('Invalid JSON in Facebook settings', 'error');
                return null;
            }

            try {
                if (craigslistText) craigslist = JSON.parse(craigslistText);
            } catch (e) {
                ConfigUI.showToast('Invalid JSON in Craigslist settings', 'error');
                return null;
            }

            try {
                if (ebayText) ebay = JSON.parse(ebayText);
            } catch (e) {
                ConfigUI.showToast('Invalid JSON in eBay settings', 'error');
                return null;
            }

            const defaults = {
                allowed_states: allowedStates,
                facebook,
                craigslist,
                ebay
            };

            // Get items
            const itemEditors = form.querySelectorAll('.config-item-editor');
            const items = [];

            itemEditors.forEach((editor, idx) => {
                const index = editor.dataset.itemIndex;
                const name = form.querySelector(`[name="item-name-${index}"]`)?.value.trim() || '';
                const minPriceVal = form.querySelector(`[name="item-min-price-${index}"]`)?.value;
                const maxPriceVal = form.querySelector(`[name="item-max-price-${index}"]`)?.value;
                const aliases = ConfigUI.getChipsValues(`item-aliases-${index}`);
                const excludeKeywords = ConfigUI.getChipsValues(`item-exclude-${index}`);

                let storeOptions = {};
                const storeOptionsText = form.querySelector(`[name="item-store-options-${index}"]`)?.value.trim();
                try {
                    if (storeOptionsText) storeOptions = JSON.parse(storeOptionsText);
                } catch (e) {
                    ConfigUI.showToast(`Invalid JSON in Item ${idx + 1} store options`, 'error');
                    return null;
                }

                items.push({
                    name,
                    aliases,
                    min_price: minPriceVal ? parseFloat(minPriceVal) : null,
                    max_price: maxPriceVal ? parseFloat(maxPriceVal) : null,
                    exclude_keywords: excludeKeywords,
                    store_options: storeOptions
                });
            });

            return { defaults, items };
        } catch (e) {
            ConfigUI.showToast('Error building configuration', 'error');
            console.error(e);
            return null;
        }
    },

    /**
     * Refresh the current view
     */
    refresh() {
        this.navigateTo(ConfigState.currentView);
    }
};

// Expose to global scope
window.ConfigApp = ConfigApp;
window.ConfigState = ConfigState;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ConfigApp.init();
});
