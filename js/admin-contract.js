// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentContract = null;
let fieldMarkers = [];
let draggedField = null;
let pollingInterval = null;

// Load contracts on page load
window.addEventListener('load', async () => {
    await loadContractsList();
    setupN8nReceiver();
    startPolling();
    document.getElementById('apiEndpoint').textContent = window.location.origin + '/api/receive-contract';
});

// Setup n8n receiver - Listen for incoming contracts
function setupN8nReceiver() {
    // Method 1: Direct function call (for testing)
    window.receiveContractFromN8n = async (data) => {
        await saveContractFromN8n(data);
    };
    
    // Method 2: PostMessage API (if n8n uses iframe)
    window.addEventListener('message', async (event) => {
        // Verify origin if needed
        // if (event.origin !== 'https://your-n8n-domain.com') return;
        
        if (event.data.type === 'NEW_CONTRACT') {
            await saveContractFromN8n(event.data.contract);
        }
    });
}

// Method 3: Polling storage for new contracts
function startPolling() {
    // Check for new contracts every 3 seconds
    pollingInterval = setInterval(async () => {
        try {
            const pendingContract = await window.storage.get('pending_contract');
            if (pendingContract) {
                const data = JSON.parse(pendingContract.value);
                await saveContractFromN8n(data);
                await window.storage.delete('pending_contract');
            }
        } catch (error) {
            // No pending contract
        }
    }, 3000);
}

// Stop polling when page unloads
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

// Load contracts list into select
async function loadContractsList() {
    try {
        const result = await window.storage.list('contract:');
        const select = document.getElementById('contractSelect');
        select.innerHTML = '<option value="">-- Chọn hợp đồng --</option>';
        
        if (result && result.keys && result.keys.length > 0) {
            for (const key of result.keys) {
                try {
                    const data = await window.storage.get(key);
                    if (data) {
                        const contract = JSON.parse(data.value);
                        const option = document.createElement('option');
                        option.value = contract.id;
                        option.textContent = contract.name;
                        select.appendChild(option);
                    }
                } catch (e) {
                    console.error('Error loading contract:', e);
                }
            }
        }
    } catch (error) {
        console.log('No contracts found');
    }
}

// Save contract received from n8n
async function saveContractFromN8n(data) {
    try {
        const { name, url, id } = data;
        
        if (!name || !url) {
            console.error('Invalid data from n8n:', data);
            alert('Dữ liệu không hợp lệ từ n8n');
            return;
        }

        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingContract';
        loadingDiv.className = 'alert alert-info position-fixed top-0 start-50 translate-middle-x mt-3';
        loadingDiv.style.zIndex = '9999';
        loadingDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span>Đang tải hợp đồng từ n8n...</span>
            </div>
        `;
        document.body.appendChild(loadingDiv);

        // Download file from URL with CORS proxy if needed
        let response;
        try {
            response = await fetch(url);
        } catch (corsError) {
            // If CORS error, try with proxy
            console.log('CORS error, trying with proxy...');
            response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        }
        
        if (!response.ok) {
            throw new Error('Failed to download file');
        }
        
        const blob = await response.blob();
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async function() {
            const base64 = reader.result.split(',')[1];
            
            const contractId = id || 'contract_' + Date.now();
            const contract = {
                id: contractId,
                name: name,
                url: url,
                pdfData: base64,
                fields: [],
                createdAt: new Date().toISOString()
            };
            
            await window.storage.set('contract:' + contract.id, JSON.stringify(contract));
            
            // Remove loading indicator
            document.getElementById('loadingContract')?.remove();
            
            // Reload list
            await loadContractsList();
            
            // Select the new contract
            document.getElementById('contractSelect').value = contract.id;
            await loadContract();
            
            // Show success notification
            showNotification('success', 'Đã nhận và lưu hợp đồng từ n8n thành công!');
        };
        
        reader.onerror = function() {
            document.getElementById('loadingContract')?.remove();
            showNotification('error', 'Lỗi khi đọc file PDF');
        };
        
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error('Error saving contract from n8n:', error);
        document.getElementById('loadingContract')?.remove();
        showNotification('error', 'Lỗi khi lưu hợp đồng: ' + error.message);
    }
}

// Show notification
function showNotification(type, message) {
    const notifDiv = document.createElement('div');
    notifDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    notifDiv.style.zIndex = '9999';
    notifDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notifDiv);
    
    setTimeout(() => {
        notifDiv.remove();
    }, 5000);
}

// Load selected contract
async function loadContract() {
    const contractId = document.getElementById('contractSelect').value;
    
    if (!contractId) {
        document.getElementById('contractCanvasWrapper').innerHTML = `
            <div class="alert alert-secondary text-center">
                <i class="bi bi-arrow-left-circle me-2"></i>
                Chọn một hợp đồng từ menu bên trái để bắt đầu chỉnh sửa
            </div>
        `;
        document.getElementById('saveBtn').disabled = true;
        return;
    }
    
    try {
        const data = await window.storage.get('contract:' + contractId);
        if (data) {
            currentContract = JSON.parse(data.value);
            fieldMarkers = currentContract.fields || [];
            
            await renderPDF();
            document.getElementById('saveBtn').disabled = false;
        }
    } catch (error) {
        showNotification('error', 'Lỗi khi tải hợp đồng: ' + error.message);
    }
}

// Render PDF
async function renderPDF() {
    try {
        // Create canvas container
        document.getElementById('contractCanvasWrapper').innerHTML = `
            <div class="contract-canvas-container" id="canvasContainer">
                <canvas id="pdfCanvas"></canvas>
                <div id="markersContainer"></div>
            </div>
        `;
        
        // Decode base64 PDF
        const pdfData = atob(currentContract.pdfData);
        const pdfArray = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
            pdfArray[i] = pdfData.charCodeAt(i);
        }
        
        // Load PDF
        const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.getElementById('pdfCanvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'pdf-canvas';
        
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        // Setup drag and drop
        setupDragAndDrop();
        
        // Render existing markers
        renderMarkers();
        
    } catch (error) {
        console.error('Error rendering PDF:', error);
        showNotification('error', 'Lỗi khi hiển thị PDF: ' + error.message);
    }
}

// Setup drag and drop
function setupDragAndDrop() {
    const placeholders = document.querySelectorAll('.placeholder-item');
    const container = document.getElementById('canvasContainer');
    
    // Placeholder drag events
    placeholders.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedField = {
                field: this.dataset.field,
                label: this.textContent.trim()
            };
            this.classList.add('dragging');
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    
    // Container drop events
    container.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });
    
    container.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });
    
    container.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (!draggedField) return;
        
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Add marker
        fieldMarkers.push({
            field: draggedField.field,
            label: draggedField.label,
            x: x,
            y: y
        });
        
        renderMarkers();
        draggedField = null;
    });
}

// Render markers
function renderMarkers() {
    const container = document.getElementById('markersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    fieldMarkers.forEach((marker, index) => {
        const div = document.createElement('div');
        div.className = 'field-marker';
        div.style.left = marker.x + 'px';
        div.style.top = marker.y + 'px';
        div.draggable = true;
        
        div.innerHTML = `
            <span>${marker.label}</span>
            <button class="remove-btn" onclick="removeMarker(${index})">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        // Make marker draggable to reposition
        div.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('markerIndex', index);
        });
        
        container.appendChild(div);
    });
    
    // Setup repositioning
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.addEventListener('drop', function(e) {
        const markerIndex = e.dataTransfer.getData('markerIndex');
        if (markerIndex !== '' && markerIndex !== null) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            fieldMarkers[parseInt(markerIndex)].x = x;
            fieldMarkers[parseInt(markerIndex)].y = y;
            renderMarkers();
        }
    });
}

