import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CurriculumStore,
  CurriculumState,
  CourseInfo,
  SuggestedModule,
  CurriculumModule,
  ModuleDifficultyCalibration,
  ModuleSlidePlan,
  SlidePlanItem,
  DifficultyLevel,
  AssessmentType,
  AssessmentConfig,
  EnhancementState,
  UploadedFile,
  AnalysisReport,
  EnhancementProposal,
  ChangeItem,
  ChangelogEntry,
  Phase,
  GapAction,
  StrengthAction,
  WhatsNewItem,
  TopicLandscape,
  DeliveryFormat,
  ScopeSuggestion,
  EnhanceTopicItem,
  EnhanceTopicStatus,
  TopicSuggestion,
  EnhanceTopicDeepDive,
  EnhanceScopeType,
  EnhanceCourseContext,
} from "@/lib/types/curriculum";
import { generateId } from "@/lib/parsers";

const initialCreateState: CurriculumState = {
  courseInfo: null,
  topicLandscape: null,
  topicLandscapeStructured: null,
  suggestedModules: null,
  suggestedModulesStructured: null,
  modules: [],
  currentModuleIndex: 0,
  difficultyCalibrations: [],
  selectedAssessmentTypes: [],
  assessmentConfigs: [],
  assessmentsContent: null,
  slidePlan: null,
  selectedDeliveryFormats: [],
  deliveryContent: null,
  currentPhase: 0,
};

const initialEnhanceState: EnhancementState = {
  mode: "create",
  uploadedFiles: [],
  analysisReportRaw: null,
  analysisReportStructured: null,
  whatsNewContent: null,
  whatsNewItems: null,
  enhancementProposals: [],
  changes: [],
  changelog: [],
  enhancePhase: 0,
  // V2 enhance fields
  enhanceScopeType: null,
  enhanceScopeRaw: null,
  enhanceScopeSuggestions: [],
  enhanceTopics: [],
  enhanceCurrentTopicIndex: 0,
  enhanceTopicDeepDives: [],
  enhanceSlidePlan: null,
  enhanceCourseContext: null,
};

const initialState = { ...initialCreateState, ...initialEnhanceState };

// Migrate old module shape to new (add missing fields)
function migrateModule(m: CurriculumModule): CurriculumModule {
  return {
    name: m.name,
    description: m.description ?? undefined,
    status: m.status,
    proposal: m.proposal ?? null,
    content: m.content ?? null,
    prerequisites: m.prerequisites ?? null,
    coreConcepts: m.coreConcepts ?? null,
    lessonPlan: m.lessonPlan ?? null,
  };
}

