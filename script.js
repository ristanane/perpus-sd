// 1. KONFIGURASI UTAMA
const API_URL = "https://script.google.com/macros/s/AKfycbx2AUz9RHxpCHMuIKWL9IfN9TlZ4QVv92x2uCvFxHbdorPwXMoalX0DakbauBXrKQhPag/exec";

let masterSiswa = [];
let masterBuku = [];

// DOM Elemen Sirkulasi
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

// DOM Elemen Buku Tamu
const formKunjungan = document.getElementById('formKunjungan');
const inputTamu = document.getElementById('inputTamu');
const idTamuField = document.getElementById('idTamu');
const boxIdTamu = document.getElementById('boxIdTamu');
const kelasTamuField = document.getElementById('kelasTamu');
const boxKelasTamu = document.getElementById('boxKelasTamu');
const tamuSuggestions = document.getElementById('tamuSuggestions');
const btnTamu = document.getElementById('btnTamu');

// DOM Dashboard & Leaderboard
const boxTerlambat = document.getElementById('boxTerlambat');
const boxPopuler = document.getElementById('boxPopuler');
const leaderSiswa = document.getElementById('leaderSiswa');
const leaderKelas = document.getElementById('leaderKelas');
const modalKondisi = document.getElementById('modalKondisi');

let transaksiTerpilih = null;
let idBukuTerpilih = null;

// ==========================================
// 2. KELOLA DATA & COMPUTE ANALYTICS (DASHBOARD & RANK)
// ==========================================
async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        
        masterSiswa = data.siswa || [];
        masterBuku = data.buku || [];
        
        // --- KODE CEK OTOMATIS (Bisa kamu hapus nanti kalau sudah normal) ---
        alert("Jumlah data siswa yang berhasil ditarik: " + masterSiswa.length);
        console.log("Isi data siswa dari Sheets:", masterSiswa);
        // ------------------------------------------------------------------
        
        renderTabelPeminjaman(data.log || []);
        hitungAnalitikDashboard(data.log || []);
    } catch (error) {
        console.error("Gagal sinkronisasi data:", error);
    }
}
function hitungAnalitikDashboard(logs) {
    const hariIni = new Date();
    let htmlTerlambat = '';
    let hitungBuku = {};
    let hitungSiswa = {};
    let hitungKelas = {};

    logs.forEach(row => {
        // A. Hitung Pengingat Terlambat (> 7 Hari)
        if (row[9] === "Dipinjam" && row[7]) {
            let tglPinjam = new Date(row[7].includes("T") ? row[7].split("T")[0] : row[7]);
            let selisihHari = Math.floor((hariIni - tglPinjam) / (1000 * 60 * 60 * 24));
            
            if (selisihHari > 7) {
                htmlTerlambat += `<div class="alert-item">
                    <span><strong>${row[2]}</strong> (Kl. ${row[3]}) - Telat ${selisihHari} hari</span>
                    <span style="color:var(--accent-red); font-weight:700;"><i class="fa-solid fa-circle-exclamation"></i> ${row[5]}</span>
                </div>`;
            }
        }

        // B. Hitung Frekuensi untuk Buku Terpopuler & Leaderboard
        if (row[5]) { // Judul Buku
            hitungBuku[row[5]] = (hitungBuku[row[5]] || 0) + 1;
        }
        if (row[2] && row[1]) { // Nama Siswa + ID
            const keySiswa = `${row[2]}|${row[1]}|${row[3]}`;
            hitungSiswa[keySiswa] = (hitungSiswa[keySiswa] || 0) + 1;
        }
        if (row[3]) { // Kelas
            hitungKelas[row[3]] = (hitungKelas[row[3]] || 0) + 1;
        }
    });

    // Render Widget Terlambat
    boxTerlambat.innerHTML = htmlTerlambat || `<p style="color:var(--primary-green); font-size:13px; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Luar biasa! Semua buku dikembalikan tepat waktu minggu ini.</p>`;

    // Render Widget Buku Populer (Top 3)
    const sortedBuku = Object.entries(hitungBuku).sort((a,b) => b[1] - a[1]).slice(0, 3);
    boxPopuler.innerHTML = '';
    if(sortedBuku.length === 0) boxPopuler.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">Belum ada tren buku terdeteksi.</p>`;
    sortedBuku.forEach(b => {
        boxPopuler.innerHTML += `<div class="populer-tag"><i class="fa-solid fa-fire"></i> ${b[0]} (${b[1]}x)</div>`;
    });

    // Render Papan Peringkat Siswa (Top 5 Calon Raja/Ratu Buku)
    const sortedSiswa = Object.entries(hitungSiswa).sort((a,b) => b[1] - a[1]).slice(0, 5);
    leaderSiswa.innerHTML = '';
    if (sortedSiswa.length === 0) leaderSiswa.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Belum ada data kompetisi.</td></tr>`;
    sortedSiswa.forEach((s, index) => {
        const [nama, id, kelas] = s[0].split('|');
        const rankClass = index < 3 ? `rank-${index+1}` : '';
        leaderSiswa.innerHTML += `<tr>
            <td><span class="rank-number ${rankClass}">${index+1}</span></td>
            <td><strong>${nama}</strong><br><small style="color:var(--text-muted);">ID: ${id}</small></td>
            <td>Kelas ${kelas}</td>
            <td style="text-align:right; font-weight:700; color:var(--primary-green);">${s[1]} Buku</td>
        </tr>`;
    });

    // Render Papan Peringkat Keaktifan Kelas
    const sortedKelas = Object.entries(hitungKelas).sort((a,b) => b[1] - a[1]);
    leaderKelas.innerHTML = '';
    if (sortedKelas.length === 0) leaderKelas.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Belum ada data keaktifan.</td></tr>`;
    sortedKelas.forEach((k, index) => {
        const rankClass = index < 3 ? `rank-${index+1}` : '';
        leaderKelas.innerHTML += `<tr>
            <td><span class="rank-number ${rankClass}">${index+1}</span></td>
            <td><strong>Kelas ${k[0]}</strong></td>
            <td style="text-align:right; font-weight:700; color:var(--accent-blue);">${k[1]} Kali Pinjam</td>
        </tr>`;
    });
}

