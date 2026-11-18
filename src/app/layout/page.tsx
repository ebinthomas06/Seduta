import { Suspense } from "react";
import { LayoutScreen } from "./LayoutScreen";

export default function LayoutPage() {
  return (
    <Suspense fallback={null}>
      <LayoutScreen />
    </Suspense>
  );
}
