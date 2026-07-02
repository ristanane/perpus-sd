// 1. KONFIGURASI UTAMA
const API_URL = "PASTE_URL_WEB_APP_BARU_KAMU_DISINI";

// Variabel Global Data Sinkronisasi Sheets
let masterSiswa = [];
let masterBuku = [];

// Elemen DOM Tab Peminjaman
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

// Elemen DOM Tab Buku Tamu
const formKunjungan = document.getElementById('formKunjungan');
const inputTamu = document.getElementById('inputTamu');
const idTamuField = document.getElementById('idTamu');
const boxIdTamu = document.getElementById('boxIdTamu');
const kelasTamuField = document.getElementById('kelasTamu');
const boxKelasTamu = document.getElementById('boxKelasTamu');
const tamuSuggestions = document.getElementById('tamuSuggestions');
const btnTamu = document.getElementById('btnTamu');

// Elemen Global Modal Pengembalian
const modalKondisi = document.getElementById('modalKondisi');
let transaksiTerpilih = null;
let idBukuTerpilih = null;

// ==========================================
// 2. AMBIL DATA AWAL SAAT WEB DIBUKA
// ==========================================
async function muatDataAwal() {
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        
        masterSiswa = data.siswa || [];
        masterBuku = data.buku || [];
        
        renderTabelPeminjaman(data.log || []);
    } catch (error) {
        console.error("Gagal memuat data dari database Sheets:", error);
    }
}

// ==========================================
// 3. LOGIKA AUTO-COMPLETE & DROPDOWN SUGGESTIONS
// ==========================================
function setupAutocomplete(inputEl, suggestionEl, dataArray, onSelectCallback) {
    inputEl.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        suggestionEl.innerHTML = '';
        if (!val) { suggestionEl.style.display = 'none'; return; }
        
        const filtered = dataArray.filter(item => item[1].toLowerCase().includes(val));
        
        if (filtered.length === 0) {
            suggestionEl.style.display = 'none';
            return;
        }
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<strong>${item[1]}</strong> <small style="color:#7a8a81;">(${item[2]})</small>`;
            div.addEventListener('click', () => {
                onSelectCallback(item);
                suggestionEl.style.display = 'none';
            });
            suggestionEl.appendChild(div);
        });
        suggestionEl.style.display = 'block';
    });

    document.addEventListener('click', function(e) {
        if (e.target !== inputEl) suggestionEl.style.display = 'none';
    });
}

// Pasang Autocomplete Siswa (Tab Peminjaman)
setupAutocomplete(inputSiswa, siswaSuggestions, masterSiswa, (siswa) => {
    inputSiswa.value = siswa[1];
    idSiswaField.value = siswa[0];
    boxIdSiswa.innerText = siswa[0];
    kelasSiswaField.value = siswa[2];
    boxKelasSiswa.innerText = siswa[2];
});

// Pasang Autocomplete Buku (Tab Peminjaman)
setupAutocomplete(inputBuku, bukuSuggestions, masterBuku, (buku) => {
    inputBuku.value = buku[1];
    idBukuField.value = buku[0];
    pengarangField.value = buku[2];
    pengarangField.readOnly = true;
    groupStok.style.display = 'none';
});

// Deteksi jika judul buku diketik manual (Buku Baru)
inputBuku.addEventListener('input', function() {
    if (!this.value) {
        idBukuField.value = '';
        pengarangField.value = '';
        pengarangField.readOnly = false;
        groupStok.style.display = 'none';
    } else {
        // Jika tidak ada di suggestion, asumsikan buku baru
        const cocok = masterBuku.some(b => b[1].toLowerCase() === this.value.toLowerCase());
        if (!cocok) {
            idBukuField.value = '';
            pengarangField.readOnly = false;
            groupStok.style.display = 'block';
        }
    }
});

// Pasang Autocomplete Siswa (Tab Buku Tamu Kunjungan)
setupAutocomplete(inputTamu, tamuSuggestions, masterSiswa, (siswa) => {
    inputTamu.value = siswa[1];
    idTamuField.value = siswa[0];
    boxIdTamu.innerText = siswa[0];
    kelasTamuField.value = siswa[2];
    boxKelasTamu.innerText = siswa[2];
});

// ==========================================
// 4. PROSES KIRIM FORM PEMINJAMAN
// ==========================================
formPeminjaman.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!idSiswaField.value || idSiswaField.value === "") {
        alert("⚠️ Harap pilih nama siswa dari rekomendasi yang muncul!");
        return;
    }
    
    const payload = {
        action: "simpanPeminjaman",
        id_siswa: idSiswaField.value,
        nama_siswa: inputSiswa.value,
        kelas: kelasSiswaField.value,
        id_buku: idBukuField.value || "",
        judul_buku: inputBuku.value,
        nama_pengarang: pengarangField.value,
        stok_total: stokTotalField.value || "1"
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
            boxIdSiswa.innerText = '-';
            boxKelasSiswa.innerText = '-';
            pengarangField.readOnly = false;
            groupStok.style.display = 'none';
            await muatDataAwal();
        } else {
            alert("Gagal: " + (hasil.error || "Terjadi kesalahan. Cek stok buku."));
        }
    } catch (error) {
        alert("Terjadi gangguan koneksi. Coba lagi.");
    } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Konfirmasi Peminjaman`;
    }
});

