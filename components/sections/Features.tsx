import { GraduationCap, MonitorSmartphone, ShieldCheck } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <GraduationCap size={42} className="text-blue-700" />,
      title: "Academic Excellence",
      description:
        "Our curriculum is designed to help students reach their highest potential.",
    },
    {
      icon: <MonitorSmartphone size={42} className="text-blue-700" />,
      title: "Digital Learning",
      description:
        "Interactive classrooms and modern technology prepare students for tomorrow.",
    },
    {
      icon: <ShieldCheck size={42} className="text-blue-700" />,
      title: "Safe Environment",
      description:
        "A secure and caring environment where every student can learn with confidence.",
    },
  ];

  return (
    <section className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-8">

        <h2 className="text-4xl font-bold text-center text-blue-700">
          Why Choose EduLaunch?
        </h2>

        <p className="text-center text-gray-600 mt-5 max-w-2xl mx-auto">
          Everything your school needs to stand out online and inspire confidence.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:-translate-y-2 transition duration-300"
            >
              {feature.icon}

              <h3 className="text-2xl font-semibold mt-6">
                {feature.title}
              </h3>

              <p className="text-gray-600 mt-4">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}