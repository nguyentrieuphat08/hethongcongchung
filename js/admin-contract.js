// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentContract = null;
let fieldMarkers = [];
let draggedField = null;

// Load contracts on page load
window.addEventListener('load', async () => {
    await loadContractsList();
    setupN8nReceiver();
    document.getElementById('apiEndpoint').textContent = window.location.origin + '/api/receive-contract';
});

// Setup n8n receiver (simulated - replace with actual API)
function setupN8nReceiver() {
    // This simulates receiving data from n8n
    // In production, you would set up an actual API endpoint
    window.receiveContractFromN8n = async (data) => {
        // data = { name: "Hợp đồng thuê nhà", url: "https://drive.google.com/..." }
        await saveContractFromN8n(data);
    };
}

// Load contracts list into select
async function loadContractsList() {
    try {
        const result = await window.storage.list('contract:');
        const select = document.getElementById('contractSelect');
        select.innerHTML = '<option value="">-- Chọn hợp đồng --</option>';
        
        if (result && result.keys && result.keys.length > 0) {
            for (const key of result.keys) {
                const data = await window.storage.get(key);
                if (data) {
                    const contract = JSON.parse(data.value);
                    const option = document.createElement('option');
                    option.value = contract.id;
                    option.textContent = contract.name;
                    select.appendChild(option);
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
        const { name, url } = data;
        
        if (!name || !url) {
            alert('Dữ liệu không hợp lệ từ n8n');
            return;
        }

        // Download file from URL
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async function() {
            const base64 = reader.result.split(',')[1];
            
            const contract = {
                id: 'contract_' + Date.now(),
                name: name,
                url: url,
                pdfData: base64,
                fields: [],
                createdAt: new Date().toISOString()
            };
            
            await window.storage.set('contract:' + contract.id, JSON.stringify(contract));
            
            // Reload list
            await loadContractsList();
            
            // Select the new contract
            document.getElementById('contractSelect').value = contract.id;
            await loadContract();
            
            alert('Đã nhận và lưu hợp đồng từ n8n thành công!');
        };
        
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error('Error saving contract from n8n:', error);
        alert('Lỗi khi lưu hợp đồng: ' + error.message);
    }
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
        alert('Lỗi khi tải hợp đồng: ' + error.message);
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
        alert('Lỗi khi hiển thị PDF: ' + error.message);
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
        if (markerIndex) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            fieldMarkers[markerIndex].x = x;
            fieldMarkers[markerIndex].y = y;
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
        alert('Đã lưu cấu hình thành công!');
    } catch (error) {
        alert('Lỗi khi lưu: ' + error.message);
    }
}

// Manual test function to simulate n8n sending contract
window.testReceiveContract = async () => {
    const testData = {
        name: "Hợp đồng Thuê nhà Test",
        url: "https://drive.google.com/uc?id=1QB1D9seFtbbVwiDzSXVe0Hf4SMRqjRWz&export=download"
    };
    await window.receiveContractFromN8n(testData);
};

// Log test function info
console.log('To test n8n integration, run: testReceiveContract()');