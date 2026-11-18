import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewScreen } from "./ReviewScreen";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewScreen />
    </Suspense>
  );
}
