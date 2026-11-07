import { redirect } from "next/navigation";

export default function LegacyScreensIndex() {
  redirect("/dashboard");
}
