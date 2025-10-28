import React from "react";

interface TimeSlotProps {
  time: string;
  reserved: boolean;
  onReserve: () => void;
  canReserve: boolean;
}

export default function TimeSlot({
  time,
  reserved,
  canReserve,
  onReserve,
}: TimeSlotProps) {
  const isDisabled = !canReserve && !reserved;

  return (
    <div
      className={`flex justify-between items-center p-6 rounded-2xl transition-all ${
        reserved
          ? "bg-white border-2 border-green-500"
          : isDisabled
          ? "bg-gray-100 opacity-60"
          : "bg-white"
      }`}
    >
      <span
        className={`text-3xl font-bold ${
          reserved
            ? "text-green-600"
            : isDisabled
            ? "text-gray-400"
            : "text-gray-900"
        }`}
      >
        {time}
      </span>
      <button
        onClick={onReserve}
        disabled={isDisabled || reserved}
        className={`px-6 py-2 rounded-full font-medium transition-all ${
          reserved
            ? "border-2 border-green-500 text-green-600 bg-white cursor-default"
            : isDisabled
            ? "border-2 border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
            : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50 cursor-pointer"
        }`}
      >
        {reserved ? "Reserved!" : isDisabled ? "Reserve" : "Reserve"}
      </button>
    </div>
  );
}
