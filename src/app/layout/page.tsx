import type { Metadata } from "next";
import { Suspense } from "react";
import { LayoutScreen } from "./LayoutScreen";

export const metadata: Metadata = { title: "Seat layout" };

export default function LayoutPage() {
  return (
    <Suspense fallback={null}>
      <LayoutScreen />
    </Suspense>
  );
}