// Remove marker
function removeMarker(index) {
    fieldMarkers.splice(index, 1);
    renderMarkers();
}

// Clear all markers
function clearAllMarkers() {
    if (confirm('Bạn có chắc muốn xóa tất cả marker?')) {
        fieldMarkers = [];
        renderMarkers();
    }
}

// Save contract configuration
async function saveContractConfig() {
    if (!currentContract) return;
    
    try {
        currentContract.fields = fieldMarkers;
        await window.storage.set('contract:' + currentContract.id, JSON.stringify(currentContract));
        showNotification('success', 'Đã lưu cấu hình thành công!');
    } catch (error) {
        showNotification('error', 'Lỗi khi lưu: ' + error.message);
    }
}

// Manual test function to simulate n8n sending contract
window.testReceiveContract = async () => {
    const testData = {
        name: "Hợp đồng Thuê nhà Test",
        url: "https://drive.google.com/uc?id=1QB1D9seFtbbVwiDzSXVe0Hf4SMRqjRWz&export=download",
        id: "test_" + Date.now()
    };
    await window.receiveContractFromN8n(testData);
};

// Expose global function for n8n to call directly
window.n8nReceiveContract = async (name, url, id) => {
    await window.receiveContractFromN8n({ name, url, id });
};

// Log instructions
console.log('%c📋 Hướng dẫn tích hợp n8n:', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%cCách 1 - Test thủ công:', 'color: #28a745; font-weight: bold;');
console.log('  testReceiveContract()');
console.log('%cCách 2 - n8n gọi trực tiếp:', 'color: #28a745; font-weight: bold;');
console.log('  n8nReceiveContract("Tên hợp đồng", "URL", "ID")');
console.log('%cCách 3 - n8n lưu vào storage:', 'color: #28a745; font-weight: bold;');
console.log('  await window.storage.set("pending_contract", JSON.stringify({ name, url, id }))');
console.log('%cCách 4 - PostMessage:', 'color: #28a745; font-weight: bold;');
console.log('  window.postMessage({ type: "NEW_CONTRACT", contract: { name, url, id } }, "*")');
console.log('%c\nĐịa chỉ API:', 'color: #dc3545; font-weight: bold;');
console.log('  ' + window.location.origin + '/api/receive-contract');