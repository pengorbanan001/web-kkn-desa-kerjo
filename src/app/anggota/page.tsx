"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function AnggotaPublic() {
  const [daftarAnggota, setDaftarAnggota] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambilDataAnggota = async () => {
      try {
        // Mengambil semua data dari laci users, diurutkan berdasarkan peran (role)
        const q = query(collection(db, "users"), orderBy("role", "asc"));
        const querySnapshot = await getDocs(q);
        
        const dataSementara: any[] = [];
        querySnapshot.forEach((doc) => {
          dataSementara.push({ id: doc.id, ...doc.data() });
        });
        
        setDaftarAnggota(dataSementara);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilDataAnggota();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-grow container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 tracking-tight drop-shadow-sm">Tim Pengabdi Desa Kerjo</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Mengenal lebih dekat para mahasiswa yang berkomitmen membangun dan menggali potensi Desa Kerjo.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 font-semibold mt-20 animate-pulse">Memuat daftar anggota...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {daftarAnggota.map((anggota) => (
              <div key={anggota.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
                {/* Bagian Foto Profil */}
                <div className="h-48 bg-gray-200 w-full relative">
                  {anggota.foto ? (
                    <img src={anggota.foto} alt={anggota.nama} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    // Tampilan default jika belum ada foto
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
                      <span className="text-5xl text-white font-bold">{anggota.nama.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {/* Label Jabatan */}
                  <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full text-xs font-bold text-green-800 shadow-sm capitalize">
                    {anggota.role}
                  </div>
                </div>
                
                {/* Bagian Info Biodata */}
                <div className="p-5 text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-1">{anggota.nama}</h3>
                  <p className="text-sm font-semibold text-green-600 mb-3">{anggota.jurusan || "Mahasiswa KKN"}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100">
                    <p className="mb-1">✉️ {anggota.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}