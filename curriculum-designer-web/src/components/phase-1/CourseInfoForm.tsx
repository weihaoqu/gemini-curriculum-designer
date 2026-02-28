"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CourseInfo } from "@/lib/types/curriculum";

const courseInfoSchema = z.object({
  scope: z.enum(["full-course", "single-topic"]),
  area: z.enum([
    "computer-science", "business", "mathematics", "biology", "engineering",
    "arts-humanities", "social-sciences", "health-sciences", "education", "other",
  ]),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  audience: z.enum(["beginners", "intermediate", "advanced", "mixed"]),
  format: z.enum(["semester", "bootcamp", "workshop", "self-paced"]),
  philosophy: z.enum(["project-based", "theory-first", "problem-based", "hands-on"]),
});

interface CourseInfoFormProps {
  defaultValues?: CourseInfo | null;
  onSubmit: (data: CourseInfo) => void;
  isLoading: boolean;
}

const areaOptions = [
  { value: "computer-science" as const, label: "Computer Science", description: "Programming, systems, AI" },
  { value: "business" as const, label: "Business", description: "Management, finance, strategy" },
  { value: "mathematics" as const, label: "Mathematics", description: "Calculus, algebra, statistics" },
  { value: "biology" as const, label: "Biology", description: "Life sciences, ecology, genetics" },
  { value: "engineering" as const, label: "Engineering", description: "Mechanical, electrical, civil" },
  { value: "arts-humanities" as const, label: "Arts & Humanities", description: "Literature, philosophy, art" },
  { value: "social-sciences" as const, label: "Social Sciences", description: "Psychology, sociology, politics" },
  { value: "health-sciences" as const, label: "Health Sciences", description: "Nursing, public health, anatomy" },
  { value: "education" as const, label: "Education", description: "Pedagogy, curriculum, training" },
  { value: "other" as const, label: "Other", description: "Interdisciplinary or niche" },
];

const scopeOptions = [
  { value: "single-topic" as const, label: "Single Topic", description: "One week of focused materials" },
  { value: "full-course" as const, label: "Full Course", description: "Complete multi-module course" },
];

const audienceOptions = [
  { value: "beginners" as const, label: "Beginners", description: "No prior knowledge" },
  { value: "intermediate" as const, label: "Intermediate", description: "Some background" },
  { value: "advanced" as const, label: "Advanced", description: "Experienced practitioners" },
  { value: "mixed" as const, label: "Mixed", description: "Multiple levels" },
];

const formatOptions = [
  { value: "semester" as const, label: "Semester", description: "15 weeks" },
  { value: "bootcamp" as const, label: "Bootcamp", description: "4-8 weeks" },
  { value: "workshop" as const, label: "Workshop", description: "Multiple sessions" },
  { value: "self-paced" as const, label: "Self-Paced", description: "Online course" },
];

const philosophyOptions = [
  { value: "project-based" as const, label: "Project-Based", description: "Learn by building" },
  { value: "theory-first" as const, label: "Theory-First", description: "Concepts then application" },
  { value: "problem-based" as const, label: "Problem-Based", description: "Real-world challenges" },
  { value: "hands-on" as const, label: "Hands-On Labs", description: "Guided exercises" },
];

function RadioCardGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  columns,
}: {
  options: { value: T; label: string; description: string }[];
  value: T | undefined;
  onChange: (val: T) => void;
  label: string;
  columns?: number;
}) {
  return (
    <div>
      <Label className="text-sm font-medium mb-3 block">{label}</Label>
      <div className={cn(
        "grid grid-cols-2 gap-3",
        columns === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"
      )}>
        {options.map((option) => (
          <Card
            key={option.value}
            className={cn(
              "cursor-pointer transition-colors",
              value === option.value
                ? "border-primary bg-primary/5"
                : "hover:border-muted-foreground/30"
            )}
            onClick={() => onChange(option.value)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CourseInfoForm({ defaultValues, onSubmit, isLoading }: CourseInfoFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CourseInfo>({
    resolver: zodResolver(courseInfoSchema),
    defaultValues: defaultValues ?? {
      scope: "single-topic",
      area: "computer-science",
      topic: "",
      audience: "beginners",
      format: "semester",
      philosophy: "project-based",
    },
  });

  const scope = watch("scope");
  const area = watch("area");
  const audience = watch("audience");
  const format = watch("format");
  const philosophy = watch("philosophy");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <RadioCardGroup
        label="What scope are you designing for?"
        options={scopeOptions}
        value={scope}
        onChange={(val) => setValue("scope", val)}
      />

      <RadioCardGroup
        label="What discipline or subject area?"
        options={areaOptions}
        value={area}
        onChange={(val) => setValue("area", val)}
        columns={5}
      />

      <div>
        <Label htmlFor="topic" className="text-sm font-medium mb-2 block">
          What is the main topic or subject area?
        </Label>
        <Input
          id="topic"
          placeholder='e.g., "Machine Learning", "Web Development", "Data Structures"'
          {...register("topic")}
          className="max-w-lg"
        />
        {errors.topic && (
          <p className="text-sm text-destructive mt-1">{errors.topic.message}</p>
        )}
      </div>

      <RadioCardGroup
        label="Who is your target audience?"
        options={audienceOptions}
        value={audience}
        onChange={(val) => setValue("audience", val)}
      />

      {scope === "full-course" && (
        <RadioCardGroup
          label="What course format works best?"
          options={formatOptions}
          value={format}
          onChange={(val) => setValue("format", val)}
        />
      )}

      <RadioCardGroup
        label="What's your primary teaching philosophy?"
        options={philosophyOptions}
        value={philosophy}
        onChange={(val) => setValue("philosophy", val)}
      />

      <Button type="submit" disabled={isLoading} size="lg">
        {isLoading ? "Researching..." : "Research This Topic"}
      </Button>
    </form>
  );
}
