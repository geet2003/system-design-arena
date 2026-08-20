'use client';

import { useCreateSession } from '@/hooks/useAIInterview';

const CATEGORIES = [
  { id: 'Messaging & Chat',   icon: '💬', description: 'WhatsApp, Slack, Discord, Messenger' },
  { id: 'Video & Media',      icon: '▶', description: 'Netflix, TikTok, Twitch, Instagram Stories' },
  { id: 'Payments & Fintech', icon: '💳', description: 'Stripe, PayPal, Venmo, UPI' },
  { id: 'Search & Discovery', icon: '🔍', description: 'Google Search, Twitter Search, Yelp, Airbnb' },
  { id: 'Social Feed',        icon: '📰', description: 'Twitter Feed, Instagram, LinkedIn, Reddit' },
  { id: 'Storage & Files',    icon: '📁', description: 'Dropbox, Google Drive, S3, Google Photos' },
  { id: 'Ride & Delivery',    icon: '🚗', description: 'Uber, DoorDash, Swiggy' },
  { id: 'Gaming & Realtime',  icon: '🎮', description: 'Leaderboard, Chess.com, Live scores, Scheduler' },
];

export function CategoryPicker() {
  const { createSession, isCreating, error } = useCreateSession();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg text-[#1a1a1a]">✦</span>
          <h1 className="text-xs font-bold tracking-widest text-[#1a1a1a]">AI INTERVIEW MODE</h1>
        </div>
        <p className="text-xs text-[#888] leading-relaxed pl-7 max-w-lg">
          Pick a category. Gemini will assign you a question and conduct a real interview —
          no hints, no palette. Just you and the canvas.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => createSession(cat.id)}
            disabled={isCreating}
            className="group text-left px-4 py-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#faf7f2',
              border: '1.5px solid #c9bfa8',
              borderRadius: '2px',
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0ebe0';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#faf7f2';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9bfa8';
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{cat.icon}</span>
              <div>
                <p className="text-xs font-bold tracking-widest text-[#1a1a1a] mb-1">
                  {cat.id.toUpperCase()}
                </p>
                <p className="text-[10px] text-[#888] leading-relaxed">{cat.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isCreating && (
        <p className="mt-6 text-xs font-mono text-[#888] tracking-widest animate-pulse pl-1">
          preparing your interview…
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-4 text-xs font-mono text-red-500 pl-1">{error}</p>
      )}
    </div>
  );
}
