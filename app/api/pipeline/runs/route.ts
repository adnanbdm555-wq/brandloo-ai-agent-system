import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pipelineRuns } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");

  const rows = brandId
    ? await db
        .select()
        .from(pipelineRuns)
        .where(
          and(eq(pipelineRuns.brandId, brandId), eq(pipelineRuns.agencyId, session.user.agencyId))
        )
        .orderBy(desc(pipelineRuns.createdAt))
        .limit(20)
    : await db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.agencyId, session.user.agencyId))
        .orderBy(desc(pipelineRuns.createdAt))
        .limit(20);

  return NextResponse.json({ runs: rows });
}
