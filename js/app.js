document.getElementById("uploadBtn").addEventListener("click", async () => {
    const input = document.getElementById("fileInput");
    const file = input.files[0];

    if (!file) {
        alert("Upload file dulu");
        return;
    }

    let formData = new FormData();
    formData.append("file", file);

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "<p>Checking...</p>";

    const response = await fetch("https://be-plagiarism-checker-production.up.railway.app/predict", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (data.error) {
        resultDiv.innerHTML = `<p class="text-danger">${data.error}</p>`;
        return;
    }

    // Kalau hasilnya array (backend return list)
    const item = data[0];

    resultDiv.innerHTML = `
        <h5>Hasil:</h5>
        <p><strong>ID:</strong> ${item.id || item.doc_id}</p>
        <p><strong>Judul:</strong> ${item.title}</p>
        <p><strong>Similarity:</strong> ${(item.score * 100).toFixed(2)}%</p>
        <p><strong>Abstract:</strong> ${item.abstract}</p>
    `;
});
