"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DownloadIcon } from "@/components/ui/Icons";
import { monoLabelClass } from "@/components/ui/TextField";
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from "@/lib/backup";
import { downloadBytes } from "@/lib/export/files";

type Status = { kind: "ok" | "error"; text: string } | null;

/** Backup and restore. Plans live only in this browser, so a backup matters. */
export function SettingsPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function download() {
    setStatus(null);
    try {
      const backup = await createBackup();
      const bytes = new TextEncoder().encode(JSON.stringify(backup, null, 2));
      downloadBytes(bytes, backupFileName(), "application/json");
      const n = backup.plans.length;
      setStatus({
        kind: "ok",
        text: `Backed up ${n} ${n === 1 ? "plan" : "plans"} to your downloads.`,
      });
    } catch {
      setStatus({
        kind: "error",
        text: "Couldn't make the backup. Please try again.",
      });
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    setStatus(null);
    const result = parseBackup(await file.text());
    if (result.ok) setPending(result.backup);
    else setStatus({ kind: "error", text: result.error });
  }

  async function confirmRestore() {
    if (!pending) return;
    try {
      const counts = await restoreBackup(pending);
      setStatus({
        kind: "ok",
        text: `Restored ${counts.plans} ${counts.plans === 1 ? "plan" : "plans"} and ${counts.savedRooms} saved ${counts.savedRooms === 1 ? "room" : "rooms"}.`,
      });
    } catch {
      setStatus({
        kind: "error",
        text: "Couldn't restore the backup. Nothing was changed.",
      });
    }
    setPending(null);
  }

  return (
    <section
      aria-labelledby="settings-heading"
      className="flex flex-col gap-6 border-t border-ink pt-5 pb-4"
    >
      <h2 id="settings-heading" className={monoLabelClass}>
        Settings
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-[16px] font-medium">Back up your plans</h3>
          <p className="text-[14px] leading-snug text-ink2">
            Plans are stored only in this browser. Clearing site data would
            delete them, so keep a copy somewhere safe.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="md" onClick={download}>
            <DownloadIcon /> Download backup
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => fileRef.current?.click()}
          >
            Restore from file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a backup file"
          />
        </div>
        {status && (
          <p
            role={status.kind === "error" ? "alert" : "status"}
            className={
              status.kind === "error"
                ? "text-[14px] font-medium text-alert"
                : "text-[14px] text-ink2"
            }
          >
            {status.text}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Restore this backup?"
        message={
          pending
            ? `This adds ${pending.plans.length} ${pending.plans.length === 1 ? "plan" : "plans"} and ${pending.savedRooms.length} saved ${pending.savedRooms.length === 1 ? "room" : "rooms"}. Anything on this device with the same ID is replaced by the backup's copy. Everything else stays.`
            : ""
        }
        confirmLabel="Restore"
        onCancel={() => setPending(null)}
        onConfirm={confirmRestore}
      />
    </section>
  );
}
