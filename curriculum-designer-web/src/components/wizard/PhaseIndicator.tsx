"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCurriculumStore } from "@/lib/store/curriculum-store";

const createPhases = [
  { number: 1, label: "Course Vision", path: "/design/phase-1", phase: 1 as const },
  { number: 2, label: "Module Design", path: "/design/phase-2", phase: 2 as const },
  { number: 3, label: "Difficulty", path: "/design/phase-3", phase: 3 as const },
  { number: 4, label: "Assessments", path: "/design/phase-4", phase: 4 as const },
  { number: 5, label: "Delivery", path: "/design/phase-5", phase: 5 as const },
  { number: 6, label: "Review & Export", path: "/design/review", phase: 5 as const },
];

const enhancePhases = [
  { number: 1, label: "Scope Analysis", path: "/design/enhance/step-1", phase: 1 as const },
  { number: 2, label: "Topic Enhancement", path: "/design/enhance/step-2", phase: 2 as const },
  { number: 3, label: "Slide Plan", path: "/design/enhance/step-3", phase: 3 as const },
  { number: 4, label: "Review & Export", path: "/design/enhance/review", phase: 4 as const },
];

export function PhaseIndicator() {
  const pathname = usePathname();
  const mode = useCurriculumStore((s) => s.mode);
  const currentPhase = useCurriculumStore((s) => s.currentPhase);
  const enhancePhase = useCurriculumStore((s) => s.enhancePhase);

  const phases = mode === "enhance" ? enhancePhases : createPhases;
  const activePhase = mode === "enhance" ? enhancePhase : currentPhase;

  return (
    <nav className="flex flex-col gap-1">
      {phases.map((phase) => {
        const isActive = pathname === phase.path;
        const isAccessible = phase.number <= activePhase + 1;

        return (
          <Link
            key={phase.path}
            href={isAccessible ? phase.path : "#"}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : isAccessible
                  ? "hover:bg-muted text-foreground"
                  : "text-muted-foreground cursor-not-allowed opacity-50"
            )}
            onClick={(e) => {
              if (!isAccessible) e.preventDefault();
            }}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                isActive
                  ? "bg-primary-foreground text-primary"
                  : isAccessible
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground"
              )}
            >
              {phase.number <= activePhase ? "\u2713" : phase.number}
            </span>
            <span className="hidden md:inline">{phase.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
