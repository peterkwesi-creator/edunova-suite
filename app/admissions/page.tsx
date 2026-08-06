export default function AdmissionsPage() {
  return (
    <main className="max-w-4xl mx-auto px-8 py-20">

      <h1 className="text-5xl font-bold text-blue-700">
        Student Admissions
      </h1>

      <p className="mt-4 text-gray-600">
        Complete the form below to begin your admission process.
      </p>

      <form className="mt-12 space-y-6">

        <div>
          <label className="block font-semibold mb-2">
            Student Full Name
          </label>

          <input
            type="text"
            className="w-full border rounded-xl p-4"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Parent / Guardian Name
          </label>

          <input
            type="text"
            className="w-full border rounded-xl p-4"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Email Address
          </label>

          <input
            type="email"
            className="w-full border rounded-xl p-4"
            placeholder="parent@email.com"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Phone Number
          </label>

          <input
            type="tel"
            className="w-full border rounded-xl p-4"
            placeholder="+233..."
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Class Applying For
          </label>

          <select className="w-full border rounded-xl p-4">
            <option>Primary</option>
            <option>Junior High</option>
            <option>Senior High</option>
          </select>
        </div>

        <button
          className="bg-blue-700 text-white px-8 py-4 rounded-xl hover:bg-blue-800 transition"
        >
          Submit Application
        </button>

      </form>

    </main>
  );
}