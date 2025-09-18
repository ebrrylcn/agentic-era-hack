// SSE Streaming utilities for VertexAI integration

class StreamHandler {
    /**
     * Handle SSE streaming response from VertexAI
     * @param {string} url - The URL to stream from
     * @param {Object} requestBody - The request body
     * @param {string} accessToken - The access token for authorization
     * @param {Function} onChunk - Callback for each text chunk received
     * @param {Function} onComplete - Callback when streaming is complete
     * @param {Function} onError - Callback for errors
     */
    static async streamVertexAI(url, requestBody, accessToken, onChunk, onComplete, onError) {
        try {
            console.log('🚀 Starting SSE stream request to:', url);
            console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            // Log response details
            console.log('📡 Response status:', response.status);
            console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
            console.log('🎯 Content-Type:', response.headers.get('content-type'));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Stream request failed with status:', response.status);
                console.error('❌ Error response:', errorText);
                throw new Error(`Stream request failed: ${errorText}`);
            }

            // Check if we have a body
            if (!response.body) {
                console.error('❌ No response body received!');
                throw new Error('No response body received from streaming endpoint');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';
            let chunkCount = 0;
            let totalBytesReceived = 0;

            console.log('📖 Starting to read stream...');

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('✅ Stream complete. Total chunks:', chunkCount, 'Total bytes:', totalBytesReceived);
                    console.log('📝 Final buffer content:', buffer);

                    // Process any remaining buffer
                    if (buffer.trim()) {
                        console.log('🔄 Processing remaining buffer...');
                        const lastChunk = this.processSSEBuffer(buffer);
                        if (lastChunk) {
                            fullContent += lastChunk;
                            onChunk(lastChunk, fullContent);
                        }
                    }

                    console.log('📊 Total content extracted:', fullContent.length, 'characters');
                    onComplete(fullContent);
                    break;
                }

                // Log raw chunk data
                chunkCount++;
                totalBytesReceived += value.length;
                const decodedChunk = decoder.decode(value, { stream: true });

                console.log(`📦 Chunk #${chunkCount} received:`, {
                    byteLength: value.length,
                    decodedLength: decodedChunk.length,
                    preview: decodedChunk.substring(0, 200)
                });

                // Add to buffer
                buffer += decodedChunk;

                // Process complete SSE messages in the buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                console.log(`📝 Processing ${lines.length} lines from chunk #${chunkCount}`);

                for (const line of lines) {
                    if (line.trim()) {
                        console.log('📍 Line:', line.substring(0, 100), line.length > 100 ? '...' : '');
                    }

                    if (line.startsWith('data: ')) {
                        console.log('🎯 Found SSE data line');
                        const chunk = this.parseSSELine(line);
                        if (chunk) {
                            console.log('✨ Extracted text chunk:', chunk.substring(0, 100));
                            fullContent += chunk;
                            onChunk(chunk, fullContent);
                        }
                    } else if (line.trim() && !line.startsWith(':')) {
                        // Try to parse as JSON directly (non-SSE format)
                        console.log('⚠️ Non-SSE line found, trying to parse as JSON:', line.substring(0, 200));
                        try {
                            const jsonData = JSON.parse(line);
                            const extractedText = this.extractTextFromJSON(jsonData);
                            if (extractedText) {
                                console.log('✅ Extracted text from non-SSE JSON:', extractedText.substring(0, 100));
                                fullContent += extractedText;
                                onChunk(extractedText, fullContent);
                            }
                        } catch (e) {
                            console.log('🔸 Line is not valid JSON either');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Streaming error:', error);
            console.error('Stack trace:', error.stack);
            onError(error);
        }
    }

    /**
     * Parse a single SSE line
     */
    static parseSSELine(line) {
        if (!line.startsWith('data: ')) return null;

        try {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') return null;

            const data = JSON.parse(dataStr);

            // Log the message type for debugging
            if (data.author) {
                console.log(`📨 Message from agent: ${data.author}`);
            }

            // Skip function_response messages (these are agent transfers)
            if (data.content && data.content.parts) {
                for (const part of data.content.parts) {
                    if (part.function_response) {
                        console.log('⏭️ Skipping function_response (agent transfer)');
                        return null;
                    }
                }
            }

            // Extract text from the VertexAI response format
            if (data.content && data.content.parts) {
                let text = '';
                for (const part of data.content.parts) {
                    // Skip thought messages (internal agent reasoning)
                    if (part.thought) {
                        console.log('💭 Skipping agent thought message');
                        continue;
                    }
                    // Extract actual text content
                    if (part.text) {
                        text += part.text;
                    }
                }
                return text || null;
            }

            // Alternative format
            if (data.candidates && data.candidates[0]?.content?.parts) {
                let text = '';
                for (const part of data.candidates[0].content.parts) {
                    if (part.text) {
                        text += part.text;
                    }
                }
                return text || null;
            }

            return null;
        } catch (e) {
            console.warn('Failed to parse SSE line:', e);
            return null;
        }
    }

    /**
     * Process remaining SSE buffer
     */
    static processSSEBuffer(buffer) {
        const lines = buffer.trim().split('\n');
        let result = '';

        for (const line of lines) {
            const chunk = this.parseSSELine(line);
            if (chunk) {
                result += chunk;
            }
        }

        return result;
    }

    /**
     * Extract text from JSON object (handles non-SSE format)
     */
    static extractTextFromJSON(jsonData) {
        let text = '';

        // Skip function_response messages
        if (jsonData.content && jsonData.content.parts) {
            for (const part of jsonData.content.parts) {
                if (part.function_response) {
                    console.log('⏭️ Skipping function_response in non-SSE JSON');
                    return null;
                }
                if (part.thought) {
                    console.log('💭 Skipping thought in non-SSE JSON');
                    continue;
                }
                if (part.text) {
                    text += part.text;
                }
            }
        }

        // Alternative format
        if (jsonData.candidates && jsonData.candidates[0]?.content?.parts) {
            for (const part of jsonData.candidates[0].content.parts) {
                if (part.text) {
                    text += part.text;
                }
            }
        }

        return text || null;
    }

    /**
     * Extract JSON from accumulated text
     */
    static extractJSON(text) {
        // Try multiple patterns to find JSON
        const patterns = [
            /\{[\s\S]*\}/,  // Everything between first { and last }
            /```json\s*([\s\S]*?)\s*```/,  // JSON in markdown code blocks
            /```\s*([\s\S]*?)\s*```/,  // Code blocks without language
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                try {
                    const jsonStr = match[1] || match[0];
                    // Clean up the JSON string
                    const cleanedStr = jsonStr
                        .replace(/```json/g, '')
                        .replace(/```/g, '')
                        .trim();

                    const parsed = JSON.parse(cleanedStr);
                    return parsed;
                } catch (e) {
                    // Continue trying other patterns
                }
            }
        }

        // Try to find JSON by looking for balanced braces
        const startIdx = text.indexOf('{');
        if (startIdx !== -1) {
            let depth = 0;
            let endIdx = -1;

            for (let i = startIdx; i < text.length; i++) {
                if (text[i] === '{') depth++;
                if (text[i] === '}') depth--;
                if (depth === 0) {
                    endIdx = i;
                    break;
                }
            }

            if (endIdx !== -1) {
                try {
                    const jsonStr = text.substring(startIdx, endIdx + 1);
                    return JSON.parse(jsonStr);
                } catch (e) {
                    // Failed to parse
                }
            }
        }

        return null;
    }

    /**
     * Create a streaming message element for chat
     */
    static createStreamingMessage(container, className = 'bot-message') {
        const messageElement = document.createElement('div');
        messageElement.className = `${className} streaming-message`;
        messageElement.innerHTML = `
            <div class="message-bubble">
                <div class="message-content"></div>
                <span class="streaming-cursor">▊</span>
            </div>
            <span class="message-time">${Utils.formatTimestamp(Date.now())}</span>
        `;
        container.appendChild(messageElement);
        return messageElement.querySelector('.message-content');
    }

    /**
     * Update streaming message content
     */
    static updateStreamingMessage(contentElement, text, isMarkdown = true) {
        if (isMarkdown && typeof Utils !== 'undefined' && Utils.renderMarkdown) {
            contentElement.innerHTML = Utils.renderMarkdown(text);
        } else {
            contentElement.textContent = text;
        }

        // Scroll to bottom
        const container = contentElement.closest('#chatMessages, .messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    /**
     * Finalize streaming message (remove cursor, etc.)
     */
    static finalizeStreamingMessage(messageElement) {
        const cursor = messageElement.querySelector('.streaming-cursor');
        if (cursor) {
            cursor.remove();
        }

        const streamingMsg = messageElement.closest('.streaming-message');
        if (streamingMsg) {
            streamingMsg.classList.remove('streaming-message');
        }
    }
}

// Make available globally
window.StreamHandler = StreamHandler;