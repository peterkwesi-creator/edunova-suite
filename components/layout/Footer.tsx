export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-8">

        <div>
          <h2 className="text-2xl font-bold">EduLaunch</h2>
          <p className="mt-4 text-blue-100">
            Building beautiful websites that help schools grow,
            inspire confidence, and attract new students.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Quick Links</h3>

          <ul className="space-y-2 mt-4 text-blue-100">
            <li>Home</li>
            <li>About</li>
            <li>Admissions</li>
            <li>Gallery</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Contact</h3>

          <p className="mt-4 text-blue-100">
            Email: info@edulaunch.com
          </p>

          <p className="text-blue-100">
            Phone: +233 XX XXX XXXX
          </p>
        </div>

      </div>

      <div className="text-center mt-10 text-blue-200 text-sm">
        © 2026 EduLaunch. All rights reserved.
      </div>
    </footer>
  );
}