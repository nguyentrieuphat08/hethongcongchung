let currentImage = null;
let currentExtractedData = null;

// N8N API Configuration
const N8N_EXTRACT_API = 'YOUR_N8N_WEBHOOK_URL'; // Replace with actual n8n webhook URL

window.addEventListener('load', () => {
    setupImageUpload();
});

function setupImageUpload() {
    const imageInput = document.getElementById('imageInput');
    const imageDropZone = document.getElementById('imageDropZone');
    
    // Click to upload
    imageDropZone.addEventListener('click', () => {
        imageInput.click();
    });
    
    // File input change
    imageInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            handleImageFile(this.files[0]);
        }
    });
    
    // Drag and drop
    imageDropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
    });
    
    imageDropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
    });
    
    imageDropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });
}

function handleImageFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh!');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImage = {
            file: file,
            dataUrl: e.target.result,
            base64: e.target.result.split(',')[1]
        };
        
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('extractBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    currentImage = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('extractBtn').disabled = true;
    document.getElementById('imageInput').value = '';
}

async function extractInfo() {
    if (!currentImage) {
        alert('Vui lòng chọn hình ảnh trước!');
        return;
    }
    
    const extractBtn = document.getElementById('extractBtn');
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
    
    try {
        // Call n8n API to extract information
        // Replace this with actual API call
        const response = await callN8nExtractAPI(currentImage.base64);
        
        // Display extracted data
        displayExtractedData(response);
        
    } catch (error) {
        console.error('Error extracting info:', error);
        alert('Lỗi khi trích xuất thông tin: ' + error.message);
    } finally {
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<i class="bi bi-gear me-2"></i>GỬI VÀ TRÍCH XUẤT';
    }
}

async function callN8nExtractAPI(base64Image) {
    // Simulate API call - replace with actual n8n webhook
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                fullname: 'Nguyễn Văn A',
                birthday: '01/01/1990',
                idcard: '123456789',
                issue_date: '01/01/2020',
                expiry_date: '01/01/2030',
                address: 'Hà Nội, Việt Nam'
            });
        }, 2000);
    });
    
    // Actual implementation:
    /*
    const response = await fetch(N8N_EXTRACT_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: base64Image
        })
    });
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    return await response.json();
    */
}

function displayExtractedData(data) {
    currentExtractedData = data;
    
    // Fill form fields
    document.getElementById('ext_fullname').value = data.fullname || '';
    document.getElementById('ext_birthday').value = data.birthday || '';
    document.getElementById('ext_idcard').value = data.idcard || '';
    document.getElementById('ext_issue_date').value = data.issue_date || '';
    document.getElementById('ext_expiry_date').value = data.expiry_date || '';
    document.getElementById('ext_address').value = data.address || '';
    
    // Show results
    document.getElementById('extractedInfo').style.display = 'none';
    document.getElementById('extractedDetails').style.display = 'block';
}

function clearAll() {
    if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
        removeImage();
        currentExtractedData = null;
        document.getElementById('extractedDetails').style.display = 'none';
        document.getElementById('extractedInfo').style.display = 'block';
    }
}

function downloadData() {
    if (!currentExtractedData) return;
    
    const dataStr = JSON.stringify(currentExtractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'thong-tin-trich-xuat.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

function printData() {
    if (!currentExtractedData) return;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Thông tin trích xuất</title>');
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="container mt-4">');
    printWindow.document.write('<h2>Thông tin đã trích xuất</h2>');
    printWindow.document.write('<table class="table table-bordered mt-4">');
    printWindow.document.write('<tr><th>Họ và tên</th><td>' + currentExtractedData.fullname + '</td></tr>');
    printWindow.document.write('<tr><th>Ngày sinh</th><td>' + currentExtractedData.birthday + '</td></tr>');
    printWindow.document.write('<tr><th>Số CMND/CCCD</th><td>' + currentExtractedData.idcard + '</td></tr>');
    printWindow.document.write('<tr><th>Ngày cấp</th><td>' + currentExtractedData.issue_date + '</td></tr>');
    printWindow.document.write('<tr><th>Ngày hết hạn</th><td>' + currentExtractedData.expiry_date + '</td></tr>');
    printWindow.document.write('<tr><th>Địa chỉ</th><td>' + currentExtractedData.address + '</td></tr>');
    printWindow.document.write('</table>');
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}