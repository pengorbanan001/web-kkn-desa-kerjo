"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function Dashboard() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [menuAktif, setMenuAktif] = useState("jurnal"); 

  const [judul, setJudul] = useState("");
  const [isiKegiatan, setIsiKegiatan] = useState("");
  const [fileFoto, setFileFoto] = useState<File | null>(null);
  
  // FITUR BARU: State untuk Tanggal Fleksibel (Otomatis terisi tanggal hari ini)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
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

      if (fileFoto) {
        setStatusJurnal("Mengunggah foto ke server ImgBB...");
        const formData = new FormData();
        formData.append("image", fileFoto);
        
        // --- MASUKKAN KEMBALI API KEY IMGBB ANDA DI SINI ---
        const apiKeyImgBB = "cc8bed1e0fd495258b6dd6cf78f7301a"; 
        
        const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, {
          method: "POST",
          body: formData,
        });
        
        const hasil = await tanggapan.json();
        if (hasil.success) {
          linkGambar = hasil.data.url;
        } else {
          setStatusJurnal("Gagal mengunggah foto. Pastikan ukuran foto tidak terlalu besar.");
          return; 
        }
      }

      setStatusJurnal("Menyimpan jurnal ke database...");
      await addDoc(collection(db, "jurnal_kkn"), {
        judul: judul,
        kegiatan: isiKegiatan,
        // FITUR BARU: Menyimpan tanggal sesuai input manual user
        tanggal: new Date(tanggal).toISOString(),
        gambar: linkGambar 
      });

      setStatusJurnal("Kegiatan berhasil disimpan!");
      setJudul("");
      setIsiKegiatan("");
      setFileFoto(null);
      // Kembalikan input tanggal ke hari ini setelah sukses menyimpan
      setTanggal(new Date().toISOString().split('T')[0]);
      
      const fileInput = document.getElementById("inputFoto") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setTimeout(() => setStatusJurnal(""), 4000);
    } catch (error) {
      setStatusJurnal("Gagal menyimpan data. Pastikan internet stabil.");
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
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-green-800 text-white p-6 flex flex-col shadow-xl z-10">
        <h2 className="text-2xl font-bold mb-4 md:mb-8 text-center md:text-left">Admin KKN</h2>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 text-green-100 mb-4 md:mb-0">
          <button onClick={() => setMenuAktif("jurnal")} className={`flex-1 md:w-full text-center md:text-left py-2 px-2 md:px-4 rounded text-sm md:text-base transition-all duration-300 ${menuAktif === "jurnal" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>
            Tulis Jurnal
          </button>
          <button onClick={() => setMenuAktif("profil")} className={`flex-1 md:w-full text-center md:text-left py-2 px-2 md:px-4 rounded text-sm md:text-base transition-all duration-300 ${menuAktif === "profil" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>
            Edit Profil
          </button>
        </nav>
        <button onClick={handleLogout} className="mt-auto w-full bg-red-600 py-2 rounded-lg font-bold hover:bg-red-700 transition-transform duration-300 hover:scale-105 text-sm md:text-base shadow-lg">
          Logout
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Ruang Kendali</h1>
        <p className="text-sm md:text-base text-gray-600 mb-6">Kelola konten website dari sini.</p>

        {menuAktif === "jurnal" && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md w-full max-w-2xl animate-fade-in">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Buat Jurnal Baru</h3>
            <form onSubmit={simpanJurnal} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm md:text-base font-semibold mb-1">Judul Kegiatan</label>
                <input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-sm md:text-base" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FITUR BARU: Input Tanggal Fleksibel */}
                <div>
                  <label className="block text-gray-700 text-sm md:text-base font-semibold mb-1">Tanggal Kegiatan</label>
                  <input 
                    type="date" 
                    required 
                    value={tanggal} 
                    onChange={(e) => setTanggal(e.target.value)} 
                    className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-sm md:text-base" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm md:text-base font-semibold mb-1">Upload Foto</label>
                  <input 
                    id="inputFoto" type="file" accept="image/*" 
                    onChange={(e) => { if (e.target.files) setFileFoto(e.target.files[0]); }} 
                    className="w-full border border-gray-300 p-1.5 rounded-md bg-gray-50 text-sm md:text-base" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm md:text-base font-semibold mb-1">Cerita Kegiatan</label>
                <textarea required value={isiKegiatan} onChange={(e) => setIsiKegiatan(e.target.value)} rows={5} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-sm md:text-base"></textarea>
              </div>
              <button type="submit" className="w-full md:w-auto bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-transform duration-300 hover:scale-105 shadow-md">Simpan Jurnal</button>
              
              {statusJurnal && (
                <div className={`mt-4 p-3 rounded-md text-sm font-semibold ${statusJurnal.includes("Gagal") ? "bg-red-100 text-red-700" : statusJurnal.includes("berhasil") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {statusJurnal}
                </div>
              )}
            </form>
          </div>
        )}

        {menuAktif === "profil" && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md w-full max-w-3xl animate-fade-in">
             <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Ubah Teks Profil Desa</h3>
            <form onSubmit={simpanProfil} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-gray-700 text-sm md:text-base font-semibold mb-1">Sejarah Singkat</label>
                <textarea required value={sejarah} onChange={(e) => setSejarah(e.target.value)} rows={4} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"></textarea>
              </div>
              <div>
                <label className="block text-gray-700 text-sm md:text-base font-semibold mb-1">Visi & Misi</label>
                <textarea required value={visiMisi} onChange={(e) => setVisiMisi(e.target.value)} rows={4} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"></textarea>
              </div>
              <div>
                <label className="block text-gray-700 text-sm md:text-base font-semibold mb-1">Potensi Desa</label>
                <textarea required value={potensi} onChange={(e) => setPotensi(e.target.value)} rows={4} className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"></textarea>
              </div>
              <button type="submit" className="w-full md:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-transform duration-300 hover:scale-105 shadow-md">Simpan Profil Desa</button>
              {statusProfil && <p className="mt-3 text-sm font-semibold text-green-600">{statusProfil}</p>}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}