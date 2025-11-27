let chatHistory = [];
let generatedContract = null;

// N8N API Configuration
const N8N_CHAT_API = 'YOUR_N8N_GPT_WEBHOOK_URL'; // Replace with actual n8n webhook URL
const N8N_CONTRACT_GENERATION_API = 'YOUR_N8N_CONTRACT_WEBHOOK_URL'; // Replace with contract generation webhook

window.addEventListener('load', () => {
    loadChatHistory();
});

async function loadChatHistory() {
    try {
        const result = await window.storage.get('chat_history');
        if (result) {
            chatHistory = JSON.parse(result.value);
            displayChatHistory();
        }
    } catch (error) {
        console.log('No chat history found');
    }
}

async function saveChatHistory() {
    try {
        await window.storage.set('chat_history', JSON.stringify(chatHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

function displayChatHistory() {
    const container = document.getElementById('chatContainer');
    container.innerHTML = '';
    
    chatHistory.forEach(msg => {
        addMessageToUI(msg.role, msg.content, msg.timestamp);
    });
    
    scrollToBottom();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    const userMsg = {
        role: 'user',
        content: message,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    chatHistory.push(userMsg);
    addMessageToUI('user', message, userMsg.timestamp);
    
    input.value = '';
    scrollToBottom();
    
    // Disable send button
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    
    try {
        // Call n8n GPT API
        const response = await callN8nChatAPI(message);
        
        const botMsg = {
            role: 'bot',
            content: response.message,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        
        chatHistory.push(botMsg);
        addMessageToUI('bot', response.message, botMsg.timestamp);
        
        // Check if response contains contract
        if (response.contract) {
            generatedContract = response.contract;
            showContractNotification();
        }
        
        // Save chat history
        await saveChatHistory();
        
    } catch (error) {
        console.error('Error sending message:', error);
        const errorMsg = {
            role: 'bot',
            content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        chatHistory.push(errorMsg);
        addMessageToUI('bot', errorMsg.content, errorMsg.timestamp);
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="bi bi-send-fill"></i>';
        scrollToBottom();
    }
}

async function callN8nChatAPI(message) {
    // Simulate API call - replace with actual n8n webhook
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate response
            const responses = [
                'Cảm ơn bạn đã liên hệ. Tôi có thể giúp bạn tư vấn về hợp đồng công chứng. Bạn cần tư vấn về loại hợp đồng nào?',
                'Để tạo hợp đồng, tôi cần một số thông tin từ bạn. Bạn có thể cung cấp thông tin cá nhân không?',
                'Tôi đã hiểu yêu cầu của bạn. Hãy cho tôi một chút thời gian để xử lý.'
            ];
            
            resolve({
                message: responses[Math.floor(Math.random() * responses.length)],
                contract: null
            });
        }, 1500);
    });
    
    // Actual implementation:
    /*
    const response = await fetch(N8N_CHAT_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            history: chatHistory
        })
    });
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    return await response.json();
    */
}

function addMessageToUI(role, content, timestamp) {
    const container = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    if (role === 'bot') {
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="bi bi-robot me-2" style="font-size: 24px; color: #667eea;"></i>
                <div>
                    <strong>AI Assistant</strong>
                    <p class="mb-0 mt-2">${content}</p>
                </div>
            </div>
            <small class="text-muted d-block mt-2">${timestamp}</small>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start justify-content-end">
                <div>
                    <strong>Bạn</strong>
                    <p class="mb-0 mt-2">${content}</p>
                </div>
                <i class="bi bi-person-circle ms-2" style="font-size: 24px;"></i>
            </div>
            <small class="d-block mt-2 text-end">${timestamp}</small>
        `;
    }
    
    container.appendChild(messageDiv);
}

function scrollToBottom() {
    const container = document.getElementById('chatContainer');
    container.scrollTop = container.scrollHeight;
}

function showContractNotification() {
    const container = document.getElementById('chatContainer');
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'alert alert-success mt-3';
    notificationDiv.innerHTML = `
        <i class="bi bi-file-earmark-check me-2"></i>
        <strong>Hợp đồng đã được tạo!</strong>
        <button class="btn btn-sm btn-success ms-3" onclick="viewContract()">
            <i class="bi bi-eye me-1"></i>Xem hợp đồng
        </button>
    `;
    container.appendChild(notificationDiv);
    scrollToBottom();
}

function viewContract() {
    if (!generatedContract) return;
    
    document.getElementById('contractPreview').innerHTML = `
        <div class="border p-4">
            <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace;">${generatedContract}</pre>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('contractModal'));
    modal.show();
}

function downloadContract() {
    if (!generatedContract) return;
    
    const blob = new Blob([generatedContract], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hop-dong-' + Date.now() + '.txt';
    link.click();
    
    URL.revokeObjectURL(url);
}

async function clearChat() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) {
        chatHistory = [];
        await window.storage.delete('chat_history');
        
        const container = document.getElementById('chatContainer');
        container.innerHTML = `
            <div class="message bot">
                <div class="d-flex align-items-start">
                    <i class="bi bi-robot me-2" style="font-size: 24px; color: #667eea;"></i>
                    <div>
                        <strong>AI Assistant</strong>
                        <p class="mb-0 mt-2">Xin chào! Tôi là trợ lý AI pháp lý. Tôi có thể giúp bạn:</p>
                        <ul class="mb-0 mt-2">
                            <li>Tư vấn về các vấn đề pháp lý</li>
                            <li>Tạo hợp đồng dựa trên thông tin bạn cung cấp</li>
                            <li>Giải đáp thắc mắc về hợp đồng công chứng</li>
                        </ul>
                    </div>
                </div>
                <small class="text-muted d-block mt-2">Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
        `;
        
        generatedContract = null;
    }
}