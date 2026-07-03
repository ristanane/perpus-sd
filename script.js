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
// 2. KELOLA DATA (Bagian bawah script.js)
// ==========================================
async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        masterSiswa = data.siswa || [];
        masterBuku = data.buku || [];
        
        // Panggil inisialisasi di sini agar data sudaaaahhh terisi
        inisialisasiSistem(); 
        
        renderTabelPeminjaman(data.log || []);
        hitungAnalitikDashboard(data.log || []);
    } catch (error) { console.error("Gagal sinkronisasi data:", error); }
}

// 3. AUTOCOMPLETE ENGINE (Fungsi tetap sama)
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

// FUNGSI INISIALISASI (Panggil sekali aja di dalam muatDataAwal)
function inisialisasiSistem() {
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
}

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

// [Fungsi-fungsi lain seperti renderTabelPeminjaman, hitungAnalitik, dll ttp di sini...]
// (Pastikan kamu menyalin fungsi sisanya dari file lama ke bawah sini dengan teliti)

function hitungAnalitikDashboard(logs) {
    const hariIni = new Date();
    let htmlTerlambat = '';
    let hitungBuku = {}, hitungSiswa = {}, hitungKelas = {};

    // Cukup satu kali loop untuk semuanya
    logs.forEach(row => {
        // A. Pengingat Terlambat
        if (row[9] === "Dipinjam" && row[7]) {
            let tglPinjam = new Date(row[7].includes("T") ? row[7].split("T")[0] : row[7]);
            let selisih = Math.floor((hariIni - tglPinjam) / (1000 * 60 * 60 * 24));
            if (selisih > 7) {
                htmlTerlambat += `<div class="alert-item"><span><strong>${row[2]}</strong> (Kl. ${row[3]}) - Telat ${selisih} hari</span></div>`;
            }
        }
        
        // B. Hitung untuk Leaderboard & Populer
        if (row[2]) { // Pastikan ada nama siswa
        let kunci = `${row[2]}|${row[3]}`;
        hitungSiswa[kunci] = (hitungSiswa[kunci] || 0) + 1;
    }
    if (row[3]) {
        hitungKelas[row[3]] = (hitungKelas[row[3]] || 0) + 1;
    }
    if (row[5]) {
        hitungBuku[row[5]] = (hitungBuku[row[5]] || 0) + 1;
    }
});

    // C. Render ke Elemen
    if(boxTerlambat) boxTerlambat.innerHTML = htmlTerlambat || `<p style="color:green;">Semua buku aman! ✨</p>`;
    if(boxPopuler) boxPopuler.innerHTML = Object.entries(hitungBuku).sort((a,b)=>b[1]-a[1]).slice(0,3).map(b => `<div class="populer-tag">${b[0]} (${b[1]}x)</div>`).join('');
    
    // D. Render Leaderboard Siswa (4 Kolom)
    if(leaderSiswa) {
        leaderSiswa.innerHTML = Object.entries(hitungSiswa)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 5)
            .map((s, i) => {
                const [nama, kelas] = s[0].split('|');
                return `<tr>
                    <td><div class="rank-number">${i+1}</div></td>
                    <td><strong>${nama}</strong></td>
                    <td>${kelas}</td>
                    <td style="text-align:right;">${s[1]}x</td>
                </tr>`;
            }).join('');
    }

    // Render Kelas (3 kolom: Peringkat, Kelas, Total)
    if(leaderKelas) {
        leaderKelas.innerHTML = Object.entries(hitungKelas)
            .sort((a,b) => b[1] - a[1])
            .map((k, i) => `<tr>
                <td><div class="rank-number">${i+1}</div></td>
                <td>Kelas ${k[0]}</td>
                <td style="text-align:right;">${k[1]}x</td>
            </tr>`).join('');
    }
}

function renderTabelPeminjaman(logArray) {
    tabelPeminjaman.innerHTML = '';
    const bukuDipinjam = logArray.filter(row => row[9] === "Dipinjam");
    
    if (bukuDipinjam.length === 0) {
        tabelPeminjaman.innerHTML = `<tr><td colspan="6" style="text-align:center;">Tidak ada tanggungan. ✨</td></tr>`;
        return;
    }

    bukuDipinjam.forEach(row => {
        const tr = document.createElement('tr');
        // Pastikan kolom 7 adalah Tgl Pinjam, dan kolom 8 adalah Tgl Kembali
        let tglPinjam = row[7] ? (row[7].includes("T") ? row[7].split("T")[0] : row[7]) : '-';
        let tglKembali = row[8] ? (row[8].includes("T") ? row[8].split("T")[0] : row[8]) : '-';

        tr.innerHTML = `
            <td><strong>${row[2]}</strong><br><small>ID: ${row[1]}</small></td>
            <td>Kelas ${row[3]}</td>
            <td><strong>${row[5]}</strong></td>
            <td><small>Pinjam: ${tglPinjam}</small><br><strong>Kembali: ${tglKembali}</strong></td>
            <td style="text-align: center; white-space: nowrap;">
                <button class="btn-action btn-renew" onclick="bukaPerpanjang('${row[0]}')">Perpanjang</button>
                <button class="btn-action btn-return" onclick="bukaModalKembali('${row[0]}', '${row[4]}')">Kembali</button>
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
        const respon = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: "perpanjangBuku", id_transaksi: idTransaksi }) 
        });
        
        // Cek apakah server memberikan jawaban
        const hasil = await respon.json();
        
        if (hasil.success) { 
            alert("Berhasil diperpanjang! 🗓️"); 
            await muatDataAwal(); 
        } else { 
            alert("Gagal dari server: " + hasil.error); 
        }
    } catch (e) { 
        console.error("Error lengkap:", e); // <--- KITA LIHAT INI
        alert("Koneksi bermasalah. Cek Console (F12) untuk detailnya."); 
    }
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
