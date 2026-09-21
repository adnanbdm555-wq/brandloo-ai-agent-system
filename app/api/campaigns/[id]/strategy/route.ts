import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { runStrategyAgent } from "@/lib/ai/strategy-agent";
import { AgentConfigError } from "@/lib/ai/client";

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
      { error: "You don't have permission to run the Strategy Agent" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.agencyId, session.user.agencyId)))
    .limit(1);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    const result = await runStrategyAgent({
      brandId: campaign.brandId,
      campaignName: campaign.name,
      objective: campaign.objective ?? "",
    });

    const [updated] = await db
      .update(campaigns)
      .set({
        contentPillars: JSON.stringify(result.contentPillars),
        keyMessages: result.keyMessages,
        strategyNotes: result.strategyNotes,
        strategyGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(campaigns.id, id), eq(campaigns.agencyId, session.user.agencyId)))
      .returning();

    return NextResponse.json({ campaign: updated });
  } catch (err) {
    if (err instanceof AgentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Strategy Agent error:", err);
    return NextResponse.json(
      { error: "The Strategy Agent couldn't complete this run. Try again." },
      { status: 502 }
    );
  }
}
