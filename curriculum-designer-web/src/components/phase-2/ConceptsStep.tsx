"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { generateId } from "@/lib/parsers";
import type { CoreConcept, ConceptPriority } from "@/lib/types/curriculum";
import { cn, apiUrl } from "@/lib/utils";

interface ConceptsStepProps {
  concepts: CoreConcept[];
  moduleName: string;
  onChange: (concepts: CoreConcept[]) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

interface DeepDiveData {
  explanation: string;
  whyItMatters: string;
  subTopics: { name: string; description: string }[];
  misconceptions: { misconception: string; correction: string }[];
  teachingTip: string;
}

const priorityConfig: Record<
  ConceptPriority,
  { label: string; color: string; icon: string }
> = {
  emphasize: {
    label: "Emphasize",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "⭐",
  },
  normal: {
    label: "Normal",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "📘",
  },
  optional: {
    label: "Optional",
    color: "bg-gray-100 text-gray-600 border-gray-300",
    icon: "💡",
  },
};

const priorityCycle: ConceptPriority[] = ["emphasize", "normal", "optional"];

export function ConceptsStep({
  concepts,
  moduleName,
  onChange,
  onConfirm,
  isLoading,
}: ConceptsStepProps) {
  const { courseInfo } = useCurriculumStore();
  const [newName, setNewName] = useState("");
  const [deepDiveId, setDeepDiveId] = useState<string | null>(null);
  const [deepDiveData, setDeepDiveData] = useState<Record<string, DeepDiveData>>({});
  const [deepDiveLoading, setDeepDiveLoading] = useState<string | null>(null);

  const togglePriority = (id: string) => {
    onChange(
      concepts.map((c) => {
        if (c.id !== id) return c;
        const currentIdx = priorityCycle.indexOf(c.priority);
        const nextPriority =
          priorityCycle[(currentIdx + 1) % priorityCycle.length];
        return { ...c, priority: nextPriority };
      })
    );
  };

  const handleRemove = (id: string) => {
    onChange(concepts.filter((c) => c.id !== id));
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    onChange([
      ...concepts,
      {
        id: generateId(),
        name: newName.trim(),
        description: "",
        priority: "normal",
      },
    ]);
    setNewName("");
  };

  const handleDeepDive = async (concept: CoreConcept) => {
    // Toggle off if already showing
    if (deepDiveId === concept.id) {
      setDeepDiveId(null);
      return;
    }

    setDeepDiveId(concept.id);

    // If we already fetched this one, just show it
    if (deepDiveData[concept.id]) return;

    setDeepDiveLoading(concept.id);
    try {
      const res = await fetch(apiUrl("/api/curriculum/module/deep-dive"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseInfo,
          moduleName,
          conceptName: concept.name,
          conceptDescription: concept.description,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch deep dive");
      const data = await res.json();
      setDeepDiveData((prev) => ({ ...prev, [concept.id]: data }));
    } catch (err) {
      console.error("Deep dive error:", err);
    } finally {
      setDeepDiveLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">Step 2: Core Concepts</h3>
        <p className="text-sm text-muted-foreground">
          Click the priority badge to cycle between Emphasize, Normal, or
          Optional. Click &quot;Deep Dive&quot; to explore a concept further.
        </p>
      </div>

      <div className="space-y-2">
        {concepts.map((concept) => {
          const config = priorityConfig[concept.priority];
          const isExpanded = deepDiveId === concept.id;
          const dive = deepDiveData[concept.id];
          const isDiveLoading = deepDiveLoading === concept.id;

          return (
            <Card
              key={concept.id}
              className={cn(
                "transition-opacity",
                concept.priority === "optional" && "opacity-60"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePriority(concept.id)}
                    className="shrink-0"
                    title={`Priority: ${config.label}. Click to change.`}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer select-none",
                        config.color
                      )}
                    >
                      {config.icon} {config.label}
                    </Badge>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{concept.name}</p>
                    {concept.description && (
                      <p className="text-xs text-muted-foreground">
                        {concept.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => handleDeepDive(concept)}
                  >
                    {isExpanded ? "Close" : "Deep Dive"}
                  </Button>
                  <button
                    onClick={() => handleRemove(concept.id)}
                    className="text-muted-foreground hover:text-destructive text-sm px-1 shrink-0"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>

                {/* Deep dive expanded content */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {isDiveLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading deep dive...
                      </p>
                    ) : dive ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            What it is
                          </p>
                          <p className="text-sm">{dive.explanation}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Why it matters
                          </p>
                          <p className="text-sm">{dive.whyItMatters}</p>
                        </div>
                        {dive.subTopics?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Key sub-topics
                            </p>
                            <ul className="text-sm space-y-1">
                              {dive.subTopics.map((st, i) => (
                                <li key={i}>
                                  <strong>{st.name}</strong> — {st.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {dive.misconceptions?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Common misconceptions
                            </p>
                            <ul className="text-sm space-y-1">
                              {dive.misconceptions.map((m, i) => (
                                <li key={i}>
                                  <span className="text-destructive">
                                    Myth:
                                  </span>{" "}
                                  {m.misconception}
                                  <br />
                                  <span className="text-green-700">
                                    Reality:
                                  </span>{" "}
                                  {m.correction}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {dive.teachingTip && (
                          <div className="bg-muted/50 rounded-md p-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Teaching tip
                            </p>
                            <p className="text-sm">{dive.teachingTip}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Failed to load deep dive. Try again.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add new concept */}
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a concept..."
          className="text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button variant="outline" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>

      <Button onClick={onConfirm} disabled={isLoading}>
        Confirm Concepts
      </Button>
    </div>
  );
}
