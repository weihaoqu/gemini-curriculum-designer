"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCurriculumStore } from "@/lib/store/curriculum-store";
import { SlideCard } from "@/components/shared/SlideCard";
import { generateId } from "@/lib/parsers";
import { cn, apiUrl } from "@/lib/utils";
import type {
  CourseArea,
  DeliveryFormat,
  ModuleSlidePlan,
  SlidePlanItem,
} from "@/lib/types/curriculum";
import { AREA_LABELS } from "@/lib/claude/prompts";

// --- SVG illustrations for delivery formats ---
function JupyterIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      {/* Notebook shape */}
      <rect x="10" y="4" width="60" height="52" rx="3" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="10" y="4" width="60" height="8" rx="3" fill="#F97316" />
      <circle cx="16" cy="8" r="1.5" fill="white" />
      <circle cx="21" cy="8" r="1.5" fill="white" />
      <circle cx="26" cy="8" r="1.5" fill="white" />
      {/* Code cell */}
      <rect x="16" y="16" width="48" height="10" rx="2" fill="#1E293B" />
      <rect x="19" y="19" width="20" height="1.5" rx="0.75" fill="#60A5FA" />
      <rect x="19" y="22" width="14" height="1.5" rx="0.75" fill="#34D399" />
      {/* Markdown cell */}
      <rect x="16" y="30" width="48" height="6" rx="2" fill="white" stroke="#D1D5DB" strokeWidth="0.5" />
      <rect x="19" y="32" width="30" height="1.5" rx="0.75" fill="#9CA3AF" />
      {/* Output cell */}
      <rect x="16" y="40" width="48" height="10" rx="2" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="0.5" />
      <rect x="19" y="43" width="18" height="1.5" rx="0.75" fill="#059669" />
      <rect x="19" y="46" width="24" height="1.5" rx="0.75" fill="#059669" />
    </svg>
  );
}

function LmsIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      {/* Browser window */}
      <rect x="6" y="4" width="68" height="52" rx="3" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="6" y="4" width="68" height="8" rx="3" fill="#3B82F6" />
      <rect x="12" y="7" width="30" height="2" rx="1" fill="white" opacity="0.6" />
      {/* Sidebar */}
      <rect x="6" y="12" width="18" height="44" fill="#EFF6FF" />
      <rect x="9" y="16" width="12" height="2" rx="1" fill="#3B82F6" />
      <rect x="9" y="22" width="12" height="2" rx="1" fill="#93C5FD" />
      <rect x="9" y="28" width="12" height="2" rx="1" fill="#93C5FD" />
      <rect x="9" y="34" width="12" height="2" rx="1" fill="#93C5FD" />
      {/* Content area */}
      <rect x="28" y="16" width="40" height="4" rx="1" fill="#1E293B" />
      <rect x="28" y="24" width="36" height="2" rx="1" fill="#CBD5E1" />
      <rect x="28" y="28" width="32" height="2" rx="1" fill="#CBD5E1" />
      {/* Progress bar */}
      <rect x="28" y="36" width="40" height="4" rx="2" fill="#E2E8F0" />
      <rect x="28" y="36" width="28" height="4" rx="2" fill="#22C55E" />
      {/* Checkboxes */}
      <rect x="28" y="44" width="4" height="4" rx="1" fill="#22C55E" />
      <rect x="34" y="45" width="16" height="2" rx="1" fill="#64748B" />
      <rect x="28" y="50" width="4" height="4" rx="1" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="34" y="51" width="20" height="2" rx="1" fill="#64748B" />
    </svg>
  );
}

function CheatSheetIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      {/* Paper */}
      <rect x="12" y="2" width="56" height="56" rx="2" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      {/* Header */}
      <rect x="18" y="6" width="28" height="3" rx="1" fill="#7C3AED" />
      <rect x="50" y="6" width="12" height="3" rx="1" fill="#DDD6FE" />
      {/* Two columns */}
      {/* Left column */}
      <rect x="18" y="13" width="22" height="2" rx="0.5" fill="#1E293B" />
      <rect x="18" y="17" width="20" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="18" y="19.5" width="18" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="18" y="22" width="21" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="18" y="27" width="18" height="2" rx="0.5" fill="#1E293B" />
      <rect x="18" y="31" width="20" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="18" y="33.5" width="16" height="1" rx="0.5" fill="#94A3B8" />
      {/* Right column */}
      <rect x="44" y="13" width="18" height="2" rx="0.5" fill="#1E293B" />
      <rect x="44" y="17" width="16" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="44" y="19.5" width="19" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="44" y="22" width="14" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="44" y="27" width="20" height="2" rx="0.5" fill="#1E293B" />
      <rect x="44" y="31" width="17" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="44" y="33.5" width="15" height="1" rx="0.5" fill="#94A3B8" />
      {/* Divider */}
      <line x1="42" y1="12" x2="42" y2="50" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="2 1" />
      {/* Code box */}
      <rect x="18" y="39" width="44" height="12" rx="2" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.5" />
      <rect x="21" y="42" width="24" height="1" rx="0.5" fill="#7C3AED" />
      <rect x="21" y="45" width="18" height="1" rx="0.5" fill="#64748B" />
      <rect x="21" y="48" width="22" height="1" rx="0.5" fill="#64748B" />
    </svg>
  );
}

function StudyGuideIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      {/* Book shape */}
      <rect x="10" y="4" width="60" height="52" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="10" y="4" width="60" height="10" rx="3" fill="#2563EB" />
      <rect x="16" y="7" width="24" height="2.5" rx="1" fill="white" />
      <rect x="16" y="11" width="16" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      {/* Checklist */}
      <rect x="16" y="18" width="3" height="3" rx="0.75" fill="#22C55E" />
      <rect x="22" y="19" width="24" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="24" width="3" height="3" rx="0.75" fill="#22C55E" />
      <rect x="22" y="25" width="20" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="30" width="3" height="3" rx="0.75" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="22" y="31" width="28" height="1.5" rx="0.75" fill="#334155" />
      {/* Practice problem */}
      <rect x="16" y="38" width="48" height="14" rx="2" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="0.5" />
      <rect x="19" y="40" width="14" height="1.5" rx="0.75" fill="#92400E" />
      <rect x="19" y="43" width="40" height="1" rx="0.5" fill="#78716C" />
      <rect x="19" y="46" width="36" height="1" rx="0.5" fill="#78716C" />
      <rect x="19" y="49" width="28" height="1" rx="0.5" fill="#78716C" />
    </svg>
  );
}

function InstructorNotesIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      {/* Clipboard */}
      <rect x="14" y="8" width="52" height="48" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="28" y="4" width="24" height="8" rx="2" fill="#64748B" />
      <rect x="32" y="6" width="16" height="4" rx="1.5" fill="#F1F5F9" />
      {/* Timing section */}
      <rect x="20" y="16" width="40" height="3" rx="1" fill="#0EA5E9" />
      <rect x="20" y="21" width="6" height="6" rx="1" fill="#E0F2FE" stroke="#0EA5E9" strokeWidth="0.5" />
      <text x="23" y="26" fontSize="4" fill="#0EA5E9" textAnchor="middle" fontWeight="bold">5m</text>
      <rect x="28" y="22" width="28" height="1.5" rx="0.75" fill="#64748B" />
      <rect x="28" y="25" width="22" height="1" rx="0.5" fill="#94A3B8" />
      {/* Tips section */}
      <rect x="20" y="31" width="6" height="6" rx="1" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="0.5" />
      <text x="23" y="36" fontSize="5" fill="#F59E0B" textAnchor="middle">!</text>
      <rect x="28" y="32" width="30" height="1.5" rx="0.75" fill="#64748B" />
      <rect x="28" y="35" width="24" height="1" rx="0.5" fill="#94A3B8" />
      {/* Answer key */}
      <rect x="20" y="41" width="6" height="6" rx="1" fill="#DCFCE7" stroke="#22C55E" strokeWidth="0.5" />
      <text x="23" y="46" fontSize="5" fill="#22C55E" textAnchor="middle">A</text>
      <rect x="28" y="42" width="26" height="1.5" rx="0.75" fill="#64748B" />
      <rect x="28" y="45" width="20" height="1" rx="0.5" fill="#94A3B8" />
    </svg>
  );
}

function GithubRepoIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      {/* Terminal/window */}
      <rect x="8" y="4" width="64" height="52" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
      <rect x="8" y="4" width="64" height="8" rx="3" fill="#334155" />
      <circle cx="14" cy="8" r="1.5" fill="#EF4444" />
      <circle cx="19" cy="8" r="1.5" fill="#F59E0B" />
      <circle cx="24" cy="8" r="1.5" fill="#22C55E" />
      {/* Folder tree */}
      <rect x="14" y="16" width="16" height="1.5" rx="0.75" fill="#60A5FA" />
      <rect x="18" y="20" width="8" height="1.5" rx="0.75" fill="#FCD34D" />
      <rect x="28" y="20" width="18" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="18" y="24" width="8" height="1.5" rx="0.75" fill="#FCD34D" />
      <rect x="28" y="24" width="14" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="22" y="28" width="12" height="1.5" rx="0.75" fill="#34D399" />
      <rect x="36" y="28" width="20" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="22" y="32" width="10" height="1.5" rx="0.75" fill="#34D399" />
      <rect x="34" y="32" width="16" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="18" y="36" width="8" height="1.5" rx="0.75" fill="#FCD34D" />
      <rect x="28" y="36" width="22" height="1.5" rx="0.75" fill="#94A3B8" />
      {/* Git branch icon */}
      <circle cx="60" cy="18" r="2" stroke="#A78BFA" strokeWidth="1" />
      <circle cx="60" cy="28" r="2" stroke="#A78BFA" strokeWidth="1" />
      <line x1="60" y1="20" x2="60" y2="26" stroke="#A78BFA" strokeWidth="1" />
      <circle cx="54" cy="24" r="2" stroke="#34D399" strokeWidth="1" />
      <path d="M56 24 L58 26" stroke="#34D399" strokeWidth="1" />
      {/* CI badge */}
      <rect x="14" y="42" width="24" height="6" rx="3" fill="#22C55E" />
      <rect x="17" y="44" width="18" height="2" rx="1" fill="white" opacity="0.8" />
    </svg>
  );
}

// --- SVG illustrations for discipline-specific formats ---

function LabEnvironmentIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      <rect x="8" y="4" width="64" height="52" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
      <rect x="8" y="4" width="64" height="8" rx="3" fill="#334155" />
      <circle cx="14" cy="8" r="1.5" fill="#EF4444" />
      <circle cx="19" cy="8" r="1.5" fill="#F59E0B" />
      <circle cx="24" cy="8" r="1.5" fill="#22C55E" />
      <rect x="14" y="16" width="20" height="2" rx="1" fill="#60A5FA" />
      <rect x="14" y="20" width="28" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="14" y="24" width="24" height="1.5" rx="0.75" fill="#34D399" />
      <rect x="14" y="30" width="50" height="8" rx="2" fill="#1A2332" stroke="#3B82F6" strokeWidth="0.5" />
      <rect x="17" y="32" width="16" height="1.5" rx="0.75" fill="#3B82F6" />
      <rect x="17" y="35" width="22" height="1.5" rx="0.75" fill="#60A5FA" />
      <rect x="14" y="42" width="50" height="10" rx="2" fill="#0F172A" stroke="#22C55E" strokeWidth="0.5" />
      <rect x="17" y="44" width="8" height="1.5" rx="0.75" fill="#22C55E" />
      <rect x="27" y="44" width="20" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="17" y="48" width="12" height="1.5" rx="0.75" fill="#22C55E" />
    </svg>
  );
}

function ApiDocIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      <rect x="10" y="4" width="60" height="52" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="16" y="8" width="20" height="3" rx="1" fill="#7C3AED" />
      <rect x="16" y="15" width="8" height="3" rx="1.5" fill="#22C55E" />
      <rect x="26" y="16" width="30" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="22" width="8" height="3" rx="1.5" fill="#3B82F6" />
      <rect x="26" y="23" width="26" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="29" width="8" height="3" rx="1.5" fill="#F59E0B" />
      <rect x="26" y="30" width="28" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="36" width="8" height="3" rx="1.5" fill="#EF4444" />
      <rect x="26" y="37" width="24" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="44" width="48" height="8" rx="2" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.5" />
      <rect x="19" y="46" width="24" height="1.5" rx="0.75" fill="#7C3AED" />
      <rect x="19" y="49" width="18" height="1.5" rx="0.75" fill="#64748B" />
    </svg>
  );
}

function LabProtocolIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      <rect x="10" y="4" width="60" height="52" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="10" y="4" width="60" height="10" rx="3" fill="#059669" />
      <rect x="16" y="7" width="24" height="2.5" rx="1" fill="white" />
      <rect x="16" y="11" width="14" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      <circle cx="20" cy="22" r="4" fill="#DCFCE7" stroke="#22C55E" strokeWidth="1" />
      <text x="20" y="24" fontSize="5" fill="#059669" textAnchor="middle" fontWeight="bold">1</text>
      <rect x="28" y="20" width="36" height="2" rx="1" fill="#334155" />
      <rect x="28" y="24" width="28" height="1" rx="0.5" fill="#94A3B8" />
      <circle cx="20" cy="34" r="4" fill="#DCFCE7" stroke="#22C55E" strokeWidth="1" />
      <text x="20" y="36" fontSize="5" fill="#059669" textAnchor="middle" fontWeight="bold">2</text>
      <rect x="28" y="32" width="32" height="2" rx="1" fill="#334155" />
      <rect x="28" y="36" width="24" height="1" rx="0.5" fill="#94A3B8" />
      <circle cx="20" cy="46" r="4" fill="#DCFCE7" stroke="#22C55E" strokeWidth="1" />
      <text x="20" y="48" fontSize="5" fill="#059669" textAnchor="middle" fontWeight="bold">3</text>
      <rect x="28" y="44" width="30" height="2" rx="1" fill="#334155" />
      <rect x="28" y="48" width="26" height="1" rx="0.5" fill="#94A3B8" />
    </svg>
  );
}

function CaseStudyIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      <rect x="10" y="4" width="60" height="52" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="10" y="4" width="60" height="10" rx="3" fill="#1D4ED8" />
      <rect x="16" y="7" width="20" height="2.5" rx="1" fill="white" />
      <rect x="16" y="11" width="28" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      <rect x="16" y="18" width="48" height="12" rx="2" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="0.5" />
      <rect x="19" y="20" width="30" height="1.5" rx="0.75" fill="#1E40AF" />
      <rect x="19" y="23" width="42" height="1" rx="0.5" fill="#64748B" />
      <rect x="19" y="26" width="38" height="1" rx="0.5" fill="#64748B" />
      <rect x="16" y="34" width="14" height="2" rx="1" fill="#334155" />
      <rect x="16" y="38" width="48" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="16" y="41" width="44" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="16" y="48" width="12" height="2" rx="1" fill="#334155" />
      <rect x="16" y="52" width="46" height="1" rx="0.5" fill="#94A3B8" />
    </svg>
  );
}

function SimulationIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      <rect x="8" y="4" width="64" height="52" rx="3" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="8" y="4" width="64" height="8" rx="3" fill="#7C3AED" />
      <rect x="14" y="7" width="28" height="2" rx="1" fill="white" opacity="0.8" />
      <rect x="14" y="16" width="52" height="20" rx="2" fill="white" stroke="#D1D5DB" strokeWidth="0.5" />
      <polyline points="18,32 26,24 34,28 42,20 50,26 58,18" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
      <circle cx="26" cy="24" r="2" fill="#7C3AED" />
      <circle cx="42" cy="20" r="2" fill="#7C3AED" />
      <circle cx="58" cy="18" r="2" fill="#7C3AED" />
      <rect x="14" y="40" width="16" height="4" rx="2" fill="#7C3AED" />
      <rect x="32" y="40" width="16" height="4" rx="2" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="0.5" />
      <rect x="50" y="40" width="16" height="4" rx="2" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="0.5" />
      <rect x="14" y="48" width="52" height="4" rx="2" fill="#E2E8F0" />
      <rect x="14" y="48" width="34" height="4" rx="2" fill="#22C55E" />
    </svg>
  );
}

function ProblemSetIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      <rect x="10" y="4" width="60" height="52" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="16" y="8" width="24" height="3" rx="1" fill="#DC2626" />
      <rect x="16" y="15" width="6" height="3" rx="1" fill="#FEE2E2" stroke="#DC2626" strokeWidth="0.5" />
      <rect x="24" y="16" width="40" height="1.5" rx="0.75" fill="#334155" />
      <rect x="24" y="19" width="34" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="16" y="25" width="6" height="3" rx="1" fill="#FEE2E2" stroke="#DC2626" strokeWidth="0.5" />
      <rect x="24" y="26" width="38" height="1.5" rx="0.75" fill="#334155" />
      <rect x="24" y="29" width="30" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="16" y="35" width="6" height="3" rx="1" fill="#FEE2E2" stroke="#DC2626" strokeWidth="0.5" />
      <rect x="24" y="36" width="42" height="1.5" rx="0.75" fill="#334155" />
      <rect x="24" y="39" width="28" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="16" y="45" width="48" height="8" rx="2" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.5" />
      <rect x="19" y="47" width="16" height="1.5" rx="0.75" fill="#DC2626" />
      <rect x="19" y="50" width="28" height="1" rx="0.5" fill="#64748B" />
    </svg>
  );
}

function ProofTemplateIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      <rect x="10" y="4" width="60" height="52" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="16" y="8" width="18" height="3" rx="1" fill="#0891B2" />
      <rect x="16" y="15" width="12" height="2" rx="1" fill="#0E7490" />
      <rect x="30" y="16" width="34" height="1" rx="0.5" fill="#334155" />
      <rect x="16" y="21" width="16" height="2" rx="1" fill="#0E7490" />
      <rect x="34" y="22" width="30" height="1" rx="0.5" fill="#334155" />
      <rect x="16" y="27" width="48" height="16" rx="2" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="0.5" />
      <rect x="19" y="29" width="14" height="1.5" rx="0.75" fill="#0E7490" />
      <rect x="19" y="32" width="42" height="1" rx="0.5" fill="#64748B" />
      <rect x="19" y="35" width="38" height="1" rx="0.5" fill="#64748B" />
      <rect x="19" y="38" width="34" height="1" rx="0.5" fill="#64748B" />
      <rect x="16" y="47" width="48" height="6" rx="2" fill="#ECFDF5" stroke="#22C55E" strokeWidth="0.5" />
      <rect x="50" y="49" width="10" height="2" rx="1" fill="#059669" />
    </svg>
  );
}

function FlashcardIllustration() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" fill="none">
      {/* Back card */}
      <rect x="18" y="8" width="52" height="36" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
      {/* Middle card */}
      <rect x="14" y="12" width="52" height="36" rx="3" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
      {/* Front card */}
      <rect x="10" y="16" width="52" height="36" rx="3" fill="white" stroke="#3B82F6" strokeWidth="1.5" />
      <rect x="16" y="20" width="28" height="3" rx="1" fill="#3B82F6" />
      <rect x="16" y="27" width="40" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="31" width="36" height="1.5" rx="0.75" fill="#334155" />
      <rect x="16" y="35" width="30" height="1.5" rx="0.75" fill="#334155" />
      <line x1="16" y1="42" x2="56" y2="42" stroke="#E2E8F0" strokeWidth="0.5" />
      <rect x="16" y="45" width="20" height="2" rx="1" fill="#22C55E" />
      <rect x="38" y="45" width="16" height="2" rx="1" fill="#F59E0B" />
    </svg>
  );
}

const FORMAT_ILLUSTRATIONS: Record<DeliveryFormat, () => React.ReactNode> = {
  jupyter: JupyterIllustration,
  lms: LmsIllustration,
  "cheat-sheets": CheatSheetIllustration,
  "study-guides": StudyGuideIllustration,
  "instructor-notes": InstructorNotesIllustration,
  "github-repo": GithubRepoIllustration,
  "lab-environments": LabEnvironmentIllustration,
  "api-documentation": ApiDocIllustration,
  "lab-protocols": LabProtocolIllustration,
  "case-studies": CaseStudyIllustration,
  "simulation-scenarios": SimulationIllustration,
  "problem-sets": ProblemSetIllustration,
  "proof-templates": ProofTemplateIllustration,
  "flashcard-decks": FlashcardIllustration,
};

// --- Delivery format options (View 2) ---
const deliveryOptions: {
  value: DeliveryFormat;
  label: string;
  description: string;
  strengths: string[];
  bestFor: string;
}[] = [
  {
    value: "jupyter",
    label: "Jupyter Notebooks",
    description: "Interactive notebooks mixing explanatory text, runnable code cells, and exercises.",
    strengths: [
      "Interactive — students learn by doing",
      "Code and explanation live together",
      "Self-checking with assertion cells",
    ],
    bestFor: "Programming, data science, or any technical hands-on course",
  },
  {
    value: "lms",
    label: "LMS Package",
    description: "Complete Canvas/Moodle structure with module pages, quizzes, and assignments.",
    strengths: [
      "Ready to upload to institutional LMS",
      "Includes quizzes in standard format",
      "Familiar structure for students",
    ],
    bestFor: "University or corporate training with an existing LMS",
  },
  {
    value: "cheat-sheets",
    label: "Cheat Sheets",
    description: "Compact, printable reference cards with key terms, syntax, commands, and patterns.",
    strengths: [
      "Quick lookup during labs and exams",
      "Forces distillation of key concepts",
      "Students love having these",
    ],
    bestFor: "Any course — especially technical or formula-heavy subjects",
  },
  {
    value: "study-guides",
    label: "Study Guides",
    description: "Exam prep guides with concept summaries, practice problems, and memory aids.",
    strengths: [
      "Structured exam preparation",
      "Practice problems with solutions",
      "Self-assessment before exams",
    ],
    bestFor: "Courses with midterms, finals, or certification exams",
  },
  {
    value: "instructor-notes",
    label: "Instructor Notes",
    description: "Teaching guide with timing, discussion prompts, answer keys, and differentiation tips.",
    strengths: [
      "Consistent delivery across sections/TAs",
      "Answers to anticipated questions",
      "Time management guidance",
    ],
    bestFor: "Courses taught by multiple instructors or with TAs",
  },
  {
    value: "github-repo",
    label: "GitHub Repository",
    description: "Complete repo with module folders, exercise starters, README templates, and auto-grading CI.",
    strengths: [
      "Industry-standard code sharing",
      "Version control for course materials",
      "Auto-grading with GitHub Actions",
    ],
    bestFor: "Technical courses where students work with code",
  },
];

