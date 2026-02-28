export type CourseArea =
  | "computer-science"
  | "business"
  | "mathematics"
  | "biology"
  | "engineering"
  | "arts-humanities"
  | "social-sciences"
  | "health-sciences"
  | "education"
  | "other";

export interface CourseInfo {
  scope: "full-course" | "single-topic";
  area: CourseArea;
  topic: string;
  audience: "beginners" | "intermediate" | "advanced" | "mixed";
  format: "semester" | "bootcamp" | "workshop" | "self-paced";
  philosophy: "project-based" | "theory-first" | "problem-based" | "hands-on";
}

// --- Topic Landscape types (Phase 1) ---

export interface TrendItem {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  category?: string;
  included: boolean;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: string; // "book" | "course" | "website" | etc.
  description: string;
  url?: string;
  included: boolean;
}

export interface TopicLandscape {
  trends: TrendItem[];
  tools: ToolItem[];
  resources: ResourceItem[];
  industryContext: string;
}

export interface SuggestedModule {
  id: string;
  name: string;
  description: string;
  estimatedDuration: string;
}

// --- Module Interview types (Phase 2) ---

export type PrerequisiteStatus = "include" | "recap" | "skip";

export interface Prerequisite {
  id: string;
  name: string;
  description: string;
  status: PrerequisiteStatus;
}

export type ConceptPriority = "emphasize" | "normal" | "optional";

export interface CoreConcept {
  id: string;
  name: string;
  description: string;
  priority: ConceptPriority;
}

export interface LessonPlanItem {
  id: string;
  title: string;
  description: string;
  teachingApproach: string;
  enabled: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  type: string; // "hands-on" | "interactive" | "group" | "individual"
  enabled: boolean;
}

export interface ModuleLessonPlan {
  lessons: LessonPlanItem[];
  activities: ActivityItem[];
}

// --- Module status ---

export type ModuleStatus =
  // Legacy statuses (still rendered for backward compatibility)
  | "pending"
  | "proposing"
  | "proposed"
  | "approved"
  // Interview flow statuses
  | "interviewing-prereqs"
  | "prereqs-confirmed"
  | "interviewing-concepts"
  | "concepts-confirmed"
  | "interviewing-lessons"
  | "lessons-approved"
  // Shared statuses
  | "generating"
  | "complete";

export interface CurriculumModule {
  name: string;
  description?: string;
  status: ModuleStatus;
  proposal: string | null;
  content: string | null;
  // Interview data (Phase 2 new flow)
  prerequisites: Prerequisite[] | null;
  coreConcepts: CoreConcept[] | null;
  lessonPlan: ModuleLessonPlan | null;
}

export type AssessmentType =
  | "quizzes"
  | "labs"
  | "projects"
  | "written"
  | "peer-reviews"
  | "portfolio";

export type QuestionFormat =
  | "multiple-choice"
  | "short-answer"
  | "true-false"
  | "fill-blank"
  | "poll"
  | "code-analysis"
  | "essay"
  | "matching";

export interface AssessmentConfig {
  type: AssessmentType;
  difficulty: DifficultyLevel | "auto";
  questionFormats: QuestionFormat[];
  questionCount: number;
  perModule: boolean;
  // Category-specific (all optional)
  timeLimitMinutes?: number;
  numberOfAssessments?: number;
  groupWork?: boolean;
  milestones?: number;
  wordCountRange?: string;
  anonymous?: boolean;
  artifactCount?: number;
}

export type DeliveryFormat =
  | "jupyter"
  | "lms"
  | "cheat-sheets"
  | "study-guides"
  | "instructor-notes"
  | "github-repo"
  | "lab-environments"
  | "api-documentation"
  | "lab-protocols"
  | "case-studies"
  | "simulation-scenarios"
  | "problem-sets"
  | "proof-templates"
  | "flashcard-decks";

// --- Slide Plan types (Phase 5, View 1) ---

