import type { ExportFile } from "./markdown";
import type { CurriculumStore } from "@/lib/types/curriculum";

export interface SlideMeta {
  title: string;
  subtitle: string;
  author: string;
  mode: "create" | "enhance";
}

export function buildSlideMeta(state: CurriculumStore): SlideMeta {
  if (state.mode === "enhance") {
    const courseName =
      state.analysisReportStructured?.courseName ?? "Curriculum";
    return {
      title: `${courseName} — Enhancement Report`,
      subtitle: `${state.changes.filter((c) => c.status === "approved").length} approved changes`,
      author: "Dr. Weihao Qu, Ling Zheng — LearnAI Team, CSSE Department, Monmouth University",
      mode: "enhance",
    };
  }

  const topic = state.courseInfo?.topic ?? "Curriculum";
  const audience = state.courseInfo?.audience ?? "";
  const format = state.courseInfo?.format ?? "";
  const subtitleParts = [audience, format].filter(Boolean);

  return {
    title: `${topic} — Curriculum Plan`,
    subtitle: subtitleParts.length
      ? subtitleParts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ")
      : "",
    author: "Dr. Weihao Qu, Ling Zheng — LearnAI Team, CSSE Department, Monmouth University",
    mode: "create",
  };
}

interface Slide {
  type: "title" | "toc" | "divider" | "content" | "end";
  heading: string;
  body: string;
  section?: string;
}

