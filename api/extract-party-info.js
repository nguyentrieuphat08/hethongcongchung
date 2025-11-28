// API endpoint for image extraction with n8n
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
        const { party, images } = req.body;

        if (!party || !images || !Array.isArray(images)) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Both "party" and "images" array are required'
            });
        }

        // Mock extracted data - Replace with actual n8n webhook or OCR service
        const extractedData = {
            party: party,
            fullname: `Nguyễn Văn ${party}`,
            birthday: '01/01/1990',
            idcard: '123456789' + Math.floor(Math.random() * 100),
            issue_date: '01/01/2020',
            expiry_date: '01/01/2030',
            address: `Địa chỉ của ${party}, Hà Nội, Việt Nam`,
            totalImages: images.length,
            extractedAt: new Date().toISOString(),
            confidence: 0.95
        };

        return res.status(200).json({
            success: true,
            data: extractedData
        });
    } catch (error) {
        console.error('Error in extract-party-info:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};
