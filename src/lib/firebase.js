import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// SILAKAN GANTI BAGIAN DI BAWAH INI DENGAN KODE DARI BROWSER ANDA
const firebaseConfig = {
  apiKey: "AIzaSyAr1u4pr8UPqu7zVu-aT4bDiCZ8nf6UOu4",
  authDomain: "kkn-desa-kerjo.firebaseapp.com",
  projectId: "kkn-desa-kerjo",
  storageBucket: "kkn-desa-kerjo.firebasestorage.app",
  messagingSenderId: "246126530611",
  appId: "1:246126530611:web:715b7f71f839d01a769346"
};

// Logika agar Firebase tidak berjalan berulang kali
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Menyiapkan alat Database, Login, dan Penyimpanan Foto
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);