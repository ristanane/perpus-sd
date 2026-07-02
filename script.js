// ==========================================================================
// ⚠️ GANTI LINK DI BAWAH INI DENGAN URL WEB APP GOOGLE APPS SCRIPT-MU!
// ==========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzhcMJU35EZoaFQkOsB5DdJMVXT9JFNh-Hp_4UwwwtrbvUjQh07OwcPhOUp6JyZ_Ltxkw/exec";

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

// 1. AMBIL DATA AWAL DARI GOOGLE SHEETS
async function muatDataAwal() {
    try {
        updateStatus("Memuat Data...", "#FFF9C4", "#FBC02D");
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        
        MASTER_SISWA = data.siswa || [];
        MASTER_BUKU = data.buku || [];
        LOG_PINJAMAN = data.log || [];
        
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

// 2. LOGIKA AUTO-COMPLETE: CARI SISWA
inputSiswa.addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    dropdownSiswa.innerHTML = '';
    idSiswaField.value = '';
    kelasSiswaField.value = '';
    
    if (!keyword) { dropdownSiswa.style.display = 'none'; return; }
    
    const hasilFilter = MASTER_SISWA.filter(s => s[1].toLowerCase().includes(keyword));
    
    if (hasilFilter.length > 0) {
        dropdownSiswa.style.display = 'block';
        hasilFilter.forEach(siswa => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `<strong>${siswa[1]}</strong> <span style="float:right; font-size:11px; color:#7F8C8D;">Kelas ${siswa[2]}</span>`;
            item.addEventListener('click', () => {
                inputSiswa.value = siswa[1];
                idSiswaField.value = siswa[0];
                kelasSiswaField.value = siswa[2];
                dropdownSiswa.style.display = 'none';
            });
            dropdownSiswa.appendChild(item);
        });
    } else {
        dropdownSiswa.style.display = 'none';
    }
});

// 3. LOGIKA AUTO-COMPLETE: CARI BUKU
inputBuku.addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    dropdownBuku.innerHTML = '';
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
                inputBuku.value = buku[1];
                idBukuField.value = buku[0];
                pengarangField.value = buku[2];
                pengarangField.readOnly = true;
                groupStok.style.display = 'none';
                dropdownBuku.style.display = 'none';
            });
            dropdownBuku.appendChild(item);
        });
    } else {
        dropdownBuku.style.display = 'none';
        groupStok.style.display = 'block';
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#form-peminjaman')) {
        dropdownSiswa.style.display = 'none';
        dropdownBuku.style.display = 'none';
    }
});

// 4. PROSES KIRIM FORM PEMINJAMAN (SIMPAN)
formPeminjaman.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!idSiswaField.value) {
        alert("Harap pilih nama siswa dari rekomendasi yang muncul!");
        return;
    }
    
    const payload = {
        action: "simpanPeminjaman",
        id_siswa: idSiswaField.value,
        nama_siswa: inputSiswa.value,
        kelas: kelasSiswaField.value,
        id_buku: idBukuField.value,
        judul_buku: inputBuku.value,
        nama_pengarang: pengarangField.value,
        stok_total: stokTotalField.value
    };
    
    try {
        btnSimpan.disabled = true;
        btnSimpan.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses Peminjaman...`;
        
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
            await muatDataAwal();
        }
    } catch (error) {
        alert("Gagal memproses transaksi. Coba lagi!");
        console.error(error);
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Konfirmasi Peminjaman`;
    }
});

// 5. RENDER TABEL MONITORING
function renderTabelLog(dataLog) {
    tabelBody.innerHTML = '';
    const dataAktif = dataLog.filter(row => row[0] && row[9] === "Dipinjam");
    
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
        
        let tglFormat = "-";
        if (row[8]) {
            const tglKembaliRaw = new Date(row[8]);
            if (!isNaN(tglKembaliRaw.getTime())) {
                const opsiTgl = { year: 'numeric', month: 'short', day: 'numeric' };
                tglFormat = tglKembaliRaw.toLocaleDateString('id-ID', opsiTgl);
            }
        }
        
        const isTerlambat = row[10] && row[10].toString().trim().toUpperCase() === "TERLAMBAT";
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

// 6. PROSES PENGEMBALIAN BUKU
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

// 7. FITUR PENCARIAN GLOBAL TABEL
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
