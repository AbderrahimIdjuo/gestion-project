"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const GLOW = {
  violet: {
    shadow: "hover:shadow-[0_8px_36px_rgba(139,92,246,0.45)]",
    overlay: "from-violet-400/25 via-violet-300/10 to-transparent",
  },
  fuchsia: {
    shadow: "hover:shadow-[0_8px_36px_rgba(217,70,239,0.45)]",
    overlay: "from-fuchsia-400/25 via-fuchsia-300/10 to-transparent",
  },
  purple: {
    shadow: "hover:shadow-[0_8px_36px_rgba(168,85,247,0.45)]",
    overlay: "from-purple-400/25 via-purple-300/10 to-transparent",
  },
  emerald: {
    shadow: "hover:shadow-[0_8px_36px_rgba(16,185,129,0.42)]",
    overlay: "from-emerald-400/25 via-emerald-300/10 to-transparent",
  },
  amber: {
    shadow: "hover:shadow-[0_8px_36px_rgba(245,158,11,0.42)]",
    overlay: "from-amber-400/25 via-amber-300/10 to-transparent",
  },
  rose: {
    shadow: "hover:shadow-[0_8px_36px_rgba(244,63,94,0.42)]",
    overlay: "from-rose-400/25 via-rose-300/10 to-transparent",
  },
  orange: {
    shadow: "hover:shadow-[0_8px_36px_rgba(249,115,22,0.42)]",
    overlay: "from-orange-400/25 via-orange-300/10 to-transparent",
  },
  teal: {
    shadow: "hover:shadow-[0_8px_36px_rgba(20,184,166,0.42)]",
    overlay: "from-teal-400/25 via-teal-300/10 to-transparent",
  },
  sky: {
    shadow: "hover:shadow-[0_8px_36px_rgba(14,165,233,0.42)]",
    overlay: "from-sky-400/25 via-sky-300/10 to-transparent",
  },
  blue: {
    shadow: "hover:shadow-[0_8px_36px_rgba(59,130,246,0.42)]",
    overlay: "from-blue-400/25 via-blue-300/10 to-transparent",
  },
  indigo: {
    shadow: "hover:shadow-[0_8px_36px_rgba(99,102,241,0.42)]",
    overlay: "from-indigo-400/25 via-indigo-300/10 to-transparent",
  },
  slate: {
    shadow: "hover:shadow-[0_8px_36px_rgba(100,116,139,0.35)]",
    overlay: "from-slate-400/20 via-slate-300/10 to-transparent",
  },
};

function getAccent(classNames) {
  const match = `${classNames || ""}`.match(
    /(?:text|bg)-(red|rose|amber|orange|yellow|lime|emerald|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|slate)-/
  );
  return match?.[1] === "green" ? "emerald" : match?.[1] || "violet";
}

const cardBase =
  "group relative overflow-hidden rounded-3xl border-0 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5";

function GlowOverlay({ accent }) {
  const glow = GLOW[accent] || GLOW.violet;
  return (
    <div
      className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${glow.overlay}`}
    />
  );
}

export function BasicCard({
  title,
  statistiques,
  Icon,
  isLoading,
  iconClassName,
  valueClassName = "text-slate-900",
}) {
  const iconBg =
    iconClassName?.replace(/text-[a-z]+-\d+/g, "").trim() || "bg-gray-100";
  const iconColor =
    iconClassName?.match(/text-[a-z]+-\d+/)?.[0] || "text-gray-600";
  const accent = getAccent(`${iconClassName} ${valueClassName}`);
  const glow = GLOW[accent] || GLOW.violet;

  return (
    <Card className={`${cardBase} ${glow.shadow}`}>
      <GlowOverlay accent={accent} />
      <CardContent className="relative z-10 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-[140px]" />
            ) : (
              <div
                className={`mt-3 text-2xl font-bold tracking-tight ${valueClassName}`}
              >
                {statistiques}
              </div>
            )}
          </div>
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  Icon,
  isLoading,
  iconClassName = "bg-violet-50 text-violet-600",
  valueClassName = "text-slate-900",
  skeletonClassName = "bg-slate-100",
}) {
  const iconBg =
    iconClassName?.replace(/text-[a-z]+-\d+/g, "").trim() || "bg-violet-50";
  const iconColor =
    iconClassName?.match(/text-[a-z]+-\d+/)?.[0] || "text-violet-600";
  const accent = getAccent(`${iconClassName} ${valueClassName}`);
  const glow = GLOW[accent] || GLOW.violet;

  return (
    <Card className={`${cardBase} ${glow.shadow}`}>
      <GlowOverlay accent={accent} />
      <CardContent className="relative z-10 p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {Icon ? (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          ) : null}
        </div>
        {isLoading ? (
          <Skeleton className={`mt-5 h-8 w-[160px] ${skeletonClassName}`} />
        ) : (
          <div
            className={`mt-5 text-3xl font-bold tracking-tight ${valueClassName}`}
          >
            {value}
          </div>
        )}
        {subtitle ? (
          <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