// ==========================================
// 3. AUTOCOMPLETE ENGINE (VERSI AMAN DARI FORMAT ANEH)
// ==========================================
function setupAutocomplete(inputEl, suggestionEl, dataArray, onSelectCallback) {
    inputEl.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        suggestionEl.innerHTML = '';
        
        if (!val || !dataArray || dataArray.length === 0) { 
            suggestionEl.style.display = 'none'; 
            return; 
        }
        
        // Memfilter data dengan proteksi ekstra jika ada baris kosong atau eror di Sheets
        const filtered = dataArray.filter(item => {
            if (!item || !item[1]) return false; // Lewati jika baris atau namanya kosong
            const namaSiswa = String(item[1]).toLowerCase().trim();
            return namaSiswa.includes(val);
        });
        
        if (filtered.length === 0) { 
            suggestionEl.style.display = 'none'; 
            return; 
        }
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.padding = '12px 16px';
            div.style.cursor = 'pointer';
            div.style.borderBottom = '1px solid var(--border-color)';
            div.innerHTML = `<strong>${item[1]}</strong> <small style="color:var(--text-muted);">(${item[0]} - Kl. ${item[2]})</small>`;
            
            div.addEventListener('click', () => {
                onSelectCallback(item);
                suggestionEl.style.display = 'none';
            });
            suggestionEl.appendChild(div);
        });
        suggestionEl.style.display = 'block';
    });
    
    // Tutup dropdown jika klik di luar input
    document.addEventListener('click', function(e) { 
        if (e.target !== inputEl) suggestionEl.style.display = 'none'; 
    });
}
setupAutocomplete(inputSiswa, siswaSuggestions, masterSiswa, (siswa) => {
    inputSiswa.value = siswa[1]; idSiswaField.value = siswa[0]; boxIdSiswa.innerText = siswa[0];
    kelasSiswaField.value = siswa[2]; boxKelasSiswa.innerText = siswa[2];
});

setupAutocomplete(inputBuku, bukuSuggestions, masterBuku, (buku) => {
    inputBuku.value = buku[1]; idBukuField.value = buku[0]; pengarangField.value = buku[2];
    pengarangField.readOnly = true; groupStok.style.display = 'none';
});

inputBuku.addEventListener('input', function() {
    if (!this.value) {
        idBukuField.value = ''; pengarangField.value = ''; pengarangField.readOnly = false; groupStok.style.display = 'none';
    } else {
        const cocok = masterBuku.some(b => b[1].toLowerCase() === this.value.toLowerCase());
        if (!cocok) { idBukuField.value = ''; pengarangField.readOnly = false; groupStok.style.display = 'block'; }
    }
});

setupAutocomplete(inputTamu, tamuSuggestions, masterSiswa, (siswa) => {
    inputTamu.value = siswa[1]; idTamuField.value = siswa[0]; boxIdTamu.innerText = siswa[0];
    kelasTamuField.value = siswa[2]; boxKelasTamu.innerText = siswa[2];
});

// ==========================================
// 4. POST EVENT HANDLING (SUBMIT & BUTTONS)
// ==========================================
formPeminjaman.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!idSiswaField.value) { alert("⚠️ Pilihlah nama siswa dari rekomendasi dropdown!"); return; }
    
    const payload = {
        action: "simpanPeminjaman", id_siswa: idSiswaField.value, nama_siswa: inputSiswa.value,
        kelas: kelasSiswaField.value, id_buku: idBukuField.value || "", judul_buku: inputBuku.value,
        nama_pengarang: pengarangField.value, stok_total: stokTotalField.value || "1"
    };
    
    try {
        btnSimpan.disabled = true; btnSimpan.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;
        const respon = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const hasil = await respon.json();
        if (hasil.success) {
            formPeminjaman.reset(); idBukuField.value = ''; idSiswaField.value = '';
            boxIdSiswa.innerText = '-'; boxKelasSiswa.innerText = '-'; pengarangField.readOnly = false; groupStok.style.display = 'none';
            await muatDataAwal();
        } else { alert("Gagal: " + hasil.error); }
    } catch (e) { alert("Gangguan koneksi."); }
    finally { btnSimpan.disabled = false; btnSimpan.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Konfirmasi Peminjaman`; }
});

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