// --- Discipline-specific delivery formats ---
const disciplineDeliveryOptions: {
  value: DeliveryFormat;
  label: string;
  description: string;
  strengths: string[];
  bestFor: string;
}[] = [
  {
    value: "lab-environments",
    label: "Lab Environments",
    description: "Docker/VM setups with pre-configured dependencies for hands-on practice.",
    strengths: [
      "Zero-setup for students",
      "Consistent environments across machines",
      "Reproducible experiments",
    ],
    bestFor: "CS, Engineering — courses with coding or system labs",
  },
  {
    value: "api-documentation",
    label: "API Documentation",
    description: "Reference docs with endpoints, schemas, code examples, and interactive try-it sections.",
    strengths: [
      "Industry-standard reference format",
      "Self-serve for students",
      "Easy to keep updated",
    ],
    bestFor: "CS — web development, software engineering, data APIs",
  },
  {
    value: "lab-protocols",
    label: "Lab Protocols",
    description: "Step-by-step experimental procedures with safety, data collection, and analysis sections.",
    strengths: [
      "Structured experimental workflow",
      "Safety and compliance built-in",
      "Consistent data collection",
    ],
    bestFor: "Biology, Health Sciences — wet labs, clinical skills",
  },
  {
    value: "case-studies",
    label: "Case Studies",
    description: "Real-world scenario analyses with exhibits, discussion questions, and teaching notes.",
    strengths: [
      "Connects theory to practice",
      "Promotes critical thinking",
      "Engages multiple perspectives",
    ],
    bestFor: "Business, Health, Social Sciences, Arts, Education",
  },
  {
    value: "simulation-scenarios",
    label: "Simulation Scenarios",
    description: "Interactive simulations with decision points, branching outcomes, and debrief questions.",
    strengths: [
      "Risk-free experimentation",
      "Immediate feedback on decisions",
      "Engaging and memorable",
    ],
    bestFor: "Business, Engineering — strategy, design, operations",
  },
  {
    value: "problem-sets",
    label: "Problem Sets",
    description: "Graded practice problem collections with worked examples and solution manuals.",
    strengths: [
      "Progressive difficulty scaffolding",
      "Self-check with worked solutions",
      "Builds fluency through repetition",
    ],
    bestFor: "Mathematics — calculus, algebra, statistics, proofs",
  },
  {
    value: "proof-templates",
    label: "Proof Templates",
    description: "Structured proof frameworks with skeletons, multi-level hints, and grading rubrics.",
    strengths: [
      "Teaches proof methodology",
      "Scaffolded hints reduce frustration",
      "Consistent grading standards",
    ],
    bestFor: "Mathematics — discrete math, analysis, abstract algebra",
  },
  {
    value: "flashcard-decks",
    label: "Flashcard Decks",
    description: "Spaced-repetition cards with terms, concepts, formulas, and application questions.",
    strengths: [
      "Evidence-based memorization",
      "Works on mobile devices",
      "Students can self-pace review",
    ],
    bestFor: "All disciplines — especially terminology-heavy subjects",
  },
];

const DISCIPLINE_FORMATS: Record<CourseArea, DeliveryFormat[]> = {
  "computer-science": ["lab-environments", "api-documentation", "flashcard-decks"],
  business: ["case-studies", "simulation-scenarios", "flashcard-decks"],
  mathematics: ["problem-sets", "proof-templates", "flashcard-decks"],
  biology: ["lab-protocols", "case-studies", "flashcard-decks"],
  engineering: ["lab-environments", "simulation-scenarios", "flashcard-decks"],
  "arts-humanities": ["case-studies", "flashcard-decks"],
  "social-sciences": ["case-studies", "flashcard-decks"],
  "health-sciences": ["lab-protocols", "case-studies", "flashcard-decks"],
  education: ["case-studies", "simulation-scenarios", "flashcard-decks"],
  other: ["case-studies", "flashcard-decks"],
};

