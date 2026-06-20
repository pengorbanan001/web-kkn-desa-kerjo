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
  
  // FITUR BARU: Menyimpan identitas user yang sedang login
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  // State Jurnal
  const [judul, setJudul] = useState("");
  const [isiKegiatan, setIsiKegiatan] = useState("");
  const [fileFoto, setFileFoto] = useState<File | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [statusJurnal, setStatusJurnal] = useState("");

  // State Profil Desa
  const [sejarah, setSejarah] = useState("");
  const [visiMisi, setVisiMisi] = useState("");
  const [potensi, setPotensi] = useState("");
  const [statusProfil, setStatusProfil] = useState("");

  // State Manajemen Anggota (Hanya untuk Admin)
  const [namaAnggota, setNamaAnggota] = useState("");
  const [emailAnggota, setEmailAnggota] = useState("");
  const [roleAnggota, setRoleAnggota] = useState("user");
  const [jurusanAnggota, setJurusanAnggota] = useState("");
  const [statusAnggota, setStatusAnggota] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        // Mengecek jabatan user di database
        const userDoc = await getDoc(doc(db, "users", user.email || ""));
        if (userDoc.exists()) {
          setCurrentUserRole(userDoc.data().role);
          setCurrentUserName(userDoc.data().nama);
        } else {
          setCurrentUserRole("user"); // Default jika tidak ditemukan
          setCurrentUserName(user.email || "Anggota");
        }
        setIsCheckingAuth(false);
      }
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
        
        const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
        const hasil = await tanggapan.json();
        
        if (hasil.success) linkGambar = hasil.data.url;
        else return setStatusJurnal("Gagal mengunggah foto.");
      }

      setStatusJurnal("Menyimpan jurnal ke database...");
      await addDoc(collection(db, "jurnal_kkn"), {
        judul: judul,
        kegiatan: isiKegiatan,
        tanggal: new Date(tanggal).toISOString(),
        gambar: linkGambar,
        penulis: currentUserName // Menyimpan siapa yang menulis jurnal
      });

      setStatusJurnal("Kegiatan berhasil disimpan!");
      setJudul(""); setIsiKegiatan(""); setFileFoto(null); setTanggal(new Date().toISOString().split('T')[0]);
      const fileInput = document.getElementById("inputFoto") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setTimeout(() => setStatusJurnal(""), 4000);
    } catch (error) {
      setStatusJurnal("Gagal menyimpan data.");
    }
  };

  const simpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusProfil("Menyimpan pembaruan...");
    try {
      await setDoc(doc(db, "profil_desa", "info_utama"), {
        sejarah: sejarah, visiMisi: visiMisi, potensi: potensi, terakhirUpdate: new Date().toISOString()
      });
      setStatusProfil("Teks Profil Desa berhasil diperbarui!");
      setTimeout(() => setStatusProfil(""), 3000);
    } catch (error) {
      setStatusProfil("Gagal memperbarui profil.");
    }
  };

  // FITUR BARU: Menyimpan data anggota baru ke Firestore
  const tambahAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAnggota("Mendaftarkan anggota...");
    try {
      // Menyimpan ke laci "users" dengan ID berupa email
      await setDoc(doc(db, "users", emailAnggota.toLowerCase()), {
        nama: namaAnggota,
        email: emailAnggota.toLowerCase(),
        role: roleAnggota,
        jurusan: jurusanAnggota,
        foto: "", // Foto dikosongkan dulu, biar anggota yang edit sendiri nanti
        terdaftarPada: new Date().toISOString()
      });
      setStatusAnggota("Anggota berhasil didaftarkan ke database!");
      setNamaAnggota(""); setEmailAnggota(""); setJurusanAnggota(""); setRoleAnggota("user");
      setTimeout(() => setStatusAnggota(""), 4000);
    } catch (error) {
      setStatusAnggota("Gagal mendaftarkan anggota.");
    }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center">Memeriksa akses...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* SIDEBAR DINAMIS */}
      <aside className="w-full md:w-64 bg-green-800 text-white p-6 flex flex-col shadow-xl z-10">
        <h2 className="text-2xl font-bold mb-2 text-center md:text-left">Ruang Kendali</h2>
        <p className="text-green-300 text-sm mb-6 text-center md:text-left">Halo, {currentUserName}</p>
        
        <nav className="flex flex-row md:flex-col gap-2 md:gap-4 text-green-100 mb-4 md:mb-0 flex-wrap justify-center">
          <button onClick={() => setMenuAktif("jurnal")} className={`flex-1 md:w-full text-center md:text-left py-2 px-2 md:px-4 rounded text-sm md:text-base transition-all duration-300 ${menuAktif === "jurnal" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Tulis Jurnal</button>
          
          {/* Menu Edit Profil Desa hanya muncul untuk Admin & Bendahara (opsional) */}
          {(currentUserRole === "admin" || currentUserRole === "bendahara") && (
            <button onClick={() => setMenuAktif("profil")} className={`flex-1 md:w-full text-center md:text-left py-2 px-2 md:px-4 rounded text-sm md:text-base transition-all duration-300 ${menuAktif === "profil" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Edit Profil Desa</button>
          )}

          {/* Menu Manajemen Anggota HANYA MUNCUL JIKA ADMIN */}
          {currentUserRole === "admin" && (
            <button onClick={() => setMenuAktif("anggota")} className={`flex-1 md:w-full text-center md:text-left py-2 px-2 md:px-4 rounded text-sm md:text-base transition-all duration-300 ${menuAktif === "anggota" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Anggota KKN</button>
          )}
        </nav>
        
        <button onClick={handleLogout} className="mt-auto w-full bg-red-600 py-2 rounded-lg font-bold hover:bg-red-700 transition-transform duration-300 hover:scale-105 text-sm md:text-base shadow-lg">Logout</button>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {/* --- MENU JURNAL --- */}
        {menuAktif === "jurnal" && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md w-full max-w-2xl animate-fade-in">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Buat Jurnal Baru</h3>
            <form onSubmit={simpanJurnal} className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">Judul Kegiatan</label><input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1">Tanggal Kegiatan</label><input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none" /></div>
                <div><label className="block text-sm font-semibold mb-1">Upload Foto</label><input id="inputFoto" type="file" accept="image/*" onChange={(e) => { if (e.target.files) setFileFoto(e.target.files[0]); }} className="w-full border p-1.5 rounded-md bg-gray-50" /></div>
              </div>
              <div><label className="block text-sm font-semibold mb-1">Cerita Kegiatan</label><textarea required value={isiKegiatan} onChange={(e) => setIsiKegiatan(e.target.value)} rows={5} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none"></textarea></div>
              <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-transform hover:scale-105">Simpan Jurnal</button>
              {statusJurnal && <div className={`mt-4 p-3 rounded-md text-sm font-semibold ${statusJurnal.includes("Gagal") ? "bg-red-100 text-red-700" : statusJurnal.includes("berhasil") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{statusJurnal}</div>}
            </form>
          </div>
        )}

        {/* --- MENU PROFIL DESA --- */}
        {menuAktif === "profil" && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md w-full max-w-3xl animate-fade-in">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Ubah Teks Profil Desa</h3>
            <form onSubmit={simpanProfil} className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">Sejarah Singkat</label><textarea required value={sejarah} onChange={(e) => setSejarah(e.target.value)} rows={4} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
              <div><label className="block text-sm font-semibold mb-1">Visi & Misi</label><textarea required value={visiMisi} onChange={(e) => setVisiMisi(e.target.value)} rows={4} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
              <div><label className="block text-sm font-semibold mb-1">Potensi Desa</label><textarea required value={potensi} onChange={(e) => setPotensi(e.target.value)} rows={4} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
              <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-transform hover:scale-105">Simpan Profil</button>
              {statusProfil && <p className="mt-3 text-sm font-semibold text-green-600">{statusProfil}</p>}
            </form>
          </div>
        )}

        {/* --- MENU MANAJEMEN ANGGOTA --- */}
        {menuAktif === "anggota" && currentUserRole === "admin" && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md w-full max-w-2xl animate-fade-in">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Daftarkan Anggota Baru</h3>
            <p className="text-sm text-gray-500 mb-6">Penting: Setelah mendaftarkan biodata ini, Admin harus membuatkan *password* secara manual di Firebase Console Authentication agar anggota bisa login.</p>
            
            <form onSubmit={tambahAnggota} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Lengkap</label>
                  <input type="text" required value={namaAnggota} onChange={(e) => setNamaAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email (Harus Aktif)</label>
                  <input type="email" required value={emailAnggota} onChange={(e) => setEmailAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Program Studi / Jurusan</label>
                  <input type="text" required value={jurusanAnggota} onChange={(e) => setJurusanAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Jabatan (Role)</label>
                  <select value={roleAnggota} onChange={(e) => setRoleAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="user">Anggota Biasa</option>
                    <option value="bendahara">Bendahara</option>
                    <option value="admin">Admin / Koordinator</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-transform hover:scale-105 shadow-md">
                Simpan Biodata Anggota
              </button>
              
              {statusAnggota && (
                <div className={`mt-4 p-3 rounded-md text-sm font-semibold ${statusAnggota.includes("Gagal") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {statusAnggota}
                </div>
              )}
            </form>
          </div>
        )}

      </main>
    </div>
  );
}