import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-20 text-center flex flex-col justify-center items-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4 tracking-tight drop-shadow-sm">
          Portal Resmi KKN Desa Kerjo
        </h2>
        <h3 className="text-xl md:text-2xl font-semibold text-green-700 mb-6">
          Kecamatan Karangan, Kabupaten Trenggalek
        </h3>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Website ini merangkum seluruh potensi desa, profil demografi, serta menjadi rekam jejak digital (jurnal kegiatan) mahasiswa KKN.
        </p>
        
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto">
          <Link href="/profil" className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-green-700 hover:scale-105 shadow-lg hover:shadow-xl text-center">
            Lihat Profil Desa
          </Link>
          <Link href="/jurnal" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl text-center">
            Baca Jurnal Kegiatan
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}