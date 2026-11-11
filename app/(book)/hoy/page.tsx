import { Suspense } from "react";
import { HoyClient } from "./HoyClient";

export default function HoyPage() {
  return (
    <Suspense>
      <HoyClient />
    </Suspense>
  );
}
