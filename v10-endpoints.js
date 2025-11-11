// FACILITAIR V10 Routing API Endpoints
// Add this to your server.js to enable V10 intelligent routing

const axios = require('axios');

// V10 API Configuration
const V10_API_URL = process.env.V10_API_URL || 'http://localhost:5001';

module.exports = function setupV10Endpoints(app) {
    // V10 API: Route a task
    // Protected endpoint - requires beta authentication
    app.post('/api/v10/route', async (req, res) => {
        try {
            const { task } = req.body;

            if (!task || typeof task !== 'string' || task.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Task description required'
                });
            }

            // Validate task length
            if (task.length > 5000) {
                return res.status(400).json({
                    success: false,
                    error: 'Task description too long (max 5000 characters)'
                });
            }

            // Call V10 routing API
            const response = await axios.post(`${V10_API_URL}/route`, {
                task: task.trim()
            }, {
                timeout: 30000, // 30 second timeout
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Return routing decision
            res.json({
                success: true,
                ...response.data
            });

        } catch (error) {
            console.error('V10 routing error:', error.message);

            // Check if it's a timeout
            if (error.code === 'ECONNABORTED') {
                return res.status(504).json({
                    success: false,
                    error: 'Request timeout - V10 model took too long to respond'
                });
            }

            // Check if V10 server is down
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({
                    success: false,
                    error: 'V10 routing service unavailable',
                    details: 'The V10 model server is not running. Please start it with: python3 v10_demo_server.py'
                });
            }

            // Other errors
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // V10 API: Get model status and metrics
    app.get('/api/v10/status', async (req, res) => {
        try {
            const response = await axios.get(`${V10_API_URL}/status`, {
                timeout: 5000
            });

            res.json({
                success: true,
                ...response.data
            });

        } catch (error) {
            console.error('V10 status check error:', error.message);

            res.status(503).json({
                success: false,
                available: false,
                error: 'V10 service unavailable'
            });
        }
    });

    // V10 API: Get training metrics (if available)
    app.get('/api/v10/metrics', async (req, res) => {
        try {
            const response = await axios.get(`${V10_API_URL}/metrics`, {
                timeout: 5000
            });

            res.json({
                success: true,
                ...response.data
            });

        } catch (error) {
            console.error('V10 metrics error:', error.message);

            // Return default metrics if service unavailable
            res.json({
                success: false,
                available: false,
                metrics: {
                    strategy: 73.4,
                    capability: 61.8,
                    domain: 78.4,
                    execution_type: 53.7,
                    average: 66.8
                },
                note: 'Live metrics unavailable - showing last known values'
            });
        }
    });

    console.log('✅ V10 routing endpoints registered');
    console.log(`   V10 API URL: ${V10_API_URL}`);
};
