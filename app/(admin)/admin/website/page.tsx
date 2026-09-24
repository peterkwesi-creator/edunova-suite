"use client";

import { FormEvent, useEffect, useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";

type WebsitePage = {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  enabled: boolean;
};

type GalleryItem = {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  published: boolean;
};

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
};

type PageForm = {
  title: string;
  subtitle: string;
  body: string;
  sectionOneTitle: string;
  sectionOneText: string;
  sectionTwoTitle: string;
  sectionTwoText: string;
  founderName: string;
  founderMessage: string;
};

const emptyForm: PageForm = {
  title: "",
  subtitle: "",
  body: "",
  sectionOneTitle: "",
  sectionOneText: "",
  sectionTwoTitle: "",
  sectionTwoText: "",
  founderName: "",
  founderMessage: "",
};

const pageDefinitions = [
  {
    slug: "home",
    label: "Home",
    description:
      "Control the main message visitors see when they enter the school website.",
  },
  {
    slug: "about",
    label: "About",
    description:
      "Tell visitors about the school's history, mission, vision and founder.",
  },
  {
    slug: "academics",
    label: "Academics",
    description:
      "Describe the school's academic programme, subjects and learning approach.",
  },
  {
    slug: "admissions",
    label: "Admissions",
    description:
      "Explain how parents and students can apply to the school.",
  },
  {
    slug: "contact",
    label: "Contact",
    description:
      "Control the information visitors see when they want to contact the school.",
  },
];

const platforms = [
  "Facebook",
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
];

