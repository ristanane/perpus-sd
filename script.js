// ==========================================================================
// ⚠️ GANTI LINK DI BAWAH INI DENGAN URL WEB APP GOOGLE APPS SCRIPT-MU!
// ==========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbymOw4jnnNZrz5N7GpHy20S1ubrgb8PnwgTWbrxdtzOCncA5Ap-DQrr3fiq9-FkzhwBiQ/exec";

// Variabel Penampung Data Utama
let MASTER_SISWA = [];
let MASTER_BUKU = [];
let LOG_PINJAMAN = [];

// Elemen DOM (HTML)
const inputSiswa = document.getElementById('cari-siswa');
const idSiswaField = document.getElementById('id-siswa');
const kelasSiswaField = document.getElementById('kelas-siswa');
const dropdownSiswa = document.getElementById('dropdown-siswa');

const inputBuku = document.getElementById('cari-buku');
const idBukuField = document.getElementById('id-buku');
const pengarangField = document.getElementById('nama-pengarang');
const groupStok = document.getElementById('group-stok');
const stokTotalField = document.getElementById('stok-total');
const dropdownBuku = document.getElementById('dropdown-buku');

const formPeminjaman = document.getElementById('form-peminjaman');
const btnSimpan = document.getElementById('btn-simpan');
const statusBadge = document.getElementById('connection-status');
const tabelBody = document.getElementById('tabel-log-body');
const keywordTabel = document.getElementById('keyword-tabel');

// ==========================================================================
// 1. AMBIL DATA AWAL DARI GOOGLE SHEETS
// ==========================================================================
async function muatDataAwal() {
    try {
        updateStatus("Memuat Data...", "#FFF9C4", "#FBC02D");
        
        // Memanggil fungsi getDataAwal() yang ada di Kode.gs
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        
        MASTER_SISWA = data.siswa || [];
        MASTER_BUKU = data.buku || [];
        LOG_PINJAMAN = data.log || [];
        
        // Aktifkan form input setelah data selesai dimuat
        inputSiswa.disabled = false;
        inputBuku.disabled = false;
        btnSimpan.disabled = false;
        
        updateStatus("Sistem Siap", "#E8F5E9", "#4CAF50");
        renderTabelLog(LOG_PINJAMAN);
    } catch (error) {
        console.error("Gagal koneksi ke API:", error);
        updateStatus("Koneksi Gagal", "#FFEBEE", "#D32F2F");
    }
}

function updateStatus(teks, bg, dotColor) {
    statusBadge.style.backgroundColor = bg;
    statusBadge.innerHTML = `<span class="dot-loading" style="background-color: ${dotColor}"></span> ${teks}`;
}

// ==========================================================================
// 2. LOGIKA AUTO-COMPLETE: CARI SISWA
// ==========================================================================
inputSiswa.addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    dropdownSiswa.innerHTML = '';
    
    // Reset field pendukung jika input dikosongkan/diubah
    idSiswaField.value = '';
    kelasSiswaField.value = '';
    
    if (!keyword) { dropdownSiswa.style.display = 'none'; return; }
    
    // Filter siswa berdasarkan nama
    const hasilFilter = MASTER_SISWA.filter(s => s[1].toLowerCase().includes(keyword));
    
    if (hasilFilter.length > 0) {
        dropdownSiswa.style.display = 'block';
        hasilFilter.forEach(siswa => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `<strong>${siswa[1]}</strong> <span style="float:right; font-size:11px; color:#7F8C8D;">Kelas ${siswa[2]}</span>`;
            item.addEventListener('click', () => {
                inputSiswa.value = siswa[1]; // Nama
                idSiswaField.value = siswa[0]; // ID Siswa
                kelasSiswaField.value = siswa[2]; // Kelas
                dropdownSiswa.style.display = 'none';
            });
            dropdownSiswa.appendChild(item);
        });
    } else {
        dropdownSiswa.style.display = 'none';
    }
});

