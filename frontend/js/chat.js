// Chat functionality for the Tour Guidance App

class ChatManager {
    constructor() {
        this.isOpen = false;
        this.isResizing = false;
        this.currentWidth = '50%';
        this.minWidth = 320;
        this.maxWidth = 75; // percentage
        this.resizeStartX = 0;
        this.resizeStartWidth = 0;
        this.conversation = [];
        this.settings = Storage.chat.getChatSettings();

        this.init();
    }

    /**
     * Initialize chat functionality
     */
    init() {
        this.setupEventListeners();
        this.loadConversation();
        this.setupResizeHandle();
        this.restoreChatWidth();
        this.initializeMDCComponents();
        this.checkADKConnection();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Chat toggle button
        const toggleBtn = document.getElementById('chatToggleBtn');
        const closeBtn = document.getElementById('chatCloseBtn');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleChat();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeChat();
            });
        }

        // Send message
        const sendBtn = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            chatInput.addEventListener('input', () => {
                this.updateSendButtonState();
            });
        }

        // Quick suggestions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-suggestions .mdc-chip')) {
                const chip = e.target.closest('.mdc-chip');
                const suggestion = chip.querySelector('.mdc-chip__text').textContent;
                this.handleSuggestion(suggestion);
            }
        });

        // Settings button
        const settingsBtn = document.getElementById('chatSettingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showChatSettings());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k') {
                    e.preventDefault();
                    this.toggleChat();
                }
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });

        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleWindowResize();
        }, 250));
    }

    /**
     * Initialize Material Design Components
     */
    initializeMDCComponents() {
        // Initialize chips in suggestions
        const suggestionChips = document.querySelectorAll('.quick-suggestions .mdc-chip');
        suggestionChips.forEach(chip => {
            mdc.ripple.MDCRipple.attachTo(chip);
        });

        // Initialize text field
        const chatInputField = document.querySelector('.chat-input-field');
        if (chatInputField) {
            mdc.textField.MDCTextField.attachTo(chatInputField);
        }

        // Initialize icon buttons
        const iconButtons = document.querySelectorAll('.chat-header .mdc-icon-button, .chat-send-btn');
        iconButtons.forEach(button => {
            mdc.ripple.MDCRipple.attachTo(button);
        });
    }

    /**
     * Setup resize handle functionality
     */
    setupResizeHandle() {
        const resizeHandle = document.getElementById('chatResizeHandle');
        if (!resizeHandle) return;

        resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', () => this.stopResize());

        // Touch events for mobile
        resizeHandle.addEventListener('touchstart', (e) => this.startResize(e.touches[0]));
        document.addEventListener('touchmove', (e) => this.handleResize(e.touches[0]));
        document.addEventListener('touchend', () => this.stopResize());
    }

    /**
     * Start resize operation
     */
    startResize(event) {
        if (Utils.isMobile()) return; // Disable resize on mobile

        this.isResizing = true;
        this.resizeStartX = event.clientX;

        const chatSection = document.getElementById('chatSection');
        const currentWidth = chatSection.offsetWidth;
        this.resizeStartWidth = currentWidth;

        chatSection.classList.add('resizing');
        document.getElementById('chatResizeHandle').classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    /**
     * Handle resize operation
     */
    handleResize(event) {
        if (!this.isResizing || Utils.isMobile()) return;

        const deltaX = this.resizeStartX - event.clientX;
        const newWidth = this.resizeStartWidth + deltaX;
        const viewport = Utils.getViewportDimensions();

        // Calculate percentage and constraints
        const widthPercent = (newWidth / viewport.width) * 100;
        const constrainedPercent = Math.max(20, Math.min(this.maxWidth, widthPercent));
        const constrainedWidth = Math.max(this.minWidth, newWidth);

        if (constrainedWidth >= this.minWidth && widthPercent <= this.maxWidth) {
            this.setChatWidth(constrainedPercent);
        }
    }

    /**
     * Stop resize operation
     */
    stopResize() {
        if (!this.isResizing) return;

        this.isResizing = false;

        const chatSection = document.getElementById('chatSection');
        chatSection.classList.remove('resizing');
        document.getElementById('chatResizeHandle').classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Save width preference
        Storage.chat.setChatWidth(this.currentWidth);
    }

    /**
     * Set chat width
     */
    setChatWidth(widthPercent) {
        const chatSection = document.getElementById('chatSection');
        const formSection = document.getElementById('formSection');

        if (typeof widthPercent === 'number') {
            this.currentWidth = `${widthPercent}%`;
        } else {
            this.currentWidth = widthPercent;
        }

        if (chatSection && this.isOpen) {
            chatSection.style.width = this.currentWidth;

            if (formSection) {
                formSection.classList.add('chat-expanded');
            }
        }
    }

    /**
     * Restore chat width from storage
     */
    restoreChatWidth() {
        const savedWidth = Storage.chat.getChatWidth();
        this.currentWidth = savedWidth;
    }

    /**
     * Toggle chat panel
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Open chat panel
     */
    openChat() {
        const chatSection = document.getElementById('chatSection');
        const formSection = document.getElementById('formSection');
        const mainContainer = document.querySelector('.main-container');

        if (chatSection) {
            this.isOpen = true;
            chatSection.classList.add('expanded');

            if (Utils.isMobile()) {
                mainContainer?.classList.add('chat-open');
                chatSection.style.width = '100%';
            } else {
                this.setChatWidth(this.currentWidth);
            }

            if (formSection) {
                formSection.classList.add('chat-expanded');
            }

            // Focus chat input
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput && !Utils.isMobile()) {
                    chatInput.focus();
                }
            }, 300);

            // Show welcome message if first time
            if (this.conversation.length === 0) {
                this.addWelcomeMessage();
            }
        }
    }

    /**
     * Close chat panel
     */
    closeChat() {
        const chatSection = document.getElementById('chatSection');
        const formSection = document.getElementById('formSection');
        const mainContainer = document.querySelector('.main-container');

        if (chatSection) {
            this.isOpen = false;
            chatSection.classList.remove('expanded');
            chatSection.style.width = '0';

            if (formSection) {
                formSection.classList.remove('chat-expanded');
            }

            if (mainContainer) {
                mainContainer.classList.remove('chat-open');
            }
        }
    }

    /**
     * Send a message
     */
    sendMessage() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage('user', message);

        // Clear input
        chatInput.value = '';
        this.updateSendButtonState();

        // Simulate bot response
        this.simulateBotResponse(message);
    }

    /**
     * Add message to conversation
     */
    addMessage(type, content, options = {}) {
        const message = {
            type,
            content,
            timestamp: Date.now(),
            ...options
        };

        this.conversation.push(message);
        this.renderMessage(message);
        this.scrollToBottom();

        // Save to storage
        Storage.chat.saveMessage(message);
    }

    /**
     * Render message in UI
     */
    renderMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        
        // Handle different message types
        if (message.type === 'system') {
            messageElement.className = 'system-message';
            messageElement.innerHTML = `
                <div class="system-bubble">
                    <small>${Utils.sanitizeHtml(message.content)}</small>
                </div>
            `;
        } else if (message.type === 'bot') {
            // Use markdown rendering for bot messages
            messageElement.className = `${message.type}-message`;
            messageElement.innerHTML = `
                <div class="message-bubble markdown-content">
                    ${Utils.renderMarkdown(message.content)}
                </div>
                <span class="message-time">${Utils.formatTimestamp(message.timestamp)}</span>
            `;
        } else {
            // Use plain text for user messages
            messageElement.className = `${message.type}-message`;
            messageElement.innerHTML = `
                <div class="message-bubble">
                    <p>${Utils.sanitizeHtml(message.content)}</p>
                </div>
                <span class="message-time">${Utils.formatTimestamp(message.timestamp)}</span>
            `;
        }

        messagesContainer.appendChild(messageElement);

        // Auto-remove temporary messages after 10 seconds
        if (message.temporary) {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 10000);
        }
    }

    /**
     * Send message to ADK agent
     */
    async simulateBotResponse(userMessage) {
        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.sendToADKAgent(userMessage);
            this.hideTypingIndicator();
            this.addMessage('bot', response);
            
            // Update suggestions based on context
            this.updateSuggestions(userMessage);
        } catch (error) {
            console.error('Error communicating with ADK agent:', error);
            this.hideTypingIndicator();
            
            // Fallback to dummy response
            const fallbackResponse = this.generateBotResponse(userMessage);
            this.addMessage('bot', fallbackResponse);
            this.addMessage('bot', '⚠️ Note: Using fallback response. Please check if ADK agent is running.');
        }
    }

    /**
     * Send message to ADK agent via REST API
     */
    async sendToADKAgent(userMessage) {
        const adkConfig = this.getADKConfig();
        const userId = this.getUserId();
        let sessionId = this.getSessionId();
        
        // Try to ensure session exists, create if needed
        try {
            await this.ensureSessionExists(userId, sessionId, adkConfig.baseUrl);
        } catch (error) {
            console.warn('Could not ensure session exists:', error);
            // Continue with the request anyway
        }
        
        const payload = {
            appName: "tourgent",
            userId: userId,
            sessionId: sessionId,
            newMessage: {
                parts: [{ text: userMessage }],
                role: "user"
            },
            streaming: false
        };

        // Use the proxy endpoint to avoid CORS issues
        const response = await fetch('/api/adk/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-ADK-Base-Url': adkConfig.baseUrl
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            // If session not found, try to create it and retry once
            if (errorData.details && errorData.details.includes('Session not found')) {
                console.log('Session not found, creating new session...');
                try {
                    const newSessionId = await this.createNewSession(userId, adkConfig.baseUrl);
                    Storage.chat.setSessionId(newSessionId);
                    
                    // Retry with new session
                    payload.sessionId = newSessionId;
                    const retryResponse = await fetch('/api/adk/run', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-ADK-Base-Url': adkConfig.baseUrl
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    if (!retryResponse.ok) {
                        const retryErrorData = await retryResponse.json();
                        throw new Error(retryErrorData.error || `HTTP ${retryResponse.status}`);
                    }
                    
                    const retryEvents = await retryResponse.json();
                    return this.extractResponseFromEvents(retryEvents);
                } catch (createError) {
                    console.error('Failed to create new session:', createError);
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }
            }
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const events = await response.json();
        
        // Extract the agent's response from events
        return this.extractResponseFromEvents(events);
    }

    /**
     * Get or generate user ID
     */
    getUserId() {
        let userId = Storage.chat.getUserId();
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            Storage.chat.setUserId(userId);
        }
        return userId;
    }

    /**
     * Get or generate session ID
     */
    getSessionId() {
        let sessionId = Storage.chat.getSessionId();
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            Storage.chat.setSessionId(sessionId);
        }
        return sessionId;
    }

    /**
     * Create a new session in ADK
     */
    async createNewSession(userId, adkBaseUrl) {
        const response = await fetch('/api/adk/create-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-ADK-Base-Url': adkBaseUrl,
                'X-App-Name': 'tourgent',
                'X-User-Id': userId
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`Failed to create session: ${response.status}`);
        }

        const sessionData = await response.json();
        return sessionData.id;
    }

    /**
     * Ensure session exists in ADK
     */
    async ensureSessionExists(userId, sessionId, adkBaseUrl) {
        try {
            const response = await fetch('/api/adk/check-session', {
                method: 'GET',
                headers: {
                    'X-ADK-Base-Url': adkBaseUrl,
                    'X-App-Name': 'tourgent',
                    'X-User-Id': userId,
                    'X-Session-Id': sessionId
                }
            });
            
            if (response.ok) {
                return true; // Session exists
            }
        } catch (error) {
            console.warn('Error checking session:', error);
        }
        return false;
    }

    /**
     * Extract response text from ADK events
     */
    extractResponseFromEvents(events) {
        if (!events || !Array.isArray(events)) {
            return "I'm sorry, I didn't receive a proper response. Please try again.";
        }

        // Look for events with content from the agent
        for (const event of events.reverse()) { // Start from the latest events
            if (event.content && event.content.parts) {
                for (const part of event.content.parts) {
                    if (part.text && part.text.trim()) {
                        return part.text.trim();
                    }
                }
            }
        }

        return "I received your message but couldn't generate a response. Please try again.";
    }

    /**
     * Generate bot response based on user input
     */
    generateBotResponse(userMessage) {
        const message = userMessage.toLowerCase();

        // Context-aware responses based on form data
        const formData = window.formManager ? window.formManager.formData : null;

        if (message.includes('destination') || message.includes('city') || message.includes('country')) {
            if (formData && formData.city) {
                return `Great choice with ${formData.city}! I can help you discover amazing places there. What specific activities interest you most?`;
            }
            return "I'd love to help you choose a destination! What type of atmosphere are you looking for - bustling city life, peaceful countryside, or coastal relaxation?";
        }

        if (message.includes('budget') || message.includes('cost') || message.includes('expensive')) {
            return "Budget planning is crucial for a great trip! I can suggest options for any budget level. Are you looking for budget-friendly options, mid-range comfort, or luxury experiences?";
        }

        if (message.includes('food') || message.includes('restaurant') || message.includes('cuisine')) {
            if (formData && formData.preferences && formData.preferences.cousines) {
                return `I see you're interested in ${formData.preferences.cousines.join(', ')} cuisine. I can recommend some fantastic local spots that match your taste!`;
            }
            return "Food is one of the best parts of traveling! What type of cuisine are you most excited to try? Local specialties, familiar favorites, or something completely new?";
        }

        if (message.includes('hotel') || message.includes('accommodation') || message.includes('stay')) {
            return "Choosing the right accommodation can make or break your trip! Are you looking for something in the city center, near specific attractions, or in a quieter area?";
        }

        if (message.includes('weather') || message.includes('climate')) {
            return "Weather definitely affects your travel plans! I can help you pack appropriately and suggest indoor alternatives if needed. What season are you planning to travel?";
        }

        if (message.includes('help') || message.includes('how')) {
            return "I'm here to help make your trip planning easier! You can ask me about destinations, activities, budgeting, accommodations, or anything else travel-related. What would you like to know?";
        }

        if (message.includes('popular') || message.includes('recommend')) {
            return "I'd be happy to share some popular recommendations! Are you interested in must-see attractions, hidden local gems, popular restaurants, or something specific?";
        }

        // Default responses
        const defaultResponses = [
            "That's a great question! I'm here to help you plan the perfect trip. Could you tell me more about what you're looking for?",
            "Interesting! Travel planning can be exciting. What aspect of your trip would you like to focus on first?",
            "I love helping people discover new places! What kind of experience are you hoping to have on your trip?",
            "Thanks for sharing that with me! Is there anything specific about your travel plans I can help you with?",
            "Great to hear from you! I'm here to make your travel planning as smooth as possible. What can I help you with today?"
        ];

        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    /**
     * Handle suggestion click
     */
    handleSuggestion(suggestion) {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = suggestion;
            chatInput.focus();
        }

        // Auto-send the suggestion
        setTimeout(() => {
            this.sendMessage();
        }, 100);
    }

    /**
     * Update suggestions based on context
     */
    updateSuggestions(lastMessage = '') {
        const suggestionsContainer = document.querySelector('.quick-suggestions');
        if (!suggestionsContainer) return;

        let suggestions = [];
        const formData = window.formManager ? window.formManager.formData : null;

        // Context-based suggestions
        if (formData && formData.city && !formData.preferences.events) {
            suggestions = [
                `What to do in ${formData.city}?`,
                'Best local restaurants',
                'Popular attractions'
            ];
        } else if (formData && formData.preferences.budget_amount === 'Low') {
            suggestions = [
                'Budget travel tips',
                'Free activities',
                'Cheap eats'
            ];
        } else {
            suggestions = [
                'Popular destinations',
                'Budget tips',
                'Local customs',
                'Weather information'
            ];
        }

        // Clear existing suggestions
        suggestionsContainer.innerHTML = '';

        // Add new suggestions
        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'mdc-chip';
            chip.setAttribute('tabindex', '0');
            chip.innerHTML = `
                <div class="mdc-chip__ripple"></div>
                <span class="mdc-chip__text">${suggestion}</span>
            `;
            suggestionsContainer.appendChild(chip);

            // Initialize MDC ripple
            mdc.ripple.MDCRipple.attachTo(chip);
        });
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'bot-message typing-indicator';
        typingElement.innerHTML = `
            <div class="message-bubble">
                <div class="chat-loading">
                    <span>Assistant is typing</span>
                    <div class="loading-dots">
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                    </div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Update send button state
     */
    updateSendButtonState() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSendBtn');

        if (chatInput && sendBtn) {
            const hasText = chatInput.value.trim().length > 0;
            sendBtn.disabled = !hasText;
            sendBtn.style.opacity = hasText ? '1' : '0.5';
        }
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    /**
     * Load conversation from storage
     */
    loadConversation() {
        // Clear any existing conversation and session on initialization to start fresh
        Storage.chat.clearConversation();
        Storage.chat.clearSession();
        this.conversation = [];

        // Note: We intentionally don't load saved conversations
        // to ensure each frontend restart starts with a clean chat and new ADK session
        console.log('💬 Chat initialized with fresh conversation and new session');
    }

    /**
     * Add welcome message
     */
    addWelcomeMessage() {
        const welcomeMessage = "Hello! I'm Tourgent, your expert travel planning assistant powered by Google ADK. I can help you plan amazing trips, suggest destinations, find accommodations, and provide local insights. Fill out the form or just start chatting with me about your travel plans!";
        this.addMessage('bot', welcomeMessage);
    }

    /**
     * Clear conversation
     */
    clearConversation() {
        this.conversation = [];
        Storage.chat.clearConversation();

        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }

        this.addWelcomeMessage();
        Utils.showNotification('Conversation cleared', 'info');
    }

    /**
     * Export conversation
     */
    exportConversation() {
        const conversationText = Storage.chat.exportConversation();
        const filename = `tour-guidance-chat-${Date.now()}.txt`;
        Utils.downloadFile(conversationText, filename, 'text/plain');
        Utils.showNotification('Conversation exported!', 'success');
    }

    /**
     * Show chat settings
     */
    showChatSettings() {
        // Create settings modal/menu
        const settingsMenu = document.createElement('div');
        settingsMenu.className = 'chat-options-menu visible';
        settingsMenu.innerHTML = `
            <div class="menu-item" data-action="new-session">
                <span class="material-icons">refresh</span>
                <span>New session</span>
            </div>
            <div class="menu-item" data-action="clear">
                <span class="material-icons">delete</span>
                <span>Clear conversation</span>
            </div>
            <div class="menu-item" data-action="export">
                <span class="material-icons">download</span>
                <span>Export chat</span>
            </div>
            <div class="menu-item" data-action="adk-config">
                <span class="material-icons">settings</span>
                <span>ADK Configuration</span>
            </div>
            <div class="menu-item" data-action="help">
                <span class="material-icons">help</span>
                <span>Help & shortcuts</span>
            </div>
        `;

        // Position menu
        const settingsBtn = document.getElementById('chatSettingsBtn');
        const rect = settingsBtn.getBoundingClientRect();
        settingsMenu.style.position = 'fixed';
        settingsMenu.style.top = `${rect.bottom + 5}px`;
        settingsMenu.style.right = `${window.innerWidth - rect.right}px`;

        document.body.appendChild(settingsMenu);

        // Handle menu clicks
        settingsMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.menu-item')?.dataset.action;

            switch (action) {
                case 'new-session':
                    if (confirm('Start a new session? This will clear the current conversation.')) {
                        this.startNewSession();
                    }
                    break;
                case 'clear':
                    if (confirm('Are you sure you want to clear the conversation?')) {
                        this.clearConversation();
                    }
                    break;
                case 'export':
                    this.exportConversation();
                    break;
                case 'adk-config':
                    this.showADKConfiguration();
                    break;
                case 'help':
                    this.showHelp();
                    break;
            }

            settingsMenu.remove();
        });

        // Close menu when clicking outside
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!settingsMenu.contains(e.target)) {
                    settingsMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    /**
     * Show help information
     */
    showHelp() {
        const helpMessage = `
            <strong>Chat Shortcuts:</strong><br>
            • Ctrl/Cmd + K: Toggle chat<br>
            • Escape: Close chat<br>
            • Enter: Send message<br><br>

            <strong>What I can help with:</strong><br>
            • Trip planning and recommendations<br>
            • Destination information<br>
            • Budget planning<br>
            • Local cuisine suggestions<br>
            • Accommodation advice<br>
            • Travel tips and customs<br><br>

            <strong>ADK Integration:</strong><br>
            This chat connects to your ADK t_raveler agent.<br>
            Make sure to run 'adk web' to start the agent server.
        `;

        this.addMessage('bot', helpMessage);
    }

    /**
     * Start a new session
     */
    startNewSession() {
        Storage.chat.clearSession();
        this.conversation = [];

        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }

        this.addWelcomeMessage();
        Utils.showNotification('New session started', 'success');
    }

    /**
     * Show ADK configuration dialog
     */
    showADKConfiguration() {
        const currentConfig = this.getADKConfig();
        
        const configDialog = document.createElement('div');
        configDialog.className = 'adk-config-dialog';
        configDialog.innerHTML = `
            <div class="config-overlay">
                <div class="config-content">
                    <h3>ADK Configuration</h3>
                    <div class="config-field">
                        <label for="adkBaseUrl">ADK Server URL:</label>
                        <input type="url" id="adkBaseUrl" value="${currentConfig.baseUrl}" placeholder="http://localhost:8000">
                        <small>The URL where your ADK web server is running</small>
                    </div>
                    <div class="config-field">
                        <label for="adkAgentName">Agent Name:</label>
                        <input type="text" id="adkAgentName" value="t_raveler" readonly>
                        <small>The name of your travel agent (from agent.py)</small>
                    </div>
                    <div class="config-actions">
                        <button id="testAdkConnection" class="btn-secondary">Test Connection</button>
                        <button id="saveAdkConfig" class="btn-primary">Save</button>
                        <button id="cancelAdkConfig" class="btn-secondary">Cancel</button>
                    </div>
                    <div id="adkConnectionStatus"></div>
                </div>
            </div>
        `;

        document.body.appendChild(configDialog);

        // Handle actions
        document.getElementById('testAdkConnection').addEventListener('click', () => {
            this.testADKConnection();
        });

        document.getElementById('saveAdkConfig').addEventListener('click', () => {
            const baseUrl = document.getElementById('adkBaseUrl').value.trim();
            if (baseUrl) {
                Storage.chat.setItem('adk_base_url', baseUrl);
                Utils.showNotification('ADK configuration saved', 'success');
                configDialog.remove();
            }
        });

        document.getElementById('cancelAdkConfig').addEventListener('click', () => {
            configDialog.remove();
        });

        // Close on overlay click
        configDialog.querySelector('.config-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                configDialog.remove();
            }
        });
    }

    /**
     * Test ADK connection
     */
    async testADKConnection() {
        const statusElement = document.getElementById('adkConnectionStatus');
        const baseUrl = document.getElementById('adkBaseUrl').value.trim();
        
        if (!baseUrl) {
            statusElement.innerHTML = '<span style="color: red;">Please enter a valid URL</span>';
            return;
        }

        statusElement.innerHTML = '<span style="color: blue;">Testing connection...</span>';

        try {
            const response = await fetch('/api/adk/test', { 
                method: 'GET',
                headers: {
                    'X-ADK-Base-Url': baseUrl
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'connected') {
                statusElement.innerHTML = '<span style="color: green;">✓ Connection successful!</span>';
            } else {
                statusElement.innerHTML = `<span style="color: red;">✗ ${data.error}</span><br><small>${data.suggestion}</small>`;
            }
        } catch (error) {
            statusElement.innerHTML = '<span style="color: red;">✗ Connection failed. Make sure ADK web server is running.</span>';
        }
    }

    /**
     * Get ADK configuration with user settings
     */
    getADKConfig() {
        const savedBaseUrl = Storage.chat.getItem('adk_base_url', null);
        return {
            baseUrl: savedBaseUrl || 'http://localhost:8000'
        };
    }

    /**
     * Check ADK connection status on initialization
     */
    async checkADKConnection() {
        try {
            const response = await fetch('/api/adk/test', {
                method: 'GET',
                headers: {
                    'X-ADK-Base-Url': this.getADKConfig().baseUrl
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'connected') {
                console.log('✅ ADK agent connected successfully');
                this.showConnectionStatus('connected');
            } else {
                console.warn('⚠️ ADK agent not available, using fallback responses');
                this.showConnectionStatus('disconnected', data.suggestion);
            }
        } catch (error) {
            console.warn('⚠️ ADK connection check failed, using fallback responses');
            this.showConnectionStatus('error', 'Make sure ADK web server is running');
        }
    }

    /**
     * Show connection status in chat
     */
    showConnectionStatus(status, message = '') {
        if (!this.isOpen) return; // Don't show status if chat is closed

        let statusMessage = '';
        switch (status) {
            case 'connected':
                statusMessage = '🟢 Connected to ADK agent';
                break;
            case 'disconnected':
                statusMessage = `🟡 ADK agent offline - using fallback responses${message ? '\n' + message : ''}`;
                break;
            case 'error':
                statusMessage = `🔴 Connection error - using fallback responses${message ? '\n' + message : ''}`;
                break;
        }

        if (statusMessage) {
            // Add a subtle status message
            setTimeout(() => {
                this.addMessage('system', statusMessage, { temporary: true });
            }, 1000);
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        if (Utils.isMobile() && this.isOpen) {
            // Ensure proper mobile layout
            const chatSection = document.getElementById('chatSection');
            if (chatSection) {
                chatSection.style.width = '100%';
            }
        } else if (!Utils.isMobile() && this.isOpen) {
            // Restore desktop layout
            this.setChatWidth(this.currentWidth);
        }
    }

    /**
     * Get chat mode (peek, normal, focus)
     */
    getChatMode() {
        if (!this.isOpen) return 'closed';

        const width = parseInt(this.currentWidth);
        if (width <= 25) return 'peek';
        if (width >= 45) return 'focus';
        return 'normal';
    }

    /**
     * Set chat mode
     */
    setChatMode(mode) {
        switch (mode) {
            case 'peek':
                this.setChatWidth('20%');
                break;
            case 'normal':
                this.setChatWidth('30%');
                break;
            case 'focus':
                this.setChatWidth('50%');
                break;
        }

        // Save preference
        Storage.chat.setChatWidth(this.currentWidth);
    }
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Initializing ChatManager...');

        // Check if we have chat elements
        if (!document.getElementById('chatSection')) {
            console.log('ℹ️ No chat section found, skipping ChatManager initialization');
            return;
        }

        // Initialize the chat manager
        window.chatManager = new ChatManager();
        console.log('✅ ChatManager initialized successfully');

        // Debug: Log chat button states
        setTimeout(() => {
            const toggleBtn = document.getElementById('chatToggleBtn');
            const closeBtn = document.getElementById('chatCloseBtn');
            const sendBtn = document.getElementById('chatSendBtn');

            console.log('💬 Chat button states:');
            console.log('   - Toggle button:', toggleBtn ? 'found' : 'missing');
            console.log('   - Close button:', closeBtn ? 'found' : 'missing');
            console.log('   - Send button:', sendBtn ? 'found' : 'missing');
        }, 1000);

    } catch (error) {
        console.error('❌ Failed to initialize ChatManager:', error);
    }
});