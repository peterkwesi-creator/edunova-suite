import Link from "next/link";

export default function News() {
  const news = [
    {
      title: "Admissions Open for 2027",
      date: "August 2026",
      description:
        "Applications are now open for the upcoming academic year.",
    },
    {
      title: "Students Excel in National Science Competition",
      date: "July 2026",
      description:
        "Our students achieved outstanding results at the national level.",
    },
    {
      title: "New Computer Laboratory Commissioned",
      date: "June 2026",
      description:
        "The school officially opened a new state-of-the-art ICT laboratory.",
    },
  ];

  return (
    <section className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-8">

        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-blue-700">
              Latest News
            </h2>

            <p className="text-gray-600 mt-2">
              Stay informed with the latest happenings.
            </p>
          </div>

          <Link
            href="/news"
            className="text-blue-700 font-semibold hover:underline"
          >
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {news.map((item) => (
            <article
              key={item.title}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
            >
              <div className="h-48 bg-blue-100 flex items-center justify-center">
                <span className="text-5xl">📰</span>
              </div>

              <div className="p-6">
                <p className="text-sm text-blue-700 font-semibold">
                  {item.date}
                </p>

                <h3 className="text-xl font-bold mt-3">
                  {item.title}
                </h3>

                <p className="text-gray-600 mt-4">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}