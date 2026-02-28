"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StreamingText } from "@/components/shared/StreamingText";
import { useCurriculumStore } from "@/lib/store/curriculum-store";

export default function AssessmentResultsPage() {
  const router = useRouter();
  const { assessmentsContent, setCurrentPhase } = useCurriculumStore();
  const [showFullContent, setShowFullContent] = useState(false);

  const sections = useMemo(() => {
    if (!assessmentsContent) return [];
    return assessmentsContent
      .split(/^## /gm)
      .filter(Boolean)
      .map((section) => {
        const lines = section.split("\n");
        const title = lines[0]?.trim() ?? "";
        const body = lines.slice(1).join("\n").trim();
        const subSectionCount = (body.match(/^### /gm) || []).length;
        return { title, body, subSectionCount };
      });
  }, [assessmentsContent]);

  if (!assessmentsContent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          No assessments generated yet.
        </p>
        <Button onClick={() => router.push("/design/phase-4")}>
          {"<- Back to Assessment Design"}
        </Button>
      </div>
    );
  }

  const handleContinue = () => {
    setCurrentPhase(4);
    router.push("/design/phase-5");
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/design/phase-4")}
      >
        {"<- Back to Assessment Design"}
      </Button>

      <h1 className="text-2xl font-bold mb-2">Assessment Results</h1>
      <p className="text-muted-foreground mb-6">
        {sections.length} sections generated. Expand each to review.
      </p>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Assessment Sections ({sections.length})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullContent(!showFullContent)}
          >
            {showFullContent ? "Show Summary" : "Show Full Content"}
          </Button>
        </div>

        {showFullContent ? (
          <div className="rounded-lg border p-6 bg-card">
            <StreamingText content={assessmentsContent} isStreaming={false} />
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {sections.map((section, i) => (
              <AccordionItem
                key={i}
                value={`section-${i}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium py-4">
                  <div className="flex items-center gap-3">
                    <span>{section.title || `Section ${i + 1}`}</span>
                    {section.subSectionCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                        {section.subSectionCount} sub-section
                        {section.subSectionCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <StreamingText
                      content={section.body}
                      isStreaming={false}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleContinue} size="lg">
          Continue to Phase 5
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/design/phase-4")}
        >
          Reconfigure & Regenerate
        </Button>
      </div>
    </div>
  );
}
