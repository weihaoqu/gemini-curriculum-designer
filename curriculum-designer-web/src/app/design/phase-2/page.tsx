"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleInterview } from "@/components/phase-2/ModuleInterview";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { cn } from "@/lib/utils";
import type { ModuleStatus } from "@/lib/types/curriculum";

const statusColors: Record<ModuleStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  // Legacy
  proposing: "bg-yellow-100 text-yellow-800",
  proposed: "bg-blue-100 text-blue-800",
  approved: "bg-purple-100 text-purple-800",
  // Interview flow
  "interviewing-prereqs": "bg-yellow-100 text-yellow-800",
  "prereqs-confirmed": "bg-blue-100 text-blue-800",
  "interviewing-concepts": "bg-yellow-100 text-yellow-800",
  "concepts-confirmed": "bg-blue-100 text-blue-800",
  "interviewing-lessons": "bg-yellow-100 text-yellow-800",
  "lessons-approved": "bg-purple-100 text-purple-800",
  // Shared
  generating: "bg-yellow-100 text-yellow-800",
  complete: "bg-green-100 text-green-800",
};

const statusLabels: Record<ModuleStatus, string> = {
  pending: "Pending",
  // Legacy
  proposing: "Proposing...",
  proposed: "Proposed",
  approved: "Approved",
  // Interview flow
  "interviewing-prereqs": "Prerequisites...",
  "prereqs-confirmed": "Prereqs OK",
  "interviewing-concepts": "Concepts...",
  "concepts-confirmed": "Concepts OK",
  "interviewing-lessons": "Lessons...",
  "lessons-approved": "Plan Approved",
  // Shared
  generating: "Generating...",
  complete: "Complete",
};

export default function Phase2Page() {
  const router = useRouter();
  const {
    courseInfo,
    modules,
    currentModuleIndex,
    setCurrentModuleIndex,
    setCurrentPhase,
  } = useCurriculumStore();

  if (!courseInfo || modules.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          Please complete Phase 1 first.
        </p>
        <Button onClick={() => router.push("/design/phase-1")}>
          Go to Phase 1
        </Button>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  const completedCount = modules.filter((m) => m.status === "complete").length;
  const hasAnyComplete = completedCount > 0;

  const handleContinue = () => {
    setCurrentPhase(2);
    router.push("/design/phase-3");
  };

  const handleNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const handleSkipModule = () => {
    // Just move to the next module without changing current module status
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Phase 2: Module Design</h1>
      <p className="text-muted-foreground mb-1">
        Design each module through an interactive interview with AI.
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        {completedCount} of {modules.length} complete. You can skip modules and come back later.
      </p>

      {/* Module list */}
      <div className="flex flex-wrap gap-2 mb-8">
        {modules.map((mod, i) => (
          <button
            key={i}
            onClick={() => setCurrentModuleIndex(i)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              i === currentModuleIndex
                ? "border-primary bg-primary/5"
                : "hover:bg-muted"
            )}
          >
            <span className="font-medium truncate max-w-[150px]">
              {i + 1}. {mod.name}
            </span>
            <Badge variant="secondary" className={statusColors[mod.status]}>
              {statusLabels[mod.status]}
            </Badge>
          </button>
        ))}
      </div>

      {/* Current module work area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Module {currentModuleIndex + 1}: {currentModule.name}
            </span>
            {currentModule.status !== "complete" &&
              currentModule.status !== "generating" &&
              currentModuleIndex < modules.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipModule}
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ModuleInterview moduleIndex={currentModuleIndex} />

          {/* Navigation */}
          {currentModule.status === "complete" && (
            <div className="flex gap-3 pt-6 mt-6 border-t">
              {currentModuleIndex < modules.length - 1 ? (
                <Button onClick={handleNextModule}>
                  Next Module: {modules[currentModuleIndex + 1]?.name}
                </Button>
              ) : null}
              {hasAnyComplete && (
                <Button
                  onClick={handleContinue}
                  variant={
                    completedCount < modules.length ? "outline" : "default"
                  }
                >
                  {completedCount < modules.length
                    ? `Continue to Difficulty Calibration (${completedCount}/${modules.length} done)`
                    : "Continue to Difficulty Calibration"}
                </Button>
              )}
            </div>
          )}

          {/* Allow continuing even if current module isn't complete */}
          {currentModule.status !== "complete" && hasAnyComplete && (
            <div className="pt-6 mt-6 border-t">
              <Button onClick={handleContinue} variant="outline">
                Continue to Difficulty Calibration ({completedCount}/{modules.length} modules done)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
