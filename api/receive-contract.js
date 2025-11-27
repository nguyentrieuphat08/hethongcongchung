// Vercel Serverless Function
// File: api/receive-contract.js

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST method is accepted',
            allowedMethods: ['POST']
        });
    }

    try {
        const { name, url, id } = req.body;

        // Validate input
        if (!name || !url) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Both "name" and "url" are required',
                received: { name: !!name, url: !!url, id: !!id }
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({
                error: 'Invalid URL format',
                message: 'The "url" field must be a valid URL'
            });
        }

        // Generate ID if not provided
        const contractId = id || 'contract_' + Date.now();

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Contract received successfully',
            data: {
                id: contractId,
                name,
                url,
                receivedAt: new Date().toISOString()
            },
            instructions: {
                message: 'Contract data received. Please open the admin panel to see the contract.',
                adminUrl: 'https://hethongcongchung.vercel.app/admin-contract.html',
                nextSteps: [
                    'The contract will be automatically downloaded and saved',
                    'Open the admin panel to configure field positions',
                    'The contract will appear in the dropdown menu'
                ]
            }
        });

    } catch (error) {
        console.error('Error processing contract:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};