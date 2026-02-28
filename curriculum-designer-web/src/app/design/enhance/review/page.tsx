"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { buildExportFiles } from "@/lib/export/markdown";
import { SLIDE_TYPE_COLORS, SLIDE_TYPE_LABELS } from "@/components/shared/SlideCard";
import { cn } from "@/lib/utils";
import type { DifficultyLevel, CurriculumStore } from "@/lib/types/curriculum";

const CATEGORY_LABELS: Record<string, string> = {
  "new-content": "New Content",
  exercise: "Exercise",
  interaction: "Interaction",
  animation: "Animation",
  update: "Update",
};

const SCOPE_TYPE_LABELS: Record<string, string> = {
  "add-topic": "Add Topic",
  "merge-topics": "Merge",
  reorder: "Reorder",
  "remove-topic": "Remove",
  "update-scope": "Update",
};

const LEVEL_COLORS: Record<DifficultyLevel, string> = {
  basic: "text-green-700",
  intermediate: "text-yellow-700",
  advanced: "text-red-700",
};

export default function EnhanceReviewPage() {
  const router = useRouter();
  const store = useCurriculumStore();
  const {
    enhanceScopeRaw,
    enhanceScopeSuggestions,
    enhanceTopics,
    enhanceTopicDeepDives,
    enhanceSlidePlan,
  } = store;

  const selectedTopics = enhanceTopics.filter((t) => t.selected);
  const acceptedSuggestions = enhanceScopeSuggestions.filter((s) => s.accepted);

  if (selectedTopics.length === 0 && !enhanceScopeRaw) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">No enhancement data found.</p>
        <Button onClick={() => router.push("/design/enhance/step-1")}>
          Start from Step 1
        </Button>
      </div>
    );
  }

  // Count total selected suggestions across all topics
  const totalSelectedSuggestions = enhanceTopicDeepDives.reduce(
    (sum, d) => sum + d.suggestions.filter((s) => s.selected).length,
    0
  );
  const topicsWithCalibration = enhanceTopicDeepDives.filter(
    (d) => d.calibration && d.calibration.questions.length > 0
  ).length;
  const slidesPlanned = enhanceSlidePlan?.reduce(
    (sum, m) => sum + m.slides.filter((s) => s.enabled).length,
    0
  ) ?? 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Review &amp; Export</h1>
          <p className="text-muted-foreground">
            Review all enhancement results and export your updated curriculum.
          </p>
        </div>
        <ExportButtons />
      </div>

      {/* Implementation & Consultation CTA */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Request Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our team will build your enhanced curriculum into production-ready materials — slides, LMS packages, and more.
            </p>
            <RequestImplementationDialog store={store} />
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Book a Consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Work with our LearnAI team to refine your curriculum, improve learning outcomes, and get expert pedagogical feedback.
            </p>
            <a
              href="https://www.lainow.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                Schedule with LearnAI
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Summary stats */}
      <div className="mb-6 rounded-lg border bg-muted/30 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-sm">
          <div>
            <p className="text-muted-foreground">Topics Enhanced</p>
            <p className="font-medium">{selectedTopics.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Scope Changes</p>
            <p className="font-medium">{acceptedSuggestions.length} accepted</p>
          </div>
          <div>
            <p className="text-muted-foreground">Suggestions Selected</p>
            <p className="font-medium">{totalSelectedSuggestions}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Slides Planned</p>
            <p className="font-medium">{slidesPlanned}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Topics Calibrated</p>
            <p className="font-medium">{topicsWithCalibration}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="topics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scope">Scope</TabsTrigger>
          <TabsTrigger value="topics">Topic Enhancements</TabsTrigger>
          <TabsTrigger value="slide-plan">Slide Plan</TabsTrigger>
        </TabsList>

        {/* Scope Tab */}
        <TabsContent value="scope">
          {/* Accepted scope suggestions */}
          {acceptedSuggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Accepted Scope Changes</h3>
              <div className="space-y-2">
                {acceptedSuggestions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50/50 px-4 py-3"
                  >
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {SCOPE_TYPE_LABELS[s.type] || s.type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics list */}
          <h3 className="text-sm font-semibold mb-3">
            Topics ({selectedTopics.length} selected for enhancement)
          </h3>
          <div className="space-y-2">
            {selectedTopics.map((topic) => {
              const dd = enhanceTopicDeepDives.find((d) => d.topicId === topic.id);
              const suggestionCount = dd?.suggestions.filter((s) => s.selected).length ?? 0;
              const hasCal = dd?.calibration && dd.calibration.questions.length > 0;
              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {topic.weekOrModule}
                    </Badge>
                    <span className="text-sm font-medium">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {suggestionCount > 0 && (
                      <span>{suggestionCount} suggestions</span>
                    )}
                    {hasCal && (
                      <Badge variant="outline" className="text-xs">
                        Calibrated
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Topic Enhancements Tab */}
        <TabsContent value="topics">
          <div className="space-y-6">
            {selectedTopics.map((topic) => {
              const dd = enhanceTopicDeepDives.find((d) => d.topicId === topic.id);
              const selectedSuggestions = dd?.suggestions.filter((s) => s.selected) ?? [];
              const cal = dd?.calibration;

              if (selectedSuggestions.length === 0 && !cal) return null;

              // Calibration counts
              const counts = cal
                ? (() => {
                    const c = { basic: 0, intermediate: 0, advanced: 0 };
                    for (const q of cal.questions) {
                      const level = cal.assignedLevels?.[q.id] as DifficultyLevel | null;
                      if (level && level in c) c[level]++;
                    }
                    return c;
                  })()
                : null;

              return (
                <Card key={topic.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="secondary">{topic.weekOrModule}</Badge>
                      {topic.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Selected suggestions */}
                    {selectedSuggestions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Selected Enhancements ({selectedSuggestions.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedSuggestions.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-start gap-2 rounded border px-3 py-2"
                            >
                              <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                                {CATEGORY_LABELS[s.category] || s.category}
                              </Badge>
                              <div>
                                <p className="text-sm font-medium">{s.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {s.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Calibration summary */}
                    {counts && (counts.basic + counts.intermediate + counts.advanced > 0) && (
                      <div className="text-xs text-muted-foreground border-t pt-3">
                        Difficulty calibration:{" "}
                        {counts.basic > 0 && (
                          <span className={cn("font-medium", LEVEL_COLORS.basic)}>
                            {counts.basic} Basic
                          </span>
                        )}
                        {counts.basic > 0 && (counts.intermediate + counts.advanced) > 0 && ", "}
                        {counts.intermediate > 0 && (
                          <span className={cn("font-medium", LEVEL_COLORS.intermediate)}>
                            {counts.intermediate} Intermediate
                          </span>
                        )}
                        {counts.intermediate > 0 && counts.advanced > 0 && ", "}
                        {counts.advanced > 0 && (
                          <span className={cn("font-medium", LEVEL_COLORS.advanced)}>
                            {counts.advanced} Advanced
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Slide Plan Tab */}
        <TabsContent value="slide-plan">
          {enhanceSlidePlan && enhanceSlidePlan.length > 0 ? (
            <div className="space-y-4">
              {enhanceSlidePlan.map((topicPlan, topicIdx) => {
                const enabledCount = topicPlan.slides.filter((s) => s.enabled).length;
                return (
                  <div key={`sp-${topicIdx}`} className="border rounded-lg">
                    <div className="px-4 py-3 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                          {topicIdx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-sm">{topicPlan.moduleName}</p>
                          <p className="text-xs text-muted-foreground">
                            {enabledCount} / {topicPlan.slides.length} slides enabled
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {topicPlan.slides.map((slide) => (
                        <div
                          key={slide.id}
                          className={cn(
                            "rounded-lg border p-3 transition-opacity",
                            !slide.enabled && "opacity-40"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                SLIDE_TYPE_COLORS[slide.slideType] ?? "bg-gray-100 text-gray-700"
                              )}
                            >
                              {SLIDE_TYPE_LABELS[slide.slideType] ?? slide.slideType}
                            </span>
                            <span className="text-sm font-medium">{slide.title}</span>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-0.5 ml-1">
                            {slide.bulletPoints.map((bp, j) => (
                              <li key={j} className="flex items-start gap-2">
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
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No slide plan generated yet.</p>
              <p className="text-xs mt-1">
                Go back to Step 3 to generate a slide plan for your enhanced topics.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Request Implementation Dialog (same pattern as create review page) ---

function RequestImplementationDialog({
  store,
}: {
  store: CurriculumStore;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const files = buildExportFiles(store);
      const filesContent = files.map((f) => `--- ${f.name} ---\n${f.content}`).join("\n\n");

      const res = await fetch("/api/implementation-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim(),
          course: course.trim(),
          email,
          courseTopic: "Enhancement Request",
          courseInfo: JSON.stringify({ mode: "enhance", enhanceScopeType: store.enhanceScopeType }),
          files: filesContent,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit request");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSubmitted(false); setError(null); } }}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">Request Implementation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Implementation</DialogTitle>
          <DialogDescription>
            Our team will build out your enhanced curriculum into production-ready materials. Fill in your details and we will reach out.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="py-4 text-center">
            <p className="text-green-600 font-medium mb-1">
              Your request has been submitted!
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              We will contact you at <span className="font-medium">{email}</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              Want expert feedback sooner?{" "}
              <a
                href="https://www.lainow.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700"
              >
                Book a consultation with LearnAI
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="impl-name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="impl-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="impl-dept" className="text-sm font-medium">
                Department
              </label>
              <input
                id="impl-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="impl-course" className="text-sm font-medium">
                Course
              </label>
              <input
                id="impl-course"
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="CS 101: Introduction to Programming"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="impl-email" className="text-sm font-medium">
                Email address <span className="text-destructive">*</span>
              </label>
              <input
                id="impl-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