export type SlideType =
  | "title"
  | "objectives"
  | "concept"
  | "code-example"
  | "exercise"
  | "quiz"
  | "animation"
  | "interactive"
  | "discussion"
  | "summary"
  | "divider";

export interface SlidePlanItem {
  id: string;
  title: string;
  bulletPoints: string[];
  slideType: SlideType;
  enabled: boolean;
  teachingNotes?: string;
  notes?: string;
}

export interface ModuleSlidePlan {
  moduleIndex: number;
  moduleName: string;
  slides: SlidePlanItem[];
}

export type Phase = 0 | 1 | 2 | 3 | 4 | 5;

// --- Difficulty Calibration types (Phase 3) ---

export type DifficultyLevel = "basic" | "intermediate" | "advanced";

export type QuestionType = "short-answer" | "multiple-choice";

export interface DifficultyQuestion {
  id: string;
  level?: DifficultyLevel; // optional — new unlabeled questions omit this
  questionType: QuestionType;
  question: string;
  sampleAnswer: string;
  choices?: string[];
  correctChoice?: string;
}

export interface ModuleDifficultyCalibration {
  moduleIndex: number;
  moduleName: string;
  questions: DifficultyQuestion[]; // 10 items (5 SA + 5 MC, unlabeled)
  assignedLevels: Record<string, DifficultyLevel | null>; // questionId → instructor-assigned level
  selectedLevel: DifficultyLevel | null; // kept for backward compat
}

export interface CurriculumState {
  courseInfo: CourseInfo | null;
  topicLandscape: string | null;
  topicLandscapeStructured: TopicLandscape | null;
  suggestedModules: string | null;
  suggestedModulesStructured: SuggestedModule[] | null;
  modules: CurriculumModule[];
  currentModuleIndex: number;
  difficultyCalibrations: ModuleDifficultyCalibration[];
  selectedAssessmentTypes: AssessmentType[];
  assessmentConfigs: AssessmentConfig[];
  assessmentsContent: string | null;
  slidePlan: ModuleSlidePlan[] | null;
  selectedDeliveryFormats: DeliveryFormat[];
  deliveryContent: string | null;
  currentPhase: Phase;
}

export interface CurriculumActions {
  setCourseInfo: (info: CourseInfo) => void;
  setTopicLandscape: (landscape: string) => void;
  setTopicLandscapeStructured: (landscape: TopicLandscape | null) => void;
  setSuggestedModules: (modules: string) => void;
  setSuggestedModulesStructured: (modules: SuggestedModule[] | null) => void;
  setModules: (modules: CurriculumModule[]) => void;
  updateModule: (index: number, updates: Partial<CurriculumModule>) => void;
  addModule: (module: SuggestedModule) => void;
  removeModule: (id: string) => void;
  reorderModules: (fromIndex: number, toIndex: number) => void;
  updateSuggestedModule: (id: string, updates: Partial<SuggestedModule>) => void;
  setCurrentModuleIndex: (index: number) => void;
  setSelectedAssessmentTypes: (types: AssessmentType[]) => void;
  setAssessmentConfigs: (configs: AssessmentConfig[]) => void;
  upsertAssessmentConfig: (config: AssessmentConfig) => void;
  removeAssessmentConfig: (type: AssessmentType) => void;
  setAssessmentsContent: (content: string) => void;
  setSlidePlan: (plan: ModuleSlidePlan[]) => void;
  updateSlidePlanItem: (
    moduleIndex: number,
    slideId: string,
    updates: Partial<SlidePlanItem>
  ) => void;
  addSlidePlanItem: (moduleIndex: number, slide: SlidePlanItem) => void;
  removeSlidePlanItem: (moduleIndex: number, slideId: string) => void;
  reorderSlidePlanItem: (moduleIndex: number, fromIdx: number, toIdx: number) => void;
  setSelectedDeliveryFormats: (formats: DeliveryFormat[]) => void;
  setDeliveryContent: (content: string) => void;
  setDifficultyCalibrations: (calibrations: ModuleDifficultyCalibration[]) => void;
  updateModuleDifficulty: (moduleIndex: number, level: DifficultyLevel) => void;
  assignQuestionLevel: (moduleIndex: number, questionId: string, level: DifficultyLevel | null) => void;
  toggleLandscapeItem: (category: "trends" | "tools" | "resources", id: string) => void;
  setCurrentPhase: (phase: Phase) => void;
  reset: () => void;
}

