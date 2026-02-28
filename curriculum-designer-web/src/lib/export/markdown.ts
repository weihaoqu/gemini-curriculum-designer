import JSZip from "jszip";
import type { CurriculumStore } from "@/lib/types/curriculum";

export interface ExportFile {
  name: string;
  content: string;
}

export function buildExportFiles(state: CurriculumStore): ExportFile[] {
  if (state.mode === "enhance") {
    return buildEnhanceExportFiles(state);
  }
  return buildCreateExportFiles(state);
}

function buildCreateExportFiles(state: CurriculumStore): ExportFile[] {
  const files: ExportFile[] = [];
  const topic = state.courseInfo?.topic ?? "curriculum";

  // Curriculum document (all modules combined)
  const moduleContents = state.modules
    .filter((m) => m.content)
    .map((m) => m.content)
    .join("\n\n---\n\n");

  if (moduleContents) {
    const header = `# ${topic} - Curriculum\n\n`;
    files.push({
      name: "curriculum.md",
      content: header + moduleContents,
    });
  }

  // Topic landscape / research — prefer structured data (only included items)
  if (state.topicLandscapeStructured) {
    const ls = state.topicLandscapeStructured;
    let content = `# ${topic} - Topic Landscape & Resources\n\n`;

    const includedTrends = ls.trends.filter((t) => t.included);
    if (includedTrends.length > 0) {
      content += `## Current Trends\n`;
      for (const t of includedTrends) {
        content += `- **${t.name}**: ${t.description}\n`;
      }
      content += `\n`;
    }

    const includedTools = ls.tools.filter((t) => t.included);
    if (includedTools.length > 0) {
      content += `## Essential Tools & Technologies\n`;
      for (const t of includedTools) {
        content += `- **${t.name}**${t.category ? ` (${t.category})` : ""}: ${t.description}\n`;
      }
      content += `\n`;
    }

    const includedResources = ls.resources.filter((r) => r.included);
    if (includedResources.length > 0) {
      content += `## Recommended Resources\n`;
      for (const r of includedResources) {
        content += `- **${r.title}** [${r.type}]: ${r.description}\n`;
      }
      content += `\n`;
    }

    if (ls.industryContext) {
      content += `## Industry Context\n${ls.industryContext}\n`;
    }

    files.push({ name: "resources.md", content });
  } else if (state.topicLandscape) {
    // Fallback to raw markdown
    files.push({
      name: "resources.md",
      content: `# ${topic} - Topic Landscape & Resources\n\n${state.topicLandscape}`,
    });
  }

  // Assessments
  if (state.assessmentsContent) {
    files.push({
      name: "assessments.md",
      content: `# ${topic} - Assessments\n\n${state.assessmentsContent}`,
    });
  }

  // Slide plan
  if (state.slidePlan) {
    let content = `# ${topic} - Slide Plan\n\n`;
    for (const mp of state.slidePlan) {
      content += `## Module ${mp.moduleIndex + 1}: ${mp.moduleName}\n\n`;
      for (const slide of mp.slides) {
        const status = slide.enabled ? "" : " ~~(excluded)~~";
        content += `### [${slide.slideType.toUpperCase()}] ${slide.title}${status}\n`;
        for (const bp of slide.bulletPoints) {
          content += `- ${bp}\n`;
        }
        if (slide.teachingNotes) {
          content += `\n> **Instructor:** ${slide.teachingNotes}\n`;
        }
        if (slide.notes) {
          content += `\n> ${slide.notes}\n`;
        }
        content += `\n`;
      }
    }
    files.push({ name: "slide-plan.md", content });
  }

  // Delivery plan
  if (state.deliveryContent) {
    files.push({
      name: "delivery-plan.md",
      content: `# ${topic} - Delivery Plan\n\n${state.deliveryContent}`,
    });
  }

  return files;
}

function buildEnhanceExportFiles(state: CurriculumStore): ExportFile[] {
  const files: ExportFile[] = [];
  const courseName = "Curriculum Enhancement";

  // Scope analysis
  if (state.enhanceScopeRaw) {
    let content = `# ${courseName} - Scope Analysis\n\n${state.enhanceScopeRaw}\n`;

    // Accepted scope suggestions
    const accepted = state.enhanceScopeSuggestions.filter((s) => s.accepted);
    if (accepted.length > 0) {
      content += `\n## Accepted Scope Changes\n\n`;
      for (const s of accepted) {
        content += `- **[${s.type}] ${s.title}**: ${s.description}\n`;
      }
    }

    files.push({ name: "scope-analysis.md", content });
  }

  // Per-topic enhancements
  const selectedTopics = state.enhanceTopics.filter((t) => t.selected);
  if (selectedTopics.length > 0) {
    let content = `# ${courseName} - Topic Enhancements\n\n`;

    for (const topic of selectedTopics) {
      const dd = state.enhanceTopicDeepDives.find((d) => d.topicId === topic.id);
      const selectedSuggestions = dd?.suggestions.filter((s) => s.selected) ?? [];

      if (selectedSuggestions.length === 0 && !dd?.calibration) continue;

      content += `## ${topic.weekOrModule}: ${topic.name}\n\n`;
      content += `${topic.description}\n\n`;

      if (selectedSuggestions.length > 0) {
        content += `### Selected Enhancements\n\n`;
        for (const s of selectedSuggestions) {
          content += `- **[${s.category}] ${s.title}**: ${s.description}\n`;
        }
        content += `\n`;
      }

      // Calibration summary
      if (dd?.calibration) {
        const counts = { basic: 0, intermediate: 0, advanced: 0 };
        for (const q of dd.calibration.questions) {
          const level = dd.calibration.assignedLevels?.[q.id] as "basic" | "intermediate" | "advanced" | null;
          if (level && level in counts) counts[level]++;
        }
        if (counts.basic + counts.intermediate + counts.advanced > 0) {
          content += `### Difficulty Calibration\n\n`;
          content += `- Basic: ${counts.basic} questions\n`;
          content += `- Intermediate: ${counts.intermediate} questions\n`;
          content += `- Advanced: ${counts.advanced} questions\n\n`;
        }
      }

      content += `---\n\n`;
    }

    files.push({ name: "topic-enhancements.md", content });
  }

  // Slide plan
  if (state.enhanceSlidePlan) {
    let content = `# ${courseName} - Slide Plan\n\n`;
    for (const mp of state.enhanceSlidePlan) {
      content += `## Topic ${mp.moduleIndex + 1}: ${mp.moduleName}\n\n`;
      for (const slide of mp.slides) {
        const status = slide.enabled ? "" : " ~~(excluded)~~";
        content += `### [${slide.slideType.toUpperCase()}] ${slide.title}${status}\n`;
        for (const bp of slide.bulletPoints) {
          content += `- ${bp}\n`;
        }
        if (slide.teachingNotes) {
          content += `\n> **Instructor:** ${slide.teachingNotes}\n`;
        }
        if (slide.notes) {
          content += `\n> ${slide.notes}\n`;
        }
        content += `\n`;
      }
    }
    files.push({ name: "slide-plan.md", content });
  }

  // Legacy: keep old enhance export files if they have data
  if (state.analysisReportRaw) {
    files.push({
      name: "analysis-report.md",
      content: `# Analysis Report\n\n${state.analysisReportRaw}`,
    });
  }

  return files;
}

export async function createMarkdownZip(
  files: ExportFile[]
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder("curriculum");

  for (const file of files) {
    folder?.file(file.name, file.content);
  }

  return zip.generateAsync({ type: "blob" });
}
