const form = document.getElementById('file-upload-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    

    // Send the file to the backend using a fetch or XMLHttpRequest.
    // You can use POST or other appropriate HTTP method.
    // If you use fetch, use the following code:
    fetch('/upload', {
        method: 'POST',
        body: formData
    }).then((response) => {
        console.log(response)
        // Do something with the response
        alert('File uploaded successfully.');
    });
});
