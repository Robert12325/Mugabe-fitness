"use client";

import { deleteStep, newId, saveStep } from "@/lib/store";
import { byNumber } from "@/lib/order";
import { useDB } from "@/lib/use-store";
import { Btn, Card, Field, SectionTitle, TextField } from "./ui";

export default function MethodPanel() {
  const db = useDB();

  return (
    <Card decorated>
      <SectionTitle
        icon="dumbbell"
        title="The Method"
        hint="The numbered steps shown in the Method section. Edits save as you type."
        action={
          <Btn
            size="sm"
            variant="gold"
            icon="plus"
            onClick={() =>
              saveStep({
                id: newId(),
                number: String(db.method.length + 1).padStart(2, "0"),
                title: "New Step",
                text: "",
              })
            }
          >
            Add step
          </Btn>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {byNumber(db.method).map((step) => (
          <div
            key={step.id}
            className="rounded-2xl border border-white/10 bg-white/[0.015] p-5"
          >
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <Field
                label="No."
                value={step.number}
                onChange={(v) => saveStep({ ...step, number: v })}
              />

              <Field
                label="Title"
                value={step.title}
                onChange={(v) => saveStep({ ...step, title: v })}
              />
            </div>

            <div className="mt-4">
              <TextField
                label="Text"
                rows={3}
                value={step.text}
                onChange={(v) => saveStep({ ...step, text: v })}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Btn
                size="sm"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete step "${step.title}"?`)) {
                    deleteStep(step.id);
                  }
                }}
              >
                Delete
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
