"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
// Kita HAPUS impor firebase/storage karena kita ganti pakai ImgBB
import { auth, db } from "../../lib/firebase";

export default function Dashboard() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [menuAktif, setMenuAktif] = useState("jurnal"); 

  const [judul, setJudul] = useState("");
  const [isiKegiatan, setIsiKegiatan] = useState("");
  const [fileFoto, setFileFoto] = useState<File | null>(null);
  const [statusJurnal, setStatusJurnal] = useState("");

  const [sejarah, setSejarah] = useState("");
  const [visiMisi, setVisiMisi] = useState("");
  const [potensi, setPotensi] = useState("");
  const [statusProfil, setStatusProfil] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setIsCheckingAuth(false);
    });

    const ambilProfilDesa = async () => {
      const docRef = doc(db, "profil_desa", "info_utama");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSejarah(docSnap.data().sejarah || "");
        setVisiMisi(docSnap.data().visiMisi || "");
        setPotensi(docSnap.data().potensi || "");
      }
    };

    ambilProfilDesa();
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const simpanJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusJurnal("Memproses data, mohon tunggu...");
    
    try {
      let linkGambar = "";

      // LOGIKA BARU: Mengunggah foto ke ImgBB
      if (fileFoto) {
        setStatusJurnal("Mengunggah foto ke server ImgBB...");
        
        const formData = new FormData();
        formData.append("image", fileFoto);
        
        // GANTI TEKS DI BAWAH INI DENGAN API KEY DARI WEB IMGBB ANDA
        const apiKeyImgBB = "f9984059f46392918df391f15f335e7d"; 
        
        const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, {
          method: "POST",
          body: formData,
        });
        
        const hasil = await tanggapan.json();
        
        if (hasil.success) {
          linkGambar = hasil.data.url; // Mengambil link gambar langsung dari ImgBB
        } else {
          setStatusJurnal("Gagal mengunggah foto. Pastikan ukuran foto tidak terlalu besar.");
          return; // Berhenti jika gagal upload foto
        }
      }

      setStatusJurnal("Menyimpan jurnal ke database...");
      await addDoc(collection(db, "jurnal_kkn"), {
        judul: judul,
        kegiatan: isiKegiatan,
        tanggal: new Date().toISOString(),
        gambar: linkGambar // Menyimpan URL gambar dari ImgBB ke laci database Firebase
      });

      setStatusJurnal("Kegiatan beserta foto berhasil disimpan!");
      setJudul("");
      setIsiKegiatan("");
      setFileFoto(null);
      
      // Kosongkan form input file secara manual
      const fileInput = document.getElementById("inputFoto") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setTimeout(() => setStatusJurnal(""), 4000);
    } catch (error) {
      setStatusJurnal("Gagal menyimpan data. Pastikan internet stabil.");
      console.error(error);
    }
  };

  const simpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusProfil("Menyimpan pembaruan...");
    try {
      await setDoc(doc(db, "profil_desa", "info_utama"), {
        sejarah: sejarah,
        visiMisi: visiMisi,
        potensi: potensi,
        terakhirUpdate: new Date().toISOString()
      });
      setStatusProfil("Teks Profil Desa berhasil diperbarui!");
      setTimeout(() => setStatusProfil(""), 3000);
    } catch (error) {
      setStatusProfil("Gagal memperbarui profil.");
    }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center">Memeriksa akses...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-green-800 text-white p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8">Admin KKN</h2>
        <nav className="flex-1 space-y-4 text-green-100">
          <button onClick={() => setMenuAktif("jurnal")} className={`w-full text-left block py-2 px-4 rounded ${menuAktif === "jurnal" ? "bg-green-600 font-bold text-white shadow-inner" : "hover:bg-green-700"}`}>
            Tulis Jurnal
          </button>
          <button onClick={() => setMenuAktif("profil")} className={`w-full text-left block py-2 px-4 rounded ${menuAktif === "profil" ? "bg-green-600 font-bold text-white shadow-inner" : "hover:bg-green-700"}`}>
            Edit Profil Desa
          </button>
        </nav>
        <button onClick={handleLogout} className="mt-auto w-full bg-red-600 py-2 rounded-lg font-bold hover:bg-red-700">
          Keluar (Logout)
        </button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Ruang Kendali KKN Desa Kerjo</h1>
        <p className="text-gray-600 mb-8">Pilih menu di sebelah kiri untuk mengelola konten website.</p>

        {menuAktif === "jurnal" && (
          <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Buat Jurnal Kegiatan Baru</h3>
            <form onSubmit={simpanJurnal} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Judul Kegiatan</label>
                <input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Mengajar Ngaji..." className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Upload Foto (Opsional)</label>
                <input 
                  id="inputFoto"
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files) setFileFoto(e.target.files[0]);
                  }} 
                  className="w-full border border-gray-300 p-2 rounded-md bg-gray-50" 
                />
                <p className="text-xs text-gray-500 mt-1">Sistem menggunakan ImgBB (Gratis). Maksimal ukuran file 32MB.</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Cerita/Isi Kegiatan</label>
                <textarea required value={isiKegiatan} onChange={(e) => setIsiKegiatan(e.target.value)} rows={5} placeholder="Ceritakan detail kegiatan..." className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none"></textarea>
              </div>
              <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition">Simpan Jurnal</button>
              
              {/* Tampilan Status */}
              {statusJurnal && (
                <div className={`mt-4 p-3 rounded-md text-sm font-semibold ${statusJurnal.includes("Gagal") ? "bg-red-100 text-red-700" : statusJurnal.includes("berhasil") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {statusJurnal}
                </div>
              )}
            </form>
          </div>
        )}

        {menuAktif === "profil" && (
          <div className="bg-white p-6 rounded-xl shadow-md max-w-3xl animate-fade-in">
             <h3 className="text-xl font-bold text-gray-800 mb-4">Ubah Teks Profil Desa</h3>
            <form onSubmit={simpanProfil} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Sejarah Singkat</label>
                <textarea required value={sejarah} onChange={(e) => setSejarah(e.target.value)} rows={4} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Visi & Misi</label>
                <textarea required value={visiMisi} onChange={(e) => setVisiMisi(e.target.value)} rows={4} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Potensi Desa</label>
                <textarea required value={potensi} onChange={(e) => setPotensi(e.target.value)} rows={4} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
              <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition">Simpan Profil Desa</button>
              {statusProfil && <p className="mt-3 text-sm font-semibold text-green-600">{statusProfil}</p>}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}