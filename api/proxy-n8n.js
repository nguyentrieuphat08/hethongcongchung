// Proxy API to call n8n webhooks (bypass CORS)
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

        // Forward request to n8n webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                party: party,
                documentType: documentType,
                images: images
            })
        });

        console.log('N8n response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('N8n error:', errorText);
            return res.status(response.status).json({ 
                error: 'N8n webhook error',
                message: errorText || `Status ${response.status}`
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Proxy error',
            message: error.message 
        });
    }
};
