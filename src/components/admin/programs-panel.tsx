"use client";

import { useState } from "react";
import { deleteProgram, newId, saveProgram } from "@/lib/store";
import type { Program } from "@/lib/types";
import { byNumber } from "@/lib/order";
import { useDB } from "@/lib/use-store";
import { Btn, Card, Field, SectionTitle, TextField } from "./ui";

function blankProgram(index: number): Program {
  return {
    id: newId(),
    number: String(index + 1).padStart(2, "0"),
    name: "New Program",
    subtitle: "Subtitle",
    price: "₹0",
    period: "/month",
    description: "",
    features: [],
    slots: [],
    featured: false,
    active: true,
  };
}

export default function ProgramsPanel() {
  const db = useDB();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Card decorated>
      <SectionTitle
        icon="calendar"
        title="Training programs"
        hint="These cards are what visitors see in the Programs section."
        action={
          <Btn
            size="sm"
            variant="gold"
            icon="plus"
            onClick={() => {
              const program = blankProgram(db.programs.length);
              saveProgram(program);
              setEditingId(program.id);
            }}
          >
            Add program
          </Btn>
        }
      />

      <div className="space-y-3">
        {byNumber(db.programs).map((program) => (
          <div
            key={program.id}
            className="rounded-2xl border border-white/10 bg-white/[0.015]"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
              <span className="text-xs font-bold tracking-[0.25em] text-white/25">
                {program.number}
              </span>

              <span className="flex-1 text-sm font-bold text-white">
                {program.name}
              </span>

              <span className="text-sm text-[#d4af37]">
                {program.price}
                <span className="text-white/30">{program.period}</span>
              </span>

              <span className="text-xs text-white/30">
                {program.slots.length} slot
                {program.slots.length === 1 ? "" : "s"}
              </span>

              <Toggle
                label="Live"
                on={program.active}
                onClick={() =>
                  saveProgram({ ...program, active: !program.active })
                }
              />

              <Toggle
                label="Featured"
                on={program.featured}
                onClick={() =>
                  saveProgram({ ...program, featured: !program.featured })
                }
              />

              <Btn
                size="sm"
                onClick={() =>
                  setEditingId((id) => (id === program.id ? null : program.id))
                }
              >
                {editingId === program.id ? "Close" : "Edit"}
              </Btn>

              <Btn
                size="sm"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete "${program.name}"?`)) {
                    deleteProgram(program.id);
                  }
                }}
              >
                Delete
              </Btn>
            </div>

            {editingId === program.id && (
              <ProgramEditor
                program={program}
                onDone={() => setEditingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
        on
          ? "border-[#d4af37]/50 bg-[#d4af37]/10 text-[#d4af37]"
          : "border-white/12 text-white/30 hover:text-white/60"
      }`}
    >
      {on ? "● " : "○ "}
      {label}
    </button>
  );
}

function ProgramEditor({
  program,
  onDone,
}: {
  program: Program;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<Program>(program);

  function set<K extends keyof Program>(key: K, value: Program[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="border-t border-white/10 px-5 py-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Number"
          value={draft.number}
          onChange={(v) => set("number", v)}
        />

        <Field label="Name" value={draft.name} onChange={(v) => set("name", v)} />

        <Field
          label="Subtitle"
          value={draft.subtitle}
          onChange={(v) => set("subtitle", v)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Price"
            value={draft.price}
            onChange={(v) => set("price", v)}
          />

          <Field
            label="Period"
            value={draft.period}
            onChange={(v) => set("period", v)}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TextField
          label="Description"
          rows={4}
          value={draft.description}
          onChange={(v) => set("description", v)}
        />

        <TextField
          label="Features (one per line)"
          rows={4}
          value={draft.features.join("\n")}
          onChange={(v) =>
            set(
              "features",
              v.split("\n").map((line) => line.trim()).filter(Boolean),
            )
          }
        />
      </div>

      <div className="mt-5">
        <TextField
          label="Training slots (one per line)"
          rows={4}
          placeholder={"7:30–8:30 AM\n8:30–9:30 AM"}
          value={draft.slots.join("\n")}
          onChange={(v) =>
            set(
              "slots",
              v
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            )
          }
        />
      </div>

      <div className="mt-6 flex gap-2">
        <Btn
          variant="gold"
          size="sm"
          onClick={() => {
            saveProgram(draft);
            onDone();
          }}
        >
          Save changes
        </Btn>

        <Btn size="sm" onClick={onDone}>
          Cancel
        </Btn>
      </div>
    </div>
  );
}
