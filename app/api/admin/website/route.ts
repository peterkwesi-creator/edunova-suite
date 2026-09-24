import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";

const PAGE_SLUGS = [
  "home",
  "about",
  "academics",
  "admissions",
  "gallery",
  "contact",
];

const DEFAULT_PAGES: Record<
  string,
  {
    title: string;
    subtitle: string;
    content: Record<string, string>;
  }
> = {
  home: {
    title: "Welcome to Our School",
    subtitle:
      "Building bright futures through quality education.",
    content: {
      welcomeTitle: "Welcome to Our School",
      welcomeText:
        "We are committed to providing a safe, inspiring and supportive environment where every student can learn, grow and succeed.",
      heroButtonText: "Apply Now",
      heroButtonLink: "/admissions",
      secondaryButtonText:
        "Explore Our School",
      secondaryButtonLink: "/about",
      highlightsTitle:
        "Why Choose Our School?",
      highlightsText:
        "Discover a learning environment designed to help students reach their full potential.",
      highlight1Title:
        "Quality Education",
      highlight1Text:
        "Dedicated teachers and a strong academic foundation.",
      highlight2Title:
        "Student Development",
      highlight2Text:
        "We develop confident, responsible and creative young people.",
      highlight3Title:
        "A Caring Community",
      highlight3Text:
        "Students, parents and teachers working together.",
      galleryTitle:
        "Moments From Our School",
      galleryText:
        "Take a look at some of the memories, facilities and achievements that make our school special.",
      newsTitle:
        "Latest From Our School",
      newsText:
        "Stay updated with our latest programs, activities and announcements.",
      finalTitle:
        "Ready to Join Our School?",
      finalText:
        "Learn more about admissions or get in touch with our school.",
    },
  },

  about: {
    title: "About Our School",
    subtitle:
      "Discover who we are and what we stand for.",
    content: {
      historyTitle: "Our History",
      historyText:
        "Tell the story of how your school started, its growth and its achievements.",
      missionTitle: "Our Mission",
      missionText:
        "To provide quality education and develop students who are confident, responsible and prepared for the future.",
      visionTitle: "Our Vision",
      visionText:
        "To become a leading institution committed to academic excellence, character development and innovation.",
      founderTitle:
        "A Word From Our Founder",
      founderName: "School Founder",
      founderMessage:
        "Enter the founder's message to students, parents and the wider school community.",
      founderImage: "",
    },
  },

  academics: {
    title: "Academics",
    subtitle:
      "Discover our academic programs and learning opportunities.",
    content: {
      introductionTitle:
        "Academic Excellence",
      introductionText:
        "Our academic program is designed to challenge, support and inspire every student.",
      subjectsTitle:
        "Subjects We Offer",
      subjectsText:
        "Explore the subjects available to students at our school.",
      academicHighlightsTitle:
        "Our Academic Approach",
      academicHighlightsText:
        "Describe your teaching methods, academic standards, extracurricular learning and other academic information.",
      admissionLinkText:
        "Interested in joining us?",
      admissionLinkButton:
        "View Admissions",
      admissionLinkUrl: "/admissions",
      contactLinkText:
        "Have questions?",
      contactLinkButton: "Contact Us",
      contactLinkUrl: "/contact",
    },
  },

  admissions: {
    title: "Admissions",
    subtitle:
      "Take the first step toward joining our school community.",
    content: {
      introductionTitle:
        "Admissions Are Open",
      introductionText:
        "Provide parents and guardians with the information they need to apply to your school.",
      requirementsTitle:
        "Admission Requirements",
      requirementsText:
        "Enter the documents, age requirements, entrance examinations and other requirements for admission.",
      processTitle: "How To Apply",
      processText:
        "Explain the steps parents should follow when applying to the school.",
      importantDatesTitle:
        "Important Dates",
      importantDatesText:
        "Add application opening dates, deadlines, interviews and other important dates.",
      contactTitle:
        "Need Help With Your Application?",
      contactText:
        "Our admissions team is available to answer your questions.",
      contactButton:
        "Contact Admissions",
      contactUrl: "/contact",
    },
  },

  gallery: {
    title: "School Gallery",
    subtitle:
      "Memories, facilities and achievements.",
    content: {
      introductionTitle:
        "Memories & Moments",
      introductionText:
        "Explore moments from school life, our facilities and the achievements of our students.",
      facilitiesTitle:
        "Our Facilities",
      facilitiesText:
        "Showcase classrooms, laboratories, library, sports facilities and other parts of the school.",
      memoriesTitle:
        "School Memories",
      memoriesText:
        "Share memorable events, excursions, celebrations and activities.",
      achievementsTitle:
        "Our Achievements",
      achievementsText:
        "Highlight academic, sporting, cultural and other achievements.",
      administratorTitle:
        "School Administration",
      administratorName:
        "School Administrator",
      administratorRole:
        "Administrator",
      administratorMessage:
        "Add a short message or introduction from the school administration.",
      administratorImage: "",
      socialTitle:
        "Stay Connected",
      socialText:
        "Follow our school on social media for the latest updates.",
    },
  },

  contact: {
    title: "Contact Us",
    subtitle:
      "We would love to hear from you.",
    content: {
      introductionTitle:
        "Get In Touch",
      introductionText:
        "Have a question, suggestion, complaint or enquiry? Send us a message and our team will get back to you.",
      emailTitle: "Email",
      email: "",
      phoneTitle: "Phone",
      phone: "",
      whatsappTitle: "WhatsApp",
      whatsapp: "",
      smsTitle: "SMS",
      sms: "",
      addressTitle:
        "School Address",
      address: "",
      formTitle:
        "Send Us A Message",
      formText:
        "Use the form below to send an enquiry, suggestion or complaint to the school.",
      enquiryEnabled: "true",
      complaintsEnabled: "true",
      suggestionsEnabled: "true",
    },
  },
};

