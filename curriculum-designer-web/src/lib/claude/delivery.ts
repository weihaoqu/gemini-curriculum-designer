import type { CourseInfo, CurriculumModule, DeliveryFormat } from "@/lib/types/curriculum";
import { getAreaLabel } from "@/lib/claude/prompts";

const DELIVERY_LABELS: Record<DeliveryFormat, string> = {
  jupyter: "Jupyter Notebooks (interactive coding lessons)",
  lms: "LMS Package Structure (Canvas/Moodle)",
  "cheat-sheets": "Cheat Sheets (one-page quick reference per module)",
  "study-guides": "Study Guides (exam prep with practice problems)",
  "instructor-notes": "Instructor Notes (teaching guide with timing and tips)",
  "github-repo": "GitHub Repository Structure (code + docs)",
  "lab-environments": "Lab Environments (Docker/VM setups for hands-on practice)",
  "api-documentation": "API Documentation (reference docs and endpoint guides)",
  "lab-protocols": "Lab Protocols (step-by-step experimental procedures)",
  "case-studies": "Case Studies (real-world scenario analyses)",
  "simulation-scenarios": "Simulation Scenarios (interactive business/engineering simulations)",
  "problem-sets": "Problem Sets (graded practice problem collections)",
  "proof-templates": "Proof Templates (structured mathematical proof frameworks)",
  "flashcard-decks": "Flashcard Decks (spaced-repetition review cards)",
};

