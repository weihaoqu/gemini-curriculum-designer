"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { apiUrl } from "@/lib/utils";

const features = [
  {
    image: "/illustrations/course-vision.png",
    title: "Course Vision",
    description: "Define your topic, audience, and teaching philosophy. Get AI-powered research on current trends.",
  },
  {
    image: "/illustrations/module-design.png",
    title: "Module Design",
    description: "Build detailed modules with learning objectives, lessons, exercises, and discussion questions.",
  },
  {
    image: "/illustrations/assessments.png",
    title: "Assessments",
    description: "Generate quizzes, labs, projects, peer reviews, and portfolios with complete rubrics.",
  },
  {
    image: "/illustrations/delivery.png",
    title: "Delivery Templates",
    description: "Get slide decks, Jupyter notebooks, LMS packages, video scripts, and GitHub repo structures.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const setMode = useCurriculumStore((s) => s.setMode);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <span className="text-lg font-semibold">Curriculum Designer</span>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Design Complete Curricula
          <br />
          <span className="text-muted-foreground">with AI Assistance</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Create structured, modern curricula with assessments, rubrics, and delivery
          templates. Powered by AI instructional design expertise.
        </p>

        {/* Two-card entry */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg overflow-hidden"
            onClick={() => {
              setMode("create");
              router.push("/design/phase-1");
            }}
          >
            <div className="h-44 bg-gradient-to-b from-muted/50 to-muted/20 flex items-center justify-center p-4 border-b">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={apiUrl("/illustrations/create-new.png")}
                alt="Create New Curriculum"
                className="h-36 w-36 object-contain"
              />
            </div>
            <CardContent className="pt-6 pb-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Create New Curriculum</h3>
              <p className="text-sm text-muted-foreground">
                Build a structured curriculum from scratch with AI-guided research,
                module design, assessments, and delivery templates.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg overflow-hidden"
            onClick={() => {
              setMode("enhance");
              router.push("/design/enhance/step-1");
            }}
          >
            <div className="h-44 bg-gradient-to-b from-muted/50 to-muted/20 flex items-center justify-center p-4 border-b">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={apiUrl("/illustrations/enhance-existing.png")}
                alt="Enhance Existing Curriculum"
                className="h-36 w-36 object-contain"
              />
            </div>
            <CardContent className="pt-6 pb-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Enhance Existing Curriculum</h3>
              <p className="text-sm text-muted-foreground">
                Upload your existing course materials for AI-powered analysis,
                gap identification, and targeted improvements.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center overflow-hidden">
              <div className="h-36 bg-gradient-to-b from-muted/50 to-muted/20 flex items-center justify-center p-3 border-b">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={apiUrl(feature.image)}
                  alt={feature.title}
                  className="h-28 w-28 object-contain"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Attribution */}
      <section className="py-10">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={apiUrl("/learnai-logo.png")}
              alt="LearnAI Team"
              className="h-16"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={apiUrl("/mu-csse-logo.png")}
              alt="Monmouth University CSSE Department"
              className="h-16"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Designed and implemented by Dr. Weihao Qu, Ling Zheng
            <br />
            <span className="text-xs">Supported by LearnAI Team, CSSE Department, Monmouth University</span>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Describe Your Course</h3>
              <p className="text-sm text-muted-foreground">
                Enter your topic, audience level, format, and teaching philosophy — or upload existing materials.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">AI Generates Content</h3>
              <p className="text-sm text-muted-foreground">
                Watch as AI creates modules, assessments, and delivery templates in real-time.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Review & Export</h3>
              <p className="text-sm text-muted-foreground">
                Edit the results, then download everything as Markdown or PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
