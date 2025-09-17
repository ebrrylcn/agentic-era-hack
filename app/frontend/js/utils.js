// Utility functions for the Tour Guidance App

/**
 * Format date to dd.mm.yyyy format
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

/**
 * Parse date from dd.mm.yyyy format
 * @param {string} dateString - Date string in dd.mm.yyyy format
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
function parseDate(dateString) {
    if (!dateString) return null;

    const [day, month, year] = dateString.split('.');
    if (!day || !month || !year) return null;

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Validate the date
    if (date.getDate() !== parseInt(day) ||
        date.getMonth() !== parseInt(month) - 1 ||
        date.getFullYear() !== parseInt(year)) {
        return null;
    }

    return date;
}

/**
 * Validate date string format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid format
 */
function isValidDateFormat(dateString) {
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    return dateRegex.test(dateString) && parseDate(dateString) !== null;
}

/**
 * Get today's date in dd.mm.yyyy format
 * @returns {string} - Today's date string
 */
function getTodayString() {
    return formatDate(new Date());
}

/**
 * Add days to a date
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date with added days
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Calculate difference in days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of days
 */
function daysDifference(startDate, endDate) {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to execute immediately
 * @returns {Function} - Debounced function
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID string
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if empty
 */
function isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
}

/**
 * Sanitize HTML string
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Render markdown to HTML with safe sanitization
 * @param {string} markdown - Markdown string to render
 * @returns {string} - Rendered HTML string
 */
function renderMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') {
        return '';
    }

    try {
        // Configure marked options for better rendering
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true, // Convert line breaks to <br>
                gfm: true,    // GitHub Flavored Markdown
                sanitize: false, // We'll sanitize ourselves
                smartLists: true,
                smartypants: true
            });

            // Render markdown to HTML
            let html = marked.parse(markdown);

            // Basic XSS protection - remove dangerous tags but keep formatting
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
            html = html.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
            html = html.replace(/javascript:/gi, ''); // Remove javascript: URLs

            return html;
        }
    } catch (error) {
        console.warn('Error rendering markdown:', error);
    }

    // Fallback: return sanitized plain text with basic line break conversion
    return sanitizeHtml(markdown).replace(/\n/g, '<br>');
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get browser timezone
 * @returns {string} - Browser timezone
 */
function getBrowserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount, currency = 'USD') {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    } catch (error) {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

/**
 * Get current timestamp
 * @returns {string} - Current timestamp in ISO format
 */
function getCurrentTimestamp() {
    return new Date().toISOString();
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted time string
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

/**
 * Show notification to user
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showNotification(message, type = 'info', duration = 4000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            <span class="notification__message">${sanitizeHtml(message)}</span>
            <button class="notification__close" aria-label="Close">
                <span class="material-icons">close</span>
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);

    // Manual close
    notification.querySelector('.notification__close').addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

/**
 * Create and add CSS for notifications
 */
function addNotificationStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            max-width: 500px;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-family: 'Google Sans', sans-serif;
        }

        .notification--success {
            background-color: #34A853;
            color: white;
        }

        .notification--error {
            background-color: #EA4335;
            color: white;
        }

        .notification--warning {
            background-color: #FBBC04;
            color: #3C4043;
        }

        .notification--info {
            background-color: #4285F4;
            color: white;
        }

        .notification__content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .notification__message {
            flex: 1;
            margin-right: 12px;
        }

        .notification__close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            opacity: 0.8;
            transition: opacity 0.2s;
        }

        .notification__close:hover {
            opacity: 1;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

/**
 * Download text as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} contentType - MIME type (default: text/plain)
 */
function downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Check if device is mobile
 * @returns {boolean} - True if mobile device
 */
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if device is tablet
 * @returns {boolean} - True if tablet device
 */
function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

/**
 * Get viewport dimensions
 * @returns {Object} - Object with width and height
 */
function getViewportDimensions() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

/**
 * Initialize notification styles on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    addNotificationStyles();
});

// Export functions for use in other modules
window.Utils = {
    formatDate,
    parseDate,
    isValidDateFormat,
    getTodayString,
    addDays,
    daysDifference,
    debounce,
    throttle,
    generateId,
    deepClone,
    isEmpty,
    sanitizeHtml,
    renderMarkdown,
    formatNumber,
    toTitleCase,
    isValidEmail,
    getBrowserTimezone,
    formatCurrency,
    getCurrentTimestamp,
    formatTimestamp,
    showNotification,
    copyToClipboard,
    downloadFile,
    isMobile,
    isTablet,
    getViewportDimensions
};