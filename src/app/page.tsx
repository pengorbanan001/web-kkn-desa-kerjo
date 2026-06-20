import Link from "next/link";

export default function Home() {
  return (
    // Penambahan flex dan min-h-screen agar footer selalu berada di bawah
    <main className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Bagian Navigasi dengan Animasi Hover & Active Tab */}
      <nav className="bg-green-700 p-4 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-bold text-center tracking-wide">KKN Desa Kerjo</h1>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm md:text-base">
            {/* Penanda Active Tab: Teks tebal dan garis bawah warna emas */}
            <Link href="/" className="font-extrabold text-yellow-300 underline decoration-2 underline-offset-4 transition-transform duration-300 hover:scale-110">Beranda</Link>
            <Link href="/jurnal" className="text-gray-100 hover:text-white transition-transform duration-300 hover:scale-110">Jurnal KKN</Link>
            <Link href="/profil" className="text-gray-100 hover:text-white transition-transform duration-300 hover:scale-110">Profil Desa</Link>
            <Link href="/login" className="bg-white text-green-700 px-4 py-2 rounded-full font-bold text-xs md:text-sm shadow-md transition-transform duration-300 hover:scale-110 hover:bg-green-50 hover:shadow-lg">
              Login Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Bagian Konten Utama memakan sisa ruang (flex-grow) */}
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
        
        {/* Tombol Aksi dengan Animasi Membesar */}
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto">
          <Link href="/profil" className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-green-700 hover:scale-105 shadow-lg hover:shadow-xl text-center">
            Lihat Profil Desa
          </Link>
          <Link href="/jurnal" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl text-center">
            Baca Jurnal Kegiatan
          </Link>
        </div>
      </div>

      {/* FITUR BARU: Footer Lengkap dengan Peta dan Kontak */}
      <footer className="bg-gray-800 text-white py-10 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          {/* Kolom 1: Tentang */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-green-400">Tim KKN Desa Kerjo</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Kami adalah mahasiswa pengabdi yang berkomitmen untuk memajukan potensi desa melalui program kerja digital dan pemberdayaan masyarakat.
            </p>
          </div>

          {/* Kolom 2: Kontak & Sosial Media */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-lg font-bold mb-4 text-green-400">Hubungi Kami</h4>
            <p className="text-gray-400 text-sm mb-2">📞 Telp/WA: +62 812-3456-7890</p>
            <p className="text-gray-400 text-sm mb-4">📧 Email: kkn.kerjo@univ.ac.id</p>
            <div className="flex space-x-4">
              {/* Anda bisa mengganti href dengan link asli nantinya */}
              <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-pink-600 transition-colors duration-300" title="Instagram">
                📸 Instagram
              </a>
              <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-black transition-colors duration-300" title="TikTok">
                🎵 TikTok
              </a>
            </div>
          </div>

          {/* Kolom 3: Lokasi & Tombol Maps */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-lg font-bold mb-4 text-green-400">Lokasi Desa</h4>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Desa Kerjo, Kec. Karangan, <br />
              Kabupaten Trenggalek, Jawa Timur
            </p>
            {/* Tombol Buka di Google Maps */}
            <a 
              href="https://maps.app.goo.gl/ContohLinkPetaDesaKerjo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white text-gray-800 font-bold text-sm px-4 py-2 rounded-lg hover:bg-green-100 hover:scale-105 transition-transform duration-300 shadow-md"
            >
              📍 Buka di Google Maps
            </a>
          </div>

        </div>
        
        {/* Garis pemisah & Hak Cipta */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} KKN Desa Kerjo. Dibuat dengan semangat pengabdian.
          </p>
        </div>
      </footer>

    </main>
  );
}