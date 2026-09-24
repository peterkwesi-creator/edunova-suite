import { prisma } from "@/lib/prisma";

export type WebsiteContent = Record<string, string>;

export async function getSchool() {
  return prisma.school.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getWebsitePage(slug: string) {
  const school = await getSchool();

  if (!school) {
    return {
      school: null,
      page: null,
      content: {} as WebsiteContent,
    };
  }

  const page = await prisma.websitePage.findUnique({
    where: {
      schoolId_slug: {
        schoolId: school.id,
        slug,
      },
    },
  });

  const content =
    page?.content &&
    typeof page.content === "object" &&
    !Array.isArray(page.content)
      ? (page.content as WebsiteContent)
      : ({} as WebsiteContent);

  return {
    school,
    page,
    content,
  };
}