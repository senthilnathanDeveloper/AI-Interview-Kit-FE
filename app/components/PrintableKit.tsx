'use client';

import React from 'react';
import { Printer } from 'lucide-react';

interface PrintableKitProps {
  kit: any;
}

export default function PrintableKit({ kit }: PrintableKitProps) {
  if (!kit) return null;

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto rounded-xl shadow-xl my-6">
      <div className="flex justify-between items-center border-b pb-4 mb-6 no-print">
        <h2 className="text-xl font-bold text-gray-800">Printable Executive Summary</h2>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="space-y-6 text-sm">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{kit.role.title}</h1>
          <p className="text-gray-600 font-semibold">{kit.source.company} • {kit.role.seniority} Level</p>
          <p className="text-xs text-gray-500 mt-1">Generated on {new Date(kit.source.researched_at).toLocaleDateString()} for {kit.schedule.days_available}-Day Prep</p>
        </div>

        {/* Company Brief */}
        <div>
          <h3 className="font-bold uppercase text-xs text-gray-500 tracking-wider mb-1">Company Overview</h3>
          <p className="text-gray-800">{kit.company_brief.summary}</p>
        </div>

        {/* Key Requirements */}
        <div>
          <h3 className="font-bold uppercase text-xs text-gray-500 tracking-wider mb-2">Key Job Requirements</h3>
          <ul className="grid grid-cols-2 gap-2">
            {kit.role.requirements.map((r: any) => (
              <li key={r.id} className="p-2 bg-gray-50 rounded border text-xs">
                <span className={`font-bold mr-1 ${r.priority === 'must' ? 'text-red-600' : 'text-blue-600'}`}>
                  [{r.priority.toUpperCase()}]
                </span>
                {r.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Questions Summary */}
        <div>
          <h3 className="font-bold uppercase text-xs text-gray-500 tracking-wider mb-2">Targeted Question Bank</h3>
          <div className="space-y-3">
            {kit.questions.slice(0, 6).map((q: any, idx: number) => (
              <div key={q.id} className="p-3 border rounded-lg bg-gray-50">
                <p className="font-bold text-gray-900">{idx + 1}. [{q.category}] {q.prompt}</p>
                <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">{q.answer_outline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="font-bold uppercase text-xs text-gray-500 tracking-wider mb-2">Day-by-Day Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {kit.schedule.days.map((d: any) => (
              <div key={d.day} className="p-2 border rounded text-xs bg-gray-50">
                <p className="font-bold">Day {d.day}: {d.focus}</p>
                <p className="text-gray-600">{d.minutes} Minutes • {d.question_ids.length} Questions</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
