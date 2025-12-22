// Configuration API module
// Handles all API calls for the Configuration Management Portal

// Configurable API base URL - change this based on environment
const CONFIG_API_BASE_URL = window.CONFIG_API_URL || '/config';

/**
 * Get the authorization headers with JWT from Supabase
 * @returns {Promise<object>} Headers object with Authorization
 */
async function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (window.supabase) {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    }

    return headers;
}

/**
 * Configuration API client
 */
const ConfigAPI = {
    /**
     * Get the active configuration
     * @returns {Promise<{data: ConfigResponse|null, error: {status: number, detail: string}|null}>}
     */
    async getActiveConfig() {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${CONFIG_API_BASE_URL}/`, { headers });
            if (response.status === 404) {
                return { data: null, error: { status: 404, detail: 'No active configuration found.' } };
            }
            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: { status: response.status, detail: error.detail || 'Failed to fetch active configuration' } };
            }
            const data = await response.json();
            return { data, error: null };
        } catch (err) {
            return { data: null, error: { status: 0, detail: err.message } };
        }
    },

    /**
     * Get all configuration versions
     * @returns {Promise<{data: number[]|null, error: object|null}>}
     */
    async getAllVersions() {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${CONFIG_API_BASE_URL}/versions`, { headers });
            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: { status: response.status, detail: error.detail || 'Failed to fetch versions' } };
            }
            const data = await response.json();
            return { data, error: null };
        } catch (err) {
            return { data: null, error: { status: 0, detail: err.message } };
        }
    },

    /**
     * Get configuration by version number
     * @param {number} version - The version number to fetch
     * @returns {Promise<{data: ConfigResponse|null, error: object|null}>}
     */
    async getConfigByVersion(version) {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${CONFIG_API_BASE_URL}/${version}`, { headers });
            if (response.status === 404) {
                return { data: null, error: { status: 404, detail: 'Configuration not found for this version.' } };
            }
            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: { status: response.status, detail: error.detail || 'Failed to fetch configuration' } };
            }
            const data = await response.json();
            return { data, error: null };
        } catch (err) {
            return { data: null, error: { status: 0, detail: err.message } };
        }
    },

    /**
     * Activate a specific configuration version
     * @param {number} version - The version number to activate
     * @returns {Promise<{data: ConfigResponse|null, error: object|null}>}
     */
    async activateVersion(version) {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${CONFIG_API_BASE_URL}/${version}/activate`, {
                method: 'PATCH',
                headers
            });
            if (response.status === 404) {
                return { data: null, error: { status: 404, detail: 'Configuration not found for this version.' } };
            }
            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: { status: response.status, detail: error.detail || 'Failed to activate configuration' } };
            }
            const data = await response.json();
            return { data, error: null };
        } catch (err) {
            return { data: null, error: { status: 0, detail: err.message } };
        }
    },

    /**
     * Create a new configuration
     * @param {Config} config - The configuration object to create
     * @returns {Promise<{data: ConfigResponse|null, error: object|null, validationErrors: ValidationError[]|null}>}
     */
    async createConfig(config) {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${CONFIG_API_BASE_URL}/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(config)
            });
            if (response.status === 422) {
                const error = await response.json();
                return {
                    data: null,
                    error: { status: 422, detail: 'Validation error' },
                    validationErrors: error.detail || []
                };
            }
            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: { status: response.status, detail: error.detail || 'Failed to create configuration' }, validationErrors: null };
            }
            const data = await response.json();
            return { data, error: null, validationErrors: null };
        } catch (err) {
            return { data: null, error: { status: 0, detail: err.message }, validationErrors: null };
        }
    }
};

// Export for use in other modules
window.ConfigAPI = ConfigAPI;
