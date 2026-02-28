"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { generateId } from "@/lib/parsers";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_EXTENSIONS = [
  ".md", ".txt",       // text — client-side
  ".pdf",              // PDF — server (pdf-parse)
  ".docx",             // Word — server (mammoth)
  ".pptx",             // PowerPoint — server (officeparser)
  ".xlsx",             // Excel — server (officeparser)
  ".csv",              // CSV — client-side
  ".html", ".htm",     // HTML — client-side (strip tags)
  ".rtf",              // RTF — server (officeparser)
];

/** Extensions handled entirely in the browser (no server round-trip). */
const CLIENT_EXTENSIONS = [".md", ".txt", ".csv", ".html", ".htm"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Strips HTML tags to extract readable text. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function FileUpload() {
  const { uploadedFiles, addUploadedFile, removeUploadedFile } =
    useCurriculumStore();
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `"${file.name}" exceeds the 4 MB limit (${formatFileSize(file.size)}). Try a smaller file.`
        );
        return;
      }

      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError(
          `"${file.name}" is not supported. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}.`
        );
        return;
      }

      // --- Client-side text extraction ---
      if (CLIENT_EXTENSIONS.includes(ext)) {
        let content = await file.text();

        // Strip HTML tags for .html/.htm files
        if (ext === ".html" || ext === ".htm") {
          content = stripHtml(content);
        }

        addUploadedFile({
          id: generateId(),
          name: file.name,
          content,
        });
        return;
      }

      // --- Server-side extraction (PDF, DOCX, PPTX, XLSX, RTF) ---
      setExtracting(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/enhance/extract-text", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Extraction failed");
        }

        const data = await response.json();
        addUploadedFile({
          id: generateId(),
          name: file.name,
          content: data.text,
        });
      } catch (err) {
        setError(
          `Failed to extract text from "${file.name}": ${err instanceof Error ? err.message : "Unknown error"}`
        );
      } finally {
        setExtracting(false);
      }
    },
    [addUploadedFile]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach(processFile);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <Card
        className="border-2 border-dashed cursor-pointer transition-colors hover:border-primary"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <CardContent className="py-10 text-center">
          <div className="text-4xl mb-3">&#x1F4C1;</div>
          <p className="font-medium mb-1">
            {extracting ? "Extracting text..." : "Drop files here or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports .pptx, .pdf, .docx, .xlsx, .csv, .html, .md, .txt, .rtf (max 4 MB each)
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Uploaded Files ({uploadedFiles.length})
          </p>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border px-4 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">&#x1F4C4;</span>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.content.length)} of text
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadedFile(file.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
