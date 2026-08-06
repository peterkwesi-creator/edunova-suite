import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <Link href="/" className="text-2xl font-bold text-blue-700">
          EduNova
        </Link>

<ul className="hidden md:flex items-center gap-8 font-medium text-gray-700">
  <li><Link href="/" className="hover:text-blue-700 transition">Home</Link></li>
  <li><Link href="/about" className="hover:text-blue-700 transition">About</Link></li>
  <li><Link href="/academics" className="hover:text-blue-700 transition">Academics</Link></li>
  <li><Link href="/admissions" className="hover:text-blue-700 transition">Admissions</Link></li>
  <li><Link href="/gallery" className="hover:text-blue-700 transition">Gallery</Link></li>
  <li><Link href="/contact" className="hover:text-blue-700 transition">Contact</Link></li>
</ul>

        <Link
          href="/admissions"
          className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          Apply Now
        </Link>

      </div>
    </nav>
  );
}