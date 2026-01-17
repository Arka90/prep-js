"use client";

import { useEffect, useState } from 'react';
import { TopicGrid } from './TopicGrid';
import { Flashcard } from '@/types';
import { Loader2 } from 'lucide-react';

export function FlashcardDeckLoader() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Effect 1: Load User ID from local storage
    const storedUser = localStorage.getItem('auth-storage');
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            if (parsed.state && parsed.state.userId) {
                setUserId(parsed.state.userId);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error("Failed to parse user", e);
            setLoading(false);
        }
    } else {
        setLoading(false);
    }
  }, []);

  const fetchCards = async () => {
    if (!userId) return;
    try {
      console.log('Fetching flashcards for user:', userId);
      const res = await fetch(`/api/flashcards?userId=${userId}`);
      
      if (!res.ok) {
          console.error('Fetch failed:', res.status, res.statusText);
          const text = await res.text();
          console.error('Error details:', text);
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Flashcards data:', data);
      setCards(data.flashcards || []);
    } catch (error) {
      console.error('Error in fetchCards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Effect 2: Fetch Cards
    fetchCards();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!userId) {
     return (
         <div className="text-center py-20">
             <p className="text-gray-400">Please log in to view your flashcards.</p>
         </div>
     );
  }

  return <TopicGrid cards={cards} userId={userId} onRefresh={fetchCards} />;
}
