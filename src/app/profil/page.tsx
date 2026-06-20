"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ProfilDesa() {
  const [profil, setProfil] = useState({ sejarah: "", visiMisi: "", potensi: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambilDataProfil = async () => {
      try {
        const docRef = doc(db, "profil_desa", "info_utama");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfil({ sejarah: docSnap.data().sejarah, visiMisi: docSnap.data().visiMisi, potensi: docSnap.data().potensi });
        }
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
      } finally {
        setLoading(false);
      }
    };
    ambilDataProfil();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="bg-green-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold mb-4 drop-shadow-md">Profil Desa Kerjo</h2>
          <p className="text-xl text-green-100">Kecamatan Karangan, Kabupaten Trenggalek</p>
        </div>
      </div>

      <div className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        {loading ? (
          <div className="text-center text-gray-500 font-semibold mt-10 animate-pulse">Memuat informasi desa...</div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-md space-y-8 animate-fade-in">
            <section>
              <h3 className="text-2xl font-bold text-green-800 border-b-2 border-green-200 pb-2 mb-4">Sejarah Singkat</h3>
              <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap">{profil.sejarah || "Data belum ditambahkan."}</p>
            </section>
            <section>
              <h3 className="text-2xl font-bold text-green-800 border-b-2 border-green-200 pb-2 mb-4">Visi & Misi</h3>
              <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap">{profil.visiMisi || "Data belum ditambahkan."}</p>
            </section>
            <section>
              <h3 className="text-2xl font-bold text-green-800 border-b-2 border-green-200 pb-2 mb-4">Potensi Desa</h3>
              <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap">{profil.potensi || "Data belum ditambahkan."}</p>
            </section>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}