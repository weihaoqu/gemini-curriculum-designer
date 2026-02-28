"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { useStreaming } from "@/lib/hooks/useStreaming";
import { StreamingText } from "@/components/shared/StreamingText";
import { cn, apiUrl } from "@/lib/utils";
import type { AssessmentType, AssessmentConfig, QuestionFormat } from "@/lib/types/curriculum";

const assessmentOptions: {
  value: AssessmentType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "quizzes",
    label: "Quizzes",
    description: "Knowledge checks with MCQ, short answer, and code analysis",
    icon: "\u2753",
  },
  {
    value: "labs",
    label: "Practical Labs",
    description: "Hands-on skill assessments with rubrics",
    icon: "\uD83D\uDD27",
  },
  {
    value: "projects",
    label: "Projects",
    description: "Applied learning with milestones and deliverables",
    icon: "\uD83D\uDCC1",
  },
  {
    value: "written",
    label: "Written Assignments",
    description: "Analysis, reflection, and essay prompts",
    icon: "\u270D\uFE0F",
  },
  {
    value: "peer-reviews",
    label: "Peer Reviews",
    description: "Collaborative assessment and feedback forms",
    icon: "\uD83D\uDC65",
  },
  {
    value: "portfolio",
    label: "Portfolio",
    description: "Cumulative demonstration of skills",
    icon: "\uD83C\uDFC6",
  },
];

const FORMAT_LABELS: Record<QuestionFormat, string> = {
  "multiple-choice": "MC",
  "short-answer": "SA",
  "true-false": "T/F",
  "fill-blank": "Fill",
  poll: "Poll",
  "code-analysis": "Code",
  essay: "Essay",
  matching: "Match",
};

function configSummary(config: AssessmentConfig): string {
  const parts: string[] = [];
  parts.push(`${config.questionCount} questions`);
  const fmts = config.questionFormats.map((f) => FORMAT_LABELS[f]).join(" + ");
  if (fmts) parts.push(fmts);
  parts.push(config.difficulty === "auto" ? "auto difficulty" : config.difficulty);
  if (config.perModule) parts.push("per module");
  return parts.join(", ");
}

export default function Phase4Page() {
  const router = useRouter();
  const {
    courseInfo,
    modules,
    difficultyCalibrations,
    assessmentConfigs,
    assessmentsContent,
    removeAssessmentConfig,
    setAssessmentsContent,
    setCurrentPhase,
  } = useCurriculumStore();

  const { content, isStreaming, stream } = useStreaming();

  if (!courseInfo || modules.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          Please complete Phase 3 first.
        </p>
        <Button onClick={() => router.push("/design/phase-3")}>
          Go to Phase 3
        </Button>
      </div>
    );
  }

  const calibratedCount = difficultyCalibrations.filter(
    (c) => c.selectedLevel
  ).length;

  const configuredTypes = new Set(assessmentConfigs.map((c) => c.type));

  const handleGenerate = async () => {
    const result = await stream(apiUrl("/api/curriculum/assessment"), {
      courseInfo,
      modules,
      assessmentConfigs,
      assessmentTypes: assessmentConfigs.map((c) => c.type),
      difficultyCalibrations,
    });
    setAssessmentsContent(result);
    router.push("/design/phase-4/results");
  };

  // If streaming, show inline progress
  if (isStreaming) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Phase 4: Generating Assessments...</h1>
        <p className="text-muted-foreground mb-6">
          Building assessments for {assessmentConfigs.length} category
          {assessmentConfigs.length !== 1 ? "ies" : "y"}. This may take a moment.
        </p>
        <div className="rounded-lg border p-6 bg-card">
          <StreamingText content={content} isStreaming={true} />
        </div>
      </div>
    );
  }

  // If we already have results, offer to view them
  const hasResults = !!assessmentsContent;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Phase 4: Assessment Design</h1>
      <p className="text-muted-foreground mb-2">
        Click each assessment type to configure difficulty, question formats, and count.
        Configured cards show a green badge with a summary.
      </p>
      {calibratedCount > 0 && (
        <p className="text-xs text-muted-foreground mb-8">
          Difficulty calibrated for {calibratedCount} module
          {calibratedCount !== 1 ? "s" : ""} — choose &quot;Auto&quot; difficulty to use
          per-module calibration.
        </p>
      )}
      {calibratedCount === 0 && (
        <p className="text-xs text-muted-foreground mb-8">
          No difficulty calibration set. Assessments will use your selected
          difficulty level.
        </p>
      )}

      {/* Assessment category cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {assessmentOptions.map((option) => {
          const config = assessmentConfigs.find((c) => c.type === option.value);
          const isConfigured = !!config;
          return (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-colors relative",
                isConfigured
                  ? "border-green-500 bg-green-500/5"
                  : "hover:border-muted-foreground/30"
              )}
              onClick={() =>
                router.push(`/design/phase-4/configure?type=${option.value}`)
              }
              title={
                isConfigured
                  ? `Configured. Click to edit.`
                  : `Click to configure ${option.label}`
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{option.label}</p>
                      {isConfigured && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 font-medium">
                          Configured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isConfigured
                        ? configSummary(config)
                        : option.description}
                    </p>
                  </div>
                </div>
                {isConfigured && (
                  <button
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive text-xs px-1.5 py-0.5 rounded hover:bg-destructive/10 transition-colors"
                    title="Remove configuration"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAssessmentConfig(option.value);
                    }}
                  >
                    Remove
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleGenerate}
          disabled={assessmentConfigs.length === 0}
          size="lg"
        >
          Generate Assessments ({assessmentConfigs.length} configured)
        </Button>
        {hasResults && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/design/phase-4/results")}
          >
            View Previous Results
          </Button>
        )}
        {hasResults && (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              setCurrentPhase(4);
              router.push("/design/phase-5");
            }}
          >
            Skip to Phase 5
          </Button>
        )}
      </div>
    </div>
  );
}
