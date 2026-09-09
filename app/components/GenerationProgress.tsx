'use client';

import React from 'react';
import { CheckCircle2, Loader2, Search, FileCode2, ShieldCheck, CalendarCheck, RefreshCw } from 'lucide-react';

interface GenerationProgressProps {
  currentStage: string;
  message: string;
}

const STAGES = [
  { id: 'CRAWLING', label: 'Crawl Company Site', icon: Search },
  { id: 'PUBLIC_SEARCH', label: 'Search Public Discussions', icon: Search },
  { id: 'EXTRACTING_REQUIREMENTS', label: 'Extract Requirements', icon: FileCode2 },
  { id: 'COVERAGE_CHECK', label: 'First Pass Coverage Check', icon: ShieldCheck },
  { id: 'SECOND_PASS', label: 'Second Pass Coverage Loop', icon: RefreshCw },
  { id: 'ALLOCATING_SCHEDULE', label: 'Allocate Study Schedule', icon: CalendarCheck },
  { id: 'VALIDATING', label: 'Validate Kit Schema', icon: ShieldCheck }
];

export default function GenerationProgress({ currentStage, message }: GenerationProgressProps) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="w-full glass-panel rounded-2xl p-6 shadow-2xl border border-indigo-500/30 my-6 animate-pulse-subtle">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        <div>
          <h3 className="text-lg font-bold text-white">Generating Interview Prep Kit...</h3>
          <p className="text-xs text-indigo-300 font-mono mt-0.5">{message}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
        {STAGES.map((st, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = st.icon;

          return (
            <div
              key={st.id}
              className={`p-3 rounded-xl border text-center transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 ring-2 ring-indigo-500/30'
                  : 'bg-slate-900/40 border-white/5 text-gray-500'
              }`}
            >
              <div className="flex justify-center mb-1">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 opacity-50" />
                )}
              </div>
              <p className="text-[11px] font-semibold leading-tight">{st.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
