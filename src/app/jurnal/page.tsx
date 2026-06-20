"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// KOMPONEN SLIDER (CAROUSEL) KHUSUS MULTI-FOTO
const ImageCarousel = ({ gambarArray }: { gambarArray: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Efek geser otomatis setiap 1 detik (1000 milidetik) sesuai permintaan Anda
  useEffect(() => {
    if (gambarArray.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === gambarArray.length - 1 ? 0 : prevIndex + 1));
    }, 1000); // <-- Anda bisa mengubah kecepatan di sini
    return () => clearInterval(interval);
  }, [gambarArray.length]);

  const prevSlide = () => setCurrentIndex(currentIndex === 0 ? gambarArray.length - 1 : currentIndex - 1);
  const nextSlide = () => setCurrentIndex(currentIndex === gambarArray.length - 1 ? 0 : currentIndex + 1);

  if (gambarArray.length === 0) return null;

  return (
    <div className="relative w-full h-80 md:h-96 mb-4 group overflow-hidden rounded-xl shadow-sm bg-gray-100">
      <img 
        src={gambarArray[currentIndex]} 
        alt="Dokumentasi Kegiatan" 
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
      />
      
      {/* Tombol Geser Manual (Kiri & Kanan) - Akan muncul saat kursor didekatkan */}
      {gambarArray.length > 1 && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
          >
            &#10094;
          </button>
          <button 
            onClick={nextSlide} 
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
          >
            &#10095;
          </button>
          {/* Titik Indikator di Bawah */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
            {gambarArray.map((_, idx) => (
              <span key={idx} className={`block w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? "bg-white" : "bg-white/50"}`}></span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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
    return date.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-grow container mx-auto px-4 py-10 max-w-4xl">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2 text-center drop-shadow-sm">Jurnal Kegiatan Mahasiswa</h2>
        <p className="text-gray-600 text-center mb-10">Rekam jejak digital pengabdian kami di Desa Kerjo, Kec. Karangan.</p>

        {loading ? (
          <div className="text-center text-gray-500 font-semibold mt-20 animate-pulse">Memuat data jurnal...</div>
        ) : daftarJurnal.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 bg-white p-10 rounded-xl shadow-sm border border-gray-100">Belum ada kegiatan yang dicatat oleh tim KKN.</div>
        ) : (
          <div className="space-y-8">
            {daftarJurnal.map((jurnal) => {
              // LOGIKA KOMPABILITAS: Mengubah data lama (1 string) menjadi Array agar tidak error
              const gambarArray = Array.isArray(jurnal.gambar) 
                ? jurnal.gambar 
                : jurnal.gambar 
                  ? [jurnal.gambar] 
                  : [];

              return (
                <div key={jurnal.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-l-4 border-blue-600 hover:shadow-xl transition duration-300">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{jurnal.judul}</h3>
                  <div className="flex items-center space-x-4 mb-6 border-b pb-4">
                    <p className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{formatTanggal(jurnal.tanggal)}</p>
                    {jurnal.penulis && <p className="text-sm text-gray-500">✍️ {jurnal.penulis}</p>}
                  </div>

                  {/* MEMANGGIL KOMPONEN SLIDER GAMBAR */}
                  <ImageCarousel gambarArray={gambarArray} />

                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mt-4 text-justify">{jurnal.kegiatan}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}