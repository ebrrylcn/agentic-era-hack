// Configuration loader for Tour Guidance App

class ConfigLoader {
    constructor() {
        this.config = {};
        this.loaded = false;
    }

    /**
     * Load configuration from .env file
     */
    async loadConfig() {
        try {
            // Try to load from parent directory .env file
            const response = await fetch('../.env');

            if (response.ok) {
                const envText = await response.text();
                this.parseEnvFile(envText);
            } else {
                console.warn('Could not load .env file, using fallback configuration');
                this.loadFallbackConfig();
            }
        } catch (error) {
            console.warn('Error loading .env file:', error);
            this.loadFallbackConfig();
        }

        this.loaded = true;
        console.log('Configuration loaded successfully');
    }

    /**
     * Parse .env file content
     */
    parseEnvFile(envText) {
        const lines = envText.split('\n');

        lines.forEach(line => {
            line = line.trim();

            // Skip empty lines and comments
            if (!line || line.startsWith('#')) {
                return;
            }

            // Parse KEY=VALUE or KEY="VALUE"
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                let key = line.substring(0, equalIndex).trim();
                let value = line.substring(equalIndex + 1).trim();

                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                this.config[key] = value;
            }
        });
    }

    /**
     * Load fallback configuration
     */
    loadFallbackConfig() {
        this.config = {
            GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE',
            GOOGLE_API_KEY: 'YOUR_API_KEY_HERE'
        };

        console.warn('Using fallback configuration. Please update with your actual API keys.');
    }

    /**
     * Get configuration value
     */
    get(key, defaultValue = null) {
        return this.config[key] || defaultValue;
    }

    /**
     * Get Google Maps API key
     */
    getGoogleMapsApiKey() {
        return this.get('GOOGLE_MAPS_API_KEY') || this.get('GOOGLE_API_KEY');
    }

    /**
     * Check if configuration is loaded
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Wait for configuration to load
     */
    async waitForLoad(timeout = 5000) {
        const startTime = Date.now();

        while (!this.loaded && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!this.loaded) {
            throw new Error('Configuration loading timeout');
        }

        return this.config;
    }
}

// Create global config instance
window.appConfig = new ConfigLoader();

// Auto-load configuration when script loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.appConfig.loadConfig();

        // Dispatch custom event when config is loaded
        window.dispatchEvent(new CustomEvent('configLoaded', {
            detail: window.appConfig.config
        }));
    } catch (error) {
        console.error('Failed to load configuration:', error);
    }
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
}