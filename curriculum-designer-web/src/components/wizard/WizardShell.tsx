"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PhaseIndicator } from "./PhaseIndicator";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";
import { apiUrl } from "@/lib/utils";

export function WizardShell({ children }: { children: React.ReactNode }) {
  const reset = useCurriculumStore((s) => s.reset);
  const mode = useCurriculumStore((s) => s.mode);
  const courseInfo = useCurriculumStore((s) => s.courseInfo);
  const analysisReport = useCurriculumStore((s) => s.analysisReportStructured);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const contextLabel = mode === "enhance"
    ? analysisReport?.courseName
    : courseInfo?.topic;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-16 flex-col border-r bg-card md:w-64">
        <div className="flex h-14 items-center px-3 md:px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">&#x1F393;</span>
            <span className="hidden md:inline text-sm">Curriculum Designer</span>
          </Link>
        </div>
        <Separator />
        <div className="flex-1 px-2 py-4 md:px-3">
          <p className="mb-3 hidden px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:block">
            {mode === "enhance" ? "Enhancement Steps" : "Phases"}
          </p>
          <PhaseIndicator />
        </div>
        {contextLabel && (
          <>
            <Separator />
            <div className="hidden p-4 md:block">
              <p className="text-xs text-muted-foreground mb-1">
                {mode === "enhance" ? "Course" : "Topic"}
              </p>
              <p className="text-sm font-medium truncate">{contextLabel}</p>
            </div>
          </>
        )}
        <Separator />
        <div className="p-2 md:p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {
              if (confirm("Start over? All progress will be lost.")) {
                reset();
                window.location.href = apiUrl("/");
              }
            }}
          >
            <span className="hidden md:inline">Start Over</span>
            <span className="md:hidden">&#x21BB;</span>
          </Button>
        </div>
        <div className="p-2 md:p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={() => setFeedbackOpen(true)}
            title="Send feedback — report bugs, request features, or share ideas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden md:inline">Send Feedback</span>
            <span className="md:hidden">&#x1F4AC;</span>
          </Button>
        </div>
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
        <div className="hidden md:flex flex-col items-center gap-2 px-3 pb-3">
          <div className="flex items-center gap-3">
            <Image
              src="/learnai-logo.png"
              alt="LearnAI Team"
              width={56}
              height={28}
              className="opacity-60"
            />
            <Image
              src="/mu-csse-logo.png"
              alt="Monmouth University CSSE Department"
              width={56}
              height={28}
              className="opacity-60"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center leading-tight">
            Dr. Weihao Qu, Ling Zheng
            <br />
            Supported by LearnAI Team
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
