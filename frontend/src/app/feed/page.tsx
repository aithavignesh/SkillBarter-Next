import { redirect } from "next/navigation";

// The legacy feed is represented by the live community-post workspace.
// Keep the old URL useful without sending members to an unrelated dashboard.
export default function LegacyFeedRedirect() {
  redirect("/community");
}
