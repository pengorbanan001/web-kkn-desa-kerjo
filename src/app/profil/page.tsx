"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Link from "next/link";

export default function ProfilDesa() {
  const [profil, setProfil] = useState({
    sejarah: "",
    visiMisi: "",
    potensi: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambilDataProfil = async () => {
      try {
        const docRef = doc(db, "profil_desa", "info_utama");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfil({
            sejarah: docSnap.data().sejarah,
            visiMisi: docSnap.data().visiMisi,
            potensi: docSnap.data().potensi
          });
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
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">KKN Desa Kerjo</h1>
          <div className="space-x-4">
            <Link href="/" className="hover:underline">Beranda</Link>
            <Link href="/jurnal" className="hover:underline">Jurnal KKN</Link>
            <Link href="/login" className="bg-white text-green-700 px-4 py-2 rounded-md font-semibold text-sm">Login Admin</Link>
          </div>
        </div>
      </nav>

      <div className="bg-green-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold mb-4">Profil Desa Kerjo</h2>
          <p className="text-xl text-green-100">Kecamatan Karangan, Kabupaten Trenggalek</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {loading ? (
          <div className="text-center text-gray-500 font-semibold mt-10 animate-pulse">
            Memuat informasi desa...
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-md space-y-8">
            <section>
              <h3 className="text-2xl font-bold text-green-800 border-b-2 border-green-200 pb-2 mb-4">Sejarah Singkat</h3>
              {/* class whitespace-pre-wrap di bawah ini berfungsi membaca 'Enter' agar teks berparagraf */}
              <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap">
                {profil.sejarah || "Data sejarah desa belum ditambahkan oleh Admin."}
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-green-800 border-b-2 border-green-200 pb-2 mb-4">Visi & Misi</h3>
              <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap">
                {profil.visiMisi || "Data visi dan misi belum ditambahkan oleh Admin."}
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-green-800 border-b-2 border-green-200 pb-2 mb-4">Potensi Desa</h3>
              <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap">
                {profil.potensi || "Data potensi desa belum ditambahkan oleh Admin."}
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}