export function buildDeliveryPrompt(
  courseInfo: CourseInfo,
  modules: CurriculumModule[],
  deliveryFormats: DeliveryFormat[]
): string {
  const moduleList = modules
    .map((m, i) => `${i + 1}. ${m.name}`)
    .join("\n");

  const selectedFormats = deliveryFormats
    .map((f) => `- ${DELIVERY_LABELS[f]}`)
    .join("\n");

  return `I'm creating delivery templates for a ${getAreaLabel(courseInfo.area)} course on "${courseInfo.topic}" for ${courseInfo.audience} students in a ${courseInfo.format} format using a ${courseInfo.philosophy} approach.

**Course Modules:**
${moduleList}

**Selected Delivery Formats:**
${selectedFormats}

Generate complete delivery templates for this course. For each selected format, create a template for Module 1 as an example, then provide structure guidance for remaining modules.

${deliveryFormats.includes("jupyter") ? `
## Jupyter Notebook Template (Module 1)

Create a complete notebook structure for Module 1 with:
- Title and setup cells (markdown + code)
- Section explanations (2-3 paragraphs each)
- Demonstration code cells with comments
- Exercise cells with "YOUR CODE HERE" placeholders
- Hidden solution cells using <details> tags
- Test/assertion cells for self-checking
- Summary table and next steps

Format as a series of markdown and code cell descriptions.
` : ""}

${deliveryFormats.includes("lms") ? `
## LMS Package Structure

Create a complete LMS export structure with:
- Directory tree showing all files
- Module landing page HTML template
- Lesson content HTML template
- Quiz in QTI-compatible format description
- Canvas-specific export structure notes
- Moodle-specific structure notes
` : ""}

${deliveryFormats.includes("cheat-sheets") ? `
## Cheat Sheet Template (Module 1)

Create a one-page quick-reference cheat sheet for Module 1 with:
- Key terms and definitions (table format)
- Essential syntax, commands, or formulas
- Common patterns and their usage
- Quick decision flowchart or comparison table
- "Watch out for" — common mistakes
- At-a-glance summary box

Design for printing on a single page (front and back). Use compact formatting.
` : ""}

${deliveryFormats.includes("study-guides") ? `
## Study Guide Template (Module 1)

Create an exam prep study guide for Module 1 with:
- Learning objectives checklist ("Can I...?" format)
- Concept summaries (2-3 sentences each)
- Key vocabulary with definitions
- Practice problems with worked solutions (3-5 problems, increasing difficulty)
- Mnemonics or memory aids where applicable
- Self-assessment quiz (5 questions with answers)
- "If you're stuck on this, review..." pointers
` : ""}

${deliveryFormats.includes("instructor-notes") ? `
## Instructor Notes Template (Module 1)

Create a teaching guide for Module 1 with:
- Suggested timing breakdown (e.g., "15 min lecture, 10 min demo, 20 min lab")
- Pre-class preparation checklist
- Key points to emphasize (and common student misconceptions)
- Discussion prompts with expected responses
- Live coding / demo scripts with talking points
- Common student questions and answer guidance
- Answer keys for exercises and quizzes
- Differentiation tips (for advanced students / struggling students)
- Transition to next module
` : ""}

${deliveryFormats.includes("github-repo") ? `
## GitHub Repository Structure

Create a complete repo structure with:
- Full directory tree (modules/, labs/, projects/, resources/)
- README.md template with course overview, quick start, prerequisites
- SYLLABUS.md structure
- CONTRIBUTING.md for TAs
- Module README template
- Exercise structure (starter/ and solution/)
- .github/ workflows for autograding
- Issue templates for student questions
` : ""}

${deliveryFormats.includes("lab-environments") ? `
## Lab Environment Setup

Create Docker/VM-based lab environment templates for Module 1 with:
- Dockerfile or docker-compose.yml with all required dependencies
- Environment setup instructions (step-by-step for students)
- Pre-configured IDE settings or Jupyter kernel specifications
- Sample data or starter files included in the container
- Teardown/cleanup instructions
- Troubleshooting guide for common setup issues
` : ""}

${deliveryFormats.includes("api-documentation") ? `
## API Documentation Template

Create reference documentation for Module 1 with:
- Overview and authentication setup
- Endpoint reference with HTTP methods, parameters, and response schemas
- Code examples in 2-3 languages
- Error codes and troubleshooting
- Rate limits and best practices
- Interactive "Try It" section descriptions
` : ""}

${deliveryFormats.includes("lab-protocols") ? `
## Lab Protocol Template (Module 1)

Create a step-by-step experimental lab protocol with:
- Purpose and learning objectives
- Required materials and safety precautions
- Detailed procedure with numbered steps
- Data collection tables/templates
- Expected results and analysis questions
- Post-lab reflection prompts
- Common errors and how to troubleshoot them
` : ""}

${deliveryFormats.includes("case-studies") ? `
## Case Study Template (Module 1)

Create a real-world case study analysis with:
- Company/scenario background (1-2 paragraphs)
- Key data and exhibits (tables, figures described)
- 4-6 discussion questions progressing from comprehension to evaluation
- Teaching notes with suggested answers
- Alternative scenarios for "what-if" analysis
- Connections to course theory and frameworks
` : ""}

${deliveryFormats.includes("simulation-scenarios") ? `
## Simulation Scenario Template (Module 1)

Create an interactive simulation scenario with:
- Scenario setup and context (roles, objectives, constraints)
- Decision points with branching outcomes
- Data inputs and parameters students can adjust
- Expected outcomes for different strategies
- Debrief questions connecting simulation results to theory
- Rubric for evaluating student decisions
` : ""}

${deliveryFormats.includes("problem-sets") ? `
## Problem Set Template (Module 1)

Create a graded problem set with:
- 8-12 problems arranged by increasing difficulty
- Clear problem statements with all necessary information
- Mix of computational, proof-based, and application problems
- Worked example for each problem type
- Complete solution manual with step-by-step work
- Point values and partial credit guidelines
` : ""}

${deliveryFormats.includes("proof-templates") ? `
## Proof Template (Module 1)

Create structured proof frameworks with:
- 3-4 theorems or propositions to prove from Module 1
- Proof skeleton with labeled sections (Given, To Prove, Proof Strategy, Steps, QED)
- Hints for each proof at 3 levels (nudge, outline, detailed)
- Common proof techniques applicable to this module
- Example of a complete proof in the required format
- Grading rubric for mathematical rigor and clarity
` : ""}

${deliveryFormats.includes("flashcard-decks") ? `
## Flashcard Deck Template (Module 1)

Create a spaced-repetition flashcard deck with:
- 20-30 cards covering key terms, concepts, and formulas
- Front: question or prompt; Back: answer with brief explanation
- Tag each card by topic and difficulty
- Include 3-5 "application" cards that require applying concepts
- Include 2-3 "connection" cards linking concepts across topics
- Suggested review schedule (when to review which cards)
` : ""}

## Implementation Roadmap

Provide a prioritized checklist for implementing these delivery materials, with estimated effort for each item.`;
}
