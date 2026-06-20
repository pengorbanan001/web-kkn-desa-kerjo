export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-10 mt-auto w-full">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h4 className="text-lg font-bold mb-4 text-green-400">Tim KKN Desa Kerjo</h4>
          <p className="text-gray-400 text-sm leading-relaxed">
            Kami adalah mahasiswa pengabdi yang berkomitmen untuk memajukan potensi desa melalui program kerja digital dan pemberdayaan masyarakat.
          </p>
        </div>
        <div className="flex flex-col items-center md:items-start">
          <h4 className="text-lg font-bold mb-4 text-green-400">Hubungi Kami</h4>
          <p className="text-gray-400 text-sm mb-2">📞 Telp/WA: +62 812-3456-7890</p>
          <p className="text-gray-400 text-sm mb-4">📧 Email: kkn.kerjo@univ.ac.id</p>
          <div className="flex space-x-4">
            <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-pink-600 transition-colors duration-300" title="Instagram">📸 Instagram</a>
            <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-black transition-colors duration-300" title="TikTok">🎵 TikTok</a>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-start">
          <h4 className="text-lg font-bold mb-4 text-green-400">Lokasi Desa</h4>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">Desa Kerjo, Kec. Karangan, <br />Kabupaten Trenggalek, Jawa Timur</p>
          <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-gray-800 font-bold text-sm px-4 py-2 rounded-lg hover:bg-green-100 hover:scale-105 transition-transform duration-300 shadow-md">
            📍 Buka di Google Maps
          </a>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-6 text-center">
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} KKN Desa Kerjo. Dibuat dengan semangat pengabdian.</p>
      </div>
    </footer>
  );
}