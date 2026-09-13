"use client";

import { useMemo, useState } from "react";
import ContactScene from "@/components/motion/contact-scene";
import { addLead } from "@/lib/store";
import { useDB } from "@/lib/use-store";

const GOALS = [
  "Fat loss",
  "Muscle gain",
  "Strength",
  "General fitness",
  "Sport performance",
];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  programId: "",
  slot: "",
  goal: GOALS[0],
  message: "",
};

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white/70 px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black focus:bg-white";

const labelClass =
  "mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-black/55";

export default function EnquiryForm() {
  const db = useDB();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const programs = useMemo(
    () => db.programs.filter((program) => program.active),
    [db.programs],
  );

  const selected = programs.find((program) => program.id === form.programId);

  // One program chosen -> just its slots. Nothing chosen yet -> every slot,
  // grouped, so a visitor can still say when they want to train.
  const slotGroups = selected
    ? [{ name: selected.name, slots: selected.slots }]
    : programs
        .filter((program) => program.slots.length > 0)
        .map((program) => ({ name: program.name, slots: program.slots }));

  const hasSlots = slotGroups.some((group) => group.slots.length > 0);

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Switching program invalidates a slot picked from the previous one.
  function setProgram(programId: string) {
    const next = programs.find((program) => program.id === programId);
    const stillValid = next ? next.slots.includes(form.slot) : false;

    setForm((prev) => ({
      ...prev,
      programId,
      slot: stillValid ? prev.slot : "",
    }));
  }

  function validate() {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = "Please enter your name.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Please enter a valid email.";
    }

    if (form.phone.replace(/\D/g, "").length < 7) {
      next.phone = "Please enter a valid phone number.";
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate();
    setErrors(found);

    if (Object.keys(found).length > 0) return;

    addLead({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      programId: form.programId || programs[0]?.id || "",
      slot: form.slot,
      goal: form.goal,
      message: form.message.trim(),
    });

    setForm(EMPTY);
    setDone(true);
  }

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden bg-[#d4af37] px-6 py-24 lg:px-8"
    >
      <ContactScene />

      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-black/70">
            Your next chapter starts here
          </p>

          <h2 className="mt-4 max-w-2xl text-5xl font-black uppercase leading-none tracking-tight text-black sm:text-7xl">
            Ready to rise?
          </h2>

          <p className="mt-7 max-w-md text-base leading-7 text-black/75">
            Tell me where you are today and what you want to build. I&apos;ll
            come back to you with the plan that fits.
          </p>

          <dl className="mt-10 space-y-3 text-sm font-semibold text-black/80">
            <div className="flex gap-3">
              <dt className="w-16 text-black/75">Email</dt>
              <dd>{db.settings.coachEmail}</dd>
            </div>

            <div className="flex gap-3">
              <dt className="w-16 text-black/75">Phone</dt>
              <dd>{db.settings.coachPhone}</dd>
            </div>
          </dl>
        </div>

        {done ? (
          <div className="rounded-[2rem] border border-black/20 bg-black p-10 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]">
            <div className="text-4xl">✓</div>

            <h3 className="mt-5 text-2xl font-black uppercase text-white">
              Request received
            </h3>

            <p className="mt-3 text-sm leading-7 text-white/50">
              Your details are saved. I&apos;ll reach out on the contact you
              gave to get you started.
            </p>

            <button
              type="button"
              onClick={() => setDone(false)}
              className="mt-8 rounded-full bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white"
            >
              Send another
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-[2rem] border border-black/20 bg-[#d4af37]/70 p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-9"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>

                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />

                {errors.name && (
                  <p className="mt-2 text-xs font-semibold text-red-900">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>

                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  placeholder="+91 00000 00000"
                  className={inputClass}
                />

                {errors.phone && (
                  <p className="mt-2 text-xs font-semibold text-red-900">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>

              <input
                id="email"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />

              {errors.email && (
                <p className="mt-2 text-xs font-semibold text-red-900">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="program" className={labelClass}>
                  Program
                </label>

                <select
                  id="program"
                  value={form.programId}
                  onChange={(event) => setProgram(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Not sure yet</option>

                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} — {program.price}
                      {program.period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="goal" className={labelClass}>
                  Main goal
                </label>

                <select
                  id="goal"
                  value={form.goal}
                  onChange={(event) => set("goal", event.target.value)}
                  className={inputClass}
                >
                  {GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasSlots && (
              <div className="mt-5">
                <label htmlFor="slot" className={labelClass}>
                  Preferred time
                </label>

                <select
                  id="slot"
                  value={form.slot}
                  onChange={(event) => set("slot", event.target.value)}
                  className={inputClass}
                >
                  <option value="">No preference</option>

                  {selected
                    ? selected.slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))
                    : slotGroups.map((group) => (
                        <optgroup key={group.name} label={group.name}>
                          {group.slots.map((slot) => (
                            <option key={group.name + slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                </select>

                <p className="mt-2 text-xs text-black/45">
                  {selected
                    ? "Slots available for " + selected.name + "."
                    : "Pick a program above to narrow these down."}
                </p>
              </div>
            )}

            <div className="mt-5">
              <label htmlFor="message" className={labelClass}>
                Anything else
              </label>

              <textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(event) => set("message", event.target.value)}
                placeholder="Injuries, schedule, experience level…"
                className={`${inputClass} resize-y`}
              />
            </div>

            <button
              type="submit"
              className="mt-7 w-full rounded-full bg-black px-7 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white hover:text-black"
            >
              Start Training
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
