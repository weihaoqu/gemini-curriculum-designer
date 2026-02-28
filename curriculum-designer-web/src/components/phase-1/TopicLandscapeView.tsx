"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopicLandscape } from "@/lib/types/curriculum";

interface TopicLandscapeViewProps {
  landscape: TopicLandscape;
  onToggle?: (category: "trends" | "tools" | "resources", id: string) => void;
  readOnly?: boolean;
}

function IncludeBadge({
  included,
  onClick,
  readOnly,
}: {
  included: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}) {
  return (
    <Badge
      variant={included ? "default" : "outline"}
      className={`text-xs shrink-0 ${
        !readOnly ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : ""
      } ${!included ? "opacity-60" : ""}`}
      title={
        readOnly
          ? included
            ? "Included"
            : "Skipped"
          : included
            ? "Included — click to skip"
            : "Skipped — click to include"
      }
      onClick={
        !readOnly && onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      {included ? "include" : "skip"}
    </Badge>
  );
}

export function TopicLandscapeView({
  landscape,
  onToggle,
  readOnly,
}: TopicLandscapeViewProps) {
  const trendCount = landscape.trends.filter((t) => t.included).length;
  const toolCount = landscape.tools.filter((t) => t.included).length;
  const resourceCount = landscape.resources.filter((r) => r.included).length;

  const interactive = !readOnly && !!onToggle;

  return (
    <Accordion
      type="multiple"
      defaultValue={["trends", "tools", "resources", "industry"]}
      className="space-y-3"
    >
      {/* Trends */}
      <AccordionItem value="trends" className="border rounded-lg px-4">
        <AccordionTrigger className="text-base font-semibold">
          Current Trends ({trendCount} of {landscape.trends.length} included)
        </AccordionTrigger>
        <AccordionContent>
          {interactive && (
            <p className="text-xs text-muted-foreground mb-3">
              Items are skipped by default. Click the badge to include items
              you want in your curriculum.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {landscape.trends.map((trend) => (
              <Card
                key={trend.id}
                className={`bg-muted/30 transition-all ${
                  !trend.included ? "opacity-50" : ""
                } ${interactive ? "hover:ring-2 hover:ring-primary/30" : ""}`}
                title={
                  interactive
                    ? trend.included
                      ? "Included — click badge to skip"
                      : "Skipped — click badge to include"
                    : undefined
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{trend.name}</p>
                    <IncludeBadge
                      included={trend.included}
                      readOnly={readOnly}
                      onClick={() => onToggle?.("trends", trend.id)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {trend.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Tools & Technologies */}
      <AccordionItem value="tools" className="border rounded-lg px-4">
        <AccordionTrigger className="text-base font-semibold">
          Essential Tools & Technologies ({toolCount} of{" "}
          {landscape.tools.length} included)
        </AccordionTrigger>
        <AccordionContent>
          {interactive && (
            <p className="text-xs text-muted-foreground mb-3">
              Items are skipped by default. Click the badge to include items
              you want in your curriculum.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {landscape.tools.map((tool) => (
              <Card
                key={tool.id}
                className={`bg-muted/30 transition-all ${
                  !tool.included ? "opacity-50" : ""
                } ${interactive ? "hover:ring-2 hover:ring-primary/30" : ""}`}
                title={
                  interactive
                    ? tool.included
                      ? "Included — click badge to skip"
                      : "Skipped — click badge to include"
                    : undefined
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{tool.name}</p>
                      {tool.category && (
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                      )}
                    </div>
                    <IncludeBadge
                      included={tool.included}
                      readOnly={readOnly}
                      onClick={() => onToggle?.("tools", tool.id)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Resources */}
      <AccordionItem value="resources" className="border rounded-lg px-4">
        <AccordionTrigger className="text-base font-semibold">
          Recommended Resources ({resourceCount} of{" "}
          {landscape.resources.length} included)
        </AccordionTrigger>
        <AccordionContent>
          {interactive && (
            <p className="text-xs text-muted-foreground mb-3">
              Items are skipped by default. Click the badge to include items
              you want in your curriculum.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {landscape.resources.map((resource) => (
              <Card
                key={resource.id}
                className={`bg-muted/30 transition-all ${
                  !resource.included ? "opacity-50" : ""
                } ${interactive ? "hover:ring-2 hover:ring-primary/30" : ""}`}
                title={
                  interactive
                    ? resource.included
                      ? "Included — click badge to skip"
                      : "Skipped — click badge to include"
                    : undefined
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{resource.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {resource.type}
                      </Badge>
                    </div>
                    <IncludeBadge
                      included={resource.included}
                      readOnly={readOnly}
                      onClick={() => onToggle?.("resources", resource.id)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resource.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Industry Context */}
      {landscape.industryContext && (
        <AccordionItem value="industry" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">
            Industry Context
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {landscape.industryContext.split("\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
