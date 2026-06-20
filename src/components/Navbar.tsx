"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Fungsi untuk mengecek apakah tab sedang aktif
  const isAktif = (jalur: string) => pathname === jalur;

  return (
    <nav className="bg-green-700 p-4 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-center tracking-wide">KKN Desa Kerjo</h1>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm md:text-base">
          
          <Link href="/" className={`transition-transform duration-300 hover:scale-110 ${isAktif("/") ? "font-extrabold text-yellow-300 underline decoration-2 underline-offset-4" : "text-gray-100 hover:text-white"}`}>
            Beranda
          </Link>
          
          <Link href="/jurnal" className={`transition-transform duration-300 hover:scale-110 ${isAktif("/jurnal") ? "font-extrabold text-yellow-300 underline decoration-2 underline-offset-4" : "text-gray-100 hover:text-white"}`}>
            Jurnal KKN
          </Link>
          
          <Link href="/profil" className={`transition-transform duration-300 hover:scale-110 ${isAktif("/profil") ? "font-extrabold text-yellow-300 underline decoration-2 underline-offset-4" : "text-gray-100 hover:text-white"}`}>
            Profil Desa
          </Link>
          
          <Link href="/login" className="bg-white text-green-700 px-4 py-2 rounded-full font-bold text-xs md:text-sm shadow-md transition-transform duration-300 hover:scale-110 hover:bg-green-50 hover:shadow-lg">
            Login Admin
          </Link>

        </div>
      </div>
    </nav>
  );
}