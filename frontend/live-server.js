#!/usr/bin/env node
/**
 * Live Server setup for Tour Guidance App
 * Configures live-server with custom middleware for .env file access
 */

const liveServer = require('live-server');
const fs = require('fs');
const path = require('path');

const params = {
    port: 8002,
    host: 'localhost',
    root: __dirname,
    open: true,
    file: 'index.html',
    wait: 1000,
    logLevel: 2,
    cors: true,
    middleware: [
        // Custom middleware to serve .env file from parent directory
        function(req, res, next) {
            if (req.url === '/.env') {
                const envPath = path.join(__dirname, '..', '.env');

                try {
                    if (fs.existsSync(envPath)) {
                        const envContent = fs.readFileSync(envPath, 'utf8');
                        res.writeHead(200, {
                            'Content-Type': 'text/plain',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type'
                        });
                        res.end(envContent);
                        return;
                    }
                } catch (error) {
                    console.error('Error reading .env file:', error);
                }

                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('.env file not found');
                return;
            }

            next();
        }
    ]
};

// Start the server
liveServer.start(params);

console.log('🚀 Tour Guidance App with Live Reload started!');
console.log('📁 Serving from:', __dirname);
console.log('🔑 .env file accessible from parent directory');
console.log('🔄 Auto-reload enabled for file changes');
console.log('-'.repeat(50));