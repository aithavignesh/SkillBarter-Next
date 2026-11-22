import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Non-secret deployment metadata used by the staging release smoke check.
 * Never include environment variables other than Vercel's public Git metadata.
 */
export function GET() {
  return NextResponse.json(
    {
      service: "skillbarter-next-web",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