// ==========================================
// 5. RENDER TABEL UTAMA & TOMBOL BARU (PERPANJANG & KEMBALI)
// ==========================================
function renderTabelPeminjaman(logArray) {
    tabelPeminjaman.innerHTML = '';
    
    // Filter hanya tampilkan buku yang statusnya masih "Dipinjam"
    const bukuDipinjam = logArray.filter(row => row[9] === "Dipinjam");
    
    if (bukuDipinjam.length === 0) {
        tabelPeminjaman.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#7a8a81; padding:30px;">Alhamdulillah, tidak ada tanggungan pinjaman buku hari ini. ✨</td></tr>`;
        return;
    }
    
    bukuDipinjam.forEach(row => {
        const tr = document.createElement('tr');
        
        // Memformat Tanggal agar lebih cantik dibaca
        let tglFormat = row[7];
        if(tglFormat && tglFormat.includes("T")) tglFormat = tglFormat.split("T")[0];
        
        tr.innerHTML = `
            <td><strong>${row[2]}</strong><br><small style="color:#7a8a81;">ID: ${row[1]}</small></td>
            <td>Kelas ${row[3]}</td>
            <td><strong>${row[5]}</strong><br><small style="color:#7a8a81;">Oleh: ${row[6]}</small></td>
            <td><span style="background:rgba(118,184,147,0.15); color:#4e8a67; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600;">${tglFormat}</span></td>
            <td style="text-align: center; white-space: nowrap;">
                <button class="btn-action btn-renew" onclick="bukaPerpanjang('${row[0]}')"><i class="fa-solid fa-clock"></i> Perpanjang</button>
                <button class="btn-action btn-return" onclick="bukaModalKembali('${row[0]}', '${row[4]}')"><i class="fa-solid fa-circle-check"></i> Kembali</button>
            </td>
        `;
        tabelPeminjaman.appendChild(tr);
    });
}

// ==========================================
// 6. LOGIKA MODAL KONDISI BUKU (FITUR 6) & KEMBALIKAN BUKU
// ==========================================
function bukaModalKembali(idTransaksi, idBuku) {
    transaksiTerpilih = idTransaksi;
    idBukuTerpilih = idBuku;
    modalKondisi.style.display = 'flex';
}

function tutupModal() {
    modalKondisi.style.display = 'none';
    transaksiTerpilih = null;
    idBukuTerpilih = null;
}

async function eksekusiKembali(kondisiBuku) {
    if (!transaksiTerpilih) return;
    
    const payload = {
        action: "kembalikanBuku",
        id_transaksi: transaksiTerpilih,
        id_buku: idBukuTerpilih,
        kondisi_buku: kondisiBuku
    };
    
    tutupModal();
    
    try {
        const respon = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const hasil = await respon.json();
        
        if (hasil.success) {
            await muatDataAwal();
        } else {
            alert("Gagal mengembalikan buku: " + hasil.error);
        }
    } catch (error) {
        alert("Koneksi gagal saat memproses pengembalian.");
    }
}

// ==========================================
// 7. LOGIKA PERPANJANG BUKU (FITUR 4)
// ==========================================
async function bukaPerpanjang(idTransaksi) {
    if(!confirm("Perpanjang masa peminjaman buku ini selama 1 minggu ke depan?")) return;
    
    const payload = {
        action: "perpanjangBuku",
        id_transaksi: idTransaksi
    };
    
    try {
        const respon = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const hasil = await respon.json();
        
        if (hasil.success) {
            alert("Masa peminjaman buku berhasil diperpanjang! 🗓️");
            await muatDataAwal();
        } else {
            alert("Gagal: " + hasil.error);
        }
    } catch (error) {
        alert("Koneksi bermasalah.");
    }
}

// ==========================================
// 8. PROSES KIRIM BUKU TAMU DIGITAL (FITUR 7)
// ==========================================
formKunjungan.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!idTamuField.value || idTamuField.value === "") {
        alert("⚠️ Harap pilih namamu dari rekomendasi yang muncul di bawah!");
        return;
    }
    
    const payload = {
        action: "simpanKunjungan",
        id_siswa: idTamuField.value,
        nama_siswa: inputTamu.value,
        kelas: kelasTamuField.value
    };
    
    try {
        btnTamu.disabled = true;
        btnTamu.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mencatat Kehadiran...`;
        
        const respon = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const hasil = await respon.json();
        
        if (hasil.success) {
            alert(`🎉 Terima kasih ${inputTamu.value}, kehadiranmu berhasil dicatat! Selamat membaca.`);
            formKunjungan.reset();
            idTamuField.value = '';
            boxIdTamu.innerText = '-';
            boxKelasTamu.innerText = '-';
            await muatDataAwal();
        } else {
            alert("Gagal mencatat kunjungan: " + hasil.error);
        }
    } catch (error) {
        alert("Gagal mengirim data buku tamu.");
    } finally {
        btnTamu.disabled = false;
        btnTamu.innerHTML = `<i class="fa-solid fa-circle-check"></i> Saya Hadir Di Perpustakaan`;
    }
});

// Jalankan fungsi saat web pertama kali diakses
muatDataAwal();
