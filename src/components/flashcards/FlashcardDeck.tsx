"use client";

import { useState } from 'react';
import { Flashcard, FlashcardConfidence } from '@/types';
import { FlashcardCard } from './FlashcardCard';
import { useRouter } from 'next/navigation';
import { Check, X, HelpCircle, Trophy, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface FlashcardDeckProps {
  cards: Flashcard[];
  userId: string;
}

export function FlashcardDeck({ cards: initialCards, userId }: FlashcardDeckProps) {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const router = useRouter();

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;

  const handleRate = async (rating: FlashcardConfidence) => {
    try {
      // Optimistic update - move to next card immediately
      const currentCardId = currentCard.id;
      
      // Submit review in background
      fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, flashcardId: currentCardId, rating }),
      }).then(res => {
          if(!res.ok) toast.error("Failed to save progress");
      });

      if (isLastCard) {
        setIsFinishing(true);
        // Show completion state
      } else {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => prev + 1), 150); // slight delay for animation
      }

    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const [isBackfilling, setIsBackfilling] = useState(false);

  const handleBackfill = async () => {
    setIsBackfilling(true);
    toast.loading("Analyzing past mistakes...", { id: 'backfill' });
    try {
        const res = await fetch('/api/flashcards/backfill', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        
        if (data.success) {
            toast.success(`Generated ${data.count} new cards!`, { id: 'backfill' });
            setTimeout(() => window.location.reload(), 1500);
        } else {
            toast.error("Failed to analyze history", { id: 'backfill' });
            setIsBackfilling(false);
        }
    } catch (e) {
        toast.error("Error connecting to server", { id: 'backfill' });
        setIsBackfilling(false);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
         <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-8 h-8 text-yellow-500" />
         </div>
         <h2 className="text-2xl font-bold text-white mb-2">All Caught Up!</h2>
         <p className="text-gray-400 mb-8">No flashcards due for review.</p>
         
         <div className="flex flex-col gap-4 items-center">
             <button onClick={() => router.push('/')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition">
                Go Home
             </button>
             
             <button 
                onClick={handleBackfill}
                disabled={isBackfilling}
                className="text-sm text-gray-500 hover:text-gray-300 underline disabled:opacity-50"
             >
                {isBackfilling ? "Analyzing..." : "Analyze past quiz mistakes for new cards"}
             </button>
         </div>
      </div>
    );
  }

  if (isFinishing) {
    return (
      <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
         <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
            <Check className="w-10 h-10 text-green-500" />
         </div>
         <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
         <p className="text-gray-400 mb-8">You've reviewed {cards.length} cards today.</p>
         <div className="flex gap-4 justify-center">
            <button onClick={() => router.push('/')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition">
                Back to Dashboard
            </button>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition flex items-center">
                Review Again <ArrowRight className="w-4 h-4 ml-2" />
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center text-sm text-gray-400">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <span>{Math.round(((currentIndex) / cards.length) * 100)}% Complete</span>
      </div>

      <div className="mb-8">
        <FlashcardCard 
            card={currentCard} 
            isFlipped={isFlipped} 
            onFlip={() => setIsFlipped(!isFlipped)} 
        />
      </div>

      {/* Controls - Only show when flipped */}
      <div className={`transition-all duration-500 transform ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex justify-center gap-4">
             <button 
                onClick={() => handleRate('not_confident')}
                className="flex flex-col items-center gap-2 p-4 w-32 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-xl transition text-red-400 hover:scale-105"
             >
                <X className="w-6 h-6" />
                <span className="text-xs font-semibold">Not Confident</span>
             </button>

             <button 
                onClick={() => handleRate('somewhat_confident')}
                className="flex flex-col items-center gap-2 p-4 w-32 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 rounded-xl transition text-yellow-400 hover:scale-105"
             >
                <HelpCircle className="w-6 h-6" />
                <span className="text-xs font-semibold">Somewhat</span>
             </button>

             <button 
                onClick={() => handleRate('confident')}
                className="flex flex-col items-center gap-2 p-4 w-32 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 rounded-xl transition text-green-400 hover:scale-105"
             >
                <Check className="w-6 h-6" />
                <span className="text-xs font-semibold">Confident</span>
             </button>
        </div>
        <p className="text-center text-gray-600 mt-6 text-sm">Rate your confidence to continue</p>
      </div>
    </div>
  );
}