async function getAdminSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value;

  const session = verifySession(token);

  if (
    !session ||
    (session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN")
  ) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      active: true,
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    select: {
      id: true,
      schoolId: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    schoolId: user.schoolId,
    role: user.role,
  };
}

export async function GET() {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const school =
      await prisma.school.findUnique({
        where: {
          id: session.schoolId,
        },
      });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    /*
     * Create default website pages the first time
     * the website customizer is opened.
     */
    for (const slug of PAGE_SLUGS) {
      const existingPage =
        await prisma.websitePage.findUnique({
          where: {
            schoolId_slug: {
              schoolId: school.id,
              slug,
            },
          },
        });

      if (!existingPage) {
        const defaults =
          DEFAULT_PAGES[slug];

        await prisma.websitePage.create({
          data: {
            schoolId: school.id,
            slug,
            title: defaults.title,
            subtitle:
              defaults.subtitle,
            content:
              defaults.content as Prisma.InputJsonValue,
            enabled: true,
          },
        });
      }
    }

    const pages =
      await prisma.websitePage.findMany({
        where: {
          schoolId: school.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name,
        logo: school.logo,
        description:
          school.description,
        primaryColor:
          school.primaryColor,
        secondaryColor:
          school.secondaryColor,
        email: school.email,
        phone: school.phone,
        address: school.address,
      },
      pages,
    });
  } catch (error) {
    console.error(
      "Website GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load website settings",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const {
      school,
      pages,
    }: {
      school?: {
        name?: string;
        logo?: string | null;
        description?: string | null;
        primaryColor?: string | null;
        secondaryColor?: string | null;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
      };

      pages?: Array<{
        slug: string;
        title: string;
        subtitle?: string | null;
        heroImage?: string | null;
        content: Record<
          string,
          unknown
        >;
        enabled?: boolean;
      }>;
    } = body;

    /*
     * Update school branding/contact information.
     */
    if (school) {
      await prisma.school.update({
        where: {
          id: session.schoolId,
        },
        data: {
          name:
            school.name?.trim() ||
            undefined,

          logo:
            school.logo !==
            undefined
              ? school.logo || null
              : undefined,

          description:
            school.description !==
            undefined
              ? school.description ||
                null
              : undefined,

          primaryColor:
            school.primaryColor !==
            undefined
              ? school.primaryColor ||
                null
              : undefined,

          secondaryColor:
            school.secondaryColor !==
            undefined
              ? school.secondaryColor ||
                null
              : undefined,

          email:
            school.email !==
            undefined
              ? school.email || null
              : undefined,

          phone:
            school.phone !==
            undefined
              ? school.phone || null
              : undefined,

          address:
            school.address !==
            undefined
              ? school.address ||
                null
              : undefined,
        },
      });
    }

    /*
     * Update website pages.
     */
    if (Array.isArray(pages)) {
      for (const page of pages) {
        if (
          !page.slug ||
          !PAGE_SLUGS.includes(
            page.slug
          )
        ) {
          continue;
        }

        const jsonContent =
          page.content as Prisma.InputJsonValue;

        await prisma.websitePage.upsert({
          where: {
            schoolId_slug: {
              schoolId:
                session.schoolId,
              slug: page.slug,
            },
          },

          update: {
            title:
              page.title?.trim() ||
              "",
            subtitle:
              page.subtitle?.trim() ||
              null,
            heroImage:
              page.heroImage?.trim() ||
              null,
            content:
              jsonContent,
            enabled:
              page.enabled !==
              undefined
                ? page.enabled
                : true,
          },

          create: {
            schoolId:
              session.schoolId,
            slug: page.slug,
            title:
              page.title?.trim() ||
              "",
            subtitle:
              page.subtitle?.trim() ||
              null,
            heroImage:
              page.heroImage?.trim() ||
              null,
            content:
              jsonContent,
            enabled:
              page.enabled !==
              undefined
                ? page.enabled
                : true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Website settings saved successfully.",
    });
  } catch (error) {
    console.error(
      "Website PUT error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save website settings",
      },
      { status: 500 }
    );
  }
}