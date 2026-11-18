import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_NAME } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="flex h-14 flex-none items-center justify-between border-b border-rule pr-2 pl-4 lg:pr-6 lg:pl-8">
      <span className="font-mono text-[15px] font-semibold tracking-[.04em]">
        {APP_NAME}
      </span>
      <ThemeToggle />
    </header>
  );
}
