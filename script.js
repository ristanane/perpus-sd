// 1. KONFIGURASI UTAMA
const API_URL = "https://script.google.com/macros/s/AKfycbx2AUz9RHxpCHMuIKWL9IfN9TlZ4QVv92x2uCvFxHbdorPwXMoalX0DakbauBXrKQhPag/exec";
let masterSiswa = [], masterBuku = [];

// DOM Elements
const inputSiswa = document.getElementById('inputSiswa'), siswaSuggestions = document.getElementById('siswaSuggestions');
const inputBuku = document.getElementById('inputBuku'), bukuSuggestions = document.getElementById('bukuSuggestions');
const inputTamu = document.getElementById('inputTamu'), tamuSuggestions = document.getElementById('tamuSuggestions');

// 2. FUNGSI LOAD DATA (Koneksi ke Apps Script)
async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        masterSiswa = data.siswa || [];
        masterBuku = data.buku || [];
        // Memanggil fungsi render yang akan kita buat di Part 2
        if (typeof renderTabelPeminjaman === 'function') renderTabelPeminjaman(data.log || []);
        if (typeof hitungAnalitikDashboard === 'function') hitungAnalitikDashboard(data.log || []);
    } catch (e) { console.error("Error load data:", e); }
}

// 3. MESIN AUTOCOMPLETE (Dibuat se-kebal mungkin)
function setupAutocomplete(inputEl, suggestionEl, dataArray, onSelectCallback) {
    inputEl.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        suggestionEl.innerHTML = '';
        if (!val || dataArray.length === 0) { suggestionEl.style.display = 'none'; return; }
        
        const filtered = dataArray.filter(i => i[1] && String(i[1]).toLowerCase().includes(val));
        if (filtered.length === 0) { suggestionEl.style.display = 'none'; return; }
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.padding = '10px'; div.style.background = '#fff'; div.style.cursor = 'pointer'; div.style.borderBottom = '1px solid #ccc';
            div.innerText = item[1];
            div.onmousedown = (e) => { e.preventDefault(); onSelectCallback(item); suggestionEl.style.display = 'none'; };
            suggestionEl.appendChild(div);
        });
        suggestionEl.style.display = 'block';
    });
}

// Inisialisasi Event
muatDataAwal();
setupAutocomplete(inputSiswa, siswaSuggestions, masterSiswa, (s) => { 
    inputSiswa.value = s[1]; document.getElementById('idSiswa').value = s[0]; document.getElementById('kelasSiswa').value = s[2]; 
});
setupAutocomplete(inputBuku, bukuSuggestions, masterBuku, (b) => { 
    inputBuku.value = b[1]; document.getElementById('idBuku').value = b[0]; document.getElementById('pengarangBuku').value = b[2]; 
});
setupAutocomplete(inputTamu, tamuSuggestions, masterSiswa, (s) => { 
    inputTamu.value = s[1]; document.getElementById('idTamu').value = s[0]; document.getElementById('kelasTamu').value = s[2]; 
});

// 5. FUNGSI RENDER TABEL & DASHBOARD
function renderTabelPeminjaman(logs) {
    const tabel = document.getElementById('tabelPeminjaman');
    if (!tabel) return;
    tabel.innerHTML = '';
    logs.filter(r => r[9] === "Dipinjam").forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r[2]}</td><td>${r[5]}</td>
            <td><button onclick="bukaPerpanjang('${r[0]}')">Perpanjang</button>
            <button onclick="bukaModalKembali('${r[0]}', '${r[4]}')">Kembali</button></td>`;
        tabel.appendChild(tr);
    });
}

function hitungAnalitikDashboard(logs) {
    let hitungBuku = {};
    logs.forEach(r => { if(r[9] === "Dipinjam") hitungBuku[r[5]] = (hitungBuku[r[5]] || 0) + 1; });
    const boxPopuler = document.getElementById('boxPopuler');
    if(boxPopuler) boxPopuler.innerHTML = Object.entries(hitungBuku).sort((a,b)=>b[1]-a[1]).slice(0,3).map(b => `<div class="populer-tag">${b[0]} (${b[1]}x)</div>`).join('');
}

// 6. EVENT SUBMIT (Form Peminjaman & Buku Tamu)
document.getElementById('formPeminjaman').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { 
        action: "simpanPeminjaman", 
        id_siswa: document.getElementById('idSiswa').value, 
        nama_siswa: inputSiswa.value, 
        kelas: document.getElementById('kelasSiswa').value, 
        id_buku: document.getElementById('idBuku').value, 
        judul_buku: inputBuku.value, 
        nama_pengarang: document.getElementById('pengarangBuku').value 
    };
    await kirimKeServer(payload);
});

// 7. FUNGSI AKSI (Perpanjang & Kembali)
async function bukaPerpanjang(id) {
    if(confirm("Perpanjang buku ini?")) await kirimKeServer({ action: "perpanjangBuku", id_transaksi: id });
}

function bukaModalKembali(idTransaksi, idBuku) {
    // Sesuaikan ID elemen modal km di sini
    const modal = document.getElementById('modalKondisi');
    if(modal) {
        modal.style.display = 'flex';
        modal.dataset.transaksi = idTransaksi;
        modal.dataset.buku = idBuku;
    }
}

async function kirimKeServer(payload) {
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const hasil = await res.json();
        if(hasil.success) { alert("Sukses!"); muatDataAwal(); }
        else { alert("Gagal: " + hasil.error); }
    } catch (e) { alert("Koneksi gagal."); }
}
