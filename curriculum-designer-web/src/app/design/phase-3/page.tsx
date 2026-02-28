"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { generateId } from "@/lib/parsers";
import { cn } from "@/lib/utils";
import type {
  DifficultyLevel,
  DifficultyQuestion,
  ModuleDifficultyCalibration,
} from "@/lib/types/curriculum";

const LEVEL_CONFIG: Record<
  DifficultyLevel,
  { label: string; description: string; color: string; bloom: string; btnColor: string }
> = {
  basic: {
    label: "Basic",
    description: "Recall & comprehension",
    color: "bg-green-100 text-green-800 border-green-300",
    bloom: "Remember / Understand",
    btnColor: "bg-green-100 text-green-800 hover:bg-green-200 border-green-300",
  },
  intermediate: {
    label: "Intermediate",
    description: "Application & analysis",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    bloom: "Apply / Analyze",
    btnColor: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300",
  },
  advanced: {
    label: "Advanced",
    description: "Synthesis & evaluation",
    color: "bg-red-100 text-red-800 border-red-300",
    bloom: "Evaluate / Create",
    btnColor: "bg-red-100 text-red-800 hover:bg-red-200 border-red-300",
  },
};

const LEVELS: DifficultyLevel[] = ["basic", "intermediate", "advanced"];

