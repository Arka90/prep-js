"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlayCircle,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Brain,
  Atom,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore, useThemeStore, useAIProviderStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { AIProvider } from "@/lib/ai-client";

const AI_PROVIDERS: { value: AIProvider; label: string; color: string }[] = [
  {
    value: "openai",
    label: "OpenAI",
    color: "text-green-600 dark:text-green-400",
  },
  {
    value: "anthropic",
    label: "Claude",
    color: "text-purple-600 dark:text-purple-400",
  },
];

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/quiz", label: "JS Quiz", icon: PlayCircle },
  { href: "/react-quiz", label: "React Quiz", icon: Atom },
  { href: "/flashcards", label: "Flashcards", icon: Brain },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { provider, setProvider } = useAIProviderStore();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                PrepJS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* AI Provider Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                AI:
              </span>
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
                    provider === p.value
                      ? `${p.color} bg-white dark:bg-gray-600 shadow-sm`
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                  title={`Use ${p.label}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile AI Provider Selector */}
            <div className="flex items-center gap-2 px-4 py-2 mb-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                AI Provider:
              </span>
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className={`text-sm font-semibold px-3 py-1 rounded-lg border transition-colors ${
                    provider === p.value
                      ? `${p.color} border-current bg-white dark:bg-gray-700`
                      : "text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
