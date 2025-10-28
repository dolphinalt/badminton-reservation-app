import React from "react";

interface TimeSlotProps {
  time: string;
  reserved: boolean;
  reservedByOthers: boolean;
  onReserve: () => void;
  canReserve: boolean;
}

export default function TimeSlot({
  time,
  reserved,
  reservedByOthers,
  canReserve,
  onReserve,
}: TimeSlotProps) {
  const isDisabled = !canReserve;

  return (
    <div
      className={`flex justify-between items-center p-6 rounded-2xl transition-all ${
        reserved
          ? "bg-white border-2 border-green-500"
          : reservedByOthers
          ? "bg-gray-100 border-2 border-gray-300 opacity-60"
          : isDisabled
          ? "bg-gray-100 opacity-60"
          : "bg-white"
      }`}
    >
      <span
        className={`text-3xl font-bold ${
          reserved
            ? "text-green-600"
            : reservedByOthers
            ? "text-gray-500"
            : isDisabled
            ? "text-gray-400"
            : "text-gray-900"
        }`}
      >
        {time}
      </span>
      <button
        onClick={onReserve}
        disabled={isDisabled}
        className={`px-6 py-2 rounded-full font-medium transition-all ${
          reserved
            ? "border-2 border-green-600 text-green-600 hover:bg-red-50 hover:border-red-500 hover:text-red-500 cursor-pointer"
            : reservedByOthers
            ? "border-2 border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
            : isDisabled
            ? "border-2 border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
            : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50 cursor-pointer"
        }`}
      >
        {reserved
          ? "Reserved"
          : reservedByOthers
          ? "Taken"
          : isDisabled
          ? "Reserve"
          : "Reserve"}
      </button>
    </div>
  );
}
