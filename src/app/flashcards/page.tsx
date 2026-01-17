"use client";

import { FlashcardDeckLoader } from '@/components/flashcards/FlashcardDeckLoader';
import { Navbar } from "@/components/layout/Navbar";

export default function FlashcardsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
            Concept Repair
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Targeted flashcards to fix recurring misconceptions.
          </p>
        </header>
        
        <FlashcardDeckLoader />
      </main>
    </div>
  );
}
