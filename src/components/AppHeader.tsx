import { APP_NAME } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="flex h-14 flex-none items-center border-b border-rule px-4 lg:px-8">
      <span className="font-mono text-[15px] font-semibold tracking-[.04em]">
        {APP_NAME}
      </span>
    </header>
  );
}
