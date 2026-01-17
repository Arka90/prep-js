"use client";

import { useState } from 'react';
import { Flashcard } from '@/types';
import { CodeSnippet } from '@/components/ui/CodeSnippet';
import { ChevronRight, RotateCw, CheckCircle, XCircle, Brain } from 'lucide-react';

interface FlashcardCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashcardCard({ card, isFlipped, onFlip }: FlashcardCardProps) {
  
  // Dynamic color storage based on type
  const typeColors = {
    misconception_breaker: 'bg-orange-500/10 border-orange-500/50 text-orange-400',
    prediction: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    contrast: 'bg-purple-500/10 border-purple-500/50 text-purple-400',
    edge_case: 'bg-red-500/10 border-red-500/50 text-red-400',
  };

  const typeLabels = {
    misconception_breaker: 'Misconception Breaker',
    prediction: 'Output Prediction',
    contrast: 'Contrast & Compare',
    edge_case: 'Edge Case Alert',
  };

  return (
    <div 
      className="w-full aspect-[3/2] relative perspective-1000 cursor-pointer group"
      onClick={onFlip}
    >
      <div className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-2xl rounded-xl border border-gray-800 ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-gray-900 rounded-xl p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${typeColors[card.card_type]}`}>
              <Brain className="w-3 h-3 mr-2" />
              {typeLabels[card.card_type]}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-100">
              {card.front_content.question_text}
            </h3>

            {card.front_content.code_snippet && (
              <div className="my-4">
                 <CodeSnippet code={card.front_content.code_snippet} language="javascript" />
              </div>
            )}
            
            {card.front_content.options && (
                <ul className="space-y-2 mt-4">
                    {card.front_content.options.map((opt, i) => (
                        <li key={i} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-sm">
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
          </div>

          <div className="text-center mt-6 text-gray-500 text-sm flex items-center justify-center animate-pulse">
            <RotateCw className="w-4 h-4 mr-2" />
            Click to flip
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden bg-gray-900 rounded-xl p-8 rotate-y-180 border border-gray-700 flex flex-col justify-between overflow-y-auto">
           <div className="space-y-6">
             <div className="border-b border-gray-800 pb-4">
                <h4 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-2">The Concept</h4>
                <p className="text-lg font-medium text-white">{card.concept_name}</p>
                <p className="text-gray-400 text-sm">{card.concept_description}</p>
             </div>

             <div>
                <h4 className="text-sm uppercase tracking-wider text-green-400 font-semibold mb-2">Detailed Explanation</h4>
                <p className="text-gray-300 leading-relaxed">
                    {card.back_content.explanation}
                </p>
             </div>

             {card.back_content.expected_output && (
                 <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                    <span className="text-xs text-gray-500 block mb-1">Correct Output:</span>
                    <code className="text-green-400 font-mono text-sm">{card.back_content.expected_output}</code>
                 </div>
             )}
             
             <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <span className="text-xs text-blue-400 block mb-1 uppercase font-bold">Mental Model</span>
                <p className="text-blue-200 italic">"{card.back_content.correct_mental_model}"</p>
             </div>
           </div>
        </div>

      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
