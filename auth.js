// --- FIREBASE AUTHENTICATION MODULE ---
// Menggunakan Firebase SDK v10 (Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Konfigurasi Firebase Anda (Telah direkam secara permanen)
const firebaseConfig = {
    apiKey: "AIzaSyDu9mi0SySgJgyEueuD6WEhpc0nOyLYic4",
    authDomain: "pkl-hasmawati.firebaseapp.com",
    projectId: "pkl-hasmawati",
    storageBucket: "pkl-hasmawati.firebasestorage.app",
    messagingSenderId: "92948220017",
    appId: "1:92948220017:web:51c7f4d8638caaf86fb3d0"
};

// Inisialisasi Firebase & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Menghubungkan Elemen HTML
const loginScreen = document.getElementById('loginScreen');
const mainAppContainer = document.getElementById('mainAppContainer');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const btnLogout = document.getElementById('btnLogout');
const btnLoginText = document.getElementById('btnLoginText');
const btnLoginIcon = document.getElementById('btnLoginIcon');

// Fungsi Proses Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Mencegah halaman refresh

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Efek Loading pada tombol Login
    btnLoginText.textContent = "MEMERIKSA...";
    btnLoginIcon.className = "fa-solid fa-spinner fa-spin";
    loginError.classList.add('hidden');

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Jika berhasil, state akan diubah otomatis oleh onAuthStateChanged
            btnLoginText.textContent = "MASUK";
            btnLoginIcon.className = "fa-solid fa-right-to-bracket";
        })
        .catch((error) => {
            // Jika Gagal (Email/Password salah)
            loginError.textContent = "Akses Ditolak: Email atau Password salah!";
            loginError.classList.remove('hidden');
            btnLoginText.textContent = "MASUK";
            btnLoginIcon.className = "fa-solid fa-right-to-bracket";
        });
});

// Fungsi Logout
btnLogout.addEventListener('click', () => {
    if(confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
        signOut(auth);
    }
});

// Pemantau Status Real-Time (Apakah user sedang login atau belum)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // JIKA SUDAH LOGIN: Sembunyikan layar login, Tampilkan Dashboard Utama
        loginScreen.classList.add('hidden');
        mainAppContainer.classList.remove('hidden');
    } else {
        // JIKA BELUM LOGIN / LOGOUT: Tampilkan layar login, Sembunyikan Dashboard Utama
        loginScreen.classList.remove('hidden');
        mainAppContainer.classList.add('hidden');
        document.getElementById('password').value = ''; // Kosongkan password untuk keamanan
    }
});