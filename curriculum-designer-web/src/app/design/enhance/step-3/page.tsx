"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SlideCard } from "@/components/shared/SlideCard";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { generateId } from "@/lib/parsers";
import type {
  SlidePlanItem,
  ModuleSlidePlan,
} from "@/lib/types/curriculum";

export default function EnhanceStep3Page() {
  const router = useRouter();
  const {
    enhanceTopics,
    enhanceTopicDeepDives,
    enhanceScopeRaw,
    enhanceSlidePlan,
    enhanceCourseContext,
    setEnhanceSlidePlan,
    updateEnhanceSlidePlanItem,
    addEnhanceSlide,
    removeEnhanceSlide,
    reorderEnhanceSlide,
    setEnhancePhase,
  } = useCurriculumStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const selectedTopics = enhanceTopics.filter((t) => t.selected);

  // Detect course name from scope raw content
  const detectedCourseName = (() => {
    const raw = enhanceScopeRaw ?? "";
    const match = raw.match(/course[:\s]+["']?([^"'\n]+)/i);
    return match?.[1]?.trim() ?? "this course";
  })();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/enhance/slide-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: detectedCourseName,
          topics: selectedTopics,
          deepDives: enhanceTopicDeepDives,
          courseContext: enhanceCourseContext,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate slide plan");

      const data = await res.json();
      const modules: ModuleSlidePlan[] = (data.modules ?? []).map(
        (m: { moduleIndex: number; moduleName: string; slides: unknown[] }) => ({
          moduleIndex: m.moduleIndex,
          moduleName: m.moduleName,
          slides: m.slides,
        })
      );

      setEnhanceSlidePlan(modules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSlide = (topicIndex: number) => {
    const newSlide: SlidePlanItem = {
      id: generateId(),
      title: "New Slide",
      bulletPoints: [""],
      slideType: "concept",
      enabled: true,
      teachingNotes: "",
    };
    addEnhanceSlide(topicIndex, newSlide);
    setEditingSlideId(newSlide.id);
  };

  const handleContinue = () => {
    setEnhancePhase(3);
    router.push("/design/enhance/review");
  };

  const totalSlides =
    enhanceSlidePlan?.reduce((sum, m) => sum + m.slides.length, 0) ?? 0;
  const enabledSlides =
    enhanceSlidePlan?.reduce(
      (sum, m) => sum + m.slides.filter((s) => s.enabled).length,
      0
    ) ?? 0;

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Slide Plan</h1>
        <p className="text-sm text-muted-foreground">
          Generate a structured slide outline for your enhanced topics. You can
          edit titles, bullet points, teaching notes, reorder slides, or add
          new ones.
        </p>
      </div>

      {/* Generate button */}
      <div className="mb-6">
        <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
          {isGenerating
            ? "Generating Slide Plan..."
            : enhanceSlidePlan
              ? "Regenerate Slide Plan"
              : "Generate Slide Plan"}
        </Button>
        {!enhanceSlidePlan && !isGenerating && (
          <p className="text-xs text-muted-foreground mt-2">
            Will create a slide-by-slide outline for {selectedTopics.length}{" "}
            topic{selectedTopics.length !== 1 ? "s" : ""} with your approved
            enhancements.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Slide plan results */}
      {enhanceSlidePlan && enhanceSlidePlan.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span>
              {enabledSlides} / {totalSlides} slides enabled
            </span>
            <span>across {enhanceSlidePlan.length} topics</span>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Click the pencil icon on any slide to edit it. Use arrows to
            reorder, or add new slides with the button at the bottom of each
            topic.
          </p>

          <Accordion
            type="multiple"
            defaultValue={enhanceSlidePlan.map((_, i) => `topic-${i}`)}
            className="space-y-4"
          >
            {enhanceSlidePlan.map((topicPlan, topicIdx) => {
              const enabledCount = topicPlan.slides.filter(
                (s) => s.enabled
              ).length;
              return (
                <AccordionItem
                  key={`topic-${topicIdx}`}
                  value={`topic-${topicIdx}`}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {topicIdx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-sm">
                          {topicPlan.moduleName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {enabledCount} / {topicPlan.slides.length} slides
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {topicPlan.slides.map((slide, slideIdx) => (
                        <SlideCard
                          key={slide.id}
                          slide={slide}
                          slideIdx={slideIdx}
                          totalSlides={topicPlan.slides.length}
                          isEditing={editingSlideId === slide.id}
                          onToggleEdit={() =>
                            setEditingSlideId(
                              editingSlideId === slide.id ? null : slide.id
                            )
                          }
                          onUpdate={(updates) =>
                            updateEnhanceSlidePlanItem(
                              topicPlan.moduleIndex,
                              slide.id,
                              updates
                            )
                          }
                          onRemove={() =>
                            removeEnhanceSlide(
                              topicPlan.moduleIndex,
                              slide.id
                            )
                          }
                          onMoveUp={() =>
                            reorderEnhanceSlide(
                              topicPlan.moduleIndex,
                              slideIdx,
                              slideIdx - 1
                            )
                          }
                          onMoveDown={() =>
                            reorderEnhanceSlide(
                              topicPlan.moduleIndex,
                              slideIdx,
                              slideIdx + 1
                            )
                          }
                        />
                      ))}
                    </div>

                    {/* Add slide button */}
                    <button
                      onClick={() => handleAddSlide(topicPlan.moduleIndex)}
                      className="mt-3 w-full rounded-lg border-2 border-dashed py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      + Add Slide
                    </button>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t mt-8">
        <Button
          variant="outline"
          onClick={() => router.push("/design/enhance/step-2")}
        >
          &larr; Back to Topics
        </Button>
        <div className="text-right">
          <Button
            onClick={handleContinue}
            size="lg"
            disabled={!enhanceSlidePlan}
          >
            Continue to Review &rarr;
          </Button>
          {!enhanceSlidePlan && (
            <p className="text-xs text-muted-foreground mt-2">
              Generate a slide plan to continue, or go back to adjust topics.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
