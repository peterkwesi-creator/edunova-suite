"use client";

import { FormEvent, useState } from "react";

type ContactFormProps = {
  schoolId: string;
  primaryColor: string;
};

export default function ContactForm({
  schoolId,
  primaryColor,
}: ContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "ENQUIRY",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          schoolId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send your message."
        );
      }

      setSuccess(
        "Your message has been sent successfully. The school will review it shortly."
      );

      setForm({
        name: "",
        email: "",
        phone: "",
        type: "ENQUIRY",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Full Name *
          </label>

          <input
            id="name"
            value={form.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
            required
            placeholder="Your full name"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2"
            style={{
              // @ts-expect-error Tailwind does not type CSS custom focus properties.
              "--tw-ring-color": `${primaryColor}55`,
            }}
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Message Type *
          </label>

          <select
            id="type"
            value={form.type}
            onChange={(e) =>
              updateField("type", e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
          >
            <option value="ENQUIRY">Enquiry</option>
            <option value="COMPLAINT">Complaint</option>
            <option value="SUGGESTION">Suggestion</option>
            <option value="FEEDBACK">Feedback</option>
            <option value="ADMISSIONS">Admissions</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Phone
          </label>

          <input
            id="phone"
            value={form.phone}
            onChange={(e) =>
              updateField("phone", e.target.value)
            }
            placeholder="020 000 0000"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Subject
        </label>

        <input
          id="subject"
          value={form.subject}
          onChange={(e) =>
            updateField("subject", e.target.value)
          }
          placeholder="What is your message about?"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Message *
        </label>

        <textarea
          id="message"
          value={form.message}
          onChange={(e) =>
            updateField("message", e.target.value)
          }
          required
          rows={7}
          placeholder="Write your message here..."
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl px-5 py-3.5 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}