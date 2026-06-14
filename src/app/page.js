import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Bagian Header / Navigasi (Responsive) */}
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

      {/* Bagian Konten Utama */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
          Portal Resmi KKN Desa Kerjo
        </h2>
        <h3 className="text-xl font-semibold text-gray-600 mb-6">
          Kecamatan Karangan, Kabupaten Trenggalek
        </h3>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Website ini merangkum seluruh potensi desa, profil demografi, serta menjadi rekam jejak digital (jurnal kegiatan) mahasiswa KKN.
        </p>
        
        {/* Tombol Aksi */}
        <div className="flex justify-center space-x-4">
          <Link href="/profil" className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg text-center">
            Lihat Profil Desa
          </Link>
          <Link href="/jurnal" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg text-center">
            Baca Jurnal Kegiatan
          </Link>
        </div>
      </div>
    </main>
  );
}