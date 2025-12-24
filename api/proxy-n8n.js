// Proxy API to call n8n webhooks (bypass CORS)
const https = require('https');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { webhookUrl, party, documentType, images } = req.body;

        if (!webhookUrl || !images) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'webhookUrl and images are required'
            });
        }

        console.log('Proxying request to:', webhookUrl, 'Party:', party, 'DocType:', documentType);

        // Prepare request body
        const requestBody = JSON.stringify({
            party: party,
            documentType: documentType,
            images: images
        });

        // Parse webhook URL
        const url = new URL(webhookUrl);
        
        // Make request using https module
        const data = await new Promise((resolve, reject) => {
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            };

            const request = https.request(options, (response) => {
                let responseData = '';
                
                response.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                response.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject({ status: response.statusCode, data: parsed });
                        }
                    } catch (e) {
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            resolve({ raw: responseData });
                        } else {
                            reject({ status: response.statusCode, message: responseData });
                        }
                    }
                });
            });

            request.on('error', (error) => {
                reject({ message: error.message });
            });

            request.write(requestBody);
            request.end();
        });

        console.log('N8n response received');
        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        if (error.status) {
            return res.status(error.status).json({ 
                error: 'N8n webhook error',
                message: error.message || JSON.stringify(error.data)
            });
        }
        return res.status(500).json({ 
            error: 'Proxy error',
            message: error.message 
        });
    }
};
