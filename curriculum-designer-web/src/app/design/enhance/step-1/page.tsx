"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/enhance/FileUpload";
import { StreamingText } from "@/components/shared/StreamingText";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import {
  parseScopeJSON,
  stripJSONBlocks,
} from "@/lib/parsers";
import { cn, apiUrl } from "@/lib/utils";
import { AREA_LABELS } from "@/lib/claude/prompts";
import type { EnhanceScopeType, CourseArea } from "@/lib/types/curriculum";

const SCOPE_OPTIONS: {
  value: EnhanceScopeType;
  label: string;
  description: string;
  uploadHint: string;
  icon: string;
}[] = [
  {
    value: "full-curriculum",
    label: "Enhance Full Curriculum",
    description:
      "Upload your course syllabus so we can analyze the entire scope, identify gaps, and suggest improvements across all topics.",
    uploadHint: "Upload your syllabus, course outline, or curriculum document (.md, .txt, .pdf, .docx).",
    icon: "\uD83D\uDCDA",
  },
  {
    value: "single-topic",
    label: "Enhance a Single Topic",
    description:
      "Upload your slides or notes for one topic. We'll analyze the content and suggest targeted improvements.",
    uploadHint: "Upload your lecture slides or notes for the topic you want to enhance.",
    icon: "\uD83D\uDD2C",
  },
];

const SCOPE_TYPE_ICONS: Record<string, string> = {
  "add-topic": "+",
  "merge-topics": "\u2194",
  "reorder": "\u2195",
  "remove-topic": "\u2212",
  "update-scope": "\u21BB",
};

const SCOPE_TYPE_LABELS: Record<string, string> = {
  "add-topic": "Add Topic",
  "merge-topics": "Merge",
  "reorder": "Reorder",
  "remove-topic": "Remove",
  "update-scope": "Update",
};

