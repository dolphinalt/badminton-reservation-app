import React from 'react';

interface CourtTabsProps {
  selectedCourt: number;
  setSelectedCourt: (court: number) => void;
}

export default function CourtTabs({ selectedCourt, setSelectedCourt }: CourtTabsProps) {
  const courts = [1, 2, 3];

  return (
    <div className="flex gap-4 mb-6">
      {courts.map(court => (
        <button
          key={court}
          onClick={() => setSelectedCourt(court)}
          className={`px-8 py-3 rounded-2xl font-semibold transition-all ${
            selectedCourt === court
              ? 'bg-teal-600 text-white'
              : 'bg-transparent text-gray-900'
          }`}
        >
          Court {court}
        </button>
      ))}
    </div>
  );
}