// ==========================================================================
// 3. LOGIKA AUTO-COMPLETE: CARI BUKU
// ==========================================================================
inputBuku.addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    dropdownBuku.innerHTML = '';
    
    // Reset field pendukung
    idBukuField.value = '';
    pengarangField.value = '';
    pengarangField.readOnly = false;
    groupStok.style.display = 'none';
    
    if (!keyword) { dropdownBuku.style.display = 'none'; return; }
    
    const hasilFilter = MASTER_BUKU.filter(b => b[1].toLowerCase().includes(keyword));
    
    if (hasilFilter.length > 0) {
        dropdownBuku.style.display = 'block';
        hasilFilter.forEach(buku => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `<strong>${buku[1]}</strong> <br><small style="color:#7F8C8D;">Oleh: ${buku[2]} | Tersedia: ${buku[4]}</small>`;
            item.addEventListener('click', () => {
                inputBuku.value = buku[1]; // Judul
                idBukuField.value = buku[0]; // ID Buku
                pengarangField.value = buku[2]; // Pengarang
                pengarangField.readOnly = true; // Kunci biar gak diedit
                groupStok.style.display = 'none'; // Sembunyikan input stok eksemplar
                dropdownBuku.style.display = 'none';
            });
            dropdownBuku.appendChild(item);
        });
    } else {
        // JIKA BUKU TIDAK DITEMUKAN (Buku Baru Pertama Kali Diinput)
        dropdownBuku.style.display = 'none';
        groupStok.style.display = 'block'; // Tampilkan input stok tambahan
    }
});

// Tutup dropdown jika klik di luar form
document.addEventListener('click', (e) => {
    if (!e.target.closest('#form-peminjaman')) {
        dropdownSiswa.style.display = 'none';
        dropdownBuku.style.display = 'none';
    }
});

// ==========================================================================
// 4. PROSES KIRIM FORM PEMINJAMAN (SIMPAN)
// ==========================================================================
formPeminjaman.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validasi pengaman agar ID Siswa harus dipilih dari dropdown
    if (!idSiswaField.value) {
        alert("Harap pilih nama siswa dari rekomendasi yang muncul!");
        return;
    }
    
    const payload = {
        action: "simpanPeminjaman",
        id_siswa: idSiswaField.value,
        nama_siswa: inputSiswa.value,
        kelas: kelasSiswaField.value,
        id_buku: idBukuField.value, // Kosong jika buku baru
        judul_buku: inputBuku.value,
        nama_pengarang: pengarangField.value,
        stok_total: stokTotalField.value
    };
    
    try {
        btnSimpan.disabled = true;
        btnSimpan.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses Peminjaman...`;
        
        // Kirim data ke Google Apps Script via POST/GET method gabungan
        const respon = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const hasil = await respon.json();
        if (hasil.success) {
            formPeminjaman.reset();
            idBukuField.value = '';
            idSiswaField.value = '';
            pengarangField.readOnly = false;
            groupStok.style.display = 'none';
            
            // Segarkan ulang tabel data
            await muatDataAwal();
        }
    } catch (error) {
        alert("Gagal memproses transaksi. Coba lagi!");
        console.error(error);
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Konfirmasi Peminjaman`;
    }
});

