// --- FIREBASE DATABASE INTEGRATION (MULTI-USER VERSION) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Konfigurasi Firebase Anda yang tersimpan permanen
const firebaseConfig = {
    apiKey: "AIzaSyDu9mi0SySgJgyEueuD6WEhpc0nOyLYic4",
    authDomain: "pkl-hasmawati.firebaseapp.com",
    projectId: "pkl-hasmawati",
    storageBucket: "pkl-hasmawati.firebasestorage.app",
    messagingSenderId: "92948220017",
    appId: "1:92948220017:web:51c7f4d8638caaf86fb3d0"
};

// Inisialisasi
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Object State Utama Aplikasi (Akan direset setiap ganti akun)
let appState = {
    currentTab: 'rumah_tangga',
    tabs: { rumah_tangga: [], usaha_micro: [], verifikasi: [], opsi_lain: [], verif: [] },
    original: { rumah_tangga: [], usaha_micro: [], verifikasi: [], opsi_lain: [], verif: [] },
    notes: "" 
};

const categories = {
    rumah_tangga: 'RT I',
    usaha_micro: 'UM I',
    verifikasi: 'RT II',
    opsi_lain: 'UM II',
    verif: 'Verif'
};

let searchQuery = '';
let currentUser = null; 

// Menghubungkan Elemen DOM
const saveIndicator = document.getElementById('saveIndicator');
const inputCategoryName = document.getElementById('inputCategoryName');
const dataListContainer = document.getElementById('dataListContainer');
const totalCount = document.getElementById('totalCount');
const activeCountEl = document.getElementById('activeCount');
const xCountEl = document.getElementById('xCount');
const rawInput = document.getElementById('rawInput');
const toast = document.getElementById('toast');
const htmlEl = document.documentElement;
const notesInput = document.getElementById('notesInput');

// --- SYNC ENGINE (FIREBASE CLOUD - DYNAMIC PER USER) ---

// Memantau status login. Jika sukses login, ambil data BERDASARKAN USER UID
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        saveIndicator.textContent = "MENGHUBUNGKAN KE RUANG DATA ANDA...";
        
        try {
            // PERUBAHAN DI SINI: Dokumen disimpan berdasarkan UID unik masing-masing akun
            const docRef = doc(db, "data_pro_manager", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const parsed = docSnap.data();
                if (parsed.tabs) {
                    if (!parsed.tabs.verif) parsed.tabs.verif = [];
                    if (!parsed.original.verif) parsed.original.verif = [];
                    if (parsed.notes === undefined) parsed.notes = "";
                    appState = parsed;
                }
            } else {
                // Jika akun baru dan belum punya data sama sekali, buat data kosong awal
                appState = {
                    currentTab: 'rumah_tangga',
                    tabs: { rumah_tangga: [], usaha_micro: [], verifikasi: [], opsi_lain: [], verif: [] },
                    original: { rumah_tangga: [], usaha_micro: [], verifikasi: [], opsi_lain: [], verif: [] },
                    notes: ""
                };
            }
            
            // Terapkan data milik akun aktif ke UI
            notesInput.value = appState.notes || ""; 
            updateTabUI();
            checkDisplayMode();
            updateTimestamp();
        } catch (error) {
            console.error("Gagal memuat data cloud:", error);
            saveIndicator.textContent = "GAGAL MEMUAT DATA AKUN!";
        }
    } else {
        currentUser = null;
    }
});

// Fungsi Simpan Otomatis ke Cloud Firebase (Spesifik per User ID)
async function saveState() {
    if (!currentUser) return; 
    
    saveIndicator.textContent = "MENYIMPAN KE CLOUD...";
    try {
        // PERUBAHAN DI SINI: Menyimpan data ke kamar dokumen milik sendiri (currentUser.uid)
        const docRef = doc(db, "data_pro_manager", currentUser.uid);
        await setDoc(docRef, appState); 
        
        const now = new Date();
        const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        saveIndicator.textContent = `DATA ANDA TERSIMPAN (${getTodayString()} ${time})`;
    } catch (error) {
        console.error("Gagal menyimpan ke cloud:", error);
        saveIndicator.textContent = "KONEKSI KELUARGA DATA GAGAL!";
    }
}

