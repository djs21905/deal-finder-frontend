// Configuration UI module
// Handles all UI rendering for the Configuration Management Portal

const ConfigUI = {
    /**
     * Render the empty state when no configuration exists
     * @param {HTMLElement} container - The container element
     */
    renderEmptyState(container) {
        container.innerHTML = `
            <div class="config-empty-state">
                <div class="config-empty-icon">⚙️</div>
                <h2 class="config-empty-title">No Configuration Found</h2>
                <p class="config-empty-text">Create your first configuration to get started.</p>
                <button class="config-btn config-btn-primary" onclick="ConfigApp.navigateTo('editor')">
                    <span class="config-btn-icon">+</span>
                    Create Configuration
                </button>
            </div>
        `;
    },

    /**
     * Render loading state
     * @param {HTMLElement} container - The container element
     */
    renderLoading(container) {
        container.innerHTML = `
            <div class="config-loading">
                <div class="config-spinner"></div>
                <p>Loading configuration...</p>
            </div>
        `;
    },

    /**
     * Render error state
     * @param {HTMLElement} container - The container element
     * @param {string} message - Error message
     */
    renderError(container, message) {
        container.innerHTML = `
            <div class="config-error">
                <div class="config-error-icon">⚠️</div>
                <p class="config-error-message">${message}</p>
                <button class="config-btn config-btn-secondary" onclick="ConfigApp.refresh()">
                    Try Again
                </button>
            </div>
        `;
    },

    /**
     * Render the active configuration view
     * @param {HTMLElement} container - The container element
     * @param {object} configResponse - The configuration response object
     * @param {boolean} isPreview - Whether this is a preview (read-only) mode
     */
    renderConfigView(container, configResponse, isPreview = false) {
        const { version, config_data } = configResponse;
        const { defaults, items } = config_data;

        container.innerHTML = `
            <div class="config-view">
                <div class="config-header-card ${isPreview ? 'config-preview-mode' : ''}">
                    <div class="config-version-info">
                        <span class="config-version-badge ${isPreview ? 'preview' : 'active'}">
                            ${isPreview ? 'Preview' : 'Active'}
                        </span>
                        <h1 class="config-version-number">Version ${version}</h1>
                    </div>
                    <div class="config-header-actions">
                        ${isPreview ? `
                            <button class="config-btn config-btn-primary config-btn-activate" onclick="ConfigApp.activateVersion(${version})">
                                <span class="config-btn-icon">✓</span>
                                Activate This Version
                            </button>
                        ` : `
                            <button class="config-btn config-btn-secondary" onclick="ConfigApp.editConfig()">
                                <span class="config-btn-icon">✎</span>
                                Edit
                            </button>
                        `}
                    </div>
                </div>

                <section class="config-section">
                    <h2 class="config-section-title">Global Defaults</h2>
                    ${this.renderDefaults(defaults)}
                </section>

                <section class="config-section">
                    <h2 class="config-section-title">Items</h2>
                    <div class="config-items-search">
                        <input type="text" class="config-search-input" placeholder="Search items..." oninput="ConfigUI.filterItems(this.value)">
                    </div>
                    <div class="config-items-list" id="config-items-list">
                        ${this.renderItems(items)}
                    </div>
                </section>
            </div>
        `;

        // Store items for filtering
        container.dataset.items = JSON.stringify(items);
    },

    /**
     * Render the defaults section with accordions
     * @param {object} defaults - The defaults object
     * @returns {string} HTML string
     */
    renderDefaults(defaults) {
        if (!defaults) {
            return '<p class="config-no-data">No defaults configured</p>';
        }

        const { allowed_states, facebook, craigslist, ebay } = defaults;

        return `
            <div class="config-defaults">
                <!-- Allowed States -->
                <div class="config-accordion">
                    <button class="config-accordion-header" onclick="ConfigUI.toggleAccordion(this)">
                        <span class="config-accordion-title">
                            <span class="config-accordion-icon">🗺️</span>
                            Allowed States
                        </span>
                        <span class="config-accordion-count">${allowed_states?.length || 0}</span>
                        <span class="config-accordion-arrow">▼</span>
                    </button>
                    <div class="config-accordion-content">
                        ${this.renderChips(allowed_states, 'state')}
                    </div>
                </div>

                <!-- Facebook Settings -->
                <div class="config-accordion">
                    <button class="config-accordion-header" onclick="ConfigUI.toggleAccordion(this)">
                        <span class="config-accordion-title">
                            <span class="config-accordion-icon">📘</span>
                            Facebook
                        </span>
                        <span class="config-accordion-arrow">▼</span>
                    </button>
                    <div class="config-accordion-content">
                        ${this.renderObjectProperties(facebook)}
                    </div>
                </div>

                <!-- Craigslist Settings -->
                <div class="config-accordion">
                    <button class="config-accordion-header" onclick="ConfigUI.toggleAccordion(this)">
                        <span class="config-accordion-title">
                            <span class="config-accordion-icon">📋</span>
                            Craigslist
                        </span>
                        <span class="config-accordion-arrow">▼</span>
                    </button>
                    <div class="config-accordion-content">
                        ${this.renderObjectProperties(craigslist)}
                    </div>
                </div>

                <!-- eBay Settings -->
                <div class="config-accordion">
                    <button class="config-accordion-header" onclick="ConfigUI.toggleAccordion(this)">
                        <span class="config-accordion-title">
                            <span class="config-accordion-icon">🛒</span>
                            eBay
                        </span>
                        <span class="config-accordion-arrow">▼</span>
                    </button>
                    <div class="config-accordion-content">
                        ${this.renderObjectProperties(ebay)}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render chips for array values
     * @param {string[]} items - Array of strings
     * @param {string} type - Type of chip for styling
     * @returns {string} HTML string
     */
    renderChips(items, type = 'default') {
        if (!items || items.length === 0) {
            return '<p class="config-no-data">None configured</p>';
        }

        return `
            <div class="config-chips">
                ${items.map(item => `
                    <span class="config-chip config-chip-${type}">${item}</span>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render object properties as key-value pairs
     * @param {object} obj - Object to render
     * @returns {string} HTML string
     */
    renderObjectProperties(obj) {
        if (!obj || Object.keys(obj).length === 0) {
            return '<p class="config-no-data">No settings configured</p>';
        }

        return `
            <div class="config-properties">
                ${Object.entries(obj).map(([key, value]) => `
                    <div class="config-property">
                        <span class="config-property-key">${this.formatPropertyKey(key)}</span>
                        <span class="config-property-value">${this.formatPropertyValue(value)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Format property key for display
     * @param {string} key - Property key
     * @returns {string} Formatted key
     */
    formatPropertyKey(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    /**
     * Format property value for display
     * @param {any} value - Property value
     * @returns {string} Formatted value
     */
    formatPropertyValue(value) {
        if (typeof value === 'boolean') {
            return value ? '✓ Yes' : '✗ No';
        }
        if (Array.isArray(value)) {
            return value.join(', ') || 'None';
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return String(value);
    },

    /**
     * Render items list as expandable cards
     * @param {object[]} items - Array of item objects
     * @returns {string} HTML string
     */
    renderItems(items) {
        if (!items || items.length === 0) {
            return '<p class="config-no-data">No items configured</p>';
        }

        return items.map((item, index) => `
            <div class="config-item-card" data-item-name="${item.name?.toLowerCase() || ''}">
                <button class="config-item-header" onclick="ConfigUI.toggleItem(this)">
                    <div class="config-item-info">
                        <span class="config-item-name">${item.name || 'Unnamed Item'}</span>
                        <span class="config-item-price-range">
                            ${this.formatPriceRange(item.min_price, item.max_price)}
                        </span>
                    </div>
                    <span class="config-item-arrow">▼</span>
                </button>
                <div class="config-item-content">
                    ${item.aliases && item.aliases.length > 0 ? `
                        <div class="config-item-section">
                            <span class="config-item-label">Aliases</span>
                            ${this.renderChips(item.aliases, 'alias')}
                        </div>
                    ` : ''}
                    ${item.exclude_keywords && item.exclude_keywords.length > 0 ? `
                        <div class="config-item-section">
                            <span class="config-item-label">Excluded Keywords</span>
                            ${this.renderChips(item.exclude_keywords, 'exclude')}
                        </div>
                    ` : ''}
                    ${item.store_options && Object.keys(item.store_options).length > 0 ? `
                        <div class="config-item-section">
                            <span class="config-item-label">Store Options</span>
                            ${this.renderObjectProperties(item.store_options)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    /**
     * Format price range for display
     * @param {number|null} minPrice - Minimum price
     * @param {number|null} maxPrice - Maximum price
     * @returns {string} Formatted price range
     */
    formatPriceRange(minPrice, maxPrice) {
        if (minPrice === null && maxPrice === null) {
            return '<span class="config-price-badge">Any Price</span>';
        }
        if (minPrice !== null && maxPrice !== null) {
            return `<span class="config-price-badge">$${minPrice} - $${maxPrice}</span>`;
        }
        if (minPrice !== null) {
            return `<span class="config-price-badge">$${minPrice}+</span>`;
        }
        return `<span class="config-price-badge">Up to $${maxPrice}</span>`;
    },

    /**
     * Toggle accordion open/closed
     * @param {HTMLElement} header - The accordion header element
     */
    toggleAccordion(header) {
        const accordion = header.closest('.config-accordion');
        accordion.classList.toggle('open');
    },

    /**
     * Toggle item card open/closed
     * @param {HTMLElement} header - The item header element
     */
    toggleItem(header) {
        const card = header.closest('.config-item-card');
        card.classList.toggle('open');
    },

    /**
     * Filter items by search query
     * @param {string} query - Search query
     */
    filterItems(query) {
        const items = document.querySelectorAll('.config-item-card');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const name = item.dataset.itemName || '';
            if (name.includes(lowerQuery) || query === '') {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    /**
     * Render version history list
     * @param {HTMLElement} container - The container element
     * @param {number[]} versions - Array of version numbers
     * @param {number} activeVersion - The currently active version
     */
    renderVersionHistory(container, versions, activeVersion) {
        if (!versions || versions.length === 0) {
            container.innerHTML = `
                <div class="config-empty-state">
                    <div class="config-empty-icon">📜</div>
                    <h2 class="config-empty-title">No Version History</h2>
                    <p class="config-empty-text">Configuration versions will appear here.</p>
                </div>
            `;
            return;
        }

        // Sort versions descending (newest first)
        const sortedVersions = [...versions].sort((a, b) => b - a);

        container.innerHTML = `
            <div class="config-history">
                <h1 class="config-page-title">Version History</h1>
                <div class="config-versions-list">
                    ${sortedVersions.map(version => `
                        <div class="config-version-card ${version === activeVersion ? 'active' : ''}" onclick="ConfigApp.previewVersion(${version})">
                            <div class="config-version-card-info">
                                <span class="config-version-card-number">Version ${version}</span>
                                ${version === activeVersion ? `
                                    <span class="config-version-active-badge">Active</span>
                                ` : ''}
                            </div>
                            <span class="config-version-card-arrow">→</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render the configuration editor form
     * @param {HTMLElement} container - The container element
     * @param {object|null} existingConfig - Existing configuration to prepopulate
     */
    renderEditor(container, existingConfig = null) {
        const config = existingConfig || {
            defaults: {
                allowed_states: [],
                facebook: {},
                craigslist: {},
                ebay: {}
            },
            items: []
        };

        container.innerHTML = `
            <div class="config-editor">
                <h1 class="config-page-title">${existingConfig ? 'Edit Configuration' : 'New Configuration'}</h1>
                
                <form id="config-form" class="config-form" onsubmit="ConfigApp.submitConfig(event)">
                    <!-- Defaults Section -->
                    <section class="config-editor-section">
                        <h2 class="config-editor-section-title">Global Defaults</h2>
                        
                        <!-- Allowed States -->
                        <div class="config-form-group">
                            <label class="config-form-label">Allowed States</label>
                            <div class="config-chip-input-container">
                                <div class="config-chip-input-chips" id="allowed-states-chips">
                                    ${(config.defaults?.allowed_states || []).map(state => `
                                        <span class="config-chip config-chip-editable config-chip-state">
                                            ${state}
                                            <button type="button" class="config-chip-remove" onclick="ConfigUI.removeChip(this, 'allowed-states-chips')">×</button>
                                        </span>
                                    `).join('')}
                                </div>
                                <input type="text" class="config-chip-input" placeholder="Add state (e.g., CA, TX)..." 
                                    onkeydown="ConfigUI.handleChipInput(event, 'allowed-states-chips', 'state')">
                            </div>
                            <span class="config-form-error" id="allowed-states-error"></span>
                        </div>

                        <!-- Platform Accordions -->
                        <div class="config-platform-editors">
                            ${this.renderPlatformEditor('facebook', 'Facebook', '📘', config.defaults?.facebook)}
                            ${this.renderPlatformEditor('craigslist', 'Craigslist', '📋', config.defaults?.craigslist)}
                            ${this.renderPlatformEditor('ebay', 'eBay', '🛒', config.defaults?.ebay)}
                        </div>
                    </section>

                    <!-- Items Section -->
                    <section class="config-editor-section">
                        <div class="config-editor-section-header">
                            <h2 class="config-editor-section-title">Items</h2>
                            <button type="button" class="config-btn config-btn-small" onclick="ConfigUI.addItem()">
                                <span class="config-btn-icon">+</span>
                                Add Item
                            </button>
                        </div>
                        
                        <div class="config-items-editor" id="config-items-editor">
                            ${(config.items || []).map((item, index) => this.renderItemEditor(item, index)).join('')}
                        </div>
                    </section>

                    <!-- Form Actions -->
                    <div class="config-form-actions">
                        <button type="button" class="config-btn config-btn-secondary" onclick="ConfigApp.cancelEdit()">
                            Cancel
                        </button>
                        <button type="submit" class="config-btn config-btn-primary">
                            <span class="config-btn-icon">💾</span>
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Store item count for adding new items
        window.configItemCount = config.items?.length || 0;
    },

    /**
     * Render platform settings editor
     * @param {string} platform - Platform identifier
     * @param {string} label - Display label
     * @param {string} icon - Icon emoji
     * @param {object} settings - Current settings
     * @returns {string} HTML string
     */
    renderPlatformEditor(platform, label, icon, settings = {}) {
        return `
            <div class="config-accordion config-platform-editor">
                <button type="button" class="config-accordion-header" onclick="ConfigUI.toggleAccordion(this)">
                    <span class="config-accordion-title">
                        <span class="config-accordion-icon">${icon}</span>
                        ${label} Settings
                    </span>
                    <span class="config-accordion-arrow">▼</span>
                </button>
                <div class="config-accordion-content">
                    <div class="config-json-editor">
                        <label class="config-form-label">JSON Settings</label>
                        <textarea class="config-json-textarea" 
                            name="${platform}" 
                            placeholder='{"key": "value"}'
                            rows="4">${JSON.stringify(settings, null, 2)}</textarea>
                        <span class="config-form-hint">Enter valid JSON for ${label} settings</span>
                        <span class="config-form-error" id="${platform}-error"></span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render individual item editor
     * @param {object} item - Item object
     * @param {number} index - Item index
     * @returns {string} HTML string
     */
    renderItemEditor(item = {}, index) {
        return `
            <div class="config-item-editor" data-item-index="${index}">
                <div class="config-item-editor-header">
                    <span class="config-item-editor-title">Item ${index + 1}</span>
                    <button type="button" class="config-btn-icon-only config-btn-delete" onclick="ConfigUI.removeItem(this)" title="Remove Item">
                        🗑️
                    </button>
                </div>
                
                <div class="config-form-group">
                    <label class="config-form-label">Name *</label>
                    <input type="text" class="config-form-input" name="item-name-${index}" 
                        value="${item.name || ''}" placeholder="Enter item name" required>
                    <span class="config-form-error" id="item-name-${index}-error"></span>
                </div>

                <div class="config-form-row">
                    <div class="config-form-group">
                        <label class="config-form-label">Min Price</label>
                        <input type="number" class="config-form-input" name="item-min-price-${index}" 
                            value="${item.min_price ?? ''}" placeholder="0" step="0.01">
                    </div>
                    <div class="config-form-group">
                        <label class="config-form-label">Max Price</label>
                        <input type="number" class="config-form-input" name="item-max-price-${index}" 
                            value="${item.max_price ?? ''}" placeholder="1000" step="0.01">
                    </div>
                </div>

                <div class="config-form-group">
                    <label class="config-form-label">Aliases</label>
                    <div class="config-chip-input-container">
                        <div class="config-chip-input-chips" id="item-aliases-${index}">
                            ${(item.aliases || []).map(alias => `
                                <span class="config-chip config-chip-editable config-chip-alias">
                                    ${alias}
                                    <button type="button" class="config-chip-remove" onclick="ConfigUI.removeChip(this, 'item-aliases-${index}')">×</button>
                                </span>
                            `).join('')}
                        </div>
                        <input type="text" class="config-chip-input" placeholder="Add alias..." 
                            onkeydown="ConfigUI.handleChipInput(event, 'item-aliases-${index}', 'alias')">
                    </div>
                </div>

                <div class="config-form-group">
                    <label class="config-form-label">Exclude Keywords</label>
                    <div class="config-chip-input-container">
                        <div class="config-chip-input-chips" id="item-exclude-${index}">
                            ${(item.exclude_keywords || []).map(keyword => `
                                <span class="config-chip config-chip-editable config-chip-exclude">
                                    ${keyword}
                                    <button type="button" class="config-chip-remove" onclick="ConfigUI.removeChip(this, 'item-exclude-${index}')">×</button>
                                </span>
                            `).join('')}
                        </div>
                        <input type="text" class="config-chip-input" placeholder="Add keyword to exclude..." 
                            onkeydown="ConfigUI.handleChipInput(event, 'item-exclude-${index}', 'exclude')">
                    </div>
                </div>

                <div class="config-form-group">
                    <label class="config-form-label">Store Options (JSON)</label>
                    <textarea class="config-json-textarea" name="item-store-options-${index}" 
                        placeholder='{"key": "value"}' rows="2">${JSON.stringify(item.store_options || {}, null, 2)}</textarea>
                </div>
            </div>
        `;
    },

    /**
     * Add a new item to the editor
     */
    addItem() {
        const container = document.getElementById('config-items-editor');
        const index = window.configItemCount++;
        const itemHtml = this.renderItemEditor({}, index);
        container.insertAdjacentHTML('beforeend', itemHtml);
    },

    /**
     * Remove an item from the editor
     * @param {HTMLElement} button - The delete button
     */
    removeItem(button) {
        const itemEditor = button.closest('.config-item-editor');
        itemEditor.remove();
    },

    /**
     * Handle chip input (Enter/comma to add)
     * @param {KeyboardEvent} event - Keyboard event
     * @param {string} containerId - ID of the chips container
     * @param {string} chipType - Type of chip for styling
     */
    handleChipInput(event, containerId, chipType) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            const input = event.target;
            const value = input.value.trim().replace(',', '');

            if (value) {
                const container = document.getElementById(containerId);
                const chipHtml = `
                    <span class="config-chip config-chip-editable config-chip-${chipType}">
                        ${value}
                        <button type="button" class="config-chip-remove" onclick="ConfigUI.removeChip(this, '${containerId}')">×</button>
                    </span>
                `;
                container.insertAdjacentHTML('beforeend', chipHtml);
                input.value = '';
            }
        }
    },

    /**
     * Remove a chip from the container
     * @param {HTMLElement} button - The remove button
     * @param {string} containerId - ID of the chips container
     */
    removeChip(button, containerId) {
        const chip = button.closest('.config-chip');
        chip.remove();
    },

    /**
     * Get chips values from a container
     * @param {string} containerId - ID of the chips container
     * @returns {string[]} Array of chip values
     */
    getChipsValues(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];

        const chips = container.querySelectorAll('.config-chip');
        return Array.from(chips).map(chip => {
            // Get text content without the remove button text
            const clone = chip.cloneNode(true);
            const button = clone.querySelector('.config-chip-remove');
            if (button) button.remove();
            return clone.textContent.trim();
        });
    },

    /**
     * Display validation errors on form fields
     * @param {ValidationError[]} errors - Array of validation errors
     */
    displayValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.config-form-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        document.querySelectorAll('.config-form-input, .config-json-textarea').forEach(el => {
            el.classList.remove('config-input-error');
        });

        if (!errors || errors.length === 0) return;

        errors.forEach(error => {
            const { loc, msg } = error;
            // loc is an array like ["body", "items", 0, "name"]
            const fieldPath = loc.slice(1); // Remove "body"
            let fieldId = '';

            if (fieldPath[0] === 'defaults') {
                if (fieldPath[1] === 'allowed_states') {
                    fieldId = 'allowed-states-error';
                } else if (['facebook', 'craigslist', 'ebay'].includes(fieldPath[1])) {
                    fieldId = `${fieldPath[1]}-error`;
                }
            } else if (fieldPath[0] === 'items') {
                const itemIndex = fieldPath[1];
                const field = fieldPath[2];
                if (field === 'name') {
                    fieldId = `item-name-${itemIndex}-error`;
                }
            }

            if (fieldId) {
                const errorEl = document.getElementById(fieldId);
                if (errorEl) {
                    errorEl.textContent = msg;
                    errorEl.style.display = 'block';

                    // Also highlight the input
                    const inputEl = errorEl.previousElementSibling;
                    if (inputEl && (inputEl.classList.contains('config-form-input') || inputEl.classList.contains('config-json-textarea'))) {
                        inputEl.classList.add('config-input-error');
                    }
                }
            }
        });
    },

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', or 'info'
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.config-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `config-toast config-toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Expose to global scope
window.ConfigUI = ConfigUI;
