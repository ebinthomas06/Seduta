import { StepIndicator } from "@/components/ui/StepIndicator";
import { TopBar } from "@/components/ui/TopBar";

interface StepScreenProps {
  /** 1-based step number (1 Setup, 2 Groups, 3 Rooms, 4 Review). */
  step: number;
  stepName: string;
  backHref: string;
  backLabel: string;
  /** Pinned bottom area, usually a BottomBar. */
  footer: React.ReactNode;
  children: React.ReactNode;
}

/** Shared frame for the four plan steps on a phone: top bar, step indicator, body, bottom bar. */
export function StepScreen({
  step,
  stepName,
  backHref,
  backLabel,
  footer,
  children,
}: StepScreenProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <TopBar title="New seating plan" backHref={backHref} backLabel={backLabel} />
      <StepIndicator step={step} name={stepName} />
      <main className="flex flex-1 flex-col gap-7 px-4 pt-6 pb-6">{children}</main>
      <div className="sticky bottom-0 bg-bg">{footer}</div>
    </div>
  );
}
