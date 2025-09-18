/**
 * Authentication Helper
 * Automatically fetches and maintains Google Cloud access token
 */

(function() {
    'use strict';

    let tokenRefreshTimer = null;
    let currentTokenExpiry = null;

    /**
     * Fetch access token from server
     */
    async function fetchAccessToken() {
        try {
            const response = await fetch('/api/auth/token');

            if (!response.ok) {
                console.warn('Failed to fetch access token from server');
                return null;
            }

            const data = await response.json();

            if (data.accessToken) {
                // Store token in the hidden input field
                const tokenInput = document.getElementById('googleAccessToken');
                if (tokenInput) {
                    tokenInput.value = data.accessToken;
                    console.log('Access token loaded successfully');

                    // Store expiry time
                    currentTokenExpiry = data.expiresAt || (Date.now() + 3000000);

                    // Dispatch event to notify token is ready
                    window.dispatchEvent(new CustomEvent('tokenReady', {
                        detail: { token: data.accessToken }
                    }));
                }

                // Schedule refresh 5 minutes before expiry (tokens last ~1 hour, refresh at 45-50 min)
                const timeUntilRefresh = Math.max(
                    currentTokenExpiry - Date.now() - (5 * 60 * 1000), // 5 minutes before expiry
                    30000 // Minimum 30 seconds
                );

                scheduleTokenRefresh(timeUntilRefresh);

                return data.accessToken;
            }
        } catch (error) {
            console.error('Error fetching access token:', error);
        }

        return null;
    }

    /**
     * Schedule token refresh
     */
    function scheduleTokenRefresh(delay) {
        // Clear existing timer if any
        if (tokenRefreshTimer) {
            clearTimeout(tokenRefreshTimer);
        }

        console.log(`Token refresh scheduled in ${Math.round(delay / 1000)} seconds`);

        tokenRefreshTimer = setTimeout(async () => {
            console.log('Refreshing access token...');
            await fetchAccessToken();
        }, delay);
    }

    /**
     * Initialize authentication
     */
    async function initAuth() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAuth);
            return;
        }

        // Check if we're in local development (user might want to use manual token)
        const isLocalDev = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';

        // Fetch and set token
        const token = await fetchAccessToken();

        if (!token && !isLocalDev) {
            console.warn('No access token available. Some features may not work.');
        }

        // Hide token input UI
        const tokenContainer = document.querySelector('.access-token-container');
        if (tokenContainer) {
            tokenContainer.style.display = 'none';
        }

        // For local dev, provide option to show manual input
        if (isLocalDev && !token) {
            // Create a small toggle button for developers
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = 'Show Manual Token Input';
            toggleBtn.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; font-size: 12px;';
            toggleBtn.onclick = () => {
                if (tokenContainer) {
                    tokenContainer.style.display = tokenContainer.style.display === 'none' ? '' : 'none';
                }
            };
            document.body.appendChild(toggleBtn);
        }
    }

    // Start initialization
    initAuth();

    // Handle page visibility changes - refresh token when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Check if token needs refresh when page becomes visible
            if (currentTokenExpiry && Date.now() > currentTokenExpiry - (10 * 60 * 1000)) {
                // If within 10 minutes of expiry, refresh now
                console.log('Token near expiry, refreshing...');
                fetchAccessToken();
            }
        }
    });

})();