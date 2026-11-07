import { redirect } from "next/navigation";

export default function LegacyMatchesRedirect() {
  redirect("/discover");
}
