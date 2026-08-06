export default function Programs() {
  const programs = [
    {
      title: "Primary School",
      description: "Building strong foundations through engaging and interactive learning."
    },
    {
      title: "Junior High",
      description: "Preparing students with knowledge and critical thinking skills."
    },
    {
      title: "Senior High",
      description: "Equipping students for university, careers and lifelong success."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">

        <h2 className="text-4xl font-bold text-center text-blue-700">
          Academic Programs
        </h2>

        <p className="text-center text-gray-600 mt-4">
          Quality education at every stage.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {programs.map((program) => (
            <div
              key={program.title}
              className="border rounded-2xl p-8 shadow-lg hover:shadow-2xl transition"
            >
              <h3 className="text-2xl font-semibold">
                {program.title}
              </h3>

              <p className="text-gray-600 mt-4">
                {program.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}