// Vercel Serverless Function
// File: api/contracts.js
// Lưu trữ contracts tạm thời (sẽ reset khi redeploy)

// Sử dụng biến global để lưu contracts giữa các request
// Lưu ý: Vercel serverless có thể reset biến này sau một thời gian không hoạt động
if (!global.contracts) {
    global.contracts = [];
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET - Lấy danh sách contracts
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            contracts: global.contracts
        });
    }

    // POST - Thêm contract mới
    if (req.method === 'POST') {
        try {
            const { name, url, description } = req.body;

            if (!name || !url) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Both "name" and "url" are required'
                });
            }

            // Check duplicate
            const exists = global.contracts.some(c => c.url === url);
            if (exists) {
                return res.status(200).json({
                    success: true,
                    message: 'Contract already exists',
                    duplicate: true
                });
            }

            const newContract = {
                id: 'contract_' + Date.now(),
                name,
                url,
                description: description || '',
                markers: [],
                createdAt: new Date().toISOString()
            };

            global.contracts.push(newContract);

            return res.status(200).json({
                success: true,
                message: 'Contract added successfully',
                contract: newContract
            });

        } catch (error) {
            return res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    // DELETE - Xóa contract
    if (req.method === 'DELETE') {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(400).json({
                    error: 'Missing contract ID'
                });
            }

            global.contracts = global.contracts.filter(c => c.id !== id);

            return res.status(200).json({
                success: true,
                message: 'Contract deleted'
            });

        } catch (error) {
            return res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    return res.status(405).json({
        error: 'Method not allowed'
    });
};
