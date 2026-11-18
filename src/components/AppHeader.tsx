import { APP_NAME } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="flex h-14 items-center border-b border-rule bg-surface px-4">
      <span className="text-lg font-semibold text-ink">{APP_NAME}</span>
    </header>
  );
}