// --- Enhance course context (optional, for better AI suggestions) ---

export interface EnhanceCourseContext {
  area: CourseArea;
  audience: CourseInfo["audience"];
  philosophy: CourseInfo["philosophy"];
}

// --- Enhance V2 types (topic-centric flow) ---

export type EnhanceTopicStatus =
  | "pending"
  | "materials-uploaded"
  | "suggestions-generated"
  | "calibrated"
  | "complete";

export interface EnhanceTopicItem {
  id: string;
  name: string;
  description: string;
  weekOrModule: string;
  selected: boolean;
  status: EnhanceTopicStatus;
}

export interface TopicSuggestion {
  id: string;
  category: "new-content" | "exercise" | "interaction" | "animation" | "update";
  title: string;
  description: string;
  selected: boolean;
}

export interface ScopeSuggestion {
  id: string;
  type: "add-topic" | "merge-topics" | "reorder" | "remove-topic" | "update-scope";
  title: string;
  description: string;
  accepted: boolean;
}

export type EnhanceScopeType = "full-curriculum" | "single-topic";

export interface EnhanceTopicDeepDive {
  topicId: string;
  instructorNotes: string;
  uploadedMaterials: UploadedFile[];
  suggestionsRaw: string | null;
  suggestions: TopicSuggestion[];
  calibration: ModuleDifficultyCalibration | null;
}

// --- Enhancement types (Mode A) ---

export type AppMode = "create" | "enhance";

export interface UploadedFile {
  id: string;
  name: string;
  content: string;
}

export type ContentStatus = "current" | "needs-update" | "outdated";

export interface ContentInventoryItem {
  id: string;
  moduleName: string;
  topicsCovered: string[];
  estimatedRecency: string;
  status: ContentStatus;
}

export type GapAction = "include" | "defer" | "skip";

export interface GapItem {
  id: string;
  type: "missing" | "outdated" | "opportunity";
  description: string;
  action: GapAction;
}

export type StrengthAction = "keep" | "de-emphasize";

export interface StrengthItem {
  id: string;
  description: string;
  action: StrengthAction;
}

export interface AnalysisReport {
  courseName: string;
  moduleCount: number;
  format: string;
  depth: string;
  contentInventory: ContentInventoryItem[];
  gaps: GapItem[];
  strengths: StrengthItem[];
}

export type WhatsNewCategory =
  | "recent-developments"
  | "industry-trends"
  | "updated-resources"
  | "pedagogical-updates";

export interface WhatsNewItem {
  id: string;
  title: string;
  summary: string;
  details: string;
  category: WhatsNewCategory;
  selected: boolean;
  expanded: boolean;
}

export type EnhancementCategory =
  | "update-outdated"
  | "add-modules"
  | "refresh-examples"
  | "add-delivery"
  | "enhance-assessments"
  | "add-interactive";

export interface EnhancementProposal {
  id: string;
  category: EnhancementCategory;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  selected: boolean;
}

export type ChangeStatus =
  | "pending"
  | "generating"
  | "generated"
  | "approved"
  | "rejected";

export interface ChangeItem {
  id: string;
  enhancementId: string;
  title: string;
  before?: string;
  after: string;
  status: ChangeStatus;
  feedback?: string;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  category: EnhancementCategory;
  description: string;
}

