// 1. KONFIGURASI UTAMA
const API_URL = "https://script.google.com/macros/s/AKfycbx2AUz9RHxpCHMuIKWL9IfN9TlZ4QVv92x2uCvFxHbdorPwXMoalX0DakbauBXrKQhPag/exec";

let masterSiswa = [];
let masterBuku = [];

// DOM Elemen (Sirkulasi, Tamu, Dashboard)
const formPeminjaman = document.getElementById('formPeminjaman');
const inputSiswa = document.getElementById('inputSiswa');
const idSiswaField = document.getElementById('idSiswa');
const boxIdSiswa = document.getElementById('boxIdSiswa');
const kelasSiswaField = document.getElementById('kelasSiswa');
const boxKelasSiswa = document.getElementById('boxKelasSiswa');
const siswaSuggestions = document.getElementById('siswaSuggestions');
const inputBuku = document.getElementById('inputBuku');
const idBukuField = document.getElementById('idBuku');
const pengarangField = document.getElementById('pengarangBuku');
const stokTotalField = document.getElementById('stokTotal');
const groupStok = document.getElementById('groupStok');
const bukuSuggestions = document.getElementById('bukuSuggestions');
const btnSimpan = document.getElementById('btnSimpan');
const tabelPeminjaman = document.getElementById('tabelPeminjaman');
const formKunjungan = document.getElementById('formKunjungan');
const inputTamu = document.getElementById('inputTamu');
const idTamuField = document.getElementById('idTamu');
const boxIdTamu = document.getElementById('boxIdTamu');
const kelasTamuField = document.getElementById('kelasTamu');
const boxKelasTamu = document.getElementById('boxKelasTamu');
const tamuSuggestions = document.getElementById('tamuSuggestions');
const btnTamu = document.getElementById('btnTamu');
const boxTerlambat = document.getElementById('boxTerlambat');
const boxPopuler = document.getElementById('boxPopuler');
const leaderSiswa = document.getElementById('leaderSiswa');
const leaderKelas = document.getElementById('leaderKelas');
const modalKondisi = document.getElementById('modalKondisi');

let transaksiTerpilih = null;
let idBukuTerpilih = null;

// ==========================================
// 2. KELOLA DATA
// ==========================================
async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        masterSiswa = data.siswa || [];
        masterBuku = data.buku || [];
        renderTabelPeminjaman(data.log || []);
        hitungAnalitikDashboard(data.log || []);
    } catch (error) { console.error("Gagal sinkronisasi data:", error); }
}

// ==========================================
// 3. AUTOCOMPLETE ENGINE
// ==========================================
function setupAutocomplete(inputEl, suggestionEl, dataArray, onSelectCallback) {
    function jalankanPencarian() {
        const val = inputEl.value.toLowerCase().trim();
        suggestionEl.innerHTML = '';
        if (!val || dataArray.length === 0) { suggestionEl.style.display = 'none'; return; }
        
        const filtered = dataArray.filter(item => item[1] && String(item[1]).toLowerCase().includes(val));
        
        if (filtered.length === 0) { suggestionEl.style.display = 'none'; return; }
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.padding = '10px'; div.style.background = '#fff'; div.style.cursor = 'pointer'; div.style.border = '1px solid #ccc';
            div.innerText = item[1]; 
            div.onmousedown = function(e) { e.preventDefault(); onSelectCallback(item); suggestionEl.style.display = 'none'; };
            suggestionEl.appendChild(div);
        });
        suggestionEl.style.display = 'block';
    }

    inputEl.addEventListener('input', jalankanPencarian);
    inputEl.addEventListener('keyup', jalankanPencarian);
    inputEl.addEventListener('focus', jalankanPencarian);
    inputEl.addEventListener('blur', () => setTimeout(() => { suggestionEl.style.display = 'none'; }, 200));
}

// Inisialisasi AutoComplete
setupAutocomplete(inputSiswa, siswaSuggestions, masterSiswa, (s) => {
    inputSiswa.value = s[1]; idSiswaField.value = s[0]; boxIdSiswa.innerText = s[0];
    kelasSiswaField.value = s[2]; boxKelasSiswa.innerText = s[2];
});

setupAutocomplete(inputBuku, bukuSuggestions, masterBuku, (b) => {
    inputBuku.value = b[1]; idBukuField.value = b[0]; pengarangField.value = b[2];
    pengarangField.readOnly = true; groupStok.style.display = 'none';
});

setupAutocomplete(inputTamu, tamuSuggestions, masterSiswa, (s) => {
    inputTamu.value = s[1]; idTamuField.value = s[0]; boxIdTamu.innerText = s[0];
    kelasTamuField.value = s[2]; boxKelasTamu.innerText = s[2];
});

