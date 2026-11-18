"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SettingsPanel } from "@/components/plans/SettingsPanel";
import { PlusIcon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { StatusTag } from "@/components/ui/StatusTag";
import {
  createPlan,
  deletePlan,
  duplicatePlan,
  listPlans,
} from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import {
  formatEdited,
  institutionLabel,
  planHref,
  studentCount,
} from "@/lib/plan-utils";
import { routes } from "@/lib/routes";

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export function PlansScreen() {
  const router = useRouter();
  const plans = useLiveQuery(() => listPlans(), []);
  const [menuFor, setMenuFor] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);

  async function newPlan() {
    const plan = await createPlan();
    router.push(routes.setup(plan.id));
  }

  async function copyPlan(plan: Plan) {
    setMenuFor(null);
    await duplicatePlan(plan.id);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deletePlan(deleting.id);
    setDeleting(null);
  }

  const newPlanButton = (className?: string) => (
    <Button onClick={newPlan} className={className}>
      <PlusIcon /> New seating plan
    </Button>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col gap-6 px-4 pt-7 lg:gap-8 lg:px-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] leading-[1.15] font-semibold lg:text-[32px]">
              Seating plans
            </h1>
            <p className="text-[14px] leading-snug text-ink2 lg:text-[15px]">
              <span className="lg:hidden">
                Saved on this device. Nothing leaves your phone.
              </span>
              <span className="hidden lg:inline">
                Saved on this computer. Nothing is uploaded.
              </span>
            </p>
          </div>
          <div className="hidden lg:block">
            {newPlanButton("h-12 px-5 text-[15px]")}
          </div>
        </div>

        {plans === undefined ? (
          <p className="text-[14px] text-ink2" role="status">
            Loading plans…
          </p>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-start gap-2 border-t border-ink pt-6">
            <h2 className="text-[17px] font-medium">No seating plans yet</h2>
            <p className="max-w-md text-[14px] leading-snug text-ink2">
              Create a plan, add who is writing and which rooms you have, and
              Seduta seats everyone so no two neighbours share a subject.
            </p>
          </div>
        ) : (
          <>
            {/* Phone: list (M1) */}
            <ul className="m-0 flex list-none flex-col border-t border-ink p-0 lg:hidden">
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="flex min-h-[76px] items-center border-b border-rule"
                >
                  <Link
                    href={planHref(p)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 text-ink no-underline"
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-[17px] leading-tight font-medium">
                        {p.name}
                      </span>
                      <span className="text-[14px] leading-snug text-ink2">
                        {institutionLabel(p)} · {plural(p.rooms.length, "room")}{" "}
                        · {plural(studentCount(p), "student")}
                      </span>
                      <span className="font-mono text-[12px] text-ink2">
                        Edited{" "}
                        {formatEdited(p.updatedAt).replace(/^Today$/, "today")}
                      </span>
                    </span>
                    <StatusTag status={p.status} />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Actions for ${p.name}`}
                    onClick={() => setMenuFor(p)}
                    className="flex h-11 w-11 flex-none items-center justify-center text-ink2"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="5" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="12" cy="19" r="1.6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: table (D1) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-[15px]">
                <colgroup>
                  <col />
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[104px]" />
                  <col className="w-[196px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-ink font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase">
                    <th className="pr-4 pb-2.5 font-medium">Name</th>
                    <th className="pr-4 pb-2.5 font-medium">Type</th>
                    <th className="pr-4 pb-2.5 font-medium">Rooms</th>
                    <th className="pr-4 pb-2.5 font-medium">Students</th>
                    <th className="pr-4 pb-2.5 font-medium">Edited</th>
                    <th className="pr-4 pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id} className="h-16 border-b border-rule">
                      <td className="truncate pr-4">
                        <Link
                          href={planHref(p)}
                          className="text-[16px] font-medium text-ink no-underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="pr-4">{institutionLabel(p)}</td>
                      <td className="pr-4 font-mono">{p.rooms.length}</td>
                      <td className="pr-4 font-mono">{studentCount(p)}</td>
                      <td className="pr-4 text-ink2">
                        {formatEdited(p.updatedAt)}
                      </td>
                      <td className="pr-4">
                        <StatusTag status={p.status} />
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Button
                            href={planHref(p)}
                            variant="text"
                            aria-label={`Open ${p.name}`}
                          >
                            Open
                          </Button>
                          <Button
                            variant="text"
                            aria-label={`Duplicate ${p.name}`}
                            onClick={() => copyPlan(p)}
                          >
                            Duplicate
                          </Button>
                          <Button
                            variant="textDanger"
                            aria-label={`Delete ${p.name}`}
                            onClick={() => setDeleting(p)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <SettingsPanel />
      </main>

      <BottomBar className="sticky bottom-0 mt-6 bg-bg lg:hidden">
        {newPlanButton()}
      </BottomBar>

      <Modal
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.name ?? ""}
        variant="dialog"
        maxWidth={360}
      >
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => menuFor && copyPlan(menuFor)}
          >
            Duplicate
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              setDeleting(menuFor);
              setMenuFor(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this plan?"
        message={
          deleting
            ? `“${deleting.name}” and its seating layout will be removed from this device. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete plan"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