function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (before other transforms to protect contents)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang, code) =>
      `<pre><code class="lang-${lang || "text"}">${escapeHtml(code.trimEnd())}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headers (h3 only — h1/h2 are used for splitting)
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Tables
  html = html.replace(
    /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g,
    (_match, header, body) => {
      const headers = header
        .split("|")
        .filter(Boolean)
        .map((h: string) => `<th>${h.trim()}</th>`)
        .join("");
      const rows = body
        .trim()
        .split("\n")
        .map((row: string) => {
          const cells = row
            .split("|")
            .filter(Boolean)
            .map((c: string) => `<td>${c.trim()}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    }
  );

  // Unordered lists (group consecutive items)
  html = html.replace(
    /(?:^- .+$\n?)+/gm,
    (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }
  );

  // Ordered lists (group consecutive items)
  html = html.replace(
    /(?:^\d+\. .+$\n?)+/gm,
    (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
        .join("");
      return `<ol>${items}</ol>`;
    }
  );

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Paragraphs (wrap remaining plain text lines)
  html = html.replace(
    /^(?!<[hluotp]|<li|<pre|<table|<hr)(.+)$/gm,
    "<p>$1</p>"
  );

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function splitMarkdownToSlides(
  content: string,
  fileName: string
): Slide[] {
  const slides: Slide[] = [];

  // Extract the top-level heading (# ) for section divider
  const h1Match = content.match(/^# (.+)$/m);
  const sectionName = h1Match ? h1Match[1] : fileName.replace(".md", "");

  // Remove the # heading from content before splitting
  const bodyContent = content.replace(/^# .+$/m, "").trim();

  // Add section divider slide
  slides.push({
    type: "divider",
    heading: sectionName,
    body: "",
    section: sectionName,
  });

  // Split on ## headings
  const sections = bodyContent.split(/^(?=## )/m).filter((s) => s.trim());

  for (const section of sections) {
    const headingMatch = section.match(/^## (.+)$/m);
    if (headingMatch) {
      const heading = headingMatch[1];
      const body = section.replace(/^## .+$/m, "").trim();
      slides.push({
        type: "content",
        heading,
        body: markdownToHtml(body),
        section: sectionName,
      });
    } else {
      // Content without a ## heading — put it on a content slide
      slides.push({
        type: "content",
        heading: sectionName,
        body: markdownToHtml(section.trim()),
        section: sectionName,
      });
    }
  }

  return slides;
}

export function buildSlideDeck(
  files: ExportFile[],
  meta: SlideMeta
): string {
  const allSlides: Slide[] = [];

  // 1. Title slide
  allSlides.push({
    type: "title",
    heading: meta.title,
    body: meta.subtitle,
  });

  // 2. Build content slides from files (we need them for TOC)
  const contentSlides: Slide[] = [];
  for (const file of files) {
    contentSlides.push(...splitMarkdownToSlides(file.content, file.name));
  }

  // 3. TOC slide — list section dividers
  const sections = contentSlides
    .filter((s) => s.type === "divider")
    .map((s) => s.heading);

  allSlides.push({
    type: "toc",
    heading: "Table of Contents",
    body: sections
      .map(
        (s, i) =>
          `<li><a href="#" onclick="goToSection('${escapeHtml(s)}');return false;">${i + 1}. ${escapeHtml(s)}</a></li>`
      )
      .join(""),
  });

  // 4. All content slides
  allSlides.push(...contentSlides);

  // 5. End slide
  const totalContent = contentSlides.filter((s) => s.type === "content").length;
  allSlides.push({
    type: "end",
    heading: "End of Presentation",
    body: `${files.length} documents · ${totalContent} content slides · ${sections.length} sections`,
  });

  // Build the HTML
  return renderHtml(allSlides, meta);
}

function renderSlide(slide: Slide, index: number): string {
  const dataSection = slide.section
    ? ` data-section="${escapeHtml(slide.section)}"`
    : "";

  switch (slide.type) {
    case "title":
      return `
    <div class="slide slide-title" data-index="${index}"${dataSection}>
      <div class="slide-inner title-inner">
        <h1>${escapeHtml(slide.heading)}</h1>
        ${slide.body ? `<p class="subtitle">${escapeHtml(slide.body)}</p>` : ""}
        <p class="author">Developed and designed by ${escapeHtml("Dr. Weihao Qu, CSSE Department, Monmouth University")}</p>
      </div>
    </div>`;

    case "toc":
      return `
    <div class="slide slide-toc" data-index="${index}"${dataSection}>
      <div class="slide-inner">
        <h2>${escapeHtml(slide.heading)}</h2>
        <ol class="toc-list">${slide.body}</ol>
      </div>
    </div>`;

    case "divider":
      return `
    <div class="slide slide-divider" data-index="${index}"${dataSection}>
      <div class="slide-inner divider-inner">
        <div class="divider-accent"></div>
        <h2>${escapeHtml(slide.heading)}</h2>
      </div>
    </div>`;

    case "content":
      return `
    <div class="slide slide-content" data-index="${index}"${dataSection}>
      <div class="slide-inner">
        <h2>${escapeHtml(slide.heading)}</h2>
        <div class="slide-body">${slide.body}</div>
      </div>
    </div>`;

    case "end":
      return `
    <div class="slide slide-end" data-index="${index}"${dataSection}>
      <div class="slide-inner divider-inner">
        <h2>${escapeHtml(slide.heading)}</h2>
        <p class="stats">${escapeHtml(slide.body)}</p>
        <p class="author">Developed and designed by ${escapeHtml("Dr. Weihao Qu, CSSE Department, Monmouth University")}</p>
      </div>
    </div>`;
  }
}

function renderHtml(slides: Slide[], meta: SlideMeta): string {
  const slideHtml = slides.map((s, i) => renderSlide(s, i)).join("\n");
  const total = slides.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(meta.title)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f0f0;
    color: #1a1a1a;
    overflow: hidden;
    height: 100vh;
  }

  /* --- Progress bar --- */
  #progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: #2563eb;
    transition: width 0.3s ease;
    z-index: 100;
  }

  /* --- Slide container --- */
  .slide {
    display: none;
    width: 100%;
    height: 100vh;
    justify-content: center;
    align-items: center;
    padding: 60px;
  }
  .slide.active { display: flex; }

  .slide-inner {
    max-width: 960px;
    width: 100%;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  /* --- Title slide --- */
  .title-inner {
    text-align: center;
  }
  .slide-title h1 {
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
    color: #111;
  }
  .slide-title .subtitle {
    font-size: 1.3rem;
    color: #6b7280;
    margin-bottom: 2rem;
  }
  .author {
    font-size: 0.9rem;
    color: #9ca3af;
    margin-top: 2rem;
  }

  /* --- TOC slide --- */
  .toc-list {
    list-style: none;
    padding: 0;
    margin-top: 1.5rem;
  }
  .toc-list li {
    padding: 0.6rem 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 1.15rem;
  }
  .toc-list a {
    color: #2563eb;
    text-decoration: none;
  }
  .toc-list a:hover {
    text-decoration: underline;
  }

  /* --- Divider slide --- */
  .slide-divider, .slide-end {
    background: #fafafa;
  }
  .divider-inner {
    text-align: center;
  }
  .divider-accent {
    width: 80px;
    height: 4px;
    background: #2563eb;
    margin: 0 auto 2rem;
    border-radius: 2px;
  }
  .slide-divider h2 {
    font-size: 2.2rem;
    font-weight: 600;
    color: #111;
  }

  /* --- Content slide --- */
  .slide-content {
    background: #fff;
  }
  .slide-content h2 {
    font-size: 1.6rem;
    font-weight: 600;
    color: #2563eb;
    margin-bottom: 1.2rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
  }
  .slide-body {
    font-size: 1.05rem;
    line-height: 1.7;
  }
  .slide-body h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 1.2rem 0 0.6rem;
  }
  .slide-body p {
    margin-bottom: 0.8rem;
  }
  .slide-body ul, .slide-body ol {
    margin: 0.6rem 0 0.6rem 1.5rem;
  }
  .slide-body li {
    margin-bottom: 0.3rem;
  }
  .slide-body strong {
    color: #111;
  }
  .slide-body em {
    color: #6b7280;
  }
  .slide-body code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.92em;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
  }
  .slide-body pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem 1.2rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.8rem 0;
    font-size: 0.88rem;
    line-height: 1.5;
  }
  .slide-body pre code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }
  .slide-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8rem 0;
    font-size: 0.95rem;
  }
  .slide-body th, .slide-body td {
    border: 1px solid #d1d5db;
    padding: 8px 12px;
    text-align: left;
  }
  .slide-body th {
    background: #f9fafb;
    font-weight: 600;
  }
  .slide-body hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1.2rem 0;
  }

  /* --- End slide --- */
  .slide-end h2 {
    font-size: 2rem;
    font-weight: 600;
    color: #111;
    margin-bottom: 1rem;
  }
  .stats {
    font-size: 1.1rem;
    color: #6b7280;
  }

  /* --- Counter --- */
  #counter {
    position: fixed;
    bottom: 20px;
    right: 30px;
    font-size: 0.85rem;
    color: #9ca3af;
    z-index: 100;
    user-select: none;
  }

  /* --- Nav hint --- */
  #nav-hint {
    position: fixed;
    bottom: 20px;
    left: 30px;
    font-size: 0.85rem;
    color: #d1d5db;
    z-index: 100;
    transition: opacity 1s ease;
    user-select: none;
  }

  /* --- Print --- */
  @media print {
    body { overflow: visible; background: #fff; }
    .slide { display: block !important; page-break-after: always; height: auto; min-height: 100vh; }
    #progress, #counter, #nav-hint { display: none; }
  }
</style>
</head>
<body>

<div id="progress"></div>

${slideHtml}

<div id="counter">1 / ${total}</div>
<div id="nav-hint">\u2190 \u2192  Arrow keys to navigate</div>

<script>
(function() {
  var current = 0;
  var slides = document.querySelectorAll('.slide');
  var total = slides.length;
  var counter = document.getElementById('counter');
  var progress = document.getElementById('progress');
  var navHint = document.getElementById('nav-hint');

  function show(index) {
    if (index < 0 || index >= total) return;
    slides[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    counter.textContent = (current + 1) + ' / ' + total;
    progress.style.width = ((current + 1) / total * 100) + '%';
  }

  // Initialize
  slides[0].classList.add('active');
  progress.style.width = (1 / total * 100) + '%';

  // Fade nav hint after 4 seconds
  setTimeout(function() {
    navHint.style.opacity = '0';
  }, 4000);

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    switch(e.key) {
      case 'ArrowRight':
      case ' ':
      case 'Enter':
        e.preventDefault();
        show(current + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        show(current - 1);
        break;
      case 'Home':
        e.preventDefault();
        show(0);
        break;
      case 'End':
        e.preventDefault();
        show(total - 1);
        break;
    }
  });

  // Click to advance (except on links/buttons)
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    var rect = document.body.getBoundingClientRect();
    if (e.clientX > rect.width / 2) {
      show(current + 1);
    } else {
      show(current - 1);
    }
  });

  // TOC navigation
  window.goToSection = function(name) {
    for (var i = 0; i < total; i++) {
      if (slides[i].dataset.section === name && slides[i].classList.contains('slide-divider')) {
        show(i);
        return;
      }
    }
  };
})();
</script>

</body>
</html>`;
}
