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
        this.messageRotationInterval = null; // For rotating waiting messages

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
        // No ADK connection check needed
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

        // Generate Plan button
        const generatePlanBtn = document.getElementById('chatGeneratePlanBtn');
        if (generatePlanBtn) {
            generatePlanBtn.addEventListener('click', () => this.generatePlanFromChat());
            // Initialize MDC button
            mdc.ripple.MDCRipple.attachTo(generatePlanBtn);
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
     * Send message to VertexAI and handle streaming response
     */
    async simulateBotResponse(userMessage) {
        // Show typing indicator
        this.showTypingIndicator();

        try {
            await this.sendToVertexAIStreaming(userMessage);

            // Update suggestions based on context
            this.updateSuggestions(userMessage);
        } catch (error) {
            console.error('Error communicating with VertexAI:', error);
            this.hideTypingIndicator();

            // Show error message
            this.addMessage('bot', `❌ Error: ${error.message}. Please check your Google Cloud access token and try again.`);
        }
    }

    /**
     * Send message to VertexAI with streaming
     */
    async sendToVertexAIStreaming(userMessage) {
        const accessToken = this.getAccessToken();
        if (!accessToken) {
            throw new Error('Google Cloud access token is required. Please enter your token in the form header.');
        }

        const userId = "1"; // Using fixed user ID
        let sessionId = Storage.chat.getGoogleSessionId();

        // Create session if needed
        if (!sessionId) {
            sessionId = await this.createGoogleSession(accessToken, userId);
            Storage.chat.setGoogleSessionId(sessionId);
        }

        // Wait at least 2 seconds to show the waiting messages before hiding typing indicator
        const minimumWaitTime = 2000; // 2 seconds
        const startTime = Date.now();

        // Send message and stream response
        const url = 'https://us-central1-aiplatform.googleapis.com/v1/projects/qwiklabs-gcp-03-0d1459a04d94/locations/us-central1/reasoningEngines/8611344282416054272:streamQuery?alt=sse';
        const requestBody = {
            "class_method": "async_stream_query",
            "input": {
                "user_id": userId,
                "session_id": sessionId,
                "message": userMessage
            }
        };

        let accumulatedText = '';
        let contentElement = null;
        let streamingStarted = false;

        await StreamHandler.streamVertexAI(
            url,
            requestBody,
            accessToken,
            // onChunk callback
            async (chunk, fullText) => {
                // Only start streaming UI after minimum wait time
                if (!streamingStarted) {
                    const elapsedTime = Date.now() - startTime;
                    if (elapsedTime < minimumWaitTime) {
                        await new Promise(resolve => setTimeout(resolve, minimumWaitTime - elapsedTime));
                    }
                    
                    // Now create streaming message element and hide typing indicator
                    const messagesContainer = document.getElementById('chatMessages');
                    contentElement = StreamHandler.createStreamingMessage(messagesContainer);
                    this.hideTypingIndicator();
                    streamingStarted = true;
                }

                accumulatedText = fullText;
                // Only update UI if we have actual content (not empty from agent transfers)
                if (fullText.trim() && contentElement) {
                    StreamHandler.updateStreamingMessage(contentElement, fullText);
                }
            },
            // onComplete callback
            (fullText) => {
                if (contentElement) {
                    StreamHandler.finalizeStreamingMessage(contentElement);
                }
                this.scrollToBottom();

                // Save message to conversation history
                const message = {
                    type: 'bot',
                    content: fullText,
                    timestamp: Date.now()
                };
                this.conversation.push(message);
                Storage.chat.saveMessage(message);
            },
            // onError callback
            (error) => {
                StreamHandler.finalizeStreamingMessage(contentElement);
                contentElement.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
            }
        );
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
     * Create a new session in Google ADK
     */
    async createGoogleSession(accessToken, userId) {
        const response = await fetch('https://us-central1-aiplatform.googleapis.com/v1/projects/qwiklabs-gcp-03-0d1459a04d94/locations/us-central1/reasoningEngines/8611344282416054272:query', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "class_method": "async_create_session",
                "input": {
                    "user_id": userId
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create Google session: ${error}`);
        }

        const sessionData = await response.json();
        console.log('Created Google session:', sessionData.output.id);
        return sessionData.output.id;
    }


    /**
     * Delete Google ADK session
     */
    async deleteGoogleSession(accessToken, userId, sessionId) {
        try {
            const response = await fetch('https://us-central1-aiplatform.googleapis.com/v1/projects/qwiklabs-gcp-03-0d1459a04d94/locations/us-central1/reasoningEngines/8611344282416054272:query', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "class_method": "async_delete_session",
                    "input": {
                        "user_id": userId,
                        "session_id": sessionId
                    }
                })
            });

            if (response.ok) {
                console.log('Google session deleted successfully');
            }
        } catch (error) {
            console.warn('Failed to delete session:', error);
        }
    }



    /**
     * Get Google Cloud access token from input field
     */
    getAccessToken() {
        const tokenInput = document.getElementById('googleAccessToken');
        if (tokenInput) {
            const token = tokenInput.value.trim();
            if (token) {
                // Store in session storage for convenience
                sessionStorage.setItem('google_access_token', token);
                return token;
            }
        }
        // Try to get from session storage
        return sessionStorage.getItem('google_access_token');
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
     * Show typing indicator with fun rotating messages
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Fun waiting messages
        const waitingMessages = [
            "Dusting off my crystal ball to see what you'd love...",
            "Peeking into the comfiest pillows and coziest beds for you...",
            "Sneaking backstage to find the hottest tickets...",
            "Sharpening my tourist binoculars to spot the must-sees...",
            "Calculating dessert calories (spoiler: they don't count on vacation)...",
            "Brewing the perfect Turkish coffee algorithm..."
        ];

        // Get a random message
        const randomMessage = waitingMessages[Math.floor(Math.random() * waitingMessages.length)];

        const typingElement = document.createElement('div');
        typingElement.className = 'bot-message typing-indicator';
        typingElement.innerHTML = `
            <div class="message-bubble">
                <div class="chat-loading">
                    <span class="waiting-message">${randomMessage}</span>
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

        // Start rotating messages every 3 seconds
        this.startMessageRotation(waitingMessages);
    }

    /**
     * Start rotating waiting messages
     */
    startMessageRotation(messages) {
        // Clear any existing rotation
        if (this.messageRotationInterval) {
            clearInterval(this.messageRotationInterval);
        }

        let currentIndex = 0;
        this.messageRotationInterval = setInterval(() => {
            const waitingMessageElement = document.querySelector('.typing-indicator .waiting-message');
            if (waitingMessageElement) {
                // Move to next message
                currentIndex = (currentIndex + 1) % messages.length;
                waitingMessageElement.textContent = messages[currentIndex];
            } else {
                // Stop rotation if typing indicator is gone
                this.stopMessageRotation();
            }
        }, 3000); // Change message every 3 seconds
    }

    /**
     * Stop message rotation
     */
    stopMessageRotation() {
        if (this.messageRotationInterval) {
            clearInterval(this.messageRotationInterval);
            this.messageRotationInterval = null;
        }
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        // Stop message rotation
        this.stopMessageRotation();
        
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
        const welcomeMessage = "Hello! I'm Tourgent, your expert travel planning assistant powered by Google VertexAI. I can help you plan amazing trips, suggest destinations, find accommodations, and provide local insights. Fill out the form or just start chatting with me about your travel plans!";
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

            <strong>AI Integration:</strong><br>
            This chat connects directly to Google's VertexAI.<br>
            Make sure to enter your Google Cloud access token above.
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

    /**
     * Generate travel plan from chat conversation
     */
    async generatePlanFromChat() {
        console.log('🎯 Generating travel plan from chat conversation...');

        // Check if we have conversation history
        if (this.conversation.length < 2) {
            Utils.showNotification('Please have a conversation about your travel preferences first', 'warning');
            return;
        }

        // Get access token
        const accessToken = this.getAccessToken();
        if (!accessToken) {
            Utils.showNotification('Please enter your Google Cloud access token first', 'error');
            document.getElementById('googleAccessToken')?.focus();
            return;
        }

        // Disable button and show loading state
        const generateBtn = document.getElementById('chatGeneratePlanBtn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = `<span class="material-icons rotating">sync</span>`;
        }

        try {
            // Format conversation history as context
            const conversationContext = this.formatConversationAsContext();

            // Create the fixed prompt with conversation history
            const message = `${conversationContext}

IMPORTANT: User has given all of the preferences in the conversation above. You can use only two agents for formatting:
1. You MUST use transfer_to_agent(planner_summary_agent) to generate the final JSON travel plan
2. You can use transfer_to_agent(text_search_agent) to find lat/long coordinates if needed
3. You CANNOT use any other tools or agents

Generate a complete travel plan JSON with hotel_information and day_plans based on the user's preferences discussed above.`;

            console.log('📝 Sending message with conversation context to generate plan');

            // Create or get session
            const userId = "1"; // Using fixed user ID
            let sessionId = Storage.chat.getGoogleSessionId();

            if (!sessionId) {
                sessionId = await this.createGoogleSession(accessToken, userId);
                Storage.chat.setGoogleSessionId(sessionId);
            }

            // Send message to generate plan
            const response = await this.sendToGoogleADKForPlan(accessToken, userId, sessionId, message);

            // Extract JSON from response
            const jsonPlan = this.extractJSONFromPlanResponse(response);

            if (jsonPlan) {
                console.log('✅ Successfully generated plan from chat!');

                // Save to output.json
                await this.savePlanToFile(jsonPlan);

                // Show success message
                Utils.showNotification('Travel plan generated successfully!', 'success');

                // Add confirmation message to chat
                this.addMessage('bot', '✅ Travel plan has been generated based on our conversation! The plan has been saved and you can view it in the display section.');

                // Optionally redirect to routes page
                if (confirm('Plan generated! Would you like to view it now?')) {
                    window.location.href = 'routes.html';
                }
            } else {
                throw new Error('Failed to generate valid JSON plan');
            }

        } catch (error) {
            console.error('❌ Error generating plan from chat:', error);
            Utils.showNotification(`Failed to generate plan: ${error.message}`, 'error');
            this.addMessage('bot', `❌ Failed to generate plan: ${error.message}`);
        } finally {
            // Reset button state
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = `<span class="material-icons">assignment_turned_in</span>`;
            }
        }
    }

    /**
     * Format conversation history as context for plan generation
     */
    formatConversationAsContext() {
        let context = "Here is the conversation history with the user about their travel preferences:\n\n";

        this.conversation.forEach(msg => {
            if (msg.type === 'user') {
                context += `User: ${msg.content}\n`;
            } else if (msg.type === 'bot') {
                context += `Assistant: ${msg.content}\n`;
            }
        });

        return context;
    }

    /**
     * Send message to Google ADK for plan generation (reusing form.js logic)
     */
    async sendToGoogleADKForPlan(accessToken, userId, sessionId, message) {
        // Use the same approach as form.js - try streaming first, then fallback
        const url = 'https://us-central1-aiplatform.googleapis.com/v1/projects/qwiklabs-gcp-03-0d1459a04d94/locations/us-central1/reasoningEngines/8611344282416054272:streamQuery?alt=sse';
        const requestBody = {
            "class_method": "async_stream_query",
            "input": {
                "user_id": userId,
                "session_id": sessionId,
                "message": message
            }
        };

        return new Promise((resolve, reject) => {
            let accumulatedText = '';

            StreamHandler.streamVertexAI(
                url,
                requestBody,
                accessToken,
                (chunk, fullText) => {
                    accumulatedText = fullText;
                },
                (fullText) => {
                    resolve(fullText);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    /**
     * Extract JSON from plan response (reusing form.js logic)
     */
    extractJSONFromPlanResponse(responseText) {
        console.log('🔍 Extracting JSON from plan response...');

        // Try direct JSON parse
        try {
            const directParse = JSON.parse(responseText);
            if (directParse.hotel_information && directParse.day_plans) {
                return directParse;
            }
        } catch (e) {
            // Not direct JSON
        }

        // Try markdown code block
        const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
            try {
                const jsonFromMarkdown = JSON.parse(markdownMatch[1]);
                if (jsonFromMarkdown.hotel_information && jsonFromMarkdown.day_plans) {
                    return jsonFromMarkdown;
                }
            } catch (e) {
                // Failed to parse
            }
        }

        // Try pattern matching
        const jsonMatch = responseText.match(/\{[\s\S]*"hotel_information"[\s\S]*"day_plans"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                // Failed to parse
            }
        }

        return null;
    }

    /**
     * Save generated plan to file
     */
    async savePlanToFile(jsonPlan) {
        try {
            const response = await fetch('/api/save-output', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonPlan)
            });

            if (!response.ok) {
                throw new Error('Failed to save plan to file');
            }

            console.log('✅ Plan saved to output.json');
        } catch (error) {
            console.warn('⚠️ Could not save to server, saving to localStorage instead');
            localStorage.setItem('travel_plan_output', JSON.stringify(jsonPlan));
        }
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