import { redirect } from "next/navigation";

// Preserve legacy conversation deep links while keeping the Next.js messages
// workspace as the single source of truth for loading and sending messages.
export default async function LegacyConversationRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/messages?c=${encodeURIComponent(id)}`);
}
