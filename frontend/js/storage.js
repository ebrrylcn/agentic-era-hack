// Local Storage utilities for the Tour Guidance App

class StorageManager {
    constructor(prefix = 'tour_guidance_') {
        this.prefix = prefix;
        this.isAvailable = this.checkStorageAvailability();
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} - True if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e);
            return false;
        }
    }

    /**
     * Generate full key with prefix
     * @param {string} key - Key name
     * @returns {string} - Prefixed key
     */
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Set item in localStorage
     * @param {string} key - Key name
     * @param {any} value - Value to store
     * @returns {boolean} - Success status
     */
    setItem(key, value) {
        if (!this.isAvailable) {
            console.warn('Storage not available');
            return false;
        }

        try {
            const serializedValue = JSON.stringify({
                value: value,
                timestamp: Date.now(),
                type: typeof value
            });
            localStorage.setItem(this.getKey(key), serializedValue);
            return true;
        } catch (e) {
            console.error('Error saving to storage:', e);
            return false;
        }
    }

    /**
     * Get item from localStorage
     * @param {string} key - Key name
     * @param {any} defaultValue - Default value if not found
     * @returns {any} - Retrieved value or default
     */
    getItem(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(this.getKey(key));
            if (item === null) {
                return defaultValue;
            }

            const parsed = JSON.parse(item);
            return parsed.value;
        } catch (e) {
            console.error('Error retrieving from storage:', e);
            return defaultValue;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Key name
     * @returns {boolean} - Success status
     */
    removeItem(key) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (e) {
            console.error('Error removing from storage:', e);
            return false;
        }
    }

    /**
     * Clear all items with this prefix
     * @returns {boolean} - Success status
     */
    clear() {
        if (!this.isAvailable) {
            return false;
        }

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Error clearing storage:', e);
            return false;
        }
    }

    /**
     * Get all keys with this prefix
     * @returns {Array} - Array of keys
     */
    getAllKeys() {
        if (!this.isAvailable) {
            return [];
        }

        try {
            const keys = Object.keys(localStorage);
            return keys
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.substring(this.prefix.length));
        } catch (e) {
            console.error('Error getting keys from storage:', e);
            return [];
        }
    }

    /**
     * Get storage size in bytes
     * @returns {number} - Storage size
     */
    getStorageSize() {
        if (!this.isAvailable) {
            return 0;
        }

        let total = 0;
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
                    total += localStorage[key].length + key.length;
                }
            }
        } catch (e) {
            console.error('Error calculating storage size:', e);
        }
        return total;
    }

    /**
     * Check if key exists
     * @param {string} key - Key name
     * @returns {boolean} - True if key exists
     */
    hasItem(key) {
        if (!this.isAvailable) {
            return false;
        }

        return localStorage.getItem(this.getKey(key)) !== null;
    }

    /**
     * Set item with expiration
     * @param {string} key - Key name
     * @param {any} value - Value to store
     * @param {number} expirationMs - Expiration time in milliseconds
     * @returns {boolean} - Success status
     */
    setItemWithExpiration(key, value, expirationMs) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            const item = {
                value: value,
                timestamp: Date.now(),
                expiration: Date.now() + expirationMs,
                type: typeof value
            };
            localStorage.setItem(this.getKey(key), JSON.stringify(item));
            return true;
        } catch (e) {
            console.error('Error saving to storage with expiration:', e);
            return false;
        }
    }

    /**
     * Get item if not expired
     * @param {string} key - Key name
     * @param {any} defaultValue - Default value if not found or expired
     * @returns {any} - Retrieved value or default
     */
    getItemWithExpiration(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(this.getKey(key));
            if (item === null) {
                return defaultValue;
            }

            const parsed = JSON.parse(item);

            // Check if item has expiration and is expired
            if (parsed.expiration && Date.now() > parsed.expiration) {
                this.removeItem(key);
                return defaultValue;
            }

            return parsed.value;
        } catch (e) {
            console.error('Error retrieving from storage with expiration:', e);
            return defaultValue;
        }
    }

    /**
     * Export all data to JSON
     * @returns {string} - JSON string of all data
     */
    exportData() {
        if (!this.isAvailable) {
            return '{}';
        }

        const data = {};
        try {
            const keys = this.getAllKeys();
            keys.forEach(key => {
                data[key] = this.getItem(key);
            });
            return JSON.stringify(data, null, 2);
        } catch (e) {
            console.error('Error exporting data:', e);
            return '{}';
        }
    }

    /**
     * Import data from JSON
     * @param {string} jsonData - JSON string to import
     * @param {boolean} overwrite - Whether to overwrite existing data
     * @returns {boolean} - Success status
     */
    importData(jsonData, overwrite = false) {
        if (!this.isAvailable) {
            return false;
        }

        try {
            const data = JSON.parse(jsonData);

            for (const [key, value] of Object.entries(data)) {
                if (overwrite || !this.hasItem(key)) {
                    this.setItem(key, value);
                }
            }
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
}

// Form-specific storage functions
class FormStorage extends StorageManager {
    constructor() {
        super('tour_form_');
        this.currentFormKey = 'current_form_data';
        this.formHistoryKey = 'form_history';
        this.maxHistoryItems = 10;
    }

    /**
     * Save current form data
     * @param {Object} formData - Form data object
     * @returns {boolean} - Success status
     */
    saveFormData(formData) {
        const dataWithMetadata = {
            ...formData,
            lastSaved: Date.now(),
            version: '1.0'
        };
        return this.setItem(this.currentFormKey, dataWithMetadata);
    }

    /**
     * Load current form data
     * @returns {Object|null} - Form data or null
     */
    loadFormData() {
        const data = this.getItem(this.currentFormKey);
        if (data && data.version) {
            delete data.lastSaved;
            delete data.version;
            return data;
        }
        return null;
    }

    /**
     * Clear current form data
     * @returns {boolean} - Success status
     */
    clearFormData() {
        return this.removeItem(this.currentFormKey);
    }

    /**
     * Save form to history
     * @param {Object} formData - Complete form data
     * @param {string} name - Name for this form (optional)
     * @returns {boolean} - Success status
     */
    saveToHistory(formData, name = '') {
        const history = this.getFormHistory();
        const historyItem = {
            id: Utils.generateId(),
            name: name || `Form ${Utils.formatTimestamp(Utils.getCurrentTimestamp())}`,
            data: formData,
            created: Date.now()
        };

        // Add to beginning of array
        history.unshift(historyItem);

        // Limit history size
        while (history.length > this.maxHistoryItems) {
            history.pop();
        }

        return this.setItem(this.formHistoryKey, history);
    }

    /**
     * Get form history
     * @returns {Array} - Array of form history items
     */
    getFormHistory() {
        return this.getItem(this.formHistoryKey, []);
    }

    /**
     * Load form from history
     * @param {string} historyId - ID of history item
     * @returns {Object|null} - Form data or null
     */
    loadFromHistory(historyId) {
        const history = this.getFormHistory();
        const item = history.find(h => h.id === historyId);
        return item ? item.data : null;
    }

    /**
     * Delete form from history
     * @param {string} historyId - ID of history item
     * @returns {boolean} - Success status
     */
    deleteFromHistory(historyId) {
        const history = this.getFormHistory();
        const filteredHistory = history.filter(h => h.id !== historyId);
        return this.setItem(this.formHistoryKey, filteredHistory);
    }

    /**
     * Get form auto-save status
     * @returns {boolean} - True if auto-save is enabled
     */
    getAutoSaveEnabled() {
        return this.getItem('auto_save_enabled', true);
    }

    /**
     * Set form auto-save status
     * @param {boolean} enabled - Auto-save enabled status
     * @returns {boolean} - Success status
     */
    setAutoSaveEnabled(enabled) {
        return this.setItem('auto_save_enabled', enabled);
    }

    /**
     * Get last form step
     * @returns {number} - Last active form step
     */
    getLastFormStep() {
        return this.getItem('last_form_step', 1);
    }

    /**
     * Set last form step
     * @param {number} step - Form step number
     * @returns {boolean} - Success status
     */
    setLastFormStep(step) {
        return this.setItem('last_form_step', step);
    }
}

// Chat-specific storage functions
class ChatStorage extends StorageManager {
    constructor() {
        super('tour_chat_');
        this.conversationKey = 'conversation_history';
        this.settingsKey = 'chat_settings';
        this.maxMessages = 100;
    }

    /**
     * Save chat message
     * @param {Object} message - Message object
     * @returns {boolean} - Success status
     */
    saveMessage(message) {
        const conversation = this.getConversation();
        const messageWithId = {
            id: Utils.generateId(),
            timestamp: Date.now(),
            ...message
        };

        conversation.push(messageWithId);

        // Limit conversation size
        while (conversation.length > this.maxMessages) {
            conversation.shift();
        }

        return this.setItem(this.conversationKey, conversation);
    }

    /**
     * Get conversation history
     * @returns {Array} - Array of messages
     */
    getConversation() {
        return this.getItem(this.conversationKey, []);
    }

    /**
     * Clear conversation history
     * @returns {boolean} - Success status
     */
    clearConversation() {
        return this.removeItem(this.conversationKey);
    }

    /**
     * Save chat settings
     * @param {Object} settings - Chat settings object
     * @returns {boolean} - Success status
     */
    saveChatSettings(settings) {
        return this.setItem(this.settingsKey, settings);
    }

    /**
     * Get chat settings
     * @returns {Object} - Chat settings
     */
    getChatSettings() {
        return this.getItem(this.settingsKey, {
            theme: 'light',
            fontSize: 'medium',
            soundEnabled: true,
            autoScroll: true,
            showTimestamps: true
        });
    }

    /**
     * Get chat width preference
     * @returns {string} - Chat width preference
     */
    getChatWidth() {
        return this.getItem('chat_width', '50%');
    }

    /**
     * Set chat width preference
     * @param {string} width - Chat width value
     * @returns {boolean} - Success status
     */
    setChatWidth(width) {
        return this.setItem('chat_width', width);
    }

    /**
     * Get user ID for ADK agent
     * @returns {string} - User ID
     */
    getUserId() {
        return this.getItem('user_id', null);
    }

    /**
     * Set user ID for ADK agent
     * @param {string} userId - User ID
     * @returns {boolean} - Success status
     */
    setUserId(userId) {
        return this.setItem('user_id', userId);
    }

    /**
     * Get session ID for ADK agent
     * @returns {string} - Session ID
     */
    getSessionId() {
        return this.getItem('session_id', null);
    }

    /**
     * Set session ID for ADK agent
     * @param {string} sessionId - Session ID
     * @returns {boolean} - Success status
     */
    setSessionId(sessionId) {
        return this.setItem('session_id', sessionId);
    }

    /**
     * Clear session (start new conversation)
     * @returns {boolean} - Success status
     */
    clearSession() {
        const sessionCleared = this.removeItem('session_id');
        const conversationCleared = this.clearConversation();
        return sessionCleared && conversationCleared;
    }

    /**
     * Export conversation to text
     * @returns {string} - Formatted conversation text
     */
    exportConversation() {
        const conversation = this.getConversation();
        let text = `Tour Guidance Chat Export\n`;
        text += `Generated: ${new Date().toLocaleString()}\n`;
        text += `Total Messages: ${conversation.length}\n\n`;
        text += '='.repeat(50) + '\n\n';

        conversation.forEach(message => {
            const time = new Date(message.timestamp).toLocaleString();
            const sender = message.type === 'user' ? 'You' : 'Assistant';
            text += `[${time}] ${sender}:\n${message.content}\n\n`;
        });

        return text;
    }
}

// Initialize storage instances
const formStorage = new FormStorage();
const chatStorage = new ChatStorage();

// Export for use in other modules
window.Storage = {
    form: formStorage,
    chat: chatStorage,
    StorageManager,
    FormStorage,
    ChatStorage
};