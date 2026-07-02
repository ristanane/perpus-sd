const API_URL = "https://script.google.com/macros/s/AKfycbx2AUz9RHxpCHMuIKWL9IfN9TlZ4QVv92x2uCvFxHbdorPwXMoalX0DakbauBXrKQhPag/exec";
let masterSiswa = [];

async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        masterSiswa = data.siswa || [];
        console.log("Data berhasil dimuat:", masterSiswa);
    } catch (err) { console.error(err); }
}

function setupAutocomplete(inputEl, suggestionEl, dataArray, onSelectCallback) {
    inputEl.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        suggestionEl.innerHTML = '';
        if (!val || dataArray.length === 0) { suggestionEl.style.display = 'none'; return; }
        
        // Ganti baris 'const filtered = ...' dengan yang ini:
const filtered = dataArray.filter(item => {
    // Kita paksakan keduanya (data sheets dan input) menjadi huruf kecil sebelum dibandingkan
    const namaSiswa = item[1] ? String(item[1]).toLowerCase() : "";
    return namaSiswa.includes(val.toLowerCase()); // Pastikan val juga di-toLowerCase
});
        
        if (filtered.length === 0) { suggestionEl.style.display = 'none'; return; }
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.padding = '10px';
            div.style.background = '#fff';
            div.style.cursor = 'pointer';
            div.style.borderBottom = '1px solid #eee';
            div.innerText = item[1]; 
            div.onmousedown = function() {
                onSelectCallback(item);
                suggestionEl.style.display = 'none';
            };
            suggestionEl.appendChild(div);
        });
        suggestionEl.style.display = 'block';
    });
}

// Inisialisasi
muatDataAwal().then(() => {
    setupAutocomplete(document.getElementById('inputSiswa'), document.getElementById('siswaSuggestions'), masterSiswa, (s) => {
        document.getElementById('inputSiswa').value = s[1];
        document.getElementById('idSiswa').value = s[0];
        document.getElementById('boxIdSiswa').innerText = s[0];
        document.getElementById('kelasSiswa').value = s[2];
        document.getElementById('boxKelasSiswa').innerText = s[2];
    });
});
