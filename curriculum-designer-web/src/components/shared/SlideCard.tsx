"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SlideType, SlidePlanItem } from "@/lib/types/curriculum";

export const SLIDE_TYPES: SlideType[] = [
  "title",
  "objectives",
  "concept",
  "code-example",
  "exercise",
  "quiz",
  "animation",
  "interactive",
  "discussion",
  "summary",
  "divider",
];

export const SLIDE_TYPE_COLORS: Record<SlideType, string> = {
  title: "bg-gray-100 text-gray-700",
  objectives: "bg-sky-100 text-sky-700",
  concept: "bg-blue-100 text-blue-700",
  "code-example": "bg-slate-100 text-slate-700",
  exercise: "bg-green-100 text-green-700",
  quiz: "bg-orange-100 text-orange-700",
  animation: "bg-purple-100 text-purple-700",
  interactive: "bg-pink-100 text-pink-700",
  discussion: "bg-teal-100 text-teal-700",
  summary: "bg-gray-100 text-gray-700",
  divider: "bg-gray-100 text-gray-500",
};

export const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  title: "Title",
  objectives: "Objectives",
  concept: "Concept",
  "code-example": "Code Example",
  exercise: "Exercise",
  quiz: "Quiz",
  animation: "Animation",
  interactive: "Interactive",
  discussion: "Discussion",
  summary: "Summary",
  divider: "Divider",
};

export function SlideCard({
  slide,
  slideIdx,
  totalSlides,
  isEditing,
  onToggleEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  slide: SlidePlanItem;
  slideIdx: number;
  totalSlides: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (updates: Partial<SlidePlanItem>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Title
            </label>
            <input
              value={slide.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Slide type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Slide Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SLIDE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ slideType: type })}
                  title={`Set type to ${SLIDE_TYPE_LABELS[type]}`}
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-primary/30",
                    slide.slideType === type
                      ? `${SLIDE_TYPE_COLORS[type]} ring-2 ring-offset-1 ring-primary`
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {SLIDE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Bullet points */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Bullet Points
            </label>
            <div className="space-y-1.5">
              {slide.bulletPoints.map((bp, bpIdx) => (
                <div key={bpIdx} className="flex gap-1.5">
                  <input
                    value={bp}
                    onChange={(e) => {
                      const updated = [...slide.bulletPoints];
                      updated[bpIdx] = e.target.value;
                      onUpdate({ bulletPoints: updated });
                    }}
                    placeholder="Bullet point text..."
                    className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => {
                      const updated = slide.bulletPoints.filter(
                        (_, i) => i !== bpIdx
                      );
                      onUpdate({
                        bulletPoints: updated.length > 0 ? updated : [""],
                      });
                    }}
                    title="Remove bullet point"
                    className="shrink-0 rounded px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  onUpdate({
                    bulletPoints: [...slide.bulletPoints, ""],
                  })
                }
                className="text-xs text-primary hover:underline"
              >
                + Add bullet point
              </button>
            </div>
          </div>

          {/* Teaching notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Teaching Notes (optional)
            </label>
            <textarea
              value={slide.teachingNotes ?? ""}
              onChange={(e) => onUpdate({ teachingNotes: e.target.value })}
              placeholder="Instructor guidance for this slide..."
              rows={2}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>

          {/* Edit mode actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <button
              onClick={() => {
                if (confirm("Delete this slide?")) onRemove();
              }}
              className="text-xs text-destructive hover:underline"
            >
              Delete slide
            </button>
            <Button size="sm" onClick={onToggleEdit}>
              Done Editing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Read-only view ---
  return (
    <Card
      className={cn("transition-opacity", !slide.enabled && "opacity-40")}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  SLIDE_TYPE_COLORS[slide.slideType] ??
                    "bg-gray-100 text-gray-700"
                )}
              >
                {SLIDE_TYPE_LABELS[slide.slideType] ?? slide.slideType}
              </span>
              <h4 className="text-sm font-medium">{slide.title}</h4>
            </div>
            <ul className="space-y-1 ml-1">
              {slide.bulletPoints.map((bp, bpIdx) => (
                <li
                  key={bpIdx}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  {bp}
                </li>
              ))}
            </ul>
            {slide.teachingNotes && (
              <div className="mt-2 rounded bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Instructor:</span>{" "}
                  {slide.teachingNotes}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {/* Move up */}
            <button
              onClick={onMoveUp}
              disabled={slideIdx === 0}
              title="Move up"
              className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>

            {/* Edit */}
            <button
              onClick={onToggleEdit}
              title="Edit this slide"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            {/* Move down */}
            <button
              onClick={onMoveDown}
              disabled={slideIdx === totalSlides - 1}
              title="Move down"
              className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Toggle enabled */}
            <button
              onClick={() => onUpdate({ enabled: !slide.enabled })}
              title={
                slide.enabled
                  ? "Click to exclude this slide"
                  : "Click to include this slide"
              }
              className={cn(
                "mt-1 shrink-0 rounded-full px-2 py-0.5 text-xs transition-colors hover:ring-2 hover:ring-primary/30",
                slide.enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {slide.enabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
