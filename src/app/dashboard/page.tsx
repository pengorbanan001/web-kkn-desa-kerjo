"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
// FITUR BARU: Tambahkan updateDoc dan deleteDoc untuk fitur Edit & Hapus Jurnal
import { collection, addDoc, doc, setDoc, getDoc, query, where, getDocs, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [menuAktif, setMenuAktif] = useState("jurnal"); 
  
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  // --- STATE JURNAL (DIPERBARUI UNTUK EDIT & MULTI-FOTO) ---
  const [judul, setJudul] = useState("");
  const [isiKegiatan, setIsiKegiatan] = useState("");
  const [fileFotoList, setFileFotoList] = useState<FileList | null>(null); // FileList untuk banyak foto
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [statusJurnal, setStatusJurnal] = useState("");
  
  const [riwayatJurnal, setRiwayatJurnal] = useState<any[]>([]);
  const [editJurnalId, setEditJurnalId] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string[]>([]); // Menyimpan foto lama saat mode edit

  // --- STATE PROFIL, ANGGOTA, KEUANGAN (TETAP AMAN) ---
  const [sejarah, setSejarah] = useState(""); const [visiMisi, setVisiMisi] = useState(""); const [potensi, setPotensi] = useState(""); const [statusProfil, setStatusProfil] = useState("");
  const [namaAnggota, setNamaAnggota] = useState(""); const [emailAnggota, setEmailAnggota] = useState(""); const [roleAnggota, setRoleAnggota] = useState("user"); const [jurusanAnggota, setJurusanAnggota] = useState(""); const [statusAnggota, setStatusAnggota] = useState("");
  const [tipeUang, setTipeUang] = useState("Pemasukan"); const [keteranganUang, setKeteranganUang] = useState(""); const [nominalUang, setNominalUang] = useState(""); const [tanggalUang, setTanggalUang] = useState(new Date().toISOString().split('T')[0]); const [statusKeuangan, setStatusKeuangan] = useState("");
  const [riwayatKeuangan, setRiwayatKeuangan] = useState<any[]>([]); const [totalPemasukan, setTotalPemasukan] = useState(0); const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  // --- FUNGSI AMBIL DATA ---
  const ambilDataKeuangan = async () => {
    try {
      const q = query(collection(db, "keuangan_kkn"), orderBy("tanggal", "desc"));
      const snap = await getDocs(q);
      let masuk = 0; let keluar = 0; let dataSementara: any[] = [];
      snap.forEach(doc => {
        const data = doc.data(); dataSementara.push({ id: doc.id, ...data });
        if (data.tipe === "Pemasukan") masuk += Number(data.nominal); if (data.tipe === "Pengeluaran") keluar += Number(data.nominal);
      });
      setRiwayatKeuangan(dataSementara); setTotalPemasukan(masuk); setTotalPengeluaran(keluar);
    } catch (error) { console.error("Gagal memuat keuangan"); }
  };

  const ambilDataJurnal = async () => {
    try {
      const q = query(collection(db, "jurnal_kkn"), orderBy("tanggal", "desc"));
      const snap = await getDocs(q);
      const dataSementara: any[] = [];
      snap.forEach(doc => dataSementara.push({ id: doc.id, ...doc.data() }));
      setRiwayatJurnal(dataSementara);
    } catch (error) { console.error("Gagal memuat jurnal"); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); } else {
        try {
          const q = query(collection(db, "users"), where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setCurrentUserRole(userData.role); setCurrentUserName(userData.nama);
            if (userData.role === "admin" || userData.role === "bendahara") ambilDataKeuangan();
            ambilDataJurnal(); // Tarik riwayat jurnal
          } else { setCurrentUserRole("user"); setCurrentUserName(user.email || "Anggota"); }
        } catch (error) { setCurrentUserRole("user"); }
        setIsCheckingAuth(false);
      }
    });
    const ambilProfil = async () => {
      const docSnap = await getDoc(doc(db, "profil_desa", "info_utama"));
      if (docSnap.exists()) { setSejarah(docSnap.data().sejarah || ""); setVisiMisi(docSnap.data().visiMisi || ""); setPotensi(docSnap.data().potensi || ""); }
    };
    ambilProfil(); return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push("/"); };
  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  // --- FUNGSI JURNAL (MULTI-UPLOAD & EDIT) ---
  const simpanJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusJurnal("Memproses data, mohon tunggu...");
    try {
      let tautanGambarBaru: string[] = [];

      // PROSES MULTI-UPLOAD GAMBAR KE IMGBB
      if (fileFotoList && fileFotoList.length > 0) {
        setStatusJurnal(`Mengunggah ${fileFotoList.length} foto ke server...`);
        
        // --- MASUKKAN KEMBALI API KEY IMGBB ANDA DI SINI ---
        const apiKeyImgBB = "cc8bed1e0fd495258b6dd6cf78f7301a"; 
        
        const uploadPromises = Array.from(fileFotoList).map(async (file) => {
          const formData = new FormData(); formData.append("image", file);
          const tanggapan = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, { method: "POST", body: formData });
          const hasil = await tanggapan.json();
          return hasil.success ? hasil.data.url : null;
        });
        
        const hasilUpload = await Promise.all(uploadPromises);
        tautanGambarBaru = hasilUpload.filter(url => url !== null); // Buang yang gagal
      }

      // Gabungkan gambar lama (jika edit) dengan gambar baru
      const gambarFinal = [...gambarLama, ...tautanGambarBaru];

      if (editJurnalId) {
        setStatusJurnal("Memperbarui jurnal...");
        await updateDoc(doc(db, "jurnal_kkn", editJurnalId), {
          judul: judul, kegiatan: isiKegiatan, tanggal: new Date(tanggal).toISOString(), gambar: gambarFinal
        });
        setStatusJurnal("Jurnal berhasil diperbarui!");
      } else {
        setStatusJurnal("Menyimpan jurnal baru...");
        await addDoc(collection(db, "jurnal_kkn"), {
          judul: judul, kegiatan: isiKegiatan, tanggal: new Date(tanggal).toISOString(), gambar: gambarFinal, penulis: currentUserName
        });
        setStatusJurnal("Jurnal baru berhasil disimpan!");
      }

      batalEditJurnal();
      ambilDataJurnal();
      setTimeout(() => setStatusJurnal(""), 4000);
    } catch (error) { setStatusJurnal("Gagal menyimpan data jurnal."); console.error(error); }
  };

  const mulaiEditJurnal = (item: any) => {
    setEditJurnalId(item.id);
    setJudul(item.judul);
    setIsiKegiatan(item.kegiatan);
    setTanggal(item.tanggal ? item.tanggal.split('T')[0] : new Date().toISOString().split('T')[0]);
    
    // Konversi gambar lama ke bentuk Array (Kompabilitas data lama vs baru)
    const gambarArray = Array.isArray(item.gambar) ? item.gambar : item.gambar ? [item.gambar] : [];
    setGambarLama(gambarArray);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll ke atas
  };

  const batalEditJurnal = () => {
    setEditJurnalId(null); setJudul(""); setIsiKegiatan(""); setGambarLama([]); setFileFotoList(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    const fileInput = document.getElementById("inputFoto") as HTMLInputElement; if (fileInput) fileInput.value = "";
  };

  const hapusJurnal = async (id: string) => {
    if (confirm("Yakin ingin menghapus jurnal dokumentasi ini?")) {
      await deleteDoc(doc(db, "jurnal_kkn", id));
      ambilDataJurnal();
    }
  };

  // --- FUNGSI PROFIL & LAINNYA ---
  const simpanProfil = async (e: React.FormEvent) => { e.preventDefault(); setStatusProfil("Menyimpan..."); try { await setDoc(doc(db, "profil_desa", "info_utama"), { sejarah, visiMisi, potensi, terakhirUpdate: new Date().toISOString() }); setStatusProfil("Berhasil!"); setTimeout(() => setStatusProfil(""), 3000); } catch (e) { setStatusProfil("Gagal"); } };
  const simpanKeuangan = async (e: React.FormEvent) => { e.preventDefault(); setStatusKeuangan("Menyimpan..."); try { await addDoc(collection(db, "keuangan_kkn"), { tipe: tipeUang, keterangan: keteranganUang, nominal: Number(nominalUang), tanggal: new Date(tanggalUang).toISOString(), penginput: currentUserName }); setStatusKeuangan("Berhasil dicatat!"); setKeteranganUang(""); setNominalUang(""); ambilDataKeuangan(); setTimeout(() => setStatusKeuangan(""), 3000); } catch (e) { setStatusKeuangan("Gagal."); } };
  const hapusKeuangan = async (id: string) => { if (confirm("Yakin hapus transaksi ini?")) { await deleteDoc(doc(db, "keuangan_kkn", id)); ambilDataKeuangan(); } };
  const tambahAnggota = async (e: React.FormEvent) => { e.preventDefault(); setStatusAnggota("Mendaftarkan..."); try { await setDoc(doc(db, "users", emailAnggota.toLowerCase()), { nama: namaAnggota, email: emailAnggota.toLowerCase(), role: roleAnggota, jurusan: jurusanAnggota, foto: "", terdaftarPada: new Date().toISOString() }); setStatusAnggota("Berhasil didaftarkan!"); setNamaAnggota(""); setEmailAnggota(""); setJurusanAnggota(""); setRoleAnggota("user"); setTimeout(() => setStatusAnggota(""), 4000); } catch (e) { setStatusAnggota("Gagal."); } };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center">Memeriksa akses...</div>;

  const dataGrafik = { labels: ['Pemasukan', 'Pengeluaran'], datasets: [ { data: [totalPemasukan, totalPengeluaran], backgroundColor: ['#22c55e', '#ef4444'], hoverBackgroundColor: ['#16a34a', '#dc2626'], borderWidth: 0 } ] };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-green-800 text-white p-6 flex flex-col shadow-xl z-10">
        <h2 className="text-2xl font-bold mb-2 text-center md:text-left">Ruang Kendali</h2>
        <div className="text-center md:text-left mb-6">
          <p className="text-green-300 text-sm font-semibold">{currentUserName}</p>
          <span className="bg-green-600 px-2 py-0.5 rounded-full text-xs capitalize shadow-sm">{currentUserRole}</span>
        </div>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-3 text-green-100 mb-4 md:mb-0 flex-wrap justify-center">
          <button onClick={() => setMenuAktif("jurnal")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "jurnal" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Jurnal & Dokumentasi</button>
          {(currentUserRole === "admin" || currentUserRole === "bendahara") && ( <button onClick={() => setMenuAktif("profil")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "profil" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Edit Profil</button> )}
          {(currentUserRole === "admin" || currentUserRole === "bendahara") && ( <button onClick={() => setMenuAktif("keuangan")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "keuangan" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Buku Keuangan</button> )}
          {currentUserRole === "admin" && ( <button onClick={() => setMenuAktif("anggota")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "anggota" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Anggota KKN</button> )}
        </nav>
        <button onClick={handleLogout} className="mt-auto w-full bg-red-600 py-2 rounded-lg font-bold hover:bg-red-700 transition-transform hover:scale-105 text-sm shadow-lg">Logout</button>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">

        {/* --- MENU JURNAL (EDIT & MULTI-FOTO) --- */}
        {menuAktif === "jurnal" && (
          <div className="w-full max-w-5xl animate-fade-in space-y-8">
            
            {/* Form Input/Edit */}
            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-bold text-gray-800">
                  {editJurnalId ? "✏️ Edit Jurnal Kegiatan" : "📝 Buat Jurnal Baru"}
                </h3>
                {editJurnalId && (
                  <button onClick={batalEditJurnal} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded">Batal Edit</button>
                )}
              </div>

              <form onSubmit={simpanJurnal} className="space-y-4">
                <div><label className="block text-sm font-semibold mb-1">Judul Kegiatan</label><input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold mb-1">Tanggal Kegiatan</label><input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                  <div>
                    {/* INPUT MULTI FOTO */}
                    <label className="block text-sm font-semibold mb-1">Upload Foto (Bisa Pilih Banyak)</label>
                    <input id="inputFoto" type="file" accept="image/*" multiple onChange={(e) => setFileFotoList(e.target.files)} className="w-full border p-1.5 rounded-md bg-gray-50" />
                    {editJurnalId && gambarLama.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Mengupload foto baru akan menambahkannya ke foto lama.</p>
                    )}
                  </div>
                </div>

                <div><label className="block text-sm font-semibold mb-1">Cerita Kegiatan</label><textarea required value={isiKegiatan} onChange={(e) => setIsiKegiatan(e.target.value)} rows={5} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
                <button type="submit" className="bg-blue-600 w-full md:w-auto text-white font-bold py-2 px-8 rounded-md hover:bg-blue-700 transition-transform hover:scale-105 shadow-md">
                  {editJurnalId ? "Simpan Perubahan" : "Posting Jurnal"}
                </button>
                {statusJurnal && <div className={`mt-4 p-3 rounded-md text-sm font-semibold text-center ${statusJurnal.includes("Gagal") ? "bg-red-100 text-red-700" : statusJurnal.includes("berhasil") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 animate-pulse"}`}>{statusJurnal}</div>}
              </form>
            </div>

            {/* Tabel Riwayat Jurnal (Hanya Admin / Pembuat) */}
            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Riwayat Jurnal Anda</h4>
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Judul Kegiatan</th>
                    <th className="py-3 px-4 text-center">Jml. Foto</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {riwayatJurnal.map((item) => {
                    const jumlahFoto = Array.isArray(item.gambar) ? item.gambar.length : item.gambar ? 1 : 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{item.judul}</td>
                        <td className="py-3 px-4 text-center text-gray-500">{jumlahFoto}</td>
                        <td className="py-3 px-4 flex justify-center space-x-2">
                          <button onClick={() => mulaiEditJurnal(item)} className="text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 font-semibold transition">Edit</button>
                          <button onClick={() => hapusJurnal(item.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100 font-semibold transition">Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* --- MENU PROFIL --- */}
        {menuAktif === "profil" && (
          <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-3xl animate-fade-in"><h3 className="text-xl font-bold text-gray-800 mb-4">Ubah Teks Profil</h3><form onSubmit={simpanProfil} className="space-y-4"><div><label className="block text-sm font-semibold mb-1">Sejarah Singkat</label><textarea required value={sejarah} onChange={(e) => setSejarah(e.target.value)} rows={4} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div><div><label className="block text-sm font-semibold mb-1">Visi & Misi</label><textarea required value={visiMisi} onChange={(e) => setVisiMisi(e.target.value)} rows={4} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div><div><label className="block text-sm font-semibold mb-1">Potensi Desa</label><textarea required value={potensi} onChange={(e) => setPotensi(e.target.value)} rows={4} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div><button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">Simpan Profil</button>{statusProfil && <p className="mt-3 text-sm font-semibold text-green-600">{statusProfil}</p>}</form></div>
        )}

        {/* --- MENU KEUANGAN --- */}
        {menuAktif === "keuangan" && (
          <div className="w-full max-w-5xl animate-fade-in space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Manajemen Keuangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500"><p className="text-sm text-gray-500 font-semibold mb-1">Total Saldo Saat Ini</p><p className="text-2xl font-bold text-gray-800">{formatRupiah(totalPemasukan - totalPengeluaran)}</p></div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500"><p className="text-sm text-gray-500 font-semibold mb-1">Total Pemasukan</p><p className="text-2xl font-bold text-green-600">+{formatRupiah(totalPemasukan)}</p></div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500"><p className="text-sm text-gray-500 font-semibold mb-1">Total Pengeluaran</p><p className="text-2xl font-bold text-red-600">-{formatRupiah(totalPengeluaran)}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2"><h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Catat Transaksi Baru</h4><form onSubmit={simpanKeuangan} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-1">Jenis</label><select value={tipeUang} onChange={(e) => setTipeUang(e.target.value)} className="w-full border p-2 rounded-md bg-white"><option value="Pemasukan">Pemasukan</option><option value="Pengeluaran">Pengeluaran</option></select></div><div><label className="block text-sm font-semibold mb-1">Tanggal</label><input type="date" required value={tanggalUang} onChange={(e) => setTanggalUang(e.target.value)} className="w-full border p-2 rounded-md" /></div></div><div><label className="block text-sm font-semibold mb-1">Keterangan</label><input type="text" required value={keteranganUang} onChange={(e) => setKeteranganUang(e.target.value)} className="w-full border p-2 rounded-md" /></div><div><label className="block text-sm font-semibold mb-1">Nominal (Rp)</label><input type="number" required value={nominalUang} onChange={(e) => setNominalUang(e.target.value)} min="0" className="w-full border p-2 rounded-md" /></div><button type="submit" className={`w-full text-white font-bold py-2 rounded-md ${tipeUang === "Pemasukan" ? "bg-green-600" : "bg-red-600"}`}>Simpan Transaksi</button>{statusKeuangan && <p className="text-center text-sm font-bold text-blue-600 mt-2">{statusKeuangan}</p>}</form></div>
              <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center"><h4 className="text-lg font-bold text-gray-800 mb-4">Rasio Keuangan</h4>{totalPemasukan === 0 && totalPengeluaran === 0 ? <p className="text-gray-400 text-sm">Belum ada data</p> : <div className="w-48 h-48"><Doughnut data={dataGrafik} options={{ maintainAspectRatio: false }} /></div>}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto"><h4 className="text-lg font-bold text-gray-800 mb-4">Riwayat Transaksi</h4><table className="min-w-full text-sm text-left"><thead className="bg-gray-100 text-gray-600"><tr><th className="py-3 px-4">Tanggal</th><th className="py-3 px-4">Keterangan</th><th className="py-3 px-4">Pemasukan</th><th className="py-3 px-4">Pengeluaran</th><th className="py-3 px-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-gray-100">{riwayatKeuangan.map((item) => (<tr key={item.id} className="hover:bg-gray-50"><td className="py-3 px-4">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td><td className="py-3 px-4"><p className="font-semibold">{item.keterangan}</p></td><td className="py-3 px-4 text-green-600 font-bold">{item.tipe === "Pemasukan" ? formatRupiah(item.nominal) : "-"}</td><td className="py-3 px-4 text-red-600 font-bold">{item.tipe === "Pengeluaran" ? formatRupiah(item.nominal) : "-"}</td><td className="py-3 px-4 text-center"><button onClick={() => hapusKeuangan(item.id)} className="text-red-500 font-bold hover:underline">Hapus</button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* --- MENU ANGGOTA --- */}
        {menuAktif === "anggota" && currentUserRole === "admin" && (
          <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-2xl animate-fade-in"><h3 className="text-xl font-bold text-gray-800 mb-2">Daftarkan Anggota Baru</h3><form onSubmit={tambahAnggota} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-1">Nama Lengkap</label><input type="text" required value={namaAnggota} onChange={(e) => setNamaAnggota(e.target.value)} className="w-full border p-2 rounded-md outline-none" /></div><div><label className="block text-sm font-semibold mb-1">Email</label><input type="email" required value={emailAnggota} onChange={(e) => setEmailAnggota(e.target.value)} className="w-full border p-2 rounded-md outline-none" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-1">Jurusan</label><input type="text" required value={jurusanAnggota} onChange={(e) => setJurusanAnggota(e.target.value)} className="w-full border p-2 rounded-md outline-none" /></div><div><label className="block text-sm font-semibold mb-1">Jabatan</label><select value={roleAnggota} onChange={(e) => setRoleAnggota(e.target.value)} className="w-full border p-2 rounded-md bg-white"><option value="user">Anggota</option><option value="bendahara">Bendahara</option><option value="admin">Admin</option></select></div></div><button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">Simpan Anggota</button>{statusAnggota && <div className="mt-4 p-3 rounded-md text-sm font-semibold bg-blue-100 text-blue-700">{statusAnggota}</div>}</form></div>
        )}

      </main>
    </div>
  );
}