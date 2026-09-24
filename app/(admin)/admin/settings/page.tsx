"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [schoolName, setSchoolName] = useState("");
  const [motto, setMotto] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [x, setX] = useState("");

  const [message, setMessage] = useState("");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Temporary save confirmation.
    // We will connect this to Prisma after the interface is working.
    setMessage("School settings saved successfully.");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            School Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Customize your school's public website and information.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* SCHOOL INFORMATION */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-semibold text-gray-900">
              School Information
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              Basic information displayed throughout the school website.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  School Name
                </label>

                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Central Lyceum School"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  School Motto
                </label>

                <input
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="e.g. Knowledge, Character, Excellence"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  School Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Tell visitors about your school..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 020 000 0000"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="school@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  School Address
                </label>

                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="School address"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* SOCIAL MEDIA */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-semibold text-gray-900">
              Social Media
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              Add your school's social-media pages. These will later appear
              on the public website.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Facebook
                </label>

                <input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Instagram
                </label>

                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  TikTok
                </label>

                <input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  YouTube
                </label>

                <input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  X / Twitter
                </label>

                <input
                  value={x}
                  onChange={(e) => setX(e.target.value)}
                  placeholder="https://x.com/..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* WEBSITE CUSTOMIZATION */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-semibold text-gray-900">
              Website Customization
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              These options will control the school's public website.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-2xl">🏫</div>
                <h3 className="mt-2 font-semibold">School Branding</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Logo, colors and school identity.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-2xl">📸</div>
                <h3 className="mt-2 font-semibold">Gallery</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload and manage school photos.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-2xl">📰</div>
                <h3 className="mt-2 font-semibold">News</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Publish school announcements and news.
                </p>
              </div>
            </div>
          </section>

          {/* SAVE */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Save School Settings
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}