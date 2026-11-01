import { redirect } from "next/navigation";

export default function LegacyTrustRedirect() {
  redirect("/safety");
}
