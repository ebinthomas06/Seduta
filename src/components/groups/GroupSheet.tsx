"use client";

import { useState } from "react";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { cx } from "@/lib/cx";
import type { Institution } from "@/lib/db/types";
import {
  emptyForm,
  formFromGroup,
  primaryOptions,
  validateGroupForm,
  type GroupForm,
} from "@/lib/groups";
import { institutionLabels } from "@/lib/labels";
import type { Group } from "@/lib/seating/seating";

interface GroupSheetProps {
  open: boolean;
  /** The group being edited, or null when adding. */
  group: Group | null;
  institution: Institution;
  /** Subjects already used in this plan, offered as quick-pick chips. */
  subjects: string[];
  onClose: () => void;
  onSave: (group: Omit<Group, "id">) => void;
  onDelete: () => void;
}

const FORM_ID = "group-form";

export function GroupSheet(props: GroupSheetProps) {
  const { open, group, onClose, onDelete } = props;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={group ? "Edit group" : "Add group"}
      footer={
        <BottomBar row>
          {group && (
            <Button
              variant="danger"
              size="md"
              className="h-13 flex-1"
              onClick={onDelete}
            >
              Delete group
            </Button>
          )}
          <Button
            type="submit"
            form={FORM_ID}
            className={group ? "flex-[2]" : "flex-1"}
          >
            Save group
          </Button>
        </BottomBar>
      }
    >
      {/* Remount per open/target so the fields always start from the right values. */}
      {open && <GroupFields key={group?.id ?? "new"} {...props} />}
    </Modal>
  );
}

function GroupFields({
  group,
  institution,
  subjects,
  onSave,
}: GroupSheetProps) {
  const labels = institutionLabels(institution);
  const [form, setForm] = useState<GroupForm>(() =>
    group ? formFromGroup(group, institution) : emptyForm(institution),
  );
  const [submitted, setSubmitted] = useState(false);

  const result = validateGroupForm(form, institution, subjects);
  const err = (k: keyof GroupForm) =>
    submitted ? result.errors[k] : undefined;
  const set = (k: keyof GroupForm) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      id={FORM_ID}
      noValidate
      className="flex flex-col gap-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (result.group) onSave(result.group);
      }}
    >
      <p className="text-[13px] leading-snug text-ink2">
        For a school, these two fields read Class and Section instead of Year
        and Branch.
      </p>

      <div className="flex gap-3">
        <SelectField
          className="flex-1"
          label={labels.primary}
          options={primaryOptions(institution)}
          value={form.primary}
          onChange={(e) => set("primary")(e.target.value)}
        />
        <TextField
          className="flex-1"
          label={labels.secondary}
          value={form.secondary}
          error={err("secondary")}
          onChange={(e) => set("secondary")(e.target.value)}
        />
      </div>

      <TextField
        label="Roll prefix · optional"
        mono
        value={form.prefix}
        hint="Printed before the number, so 1 becomes 24CS001."
        onChange={(e) => set("prefix")(e.target.value)}
      />

      <div className="flex gap-3">
        <TextField
          className="flex-1"
          label="Roll from"
          mono
          type="number"
          inputMode="numeric"
          value={form.from}
          error={err("from")}
          onChange={(e) => set("from")(e.target.value)}
        />
        <TextField
          className="flex-1"
          label="Roll to"
          mono
          type="number"
          inputMode="numeric"
          value={form.to}
          error={err("to")}
          onChange={(e) => set("to")(e.target.value)}
        />
      </div>

      <TextField
        label="Skip numbers · optional"
        mono
        value={form.skip}
        error={err("skip")}
        hint="Absent students or roll numbers that don't exist, separated by commas."
        onChange={(e) => set("skip")(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <TextField
          label="Exam subject"
          value={form.subject}
          error={err("subject")}
          onChange={(e) => set("subject")(e.target.value)}
        />
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const on = s.toLowerCase() === form.subject.trim().toLowerCase();
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("subject")(s)}
                  className={cx(
                    "h-11 rounded-[3px] border px-3.5 text-[14px] font-medium",
                    on
                      ? "border-ink bg-ink text-bg"
                      : "border-rule2 bg-surface text-ink",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </form>
  );
}
