// Vercel Serverless Function
// File: api/save-contract.js
// Endpoint để lưu hợp đồng và redirect đến admin panel

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, url, id, filename, pdf_url } = req.body;
        
        const contractName = name || filename;
        const contractUrl = url || pdf_url;
        const contractId = id || 'contract_' + Date.now();

        if (!contractName || !contractUrl) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Both "name" and "url" are required'
            });
        }

        // Tạo HTML page với script tự động lưu vào localStorage
        const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đang lưu hợp đồng...</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success {
            color: #10b981;
            font-size: 48px;
            margin-bottom: 1rem;
        }
        .message {
            color: #4b5563;
            margin: 1rem 0;
        }
        .contract-info {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
            text-align: left;
        }
        .contract-info strong {
            color: #667eea;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 1rem;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner" id="spinner"></div>
        <h2 id="title">Đang lưu hợp đồng...</h2>
        <div class="contract-info">
            <p><strong>Tên hợp đồng:</strong><br>${contractName}</p>
            <p><strong>ID:</strong> ${contractId}</p>
        </div>
        <p class="message" id="message">Vui lòng đợi...</p>
        <a href="/admin-contract.html" class="btn" id="redirectBtn" style="display: none;">
            Đi đến Quản lý Hợp đồng
        </a>
    </div>

    <script>
        const CONTRACTS_KEY = 'contracts';
        
        const contractData = {
            id: '${contractId}',
            name: \`${contractName}\`,
            url: \`${contractUrl}\`,
            addedAt: new Date().toISOString()
        };

        function saveContract() {
            try {
                // Lấy danh sách hợp đồng hiện tại
                let contracts = [];
                const stored = localStorage.getItem(CONTRACTS_KEY);
                if (stored) {
                    contracts = JSON.parse(stored);
                }

                // Kiểm tra xem hợp đồng đã tồn tại chưa
                const exists = contracts.find(c => c.id === contractData.id);
                if (!exists) {
                    contracts.push(contractData);
                    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
                    console.log('✅ Đã lưu hợp đồng:', contractData);
                } else {
                    console.log('ℹ️ Hợp đồng đã tồn tại:', contractData.name);
                }

                // Hiển thị thành công
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('title').innerHTML = '✅ Lưu hợp đồng thành công!';
                document.getElementById('message').textContent = 'Hợp đồng đã được thêm vào danh sách. Bạn có thể quay lại trang Quản lý Hợp đồng.';
                document.getElementById('redirectBtn').style.display = 'inline-block';

                // Tự động redirect sau 2 giây
                setTimeout(() => {
                    window.location.href = '/admin-contract.html';
                }, 2000);

            } catch (error) {
                console.error('❌ Lỗi khi lưu hợp đồng:', error);
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('title').textContent = '❌ Lỗi';
                document.getElementById('message').textContent = 'Không thể lưu hợp đồng: ' + error.message;
            }
        }

        // Chạy khi trang load xong
        window.addEventListener('DOMContentLoaded', saveContract);
    </script>
</body>
</html>
        `;

        // Trả về HTML
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
};