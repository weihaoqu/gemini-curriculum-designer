"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StreamingText } from "@/components/shared/StreamingText";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { useStreaming } from "@/lib/hooks/useStreaming";

export default function TemplatesPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading...</div>}>
      <TemplatesPage />
    </Suspense>
  );
}

function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldGenerate = searchParams.get("generate") === "1";

  const {
    courseInfo,
    modules,
    deliveryContent,
    selectedDeliveryFormats,
    setDeliveryContent,
    setCurrentPhase,
  } = useCurriculumStore();

  const { content, isStreaming, stream } = useStreaming();
  const generationTriggered = useRef(false);

  // Auto-generate if navigated with ?generate=1
  useEffect(() => {
    if (
      shouldGenerate &&
      !generationTriggered.current &&
      courseInfo &&
      selectedDeliveryFormats.length > 0
    ) {
      generationTriggered.current = true;
      stream("/api/curriculum/delivery", {
        courseInfo,
        modules,
        deliveryFormats: selectedDeliveryFormats,
      }).then((result) => {
        setDeliveryContent(result);
      });
    }
  }, [shouldGenerate, courseInfo, modules, selectedDeliveryFormats, stream, setDeliveryContent]);

  const displayContent = isStreaming ? content : deliveryContent;

  const sections = useMemo(() => {
    if (!displayContent) return [];
    return displayContent
      .split(/^## /gm)
      .filter(Boolean)
      .map((section) => {
        const lines = section.split("\n");
        const title = lines[0]?.trim() ?? "";
        const body = lines.slice(1).join("\n").trim();
        return { title, body };
      });
  }, [displayContent]);

  if (!displayContent && !isStreaming) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          No templates generated yet.
        </p>
        <Button onClick={() => router.push("/design/phase-5")}>
          {"<- Back to Format Selection"}
        </Button>
      </div>
    );
  }

  const handleContinue = () => {
    setCurrentPhase(5);
    router.push("/design/review");
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/design/phase-5")}
      >
        {"<- Back to Format Selection"}
      </Button>

      <h1 className="text-2xl font-bold mb-2">Generated Templates</h1>
      <p className="text-muted-foreground mb-6">
        {isStreaming
          ? "Generating delivery templates..."
          : "Review the generated delivery templates. Use the accordion to expand each section."}
      </p>

      {isStreaming && displayContent && (
        <div className="rounded-lg border p-6 bg-card mb-6">
          <StreamingText content={displayContent} isStreaming={true} />
        </div>
      )}

      {!isStreaming && sections.length > 0 && (
        <Accordion type="multiple" className="space-y-2 mb-8">
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
      )}

      {!isStreaming && displayContent && (
        <Button onClick={handleContinue} size="lg">
          Continue to Review & Export
        </Button>
      )}
    </div>
  );
}
