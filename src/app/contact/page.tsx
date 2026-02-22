// src/app/contact/page.tsx

"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSending(true);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      if (res.ok) {
        setDone(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        alert("Failed to send message");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 space-y-6">
      <h1 className="text-3xl font-bold">Contact</h1>

      {done && (
        <div className="rounded-lg border p-4 text-sm">
          Thanks! Your message was submitted.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">

        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="contact-name" className="text-sm font-medium">
            Name
          </label>

          <input
            id="contact-name"
            name="name"
            type="text"
            className="w-full border rounded p-2"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="contact-email" className="text-sm font-medium">
            Email
          </label>

          <input
            id="contact-email"
            name="email"
            type="email"
            className="w-full border rounded p-2"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label htmlFor="contact-message" className="text-sm font-medium">
            Message
          </label>

          <textarea
            id="contact-message"
            name="message"
            className="w-full border rounded p-2"
            rows={6}
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send Message"}
        </button>

      </form>
    </main>
  );
}