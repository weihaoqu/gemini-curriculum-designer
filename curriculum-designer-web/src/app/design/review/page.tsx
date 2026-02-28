"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { StreamingText } from "@/components/shared/StreamingText";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { buildExportFiles } from "@/lib/export/markdown";
import { apiUrl } from "@/lib/utils";
import type { CurriculumStore } from "@/lib/types/curriculum";

export default function ReviewPage() {
  const router = useRouter();
  const store = useCurriculumStore();
  const {
    courseInfo,
    topicLandscape,
    modules,
    slidePlan,
    assessmentsContent,
    deliveryContent,
    updateModule,
    setTopicLandscape,
    setAssessmentsContent,
    setDeliveryContent,
  } = store;

  if (!courseInfo) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">No curriculum data found.</p>
        <Button onClick={() => router.push("/design/phase-1")}>Start from Phase 1</Button>
      </div>
    );
  }

  const completedModules = modules
    .map((m, i) => ({ module: m, index: i }))
    .filter(({ module }) => module.status === "complete");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Review & Export</h1>
          <p className="text-muted-foreground">
            Review all generated content and export your curriculum.
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
              Our team will build your curriculum into production-ready materials — slides, LMS packages, and more.
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

      <div className="space-y-6">
        {/* Course Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">Topic</p>
                <p className="font-medium">{courseInfo.topic}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Discipline</p>
                <p className="font-medium capitalize">{(courseInfo.area ?? "other").replace("-", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Audience</p>
                <p className="font-medium capitalize">{courseInfo.audience}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Format</p>
                <p className="font-medium capitalize">{courseInfo.format}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Philosophy</p>
                <p className="font-medium capitalize">{(courseInfo.philosophy ?? "").replace("-", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Modules</p>
                <p className="font-medium">
                  {completedModules.length} / {modules.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Cards */}
        {completedModules.map(({ module: mod, index: modIdx }) => (
          <ContentCard
            key={modIdx}
            title={`Module ${modIdx + 1}: ${mod.name}`}
            content={mod.content ?? ""}
            onSave={(content) => updateModule(modIdx, { content })}
          />
        ))}

        {/* Slide Plan Card */}
        {slidePlan && slidePlan.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Slide Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {slidePlan.map((mp) => {
                  const enabledCount = mp.slides.filter((s) => s.enabled).length;
                  return (
                    <AccordionItem
                      key={mp.moduleIndex}
                      value={`slide-${mp.moduleIndex}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="text-sm font-medium">
                        <span>
                          Module {mp.moduleIndex + 1}: {mp.moduleName}{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            ({enabledCount}/{mp.slides.length} slides)
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 py-2">
                          {mp.slides
                            .filter((s) => s.enabled)
                            .map((slide, i) => (
                              <div key={slide.id} className="rounded-lg border p-3">
                                <p className="text-sm font-medium">
                                  <span className="text-muted-foreground/50 font-mono mr-2">
                                    {i + 1}.
                                  </span>
                                  {slide.title}
                                  <span className="ml-2 text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                    {slide.slideType}
                                  </span>
                                </p>
                                <ul className="text-xs text-muted-foreground mt-1 ml-6 space-y-0.5">
                                  {slide.bulletPoints.map((bp, j) => (
                                    <li key={j}>– {bp}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Assessments Card */}
        {assessmentsContent && (
          <ContentCard
            title="Assessments"
            content={assessmentsContent}
            onSave={setAssessmentsContent}
          />
        )}

        {/* Delivery Templates Card */}
        {deliveryContent && (
          <ContentCard
            title="Delivery Templates"
            content={deliveryContent}
            onSave={setDeliveryContent}
          />
        )}

        {/* Resources Card */}
        {topicLandscape && (
          <ContentCard
            title="Resources"
            content={topicLandscape}
            onSave={setTopicLandscape}
          />
        )}

        {/* Bottom spacer */}
        <div className="pt-4" />
      </div>
    </div>
  );
}

// --- Request Implementation Dialog ---

function RequestImplementationDialog({
  store,
}: {
  store: CurriculumStore;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState(store.courseInfo?.topic ?? "");
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

      const res = await fetch(apiUrl("/api/implementation-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim(),
          course: course.trim(),
          email,
          courseTopic: store.courseInfo?.topic ?? "",
          courseInfo: JSON.stringify(store.courseInfo),
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
            Our team will build out your curriculum into production-ready materials. Fill in your details and we will reach out.
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

// --- Reusable accordion card for markdown content ---

function ContentCard({
  title,
  content,
  onSave,
}: {
  title: string;
  content: string;
  onSave?: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(content);

  const sections = useMemo(() => {
    return content
      .split(/^## /gm)
      .filter(Boolean)
      .map((section) => {
        const lines = section.split("\n");
        const sectionTitle = lines[0]?.trim() ?? "";
        const body = lines.slice(1).join("\n").trim();
        return { title: sectionTitle, body };
      });
  }, [content]);

  const handleSave = () => {
    onSave?.(editText);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {onSave && (
            <div className="flex gap-1">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditText(content); setEditing(true); }}
                >
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[400px] font-mono text-sm rounded-lg border p-4 bg-muted/30 resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        ) : sections.length > 0 ? (
          <Accordion type="multiple" className="space-y-2">
            {sections.map((section, i) => (
              <AccordionItem
                key={i}
                value={`section-${i}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  {section.title || `Section ${i + 1}`}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <StreamingText content={section.body} isStreaming={false} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="rounded-lg bg-muted/30 p-4">
            <StreamingText content={content} isStreaming={false} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
