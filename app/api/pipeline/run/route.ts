import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { runPipeline } from "@/lib/ai/pipeline";
import { z } from "zod";

const schema = z.object({
  brandId: z.string().min(1),
  campaignId: z.string().optional().or(z.literal("")),
  platform: z.string().min(1, "Platform is required"),
  contentType: z
    .enum(["POST", "REEL", "STORY", "CAROUSEL", "VIDEO", "ARTICLE"])
    .default("POST"),
  brief: z.string().min(3, "Give the pipeline a brief to work from").max(2000),
  runCreative: z.boolean().default(true),
  runVideo: z.boolean().default(true),
  runQA: z.boolean().default(true),
  autoSubmit: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to run the pipeline" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, data.brandId), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const result = await runPipeline({
    agencyId: session.user.agencyId,
    brandId: data.brandId,
    campaignId: data.campaignId || null,
    platform: data.platform,
    contentType: data.contentType,
    brief: data.brief,
    runCreative: data.runCreative,
    runVideo: data.runVideo,
    runQA: data.runQA,
    autoSubmit: data.autoSubmit,
    actorId: session.user.id,
    actorName: session.user.name ?? "Someone",
  });

  return NextResponse.json(result, { status: result.status === "COMPLETED" ? 201 : 502 });
}
