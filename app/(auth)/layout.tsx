export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[42%] flex-col justify-between bg-ink px-14 py-12 text-canvas lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber text-sm font-semibold text-ink">
            A
          </div>
          <span className="font-display text-lg">AdPulse AI</span>
        </div>

        <div className="max-w-sm">
          <p className="font-display text-[2.35rem] italic leading-[1.15] text-canvas/95">
            One desk. Every brand, every agent, every approval.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-canvas/60">
            Strategy, content, creative, QA, approval, and publishing — run
            as a single pipeline your team can actually see.
          </p>
        </div>

        <p className="text-xs text-canvas/40">
          AdPulse IMC (Pvt.) Ltd. — Social Media Operations
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
