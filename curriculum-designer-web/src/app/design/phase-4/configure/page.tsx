"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { cn } from "@/lib/utils";
import type {
  AssessmentType,
  AssessmentConfig,
  DifficultyLevel,
  QuestionFormat,
} from "@/lib/types/curriculum";

export default function ConfigurePageWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading...</div>}>
      <ConfigurePage />
    </Suspense>
  );
}

// --- Question format availability per category ---
const FORMAT_AVAILABILITY: Record<AssessmentType, QuestionFormat[]> = {
  quizzes: ["multiple-choice", "short-answer", "true-false", "fill-blank", "poll", "code-analysis", "matching"],
  labs: ["code-analysis"],
  projects: ["code-analysis"],
  written: ["poll", "essay"],
  "peer-reviews": ["poll"],
  portfolio: ["essay"],
};

const FORMAT_LABELS: Record<QuestionFormat, string> = {
  "multiple-choice": "Multiple Choice",
  "short-answer": "Short Answer",
  "true-false": "True / False",
  "fill-blank": "Fill in the Blank",
  poll: "Poll / Survey",
  "code-analysis": "Code Analysis",
  essay: "Essay",
  matching: "Matching",
};

const CATEGORY_INFO: Record<AssessmentType, { label: string; icon: string }> = {
  quizzes: { label: "Quizzes", icon: "\u2753" },
  labs: { label: "Practical Labs", icon: "\uD83D\uDD27" },
  projects: { label: "Projects", icon: "\uD83D\uDCC1" },
  written: { label: "Written Assignments", icon: "\u270D\uFE0F" },
  "peer-reviews": { label: "Peer Reviews", icon: "\uD83D\uDC65" },
  portfolio: { label: "Portfolio", icon: "\uD83C\uDFC6" },
};

const DIFFICULTY_OPTIONS: { value: DifficultyLevel | "auto"; label: string; description: string }[] = [
  { value: "auto", label: "Auto", description: "Use Phase 3 calibration per module" },
  { value: "basic", label: "Basic", description: "Recall & comprehension (Bloom's 1-2)" },
  { value: "intermediate", label: "Intermediate", description: "Application & analysis (Bloom's 3-4)" },
  { value: "advanced", label: "Advanced", description: "Synthesis & evaluation (Bloom's 5-6)" },
];

function makeDefaultConfig(type: AssessmentType): AssessmentConfig {
  const formats = FORMAT_AVAILABILITY[type];
  return {
    type,
    difficulty: "auto",
    questionFormats: formats.length > 0 ? [formats[0]] : [],
    questionCount: 10,
    perModule: true,
  };
}

function ConfigurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as AssessmentType | null;

  const { assessmentConfigs, upsertAssessmentConfig, difficultyCalibrations } =
    useCurriculumStore();

  const existing = assessmentConfigs.find((c) => c.type === type);

  const [config, setConfig] = useState<AssessmentConfig>(
    existing ?? makeDefaultConfig(type ?? "quizzes")
  );

  // Sync if type changes via URL
  useEffect(() => {
    if (type) {
      const found = assessmentConfigs.find((c) => c.type === type);
      setConfig(found ?? makeDefaultConfig(type));
    }
  }, [type, assessmentConfigs]);

  if (!type || !CATEGORY_INFO[type]) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Invalid assessment type.</p>
        <Button onClick={() => router.push("/design/phase-4")}>
          Back to Assessment Design
        </Button>
      </div>
    );
  }

  const info = CATEGORY_INFO[type];
  const availableFormats = FORMAT_AVAILABILITY[type];
  const calibratedCount = difficultyCalibrations.filter((c) => c.selectedLevel).length;

  const toggleFormat = (fmt: QuestionFormat) => {
    setConfig((prev) => ({
      ...prev,
      questionFormats: prev.questionFormats.includes(fmt)
        ? prev.questionFormats.filter((f) => f !== fmt)
        : [...prev.questionFormats, fmt],
    }));
  };

  const handleSave = () => {
    upsertAssessmentConfig(config);
    router.push("/design/phase-4");
  };

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/design/phase-4")}
      >
        {"<- Back to Assessment Design"}
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{info.icon}</span>
        <div>
          <h1 className="text-2xl font-bold">Configure {info.label}</h1>
          <p className="text-sm text-muted-foreground">
            Set difficulty, question formats, and category-specific options.
          </p>
        </div>
      </div>

      {/* Difficulty */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Difficulty Level</CardTitle>
          {calibratedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              &quot;Auto&quot; uses per-module calibration from Phase 3 ({calibratedCount} module{calibratedCount !== 1 ? "s" : ""} calibrated).
            </p>
          )}
          {calibratedCount === 0 && (
            <p className="text-xs text-muted-foreground">
              No Phase 3 calibration data. &quot;Auto&quot; will default to intermediate.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm transition-colors",
                  config.difficulty === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-muted hover:border-muted-foreground/30"
                )}
                title={opt.description}
                onClick={() => setConfig((prev) => ({ ...prev, difficulty: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Formats */}
      {availableFormats.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Question Formats</CardTitle>
            <p className="text-xs text-muted-foreground">
              Select one or more question formats. Click to toggle.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableFormats.map((fmt) => {
                const selected = config.questionFormats.includes(fmt);
                return (
                  <button
                    key={fmt}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                    title={`Toggle ${FORMAT_LABELS[fmt]}`}
                    onClick={() => toggleFormat(fmt)}
                  >
                    {FORMAT_LABELS[fmt]}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Count + Per Module */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Question Count & Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-32">
              Questions
            </label>
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 rounded border text-sm hover:bg-muted transition-colors"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    questionCount: Math.max(3, prev.questionCount - 1),
                  }))
                }
              >
                -
              </button>
              <span className="w-10 text-center font-medium">
                {config.questionCount}
              </span>
              <button
                className="w-8 h-8 rounded border text-sm hover:bg-muted transition-colors"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    questionCount: Math.min(30, prev.questionCount + 1),
                  }))
                }
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-32">Scope</label>
            <div className="flex gap-2">
              <button
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm transition-colors",
                  config.perModule
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-muted hover:border-muted-foreground/30"
                )}
                onClick={() => setConfig((prev) => ({ ...prev, perModule: true }))}
              >
                Per Module
              </button>
              <button
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm transition-colors",
                  !config.perModule
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-muted hover:border-muted-foreground/30"
                )}
                onClick={() => setConfig((prev) => ({ ...prev, perModule: false }))}
              >
                Course-wide
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category-specific controls */}
      <CategorySpecificControls type={type} config={config} setConfig={setConfig} />

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <Button onClick={handleSave} size="lg">
          Add to Plan
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/design/phase-4")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// --- Category-specific controls ---

