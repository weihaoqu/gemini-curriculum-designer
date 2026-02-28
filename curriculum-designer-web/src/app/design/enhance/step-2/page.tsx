"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreamingText } from "@/components/shared/StreamingText";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import {
  generateId,
  parseTopicSuggestionsJSON,
  stripJSONBlocks,
} from "@/lib/parsers";
import { cn, apiUrl } from "@/lib/utils";
import type {
  DifficultyLevel,
  DifficultyQuestion,
  ModuleDifficultyCalibration,
} from "@/lib/types/curriculum";

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  "new-content": { label: "New Content", icon: "\uD83D\uDCDD" },
  exercise: { label: "Exercises", icon: "\uD83C\uDFCB\uFE0F" },
  interaction: { label: "Interactions", icon: "\uD83C\uDFAE" },
  animation: { label: "Animations", icon: "\uD83C\uDFAC" },
  update: { label: "Updates", icon: "\uD83D\uDD04" },
};

const LEVEL_CONFIG: Record<
  DifficultyLevel,
  { label: string; color: string; btnColor: string; ring: string }
> = {
  basic: {
    label: "Basic",
    color: "bg-green-100 text-green-800 border-green-300",
    btnColor: "bg-green-100 text-green-800 hover:bg-green-200 border-green-300",
    ring: "ring-green-400",
  },
  intermediate: {
    label: "Intermediate",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    btnColor: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300",
    ring: "ring-yellow-400",
  },
  advanced: {
    label: "Advanced",
    color: "bg-red-100 text-red-800 border-red-300",
    btnColor: "bg-red-100 text-red-800 hover:bg-red-200 border-red-300",
    ring: "ring-red-400",
  },
};

const LEVELS: DifficultyLevel[] = ["basic", "intermediate", "advanced"];
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".md", ".txt", ".pdf", ".docx", ".pptx", ".xlsx", ".csv", ".html", ".htm", ".rtf"];
const CLIENT_EXTENSIONS = [".md", ".txt", ".csv", ".html", ".htm"];

