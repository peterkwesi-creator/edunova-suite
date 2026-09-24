import Image from "next/image";
import { getWebsitePage } from "@/lib/website";
import { prisma } from "@/lib/prisma";

export default async function GalleryPage() {
  const { school, page, content } =
    await getWebsitePage("gallery");

  if (!school) {
    return (
      <main className="p-10 text-center">
        School information is not available.
      </main>
    );
  }

  const gallery = await prisma.galleryItem.findMany({
    where: {
      schoolId: school.id,
      published: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const socialLinks = await prisma.socialLink.findMany({
    where: {
      schoolId: school.id,
      enabled: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const primaryColor =
    school.primaryColor || "#2563eb";

  return (
    <main className="min-h-screen bg-white">
      <section
        className="px-6 py-24 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${
            school.secondaryColor || "#1d4ed8"
          })`,
        }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">
            {school.name}
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-6xl">
            {page?.title || "School Gallery"}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/85">
            {page?.subtitle ||
              "Memories, facilities and achievements."}
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-black text-gray-900">
            {content.introductionTitle ||
              "Memories & Moments"}
          </h2>

          <p className="mx-auto mt-4 max-w-3xl leading-8 text-gray-600">
            {content.introductionText ||
              "Explore moments from school life, our facilities and the achievements of our students."}
          </p>
        </div>
      </section>

      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm"
              >
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={
                      item.title ||
                      "School gallery image"
                    }
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {item.title || "School Moment"}
                  </h3>

                  {item.description && (
                    <p className="mt-3 leading-7 text-gray-600">
                      {item.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          {gallery.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 p-16 text-center text-gray-500">
              No gallery images have been published yet.
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {content.facilitiesTitle ||
                "Our Facilities"}
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              {content.facilitiesText ||
                "Showcase classrooms, laboratories, library, sports facilities and other parts of the school."}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {content.memoriesTitle ||
                "School Memories"}
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              {content.memoriesText ||
                "Share memorable events, excursions, celebrations and activities."}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {content.achievementsTitle ||
                "Our Achievements"}
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              {content.achievementsText ||
                "Highlight academic, sporting, cultural and other achievements."}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-black text-gray-900">
            {content.socialTitle ||
              "Stay Connected"}
          </h2>

          <p className="mt-3 text-gray-600">
            {content.socialText ||
              "Follow our school on social media for the latest updates."}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-800 shadow-sm transition hover:-translate-y-1"
              >
                {link.label || link.platform}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}