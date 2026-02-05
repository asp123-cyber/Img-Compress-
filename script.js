/**
 * SwiftCompress - Final Optimized Logic
 * Features: Debounced processing, iterative JPEG compression, 
 * dimension scaling, and PDF optimization.
 */

// 1. Elements & State
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const imgTab = document.getElementById('img-tab');
const pdfTab = document.getElementById('pdf-tab');
const editorSection = document.getElementById('editor-section');
const imgContainer = document.getElementById('image-preview-container');
const pdfCard = document.getElementById('pdf-status-card');
const sizeSlider = document.getElementById('size-slider');
const targetValDisplay = document.getElementById('target-val');
const downloadBtn = document.getElementById('download-btn');
const compressedSizeBadge = document.getElementById('compressed-size');

let currentMode = 'image';
let originalFileData = null; 
let debounceTimer;

// 2. Tab Management
imgTab.onclick = () => {
    currentMode = 'image';
    imgTab.classList.add('active');
    pdfTab.classList.remove('active');
    fileInput.accept = "image/*";
    document.getElementById('mode-icon').innerText = "📸";
    editorSection.style.display = 'none';
};

pdfTab.onclick = () => {
    currentMode = 'pdf';
    pdfTab.classList.add('active');
    imgTab.classList.remove('active');
    fileInput.accept = "application/pdf";
    document.getElementById('mode-icon').innerText = "📄";
    editorSection.style.display = 'none';
};

// 3. File Handling
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    editorSection.style.display = 'block';
    
    if (currentMode === 'image') {
        handleImage(file);
    } else {
        handlePDF(file);
    }
};

function handleImage(file) {
    const reader = new FileReader();
    compressedSizeBadge.innerText = "Processing...";
    
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            originalFileData = img;
            document.getElementById('original-preview').src = img.src;
            document.getElementById('original-size').innerText = (file.size / 1024).toFixed(1) + " KB";
            
            imgContainer.style.display = 'grid';
            pdfCard.style.display = 'none';
            compressImage(); // Initial run
        };
    };
    reader.readAsDataURL(file);
}

// 4. Slider Control (With Debounce to prevent lag)
sizeSlider.oninput = () => {
    const targetKB = sizeSlider.value;
    targetValDisplay.innerText = targetKB;
    
    if (currentMode === 'image' && originalFileData) {
        compressedSizeBadge.innerText = "Calculating...";
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            compressImage();
        }, 300); // 300ms delay ensures smooth sliding
    }
};

// 5. THE CORE COMPRESSION ENGINE
async function compressImage() {
    if (!originalFileData) return;
    
    const targetKB = parseInt(sizeSlider.value);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let width = originalFileData.width;
    let height = originalFileData.height;
    
    let quality = 0.9;
    let dataUrl = "";
    let finalSizeKB = 0;

    /**
     * ITERATIVE LOGIC:
     * 1. Try reducing quality first.
     * 2. If still too big, start reducing dimensions (width/height).
     * 3. Always output as image/jpeg to ensure compression works.
     */
    for (let i = 0; i < 8; i++) {
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(originalFileData, 0, 0, width, height);

        // Force convert to JPEG for high compression ratio
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        finalSizeKB = (dataUrl.length * 0.75) / 1024;

        if (finalSizeKB <= targetKB) {
            break; // We hit the goal!
        } else {
            // If way over target, drop quality fast
            if (quality > 0.4) {
                quality -= 0.15;
            } else {
                // If quality is already low, we must shrink the image
                width *= 0.85;
                height *= 0.85;
            }
        }
    }

    // Update View
    document.getElementById('compressed-preview').src = dataUrl;
    compressedSizeBadge.innerText = finalSizeKB.toFixed(1) + " KB";
    compressedSizeBadge.className = finalSizeKB <= targetKB ? "badge success" : "badge";

    // Set Download Action
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.download = `swift-optimized-${targetKB}kb.jpg`;
        link.href = dataUrl;
        link.click();
    };
}

// 6. PDF COMPRESSION LOGIC
async function handlePDF(file) {
    document.getElementById('pdf-name').innerText = file.name;
    document.getElementById('pdf-orig-size').innerText = (file.size / 1024).toFixed(1) + " KB";
    
    imgContainer.style.display = 'none';
    pdfCard.style.display = 'block';

    const arrayBuffer = await file.arrayBuffer();
    
    downloadBtn.onclick = async () => {
        const originalText = downloadBtn.innerText;
        downloadBtn.innerText = "Compressing PDF...";
        
        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            
            // Client-side PDF compression is done by scaling page dimensions
            const pages = pdfDoc.getPages();
            pages.forEach(p => p.scale(0.75, 0.75)); 

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = "compressed_document.pdf";
            link.click();
        } catch (err) {
            alert("Error processing PDF. Ensure the file is not password protected.");
        } finally {
            downloadBtn.innerText = originalText;
        }
    };
}
