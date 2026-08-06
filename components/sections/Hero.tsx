import Image from "next/image";

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto min-h-[85vh] grid md:grid-cols-2 items-center gap-12 px-8 py-16">

      <div>
        <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
          Welcome to EduLaunch
        </span>

        <h1 className="text-5xl md:text-6xl font-bold mt-6 leading-tight">
          Building Tomorrow's
          <span className="text-blue-700"> Future Leaders</span>
        </h1>

        <p className="mt-6 text-gray-600 text-lg leading-8">
We help schools create an exceptional digital experience with beautiful websites, online admissions, parent communication, and student engagement.
        </p>

        <div className="flex gap-4 mt-10">
  <button className="bg-blue-700 text-white px-8 py-4 rounded-xl hover:bg-blue-800 transition shadow-lg">
    Apply Now
  </button>

  <button className="border-2 border-blue-700 text-blue-700 px-8 py-4 rounded-xl hover:bg-blue-700 hover:text-white transition">
    Learn More
  </button>
</div>
      </div>

      <div className="relative h-[500px]">
        <Image
          src="/images/hero.jpg"
          alt="Students"
          fill
          priority
          className="object-cover rounded-3xl shadow-2xl"
        />
      </div>

    </section>
  );
}