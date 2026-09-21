import Link from "next/link";
import {
  Compass,
  PenSquare,
  ShieldCheck,
  Palette,
  Clapperboard,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const configured = !!process.env.ANTHROPIC_API_KEY;

const AGENTS = [
  {
    name: "Strategy Agent",
    icon: Compass,
    description: "Turns a campaign objective into content pillars and key messages.",
    usedIn: "Campaigns",
    href: "/campaigns",
  },
  {
    name: "Content Agent",
    icon: PenSquare,
    description: "Writes captions and hashtags grounded in a brand's knowledge base.",
    usedIn: "Content Studio",
    href: "/content-studio",
  },
  {
    name: "QA Agent",
    icon: ShieldCheck,
    description: "Checks a draft against forbidden words, tone, and required hashtags before review.",
    usedIn: "Content Calendar",
    href: "/content-calendar",
  },
  {
    name: "Creative Agent",
    icon: Palette,
    description: "Writes a creative brief — composition, brand colors, mood — for a designer to execute.",
    usedIn: "Creative Studio",
    href: "/creative-studio",
  },
  {
    name: "Video Agent",
    icon: Clapperboard,
    description: "Writes a scene-by-scene script an editor can shoot and cut from.",
    usedIn: "Video Studio",
    href: "/video-studio",
  },
  {
    name: "Insights & Optimization Agent",
    icon: Sparkles,
    description: "Reads real published performance and surfaces patterns and recommendations.",
    usedIn: "AI Insights",
    href: "/insights",
  },
];

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl text-ink">Agents</h1>
      <p className="mt-1 text-sm text-muted">
        Every AI agent in the platform, and where it's used.
      </p>

      <div
        className={`mt-6 rounded-lg px-4 py-3 text-sm ${
          configured ? "bg-success-light text-success" : "bg-amber-light text-ink/80"
        }`}
      >
        {configured ? (
          "ANTHROPIC_API_KEY is configured — all agents below are live."
        ) : (
          <>
            No <code className="rounded bg-ink/5 px-1">ANTHROPIC_API_KEY</code> configured —
            agents will return a clear "not configured" message until one is added to the environment.
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {AGENTS.map((agent) => (
          <Link
            key={agent.name}
            href={agent.href}
            className="group rounded-xl border border-border bg-surface p-5 shadow-card transition hover:border-indigo/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-light text-indigo">
                <agent.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
            </div>
            <h3 className="mt-3 font-display text-base text-ink">{agent.name}</h3>
            <p className="mt-1 text-sm text-ink/70">{agent.description}</p>
            <p className="mt-3 text-xs font-medium text-muted">Used in {agent.usedIn}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
