"use client";

import { useEffect, useState } from 'react';
import { Flashcard, FlashcardConfidence } from '@/types';
import { FlashcardCard } from './FlashcardCard';
import { X, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface FlashcardModalProps {
  cards: Flashcard[];
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onComplete: () => void;
  startIndex?: number;
}

export function FlashcardModal({ cards: initialCards, isOpen, onClose, userId, onComplete, startIndex = 0 }: FlashcardModalProps) {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCards(initialCards); 
    setCurrentIndex(startIndex);
    setIsFlipped(false);
  }, [initialCards, isOpen, startIndex]);

  if (!isOpen || !mounted) return null;

  const currentCard = cards[currentIndex];
  // If no cards or index out of bounds, close
  if (!currentCard) return null;

  const handleRate = async (rating: FlashcardConfidence) => {
    // Optimistic progress
    if (rating === 'confident') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    try {
        await fetch('/api/flashcards/review', {
            method: 'POST',
            body: JSON.stringify({ userId, flashcardId: currentCard.id, rating })
        });
    } catch {
        toast.error("Failed to save progress");
    }

    if (currentIndex >= cards.length - 1) {
        onComplete();
        onClose();
    } else {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
    }
  };

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
       <button 
         onClick={onClose}
         className="absolute top-6 right-6 p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white transition"
       >
         <X className="w-6 h-6" />
       </button>

       <div className="w-full max-w-5xl flex flex-col items-center">
            <div className="mb-6 w-full flex justify-between items-center text-gray-400 text-sm">
                <span>{currentCard.topic}</span>
                <span>{currentIndex + 1} / {cards.length}</span>
            </div>

            <FlashcardCard 
                card={currentCard} 
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
            />

            {/* Controls */}
            <div className={`mt-8 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                 <div className="flex gap-4">
                     <button
                        onClick={() => handleRate('not_confident')}
                         className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl hover:bg-red-500/20 font-semibold transition hover:scale-105"
                     >
                        Wait, I forgot
                     </button>
                     <button
                        onClick={() => handleRate('somewhat_confident')}
                         className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 rounded-xl hover:bg-yellow-500/20 font-semibold transition hover:scale-105"
                     >
                         Kind of
                     </button>
                     <button
                        onClick={() => handleRate('confident')}
                         className="px-6 py-3 bg-green-500/10 border border-green-500/50 text-green-500 rounded-xl hover:bg-green-500/20 font-semibold transition hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                     >
                        I know this! 🚀
                     </button>
                 </div>
            </div>
            
            {!isFlipped && (
                <p className="mt-8 text-gray-500 animate-pulse text-sm">Click card to reveal answer</p>
            )}
       </div>
    </div>
  );

  return createPortal(
    <>
        {content}
        <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
    </>
  , document.body);
}