export default function EnhanceStep1Page() {
  const router = useRouter();
  const {
    uploadedFiles,
    enhanceScopeType,
    enhanceScopeRaw,
    enhanceScopeSuggestions,
    enhanceTopics,
    setEnhanceScopeType,
    setEnhanceScopeRaw,
    setEnhanceScopeSuggestions,
    setEnhanceTopics,
    toggleScopeSuggestion,
    toggleEnhanceTopicSelection,
    selectAllEnhanceTopics,
    deselectAllEnhanceTopics,
    enhanceCourseContext,
    setEnhanceCourseContext,
    setEnhancePhase,
  } = useCurriculumStore();

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState(enhanceScopeRaw ?? "");
  const [courseName, setCourseName] = useState("");
  const [showContext, setShowContext] = useState(!!enhanceCourseContext);

  const isFullCurriculum = enhanceScopeType === "full-curriculum";
  const isSingleTopic = enhanceScopeType === "single-topic";

  const handleAnalyze = useCallback(async () => {
    if (uploadedFiles.length === 0) return;

    setIsStreaming(true);
    setStreamedContent("");
    setEnhanceScopeSuggestions([]);
    setEnhanceTopics([]);

    try {
      const materialType = isFullCurriculum ? "syllabus" : "slides";
      const response = await fetch(apiUrl("/api/enhance/scope"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: uploadedFiles, materialType, courseContext: enhanceCourseContext }),
      });

      if (!response.ok) throw new Error("Analysis failed");

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
              // Skip invalid JSON
            }
          }
        }
      }

      // Parse structured data
      const scopeData = parseScopeJSON(fullContent);
      const cleanContent = stripJSONBlocks(fullContent);

      setEnhanceScopeRaw(cleanContent);
      setStreamedContent(cleanContent);

      if (scopeData) {
        setCourseName(scopeData.courseName);
        setEnhanceScopeSuggestions(scopeData.scopeSuggestions);
        setEnhanceTopics(scopeData.topics);
      }
    } catch (error) {
      console.error("Scope analysis error:", error);
    } finally {
      setIsStreaming(false);
    }
  }, [
    uploadedFiles,
    isFullCurriculum,
    setEnhanceScopeRaw,
    setEnhanceScopeSuggestions,
    setEnhanceTopics,
  ]);

  const handleContinue = () => {
    setEnhancePhase(1);
    router.push("/design/enhance/step-2");
  };

  const selectedCount = enhanceTopics.filter((t) => t.selected).length;
  const hasContent = streamedContent || enhanceScopeRaw;
  const showStructured = !isStreaming && enhanceTopics.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Step 1: Upload &amp; Understand Your Curriculum
      </h1>
      <p className="text-muted-foreground mb-6">
        What would you like to enhance?
      </p>

      {/* Scope choice: full curriculum vs single topic */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {SCOPE_OPTIONS.map((option) => {
          const isSelected = enhanceScopeType === option.value;
          return (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer border-2 transition-all hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              )}
              onClick={() => setEnhanceScopeType(option.value)}
            >
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{option.label}</h3>
                      {isSelected && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Course context (optional, collapsible) */}
      {enhanceScopeType && (
        <div className="mb-8 border rounded-lg overflow-hidden">
          <button
            onClick={() => {
              const newShow = !showContext;
              setShowContext(newShow);
              if (newShow && !enhanceCourseContext) {
                setEnhanceCourseContext({
                  area: "computer-science",
                  audience: "beginners",
                  philosophy: "project-based",
                });
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div>
              <span className="font-semibold text-sm">
                {showContext ? "\u25BE" : "\u25B8"} Course Context
              </span>
              <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
            </div>
            {enhanceCourseContext && !showContext && (
              <span className="text-xs text-muted-foreground">
                {AREA_LABELS[enhanceCourseContext.area]} / {enhanceCourseContext.audience} / {enhanceCourseContext.philosophy}
              </span>
            )}
          </button>

          {showContext && (
            <div className="px-4 pb-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Providing discipline, audience, and teaching philosophy helps AI generate more targeted suggestions.
              </p>

              {/* Discipline */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Discipline</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.entries(AREA_LABELS) as [CourseArea, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() =>
                        setEnhanceCourseContext({
                          ...(enhanceCourseContext ?? { area: "computer-science", audience: "beginners", philosophy: "project-based" }),
                          area: value,
                        })
                      }
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/30",
                        enhanceCourseContext?.area === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                      )}
                      title={label}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {(["beginners", "intermediate", "advanced", "mixed"] as const).map((aud) => (
                    <button
                      key={aud}
                      onClick={() =>
                        setEnhanceCourseContext({
                          ...(enhanceCourseContext ?? { area: "computer-science", audience: "beginners", philosophy: "project-based" }),
                          audience: aud,
                        })
                      }
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-all hover:ring-2 hover:ring-primary/30",
                        enhanceCourseContext?.audience === aud
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                      )}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teaching Philosophy */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Teaching Philosophy</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "project-based", label: "Project-Based" },
                    { value: "theory-first", label: "Theory-First" },
                    { value: "problem-based", label: "Problem-Based" },
                    { value: "hands-on", label: "Hands-On" },
                  ] as const).map((phil) => (
                    <button
                      key={phil.value}
                      onClick={() =>
                        setEnhanceCourseContext({
                          ...(enhanceCourseContext ?? { area: "computer-science", audience: "beginners", philosophy: "project-based" }),
                          philosophy: phil.value,
                        })
                      }
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/30",
                        enhanceCourseContext?.philosophy === phil.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                      )}
                    >
                      {phil.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear context button */}
              <button
                onClick={() => {
                  setEnhanceCourseContext(null);
                  setShowContext(false);
                }}
                className="text-xs text-muted-foreground hover:text-destructive hover:underline"
              >
                Clear course context
              </button>
            </div>
          )}
        </div>
      )}

      {/* File upload (shown after scope type selected) */}
      {enhanceScopeType && (
        <>
          <h2 className="text-lg font-semibold mb-1">
            Upload {isFullCurriculum ? "Syllabus" : "Topic Materials"}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {SCOPE_OPTIONS.find((o) => o.value === enhanceScopeType)?.uploadHint}
          </p>
          <FileUpload />

          <div className="mt-6">
            <Button
              onClick={handleAnalyze}
              disabled={uploadedFiles.length === 0 || isStreaming}
              size="lg"
            >
              {isStreaming ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </>
      )}

      {/* Streaming / raw content */}
      {hasContent && !showStructured && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">
            {isFullCurriculum ? "Scope Analysis" : "Topic Analysis"}
          </h2>
          <div className="rounded-lg border p-6 bg-card">
            <StreamingText
              content={streamedContent || enhanceScopeRaw || ""}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      )}

      {/* Structured view (after streaming complete) */}
      {showStructured && (
        <div className="mt-10 space-y-8">
          {/* Course name */}
          {courseName && (
            <div className="rounded-lg border p-4 bg-card">
              <p className="text-sm text-muted-foreground">
                {isFullCurriculum ? "Course Detected" : "Topic Detected"}
              </p>
              <p className="text-lg font-semibold">{courseName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {enhanceTopics.length} topic{enhanceTopics.length !== 1 ? "s" : ""} identified
              </p>
            </div>
          )}

          {/* Scope Suggestions (full curriculum only) */}
          {isFullCurriculum && enhanceScopeSuggestions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-1">Scope Suggestions</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Click Accept or Dismiss for each suggestion. Accepted suggestions inform the enhancement process.
              </p>
              <div className="space-y-3">
                {enhanceScopeSuggestions.map((suggestion) => (
                  <Card
                    key={suggestion.id}
                    className={cn(
                      "border transition-all",
                      suggestion.accepted
                        ? "border-green-300 bg-green-50/50"
                        : "border-muted"
                    )}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                            {SCOPE_TYPE_ICONS[suggestion.type] || "?"}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {SCOPE_TYPE_LABELS[suggestion.type] || suggestion.type}
                              </Badge>
                              <span className="font-medium text-sm">
                                {suggestion.title}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant={suggestion.accepted ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (!suggestion.accepted) toggleScopeSuggestion(suggestion.id);
                            }}
                            title="Accept this suggestion"
                          >
                            {suggestion.accepted ? "Accepted" : "Accept"}
                          </Button>
                          <Button
                            variant={suggestion.accepted ? "outline" : "ghost"}
                            size="sm"
                            onClick={() => {
                              if (suggestion.accepted) toggleScopeSuggestion(suggestion.id);
                            }}
                            title="Dismiss this suggestion"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Topic Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-1">Topics to Enhance</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {isFullCurriculum
                ? "Select which topics you want to deep-dive into. Click a topic to toggle selection."
                : "These are the sub-topics identified from your materials. Select what you want to enhance."}
            </p>
            {isFullCurriculum && (
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllEnhanceTopics}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllEnhanceTopics}
                >
                  Clear All
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {enhanceTopics.map((topic) => (
                <div
                  key={topic.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all hover:shadow-sm",
                    topic.selected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => toggleEnhanceTopicSelection(topic.id)}
                  title={`Click to ${topic.selected ? "deselect" : "select"} this topic`}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs transition-colors",
                      topic.selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {topic.selected && "\u2713"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {topic.weekOrModule && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {topic.weekOrModule}
                        </Badge>
                      )}
                      <span className="font-medium text-sm truncate">
                        {topic.name}
                      </span>
                    </div>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue button */}
          <div className="pt-2">
            <Button
              onClick={handleContinue}
              size="lg"
              disabled={selectedCount === 0}
            >
              Continue to Topic Enhancement ({selectedCount} selected)
            </Button>
            {selectedCount === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Select at least one topic to continue.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
