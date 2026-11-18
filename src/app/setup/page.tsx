import { Suspense } from "react";
import { SetupScreen } from "./SetupScreen";

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupScreen />
    </Suspense>
  );
}