export default function WebsiteCustomizationPage() {
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const [selectedSlug, setSelectedSlug] = useState("home");

  const [form, setForm] =
    useState<PageForm>(emptyForm);

  const [imageUrl, setImageUrl] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [imageDescription, setImageDescription] =
    useState("");

  const [platform, setPlatform] =
    useState("Facebook");

  const [socialUrl, setSocialUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/website"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load website settings."
        );
      }

      const data = await response.json();

      setPages(data.pages || []);
      setGallery(data.gallery || []);
      setSocialLinks(data.socialLinks || []);

      const selectedPage = (
        data.pages || []
      ).find(
        (page: WebsitePage) =>
          page.slug === selectedSlug
      );

      if (selectedPage) {
        loadPageIntoForm(selectedPage);
      } else {
        setForm(emptyForm);
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Failed to load website customization data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function readContent(
    content: Record<string, unknown>,
    key: string
  ) {
    const value = content[key];

    return typeof value === "string"
      ? value
      : "";
  }

  function loadPageIntoForm(
    page: WebsitePage
  ) {
    const content = page.content || {};

    setForm({
      title: page.title || "",
      subtitle: readContent(
        content,
        "subtitle"
      ),
      body: readContent(
        content,
        "body"
      ),
      sectionOneTitle: readContent(
        content,
        "sectionOneTitle"
      ),
      sectionOneText: readContent(
        content,
        "sectionOneText"
      ),
      sectionTwoTitle: readContent(
        content,
        "sectionTwoTitle"
      ),
      sectionTwoText: readContent(
        content,
        "sectionTwoText"
      ),
      founderName: readContent(
        content,
        "founderName"
      ),
      founderMessage: readContent(
        content,
        "founderMessage"
      ),
    });
  }

  function selectPage(slug: string) {
    setSelectedSlug(slug);

    const page = pages.find(
      (item) => item.slug === slug
    );

    if (page) {
      loadPageIntoForm(page);
    } else {
      setForm(emptyForm);
    }

    setMessage("");
  }

  function updateField(
    field: keyof PageForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function savePage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/website",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: selectedSlug,
            title: form.title,
            content: {
              subtitle: form.subtitle,
              body: form.body,
              sectionOneTitle:
                form.sectionOneTitle,
              sectionOneText:
                form.sectionOneText,
              sectionTwoTitle:
                form.sectionTwoTitle,
              sectionTwoText:
                form.sectionTwoText,
              founderName:
                form.founderName,
              founderMessage:
                form.founderMessage,
            },
            enabled: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save website page."
        );
      }

      setMessage(
        `${selectedSlug} page saved successfully.`
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save page."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addGalleryItem(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!imageUrl.trim()) {
      setMessage(
        "Please upload an image first."
      );
      return;
    }

    try {
      const response = await fetch(
        "/api/gallery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl,
            title: imageTitle,
            description: imageDescription,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add gallery image."
        );
      }

      setImageUrl("");
      setImageTitle("");
      setImageDescription("");

      setMessage(
        "Gallery image added successfully."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to add gallery image."
      );
    }
  }

  async function deleteGalleryItem(
    id: string
  ) {
    if (
      !window.confirm(
        "Delete this gallery image?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/gallery/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete gallery image."
        );
      }

      setMessage(
        "Gallery image deleted."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete gallery image."
      );
    }
  }

  async function addSocialLink(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!socialUrl.trim()) {
      setMessage(
        "Please enter a social media URL."
      );

      return;
    }

    try {
      const response = await fetch(
        "/api/social-links",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform,
            url: socialUrl,
            label: platform,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add social link."
        );
      }

      setSocialUrl("");

      setMessage(
        `${platform} link added successfully.`
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to add social media link."
      );
    }
  }

  async function deleteSocialLink(
    id: string
  ) {
    if (
      !window.confirm(
        "Delete this social media link?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/social-links/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete social link."
        );
      }

      setMessage(
        "Social media link deleted."
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete social media link."
      );
    }
  }

  const selectedDefinition =
    pageDefinitions.find(
      (page) =>
        page.slug === selectedSlug
    );

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Website Manager
          </p>

          <h1 className="mt-2 text-4xl font-black text-gray-900">
            Customize Your Website
          </h1>

          <p className="mt-3 max-w-3xl text-gray-600">
            Change your school's website content
            yourself. No developer is required for
            normal text, information, social links or
            gallery updates.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 font-semibold text-blue-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center text-gray-500 shadow-sm">
            Loading website manager...
          </div>
        ) : (
          <>
            {/* PAGE SELECTOR */}

            <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  Website Pages
                </h2>

                <p className="mt-2 text-gray-500">
                  Choose a page to edit.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {pageDefinitions.map(
                  (page) => (
                    <button
                      key={page.slug}
                      type="button"
                      onClick={() =>
                        selectPage(page.slug)
                      }
                      className={`rounded-2xl border p-5 text-left transition ${
                        selectedSlug ===
                        page.slug
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-lg font-black text-gray-900">
                        {page.label}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        {page.description}
                      </p>
                    </button>
                  )
                )}
              </div>
            </section>

            {/* PAGE EDITOR */}

            <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-7">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black text-gray-900">
                    Edit{" "}
                    {selectedDefinition?.label ||
                      "Page"}
                  </h2>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                    /{selectedSlug}
                  </span>
                </div>

                <p className="mt-2 text-gray-500">
                  Everything saved here will be
                  available to the public website.
                </p>
              </div>

              <form
                onSubmit={savePage}
                className="space-y-7"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Main Title
                    </label>

                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateField(
                          "title",
                          event.target.value
                        )
                      }
                      placeholder="Enter page title"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Subtitle
                    </label>

                    <input
                      value={form.subtitle}
                      onChange={(event) =>
                        updateField(
                          "subtitle",
                          event.target.value
                        )
                      }
                      placeholder="Enter a short subtitle"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Main Content
                  </label>

                  <textarea
                    value={form.body}
                    onChange={(event) =>
                      updateField(
                        "body",
                        event.target.value
                      )
                    }
                    rows={7}
                    placeholder="Write the main content for this page..."
                    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <h3 className="mb-4 font-black text-gray-900">
                      Section One
                    </h3>

                    <div className="space-y-4">
                      <input
                        value={
                          form.sectionOneTitle
                        }
                        onChange={(event) =>
                          updateField(
                            "sectionOneTitle",
                            event.target.value
                          )
                        }
                        placeholder="Section title"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      />

                      <textarea
                        value={
                          form.sectionOneText
                        }
                        onChange={(event) =>
                          updateField(
                            "sectionOneText",
                            event.target.value
                          )
                        }
                        rows={6}
                        placeholder="Section content..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5">
                    <h3 className="mb-4 font-black text-gray-900">
                      Section Two
                    </h3>

                    <div className="space-y-4">
                      <input
                        value={
                          form.sectionTwoTitle
                        }
                        onChange={(event) =>
                          updateField(
                            "sectionTwoTitle",
                            event.target.value
                          )
                        }
                        placeholder="Section title"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      />

                      <textarea
                        value={
                          form.sectionTwoText
                        }
                        onChange={(event) =>
                          updateField(
                            "sectionTwoText",
                            event.target.value
                          )
                        }
                        rows={6}
                        placeholder="Section content..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* FOUNDER */}

                {selectedSlug === "about" && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                    <h3 className="mb-4 text-xl font-black text-gray-900">
                      Founder
                    </h3>

                    <div className="space-y-4">
                      <input
                        value={form.founderName}
                        onChange={(event) =>
                          updateField(
                            "founderName",
                            event.target.value
                          )
                        }
                        placeholder="Founder name"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      />

                      <textarea
                        value={
                          form.founderMessage
                        }
                        onChange={(event) =>
                          updateField(
                            "founderMessage",
                            event.target.value
                          )
                        }
                        rows={7}
                        placeholder="Message from the founder..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : `Save ${
                          selectedDefinition?.label ||
                          "Page"
                        }`}
                  </button>
                </div>
              </form>
            </section>

            {/* GALLERY */}

            <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  Gallery & Facilities
                </h2>

                <p className="mt-2 text-gray-500">
                  Add facilities, memories,
                  achievements and school activities.
                </p>
              </div>

              <form
                onSubmit={addGalleryItem}
                className="mb-8 space-y-5"
              >
                <ImageUpload
                  value={imageUrl || null}
                  onChange={(url) =>
                    setImageUrl(url || "")
                  }
                  uploadFolder="gallery"
                  label="Gallery Image"
                  description="Drag & drop a school photo here, click to browse, or paste an image with Ctrl + V"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={imageTitle}
                    onChange={(event) =>
                      setImageTitle(
                        event.target.value
                      )
                    }
                    placeholder="Image title"
                    className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={imageDescription}
                    onChange={(event) =>
                      setImageDescription(
                        event.target.value
                      )
                    }
                    placeholder="Description"
                    className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-gray-900 px-5 py-3 font-bold text-white hover:bg-gray-800"
                >
                  Add Image
                </button>
              </form>

              {gallery.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                  No gallery images yet.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-gray-200"
                    >
                      <img
                        src={item.imageUrl}
                        alt={
                          item.title ||
                          "School gallery"
                        }
                        className="h-48 w-full object-cover"
                      />

                      <div className="p-4">
                        <h3 className="font-black text-gray-900">
                          {item.title ||
                            "Untitled image"}
                        </h3>

                        {item.description && (
                          <p className="mt-2 text-sm leading-6 text-gray-500">
                            {item.description}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            deleteGalleryItem(
                              item.id
                            )
                          }
                          className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SOCIAL MEDIA */}

            <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  School Social Media
                </h2>

                <p className="mt-2 text-gray-500">
                  Add the school's official social
                  media accounts.
                </p>
              </div>

              <form
                onSubmit={addSocialLink}
                className="mb-8 grid gap-4 md:grid-cols-[200px_1fr_160px]"
              >
                <select
                  value={platform}
                  onChange={(event) =>
                    setPlatform(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  {platforms.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  value={socialUrl}
                  onChange={(event) =>
                    setSocialUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-gray-900 px-5 py-3 font-bold text-white hover:bg-gray-800"
                >
                  Add Account
                </button>
              </form>

              {socialLinks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                  No social media accounts added.
                </div>
              ) : (
                <div className="space-y-3">
                  {socialLinks.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-black text-gray-900">
                          {item.platform}
                        </p>

                        <p className="mt-1 break-all text-sm text-gray-500">
                          {item.url}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteSocialLink(
                            item.id
                          )
                        }
                        className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}