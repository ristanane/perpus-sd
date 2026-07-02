const API_URL = "https://script.google.com/macros/s/AKfycbx2AUz9RHxpCHMuIKWL9IfN9TlZ4QVv92x2uCvFxHbdorPwXMoalX0DakbauBXrKQhPag/exec";
let masterSiswa = [];

async function muatDataAwal() {
    console.log("Memulai tarik data...");
    try {
        const respon = await fetch(`${API_URL}?action=getDataAwal`);
        const data = await respon.json();
        masterSiswa = data.siswa || [];
        console.log("Data Siswa berhasil dimuat:", masterSiswa);
    } catch (err) {
        console.error("Gagal tarik data:", err);
    }
}

// Event listener sederhana untuk tes
const inputSiswa = document.getElementById('inputSiswa');
if (inputSiswa) {
    inputSiswa.addEventListener('input', function() {
        console.log("Sedang mengetik:", this.value);
        if (masterSiswa.length > 0) {
            console.log("Ada data siswa, mencari kecocokan...");
        } else {
            console.warn("Data siswa kosong!");
        }
    });
}

muatDataAwal();
