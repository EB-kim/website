// Set worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

// Function to create and add a text box
function addTextBox() {
    const textBox = document.createElement('div');
    textBox.className = 'editable-text';
    textBox.contentEditable = true;
    textBox.style.position = 'absolute';
    textBox.style.left = '50px';
    textBox.style.top = '50px';
    textBox.style.minWidth = '100px';
    textBox.style.minHeight = '20px';
    textBox.style.border = '1px solid black';
    textBox.style.padding = '5px';
    textBox.style.backgroundColor = 'white';
    textBox.style.zIndex = '1000';
    
    pdfContainer.appendChild(textBox);
    addedTextboxes.push(textBox);
    
    textBox.addEventListener('click', function(e) {
        e.stopPropagation();
        if (selectedTextBox) {
            selectedTextBox.classList.remove('selected');
        }
        selectedTextBox = textBox;
        selectedTextBox.classList.add('selected');
    });

    // Add resize handles
    addResizeHandles(textBox);
}

// Function to add resize handles to a text box
function addResizeHandles(textBox) {
    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    handles.forEach(handleClass => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${handleClass}`;
        textBox.appendChild(handle);
    });
}
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', function() {
    const pdfContainer = document.getElementById('pdf-viewer');
    const editSubheader = document.getElementById('edit-subheader');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const leftPanel = document.querySelector('.left-panel');
    const resizeHandle = document.getElementById('resize-handle');
    
    // Subheader controls
    const fontStyleSelect = document.getElementById('font-style');
    const fontSizeSelect = document.getElementById('font-size');
    const fontColorInput = document.getElementById('font-color');
    const addTextButton = document.getElementById('add-text');
    const removeTextButton = document.getElementById('remove-text');
    const downloadPdfButton = document.getElementById('download-pdf');

    let currentZoom = 1;
    let isResizing = false;
    let lastDownX = 0;
    let pdfDoc = null;
    let pdfBytes = null;
    let selectedTextBox = null;
    let addedTextboxes = [];

    // Event listeners
    resizeHandle.addEventListener('mousedown', initResize);
    removeTextButton.addEventListener('click', removeLastTextBox);
    downloadPdfButton.addEventListener('click', downloadModifiedPdf);
    fontColorInput.addEventListener('input', updateTextColor);
    addTextButton.addEventListener('click', addTextBox);

    function initResize(e) {
        isResizing = true;
        lastDownX = e.clientX;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        if (!isResizing) return;
        let newWidth = parseInt(getComputedStyle(leftPanel, null).width) + (e.clientX - lastDownX);
        leftPanel.style.width = newWidth + 'px';
        lastDownX = e.clientX;
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    function addTextBox() {
        const textBox = document.createElement('div');
        textBox.className = 'text-box';
        textBox.style.position = 'absolute';
        textBox.style.top = `${editSubheader.offsetHeight + 10}px`;
        textBox.style.left = '10px';
        textBox.style.cursor = 'move';
        textBox.style.border = '1px solid black';
        textBox.style.padding = '5px';
        textBox.style.backgroundColor = 'white';

        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.border = 'none';
        textarea.style.resize = 'none';
        textBox.appendChild(textarea);

        // Add resize handles
        const positions = ['nw', 'ne', 'sw', 'se'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.style.position = 'absolute';
            handle.style.width = '10px';
            handle.style.height = '10px';
            handle.style.background = 'rgba(0, 0, 255, 0.1)';
            handle.style.cursor = `${pos}-resize`;
            
            if (pos.includes('n')) handle.style.top = '-5px';
            if (pos.includes('s')) handle.style.bottom = '-5px';
            if (pos.includes('w')) handle.style.left = '-5px';
            if (pos.includes('e')) handle.style.right = '-5px';
            
            textBox.appendChild(handle);
        });

        pdfContainer.appendChild(textBox);
        addedTextboxes.push(textBox);

        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        textBox.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(document.defaultView.getComputedStyle(textBox).width, 10);
                startHeight = parseInt(document.defaultView.getComputedStyle(textBox).height, 10);
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            } else {
                isDragging = true;
                startX = e.clientX - textBox.offsetLeft;
                startY = e.clientY - textBox.offsetTop;
                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', stopDrag);
            }
        });

        function drag(e) {
            if (isDragging) {
                textBox.style.left = `${e.clientX - startX}px`;
                textBox.style.top = `${e.clientY - startY}px`;
            }
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }

        function resize(e) {
            if (isResizing) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (e.target.classList.contains('nw')) {
                    textBox.style.width = `${startWidth - dx}px`;
                    textBox.style.height = `${startHeight - dy}px`;
                    textBox.style.top = `${textBox.offsetTop + dy}px`;
                    textBox.style.left = `${textBox.offsetLeft + dx}px`;
                } else if (e.target.classList.contains('ne')) {
                    textBox.style.width = `${startWidth + dx}px`;
                    textBox.style.height = `${startHeight - dy}px`;
                    textBox.style.top = `${textBox.offsetTop + dy}px`;
                } else if (e.target.classList.contains('sw')) {
                    textBox.style.width = `${startWidth - dx}px`;
                    textBox.style.height = `${startHeight + dy}px`;
                    textBox.style.left = `${textBox.offsetLeft + dx}px`;
                } else if (e.target.classList.contains('se')) {
                    textBox.style.width = `${startWidth + dx}px`;
                    textBox.style.height = `${startHeight + dy}px`;
                }
            }
        }

        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }

    function removeLastTextBox() {
        if (addedTextboxes.length > 0) {
            const lastTextBox = addedTextboxes.pop();
            lastTextBox.remove();
        }
    }

    async function renderPDF() {
        const pdfData = sessionStorage.getItem('importedPDF');
        if (pdfData) {
            editSubheader.style.display = 'flex';
            pdfContainer.innerHTML = '';
            thumbnailsContainer.innerHTML = '';
            
            try {
                const arrayBuffer = base64ToArrayBuffer(pdfData.split(',')[1]);
                const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
                pdfDoc = await loadingTask.promise;
                
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    await renderThumbnail(pdfDoc, pageNum);
                    await renderPage(pdfDoc, pageNum);
                }
            } catch (error) {
                console.error('Error in renderPDF:', error);
                pdfContainer.textContent = 'Error loading PDF. Please try again.';
            }
        } else {
            editSubheader.style.display = 'none';
            pdfContainer.textContent = 'No PDF file loaded. Please upload a PDF file.';
        }
        
        sessionStorage.removeItem('newFileImported');
    }

    function base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        return bytes.map((byte, i) => binaryString.charCodeAt(i));
    }

    async function renderThumbnail(pdf, pageNum) {
        const page = await pdf.getPage(pageNum);
        const scale = 0.2;
        const viewport = page.getViewport({scale: scale});
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({canvasContext: context, viewport: viewport}).promise;

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'thumbnail';
        thumbnailDiv.dataset.pageNum = pageNum;
        
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.alt = `Page ${pageNum}`;
        
        thumbnailDiv.appendChild(img);
        thumbnailsContainer.appendChild(thumbnailDiv);

        thumbnailDiv.addEventListener('click', () => {
            const pageCanvas = pdfContainer.querySelector(`canvas[data-page-num="${pageNum}"]`);
            if (pageCanvas) {
                pageCanvas.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    async function renderPage(pdf, pageNum) {
        const page = await pdf.getPage(pageNum);
        const scale = 1;
        const viewport = page.getViewport({scale: scale});
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const containerWidth = pdfContainer.clientWidth;
        const scaleFactor = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({scale: scaleFactor});

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        canvas.dataset.pageNum = pageNum;
        pdfContainer.appendChild(canvas);

        await page.render({canvasContext: context, viewport: scaledViewport}).promise;
    }

    function updateActiveThumbnail(pageNum) {
        const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumb => {
            if (parseInt(thumb.dataset.pageNum) === pageNum) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    function updateTextColor() {
        if (selectedTextBox) {
            selectedTextBox.querySelector('textarea').style.color = this.value;
        }
    }

    async function downloadModifiedPdf() {
        if (!pdfDoc) {
            alert('No PDF loaded. Please load a PDF first.');
            return;
        }

        try {
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'modified_document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('An error occurred while downloading the PDF. Please try again.');
        }
    }

    // Render PDF on page load
    renderPDF();

    // Check for new file imports periodically
    setInterval(function() {
        if (sessionStorage.getItem('newFileImported') === 'true') {
            renderPDF();
        }
    }, 1000);

    // Add event listeners for page navigation
    document.querySelector('a[href="index.html"]').addEventListener('click', function(e) {
        sessionStorage.removeItem('importedPDF');
    });

    document.querySelector('a[href="convert.html"]').addEventListener('click', function(e) {
        sessionStorage.removeItem('importedPDF');
    });

    // Deselect textbox when clicking outside
    pdfContainer.addEventListener('click', function() {
        if (selectedTextBox) {
            selectedTextBox.style.border = '1px solid black';
            selectedTextBox = null;
        }
    });
});
