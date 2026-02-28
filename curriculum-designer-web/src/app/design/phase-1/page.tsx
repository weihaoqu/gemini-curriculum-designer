"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CourseInfoForm } from "@/components/phase-1/CourseInfoForm";
import { TopicLandscapeView } from "@/components/phase-1/TopicLandscapeView";
import { ModuleListEditor } from "@/components/phase-1/ModuleListEditor";
import { StreamingText } from "@/components/shared/StreamingText";
import { Button } from "@/components/ui/button";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import {
  parseTopicLandscapeJSON,
  parseSuggestedModulesJSON,
  stripJSONBlocks,
} from "@/lib/parsers";
import { apiUrl } from "@/lib/utils";
import type { CourseInfo, CurriculumModule } from "@/lib/types/curriculum";

type Step = "form" | "landscape" | "modules";

export default function Phase1Page() {
  const router = useRouter();
  const {
    courseInfo,
    topicLandscape,
    topicLandscapeStructured,
    suggestedModules,
    suggestedModulesStructured,
    setCourseInfo,
    setTopicLandscape,
    setTopicLandscapeStructured,
    setSuggestedModules,
    setSuggestedModulesStructured,
    setModules,
    setCurrentPhase,
    toggleLandscapeItem,
  } = useCurriculumStore();

  // Auto-detect initial step from existing store data
  const initialStep = useMemo<Step>(() => {
    if (suggestedModulesStructured && suggestedModulesStructured.length > 0)
      return "modules";
    if (topicLandscapeStructured || topicLandscape) return "landscape";
    return "form";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState<Step>(initialStep);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState(topicLandscape ?? "");

  const handleSubmit = useCallback(
    async (data: CourseInfo) => {
      setCourseInfo(data);
      setIsStreaming(true);
      setStreamedContent("");
      setTopicLandscapeStructured(null);
      setSuggestedModulesStructured(null);
      setStep("landscape");

      try {
        const response = await fetch(apiUrl("/api/curriculum/research"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Research failed");

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

        // Try to parse structured JSON blocks
        const landscapeData = parseTopicLandscapeJSON(fullContent);
        const modulesData = parseSuggestedModulesJSON(fullContent);

        // Strip JSON blocks from display markdown
        const cleanContent = stripJSONBlocks(fullContent);

        // Split content into landscape and modules for raw fallback
        const sectionSplit = cleanContent.split(/## SECTION 2:/i);
        const landscape =
          sectionSplit[0]?.replace(/## SECTION 1:\s*/i, "").trim() ??
          cleanContent;
        const modules = sectionSplit[1]?.trim() ?? "";

        setTopicLandscape(landscape);
        setSuggestedModules(modules);
        setStreamedContent(landscape);

        if (landscapeData) {
          setTopicLandscapeStructured(landscapeData);
        }
        if (modulesData) {
          setSuggestedModulesStructured(modulesData);
        }
      } catch (error) {
        console.error("Research error:", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [
      setCourseInfo,
      setTopicLandscape,
      setTopicLandscapeStructured,
      setSuggestedModules,
      setSuggestedModulesStructured,
    ]
  );

  const handleApproveModules = () => {
    const structured = suggestedModulesStructured;

    if (structured && structured.length > 0) {
      const modules: CurriculumModule[] = structured.map((m) => ({
        name: m.name,
        description: m.description,
        status: "pending",
        proposal: null,
        content: null,
        prerequisites: null,
        coreConcepts: null,
        lessonPlan: null,
      }));
      setModules(modules);
      setCurrentPhase(1);
      router.push("/design/phase-2");
      return;
    }

    // Fallback: parse from raw text (legacy path)
    const moduleText = suggestedModules ?? "";
    const lines = moduleText.split("\n");
    const moduleNames: string[] = [];
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*\*?\*?([^*\n-]+)/);
      if (match) {
        let name = match[1].trim();
        name = name.replace(/^Module\s+\d+:\s*/i, "");
        const colonIdx = name.indexOf(":");
        if (colonIdx > 0 && colonIdx < name.length - 1) {
          name = name.substring(0, colonIdx).trim();
        }
        if (name) moduleNames.push(name);
      }
    }

    if (moduleNames.length === 0) {
      alert(
        "Could not parse module names. Please edit the modules or re-generate."
      );
      return;
    }

    const modules: CurriculumModule[] = moduleNames.map((name) => ({
      name,
      status: "pending",
      proposal: null,
      content: null,
      prerequisites: null,
      coreConcepts: null,
      lessonPlan: null,
    }));

    setModules(modules);
    setCurrentPhase(1);
    router.push("/design/phase-2");
  };

  const showStructuredLandscape = !isStreaming && topicLandscapeStructured;
  const showStructuredModules =
    !isStreaming &&
    suggestedModulesStructured &&
    suggestedModulesStructured.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Phase 1: Course Vision</h1>
      <p className="text-muted-foreground mb-8">
        Define your course parameters and let AI research the topic landscape.
      </p>

      {/* Step: Form */}
      {step === "form" && (
        <CourseInfoForm
          defaultValues={courseInfo}
          onSubmit={handleSubmit}
          isLoading={isStreaming}
        />
      )}

      {/* Step: Landscape */}
      {step === "landscape" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Topic Landscape</h2>

            {showStructuredLandscape ? (
              <TopicLandscapeView
                landscape={topicLandscapeStructured}
                onToggle={toggleLandscapeItem}
              />
            ) : (
              <div className="rounded-lg border p-6 bg-card">
                <StreamingText
                  content={streamedContent || topicLandscape || ""}
                  isStreaming={isStreaming}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("form")}
            >
              Back to Course Info
            </Button>
            {!isStreaming && (
              <Button onClick={() => setStep("modules")}>
                Continue to Module Breakdown
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step: Modules */}
      {step === "modules" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Suggested Modules</h2>

            {showStructuredModules ? (
              <ModuleListEditor />
            ) : (
              suggestedModules && (
                <div className="rounded-lg border p-6 bg-card">
                  <StreamingText
                    content={suggestedModules}
                    isStreaming={false}
                  />
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("landscape")}
            >
              Back to Landscape
            </Button>
            <Button onClick={handleApproveModules} size="lg">
              Approve & Continue to Module Design
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
