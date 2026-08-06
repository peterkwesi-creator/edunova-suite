export default function Stats() {
  const stats = [
    { number: "1,500+", label: "Students" },
    { number: "120+", label: "Teachers" },
    { number: "98%", label: "Pass Rate" },
    { number: "25+", label: "Years of Excellence" },
  ];

  return (
    <section className="bg-blue-700 text-white py-20">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <h2 className="text-5xl font-bold">{stat.number}</h2>
              <p className="mt-3 text-blue-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}