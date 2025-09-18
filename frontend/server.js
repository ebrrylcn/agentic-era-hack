#!/usr/bin/env node
/**
 * Node.js development server for Tour Guidance App
 * Serves frontend files and allows access to .env file
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8002;

// Enable CORS for all origins in development
app.use(cors());

// Add JSON body parser
app.use(express.json());

// API endpoint to get configuration (supports both .env and Cloud Run secrets)
app.get('/api/config', (req, res) => {
    const config = {
        GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
        // Add any other frontend-needed config here
    };

    // If no environment variables found, try reading from .env file as fallback
    if (!config.GOOGLE_MAPS_API_KEY && !config.GOOGLE_API_KEY) {
        const envPath = path.join(__dirname, '..', '.env');

        try {
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const lines = envContent.split('\n');

                lines.forEach(line => {
                    line = line.trim();
                    if (!line || line.startsWith('#')) return;

                    const equalIndex = line.indexOf('=');
                    if (equalIndex > 0) {
                        const key = line.substring(0, equalIndex).trim();
                        let value = line.substring(equalIndex + 1).trim();

                        // Remove quotes if present
                        if ((value.startsWith('"') && value.endsWith('"')) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }

                        if (key === 'GOOGLE_MAPS_API_KEY' || key === 'GOOGLE_API_KEY') {
                            config[key] = value;
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('Could not read .env file as fallback:', error);
        }
    }

    res.json(config);
});

// API endpoint to read the .env file (deprecated, kept for backward compatibility)
app.get('/api/env', (req, res) => {
    const envPath = path.join(__dirname, '..', '.env');

    try {
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            res.type('text/plain');
            res.send(envContent);
        } else {
            res.status(404).send('.env file not found');
        }
    } catch (error) {
        console.error('Error reading .env file:', error);
        res.status(500).send('Error reading .env file');
    }
});

// Test ADK connection
app.get('/api/adk/test', async (req, res) => {
    const adkBaseUrl = req.headers['x-adk-base-url'] || 'http://localhost:8000';

    try {
        const fetch = await import('node-fetch').then(m => m.default);
        
        const response = await fetch(`${adkBaseUrl}/docs`, {
            method: 'HEAD',
            timeout: 5000
        });

        res.json({ 
            status: 'connected',
            adkUrl: adkBaseUrl,
            responseStatus: response.status
        });
        
    } catch (error) {
        res.status(503).json({ 
            status: 'disconnected',
            error: error.message,
            adkUrl: adkBaseUrl,
            suggestion: 'Start ADK web server with: adk web'
        });
    }
});

// Create ADK session
app.post('/api/adk/create-session', async (req, res) => {
    const adkBaseUrl = req.headers['x-adk-base-url'] || 'http://localhost:8000';
    const appName = req.headers['x-app-name'] || 'app';
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const fetch = await import('node-fetch').then(m => m.default);
        
        const response = await fetch(`${adkBaseUrl}/apps/${appName}/users/${userId}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`ADK session creation error (${response.status}):`, errorText);
            return res.status(response.status).json({ 
                error: `Failed to create session: ${response.status} ${response.statusText}`,
                details: errorText
            });
        }

        const sessionData = await response.json();
        res.json(sessionData);
        
    } catch (error) {
        console.error('Error creating ADK session:', error);
        res.status(500).json({ 
            error: 'Failed to create ADK session',
            details: error.message
        });
    }
});

// Check ADK session
app.get('/api/adk/check-session', async (req, res) => {
    const adkBaseUrl = req.headers['x-adk-base-url'] || 'http://localhost:8000';
    const appName = req.headers['x-app-name'] || 'app';
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];

    if (!userId || !sessionId) {
        return res.status(400).json({ error: 'User ID and Session ID are required' });
    }

    try {
        const fetch = await import('node-fetch').then(m => m.default);
        
        const response = await fetch(`${adkBaseUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`, {
            method: 'GET'
        });

        if (response.ok) {
            const sessionData = await response.json();
            res.json(sessionData);
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
        
    } catch (error) {
        console.error('Error checking ADK session:', error);
        res.status(500).json({ 
            error: 'Failed to check ADK session',
            details: error.message
        });
    }
});

// ADK Agent proxy endpoint to avoid CORS issues (must be after specific routes)
app.post('/api/adk/:endpoint', async (req, res) => {
    const endpoint = req.params.endpoint;
    const adkBaseUrl = req.headers['x-adk-base-url'] || 'http://localhost:8000';

    if (!['run', 'run_sse'].includes(endpoint)) {
        return res.status(400).json({ error: 'Invalid ADK endpoint' });
    }

    try {
        const fetch = await import('node-fetch').then(m => m.default);
        
        const response = await fetch(`${adkBaseUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`ADK API error (${response.status}):`, errorText);
            return res.status(response.status).json({ 
                error: `ADK API error: ${response.status} ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Error proxying to ADK:', error);
        res.status(500).json({ 
            error: 'Failed to connect to ADK agent',
            details: error.message,
            suggestion: 'Make sure ADK web server is running (adk web)'
        });
    }
});

// API endpoint to save form data to form.json
app.post('/api/form', (req, res) => {
    const formPath = path.join(__dirname, 'form.json');

    try {
        fs.writeFileSync(formPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Form data saved successfully' });
    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({ success: false, error: 'Failed to save form data' });
    }
});

// API endpoint to read form data from form.json
app.get('/api/form', (req, res) => {
    const formPath = path.join(__dirname, 'form.json');

    try {
        if (fs.existsSync(formPath)) {
            const formData = JSON.parse(fs.readFileSync(formPath, 'utf8'));
            res.json(formData);
        } else {
            res.status(404).json({ error: 'Form data not found' });
        }
    } catch (error) {
        console.error('Error reading form data:', error);
        res.status(500).json({ error: 'Failed to read form data' });
    }
});

// API endpoint to read output data from output.json
app.get('/api/output', (req, res) => {
    const outputPath = path.join(__dirname, 'output.json');

    try {
        if (fs.existsSync(outputPath)) {
            const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            console.log(`✅ Output data loaded from: ${outputPath}`);
            res.json(outputData);
        } else {
            res.status(404).json({ error: 'Output data not found' });
        }
    } catch (error) {
        console.error('Error reading output data:', error);
        res.status(500).json({ error: 'Failed to read output data' });
    }
});

// Special route to serve .env file from parent directory
app.get('/.env', (req, res) => {
    const envPath = path.join(__dirname, '..', '.env');

    try {
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            res.type('text/plain');
            res.send(envContent);
        } else {
            res.status(404).send('.env file not found');
        }
    } catch (error) {
        console.error('Error reading .env file:', error);
        res.status(500).send('Error reading .env file');
    }
});

// Save output data endpoint
app.post('/api/save-output', async (req, res) => {
    try {
        const fs = await import('fs').then(m => m.promises);
        
        const outputPath = path.resolve(__dirname, 'output.json');
        const data = JSON.stringify(req.body, null, 2);
        
        await fs.writeFile(outputPath, data, 'utf8');
        
        console.log('💾 Successfully saved data to output.json');
        res.json({ success: true, message: 'Data saved successfully' });
        
    } catch (error) {
        console.error('❌ Error saving to output.json:', error);
        res.status(500).json({ 
            error: 'Failed to save data',
            details: error.message
        });
    }
});

// Serve static files from current directory (after API routes)
app.use(express.static(__dirname));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404s - this should be the last route
app.use((req, res) => {
    // Check if it's a file request
    if (path.extname(req.url)) {
        res.status(404).send('File not found');
    } else {
        // For SPA routing, serve index.html for unknown routes
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Internal server error');
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Tour Guidance App server running at:');
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://127.0.0.1:${PORT}`);
    console.log('');
    console.log('📁 Serving files from:', __dirname);
    console.log('🔑 Environment configuration:');
    if (process.env.GOOGLE_MAPS_API_KEY) {
        console.log('   ✅ GOOGLE_MAPS_API_KEY loaded from environment');
    } else {
        console.log('   ⚠️  GOOGLE_MAPS_API_KEY not found in environment, will use .env file');
    }
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('-'.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n✅ Server stopped gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n✅ Server stopped');
    process.exit(0);
});