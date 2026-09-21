import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { aiInsights, brands } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { runInsightsAgent, InsufficientDataError } from "@/lib/ai/insights-agent";
import { AgentConfigError } from "@/lib/ai/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const rows = await db
    .select()
    .from(aiInsights)
    .where(and(eq(aiInsights.brandId, id), eq(aiInsights.agencyId, session.user.agencyId)))
    .orderBy(desc(aiInsights.createdAt))
    .limit(1);

  return NextResponse.json({ insight: rows[0] ?? null });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to generate insights" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, id), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  try {
    const result = await runInsightsAgent(id);

    const [created] = await db
      .insert(aiInsights)
      .values({
        agencyId: session.user.agencyId,
        brandId: id,
        summary: result.summary,
        observations: JSON.stringify(result.observations),
        recommendations: JSON.stringify(result.recommendations),
        dataPointsUsed: result.dataPointsUsed,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json({ insight: created }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientDataError) {
      return NextResponse.json(
        { error: err.message, insufficientData: true, dataPointsUsed: err.dataPointsUsed, required: err.required },
        { status: 422 }
      );
    }
    if (err instanceof AgentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Insights Agent error:", err);
    return NextResponse.json(
      { error: "The Insights Agent couldn't complete this run. Try again." },
      { status: 502 }
    );
  }
}
