"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/Icons";
import { SubjectTile } from "@/components/ui/SubjectTile";
import { cx } from "@/lib/cx";
import { mutatePlanInputs } from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import {
  distinctSubjects,
  emptyForm,
  formFromGroup,
  primaryOptions,
  validateGroupForm,
  type GroupForm,
} from "@/lib/groups";
import { institutionLabels } from "@/lib/labels";
import type { Group } from "@/lib/seating/seating";
import { buildSubjectMap } from "@/lib/subjects";
import { fieldLabelClass, SectionHeading } from "./SectionHeading";

const GRID =
  "grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.7fr)_minmax(0,.7fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_44px] gap-2.5";

const input =
  "h-11 w-full rounded-[3px] border bg-surface px-2.5 text-ink text-[15px]";

export function GroupsTable({ plan }: { plan: Plan }) {
  const labels = institutionLabels(plan.institution);
  // New rows stay local until they are valid, then become real groups with the same id.
  const [drafts, setDrafts] = useState<string[]>([]);
  const subjects = useMemo(() => distinctSubjects(plan.groups), [plan.groups]);
  const subjectMap = useMemo(() => buildSubjectMap(subjects), [subjects]);

  function commit(id: string, data: Omit<Group, "id">) {
    setDrafts((d) => d.filter((x) => x !== id));
    void mutatePlanInputs(plan.id, (p) => ({
      groups: p.groups.some((g) => g.id === id)
        ? p.groups.map((g) => (g.id === id ? { ...data, id } : g))
        : [...p.groups, { ...data, id }],
    }));
  }

  function remove(id: string) {
    setDrafts((d) => d.filter((x) => x !== id));
    void mutatePlanInputs(plan.id, (p) => ({
      groups: p.groups.filter((g) => g.id !== id),
    }));
  }

  const rows = [
    ...plan.groups.map((g) => ({ id: g.id, group: g as Group | null })),
    ...drafts.map((id) => ({ id, group: null })),
  ];

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        number="02"
        title="Groups"
        note="Who is writing, and which subject."
      />
      <div className="overflow-x-auto">
        <div className="flex min-w-[720px] flex-col gap-2">
          <div className={cx(GRID, fieldLabelClass)}>
            <div>{labels.primary}</div>
            <div>{labels.secondary}</div>
            <div>Roll prefix</div>
            <div>From</div>
            <div>To</div>
            <div>Skip</div>
            <div>Subject</div>
            <div />
          </div>
          {rows.map(({ id, group }) => (
            <GroupRow
              key={id}
              id={id}
              initial={
                group
                  ? formFromGroup(group, plan.institution)
                  : emptyForm(plan.institution)
              }
              plan={plan}
              otherSubjects={distinctSubjects(
                plan.groups.filter((g) => g.id !== id),
              )}
              subjectMap={subjectMap}
              onCommit={commit}
              onRemove={remove}
            />
          ))}
        </div>
      </div>
      <Button
        variant="dashed"
        size="sm"
        className="self-start"
        onClick={() => setDrafts((d) => [...d, crypto.randomUUID()])}
      >
        <PlusIcon size={16} /> Add group
      </Button>
    </section>
  );
}

function GroupRow({
  id,
  initial,
  plan,
  otherSubjects,
  subjectMap,
  onCommit,
  onRemove,
}: {
  id: string;
  initial: GroupForm;
  plan: Plan;
  otherSubjects: string[];
  subjectMap: ReturnType<typeof buildSubjectMap>;
  onCommit: (id: string, data: Omit<Group, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const labels = institutionLabels(plan.institution);
  const [form, setForm] = useState<GroupForm>(initial);
  const [touched, setTouched] = useState(false);

  const { errors } = validateGroupForm(form, plan.institution, otherSubjects);
  const messages = Object.values(errors);
  const name = form.secondary || "new group";
  const err = (k: keyof GroupForm) => touched && !!errors[k];
  const cls = (k: keyof GroupForm, mono = false) =>
    cx(
      input,
      mono && "font-mono text-[14px]",
      err(k) ? "border-2 border-alert" : "border-rule2",
    );

  function change(k: keyof GroupForm, value: string) {
    const next = { ...form, [k]: value };
    setForm(next);
    const res = validateGroupForm(next, plan.institution, otherSubjects);
    if (res.group) onCommit(id, res.group);
    else setTouched(true);
  }

  const info = subjectMap.get(
    otherSubjects.find(
      (s) => s.toLowerCase() === form.subject.trim().toLowerCase(),
    ) ?? form.subject.trim(),
  );

  return (
    <div className="flex flex-col gap-1">
      <div className={cx(GRID, "items-center")}>
        <select
          aria-label={`${labels.primary}, ${name}`}
          value={form.primary}
          onChange={(e) => change("primary", e.target.value)}
          className={cls("primary")}
        >
          {primaryOptions(plan.institution, form.primary).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <input
          aria-label={`${labels.secondary}, ${name}`}
          aria-invalid={err("secondary") || undefined}
          value={form.secondary}
          onChange={(e) => change("secondary", e.target.value)}
          className={cls("secondary")}
        />
        <input
          aria-label={`Roll prefix, ${name}`}
          value={form.prefix}
          onChange={(e) => change("prefix", e.target.value)}
          className={cls("prefix", true)}
        />
        <input
          aria-label={`First roll number, ${name}`}
          aria-invalid={err("from") || undefined}
          inputMode="numeric"
          value={form.from}
          onChange={(e) => change("from", e.target.value)}
          className={cls("from", true)}
        />
        <input
          aria-label={`Last roll number, ${name}`}
          aria-invalid={err("to") || undefined}
          inputMode="numeric"
          value={form.to}
          onChange={(e) => change("to", e.target.value)}
          className={cls("to", true)}
        />
        <input
          aria-label={`Skipped numbers, ${name}`}
          aria-invalid={err("skip") || undefined}
          value={form.skip}
          onChange={(e) => change("skip", e.target.value)}
          className={cls("skip", true)}
        />
        <div className="flex items-center gap-2">
          {info ? (
            <SubjectTile info={info} size={32} />
          ) : (
            <span className="h-8 w-8 flex-none" aria-hidden="true" />
          )}
          <input
            aria-label={`Subject, ${name}`}
            aria-invalid={err("subject") || undefined}
            value={form.subject}
            onChange={(e) => change("subject", e.target.value)}
            className={cls("subject")}
          />
        </div>
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={() => onRemove(id)}
          className="flex h-11 w-11 items-center justify-center text-ink2"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {touched && messages.length > 0 && (
        <p role="alert" className="text-[13px] font-medium text-alert">
          {messages.join(" ")} Changes are saved once every field is valid.
        </p>
      )}
    </div>
  );
}