function getTodayString() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${d}-${m}-${y}`;
}

function updateTimestamp() {
    saveIndicator.textContent = `TERHUBUNG DENGAN CLOUD CLOUD FIRESTORE`;
}

// --- NAVIGATION BAR ---
window.switchTab = function(tabKey) {
    appState.currentTab = tabKey;
    closeAndClearSearch();
    updateTabUI();
    checkDisplayMode();
    saveState();
}

function updateTabUI() {
    Object.keys(categories).forEach(key => {
        const btn = document.getElementById(`tab-${key}`);
        if (btn) {
            if (key === appState.currentTab) {
                btn.className = "flex-1 min-w-fit px-4 py-3 rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800";
            } else {
                btn.className = "flex-1 min-w-fit px-4 py-3 rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
            }
        }
    });
    inputCategoryName.textContent = categories[appState.currentTab];
}

function checkDisplayMode() {
    const currentTabData = appState.tabs[appState.currentTab];
    if (currentTabData && currentTabData.length > 0) {
        document.getElementById('inputSection').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
        renderList();
    } else {
        document.getElementById('inputSection').classList.remove('hidden');
        document.getElementById('mainDashboard').classList.add('hidden');
    }
}

// --- INPUT PROCESSING ---
document.getElementById('btnLoadData').onclick = () => {
    const text = rawInput.value.trim();
    if (!text) return;

    const lines = text.split('\n')
                      .map(l => l.trim())
                      .filter(l => l.length > 0)
                      .map(val => ({ val, marked: false, highlighted: false, lastCopied: "" }));

    appState.tabs[appState.currentTab] = lines;
    appState.original[appState.currentTab] = JSON.parse(JSON.stringify(lines));
    
    rawInput.value = '';
    saveState();
    checkDisplayMode();
};

// --- RENDERING CORE ---
function renderList() {
    const list = appState.tabs[appState.currentTab] || [];
    const todayStr = getTodayString();
    
    const total = list.length;
    const totalX = list.filter(item => item.marked).length;
    const totalAktif = total - totalX;

    totalCount.textContent = total;
    activeCountEl.textContent = totalAktif;
    xCountEl.textContent = totalX;
    
    if (total === 0) return;

    const itemsWithOriginalIndex = list.map((item, originalIdx) => ({ item, originalIdx }));
    const query = searchQuery.toLowerCase().trim();
    const filteredItems = itemsWithOriginalIndex.filter(obj => obj.item.val.toLowerCase().includes(query));

    if (filteredItems.length === 0 && query !== '') {
        dataListContainer.innerHTML = `<div class="p-8 text-center text-sm text-slate-400 italic">Tidak ada data yang cocok dengan "${searchQuery}"</div>`;
        return;
    }

    dataListContainer.innerHTML = filteredItems.map((obj) => {
        const item = obj.item;
        const idx = obj.originalIdx;
        const isCopiedToday = item.lastCopied === todayStr;
        const isSalinDisabled = item.marked || isCopiedToday; 
        const isPakaiDisabled = item.marked;                  

        let rowClass = "group flex items-center justify-between p-4 transition-all ";
        if (item.marked) {
            rowClass += "marked-item";
        } else {
            if (item.highlighted) {
                rowClass += "bg-amber-500/10 dark:bg-amber-500/20 border-l-4 border-amber-500 ";
            }
            if (isCopiedToday) {
                rowClass += "copied-today-item";
            } else if (!item.highlighted) {
                rowClass += "hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10";
            }
        }

        return `
        <div class="${rowClass.trim()}">
            <div class="flex items-center gap-4">
                <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 w-6">${idx + 1}</span>
                <div class="font-mono text-base tracking-widest ${item.marked ? 'marked-text' : (isCopiedToday ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-60' : 'text-slate-700 dark:text-slate-200')} select-all">
                    ${item.val}
                </div>
                ${isCopiedToday ? '<span class="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 font-bold uppercase tracking-wider"><i class="fa-solid fa-check-double mr-1"></i>Selesai Hari Ini</span>' : ''}
            </div>
            <div class="flex gap-2">
                <button onclick="toggleHighlight(${idx})" class="w-10 h-10 flex items-center justify-center rounded-lg border ${item.highlighted ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20' : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-500'} transition cursor-pointer" title="Beri Penanda Warna">
                    <i class="fa-solid fa-highlighter text-sm"></i>
                </button>

                <button onclick="toggleMark(${idx})" class="w-10 h-10 flex items-center justify-center rounded-lg border ${item.marked ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20' : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-rose-500 hover:text-rose-500'} transition cursor-pointer" title="Beri Tanda X">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
                
                <button onclick="copyData('${item.val}', ${idx})" 
                        class="px-4 py-2 text-xs font-bold rounded-lg border transition cursor-pointer 
                        ${isSalinDisabled ? 'bg-slate-100 dark:bg-slate-700 border-transparent text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:text-slate-200'}"
                        ${isSalinDisabled ? 'disabled' : ''}>
                    SALIN
                </button>

                <button onclick="markUsed(${idx})" 
                        class="px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer
                        ${isPakaiDisabled ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}"
                        ${isPakaiDisabled ? 'disabled' : ''}>
                    PAKAI
                </button>
            </div>
        </div>
    `}).join('');
}

// --- LINE MANIPULATION ---
window.toggleHighlight = function(idx) {
    const list = appState.tabs[appState.currentTab];
    list[idx].highlighted = !list[idx].highlighted;
    saveState();
    renderList();
}

window.toggleMark = function(idx) {
    const list = appState.tabs[appState.currentTab];
    const item = list.splice(idx, 1)[0];
    item.marked = !item.marked;
    
    if (item.marked) {
        list.push(item);
    } else {
        const firstXIdx = list.findIndex(i => i.marked);
        if (firstXIdx === -1) { list.push(item); } 
        else { list.splice(firstXIdx, 0, item); }
    }
    saveState();
    renderList();
}

window.copyData = function(val, idx) {
    const list = appState.tabs[appState.currentTab];
    if (list[idx].marked || list[idx].lastCopied === getTodayString()) return; 

    navigator.clipboard.writeText(val).then(() => {
        list[idx].lastCopied = getTodayString();
        saveState();
        renderList();

        toast.classList.remove('opacity-0');
        setTimeout(() => toast.classList.add('opacity-0'), 1200);
    });
}

window.markUsed = function(idx) {
    const list = appState.tabs[appState.currentTab];
    const item = list.splice(idx, 1)[0];
    
    const firstXIdx = list.findIndex(i => i.marked);
    if (firstXIdx === -1) { list.push(item); } 
    else { list.splice(firstXIdx, 0, item); }
    saveState();
    renderList();
}

// --- LOGIKA TOGGLE & REALTIME CATATAN ---
document.getElementById('btnToggleNotes').onclick = () => {
    const container = document.getElementById('notesContainer');
    const isHidden = container.classList.toggle('hidden');
    if (!isHidden) { notesInput.focus(); }
};

notesInput.oninput = (e) => {
    appState.notes = e.target.value;
    saveState(); 
};

// --- LOGIKA TOGGLE INPUT PENCARIAN ---
document.getElementById('btnToggleSearch').onclick = () => {
    const container = document.getElementById('searchContainer');
    const isHidden = container.classList.toggle('hidden');
    if (!isHidden) {
        const input = document.getElementById('searchInput');
        input.focus();
    } else {
        closeAndClearSearch();
    }
};

document.getElementById('searchInput').oninput = (e) => {
    searchQuery = e.target.value;
    const btnClearSearch = document.getElementById('btnClearSearch');
    if (searchQuery) { btnClearSearch.classList.remove('hidden'); } 
    else { btnClearSearch.classList.add('hidden'); }
    renderList();
};

document.getElementById('btnClearSearch').onclick = () => {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('btnClearSearch').classList.add('hidden');
    renderList();
    document.getElementById('searchInput').focus();
};

function closeAndClearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('btnClearSearch').classList.add('hidden');
    document.getElementById('searchContainer').classList.add('hidden');
    renderList();
}

// --- ARCHIVE ENGINE ---
document.getElementById('btnExport').onclick = () => {
    const dataStr = JSON.stringify(appState);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `DATAPRO_CLOUD_BACKUP_${getTodayString()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

window.handleImportTrigger = () => { document.getElementById('fileImport').click(); };
document.getElementById('btnImport').onclick = window.handleImportTrigger;

document.getElementById('fileImport').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const parsedData = JSON.parse(event.target.result);
            if (!parsedData.tabs || !parsedData.currentTab) {
                alert('Gagal memulihkan: Format dokumen cadangan salah/rusak.');
                return;
            }
            if (confirm('Sistem mendeteksi file cadangan. Sinkronisasikan langsung ke Cloud Firebase?')) {
                if (!parsedData.tabs.verif) parsedData.tabs.verif = [];
                if (!parsedData.original.verif) parsedData.original.verif = [];
                if (parsedData.notes === undefined) parsedData.notes = "";
                
                appState = parsedData;
                notesInput.value = appState.notes; 
                await saveState(); 
                closeAndClearSearch();
                checkDisplayMode();
                alert('BERHASIL! Seluruh data cadangan disinkronkan ke Cloud Firebase.');
            }
        } catch (err) {
            alert('Error: Dokumen tersebut bukan arsip cadangan resmi.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
};

// --- CONTROLS ---
document.getElementById('btnShuffle').onclick = () => {
    const list = appState.tabs[appState.currentTab];
    const activeItems = list.filter(i => !i.marked);
    const xItems = list.filter(i => i.marked);
    
    if (activeItems.length <= 1) return;
    
    for (let i = activeItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeItems[i], activeItems[j]] = [activeItems[j], activeItems[i]];
    }
    
    appState.tabs[appState.currentTab] = [...activeItems, ...xItems];
    saveState();
    renderList();
};

document.getElementById('btnReset').onclick = () => {
    if (confirm(`Reset urutan data ${categories[appState.currentTab]} kembali ke struktur awal?`)) {
        appState.tabs[appState.currentTab] = JSON.parse(JSON.stringify(appState.original[appState.currentTab]));
        saveState();
        renderList();
    }
};

document.getElementById('btnClear').onclick = () => {
    const currentName = categories[appState.currentTab];
    if (confirm(`Hapus seluruh data kategori [${currentName}]? Tab lainnya TIDAK akan terhapus.`)) {
        appState.tabs[appState.currentTab] = [];
        appState.original[appState.currentTab] = [];
        saveState();
        closeAndClearSearch();
        checkDisplayMode();
    }
};

// --- GRAPHICS & CONTRAST ---
function initTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'dark') { htmlEl.classList.add('dark'); } 
    else { htmlEl.classList.remove('dark'); }
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = htmlEl.classList.contains('dark');
    const icon = document.getElementById('themeIcon');
    icon.className = isDark ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-indigo-600';
}

document.getElementById('themeToggle').onclick = () => {
    const isDark = htmlEl.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
};

initTheme();