import { Suspense } from "react";
import { ReviewScreen } from "./ReviewScreen";

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewScreen />
    </Suspense>
  );
}
