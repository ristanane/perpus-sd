const API_URL = "https://script.google.com/macros/s/AKfycbx2AUz9RHxpCHMuIKWL9IfN9TlZ4QVv92x2uCvFxHbdorPwXMoalX0DakbauBXrKQhPag/exec";
let masterSiswa = [];
let masterBuku = [];

// 1. FUNGSI MUAT DATA
async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        masterSiswa = data.siswa || [];
        masterBuku = data.buku || [];
        renderTabelPeminjaman(data.log || []);
    } catch (err) { console.error(err); }
}

// 2. FUNGSI AUTOCOMPLETE (Yang sudah jalan tadi)
function setupAutocomplete(inputEl, suggestionEl, dataArray, onSelectCallback) {
    inputEl.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        suggestionEl.innerHTML = '';
        if (!val || dataArray.length === 0) { suggestionEl.style.display = 'none'; return; }
        const filtered = dataArray.filter(item => item[1] && String(item[1]).toLowerCase().includes(val));
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.padding = '10px'; div.style.background = '#fff'; div.style.cursor = 'pointer';
            div.innerText = item[1]; 
            div.onmousedown = function() { onSelectCallback(item); suggestionEl.style.display = 'none'; };
            suggestionEl.appendChild(div);
        });
        suggestionEl.style.display = 'block';
    });
}

// 3. FUNGSI SIMPAN PEMINJAMAN (Ini yg tadi hilang!)
document.getElementById('formPeminjaman').addEventListener('submit', async function(e) {
    e.preventDefault();
    const payload = {
        action: "simpanPeminjaman",
        id_siswa: document.getElementById('idSiswa').value,
        nama_siswa: document.getElementById('inputSiswa').value,
        kelas: document.getElementById('kelasSiswa').value,
        judul_buku: document.getElementById('inputBuku').value,
        nama_pengarang: document.getElementById('pengarangBuku').value
    };
    
    try {
        const respon = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const hasil = await respon.json();
        if (hasil.success) {
            alert("Data peminjaman berhasil masuk!");
            muatDataAwal();
            document.getElementById('formPeminjaman').reset();
        }
    } catch (err) { alert("Gagal simpan: " + err); }
});

// Jalankan
muatDataAwal().then(() => {
    setupAutocomplete(document.getElementById('inputSiswa'), document.getElementById('siswaSuggestions'), masterSiswa, (s) => {
        document.getElementById('inputSiswa').value = s[1];
        document.getElementById('idSiswa').value = s[0];
        document.getElementById('kelasSiswa').value = s[2];
    });
});
