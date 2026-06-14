"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Link from "next/link";

export default function JurnalPublic() {
  const [daftarJurnal, setDaftarJurnal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambilData = async () => {
      try {
        const q = query(collection(db, "jurnal_kkn"), orderBy("tanggal", "desc"));
        const querySnapshot = await getDocs(q);
        
        const dataSementara: any[] = [];
        querySnapshot.forEach((doc) => {
          dataSementara.push({ id: doc.id, ...doc.data() });
        });
        
        setDaftarJurnal(dataSementara);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    ambilData();
  }, []);

  const formatTanggal = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 p-4 text-white shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-bold text-center">KKN Desa Kerjo</h1>
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 text-sm md:text-base">
            <Link href="/" className="hover:underline">Beranda</Link>
            <Link href="/jurnal" className="hover:underline">Jurnal KKN</Link>
            <Link href="/login" className="bg-white text-green-700 px-3 py-1.5 md:px-4 md:py-2 rounded-md font-semibold text-xs md:text-sm">Login Admin</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">Jurnal Kegiatan Mahasiswa</h2>
        <p className="text-gray-600 text-center mb-10">Rekam jejak digital pengabdian kami di Desa Kerjo, Kec. Karangan.</p>

        {loading ? (
          <div className="text-center text-gray-500 font-semibold mt-20 animate-pulse">
            Memuat data jurnal...
          </div>
        ) : daftarJurnal.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 bg-white p-10 rounded-xl shadow-sm">
            Belum ada kegiatan yang dicatat oleh tim KKN.
          </div>
        ) : (
          <div className="space-y-6">
            {daftarJurnal.map((jurnal) => (
              <div 
                key={jurnal.id} 
                className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-600 hover:shadow-lg transition duration-300"
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{jurnal.judul}</h3>
                <p className="text-sm font-medium text-green-600 mb-4">{formatTanggal(jurnal.tanggal)}</p>
                
                {/* TAMBAHAN BARU: referrerPolicy="no-referrer" */}
                {jurnal.gambar && (
                  <img 
                    src={jurnal.gambar} 
                    alt={jurnal.judul} 
                    referrerPolicy="no-referrer"
                    className="w-full max-h-96 object-cover rounded-lg mb-4 shadow-sm"
                  />
                )}

                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{jurnal.kegiatan}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}