export const useCurriculumStore = create<CurriculumStore>()(
  persist(
    (set) => ({
      ...initialState,

      // --- Create mode actions ---
      setCourseInfo: (info) => set({ courseInfo: info }),
      setTopicLandscape: (landscape) => set({ topicLandscape: landscape }),
      setTopicLandscapeStructured: (landscape) =>
        set({ topicLandscapeStructured: landscape }),
      setSuggestedModules: (modules) => set({ suggestedModules: modules }),
      setSuggestedModulesStructured: (modules) =>
        set({ suggestedModulesStructured: modules }),
      setModules: (modules) => set({ modules }),
      updateModule: (index, updates) =>
        set((state) => ({
          modules: state.modules.map((m, i) =>
            i === index ? { ...m, ...updates } : m
          ),
        })),

      addModule: (module: SuggestedModule) =>
        set((state) => ({
          suggestedModulesStructured: [
            ...(state.suggestedModulesStructured ?? []),
            module,
          ],
        })),

      removeModule: (id: string) =>
        set((state) => ({
          suggestedModulesStructured: (
            state.suggestedModulesStructured ?? []
          ).filter((m) => m.id !== id),
        })),

      reorderModules: (fromIndex: number, toIndex: number) =>
        set((state) => {
          const arr = [...(state.suggestedModulesStructured ?? [])];
          const [item] = arr.splice(fromIndex, 1);
          arr.splice(toIndex, 0, item);
          return { suggestedModulesStructured: arr };
        }),

      updateSuggestedModule: (id: string, updates: Partial<SuggestedModule>) =>
        set((state) => ({
          suggestedModulesStructured: (
            state.suggestedModulesStructured ?? []
          ).map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      setCurrentModuleIndex: (index) => set({ currentModuleIndex: index }),
      setDifficultyCalibrations: (calibrations: ModuleDifficultyCalibration[]) =>
        set({ difficultyCalibrations: calibrations }),
      updateModuleDifficulty: (moduleIndex: number, level: DifficultyLevel) =>
        set((state) => ({
          difficultyCalibrations: state.difficultyCalibrations.map((c) =>
            c.moduleIndex === moduleIndex ? { ...c, selectedLevel: level } : c
          ),
        })),
      assignQuestionLevel: (moduleIndex: number, questionId: string, level: DifficultyLevel | null) =>
        set((state) => ({
          difficultyCalibrations: state.difficultyCalibrations.map((c) =>
            c.moduleIndex === moduleIndex
              ? { ...c, assignedLevels: { ...c.assignedLevels, [questionId]: level } }
              : c
          ),
        })),
      setSelectedAssessmentTypes: (types) =>
        set({ selectedAssessmentTypes: types }),
      setAssessmentConfigs: (configs: AssessmentConfig[]) =>
        set({ assessmentConfigs: configs }),
      upsertAssessmentConfig: (config: AssessmentConfig) =>
        set((state) => {
          const exists = state.assessmentConfigs.some((c) => c.type === config.type);
          return {
            assessmentConfigs: exists
              ? state.assessmentConfigs.map((c) => (c.type === config.type ? config : c))
              : [...state.assessmentConfigs, config],
            // Keep selectedAssessmentTypes in sync
            selectedAssessmentTypes: exists
              ? state.selectedAssessmentTypes
              : [...state.selectedAssessmentTypes.filter((t) => t !== config.type), config.type],
          };
        }),
      removeAssessmentConfig: (type: AssessmentType) =>
        set((state) => ({
          assessmentConfigs: state.assessmentConfigs.filter((c) => c.type !== type),
          selectedAssessmentTypes: state.selectedAssessmentTypes.filter((t) => t !== type),
        })),
      setAssessmentsContent: (content) =>
        set({ assessmentsContent: content }),
      setSlidePlan: (plan: ModuleSlidePlan[]) => set({ slidePlan: plan }),
      updateSlidePlanItem: (
        moduleIndex: number,
        slideId: string,
        updates: Partial<SlidePlanItem>
      ) =>
        set((state) => ({
          slidePlan: state.slidePlan?.map((mp) =>
            mp.moduleIndex === moduleIndex
              ? {
                  ...mp,
                  slides: mp.slides.map((s) =>
                    s.id === slideId ? { ...s, ...updates } : s
                  ),
                }
              : mp
          ) ?? null,
        })),
      addSlidePlanItem: (moduleIndex: number, slide: SlidePlanItem) =>
        set((state) => ({
          slidePlan: state.slidePlan?.map((mp) =>
            mp.moduleIndex === moduleIndex
              ? { ...mp, slides: [...mp.slides, slide] }
              : mp
          ) ?? null,
        })),
      removeSlidePlanItem: (moduleIndex: number, slideId: string) =>
        set((state) => ({
          slidePlan: state.slidePlan?.map((mp) =>
            mp.moduleIndex === moduleIndex
              ? { ...mp, slides: mp.slides.filter((s) => s.id !== slideId) }
              : mp
          ) ?? null,
        })),
      reorderSlidePlanItem: (moduleIndex: number, fromIdx: number, toIdx: number) =>
        set((state) => ({
          slidePlan: state.slidePlan?.map((mp) => {
            if (mp.moduleIndex !== moduleIndex) return mp;
            const arr = [...mp.slides];
            const [item] = arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, item);
            return { ...mp, slides: arr };
          }) ?? null,
        })),
      setSelectedDeliveryFormats: (formats) =>
        set({ selectedDeliveryFormats: formats }),
      setDeliveryContent: (content) => set({ deliveryContent: content }),
      setCurrentPhase: (phase) => set({ currentPhase: phase }),

      toggleLandscapeItem: (category, id) =>
        set((state) => {
          if (!state.topicLandscapeStructured) return {};
          return {
            topicLandscapeStructured: {
              ...state.topicLandscapeStructured,
              [category]: state.topicLandscapeStructured[category].map((item) =>
                item.id === id ? { ...item, included: !item.included } : item
              ),
            },
          };
        }),

      // --- Enhancement mode actions ---
      setMode: (mode) =>
        set(() => {
          if (mode === "enhance") {
            return { ...initialCreateState, ...initialEnhanceState, mode: "enhance" };
          }
          return { ...initialCreateState, ...initialEnhanceState, mode: "create" };
        }),

      setUploadedFiles: (files: UploadedFile[]) =>
        set({ uploadedFiles: files }),
      addUploadedFile: (file: UploadedFile) =>
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file],
        })),
      removeUploadedFile: (id: string) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
        })),
      setAnalysisReportRaw: (content: string) =>
        set({ analysisReportRaw: content }),
      setAnalysisReportStructured: (report: AnalysisReport | null) =>
        set({ analysisReportStructured: report }),
      updateGapAction: (id: string, action: GapAction) =>
        set((state) => {
          if (!state.analysisReportStructured) return {};
          return {
            analysisReportStructured: {
              ...state.analysisReportStructured,
              gaps: state.analysisReportStructured.gaps.map((g) =>
                g.id === id ? { ...g, action } : g
              ),
            },
          };
        }),
      updateStrengthAction: (id: string, action: StrengthAction) =>
        set((state) => {
          if (!state.analysisReportStructured) return {};
          return {
            analysisReportStructured: {
              ...state.analysisReportStructured,
              strengths: state.analysisReportStructured.strengths.map((s) =>
                s.id === id ? { ...s, action } : s
              ),
            },
          };
        }),
      addCustomGap: (description: string, type: "missing" | "outdated" | "opportunity") =>
        set((state) => {
          if (!state.analysisReportStructured) return {};
          return {
            analysisReportStructured: {
              ...state.analysisReportStructured,
              gaps: [
                ...state.analysisReportStructured.gaps,
                { id: generateId(), type, description, action: "include" as const },
              ],
            },
          };
        }),
      setWhatsNewContent: (content: string) =>
        set({ whatsNewContent: content }),
      setWhatsNewItems: (items: WhatsNewItem[]) =>
        set({ whatsNewItems: items }),
      toggleWhatsNewItemSelection: (id: string) =>
        set((state) => ({
          whatsNewItems: state.whatsNewItems?.map((item) =>
            item.id === id ? { ...item, selected: !item.selected } : item
          ) ?? null,
        })),
      toggleWhatsNewItemExpanded: (id: string) =>
        set((state) => ({
          whatsNewItems: state.whatsNewItems?.map((item) =>
            item.id === id ? { ...item, expanded: !item.expanded } : item
          ) ?? null,
        })),
      setEnhancementProposals: (proposals: EnhancementProposal[]) =>
        set({ enhancementProposals: proposals }),
      toggleProposalSelection: (id: string) =>
        set((state) => ({
          enhancementProposals: state.enhancementProposals.map((p) =>
            p.id === id ? { ...p, selected: !p.selected } : p
          ),
        })),
      setChanges: (changes: ChangeItem[]) => set({ changes }),
      updateChange: (id: string, updates: Partial<ChangeItem>) =>
        set((state) => ({
          changes: state.changes.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      setChangeFeedback: (id: string, feedback: string) =>
        set((state) => ({
          changes: state.changes.map((c) =>
            c.id === id ? { ...c, feedback } : c
          ),
        })),
      addChangelogEntry: (entry: ChangelogEntry) =>
        set((state) => ({
          changelog: [...state.changelog, entry],
        })),
      setChangelog: (entries: ChangelogEntry[]) =>
        set({ changelog: entries }),
      setEnhancePhase: (phase: Phase) => set({ enhancePhase: phase }),

      // --- V2 Enhance actions ---
      setEnhanceScopeType: (scopeType: EnhanceScopeType) => set({ enhanceScopeType: scopeType }),
      setEnhanceScopeRaw: (content: string) => set({ enhanceScopeRaw: content }),
      setEnhanceScopeSuggestions: (suggestions: ScopeSuggestion[]) =>
        set({ enhanceScopeSuggestions: suggestions }),
      toggleScopeSuggestion: (id: string) =>
        set((state) => ({
          enhanceScopeSuggestions: state.enhanceScopeSuggestions.map((s) =>
            s.id === id ? { ...s, accepted: !s.accepted } : s
          ),
        })),
      setEnhanceTopics: (topics: EnhanceTopicItem[]) =>
        set({ enhanceTopics: topics }),
      toggleEnhanceTopicSelection: (id: string) =>
        set((state) => ({
          enhanceTopics: state.enhanceTopics.map((t) =>
            t.id === id ? { ...t, selected: !t.selected } : t
          ),
        })),
      selectAllEnhanceTopics: () =>
        set((state) => ({
          enhanceTopics: state.enhanceTopics.map((t) => ({ ...t, selected: true })),
        })),
      deselectAllEnhanceTopics: () =>
        set((state) => ({
          enhanceTopics: state.enhanceTopics.map((t) => ({ ...t, selected: false })),
        })),
      setEnhanceCurrentTopicIndex: (index: number) =>
        set({ enhanceCurrentTopicIndex: index }),
      updateEnhanceTopicStatus: (topicId: string, status: EnhanceTopicStatus) =>
        set((state) => ({
          enhanceTopics: state.enhanceTopics.map((t) =>
            t.id === topicId ? { ...t, status } : t
          ),
        })),
      setTopicDeepDive: (topicId: string, updates: Partial<EnhanceTopicDeepDive>) =>
        set((state) => {
          const existing = state.enhanceTopicDeepDives.find((d) => d.topicId === topicId);
          if (existing) {
            return {
              enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
                d.topicId === topicId ? { ...d, ...updates } : d
              ),
            };
          }
          return {
            enhanceTopicDeepDives: [
              ...state.enhanceTopicDeepDives,
              {
                topicId,
                instructorNotes: "",
                uploadedMaterials: [],
                suggestionsRaw: null,
                suggestions: [],
                calibration: null,
                ...updates,
              },
            ],
          };
        }),
      setTopicInstructorNotes: (topicId: string, notes: string) =>
        set((state) => {
          const existing = state.enhanceTopicDeepDives.find((d) => d.topicId === topicId);
          if (existing) {
            return {
              enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
                d.topicId === topicId ? { ...d, instructorNotes: notes } : d
              ),
            };
          }
          return {
            enhanceTopicDeepDives: [
              ...state.enhanceTopicDeepDives,
              { topicId, instructorNotes: notes, uploadedMaterials: [], suggestionsRaw: null, suggestions: [], calibration: null },
            ],
          };
        }),
      addTopicMaterial: (topicId: string, file: UploadedFile) =>
        set((state) => {
          const existing = state.enhanceTopicDeepDives.find((d) => d.topicId === topicId);
          if (existing) {
            return {
              enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
                d.topicId === topicId
                  ? { ...d, uploadedMaterials: [...d.uploadedMaterials, file] }
                  : d
              ),
            };
          }
          return {
            enhanceTopicDeepDives: [
              ...state.enhanceTopicDeepDives,
              {
                topicId,
                instructorNotes: "",
                uploadedMaterials: [file],
                suggestionsRaw: null,
                suggestions: [],
                calibration: null,
              },
            ],
          };
        }),
      removeTopicMaterial: (topicId: string, fileId: string) =>
        set((state) => ({
          enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
            d.topicId === topicId
              ? { ...d, uploadedMaterials: d.uploadedMaterials.filter((f) => f.id !== fileId) }
              : d
          ),
        })),
      setTopicSuggestions: (topicId: string, raw: string, suggestions: TopicSuggestion[]) =>
        set((state) => {
          const existing = state.enhanceTopicDeepDives.find((d) => d.topicId === topicId);
          if (existing) {
            return {
              enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
                d.topicId === topicId ? { ...d, suggestionsRaw: raw, suggestions } : d
              ),
            };
          }
          return {
            enhanceTopicDeepDives: [
              ...state.enhanceTopicDeepDives,
              { topicId, instructorNotes: "", uploadedMaterials: [], suggestionsRaw: raw, suggestions, calibration: null },
            ],
          };
        }),
      toggleTopicSuggestion: (topicId: string, suggestionId: string) =>
        set((state) => ({
          enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
            d.topicId === topicId
              ? {
                  ...d,
                  suggestions: d.suggestions.map((s) =>
                    s.id === suggestionId ? { ...s, selected: !s.selected } : s
                  ),
                }
              : d
          ),
        })),
      setTopicCalibration: (topicId: string, calibration: ModuleDifficultyCalibration) =>
        set((state) => {
          const existing = state.enhanceTopicDeepDives.find((d) => d.topicId === topicId);
          if (existing) {
            return {
              enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
                d.topicId === topicId ? { ...d, calibration } : d
              ),
            };
          }
          return {
            enhanceTopicDeepDives: [
              ...state.enhanceTopicDeepDives,
              { topicId, instructorNotes: "", uploadedMaterials: [], suggestionsRaw: null, suggestions: [], calibration },
            ],
          };
        }),
      assignTopicQuestionLevel: (topicId: string, questionId: string, level: DifficultyLevel | null) =>
        set((state) => ({
          enhanceTopicDeepDives: state.enhanceTopicDeepDives.map((d) =>
            d.topicId === topicId && d.calibration
              ? {
                  ...d,
                  calibration: {
                    ...d.calibration,
                    assignedLevels: { ...d.calibration.assignedLevels, [questionId]: level },
                  },
                }
              : d
          ),
        })),

      setEnhanceSlidePlan: (plan: ModuleSlidePlan[]) => set({ enhanceSlidePlan: plan }),
      updateEnhanceSlidePlanItem: (
        topicIndex: number,
        slideId: string,
        updates: Partial<SlidePlanItem>
      ) =>
        set((state) => ({
          enhanceSlidePlan: state.enhanceSlidePlan?.map((mp) =>
            mp.moduleIndex === topicIndex
              ? {
                  ...mp,
                  slides: mp.slides.map((s) =>
                    s.id === slideId ? { ...s, ...updates } : s
                  ),
                }
              : mp
          ) ?? null,
        })),
      addEnhanceSlide: (topicIndex: number, slide: SlidePlanItem) =>
        set((state) => ({
          enhanceSlidePlan: state.enhanceSlidePlan?.map((mp) =>
            mp.moduleIndex === topicIndex
              ? { ...mp, slides: [...mp.slides, slide] }
              : mp
          ) ?? null,
        })),
      removeEnhanceSlide: (topicIndex: number, slideId: string) =>
        set((state) => ({
          enhanceSlidePlan: state.enhanceSlidePlan?.map((mp) =>
            mp.moduleIndex === topicIndex
              ? { ...mp, slides: mp.slides.filter((s) => s.id !== slideId) }
              : mp
          ) ?? null,
        })),
      reorderEnhanceSlide: (topicIndex: number, fromIdx: number, toIdx: number) =>
        set((state) => ({
          enhanceSlidePlan: state.enhanceSlidePlan?.map((mp) => {
            if (mp.moduleIndex !== topicIndex) return mp;
            const arr = [...mp.slides];
            const [item] = arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, item);
            return { ...mp, slides: arr };
          }) ?? null,
        })),
      setEnhanceCourseContext: (ctx: EnhanceCourseContext | null) =>
        set({ enhanceCourseContext: ctx }),

      reset: () => set(initialState),
    }),
    {
      name: "curriculum-designer-storage",
      version: 13,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;

        // v0 → v1: add structured fields and migrate modules
        if (version < 1) {
          state.topicLandscapeStructured =
            state.topicLandscapeStructured ?? null;
          state.suggestedModulesStructured =
            state.suggestedModulesStructured ?? null;
          state.modules = Array.isArray(state.modules)
            ? (state.modules as CurriculumModule[]).map(migrateModule)
            : [];
        }

        // v1 → v2: add mode + all enhance fields
        if (version < 2) {
          state.mode = state.mode ?? "create";
          state.uploadedFiles = state.uploadedFiles ?? [];
          state.analysisReportRaw = state.analysisReportRaw ?? null;
          state.analysisReportStructured =
            state.analysisReportStructured ?? null;
          state.whatsNewContent = state.whatsNewContent ?? null;
          state.enhancementProposals = state.enhancementProposals ?? [];
          state.changes = state.changes ?? [];
          state.changelog = state.changelog ?? [];
          state.enhancePhase = state.enhancePhase ?? 0;
        }

        // v2 → v3: add action fields to gaps/strengths, whatsNewItems
        if (version < 3) {
          state.whatsNewItems = state.whatsNewItems ?? null;
          const report = state.analysisReportStructured as AnalysisReport | null;
          if (report) {
            report.gaps = report.gaps.map((g) => ({
              ...g,
              action: g.action ?? "include",
            }));
            report.strengths = report.strengths.map((s) => ({
              ...s,
              action: s.action ?? "keep",
            }));
            state.analysisReportStructured = report;
          }
        }

        // v3 → v4: add `included` field to landscape items
        if (version < 4) {
          const landscape = state.topicLandscapeStructured as TopicLandscape | null;
          if (landscape) {
            landscape.trends = landscape.trends.map((t) => ({
              ...t,
              included: typeof t.included === "boolean" ? t.included : true,
            }));
            landscape.tools = landscape.tools.map((t) => ({
              ...t,
              included: typeof t.included === "boolean" ? t.included : true,
            }));
            landscape.resources = landscape.resources.map((r) => ({
              ...r,
              included: typeof r.included === "boolean" ? r.included : true,
            }));
            state.topicLandscapeStructured = landscape;
          }
        }

        // v4 → v5: add `scope` field to courseInfo
        if (version < 5) {
          const courseInfo = state.courseInfo as CourseInfo | null;
          if (courseInfo && !courseInfo.scope) {
            courseInfo.scope = "full-course";
            state.courseInfo = courseInfo;
          }
        }

        // v5 → v6: add difficultyCalibrations, remap phases (new phase 3 inserted)
        if (version < 6) {
          state.difficultyCalibrations = state.difficultyCalibrations ?? [];
          const phase = state.currentPhase as number;
          if (phase >= 3) {
            state.currentPhase = (phase + 1) as Phase;
          }
        }

        // v6 → v7: add slidePlan, remove "slides" and "video-scripts" from selectedDeliveryFormats
        if (version < 7) {
          state.slidePlan = state.slidePlan ?? null;
          const formats = state.selectedDeliveryFormats as string[] | undefined;
          if (Array.isArray(formats)) {
            state.selectedDeliveryFormats = formats.filter(
              (f) => f !== "slides" && f !== "video-scripts"
            );
          }
        }

        // v7 → v8: add `area` field to courseInfo; v8 → v9: add assessmentConfigs
        if (version < 8) {
          const courseInfo = state.courseInfo as CourseInfo | null;
          if (courseInfo && typeof courseInfo.area !== "string") {
            courseInfo.area = "computer-science";
            state.courseInfo = courseInfo;
          }
        }

        // v8 → v9: add assessmentConfigs
        if (version < 9) {
          state.assessmentConfigs = state.assessmentConfigs ?? [];
        }

        // v9 → v10: add assignedLevels + id to DifficultyQuestion
        if (version < 10) {
          const cals = state.difficultyCalibrations as ModuleDifficultyCalibration[] | undefined;
          if (Array.isArray(cals)) {
            state.difficultyCalibrations = cals.map((cal) => {
              // Ensure each question has an id
              const questions = Array.isArray(cal.questions)
                ? cal.questions.map((q) => {
                    const hasId = typeof (q as unknown as Record<string, unknown>).id === "string";
                    return hasId ? q : { ...q, id: generateId() };
                  })
                : [];

              // Pre-populate assignedLevels from existing level fields
              const existingAssigned = typeof cal.assignedLevels === "object" && cal.assignedLevels !== null
                ? cal.assignedLevels
                : {};
              const assignedLevels: Record<string, string | null> = { ...existingAssigned };
              for (const q of questions) {
                if (typeof q.level === "string" && !(q.id in assignedLevels)) {
                  assignedLevels[q.id] = q.level;
                }
              }

              return {
                ...cal,
                questions,
                assignedLevels,
              };
            });
          }
        }

        // v10 → v11: add enhance V2 fields
        if (version < 11) {
          state.enhanceScopeType = state.enhanceScopeType ?? null;
          state.enhanceScopeRaw = state.enhanceScopeRaw ?? null;
          state.enhanceScopeSuggestions = state.enhanceScopeSuggestions ?? [];
          state.enhanceTopics = state.enhanceTopics ?? [];
          state.enhanceCurrentTopicIndex = state.enhanceCurrentTopicIndex ?? 0;
          state.enhanceTopicDeepDives = state.enhanceTopicDeepDives ?? [];
        }

        // v11 → v12: add enhanceSlidePlan
        if (version < 12) {
          state.enhanceSlidePlan = state.enhanceSlidePlan ?? null;
        }

        // v12 → v13: add enhanceCourseContext
        if (version < 13) {
          state.enhanceCourseContext = state.enhanceCourseContext ?? null;
        }

        return state as unknown as CurriculumStore;
      },
      partialize: (state) => {
        // Exclude uploadedFiles from localStorage to avoid 5MB limit
        const { uploadedFiles: _uploadedFiles, ...rest } = state;
        return rest as unknown as CurriculumStore;
      },
    }
  )
);