// --- View type ---
type Phase5View = "slide-plan" | "other-formats";

function FormatCard({
  option,
  isSelected,
  Illustration,
  onToggle,
}: {
  option: { value: DeliveryFormat; label: string; description: string; strengths: string[]; bestFor: string };
  isSelected: boolean;
  Illustration: () => React.ReactNode;
  onToggle: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors overflow-hidden",
        isSelected
          ? "border-primary bg-primary/5"
          : "hover:border-muted-foreground/30"
      )}
      onClick={onToggle}
    >
      <CardContent className="p-0">
        <div className="h-28 bg-gradient-to-b from-muted/50 to-muted/20 flex items-center justify-center p-3 border-b">
          <div className="w-24 h-20">
            <Illustration />
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {option.description}
              </p>
            </div>
            <div
              className={cn(
                "mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <span className="text-xs">{"✓"}</span>}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-dashed">
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {option.strengths.map((s, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-green-500 shrink-0">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2">
              <span className="font-medium">Best for:</span>{" "}
              <span className="text-muted-foreground">{option.bestFor}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Phase5Page() {
  const router = useRouter();
  const {
    courseInfo,
    modules,
    difficultyCalibrations,
    slidePlan,
    setSlidePlan,
    updateSlidePlanItem,
    addSlidePlanItem,
    removeSlidePlanItem,
    reorderSlidePlanItem,
    selectedDeliveryFormats,
    deliveryContent,
    setSelectedDeliveryFormats,
    setCurrentPhase,
  } = useCurriculumStore();

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [view, setView] = useState<Phase5View>(
    slidePlan ? "other-formats" : "slide-plan"
  );

  if (!courseInfo || modules.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          Please complete Phase 4 first.
        </p>
        <Button onClick={() => router.push("/design/phase-4")}>
          Go to Phase 4
        </Button>
      </div>
    );
  }

  // --- Slide Plan handlers ---
  const handleGenerateSlidePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch(apiUrl("/api/curriculum/slide-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseInfo, modules, difficultyCalibrations }),
      });
      if (!res.ok) throw new Error("Failed to generate slide plan");
      const data = await res.json();
      setSlidePlan(data.modules as ModuleSlidePlan[]);
    } catch (err) {
      console.error("Slide plan error:", err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleAddSlide = (moduleIndex: number) => {
    const newSlide: SlidePlanItem = {
      id: generateId(),
      title: "New Slide",
      bulletPoints: [""],
      slideType: "concept",
      enabled: true,
      teachingNotes: "",
    };
    addSlidePlanItem(moduleIndex, newSlide);
    setEditingSlideId(newSlide.id);
  };

  const handleConfirmSlidePlan = () => {
    setView("other-formats");
  };

  // --- Delivery format handlers ---
  const toggleFormat = (format: DeliveryFormat) => {
    const current = selectedDeliveryFormats;
    if (current.includes(format)) {
      setSelectedDeliveryFormats(current.filter((f) => f !== format));
    } else {
      setSelectedDeliveryFormats([...current, format]);
    }
  };

  const handleGenerateTemplates = () => {
    router.push("/design/phase-5/templates?generate=1");
  };

  const handleContinue = () => {
    setCurrentPhase(5);
    router.push("/design/review");
  };

  // ==============================
  // VIEW 1: Slide Plan
  // ==============================
  if (view === "slide-plan") {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Phase 5: Slide Plan</h1>
        <p className="text-muted-foreground mb-8">
          Generate a structured slide outline for each module. Toggle slides
          on/off and review the teaching notes before continuing to other
          delivery formats.
        </p>

        {!slidePlan && (
          <Button
            onClick={handleGenerateSlidePlan}
            disabled={isGeneratingPlan}
            size="lg"
            className="mb-8"
          >
            {isGeneratingPlan
              ? "Generating Slide Plan..."
              : "Generate Slide Plan"}
          </Button>
        )}

        {slidePlan && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Slide Plan ({slidePlan.length}{" "}
                {slidePlan.length === 1 ? "module" : "modules"},{" "}
                {slidePlan.reduce((sum, m) => sum + m.slides.length, 0)} slides
                total)
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSlidePlan}
                disabled={isGeneratingPlan}
              >
                {isGeneratingPlan ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground -mt-4">
              Click the pencil icon to edit a slide. Use arrows to reorder, or
              add slides with the button below each module.
            </p>

            <Accordion type="multiple" className="space-y-2">
              {slidePlan.map((modulePlan) => {
                const enabledCount = modulePlan.slides.filter(
                  (s) => s.enabled
                ).length;
                return (
                  <AccordionItem
                    key={modulePlan.moduleIndex}
                    value={`module-${modulePlan.moduleIndex}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-sm font-medium">
                      <span className="flex items-center gap-2">
                        Module {modulePlan.moduleIndex + 1}:{" "}
                        {modulePlan.moduleName}
                        <span className="text-xs text-muted-foreground font-normal">
                          ({enabledCount}/{modulePlan.slides.length} slides)
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 py-2">
                        {modulePlan.slides.map((slide, slideIdx) => (
                          <SlideCard
                            key={slide.id}
                            slide={slide}
                            slideIdx={slideIdx}
                            totalSlides={modulePlan.slides.length}
                            isEditing={editingSlideId === slide.id}
                            onToggleEdit={() =>
                              setEditingSlideId(
                                editingSlideId === slide.id ? null : slide.id
                              )
                            }
                            onUpdate={(updates) =>
                              updateSlidePlanItem(
                                modulePlan.moduleIndex,
                                slide.id,
                                updates
                              )
                            }
                            onRemove={() =>
                              removeSlidePlanItem(
                                modulePlan.moduleIndex,
                                slide.id
                              )
                            }
                            onMoveUp={() =>
                              reorderSlidePlanItem(
                                modulePlan.moduleIndex,
                                slideIdx,
                                slideIdx - 1
                              )
                            }
                            onMoveDown={() =>
                              reorderSlidePlanItem(
                                modulePlan.moduleIndex,
                                slideIdx,
                                slideIdx + 1
                              )
                            }
                          />
                        ))}
                      </div>

                      {/* Add slide button */}
                      <button
                        onClick={() => handleAddSlide(modulePlan.moduleIndex)}
                        className="mt-3 w-full rounded-lg border-2 border-dashed py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        + Add Slide
                      </button>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <Button onClick={handleConfirmSlidePlan} size="lg">
              Confirm Slide Plan & Continue
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ==============================
  // VIEW 2: Other Delivery Formats
  // ==============================
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Phase 5: Other Formats</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView("slide-plan")}
        >
          {"← Edit Slide Plan"}
        </Button>
      </div>
      <p className="text-muted-foreground mb-8">
        Select additional delivery formats and generate ready-to-use templates.
        Click any card to select it.
      </p>

      {/* Discipline-specific formats */}
      {(() => {
        const area = courseInfo?.area ?? "other";
        const recommendedFormats = DISCIPLINE_FORMATS[area] ?? [];
        const recommendedOptions = disciplineDeliveryOptions.filter((o) =>
          recommendedFormats.includes(o.value)
        );

        return recommendedOptions.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-1">
              Recommended for {AREA_LABELS[area]}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Discipline-specific formats tailored to your subject area. Click any card to select it.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
              {recommendedOptions.map((option) => {
                const isSelected = selectedDeliveryFormats.includes(option.value);
                const Illustration = FORMAT_ILLUSTRATIONS[option.value];
                return (
                  <FormatCard
                    key={option.value}
                    option={option}
                    isSelected={isSelected}
                    Illustration={Illustration}
                    onToggle={() => toggleFormat(option.value)}
                  />
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* Universal delivery formats */}
      <h2 className="text-lg font-semibold mb-1">Universal Formats</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Standard delivery formats that work across all disciplines.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {deliveryOptions.map((option) => {
          const isSelected = selectedDeliveryFormats.includes(option.value);
          const Illustration = FORMAT_ILLUSTRATIONS[option.value];
          return (
            <FormatCard
              key={option.value}
              option={option}
              isSelected={isSelected}
              Illustration={Illustration}
              onToggle={() => toggleFormat(option.value)}
            />
          );
        })}
      </div>

      <div className="flex gap-3 items-center mb-8">
        <Button
          onClick={handleGenerateTemplates}
          disabled={selectedDeliveryFormats.length === 0}
          size="lg"
        >
          Generate Templates
        </Button>

        {deliveryContent && (
          <>
            <Button
              variant="outline"
              onClick={() => router.push("/design/phase-5/templates")}
            >
              {"View Generated Templates ->"}
            </Button>
            <Button onClick={handleContinue} size="lg" variant="outline">
              Continue to Review & Export
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
