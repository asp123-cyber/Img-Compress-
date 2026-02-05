const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const editorSection = document.getElementById('editor-section');
const sizeSlider = document.getElementById('size-slider');
const targetVal = document.getElementById('target-val');

let originalImage = null;

// Trigger file input
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) handleImage(file);
};

function handleImage(file) {
    const reader = new FileReader();
    document.getElementById('original-size').innerText = (file.size / 1024).toFixed(2) + ' KB';
    
    reader.onload = (event) => {
        originalImage = new Image();
        originalImage.src = event.target.result;
        originalImage.onload = () => {
            document.getElementById('original-preview').src = originalImage.src;
            editorSection.style.display = 'block';
            compressImage();
        };
    };
    reader.readAsDataURL(file);
}

sizeSlider.oninput = (e) => {
    targetVal.innerText = e.target.value;
    compressImage();
};

async function compressImage() {
    const targetSizeKB = parseInt(sizeSlider.value);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0);

    let quality = 0.9;
    let compressedDataUrl = '';
    let currentSizeKB = Infinity;

    // Iterative compression to hit target size
    for (let i = 0; i < 10; i++) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        currentSizeKB = (compressedDataUrl.length * (3/4)) / 1024;

        if (currentSizeKB <= targetSizeKB) break;
        quality -= 0.15; // Reduce quality for next loop
    }

    document.getElementById('compressed-preview').src = compressedDataUrl;
    document.getElementById('compressed-size').innerText = currentSizeKB.toFixed(2) + ' KB';
    
    // Download logic
    document.getElementById('download-btn').onclick = () => {
        const link = document.createElement('a');
        link.download = `compressed_${targetSizeKB}kb.jpg`;
        link.href = compressedDataUrl;
        link.click();
    };
}