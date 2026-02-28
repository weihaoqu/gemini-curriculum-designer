"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LessonPlanItem, ActivityItem } from "@/lib/types/curriculum";
import { cn } from "@/lib/utils";

interface LessonsStepProps {
  lessons: LessonPlanItem[];
  activities: ActivityItem[];
  onLessonsChange: (lessons: LessonPlanItem[]) => void;
  onActivitiesChange: (activities: ActivityItem[]) => void;
  onApprove: () => void;
  isLoading: boolean;
}

export function LessonsStep({
  lessons,
  activities,
  onLessonsChange,
  onActivitiesChange,
  onApprove,
  isLoading,
}: LessonsStepProps) {
  const toggleLesson = (id: string) => {
    onLessonsChange(
      lessons.map((l) =>
        l.id === id ? { ...l, enabled: !l.enabled } : l
      )
    );
  };

  const toggleActivity = (id: string) => {
    onActivitiesChange(
      activities.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const moveLessonUp = (index: number) => {
    if (index === 0) return;
    const arr = [...lessons];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    onLessonsChange(arr);
  };

  const moveLessonDown = (index: number) => {
    if (index === lessons.length - 1) return;
    const arr = [...lessons];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    onLessonsChange(arr);
  };

  const enabledLessons = lessons.filter((l) => l.enabled).length;
  const enabledActivities = activities.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">
          Step 3: Topics & Activities
        </h3>
        <p className="text-sm text-muted-foreground">
          Toggle topics and activities on/off, reorder topics as needed.
        </p>
      </div>

      {/* Lessons */}
      <div>
        <h4 className="font-medium text-sm mb-2">
          Topics ({enabledLessons} of {lessons.length} enabled)
        </h4>
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <Card
              key={lesson.id}
              className={cn(
                "transition-opacity",
                !lesson.enabled && "opacity-50"
              )}
            >
              <CardContent className="p-3 flex items-center gap-3">
                {/* Reorder arrows */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveLessonUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveLessonDown(index)}
                    disabled={index === lessons.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleLesson(lesson.id)}
                  className={cn(
                    "w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center text-xs",
                    lesson.enabled
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                >
                  {lesson.enabled && "✓"}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{lesson.title}</p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {lesson.teachingApproach}
                    </Badge>
                  </div>
                  {lesson.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lesson.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <h4 className="font-medium text-sm mb-2">
          Activities ({enabledActivities} of {activities.length} enabled)
        </h4>
        <div className="space-y-2">
          {activities.map((activity) => (
            <Card
              key={activity.id}
              className={cn(
                "transition-opacity",
                !activity.enabled && "opacity-50"
              )}
            >
              <CardContent className="p-3 flex items-center gap-3">
                {/* Toggle */}
                <button
                  onClick={() => toggleActivity(activity.id)}
                  className={cn(
                    "w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center text-xs",
                    activity.enabled
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                >
                  {activity.enabled && "✓"}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {activity.type}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button onClick={onApprove} disabled={isLoading || enabledLessons === 0}>
        Approve Plan & Generate Module
      </Button>
    </div>
  );
}