function CategorySpecificControls({
  type,
  config,
  setConfig,
}: {
  type: AssessmentType;
  config: AssessmentConfig;
  setConfig: React.Dispatch<React.SetStateAction<AssessmentConfig>>;
}) {
  switch (type) {
    case "quizzes":
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quiz Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-40">Time Limit</label>
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm transition-colors",
                    !config.timeLimitMinutes
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => setConfig((prev) => ({ ...prev, timeLimitMinutes: undefined }))}
                >
                  No Limit
                </button>
                <button
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm transition-colors",
                    config.timeLimitMinutes
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => setConfig((prev) => ({ ...prev, timeLimitMinutes: prev.timeLimitMinutes || 15 }))}
                >
                  Timed
                </button>
                {config.timeLimitMinutes && (
                  <>
                    <button
                      className="w-8 h-8 rounded border text-sm hover:bg-muted transition-colors"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          timeLimitMinutes: Math.max(5, (prev.timeLimitMinutes ?? 15) - 5),
                        }))
                      }
                    >
                      -
                    </button>
                    <span className="w-14 text-center font-medium text-sm">
                      {config.timeLimitMinutes} min
                    </span>
                    <button
                      className="w-8 h-8 rounded border text-sm hover:bg-muted transition-colors"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          timeLimitMinutes: Math.min(120, (prev.timeLimitMinutes ?? 15) + 5),
                        }))
                      }
                    >
                      +
                    </button>
                  </>
                )}
              </div>
            </div>
            <NumberRow
              label="Number of Quizzes"
              value={config.numberOfAssessments ?? 1}
              min={1}
              max={20}
              onChange={(v) => setConfig((prev) => ({ ...prev, numberOfAssessments: v }))}
            />
          </CardContent>
        </Card>
      );

    case "labs":
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lab Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberRow
              label="Number of Labs"
              value={config.numberOfAssessments ?? 3}
              min={1}
              max={20}
              onChange={(v) => setConfig((prev) => ({ ...prev, numberOfAssessments: v }))}
            />
            <ToggleRow
              label="Group Work"
              value={config.groupWork ?? false}
              onChange={(v) => setConfig((prev) => ({ ...prev, groupWork: v }))}
            />
          </CardContent>
        </Card>
      );

    case "projects":
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberRow
              label="Milestones"
              value={config.milestones ?? 3}
              min={1}
              max={10}
              onChange={(v) => setConfig((prev) => ({ ...prev, milestones: v }))}
            />
            <ToggleRow
              label="Team Project"
              value={config.groupWork ?? false}
              onChange={(v) => setConfig((prev) => ({ ...prev, groupWork: v }))}
            />
          </CardContent>
        </Card>
      );

    case "written":
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Written Assignment Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberRow
              label="Number of Assignments"
              value={config.numberOfAssessments ?? 2}
              min={1}
              max={20}
              onChange={(v) => setConfig((prev) => ({ ...prev, numberOfAssessments: v }))}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-40">
                Word Count Range
              </label>
              <input
                type="text"
                placeholder="e.g. 500-1000"
                className="border rounded-lg px-3 py-2 text-sm w-32 bg-transparent"
                value={config.wordCountRange ?? ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, wordCountRange: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>
      );

    case "peer-reviews":
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Peer Review Options</CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleRow
              label="Anonymous Reviews"
              value={config.anonymous ?? true}
              onChange={(v) => setConfig((prev) => ({ ...prev, anonymous: v }))}
            />
          </CardContent>
        </Card>
      );

    case "portfolio":
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Portfolio Options</CardTitle>
          </CardHeader>
          <CardContent>
            <NumberRow
              label="Required Artifacts"
              value={config.artifactCount ?? 5}
              min={1}
              max={20}
              onChange={(v) => setConfig((prev) => ({ ...prev, artifactCount: v }))}
            />
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}

// --- Shared control components ---

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground w-40">{label}</label>
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded border text-sm hover:bg-muted transition-colors"
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          -
        </button>
        <span className="w-10 text-center font-medium">{value}</span>
        <button
          className="w-8 h-8 rounded border text-sm hover:bg-muted transition-colors"
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground w-40">{label}</label>
      <div className="flex gap-2">
        <button
          className={cn(
            "px-3 py-2 rounded-lg border text-sm transition-colors",
            value
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-muted hover:border-muted-foreground/30"
          )}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          className={cn(
            "px-3 py-2 rounded-lg border text-sm transition-colors",
            !value
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-muted hover:border-muted-foreground/30"
          )}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}
