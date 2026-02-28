"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const createPhaseLabels: Record<number, string> = {
  1: "Phase 1: Course Vision",
  2: "Phase 2: Module Design",
  3: "Phase 3: Difficulty",
  4: "Phase 4: Assessments",
  5: "Phase 5: Delivery",
};

const enhancePhaseLabels: Record<number, string> = {
  1: "Step 1: Scope Analysis",
  2: "Step 2: Topic Enhancement",
  3: "Step 3: Slide Plan",
  4: "Step 4: Review & Export",
};

type Category = "bug" | "feature" | "general";

const categories: { value: Category; label: string }[] = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const pathname = usePathname();
  const mode = useCurriculumStore((s) => s.mode);
  const currentPhase = useCurriculumStore((s) => s.currentPhase);
  const enhancePhase = useCurriculumStore((s) => s.enhancePhase);

  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phaseLabel =
    mode === "enhance"
      ? enhancePhaseLabels[enhancePhase] ?? `Step ${enhancePhase}`
      : mode === "create"
        ? createPhaseLabels[currentPhase] ?? `Phase ${currentPhase}`
        : "Landing";

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/curriculum/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          category,
          message: message.trim(),
          mode: mode ?? "none",
          phase: phaseLabel,
          pagePath: pathname,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit feedback");
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        onOpenChange(false);
        // Reset after close animation
        setTimeout(() => {
          setCategory("general");
          setMessage("");
          setEmail("");
          setSubmitted(false);
          setError(null);
        }, 200);
      }, 2000);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve the curriculum designer.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <p className="text-lg font-medium text-green-600">
              Thank you for your feedback!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This dialog will close automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category pills */}
            <div>
              <label className="text-sm font-medium">Category</label>
              <div className="flex gap-2 mt-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                      category === cat.value
                        ? cat.value === "bug"
                          ? "bg-red-100 border-red-300 text-red-700"
                          : cat.value === "feature"
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-gray-100 border-gray-300 text-gray-700"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="feedback-message" className="text-sm font-medium">
                Message <span className="text-destructive">*</span>
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what happened or what you'd like to see..."
                rows={4}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="feedback-email" className="text-sm font-medium">
                Email{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com (optional, for follow-up)"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Context hint */}
            <p className="text-xs text-muted-foreground/70">
              Your current page ({pathname}) and workflow step ({phaseLabel})
              are included automatically.
            </p>
          </div>
        )}

        {!submitted && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !message.trim()}>
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
