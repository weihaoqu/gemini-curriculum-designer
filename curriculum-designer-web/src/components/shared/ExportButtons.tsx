"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { buildExportFiles, createMarkdownZip } from "@/lib/export/markdown";
import { buildSlideDeck, buildSlideMeta } from "@/lib/export/slides";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportButtons() {
  const store = useCurriculumStore();
  const [exporting, setExporting] = useState<string | null>(null);

  const files = buildExportFiles(store);
  const hasContent = files.length > 0;

  const handleMarkdownExport = async () => {
    setExporting("md");
    try {
      const blob = await createMarkdownZip(files);
      downloadBlob(blob, "curriculum-markdown.zip");
    } finally {
      setExporting(null);
    }
  };

  const handleSlidesExport = () => {
    setExporting("slides");
    try {
      const meta = buildSlideMeta(store);
      const html = buildSlideDeck(files, meta);
      const blob = new Blob([html], { type: "text/html" });
      const name = store.mode === "enhance"
        ? "enhancement-report-slides.html"
        : "curriculum-slides.html";
      downloadBlob(blob, name);
    } finally {
      setExporting(null);
    }
  };

  const handleSingleFileExport = (filename: string) => {
    const file = files.find((f) => f.name === filename);
    if (!file) return;
    const blob = new Blob([file.content], { type: "text/markdown" });
    downloadBlob(blob, file.name);
  };

  const hasCurriculum = files.some((f) => f.name === "curriculum.md");
  const hasSlidePlan = files.some((f) => f.name === "slide-plan.md");
  const hasDelivery = files.some((f) => f.name === "delivery-plan.md");

  return (
    <div className="flex flex-wrap gap-2">
      {hasCurriculum && (
        <Button
          onClick={() => handleSingleFileExport("curriculum.md")}
          disabled={exporting !== null}
          variant="outline"
          size="sm"
        >
          Course Plan (.md)
        </Button>
      )}
      {hasSlidePlan && (
        <Button
          onClick={() => handleSingleFileExport("slide-plan.md")}
          disabled={exporting !== null}
          variant="outline"
          size="sm"
        >
          Slide Plan (.md)
        </Button>
      )}
      {hasDelivery && (
        <Button
          onClick={() => handleSingleFileExport("delivery-plan.md")}
          disabled={exporting !== null}
          variant="outline"
          size="sm"
        >
          Teaching Notes (.md)
        </Button>
      )}
      <Button
        onClick={handleMarkdownExport}
        disabled={!hasContent || exporting !== null}
        variant="outline"
        size="sm"
      >
        {exporting === "md" ? "Exporting..." : "All Files (.zip)"}
      </Button>
      <Button
        onClick={handleSlidesExport}
        disabled={!hasContent || exporting !== null}
        size="sm"
      >
        {exporting === "slides" ? "Exporting..." : "Slides (.html)"}
      </Button>
    </div>
  );
}