export interface EnhancementState {
  mode: AppMode;
  uploadedFiles: UploadedFile[];
  analysisReportRaw: string | null;
  analysisReportStructured: AnalysisReport | null;
  whatsNewContent: string | null;
  whatsNewItems: WhatsNewItem[] | null;
  enhancementProposals: EnhancementProposal[];
  changes: ChangeItem[];
  changelog: ChangelogEntry[];
  enhancePhase: Phase;
  // V2 enhance fields
  enhanceScopeType: EnhanceScopeType | null;
  enhanceScopeRaw: string | null;
  enhanceScopeSuggestions: ScopeSuggestion[];
  enhanceTopics: EnhanceTopicItem[];
  enhanceCurrentTopicIndex: number;
  enhanceTopicDeepDives: EnhanceTopicDeepDive[];
  enhanceSlidePlan: ModuleSlidePlan[] | null;
  enhanceCourseContext: EnhanceCourseContext | null;
}

export interface EnhancementActions {
  setMode: (mode: AppMode) => void;
  setUploadedFiles: (files: UploadedFile[]) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  setAnalysisReportRaw: (content: string) => void;
  setAnalysisReportStructured: (report: AnalysisReport | null) => void;
  updateGapAction: (id: string, action: GapAction) => void;
  updateStrengthAction: (id: string, action: StrengthAction) => void;
  addCustomGap: (description: string, type: GapItem["type"]) => void;
  setWhatsNewContent: (content: string) => void;
  setWhatsNewItems: (items: WhatsNewItem[]) => void;
  toggleWhatsNewItemSelection: (id: string) => void;
  toggleWhatsNewItemExpanded: (id: string) => void;
  setEnhancementProposals: (proposals: EnhancementProposal[]) => void;
  toggleProposalSelection: (id: string) => void;
  setChanges: (changes: ChangeItem[]) => void;
  updateChange: (id: string, updates: Partial<ChangeItem>) => void;
  setChangeFeedback: (id: string, feedback: string) => void;
  addChangelogEntry: (entry: ChangelogEntry) => void;
  setChangelog: (entries: ChangelogEntry[]) => void;
  setEnhancePhase: (phase: Phase) => void;
  // V2 enhance actions
  setEnhanceScopeType: (scopeType: EnhanceScopeType) => void;
  setEnhanceScopeRaw: (content: string) => void;
  setEnhanceScopeSuggestions: (suggestions: ScopeSuggestion[]) => void;
  toggleScopeSuggestion: (id: string) => void;
  setEnhanceTopics: (topics: EnhanceTopicItem[]) => void;
  toggleEnhanceTopicSelection: (id: string) => void;
  selectAllEnhanceTopics: () => void;
  deselectAllEnhanceTopics: () => void;
  setEnhanceCurrentTopicIndex: (index: number) => void;
  updateEnhanceTopicStatus: (topicId: string, status: EnhanceTopicStatus) => void;
  setTopicDeepDive: (topicId: string, updates: Partial<EnhanceTopicDeepDive>) => void;
  setTopicInstructorNotes: (topicId: string, notes: string) => void;
  addTopicMaterial: (topicId: string, file: UploadedFile) => void;
  removeTopicMaterial: (topicId: string, fileId: string) => void;
  setTopicSuggestions: (topicId: string, raw: string, suggestions: TopicSuggestion[]) => void;
  toggleTopicSuggestion: (topicId: string, suggestionId: string) => void;
  setTopicCalibration: (topicId: string, calibration: ModuleDifficultyCalibration) => void;
  assignTopicQuestionLevel: (topicId: string, questionId: string, level: DifficultyLevel | null) => void;
  setEnhanceSlidePlan: (plan: ModuleSlidePlan[]) => void;
  updateEnhanceSlidePlanItem: (topicIndex: number, slideId: string, updates: Partial<SlidePlanItem>) => void;
  addEnhanceSlide: (topicIndex: number, slide: SlidePlanItem) => void;
  removeEnhanceSlide: (topicIndex: number, slideId: string) => void;
  reorderEnhanceSlide: (topicIndex: number, fromIdx: number, toIdx: number) => void;
  setEnhanceCourseContext: (ctx: EnhanceCourseContext | null) => void;
}

export type CurriculumStore = CurriculumState &
  CurriculumActions &
  EnhancementState &
  EnhancementActions;
