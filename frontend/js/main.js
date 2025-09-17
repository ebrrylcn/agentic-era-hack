// Main application initialization and coordination

class TourGuidanceApp {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.modules = {};

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Tour Guidance App v' + this.version);

            // Check browser compatibility
            this.checkBrowserCompatibility();

            // Initialize core modules
            await this.initializeModules();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Setup error handling
            this.setupErrorHandling();

            // Initialize performance monitoring
            this.initializePerformanceMonitoring();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Initialize accessibility features
            this.initializeAccessibility();

            // Setup auto-update check
            this.setupAutoUpdate();

            this.isInitialized = true;
            console.log('✅ Tour Guidance App initialized successfully');

            // Show app ready notification
            this.showAppReadyNotification();

        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Check browser compatibility
     */
    checkBrowserCompatibility() {
        const features = {
            'localStorage': typeof Storage !== 'undefined',
            'Promise': typeof Promise !== 'undefined',
            'fetch': typeof fetch !== 'undefined',
            'classList': 'classList' in document.createElement('div'),
            'addEventListener': 'addEventListener' in window
        };

        const unsupportedFeatures = Object.entries(features)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);

        if (unsupportedFeatures.length > 0) {
            console.warn('⚠️ Browser compatibility issues:', unsupportedFeatures);
            this.showBrowserCompatibilityWarning(unsupportedFeatures);
        }
    }

    /**
     * Initialize core modules
     */
    async initializeModules() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize modules in order
        console.log('📦 Initializing modules...');

        // Core utilities are already loaded
        this.modules.utils = window.Utils;
        this.modules.storage = window.Storage;

        // Wait for configuration to load if available
        if (window.appConfig) {
            try {
                await window.appConfig.waitForLoad(3000);
                this.modules.config = window.appConfig;
                console.log('⚙️ Configuration loaded');
            } catch (error) {
                console.warn('⚠️ Configuration loading timeout, continuing without config');
            }
        }

        // Form manager will be initialized by form.js
        this.waitForModule('formManager', 5000).then(() => {
            this.modules.form = window.formManager;
            console.log('📋 Form manager initialized');
        }).catch(() => {
            console.log('📋 Form manager not available (normal for routes page)');
        });

        // Chat manager will be initialized by chat.js
        this.waitForModule('chatManager', 5000).then(() => {
            this.modules.chat = window.chatManager;
            console.log('💬 Chat manager initialized');
        }).catch(() => {
            console.log('💬 Chat manager not available');
        });

        // Map manager will be initialized by maps.js (only on routes page)
        this.waitForModule('mapManager', 5000).then(() => {
            this.modules.map = window.mapManager;
            console.log('🗺️ Map manager initialized');
        }).catch(() => {
            console.log('🗺️ Map manager not available (normal for form page)');
        });
    }

    /**
     * Wait for a module to be available
     */
    waitForModule(moduleName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkModule = () => {
                if (window[moduleName]) {
                    resolve(window[moduleName]);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Module ${moduleName} failed to load within ${timeout}ms`));
                } else {
                    setTimeout(checkModule, 100);
                }
            };

            checkModule();
        });
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Window beforeunload (save data before leaving)
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });

        // Online/offline status
        window.addEventListener('online', () => {
            Utils.showNotification('Connection restored', 'success');
            console.log('🌐 Back online');
        });

        window.addEventListener('offline', () => {
            Utils.showNotification('No internet connection', 'warning', 6000);
            console.log('📵 Gone offline');
        });

        // Orientation change (mobile)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Focus management
        window.addEventListener('focus', () => {
            this.handleWindowFocus();
        });

        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('💥 Global error:', event.error);
            this.logError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('💥 Unhandled promise rejection:', event.reason);
            this.logError('Promise Rejection', event.reason);
            event.preventDefault(); // Prevent default browser behavior
        });

        // Network errors
        window.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                console.error('📡 Resource loading error:', event.target.src || event.target.href);
                this.logError('Resource Error', new Error('Failed to load resource'), {
                    resource: event.target.src || event.target.href,
                    type: event.target.tagName
                });
            }
        }, true);
    }

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        // Performance observer for monitoring
        if ('PerformanceObserver' in window) {
            // Monitor long tasks
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            console.warn('🐌 Long task detected:', entry.duration + 'ms');
                        }
                    }
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('Long task observer not supported');
            }
        }

        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
                    console.log(`📊 Page load time: ${loadTime.toFixed(2)}ms`);

                    if (loadTime > 3000) {
                        console.warn('⚠️ Slow page load detected');
                    }
                }
            }, 1000);
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const shortcuts = {
            'ctrl+k': () => this.modules.chat?.toggleChat(),
            'ctrl+shift+k': () => this.modules.chat?.clearConversation(),
            'ctrl+s': (e) => {
                e.preventDefault();
                this.saveCurrentState();
            },
            'ctrl+/': () => this.showKeyboardShortcuts(),
            'f1': (e) => {
                e.preventDefault();
                this.showHelp();
            }
        };

        document.addEventListener('keydown', (e) => {
            const key = this.getKeyboardShortcut(e);
            if (shortcuts[key]) {
                shortcuts[key](e);
            }
        });
    }

    /**
     * Get keyboard shortcut string
     */
    getKeyboardShortcut(event) {
        const parts = [];

        if (event.ctrlKey || event.metaKey) parts.push('ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');

        const key = event.key.toLowerCase();
        parts.push(key);

        return parts.join('+');
    }

    /**
     * Initialize accessibility features
     */
    initializeAccessibility() {
        // Skip link for keyboard users
        this.createSkipLink();

        // Focus management
        this.setupFocusManagement();

        // High contrast mode detection
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
            console.log('🎯 High contrast mode detected');
        }

        // Reduced motion detection
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
            console.log('🎬 Reduced motion preference detected');
        }

        // Screen reader announcements
        this.createAriaLiveRegion();
    }

    /**
     * Create skip link for accessibility
     */
    createSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--google-blue);
            color: white;
            padding: 8px;
            text-decoration: none;
            transition: top 0.3s;
            z-index: 1000;
        `;

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main content landmark
        const mainContent = document.querySelector('main');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focus for accessibility
        let lastFocusedElement = null;

        document.addEventListener('focusin', (e) => {
            lastFocusedElement = e.target;
        });

        // Store last focused element for restoration
        window.addEventListener('beforeunload', () => {
            if (lastFocusedElement && lastFocusedElement.id) {
                sessionStorage.setItem('lastFocusedElement', lastFocusedElement.id);
            }
        });

        // Restore focus on page load
        window.addEventListener('load', () => {
            const lastFocusedId = sessionStorage.getItem('lastFocusedElement');
            if (lastFocusedId) {
                const element = document.getElementById(lastFocusedId);
                if (element) {
                    setTimeout(() => {
                        element.focus();
                    }, 100);
                }
                sessionStorage.removeItem('lastFocusedElement');
            }
        });
    }

    /**
     * Create ARIA live region for announcements
     */
    createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'aria-live-region';
        liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;

        document.body.appendChild(liveRegion);

        // Make it available globally
        window.announceToScreenReader = (message) => {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        };
    }

    /**
     * Setup auto-update check
     */
    setupAutoUpdate() {
        // Check for updates periodically (in a real app, this would check a server)
        setInterval(() => {
            this.checkForUpdates();
        }, 30 * 60 * 1000); // Check every 30 minutes
    }

    /**
     * Handle page hidden
     */
    handlePageHidden() {
        console.log('📱 Page hidden - saving state');
        this.saveCurrentState();
    }

    /**
     * Handle page visible
     */
    handlePageVisible() {
        console.log('📱 Page visible - checking for updates');
        // Optionally refresh data or check for updates
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        // Save current state
        this.saveCurrentState();

        // Don't warn for internal navigation
        const isInternalNav = document.querySelector('a[href*="routes.html"]:active, a[href*="index.html"]:active');
        if (isInternalNav) {
            return;
        }

        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            event.returnValue = message;
            return message;
        }
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        console.log('📱 Orientation changed');

        // Adjust layout if needed
        if (this.modules.chat && this.modules.chat.isOpen) {
            this.modules.chat.handleWindowResize();
        }

        // Announce orientation change to screen readers
        const orientation = window.orientation === 0 || window.orientation === 180 ? 'portrait' : 'landscape';
        if (window.announceToScreenReader) {
            window.announceToScreenReader(`Orientation changed to ${orientation}`);
        }
    }

    /**
     * Handle window focus
     */
    handleWindowFocus() {
        // Optional: refresh data or check for updates
    }

    /**
     * Handle window blur
     */
    handleWindowBlur() {
        // Optional: save state or pause certain operations
    }

    /**
     * Save current application state
     */
    saveCurrentState() {
        try {
            if (this.modules.form) {
                this.modules.form.saveFormData();
            }

            // Save app state
            const appState = {
                timestamp: Date.now(),
                url: window.location.href,
                formStep: this.modules.form?.currentStep || 1,
                chatOpen: this.modules.chat?.isOpen || false
            };

            localStorage.setItem('tour_guidance_app_state', JSON.stringify(appState));
            console.log('💾 App state saved');
        } catch (error) {
            console.error('Failed to save app state:', error);
        }
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        // Check if form has been modified since last save
        if (this.modules.form) {
            const lastSaved = Storage.form.getItem('current_form_data');
            const currentData = this.modules.form.formData;

            if (lastSaved) {
                return JSON.stringify(lastSaved) !== JSON.stringify(currentData);
            }
        }

        return false;
    }

    /**
     * Log error for monitoring
     */
    logError(type, error, metadata = {}) {
        const errorLog = {
            type,
            message: error.message || String(error),
            stack: error.stack,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metadata
        };

        // Log to console
        console.error(`📝 Error logged:`, errorLog);

        // In a real app, send to error tracking service
        // this.sendErrorToService(errorLog);

        // Store locally for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('tour_guidance_errors') || '[]');
            errors.push(errorLog);

            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }

            localStorage.setItem('tour_guidance_errors', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to store error log:', e);
        }
    }

    /**
     * Check for application updates
     */
    checkForUpdates() {
        // In a real app, this would check a server for updates
        console.log('🔄 Checking for updates...');

        // Simulate update check
        const lastCheck = localStorage.getItem('tour_guidance_last_update_check');
        const now = Date.now();

        if (!lastCheck || now - parseInt(lastCheck) > 24 * 60 * 60 * 1000) {
            localStorage.setItem('tour_guidance_last_update_check', now.toString());
            console.log('✅ Update check complete');
        }
    }

    /**
     * Show app ready notification
     */
    showAppReadyNotification() {
        // Only show on first load
        const hasShownWelcome = sessionStorage.getItem('tour_guidance_welcome_shown');

        if (!hasShownWelcome) {
            setTimeout(() => {
                Utils.showNotification('Welcome to Tour Guidance! Start planning your perfect trip.', 'info', 5000);
                sessionStorage.setItem('tour_guidance_welcome_shown', 'true');
            }, 1000);
        }
    }

    /**
     * Show browser compatibility warning
     */
    showBrowserCompatibilityWarning(unsupportedFeatures) {
        const message = `Your browser doesn't support some features: ${unsupportedFeatures.join(', ')}. Please update your browser for the best experience.`;
        Utils.showNotification(message, 'warning', 10000);
    }

    /**
     * Handle initialization error
     */
    handleInitializationError(error) {
        const errorMessage = 'Failed to initialize the application. Please refresh the page and try again.';

        // Show user-friendly error
        Utils.showNotification(errorMessage, 'error', 0);

        // Log detailed error
        this.logError('Initialization Error', error);

        // Attempt to recover
        setTimeout(() => {
            if (confirm('The application failed to start properly. Would you like to refresh the page?')) {
                window.location.reload();
            }
        }, 2000);
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardShortcuts() {
        const shortcuts = [
            'Ctrl/Cmd + K: Toggle chat',
            'Ctrl/Cmd + S: Save current state',
            'Ctrl/Cmd + /: Show this help',
            'F1: Show general help',
            'Escape: Close modals/chat'
        ];

        const message = '<strong>Keyboard Shortcuts:</strong><br>' + shortcuts.join('<br>');
        Utils.showNotification(message, 'info', 8000);
    }

    /**
     * Show general help
     */
    showHelp() {
        const helpMessage = `
            <strong>Tour Guidance App Help</strong><br><br>
            This app helps you plan your perfect trip by collecting your preferences and generating personalized recommendations.<br><br>
            <strong>Getting Started:</strong><br>
            1. Fill out the planning form<br>
            2. Use the chat for questions<br>
            3. Review your generated plan<br><br>
            Need more help? Use the chat assistant!
        `;

        Utils.showNotification(helpMessage, 'info', 10000);
    }

    /**
     * Get application information
     */
    getAppInfo() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            modules: Object.keys(this.modules),
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
                } : 'Not available'
            },
            storage: {
                localStorage: Storage.form.getStorageSize() + ' bytes'
            }
        };
    }
}

// Initialize the application
const app = new TourGuidanceApp();

// Make app available globally for debugging
window.tourGuidanceApp = app;