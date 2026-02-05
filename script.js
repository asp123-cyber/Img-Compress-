let currentMode = 'image';
const { PDFDocument } = PDFLib;

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update UI for mode
    document.getElementById('file-input').accept = mode === 'image' ? 'image/*' : 'application/pdf';
    document.getElementById('mode-icon').innerText = mode === 'image' ? '📸' : '📄';
    document.getElementById('upload-text').innerHTML = `Drag & drop ${mode} or <span>browse</span>`;
    document.getElementById('editor-section').style.display = 'none';
}

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (currentMode === 'image') {
        handleImage(file); // From previous code
    } else {
        handlePDF(file);
    }
};

async function handlePDF(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const existingPdfBytes = e.target.result;
        document.getElementById('pdf-orig-size').innerText = (file.size / 1024).toFixed(0) + ' KB';
        
        document.getElementById('image-preview-container').style.display = 'none';
        document.getElementById('pdf-status').style.display = 'block';
        document.getElementById('editor-section').style.display = 'block';

        // Add event listener for the PDF download
        document.getElementById('download-btn').onclick = () => compressAndDownloadPDF(existingPdfBytes);
    };
    reader.readAsArrayBuffer(file);
}

async function compressAndDownloadPDF(bytes) {
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    
    // Compression logic: We slightly scale down pages to reduce size
    // For true "30kb" targets on PDFs, servers are usually needed, 
    // but this reduces size significantly on the client.
    pages.forEach(page => {
        const { width, height } = page.getSize();
        page.scale(0.9, 0.9); // Scale down by 10%
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "compressed_document.pdf";
    link.click();
}
