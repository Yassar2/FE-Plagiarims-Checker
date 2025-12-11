document.getElementById("uploadBtn").addEventListener("click", async () => {
    const input = document.getElementById("fileInput");
    const file = input.files[0];

    if (!file) {
        alert("Upload file dulu");
        return;
    }

    // Validasi tipe file
    const allowedTypes = ['pdf','docx','txt'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
        alert("Format file tidak didukung (pdf, docx, txt)");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<p>Checking...</p>`; // Loading feedback

    try {
        const response = await fetch("https://be-plagiarism-checker-production.up.railway.app/predict", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Server error:", text);
            resultDiv.innerHTML = `<p class="text-danger">Server error: ${text}</p>`;
            return;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Expected JSON but got:", text);
            resultDiv.innerHTML = `<p class="text-danger">Server tidak mengembalikan data JSON.</p>`;
            return;
        }

        const data = await response.json();
        if (data.error) {
            resultDiv.innerHTML = `<p class="text-danger">${data.error}</p>`;
            return;
        }

        // Bersihkan hasil lama
        resultDiv.innerHTML = "";

        // Kalau hasilnya array
        if (Array.isArray(data) && data.length > 0) {
            data.forEach((item, index) => {
                resultDiv.innerHTML += `<div class="result-item mb-4 p-4 border rounded-lg"><h5>Hasil #${index+1}</h5><p><strong>ID:</strong> ${item.id || item.doc_id || '-'}</p><p><strong>Judul:</strong> ${item.title || '-'}</p><p><strong>Similarity:</strong> ${((item.score || item.similarity || 0) * 100).toFixed(2)}%</p><p><strong>Abstract:</strong> ${item.abstract || 'Tidak tersedia'}</p><p><strong>URL:</strong> <a href="${item.url || item.pdf || '#'}" target="_blank">${item.url || item.pdf || '-'}</a></p></div>`;
            });
        } else {
            resultDiv.innerHTML = `<p>Tidak ada hasil yang ditemukan.</p>`;
        }

    } catch (err) {
        console.error("Network error:", err);
        resultDiv.innerHTML = `<p class="text-danger">Gagal terhubung ke server: ${err.message}</p>`;
    }
});
