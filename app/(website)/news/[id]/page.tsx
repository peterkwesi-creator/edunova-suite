import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const school = await prisma.school.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!school) {
    notFound();
  }

  const article = await prisma.newsItem.findFirst({
    where: {
      id,
      schoolId: school.id,
      published: true,
    },
  });

  if (!article) {
    notFound();
  }

  const primaryColor = school.primaryColor || "#2563eb";
  const secondaryColor = school.secondaryColor || "#0f172a";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <section
        className="px-6 py-16 text-white lg:px-8 lg:py-20"
        style={{
          background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
        }}
      >
        <div className="mx-auto max-w-4xl">
          <Link
            href="/news"
            className="text-sm font-bold text-white/70 transition hover:text-white"
          >
            ← Back to News
          </Link>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-white/60">
            School News
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {article.title}
          </h1>

          <p className="mt-5 text-sm text-white/60">
            {new Date(
              article.publishedAt
            ).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* ARTICLE */}
      <section className="px-6 py-12 lg:px-8 lg:py-16">
        <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="max-h-[520px] w-full object-cover"
            />
          )}

          <div className="p-7 sm:p-10 lg:p-12">
            {article.excerpt && (
              <p className="border-l-4 pl-5 text-lg font-semibold leading-8 text-slate-600"
                style={{
                  borderColor: primaryColor,
                }}
              >
                {article.excerpt}
              </p>
            )}

            <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-700">
              {article.content}
            </div>

            <div className="mt-10 border-t border-slate-200 pt-7">
              <Link
                href="/news"
                className="font-bold"
                style={{
                  color: primaryColor,
                }}
              >
                ← Back to all news
              </Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}