export default function Phase3Page() {
  const router = useRouter();
  const {
    courseInfo,
    modules,
    difficultyCalibrations,
    setDifficultyCalibrations,
    assignQuestionLevel,
    setCurrentPhase,
  } = useCurriculumStore();

  const [loadingModule, setLoadingModule] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!courseInfo || modules.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          Please complete Phase 2 first.
        </p>
        <Button onClick={() => router.push("/design/phase-2")}>
          Go to Phase 2
        </Button>
      </div>
    );
  }

  const completedModules = modules
    .map((m, i) => ({ module: m, index: i }))
    .filter(({ module }) => module.status === "complete");

  if (completedModules.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          Complete at least one module in Phase 2 before calibrating difficulty.
        </p>
        <Button onClick={() => router.push("/design/phase-2")}>
          Go to Phase 2
        </Button>
      </div>
    );
  }

  const getCalibration = (moduleIndex: number): ModuleDifficultyCalibration | undefined => {
    const cal = difficultyCalibrations.find((c) => c.moduleIndex === moduleIndex);
    if (!cal) return undefined;
    // Safety: ensure all questions have unique IDs (handles corrupt/old data)
    let needsIdFix = false;
    const seenIds = new Set<string>();
    for (const q of cal.questions) {
      if (!q.id || seenIds.has(q.id)) { needsIdFix = true; break; }
      seenIds.add(q.id);
    }
    if (needsIdFix) {
      const fixedQuestions = cal.questions.map((q) => ({
        ...q,
        id: generateId(),
      }));
      const fixedCal: ModuleDifficultyCalibration = {
        ...cal,
        questions: fixedQuestions,
        assignedLevels: {},
      };
      // Persist the fix
      const updated = difficultyCalibrations.map((c) =>
        c.moduleIndex === moduleIndex ? fixedCal : c
      );
      setDifficultyCalibrations(updated);
      return fixedCal;
    }
    return cal;
  };

  const handleGenerateSample = async (moduleIndex: number) => {
    setLoadingModule(moduleIndex);
    setError(null);

    const mod = modules[moduleIndex];
    try {
      const res = await fetch("/api/curriculum/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseInfo,
          moduleName: mod.name,
          moduleIndex,
          topics: mod.lessonPlan?.lessons ?? [],
        }),
      });

      if (!res.ok) throw new Error("Failed to generate calibration questions");
      const data = await res.json();

      const questions: DifficultyQuestion[] = (data.questions ?? []).map(
        (q: { level?: string; questionType?: string; question: string; sampleAnswer: string; choices?: string[]; correctChoice?: string }) => ({
          id: generateId(),
          ...(q.level ? { level: q.level as DifficultyLevel } : {}),
          questionType: (q.questionType ?? "short-answer") as DifficultyQuestion["questionType"],
          question: q.question,
          sampleAnswer: q.sampleAnswer,
          ...(q.choices ? { choices: q.choices } : {}),
          ...(q.correctChoice ? { correctChoice: q.correctChoice } : {}),
        })
      );

      const calibration: ModuleDifficultyCalibration = {
        moduleIndex,
        moduleName: mod.name,
        questions,
        assignedLevels: {},
        selectedLevel: null,
      };

      const existing = difficultyCalibrations.filter(
        (c) => c.moduleIndex !== moduleIndex
      );
      setDifficultyCalibrations([...existing, calibration]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingModule(null);
    }
  };

  const handleAssignLevel = (
    moduleIndex: number,
    questionId: string,
    level: DifficultyLevel | null
  ) => {
    const cal = getCalibration(moduleIndex);
    if (!cal) return;
    const currentLevel = cal.assignedLevels?.[questionId] ?? null;
    // Toggle: if clicking same level, clear it
    assignQuestionLevel(moduleIndex, questionId, currentLevel === level ? null : level);
  };

  const handleContinue = () => {
    setCurrentPhase(3);
    router.push("/design/phase-4");
  };

  const getAssignmentCounts = (cal: ModuleDifficultyCalibration) => {
    const counts = { basic: 0, intermediate: 0, advanced: 0, unassigned: 0 };
    for (const q of cal.questions) {
      const level = cal.assignedLevels?.[q.id];
      if (level) counts[level]++;
      else counts.unassigned++;
    }
    return counts;
  };

  const calibratedCount = difficultyCalibrations.filter((c) => {
    const counts = getAssignmentCounts(c);
    return counts.basic + counts.intermediate + counts.advanced > 0;
  }).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Phase 3: Difficulty Calibration
      </h1>
      <p className="text-muted-foreground mb-1">
        Sort candidate questions into difficulty levels to calibrate your expectations.
        Phase 4 will use your sorting as exemplars when generating assessments.
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Click &quot;Generate Candidates&quot; for each module to get 10 unlabeled questions.
        Then use the buttons below each question to assign it to Basic, Intermediate, or Advanced.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {completedModules.map(({ module: mod, index: modIdx }) => {
          const cal = getCalibration(modIdx);
          const isLoading = loadingModule === modIdx;
          const counts = cal ? getAssignmentCounts(cal) : null;

          const saQuestions = cal?.questions.filter((q) => q.questionType !== "multiple-choice") ?? [];
          const mcQuestions = cal?.questions.filter((q) => q.questionType === "multiple-choice") ?? [];

          return (
            <Card key={modIdx}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">
                    Module {modIdx + 1}: {mod.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {counts && (counts.basic + counts.intermediate + counts.advanced > 0) && (
                      <div className="flex gap-1">
                        {counts.basic > 0 && (
                          <Badge className={LEVEL_CONFIG.basic.color}>{counts.basic}B</Badge>
                        )}
                        {counts.intermediate > 0 && (
                          <Badge className={LEVEL_CONFIG.intermediate.color}>{counts.intermediate}I</Badge>
                        )}
                        {counts.advanced > 0 && (
                          <Badge className={LEVEL_CONFIG.advanced.color}>{counts.advanced}A</Badge>
                        )}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateSample(modIdx)}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Generating..."
                        : cal
                          ? "Regenerate"
                          : "Generate Candidates"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              {cal && cal.questions.length > 0 && (
                <CardContent>
                  {saQuestions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Short Answer ({saQuestions.length} questions)
                      </h4>
                      <div className="space-y-3">
                        {saQuestions.map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            assignedLevel={cal.assignedLevels?.[q.id] ?? null}
                            onAssign={(level) => handleAssignLevel(modIdx, q.id, level)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {mcQuestions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Multiple Choice ({mcQuestions.length} questions)
                      </h4>
                      <div className="space-y-3">
                        {mcQuestions.map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            assignedLevel={cal.assignedLevels?.[q.id] ?? null}
                            onAssign={(level) => handleAssignLevel(modIdx, q.id, level)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {counts && (
                    <div className="text-xs text-muted-foreground border-t pt-3 mt-2">
                      Summary:{" "}
                      {counts.basic > 0 && <span className="text-green-700 font-medium">{counts.basic} Basic</span>}
                      {counts.basic > 0 && (counts.intermediate + counts.advanced + counts.unassigned > 0) && ", "}
                      {counts.intermediate > 0 && <span className="text-yellow-700 font-medium">{counts.intermediate} Intermediate</span>}
                      {counts.intermediate > 0 && (counts.advanced + counts.unassigned > 0) && ", "}
                      {counts.advanced > 0 && <span className="text-red-700 font-medium">{counts.advanced} Advanced</span>}
                      {counts.advanced > 0 && counts.unassigned > 0 && ", "}
                      {counts.unassigned > 0 && <span>{counts.unassigned} Unassigned</span>}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleContinue} size="lg">
          {calibratedCount > 0
            ? `Continue to Assessments (${calibratedCount} module${calibratedCount > 1 ? "s" : ""} calibrated)`
            : "Continue to Assessments (skip calibration)"}
        </Button>
        {calibratedCount === 0 && (
          <p className="text-xs text-muted-foreground self-center">
            You can skip this step — assessments will use default difficulty.
          </p>
        )}
      </div>
    </div>
  );
}

// --- Question card with level assignment buttons ---

function QuestionCard({
  question,
  assignedLevel,
  onAssign,
}: {
  question: DifficultyQuestion;
  assignedLevel: DifficultyLevel | null;
  onAssign: (level: DifficultyLevel | null) => void;
}) {
  const isMC = question.questionType === "multiple-choice";

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        assignedLevel
          ? `border-l-4 ${
              assignedLevel === "basic"
                ? "border-l-green-400"
                : assignedLevel === "intermediate"
                  ? "border-l-yellow-400"
                  : "border-l-red-400"
            }`
          : "border-muted"
      )}
    >
      <p className="text-sm font-medium mb-2">{question.question}</p>

      {isMC && question.choices && (
        <ul className="space-y-1 mb-2">
          {question.choices.map((choice, ci) => {
            const letter = choice.match(/^([A-D])\./)?.[1];
            const isCorrect = letter === question.correctChoice;
            return (
              <li
                key={ci}
                className={cn(
                  "text-xs rounded px-2 py-1",
                  isCorrect
                    ? "bg-green-100 text-green-800 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {choice}
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded bg-muted/50 p-2 mb-3">
        <p className="text-xs text-muted-foreground font-medium mb-1">
          Sample Answer:
        </p>
        <p className="text-xs text-muted-foreground">{question.sampleAnswer}</p>
      </div>

      {/* Level assignment buttons */}
      <div className="flex items-center gap-2">
        {LEVELS.map((level) => {
          const config = LEVEL_CONFIG[level];
          const isActive = assignedLevel === level;
          return (
            <button
              key={level}
              onClick={() => onAssign(level)}
              title={`Assign as ${config.label}. Click again to clear.`}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md border transition-all font-medium",
                "hover:ring-2 hover:ring-primary/30",
                isActive
                  ? `${config.btnColor} ring-2 ring-offset-1 ${
                      level === "basic"
                        ? "ring-green-400"
                        : level === "intermediate"
                          ? "ring-yellow-400"
                          : "ring-red-400"
                    }`
                  : "bg-muted/50 text-muted-foreground border-muted hover:bg-muted"
              )}
            >
              {config.label}
            </button>
          );
        })}
        {assignedLevel && (
          <button
            onClick={() => onAssign(null)}
            title="Clear assignment"
            className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