// ==========================================
// 4. POST EVENT HANDLING
// ==========================================
formPeminjaman.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!idSiswaField.value) { alert("⚠️ Pilihlah nama siswa!"); return; }
    const payload = { action: "simpanPeminjaman", id_siswa: idSiswaField.value, nama_siswa: inputSiswa.value, kelas: kelasSiswaField.value, id_buku: idBukuField.value, judul_buku: inputBuku.value, nama_pengarang: pengarangField.value };
    
    try {
        const respon = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const hasil = await respon.json();
        if (hasil.success) { formPeminjaman.reset(); await muatDataAwal(); } else { alert("Gagal: " + hasil.error); }
    } catch (e) { alert("Gangguan koneksi."); }
});

// [Fungsi-fungsi lain seperti renderTabelPeminjaman, hitungAnalitik, dll tetap di sini...]
// (Pastikan kamu menyalin fungsi sisanya dari file lama ke bawah sini dengan teliti)

muatDataAwal();
function renderTabelPeminjaman(logArray) {
    tabelPeminjaman.innerHTML = '';
    const bukuDipinjam = logArray.filter(row => row[9] === "Dipinjam");
    if (bukuDipinjam.length === 0) {
        tabelPeminjaman.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:30px;">Alhamdulillah, tidak ada tanggungan pinjaman hari ini. ✨</td></tr>`;
        return;
    }
    bukuDipinjam.forEach(row => {
        const tr = document.createElement('tr');
        let tglFormat = row[7] ? (row[7].includes("T") ? row[7].split("T")[0] : row[7]) : '-';
        tr.innerHTML = `
            <td><strong>${row[2]}</strong><br><small style="color:var(--text-muted);">ID: ${row[1]}</small></td>
            <td>Kelas ${row[3]}</td>
            <td><strong>${row[5]}</strong><br><small style="color:var(--text-muted);">Oleh: ${row[6]}</small></td>
            <td><span style="background:rgba(118,184,147,0.15); color:#4e8a67; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600;">${tglFormat}</span></td>
            <td style="text-align: center; white-space: nowrap;">
                <button class="btn-action btn-renew" onclick="bukaPerpanjang('${row[0]}')"><i class="fa-solid fa-clock"></i> Perpanjang</button>
                <button class="btn-action btn-return" onclick="bukaModalKembali('${row[0]}', '${row[4]}')"><i class="fa-solid fa-circle-check"></i> Kembali</button>
            </td>
        `;
        tabelPeminjaman.appendChild(tr);
    });
}

function bukaModalKembali(idTransaksi, idBuku) { transaksiTerpilih = idTransaksi; idBukuTerpilih = idBuku; modalKondisi.style.display = 'flex'; }
function tutupModal() { modalKondisi.style.display = 'none'; transaksiTerpilih = null; idBukuTerpilih = null; }

async function eksekusiKembali(kondisiBuku) {
    if (!transaksiTerpilih) return;
    const payload = { action: "kembalikanBuku", id_transaksi: transaksiTerpilih, id_buku: idBukuTerpilih, kondisi_buku: kondisiBuku };
    tutupModal();
    try {
        const respon = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const hasil = await respon.json();
        if (hasil.success) { await muatDataAwal(); } else { alert("Gagal: " + hasil.error); }
    } catch (e) { alert("Koneksi gagal."); }
}

async function bukaPerpanjang(idTransaksi) {
    if(!confirm("Perpanjang peminjaman buku 1 minggu lagi?")) return;
    try {
        const respon = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "perpanjangBuku", id_transaksi: idTransaksi }) });
        const hasil = await respon.json();
        if (hasil.success) { alert("Berhasil diperpanjang! 🗓️"); await muatDataAwal(); } else { alert("Gagal: " + hasil.error); }
    } catch (e) { alert("Koneksi bermasalah."); }
}

formKunjungan.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!idTamuField.value) { alert("⚠️ Pilihlah namamu dari rekomendasi dropdown!"); return; }
    const payload = { action: "simpanKunjungan", id_siswa: idTamuField.value, nama_siswa: inputTamu.value, kelas: kelasTamuField.value };
    
    try {
        btnTamu.disabled = true; btnTamu.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mencatat...`;
        const respon = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const hasil = await respon.json();
        if (hasil.success) {
            alert(`🎉 Absen sukses! Selamat membaca, ${inputTamu.value}.`);
            formKunjungan.reset(); idTamuField.value = ''; boxIdTamu.innerText = '-'; boxKelasTamu.innerText = '-';
            await muatDataAwal();
        } else { alert("Gagal: " + hasil.error); }
    } catch (e) { alert("Gagal mengirim data."); }
    finally { btnTamu.disabled = false; btnTamu.innerHTML = `<i class="fa-solid fa-circle-check"></i> Saya Hadir`; }
});

muatDataAwal();
