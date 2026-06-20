"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, query, where, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

// FITUR BARU: Impor alat pembuat Grafik Donat
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Mengaktifkan elemen grafik
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [menuAktif, setMenuAktif] = useState("jurnal"); 
  
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  // --- STATE JURNAL ---
  const [judul, setJudul] = useState("");
  const [isiKegiatan, setIsiKegiatan] = useState("");
  const [fileFoto, setFileFoto] = useState<File | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [statusJurnal, setStatusJurnal] = useState("");

  // --- STATE PROFIL ---
  const [sejarah, setSejarah] = useState("");
  const [visiMisi, setVisiMisi] = useState("");
  const [potensi, setPotensi] = useState("");
  const [statusProfil, setStatusProfil] = useState("");

  // --- STATE ANGGOTA ---
  const [namaAnggota, setNamaAnggota] = useState("");
  const [emailAnggota, setEmailAnggota] = useState("");
  const [roleAnggota, setRoleAnggota] = useState("user");
  const [jurusanAnggota, setJurusanAnggota] = useState("");
  const [statusAnggota, setStatusAnggota] = useState("");

  // --- FITUR BARU: STATE KEUANGAN ---
  const [tipeUang, setTipeUang] = useState("Pemasukan");
  const [keteranganUang, setKeteranganUang] = useState("");
  const [nominalUang, setNominalUang] = useState("");
  const [tanggalUang, setTanggalUang] = useState(new Date().toISOString().split('T')[0]);
  const [statusKeuangan, setStatusKeuangan] = useState("");
  
  // State untuk Data Tabel & Grafik Keuangan
  const [riwayatKeuangan, setRiwayatKeuangan] = useState<any[]>([]);
  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  // FUNGSI BARU: Mengambil data keuangan dari server
  const ambilDataKeuangan = async () => {
    try {
      const q = query(collection(db, "keuangan_kkn"), orderBy("tanggal", "desc"));
      const snap = await getDocs(q);
      
      let masuk = 0; let keluar = 0; let dataSementara: any[] = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        dataSementara.push({ id: doc.id, ...data });
        if (data.tipe === "Pemasukan") masuk += Number(data.nominal);
        if (data.tipe === "Pengeluaran") keluar += Number(data.nominal);
      });
      
      setRiwayatKeuangan(dataSementara);
      setTotalPemasukan(masuk);
      setTotalPengeluaran(keluar);
    } catch (error) {
      console.error("Gagal mengambil data keuangan");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          const q = query(collection(db, "users"), where("email", "==", user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setCurrentUserRole(userData.role);
            setCurrentUserName(userData.nama);
            
            // Jika dia admin atau bendahara, tarik data keuangan juga
            if (userData.role === "admin" || userData.role === "bendahara") {
              ambilDataKeuangan();
            }
          } else {
            setCurrentUserRole("user"); 
            setCurrentUserName(user.email || "Anggota");
          }
        } catch (error) {
          setCurrentUserRole("user");
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

  // --- FUNGSI FORMAT MATA UANG RUPIAH ---
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
  };

  // --- FUNGSI SIMPAN KEUANGAN ---
  const simpanKeuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusKeuangan("Menyimpan catatan...");
    try {
      await addDoc(collection(db, "keuangan_kkn"), {
        tipe: tipeUang,
        keterangan: keteranganUang,
        nominal: Number(nominalUang),
        tanggal: new Date(tanggalUang).toISOString(),
        penginput: currentUserName
      });
      setStatusKeuangan("Berhasil dicatat!");
      setKeteranganUang(""); setNominalUang("");
      ambilDataKeuangan(); // Refresh data tabel & grafik
      setTimeout(() => setStatusKeuangan(""), 3000);
    } catch (error) {
      setStatusKeuangan("Gagal menyimpan.");
    }
  };

  // --- FUNGSI HAPUS KEUANGAN ---
  const hapusKeuangan = async (id: string) => {
    if (confirm("Yakin ingin menghapus catatan ini? Saldo akan dihitung ulang.")) {
      await deleteDoc(doc(db, "keuangan_kkn", id));
      ambilDataKeuangan(); // Refresh data
    }
  };

  // --- FUNGSI LAMA TETAP ADA (Jurnal, Profil, Anggota) ---
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
        judul: judul, kegiatan: isiKegiatan, tanggal: new Date(tanggal).toISOString(), gambar: linkGambar, penulis: currentUserName
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
      setStatusProfil("Profil berhasil diperbarui!");
      setTimeout(() => setStatusProfil(""), 3000);
    } catch (error) { setStatusProfil("Gagal memperbarui."); }
  };

  const tambahAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAnggota("Mendaftarkan...");
    try {
      await setDoc(doc(db, "users", emailAnggota.toLowerCase()), {
        nama: namaAnggota, email: emailAnggota.toLowerCase(), role: roleAnggota, jurusan: jurusanAnggota, foto: "", terdaftarPada: new Date().toISOString()
      });
      setStatusAnggota("Berhasil didaftarkan!");
      setNamaAnggota(""); setEmailAnggota(""); setJurusanAnggota(""); setRoleAnggota("user");
      setTimeout(() => setStatusAnggota(""), 4000);
    } catch (error) { setStatusAnggota("Gagal."); }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center">Memeriksa akses...</div>;

  // Konfigurasi Data untuk Grafik Donat
  const dataGrafik = {
    labels: ['Pemasukan', 'Pengeluaran'],
    datasets: [
      {
        data: [totalPemasukan, totalPengeluaran],
        backgroundColor: ['#22c55e', '#ef4444'], // Hijau & Merah Tailwind
        hoverBackgroundColor: ['#16a34a', '#dc2626'],
        borderWidth: 0,
      },
    ],
  };

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
          <button onClick={() => setMenuAktif("jurnal")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "jurnal" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Tulis Jurnal</button>
          
          {(currentUserRole === "admin" || currentUserRole === "bendahara") && (
            <button onClick={() => setMenuAktif("profil")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "profil" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Edit Profil</button>
          )}

          {/* FITUR BARU: MENU KEUANGAN (Admin & Bendahara) */}
          {(currentUserRole === "admin" || currentUserRole === "bendahara") && (
            <button onClick={() => setMenuAktif("keuangan")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "keuangan" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Buku Keuangan</button>
          )}

          {currentUserRole === "admin" && (
            <button onClick={() => setMenuAktif("anggota")} className={`flex-1 md:w-full text-center md:text-left py-2 px-3 rounded text-sm transition-all duration-300 ${menuAktif === "anggota" ? "bg-green-600 font-bold text-white shadow-inner scale-105" : "hover:bg-green-700 hover:scale-105"}`}>Anggota KKN</button>
          )}
        </nav>
        
        <button onClick={handleLogout} className="mt-auto w-full bg-red-600 py-2 rounded-lg font-bold hover:bg-red-700 transition-transform hover:scale-105 text-sm shadow-lg">Logout</button>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* --- MENU KEUANGAN (FITUR BARU) --- */}
        {menuAktif === "keuangan" && (
          <div className="w-full max-w-5xl animate-fade-in space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Manajemen Keuangan KKN</h3>
            
            {/* Kartu Ringkasan (Saldo, Pemasukan, Pengeluaran) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 font-semibold mb-1">Total Saldo Saat Ini</p>
                <p className="text-2xl font-bold text-gray-800">{formatRupiah(totalPemasukan - totalPengeluaran)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <p className="text-sm text-gray-500 font-semibold mb-1">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">+{formatRupiah(totalPemasukan)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                <p className="text-sm text-gray-500 font-semibold mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">-{formatRupiah(totalPengeluaran)}</p>
              </div>
            </div>

            {/* Area Input & Grafik */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Input Keuangan */}
              <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
                <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Catat Transaksi Baru</h4>
                <form onSubmit={simpanKeuangan} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Jenis Transaksi</label>
                      <select value={tipeUang} onChange={(e) => setTipeUang(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="Pemasukan">Pemasukan (Uang Masuk)</option>
                        <option value="Pengeluaran">Pengeluaran (Uang Keluar)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Tanggal</label>
                      <input type="date" required value={tanggalUang} onChange={(e) => setTanggalUang(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Keterangan / Keperluan</label>
                    <input type="text" required value={keteranganUang} onChange={(e) => setKeteranganUang(e.target.value)} placeholder="Contoh: Iuran anggota / Beli cat posko" className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Nominal (Rp)</label>
                    <input type="number" required value={nominalUang} onChange={(e) => setNominalUang(e.target.value)} placeholder="Contoh: 50000" min="0" className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                  </div>
                  <button type="submit" className={`w-full text-white font-bold py-2 rounded-md transition-transform hover:scale-105 ${tipeUang === "Pemasukan" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                    Simpan Transaksi
                  </button>
                  {statusKeuangan && <p className="text-center text-sm font-bold text-blue-600 mt-2">{statusKeuangan}</p>}
                </form>
              </div>

              {/* Area Grafik Donat */}
              <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
                <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">Rasio Keuangan</h4>
                {totalPemasukan === 0 && totalPengeluaran === 0 ? (
                  <p className="text-gray-400 text-sm italic">Belum ada data</p>
                ) : (
                  <div className="w-48 h-48">
                    <Doughnut data={dataGrafik} options={{ maintainAspectRatio: false }} />
                  </div>
                )}
              </div>
            </div>

            {/* Tabel Riwayat Keuangan */}
            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Riwayat Transaksi</h4>
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-lg">Tanggal</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4">Pemasukan</th>
                    <th className="py-3 px-4">Pengeluaran</th>
                    <th className="py-3 px-4 rounded-tr-lg text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {riwayatKeuangan.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{item.keterangan}</p>
                        <p className="text-xs text-gray-400">Oleh: {item.penginput}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-green-600">{item.tipe === "Pemasukan" ? formatRupiah(item.nominal) : "-"}</td>
                      <td className="py-3 px-4 font-bold text-red-600">{item.tipe === "Pengeluaran" ? formatRupiah(item.nominal) : "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => hapusKeuangan(item.id)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition">Hapus</button>
                      </td>
                    </tr>
                  ))}
                  {riwayatKeuangan.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-500">Belum ada catatan keuangan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
            <form onSubmit={tambahAnggota} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1">Nama Lengkap</label><input type="text" required value={namaAnggota} onChange={(e) => setNamaAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-semibold mb-1">Email</label><input type="email" required value={emailAnggota} onChange={(e) => setEmailAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1">Program Studi / Jurusan</label><input type="text" required value={jurusanAnggota} onChange={(e) => setJurusanAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Jabatan (Role)</label>
                  <select value={roleAnggota} onChange={(e) => setRoleAnggota(e.target.value)} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="user">Anggota Biasa</option>
                    <option value="bendahara">Bendahara</option>
                    <option value="admin">Admin / Koordinator</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-transform hover:scale-105 shadow-md">Simpan Biodata Anggota</button>
              {statusAnggota && <div className={`mt-4 p-3 rounded-md text-sm font-semibold ${statusAnggota.includes("Gagal") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{statusAnggota}</div>}
            </form>
          </div>
        )}

      </main>
    </div>
  );
}