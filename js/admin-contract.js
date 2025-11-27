// Hằng số
const CONTRACTS_KEY = 'contracts';
const API_ENDPOINT = 'https://hethongcongchung.vercel.app/api/receive-contract';

// Khởi tạo khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    loadContracts();
    setupEventListeners();
    // Kiểm tra xem có hợp đồng mới từ n8n không
    checkForNewContracts();
});

// Lấy danh sách hợp đồng từ localStorage
function getContracts() {
    const contracts = localStorage.getItem(CONTRACTS_KEY);
    return contracts ? JSON.parse(contracts) : [];
}

// Lưu hợp đồng vào localStorage
function saveContracts(contracts) {
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
}

// Load danh sách hợp đồng
function loadContracts() {
    const contracts = getContracts();
    const select = document.getElementById('contractSelect');
    
    // Xóa các option cũ (giữ lại option đầu tiên)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Thêm các hợp đồng vào dropdown
    contracts.forEach(contract => {
        const option = document.createElement('option');
        option.value = contract.id;
        option.textContent = contract.name;
        option.dataset.url = contract.url;
        select.appendChild(option);
    });
    
    console.log(`Đã load ${contracts.length} hợp đồng`);
}

// Thiết lập event listeners
function setupEventListeners() {
    const contractSelect = document.getElementById('contractSelect');
    
    contractSelect.addEventListener('change', async (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (!selectedOption || selectedOption.value === '') return;
        
        const contractUrl = selectedOption.dataset.url;
        const contractId = selectedOption.value;
        
        console.log('Đã chọn hợp đồng:', {
            id: contractId,
            name: selectedOption.textContent,
            url: contractUrl
        });
        
        // Hiển thị hợp đồng
        await loadContract(contractUrl, contractId);
    });
}

// Load hợp đồng PDF
async function loadContract(url, contractId) {
    try {
        showStatus('Đang tải hợp đồng...', 'info');
        
        // Tải PDF
        const response = await fetch(url);
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        
        // Hiển thị trong iframe hoặc canvas
        displayPDF(pdfUrl);
        
        showStatus('Tải hợp đồng thành công!', 'success');
    } catch (error) {
        console.error('Lỗi tải hợp đồng:', error);
        showStatus('Lỗi tải hợp đồng: ' + error.message, 'error');
    }
}

// Hiển thị PDF
function displayPDF(pdfUrl) {
    const container = document.getElementById('contractTemplate');
    container.innerHTML = `
        <iframe 
            src="${pdfUrl}" 
            style="width: 100%; height: 800px; border: 1px solid #ccc;"
        ></iframe>
    `;
}

// Hiển thị thông báo
function showStatus(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Bạn có thể thêm UI notification ở đây
}

// Kiểm tra hợp đồng mới từ URL query parameters
function checkForNewContracts() {
    const urlParams = new URLSearchParams(window.location.search);
    const newContractId = urlParams.get('new_contract');
    
    if (newContractId) {
        const newContractName = urlParams.get('name');
        const newContractUrl = urlParams.get('url');
        
        if (newContractName && newContractUrl) {
            // Thêm hợp đồng mới
            addNewContract({
                id: newContractId,
                name: decodeURIComponent(newContractName),
                url: decodeURIComponent(newContractUrl)
            });
            
            // Xóa query parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Thêm hợp đồng mới
function addNewContract(contractData) {
    const contracts = getContracts();
    
    // Kiểm tra xem hợp đồng đã tồn tại chưa
    const exists = contracts.find(c => c.id === contractData.id);
    if (exists) {
        console.log('Hợp đồng đã tồn tại:', contractData.name);
        return;
    }
    
    // Thêm hợp đồng mới
    contracts.push(contractData);
    saveContracts(contracts);
    
    // Reload danh sách
    loadContracts();
    
    showStatus(`Đã thêm hợp đồng: ${contractData.name}`, 'success');
}

// Export functions để có thể gọi từ console (debugging)
window.adminContract = {
    getContracts,
    addNewContract,
    loadContracts,
    clearAllContracts: () => {
        if (confirm('Bạn có chắc muốn xóa tất cả hợp đồng?')) {
            localStorage.removeItem(CONTRACTS_KEY);
            loadContracts();
            showStatus('Đã xóa tất cả hợp đồng', 'info');
        }
    }
};