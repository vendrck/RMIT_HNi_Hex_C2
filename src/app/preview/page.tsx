import { notFound } from "next/navigation";
import { PreviewClient } from "./PreviewClient";

// DEV ONLY (PLAN.md "Dev-only shortcut for B"). DELETE src/app/preview/ BEFORE MERGING.
export default function PreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <PreviewClient />;
}
