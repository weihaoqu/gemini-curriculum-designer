import type {
  TopicLandscape,
  SuggestedModule,
  AnalysisReport,
  ChangeItem,
  WhatsNewItem,
  WhatsNewCategory,
  ScopeSuggestion,
  EnhanceTopicItem,
  TopicSuggestion,
} from "@/lib/types/curriculum";

let counter = 0;

export function generateId(): string {
  counter++;
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Extract a tagged JSON block from the AI response.
 * Looks for ```json-<tag>\n{...}\n``` and parses the contents.
 */
function extractJSONBlock(content: string, tag: string): unknown | null {
  // Try fenced code block first: ```json-tag ... ```
  const fenceRegex = new RegExp(
    "```json-" + tag + "\\s*\\n([\\s\\S]*?)\\n```",
    "i"
  );
  const fenceMatch = content.match(fenceRegex);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      return null;
    }
  }

  // Fallback: try bare JSON after a marker comment
  const markerRegex = new RegExp(
    "<!--\\s*json-" + tag + "\\s*-->\\s*([\\s\\S]*?)(?:<!--|$)",
    "i"
  );
  const markerMatch = content.match(markerRegex);
  if (markerMatch?.[1]) {
    try {
      return JSON.parse(markerMatch[1].trim());
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Parse the structured topic landscape from the AI response.
 * Returns null if JSON block is missing or malformed (graceful degradation).
 */
export function parseTopicLandscapeJSON(
  fullContent: string
): TopicLandscape | null {
  const raw = extractJSONBlock(fullContent, "landscape") as Record<
    string,
    unknown
  > | null;
  if (!raw) return null;

  try {
    const trends = Array.isArray(raw.trends)
      ? raw.trends.map((t: Record<string, string>) => ({
          id: generateId(),
          name: t.name ?? "",
          description: t.description ?? "",
          included: false,
        }))
      : [];

    const tools = Array.isArray(raw.tools)
      ? raw.tools.map((t: Record<string, string>) => ({
          id: generateId(),
          name: t.name ?? "",
          description: t.description ?? "",
          category: t.category,
          included: false,
        }))
      : [];

    const resources = Array.isArray(raw.resources)
      ? raw.resources.map((r: Record<string, string>) => ({
          id: generateId(),
          title: r.title ?? "",
          type: r.type ?? "resource",
          description: r.description ?? "",
          url: r.url,
          included: false,
        }))
      : [];

    const industryContext =
      typeof raw.industryContext === "string" ? raw.industryContext : "";

    return { trends, tools, resources, industryContext };
  } catch {
    return null;
  }
}

/**
 * Parse the structured suggested modules from the AI response.
 * Returns null if JSON block is missing or malformed.
 */
export function parseSuggestedModulesJSON(
  fullContent: string
): SuggestedModule[] | null {
  const raw = extractJSONBlock(fullContent, "modules");
  if (!Array.isArray(raw)) return null;

  try {
    return raw.map((m: Record<string, string>) => ({
      id: generateId(),
      name: m.name ?? "",
      description: m.description ?? "",
      estimatedDuration: m.estimatedDuration ?? "",
    }));
  } catch {
    return null;
  }
}

/**
 * Parse the structured analysis report from the AI response.
 * Returns null if JSON block is missing or malformed.
 */
export function parseAnalysisReportJSON(
  fullContent: string
): AnalysisReport | null {
  const raw = extractJSONBlock(fullContent, "analysis") as Record<
    string,
    unknown
  > | null;
  if (!raw) return null;

  try {
    const contentInventory = Array.isArray(raw.contentInventory)
      ? raw.contentInventory.map(
          (item: Record<string, unknown>) => ({
            id: generateId(),
            moduleName: (item.moduleName as string) ?? "",
            topicsCovered: Array.isArray(item.topicsCovered)
              ? (item.topicsCovered as string[])
              : [],
            estimatedRecency: (item.estimatedRecency as string) ?? "",
            status: ((item.status as string) ?? "needs-update") as AnalysisReport["contentInventory"][number]["status"],
          })
        )
      : [];

    const gaps = Array.isArray(raw.gaps)
      ? raw.gaps.map((g: Record<string, string>) => ({
          id: generateId(),
          type: (g.type ?? "opportunity") as AnalysisReport["gaps"][number]["type"],
          description: g.description ?? "",
          action: "include" as const,
        }))
      : [];

    const strengths = Array.isArray(raw.strengths)
      ? raw.strengths.map((s: Record<string, string>) => ({
          id: generateId(),
          description: s.description ?? "",
          action: "keep" as const,
        }))
      : [];

    return {
      courseName: (raw.courseName as string) ?? "",
      moduleCount:
        typeof raw.moduleCount === "number" ? raw.moduleCount : contentInventory.length,
      format: (raw.format as string) ?? "",
      depth: (raw.depth as string) ?? "",
      contentInventory,
      gaps,
      strengths,
    };
  } catch {
    return null;
  }
}

/**
 * Parse a change item from the AI response.
 * Returns null if JSON block is missing or malformed.
 */
export function parseChangeJSON(
  fullContent: string,
  enhancementId: string
): Omit<ChangeItem, "status"> | null {
  const raw = extractJSONBlock(fullContent, "change") as Record<
    string,
    unknown
  > | null;
  if (!raw) return null;

  try {
    return {
      id: generateId(),
      enhancementId,
      title: (raw.title as string) ?? "",
      before: raw.before ? (raw.before as string) : undefined,
      after: (raw.after as string) ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Parse the structured What's New items from the AI response.
 * Returns null if JSON block is missing or malformed.
 */
const VALID_WHATSNEW_CATEGORIES: WhatsNewCategory[] = [
  "recent-developments",
  "industry-trends",
  "updated-resources",
  "pedagogical-updates",
];

export function parseWhatsNewJSON(
  fullContent: string
): WhatsNewItem[] | null {
  const raw = extractJSONBlock(fullContent, "whatsnew");
  if (!Array.isArray(raw)) return null;

  try {
    return raw.map((item: Record<string, unknown>) => ({
      id: generateId(),
      title: (item.title as string) ?? "",
      summary: (item.summary as string) ?? "",
      details: (item.details as string) ?? "",
      category: VALID_WHATSNEW_CATEGORIES.includes(
        item.category as WhatsNewCategory
      )
        ? (item.category as WhatsNewCategory)
        : "recent-developments",
      selected: true,
      expanded: false,
    }));
  } catch {
    return null;
  }
}

/**
 * Parse the scope analysis JSON block from the AI response.
 * Returns topics and scope suggestions, or null if missing/malformed.
 */
export function parseScopeJSON(
  fullContent: string
): {
  courseName: string;
  currentScope: string;
  topics: EnhanceTopicItem[];
  scopeSuggestions: ScopeSuggestion[];
} | null {
  const raw = extractJSONBlock(fullContent, "scope") as Record<string, unknown> | null;
  if (!raw) return null;

  try {
    const topics = Array.isArray(raw.topics)
      ? raw.topics.map((t: Record<string, string>) => ({
          id: generateId(),
          name: t.name ?? "",
          description: t.description ?? "",
          weekOrModule: t.weekOrModule ?? "",
          selected: true,
          status: "pending" as const,
        }))
      : [];

    const validTypes = ["add-topic", "merge-topics", "reorder", "remove-topic", "update-scope"];
    const scopeSuggestions = Array.isArray(raw.scopeSuggestions)
      ? raw.scopeSuggestions.map((s: Record<string, string>) => ({
          id: generateId(),
          type: (validTypes.includes(s.type) ? s.type : "update-scope") as ScopeSuggestion["type"],
          title: s.title ?? "",
          description: s.description ?? "",
          accepted: false,
        }))
      : [];

    return {
      courseName: (raw.courseName as string) ?? "",
      currentScope: (raw.currentScope as string) ?? "",
      topics,
      scopeSuggestions,
    };
  } catch {
    return null;
  }
}

/**
 * Parse per-topic suggestions JSON block from the AI response.
 */
export function parseTopicSuggestionsJSON(
  fullContent: string
): TopicSuggestion[] | null {
  const raw = extractJSONBlock(fullContent, "topic-suggestions");
  if (!Array.isArray(raw)) return null;

  try {
    const validCategories = ["new-content", "exercise", "interaction", "animation", "update"];
    return raw.map((item: Record<string, string>) => ({
      id: generateId(),
      category: (validCategories.includes(item.category) ? item.category : "update") as TopicSuggestion["category"],
      title: item.title ?? "",
      description: item.description ?? "",
      selected: true,
    }));
  } catch {
    return null;
  }
}

/**
 * Remove JSON blocks from the display markdown so they don't clutter the view.
 */
export function stripJSONBlocks(content: string): string {
  return content
    .replace(/```json-landscape\s*\n[\s\S]*?\n```/gi, "")
    .replace(/```json-modules\s*\n[\s\S]*?\n```/gi, "")
    .replace(/```json-analysis\s*\n[\s\S]*?\n```/gi, "")
    .replace(/```json-change\s*\n[\s\S]*?\n```/gi, "")
    .replace(/```json-whatsnew\s*\n[\s\S]*?\n```/gi, "")
    .replace(/```json-scope\s*\n[\s\S]*?\n```/gi, "")
    .replace(/```json-topic-suggestions\s*\n[\s\S]*?\n```/gi, "")
    .replace(/<!--\s*json-landscape\s*-->[\s\S]*?(?:<!--|$)/gi, "")
    .replace(/<!--\s*json-modules\s*-->[\s\S]*?(?:<!--|$)/gi, "")
    .trim();
}
