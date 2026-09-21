"use client";

import { useState, useEffect, useMemo } from "react";
import { Sparkles, RefreshCw, Clapperboard } from "lucide-react";
import type { Brand, ContentItem, VideoScript } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

type Scene = {
  scene: number;
  visual: string;
  voiceover: string;
  onScreenText: string;
  durationSeconds: number;
};

function parseScenes(value: string): Scene[] {
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function VideoStudio({
  brands,
  contentItems,
  defaultContentId,
}: {
  brands: Brand[];
  contentItems: ContentItem[];
  defaultContentId?: string;
}) {
  const [contentId, setContentId] = useState(defaultContentId ?? contentItems[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [scripts, setScripts] = useState<VideoScript[]>([]);

  const selectedItem = useMemo(
    () => contentItems.find((c) => c.id === contentId),
    [contentItems, contentId]
  );

  function brandName(id: string) {
    return brands.find((b) => b.id === id)?.name ?? "";
  }

  useEffect(() => {
    if (!contentId) return;
    fetch(`/api/content/${contentId}/video-script`)
      .then((r) => r.json())
      .then((data) => setScripts(data.scripts ?? []))
      .catch(() => {});
  }, [contentId]);

  async function generate() {
    if (!contentId) return;
    setLoading(true);
    setError(null);
    setNotConfigured(false);

    const res = await fetch(`/api/content/${contentId}/video-script`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 503) setNotConfigured(true);
      else setError(data.error ?? "Something went wrong.");
      return;
    }

    setScripts((prev) => [data.script, ...prev]);
  }

  if (contentItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">No content yet</p>
        <p className="mt-1 text-sm text-muted">
          Generate a post in Content Studio first — the Video Agent scripts
          from its brief.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2 lg:self-start">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <label className="block text-sm font-medium text-ink">Content</label>
          <select
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            {contentItems.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} — {brandName(c.brandId)}
              </option>
            ))}
          </select>

          {selectedItem && (
            <div className="mt-4 rounded-lg bg-canvas p-3.5 text-xs text-ink/70">
              {selectedItem.sourceBrief || selectedItem.body}
            </div>
          )}

          {notConfigured && (
            <div className="mt-4 rounded-lg bg-amber-light px-4 py-3 text-sm text-ink/80">
              The Video Agent needs an <code className="rounded bg-ink/5 px-1">ANTHROPIC_API_KEY</code> configured
              on the server to run.
            </div>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
          )}

          <button
            onClick={generate}
            disabled={loading || !contentId}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Scripting…" : "Generate video script"}
          </button>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-3">
        {scripts.length === 0 ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <Clapperboard className="h-5 w-5 text-muted" />
            <p className="mt-3 text-sm font-medium text-ink">No scripts yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Generate a scene-by-scene script an editor can shoot and cut from.
            </p>
          </div>
        ) : (
          scripts.map((script) => {
            const scenes = parseScenes(script.scenes);
            return (
              <div key={script.id} className="rounded-xl border border-border bg-surface p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{script.title}</p>
                  {script.totalDurationSeconds && (
                    <span className="rounded border border-border px-1.5 py-0.5 text-[0.68rem] text-muted">
                      ~{script.totalDurationSeconds}s
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {scenes.map((scene) => (
                    <div key={scene.scene} className="rounded-lg border border-border p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-indigo">Scene {scene.scene}</p>
                        <span className="text-[0.68rem] text-muted">{scene.durationSeconds}s</span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink/80">{scene.visual}</p>
                      {scene.voiceover && scene.voiceover !== "none" && (
                        <p className="mt-1.5 text-xs text-muted">
                          <span className="font-medium text-ink/60">VO: </span>
                          {scene.voiceover}
                        </p>
                      )}
                      {scene.onScreenText && (
                        <p className="mt-1 text-xs text-muted">
                          <span className="font-medium text-ink/60">Text: </span>
                          {scene.onScreenText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
