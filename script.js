// 1. KONFIGURASI
const API_URL = "https://script.google.com/macros/s/AKfycbx2AUz9RHxpCHMuIKWL9IfN9TlZ4QVv92x2uCvFxHbdorPwXMoalX0DakbauBXrKQhPag/exec";
let masterSiswa = [], masterBuku = [];

// 2. FUNGSI MUAT DATA
async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        masterSiswa = data.siswa || [];
        masterBuku = data.buku || [];
        inisialisasiSistem();
        renderTabelPeminjaman(data.log || []);
        hitungAnalitikDashboard(data.log || []);
    } catch (error) { console.error("Gagal load:", error); }
}

// 3. AUTOCOMPLETE ENGINE (Fitur Pencarian Nama/Buku)
function setupAutocomplete(inputEl, suggestionEl, dataArray, onSelectCallback) {
    function jalankanPencarian() {
        const val = inputEl.value.toLowerCase().trim();
        suggestionEl.innerHTML = '';
        if (!val) { suggestionEl.style.display = 'none'; return; }
        const filtered = dataArray.filter(i => i[1] && String(i[1]).toLowerCase().includes(val));
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.padding = '10px'; div.style.background = '#fff'; div.style.cursor = 'pointer'; div.style.border = '1px solid #ccc';
            div.innerText = item[1]; 
            div.onmousedown = (e) => { e.preventDefault(); onSelectCallback(item); suggestionEl.style.display = 'none'; };
            suggestionEl.appendChild(div);
        });
        suggestionEl.style.display = filtered.length ? 'block' : 'none';
    }
    inputEl.addEventListener('input', jalankanPencarian);
    inputEl.addEventListener('blur', () => setTimeout(() => { suggestionEl.style.display = 'none'; }, 200));
}

// 4. INISIALISASI FORM
function inisialisasiSistem() {
    setupAutocomplete(document.getElementById('inputSiswa'), document.getElementById('siswaSuggestions'), masterSiswa, (s) => { 
        document.getElementById('idSiswa').value = s[0]; document.getElementById('inputSiswa').value = s[1]; document.getElementById('boxIdSiswa').innerText = s[0];
    });
    setupAutocomplete(document.getElementById('inputBuku'), document.getElementById('bukuSuggestions'), masterBuku, (b) => { 
        document.getElementById('idBuku').value = b[0]; document.getElementById('inputBuku').value = b[1];
    });
    setupAutocomplete(document.getElementById('inputTamu'), document.getElementById('tamuSuggestions'), masterSiswa, (s) => { 
        document.getElementById('idTamu').value = s[0]; document.getElementById('inputTamu').value = s[1];
    });
}

// 5. RENDER DASHBOARD & TABEL
function hitungAnalitikDashboard(logs) {
    let hitungBuku = {}, hitungSiswa = {};
    logs.forEach(row => {
        if(row[9] === "Dipinjam") {
            hitungBuku[row[5]] = (hitungBuku[row[5]] || 0) + 1;
            hitungSiswa[`${row[2]}|${row[3]}`] = (hitungSiswa[`${row[2]}|${row[3]}`] || 0) + 1;
        }
    });
    const boxPopuler = document.getElementById('boxPopuler');
    if(boxPopuler) boxPopuler.innerHTML = Object.entries(hitungBuku).sort((a,b)=>b[1]-a[1]).slice(0,3).map(b => `<div class="populer-tag">${b[0]}</div>`).join('');
    
    const leaderSiswa = document.getElementById('leaderSiswa');
    if(leaderSiswa) leaderSiswa.innerHTML = Object.entries(hitungSiswa).sort((a,b)=>b[1]-a[1]).slice(0,5).map((s,i) => `<div>${i+1}. ${s[0].split('|')[0]} (${s[1]}x)</div>`).join('');
}

function renderTabelPeminjaman(logs) {
    const tabel = document.getElementById('tabelPeminjaman');
    if(!tabel) return;
    tabel.innerHTML = logs.filter(r => r[9] === "Dipinjam").map(r => `
        <tr><td>${r[2]}</td><td>${r[5]}</td>
        <td><button onclick="bukaPerpanjang('${r[0]}')">Perpanjang</button>
        <button onclick="bukaModalKembali('${r[0]}','${r[4]}')">Kembali</button></td></tr>
    `).join('');
}

// 6. FUNGSI POST (Submit Peminjaman, Kunjungan, dll)
async function kirimKeServer(payload) {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
    const hasil = await res.json();
    if(hasil.success) { alert("Berhasil!"); muatDataAwal(); } else { alert("Gagal: " + hasil.error); }
}

// 7. EVENT LISTENER UTAMA
document.getElementById('formPeminjaman').addEventListener('submit', (e) => {
    e.preventDefault();
    kirimKeServer({ action: "simpanPeminjaman", id_siswa: document.getElementById('idSiswa').value, id_buku: document.getElementById('idBuku').value });
});

// Jalankan
muatDataAwal();