/** Strips HTML tags to extract readable text. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EnhanceStep2Page() {
  const router = useRouter();
  const {
    enhanceTopics,
    enhanceCurrentTopicIndex,
    enhanceTopicDeepDives,
    enhanceScopeRaw,
    enhanceCourseContext,
    setEnhanceCurrentTopicIndex,
    setTopicInstructorNotes,
    addTopicMaterial,
    removeTopicMaterial,
    setTopicSuggestions,
    toggleTopicSuggestion,
    updateEnhanceTopicStatus,
    setTopicCalibration,
    assignTopicQuestionLevel,
    setEnhancePhase,
  } = useCurriculumStore();

  const [isStreamingSuggestions, setIsStreamingSuggestions] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [isGeneratingCalibration, setIsGeneratingCalibration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTopics = enhanceTopics.filter((t) => t.selected);

  if (selectedTopics.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          No topics selected. Go back to Step 1 to select topics.
        </p>
        <Button onClick={() => router.push("/design/enhance/step-1")}>
          Back to Step 1
        </Button>
      </div>
    );
  }

  const safeIndex = Math.min(enhanceCurrentTopicIndex, selectedTopics.length - 1);
  const currentTopic = selectedTopics[safeIndex];
  if (!currentTopic) return null;

  const deepDive = enhanceTopicDeepDives.find((d) => d.topicId === currentTopic.id);

  // Detect course name from scope raw content
  const detectedCourseName = (() => {
    const raw = enhanceScopeRaw ?? "";
    const match = raw.match(/course[:\s]+["']?([^"'\n]+)/i);
    return match?.[1]?.trim() ?? "this course";
  })();

  const handleFileUpload = async (file: File) => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError(`"${file.name}" exceeds the 4 MB limit.`);
      return;
    }
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`"${file.name}" is not supported. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return;
    }

    // Client-side text extraction (.md, .txt, .csv, .html, .htm)
    if (CLIENT_EXTENSIONS.includes(ext)) {
      let content = await file.text();
      if (ext === ".html" || ext === ".htm") {
        content = stripHtml(content);
      }
      addTopicMaterial(currentTopic.id, {
        id: generateId(),
        name: file.name,
        content,
      });
      updateEnhanceTopicStatus(currentTopic.id, "materials-uploaded");
      return;
    }

    // Server-side extraction (PDF, DOCX, PPTX, XLSX, RTF)
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(apiUrl("/api/enhance/extract-text"), {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Extraction failed");
      }
      const data = await response.json();
      addTopicMaterial(currentTopic.id, {
        id: generateId(),
        name: file.name,
        content: data.text,
      });
      updateEnhanceTopicStatus(currentTopic.id, "materials-uploaded");
    } catch (err) {
      setError(`Failed to extract text from "${file.name}": ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsStreamingSuggestions(true);
    setStreamedContent("");
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/enhance/topic-suggestions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: currentTopic.name,
          topicDescription: currentTopic.description,
          weekOrModule: currentTopic.weekOrModule,
          courseName: detectedCourseName,
          instructorNotes: deepDive?.instructorNotes,
          materials: deepDive?.uploadedMaterials,
          scopeContext: enhanceScopeRaw ?? "",
          courseContext: enhanceCourseContext,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate suggestions");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullContent += parsed.text;
                setStreamedContent(fullContent);
              }
            } catch {
              // Skip
            }
          }
        }
      }

      const suggestions = parseTopicSuggestionsJSON(fullContent);
      const cleanContent = stripJSONBlocks(fullContent);
      setStreamedContent(cleanContent);

      if (suggestions) {
        setTopicSuggestions(currentTopic.id, cleanContent, suggestions);
        updateEnhanceTopicStatus(currentTopic.id, "suggestions-generated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsStreamingSuggestions(false);
    }
  };

  const handleGenerateCalibration = async () => {
    setIsGeneratingCalibration(true);
    setError(null);

    try {
      const materialsText = deepDive?.uploadedMaterials
        .map((f) => f.content)
        .join("\n\n");

      const res = await fetch(apiUrl("/api/enhance/topic-calibrate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: currentTopic.name,
          topicDescription: currentTopic.description,
          courseName: detectedCourseName,
          materialsText,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate calibration questions");
      const data = await res.json();

      const questions: DifficultyQuestion[] = (data.questions ?? []).map(
        (q: { questionType?: string; question: string; sampleAnswer: string; choices?: string[]; correctChoice?: string }) => ({
          id: generateId(),
          questionType: (q.questionType ?? "short-answer") as DifficultyQuestion["questionType"],
          question: q.question,
          sampleAnswer: q.sampleAnswer,
          ...(q.choices ? { choices: q.choices } : {}),
          ...(q.correctChoice ? { correctChoice: q.correctChoice } : {}),
        })
      );

      const calibration: ModuleDifficultyCalibration = {
        moduleIndex: safeIndex,
        moduleName: currentTopic.name,
        questions,
        assignedLevels: {},
        selectedLevel: null,
      };

      setTopicCalibration(currentTopic.id, calibration);
      updateEnhanceTopicStatus(currentTopic.id, "calibrated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGeneratingCalibration(false);
    }
  };

  const handleAssignLevel = (questionId: string, level: DifficultyLevel | null) => {
    const cal = deepDive?.calibration;
    if (!cal) return;
    const currentLevel = cal.assignedLevels?.[questionId] ?? null;
    assignTopicQuestionLevel(
      currentTopic.id,
      questionId,
      currentLevel === level ? null : level
    );
  };

  const goToTopic = (index: number) => {
    setEnhanceCurrentTopicIndex(index);
    setStreamedContent("");
    setError(null);
  };

  const handleContinue = () => {
    setEnhancePhase(2);
    router.push("/design/enhance/step-3");
  };

  const isLastTopic = safeIndex >= selectedTopics.length - 1;
  const isFirstTopic = safeIndex === 0;

  const hasSuggestions = (deepDive?.suggestions?.length ?? 0) > 0;
  const showSuggestionStream = isStreamingSuggestions || (streamedContent && !hasSuggestions);

  // Group suggestions by category
  const groupedSuggestions: Record<string, NonNullable<typeof deepDive>["suggestions"]> = {};
  for (const s of deepDive?.suggestions ?? []) {
    if (!groupedSuggestions[s.category]) groupedSuggestions[s.category] = [];
    groupedSuggestions[s.category].push(s);
  }

  const getCalibrationCounts = () => {
    const cal = deepDive?.calibration;
    if (!cal) return null;
    const counts = { basic: 0, intermediate: 0, advanced: 0, unassigned: 0 };
    for (const q of cal.questions) {
      const level = cal.assignedLevels?.[q.id];
      if (level) counts[level]++;
      else counts.unassigned++;
    }
    return counts;
  };

  const calibrationCounts = getCalibrationCounts();

  return (
    <div>
      {/* Header with topic progress */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">
          Topic {safeIndex + 1} of {selectedTopics.length}:{" "}
          {currentTopic.name}
        </h1>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="secondary">{currentTopic.weekOrModule}</Badge>
        <p className="text-sm text-muted-foreground">{currentTopic.description}</p>
      </div>

      {/* Topic progress dots */}
      <div className="flex items-center gap-1.5 mb-8">
        {selectedTopics.map((t, i) => {
          const td = enhanceTopicDeepDives.find((d) => d.topicId === t.id);
          const hasSug = (td?.suggestions?.length ?? 0) > 0;
          const hasCal = td?.calibration !== null && td?.calibration !== undefined;
          return (
            <button
              key={t.id}
              onClick={() => goToTopic(i)}
              title={`${t.name} — ${hasCal ? "Calibrated" : hasSug ? "Suggestions generated" : "Pending"}`}
              className={cn(
                "h-3 w-3 rounded-full transition-all hover:ring-2 hover:ring-primary/30",
                i === safeIndex
                  ? "bg-primary ring-2 ring-primary ring-offset-2"
                  : hasCal
                    ? "bg-green-500"
                    : hasSug
                      ? "bg-yellow-400"
                      : "bg-muted-foreground/30"
              )}
            />
          );
        })}
      </div>

      {/* Upload Materials (Optional) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Upload Materials (Optional)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Upload your current slides or notes for this topic for more targeted suggestions.
          </p>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              Array.from(e.dataTransfer.files).forEach(handleFileUpload);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="text-sm font-medium">
              {extracting ? "Extracting text..." : "Drop files here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .pptx, .pdf, .docx, .xlsx, .csv, .html, .md, .txt, .rtf (max 4 MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) Array.from(e.target.files).forEach(handleFileUpload);
              }}
            />
          </div>

          {/* Uploaded files for this topic */}
          {(deepDive?.uploadedMaterials?.length ?? 0) > 0 && (
            <div className="mt-3 space-y-2">
              {deepDive!.uploadedMaterials.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.content.length)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTopicMaterial(currentTopic.id, file.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Instructor Expectations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Your Expectations &amp; Goals (Optional)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tell us what you want to achieve with this topic — specific skills students should gain,
            areas you want to emphasize, or problems you&apos;ve noticed. AI suggestions will prioritize your goals.
          </p>
        </CardHeader>
        <CardContent>
          <textarea
            value={deepDive?.instructorNotes ?? ""}
            onChange={(e) => setTopicInstructorNotes(currentTopic.id, e.target.value)}
            placeholder="e.g., Students struggle with recursion in this topic — I need more step-by-step examples. I also want to add a live coding exercise that builds up a solution incrementally."
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </CardContent>
      </Card>

      {/* Generate Suggestions */}
      <div className="mb-6">
        <Button
          onClick={handleGenerateSuggestions}
          disabled={isStreamingSuggestions}
          size="lg"
        >
          {isStreamingSuggestions
            ? "Generating Suggestions..."
            : hasSuggestions
              ? "Regenerate Suggestions"
              : "Generate Suggestions"}
        </Button>
        {!hasSuggestions && !isStreamingSuggestions && (
          <p className="text-xs text-muted-foreground mt-2">
            {(deepDive?.uploadedMaterials?.length ?? 0) > 0
              ? "Will analyze your materials and suggest improvements."
              : "No materials uploaded — will suggest from scratch based on the topic."}
          </p>
        )}
      </div>

      {/* Streaming content */}
      {showSuggestionStream && (
        <div className="mb-8 rounded-lg border p-6 bg-card">
          <StreamingText
            content={streamedContent || deepDive?.suggestionsRaw || ""}
            isStreaming={isStreamingSuggestions}
          />
        </div>
      )}

      {/* Structured suggestions */}
      {hasSuggestions && !isStreamingSuggestions && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-1">AI Suggestions</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Click a suggestion to toggle selection. Selected suggestions will be included in the enhancement plan.
          </p>

          <div className="space-y-6">
            {Object.entries(groupedSuggestions).map(([category, suggestions]) => {
              const config = CATEGORY_CONFIG[category] ?? {
                label: category,
                icon: "?",
              };
              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {suggestions.length}
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all hover:shadow-sm",
                          suggestion.selected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                        onClick={() =>
                          toggleTopicSuggestion(currentTopic.id, suggestion.id)
                        }
                        title={`Click to ${suggestion.selected ? "deselect" : "select"}`}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs transition-colors mt-0.5",
                            suggestion.selected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {suggestion.selected && "\u2713"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Difficulty Calibration */}
      {hasSuggestions && !isStreamingSuggestions && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Difficulty Calibration</span>
              {calibrationCounts && (
                <div className="flex gap-1">
                  {calibrationCounts.basic > 0 && (
                    <Badge className={LEVEL_CONFIG.basic.color}>
                      {calibrationCounts.basic}B
                    </Badge>
                  )}
                  {calibrationCounts.intermediate > 0 && (
                    <Badge className={LEVEL_CONFIG.intermediate.color}>
                      {calibrationCounts.intermediate}I
                    </Badge>
                  )}
                  {calibrationCounts.advanced > 0 && (
                    <Badge className={LEVEL_CONFIG.advanced.color}>
                      {calibrationCounts.advanced}A
                    </Badge>
                  )}
                </div>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Generate candidate questions and assign difficulty levels to calibrate expectations for this topic.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateCalibration}
              disabled={isGeneratingCalibration}
              variant="outline"
            >
              {isGeneratingCalibration
                ? "Generating..."
                : deepDive?.calibration
                  ? "Regenerate Questions"
                  : "Generate Calibration Questions"}
            </Button>

            {deepDive?.calibration && deepDive.calibration.questions.length > 0 && (
              <div className="mt-4 space-y-3">
                {deepDive.calibration.questions
                  .filter((q) => q.questionType !== "multiple-choice")
                  .length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Short Answer
                    </h4>
                    <div className="space-y-3">
                      {deepDive.calibration.questions
                        .filter((q) => q.questionType !== "multiple-choice")
                        .map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            assignedLevel={deepDive.calibration!.assignedLevels?.[q.id] ?? null}
                            onAssign={(level) => handleAssignLevel(q.id, level)}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {deepDive.calibration.questions
                  .filter((q) => q.questionType === "multiple-choice")
                  .length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Multiple Choice
                    </h4>
                    <div className="space-y-3">
                      {deepDive.calibration.questions
                        .filter((q) => q.questionType === "multiple-choice")
                        .map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            assignedLevel={deepDive.calibration!.assignedLevels?.[q.id] ?? null}
                            onAssign={(level) => handleAssignLevel(q.id, level)}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {calibrationCounts && (
                  <div className="text-xs text-muted-foreground border-t pt-3">
                    Summary:{" "}
                    {calibrationCounts.basic > 0 && (
                      <span className="text-green-700 font-medium">
                        {calibrationCounts.basic} Basic
                      </span>
                    )}
                    {calibrationCounts.basic > 0 &&
                      calibrationCounts.intermediate + calibrationCounts.advanced + calibrationCounts.unassigned > 0 &&
                      ", "}
                    {calibrationCounts.intermediate > 0 && (
                      <span className="text-yellow-700 font-medium">
                        {calibrationCounts.intermediate} Intermediate
                      </span>
                    )}
                    {calibrationCounts.intermediate > 0 &&
                      calibrationCounts.advanced + calibrationCounts.unassigned > 0 &&
                      ", "}
                    {calibrationCounts.advanced > 0 && (
                      <span className="text-red-700 font-medium">
                        {calibrationCounts.advanced} Advanced
                      </span>
                    )}
                    {calibrationCounts.advanced > 0 && calibrationCounts.unassigned > 0 && ", "}
                    {calibrationCounts.unassigned > 0 && (
                      <span>{calibrationCounts.unassigned} Unassigned</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => goToTopic(safeIndex - 1)}
          disabled={isFirstTopic}
        >
          &larr; Previous Topic
        </Button>

        <div className="flex gap-3">
          {!isLastTopic && (
            <Button onClick={() => goToTopic(safeIndex + 1)}>
              Next Topic: {selectedTopics[safeIndex + 1]?.name} &rarr;
            </Button>
          )}
          {isLastTopic && (
            <Button onClick={handleContinue} size="lg">
              Continue to Slide Plan &rarr;
            </Button>
          )}
        </div>
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
                  ? `${config.btnColor} ring-2 ring-offset-1 ${config.ring}`
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
