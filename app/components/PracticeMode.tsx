'use client';

import React, { useState, useMemo } from 'react';
import { RotateCw, CheckCircle, AlertTriangle, HelpCircle, ChevronRight, ChevronLeft, Award, RefreshCw } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
}

interface PracticeModeProps {
  flashcards: Flashcard[];
  initialConfidences?: Record<string, 'easy' | 'medium' | 'hard'>;
  onSaveProgress: (confidences: Record<string, 'easy' | 'medium' | 'hard'>) => void;
}

export default function PracticeMode({ flashcards, initialConfidences = {}, onSaveProgress }: PracticeModeProps) {
  const [confidences, setConfidences] = useState<Record<string, 'easy' | 'medium' | 'hard'>>(initialConfidences);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Spec Rule: "Order the next session by what they were least confident about"
  const sortedFlashcards = useMemo(() => {
    const cards = [...flashcards];
    cards.sort((a, b) => {
      const confA = confidences[a.id];
      const confB = confidences[b.id];
      const score = (c?: 'easy' | 'medium' | 'hard') => {
        if (!c) return 0; // Unpracticed comes first
        if (c === 'hard') return 1;
        if (c === 'medium') return 2;
        return 3; // easy last
      };
      return score(confA) - score(confB);
    });
    return cards;
  }, [flashcards, confidences]);

  if (sortedFlashcards.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No flashcards available in this kit.
      </div>
    );
  }

  const currentCard = sortedFlashcards[currentIndex] || sortedFlashcards[0];
  const totalCount = sortedFlashcards.length;
  const practicedCount = Object.keys(confidences).length;
  const percentCovered = Math.round((practicedCount / totalCount) * 100);

  const handleRate = (rating: 'easy' | 'medium' | 'hard') => {
    const updated = { ...confidences, [currentCard.id]: rating };
    setConfidences(updated);
    onSaveProgress(updated);

    setIsFlipped(false);
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Progress & Confidence Header */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            Flashcard Practice Mode
          </h3>
          <p className="text-xs text-gray-400">
            Confidence-weighted deck trainer • Hardest cards repeat first
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="text-gray-300">
            Card <span className="text-indigo-400 font-bold">{currentIndex + 1}</span> of {totalCount}
          </div>
          <div className="w-32 bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${percentCovered}%` }}
            />
          </div>
          <span className="text-indigo-300 font-bold">{percentCovered}% Covered</span>
        </div>
      </div>

      {/* Main Flashcard View */}
      <div className="relative min-h-[280px] perspective-1000">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full min-h-[280px] glass-panel rounded-2xl p-8 border border-indigo-500/30 shadow-2xl cursor-pointer flex flex-col justify-between transition-all duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180 bg-indigo-950/40 border-indigo-500/50' : 'hover:border-indigo-500/50'
          }`}
        >
          {/* Card Front Side */}
          {!isFlipped ? (
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-300 uppercase">
                <span>Question / Concept</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <RotateCw className="w-3.5 h-3.5" /> Click to reveal answer
                </span>
              </div>

              <div className="my-6">
                <p className="text-xl font-bold text-white leading-relaxed">
                  {currentCard.front}
                </p>
              </div>

              {confidences[currentCard.id] && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  Previous confidence:
                  <span className="font-bold uppercase text-indigo-300">
                    {confidences[currentCard.id]}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Card Back Side (Flipped) */
            <div className="flex flex-col justify-between h-full rotate-y-180">
              <div className="text-xs font-mono text-emerald-400 uppercase">
                Answer Outline & Explanation
              </div>

              <div className="my-6">
                <p className="text-base text-gray-200 leading-relaxed whitespace-pre-line">
                  {currentCard.back}
                </p>
              </div>

              <div className="text-xs text-indigo-300 font-semibold">
                Rate your recall confidence below:
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confidence Rating Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
        <button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(Math.max(0, currentIndex - 1));
          }}
          disabled={currentIndex === 0}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRate('hard')}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            Hard (Repeat Soon)
          </button>

          <button
            onClick={() => handleRate('medium')}
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            Medium
          </button>

          <button
            onClick={() => handleRate('easy')}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Easy (Mastered)
          </button>
        </div>

        <button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(Math.min(totalCount - 1, currentIndex + 1));
          }}
          disabled={currentIndex === totalCount - 1}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
