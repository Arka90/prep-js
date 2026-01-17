"use client";

import { useMemo, useState } from 'react';
import { Flashcard } from '@/types';
import { FlashcardModal } from './FlashcardModal';
import { Trophy, AlertCircle, BookOpen, Star, RefreshCw } from 'lucide-react';

interface TopicGridProps {
  cards: Flashcard[];
  userId: string;
  onRefresh: () => void;
}

export function TopicGrid({ cards, userId, onRefresh }: TopicGridProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'topics' | 'cards'>('topics');
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  // Group cards by topic
  const topics = useMemo(() => {
    const groups: Record<string, Flashcard[]> = {};
    cards.forEach(card => {
        const t = card.topic || 'General';
        if (!groups[t]) groups[t] = [];
        groups[t].push(card);
    });
    
    // Sort topics by "Attention Needed" (lowest avg confidence first)
    return Object.entries(groups).sort(([, aCards], [, bCards]) => {
        const avgA = aCards.reduce((acc, c) => acc + c.confidence_level, 0) / aCards.length;
        const avgB = bCards.reduce((acc, c) => acc + c.confidence_level, 0) / bCards.length;
        if (avgA === avgB) return bCards.length - aCards.length;
        return avgA - avgB;
    });
  }, [cards]);

  const activeTopicCards = useMemo(() => {
      if (!selectedTopic) return [];
      return topics.find(([t]) => t === selectedTopic)?.[1] || [];
  }, [selectedTopic, topics]);

  const handleTopicClick = (topic: string) => {
      setSelectedTopic(topic);
      setViewMode('cards');
  };

  const handleCardClick = (index: number) => {
      setModalStartIndex(index);
      setIsModalOpen(true);
  };

  const handleBackfill = async () => {
        setIsBackfilling(true);
        try {
            await fetch('/api/flashcards/backfill', {
                method: 'POST',
                body: JSON.stringify({ userId }),
            });
            setTimeout(() => window.location.reload(), 2000);
        } catch {
            setIsBackfilling(false);
        }
  };

  if (cards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-500">
             <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
                <Trophy className="w-24 h-24 text-yellow-500 relative z-10 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
             </div>
             <h2 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent mb-4">
                 All Concept Damage Repaired!
             </h2>
             <p className="text-gray-400 max-w-md mb-8">
                 You have no active misconceptions pending review. Keep taking quizzes to find new ones!
             </p>
             <button 
                 onClick={handleBackfill}
                 disabled={isBackfilling}
                 className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition border border-gray-700 disabled:opacity-50"
             >
                 {isBackfilling ? <RefreshCw className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                 Scan History for Missed Concepts
             </button>
        </div>
      );
  }

  if (viewMode === 'cards' && selectedTopic) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
                onClick={() => setViewMode('topics')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition group mb-4"
            >
                <div className="p-2 rounded-full bg-gray-800 group-hover:bg-gray-700">
                    <BookOpen className="w-4 h-4 rotate-180" /> 
                </div>
                <span className="font-medium">Back to Topics</span>
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                     <h2 className="text-3xl font-bold text-white mb-2">{selectedTopic}</h2>
                     <p className="text-gray-400">{activeTopicCards.length} cards in this deck</p>
                </div>
                <button 
                    onClick={() => handleCardClick(0)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition hover:scale-105"
                >
                    Review All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTopicCards.map((card, index) => (
                    <div 
                        key={card.id}
                        onClick={() => handleCardClick(index)}
                        className="group p-5 bg-gray-900/50 border border-gray-800 rounded-2xl hover:bg-gray-800 hover:border-gray-700 transition cursor-pointer relative overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full z-0 pointer-events-none" />
                         
                         <div className="relative z-10">
                            <div className="mb-3">
                                <span className={`inline-block px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider
                                    ${card.card_type === 'misconception_breaker' ? 'bg-orange-900/30 text-orange-400' :
                                      card.card_type === 'prediction' ? 'bg-blue-900/30 text-blue-400' :
                                      card.card_type === 'contrast' ? 'bg-purple-900/30 text-purple-400' :
                                      'bg-red-900/30 text-red-400'
                                    }
                                `}>
                                    {card.card_type.replace('_', ' ')}
                                </span>
                            </div>
                            
                            <h4 className="text-lg font-semibold text-gray-200 mb-4 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                {card.concept_name}
                            </h4>

                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        card.confidence_level < 2 ? 'bg-red-500' :
                                        card.confidence_level > 4 ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${(card.confidence_level / 5) * 100}%` }}
                                />
                            </div>
                         </div>
                    </div>
                ))}
            </div>

            <FlashcardModal 
                cards={activeTopicCards}
                startIndex={modalStartIndex} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                userId={userId}
                onComplete={() => {
                     onRefresh();
                     setIsModalOpen(false);
                }}
            />
        </div>
      );
  }


  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map(([topic, topicCards], index) => {
                const count = topicCards.length;
                // Calculate "Health" (0-5 scale avg)
                const avgConf = topicCards.reduce((acc, c) => acc + c.confidence_level, 0) / count;
                const isWeak = avgConf < 2;
                const isStrong = avgConf > 4;

                return (
                    <div 
                        key={topic}
                        onClick={() => handleTopicClick(topic)}
                        className={`
                            relative group cursor-pointer p-6 rounded-3xl border transition-all duration-500 hover:-translate-y-2
                            backdrop-blur-xl overflow-hidden
                            ${isWeak 
                                ? 'bg-gradient-to-br from-red-500/10 via-red-900/20 to-black border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:shadow-[0_0_50px_rgba(220,38,38,0.4)]' 
                                : isStrong
                                ? 'bg-gradient-to-br from-green-500/10 via-green-900/20 to-black border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:shadow-[0_0_50px_rgba(34,197,94,0.3)] hover:border-green-400/50'
                                : 'bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black border-gray-700 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                            }
                        `}
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full z-0 pointer-events-none" />

                        {isWeak && (
                            <div className="absolute top-4 left-4 bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse z-10">
                                <AlertCircle className="w-3 h-3" /> Critical
                            </div>
                        )}
                        
                        <div className="relative z-10">
                            <div className={`flex justify-between items-start mb-6 ${isWeak ? 'mt-8' : ''}`}>
                                <div className={`p-4 rounded-2xl shadow-inner ${
                                    isWeak ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-red-900/50' : 
                                    isStrong ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-green-900/50' :
                                    'bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-blue-900/50'
                                }`}>
                                    {isWeak ? <AlertCircle className="w-6 h-6" /> : isStrong ? <Star className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                                </div>
                                <div className="text-right">
                                    <span className="block text-3xl font-black text-white tracking-tight">{count}</span>
                                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Cards</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-100 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                                {topic}
                            </h3>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className={isWeak ? 'text-red-400' : isStrong ? 'text-green-400' : 'text-blue-400'}>
                                        {isWeak ? 'Needs Repair' : isStrong ? 'Mastered' : 'Progress'}
                                    </span>
                                    <span className="text-gray-400">{Math.round((avgConf/5)*100)}%</span>
                                </div>
                                {/* Stylish Progress Bar */}
                                <div className="w-full h-2 bg-gray-900/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden group-hover:brightness-125
                                            ${isWeak ? 'bg-gradient-to-r from-red-600 to-orange-500' : 
                                              isStrong ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 
                                              'bg-gradient-to-r from-blue-600 to-cyan-400'}`
                                        } 
                                        style={{ width: `${(avgConf / 5) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
}
