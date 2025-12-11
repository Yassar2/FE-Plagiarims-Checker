// Elemen DOM
const fileInput = document.getElementById("fileInput");
const textInput = document.getElementById("textInput");
const uploadBtn = document.getElementById("uploadBtn");
const checkBtn = document.getElementById("checkBtn");
const resultDiv = document.getElementById("result");

// State
let isChecking = false;

// Utility: escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Highlight teks mirip
function highlightText(inputText, result) {
    if (!inputText || !result) return inputText;

    const abstract = result.abstract || '';
    const tokens = abstract.split(/\s+/).slice(0, 20); // ambil kata penting
    if (!tokens.length) return inputText;

    const escapedTokens = tokens
        .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .filter(t => t.length > 2);
    if (!escapedTokens.length) return inputText;

    const pattern = new RegExp(`\\b(${escapedTokens.join('|')})\\b`, 'gi');

    return inputText.replace(pattern, match => {
        if ((result.lexical || 0) >= 0.85) return `<span class="highlight-red">${match}</span>`;
        if ((result.structure || 0) >= 0.6) return `<span class="highlight-yellow">${match}</span>`;
        if ((result.semantic || 0) >= 0.6) return `<span class="highlight-blue">${match}</span>`;
        return match;
    });
}

// Check plagiarism
async function checkPlagiarism() {
    if (isChecking) return;
    isChecking = true;
    checkBtn.textContent = "Memeriksa...";
    checkBtn.disabled = true;

    const formData = new FormData();
    let inputText = textInput.value.trim();

    if (fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
    } else if (inputText) {
        formData.append("query", inputText);
    } else {
        alert("Masukkan teks atau upload file.");
        checkBtn.textContent = "Cek Plagiarisme";
        checkBtn.disabled = false;
        isChecking = false;
        return;
    }

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

        const data = await response.json();
        if (data.error) {
            resultDiv.innerHTML = `<p class="text-danger">${data.error}</p>`;
            return;
        }

        // Tampilkan hasil
        resultDiv.innerHTML = '';
        if (Array.isArray(data) && data.length > 0) {
            data.forEach((item, idx) => {
                const highlightedText = inputText ? highlightText(inputText, item) : '';
                resultDiv.innerHTML += `
                    <div class="result-item mb-4 p-4 border rounded-lg">
                        <h5>Hasil #${idx+1}</h5>
                        <p><strong>ID:</strong> ${item.id || item.doc_id || '-'}</p>
                        <p><strong>Judul:</strong> ${escapeHtml(item.title) || '-'}</p>
                        <p><strong>Similarity:</strong> ${((item.score || item.similarity || 0)*100).toFixed(2)}%</p>
                        <p><strong>Abstract:</strong> ${escapeHtml(item.abstract) || 'Tidak tersedia'}</p>
                        <p><strong>URL:</strong> <a href="${item.url || item.pdf || '#'}" target="_blank">${item.url || item.pdf || '-'}</a></p>
                        ${highlightedText ? `<div class="mt-2"><strong>Highlighted Input:</strong><div>${highlightedText}</div></div>` : ''}
                    </div>
                `;
            });
        } else {
            resultDiv.innerHTML = `<p>Tidak ada hasil yang ditemukan.</p>`;
        }

    } catch (err) {
        console.error("Network error:", err);
        resultDiv.innerHTML = `<p class="text-danger">Gagal terhubung ke server: ${err.message}</p>`;
    } finally {
        checkBtn.textContent = "Cek Plagiarisme";
        checkBtn.disabled = false;
        isChecking = false;
    }
}

// Event listener
uploadBtn.addEventListener("click", checkPlagiarism);
checkBtn.addEventListener("click", checkPlagiarism);
