document.addEventListener('DOMContentLoaded', function() {
    const dragArea = document.querySelector('.drag-area');
    const chooseBtn = document.querySelector('#chooseFile');
    const fileInput = document.querySelector('#file-input');

    function handleFileImport(file) {
        if (file && file.name.toLowerCase().endsWith('.pdf')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const pdfData = e.target.result;
                sessionStorage.setItem('importedPDF', pdfData);
                sessionStorage.setItem('newFileImported', 'true');
                console.log('New PDF data stored in sessionStorage, length:', pdfData.length);
                console.log('First 100 characters of PDF data:', pdfData.substring(0, 100));
                // Redirect to edit page
                window.location.href = 'edit.html';
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid PDF file.');
        }
    }
  


    // Adjust layout if necessary
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
    }

    if (chooseBtn && fileInput) {
        chooseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFileImport(file);
        });
    }

    if (dragArea) {
        dragArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragArea.classList.add('active');
        });

        dragArea.addEventListener('dragleave', () => {
            dragArea.classList.remove('active');
        });

        dragArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragArea.classList.remove('active');
            const file = e.dataTransfer.files[0];
            handleFileImport(file);
        });
    }
});

