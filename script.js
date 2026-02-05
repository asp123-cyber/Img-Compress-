// 1. Elements
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const imgTab = document.getElementById('img-tab');
const pdfTab = document.getElementById('pdf-tab');
const editorSection = document.getElementById('editor-section');
const imgContainer = document.getElementById('image-preview-container');
const pdfCard = document.getElementById('pdf-status-card');

let currentMode = 'image'; // State: 'image' or 'pdf'
let originalFileData = null;

// 2. Tab Switching Logic
imgTab.onclick = () => {
    currentMode = 'image';
    imgTab.classList.add('active');
    pdfTab.classList.remove('active');
    fileInput.accept = "image/*";
    document.getElementById('mode-icon').innerText = "📸";
    document.getElementById('upload-text').innerHTML = "Drag & drop image or <span>browse</span>";
    editorSection.style.display = 'none';
};

pdfTab.onclick = () => {
    currentMode = 'pdf';
    pdfTab.classList.add('active');
    imgTab.classList.remove('active');
    fileInput.accept = "application/pdf";
    document.getElementById('mode-icon').innerText = "📄";
    document.getElementById('upload-text').innerHTML = "Drag & drop PDF or <span>browse</span>";
    editorSection.style.display = 'none';
};

// 3. File Upload Trigger
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (currentMode === 'image') {
        handleImage(file);
    } else {
        handlePDF(file);
    }
};

// 4. IMAGE LOGIC
function handleImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            originalFileData = img;
            document.getElementById('original-preview').src = img.src;
            document.getElementById('original-size').innerText = (file.size / 1024).toFixed(1) + " KB";
            
            imgContainer.style.display = 'grid';
            pdfCard.style.display = 'none';
            editorSection.style.display = 'block';
            compressImage(); // Initial compression
        };
    };
    reader.readAsDataURL(file);
}

// Image compression function (uses Canvas)
async function compressImage() {
    const targetKB = document.getElementById('size-slider').value;
    document.getElementById('target-val').innerText = targetKB;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalFileData.width;
    canvas.height = originalFileData.height;
    ctx.drawImage(originalFileData, 0, 0);

    let quality = 0.9;
    let dataUrl;
    let size = 0;

    // Binary search-like loop to hit target size
    for(let i=0; i<8; i++) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        size = (dataUrl.length * 3/4) / 1024;
        if (size <= targetKB) break;
        quality -= 0.15;
    }

    document.getElementById('compressed-preview').src = dataUrl;
    document.getElementById('compressed-size').innerText = size.toFixed(1) + " KB";
    
    document.getElementById('download-btn').onclick = () => {
        const link = document.createElement('a');
        link.download = "optimized-image.jpg";
        link.href = dataUrl;
        link.click();
    };
}

// 5. PDF LOGIC
async function handlePDF(file) {
    document.getElementById('pdf-name').innerText = file.name;
    document.getElementById('pdf-orig-size').innerText = (file.size / 1024).toFixed(1) + " KB";
    
    imgContainer.style.display = 'none';
    pdfCard.style.display = 'block';
    editorSection.style.display = 'block';

    const arrayBuffer = await file.arrayBuffer();
    
    document.getElementById('download-btn').onclick = async () => {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // PDF "Compression" - Scaling pages down reduces size
        const pages = pdfDoc.getPages();
        pages.forEach(p => p.scale(0.8, 0.8)); 

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "compressed.pdf";
        link.click();
    };
}

// Update image compression when slider moves
document.getElementById('size-slider').oninput = () => {
    if(currentMode === 'image') compressImage();
};
