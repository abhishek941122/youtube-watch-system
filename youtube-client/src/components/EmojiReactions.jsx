import React, { useRef } from 'react';

const EMOJI_LIST = [
  { emoji: '👍', label: 'thumbs up' },
  { emoji: '❤️', label: 'heart' },
  { emoji: '😂', label: 'laughing' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '👏', label: 'clapping' },
  { emoji: '😮', label: 'surprised' },
];

export const ReactionsBar = ({ onReact }) => {
  const lastClickRef = useRef(0);

  const handleEmojiClick = (emoji) => {
    const now = Date.now();
    // Throttle clicks to prevent spamming (300ms cooldown)
    if (now - lastClickRef.current < 300) return;
    lastClickRef.current = now;

    if (onReact) {
      onReact(emoji);
    }
  };

  return (
    <div className="w-full flex items-center justify-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-block select-none">
        Reactions
      </span>
      <div className="flex items-center gap-2 sm:gap-3">
        {EMOJI_LIST.map(({ emoji, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-lg sm:text-xl flex items-center justify-center transition-all duration-200 hover:scale-125 active:scale-95 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 cursor-pointer select-none"
            aria-label={`React with ${label}`}
            title={`React with ${label}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export const FloatingReactionsOverlay = ({ reactions = [] }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((item) => (
        <div
          key={item.id}
          style={{ left: `${item.xOffset}%`, bottom: '15%' }}
          className="absolute flex flex-col items-center animate-float-up pointer-events-none select-none"
        >
          <div className="text-3xl sm:text-4xl filter drop-shadow-xl transform hover:scale-110">
            {item.emoji}
          </div>
          {item.username && (
            <span className="text-[10px] font-bold text-slate-200 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800/90 shadow-md mt-0.5 truncate max-w-[90px]">
              {item.username}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default {
  ReactionsBar,
  FloatingReactionsOverlay,
};