// ==========================================================================
// 5. RENDER TABEL MONITORING (DENGAN WARNA PASTEL PERINGATAN)
// ==========================================================================
function renderTabelLog(dataLog) {
    tabelBody.innerHTML = '';
    
    // Filter data yang statusnya hanya "Dipinjam"
    const dataAktif = dataLog.filter(row => row[9] === "Dipinjam");
    
    if (dataAktif.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">🎉 Tidak ada buku yang sedang dipinjam. Semuanya aman!</td></tr>`;
        return;
    }
    
    dataAktif.forEach(row => {
        const idTransaksi = row[0];
        const namaSiswa = row[2];
        const kelas = row[3];
        const idBuku = row[4];
        const judulBuku = row[5];
        const pengarang = row[6];
        
        // Format Tanggal Batas Kembali agar cantik dibaca manusia
        const tglKembaliRaw = new Date(row[8]);
        const opsiTgl = { year: 'numeric', month: 'short', day: 'numeric' };
        const tglFormat = tglKembaliRaw.toLocaleDateString('id-ID', opsiTgl);
        
        function renderTabelLog(dataLog) {
    tabelBody.innerHTML = '';
    
    // Filter data yang statusnya hanya "Dipinjam" (Kolom J -> indeks 9)
    const dataAktif = dataLog.filter(row => row[9] === "Dipinjam");
    
    if (dataAktif.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="5" class="table-empty-state">🎉 Tidak ada buku yang sedang dipinjam. Semuanya aman!</td></tr>`;
        return;
    }
    
    dataAktif.forEach(row => {
        const idTransaksi = row[0];
        const namaSiswa = row[2];
        const kelas = row[3];
        const idBuku = row[4];
        const judulBuku = row[5];
        const pengarang = row[6];
        
        // Format Tanggal Batas Kembali (Kolom I -> indeks 8)
        const tglKembaliRaw = new Date(row[8]);
        const opsiTgl = { year: 'numeric', month: 'short', day: 'numeric' };
        const tglFormat = tglKembaliRaw.toLocaleDateString('id-ID', opsiTgl);
        
        // Membaca Kolom K (Keterangan -> indeks 10) untuk mendeteksi kata "TERLAMBAT"
        const isTerlambat = row[10] && row[10].toString().toUpperCase() === "TERLAMBAT";
        const kelasBaris = isTerlambat ? 'row-warning' : 'row-normal';
        const labelTerlambat = isTerlambat ? ' <span style="font-weight:700; color:#C62828;">[TERLAMBAT]</span>' : '';
        
        const tr = document.createElement('tr');
        tr.className = kelasBaris;
        tr.innerHTML = `
            <td><strong>${namaSiswa}</strong><span class="sub-info">ID: ${row[1]}</span></td>
            <td>Kelas ${kelas}</td>
            <td><strong>${judulBuku}</strong><span class="sub-info">Oleh: ${pengarang}</span></td>
            <td>${tglFormat}${labelTerlambat}</td>
            <td style="text-align: center;">
                <button class="btn-return" onclick="prosesPengembalian('${idTransaksi}', '${idBuku}')">
                    <i class="fa-solid fa-circle-check"></i> Kembali
                </button>
            </td>
        `;
        tabelBody.appendChild(tr);
    });
}
// ==========================================================================
// 6. PROSES PENGEMBALIAN BUKU
// ==========================================================================
window.prosesPengembalian = async function(idTransaksi, idBuku) {
    if (!confirm("Konfirmasi pengembalian buku ini?")) return;
    
    try {
        updateStatus("Mengembalikan Buku...", "#FFF9C4", "#FBC02D");
        
        const payload = {
            action: "kembalikanBuku",
            id_transaksi: idTransaksi,
            id_buku: idBuku
        };
        
        const respon = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const hasil = await respon.json();
        if (hasil.success) {
            await muatDataAwal();
        }
    } catch (error) {
        alert("Gagal memproses pengembalian!");
        console.error(error);
        updateStatus("Sistem Siap", "#E8F5E9", "#4CAF50");
    }
};

// ==========================================================================
// 7. FITUR INPUT PENCARIAN GLOBAL UNTUK TABEL
// ==========================================================================
keywordTabel.addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    const barisTabel = tabelBody.getElementsByTagName('tr');
    
    for (let i = 0; i < barisTabel.length; i++) {
        const teksBaris = barisTabel[i].innerText.toLowerCase();
        if (teksBaris.includes(keyword) || barisTabel[i].classList.contains('table-empty-state')) {
            barisTabel[i].style.display = "";
        } else {
            barisTabel[i].style.display = "none";
        }
    }
});

// Jalankan pengambilan data otomatis saat web pertama kali dibuka
muatDataAwal();
