import React from "react";
import TimeSlot from "./TimeSlot.tsx";
import NoTimeSlots from "./NoTimeSlots.tsx";

interface AvailableTimesProps {
  availableTimes: string[];
  isReserved: (time: string) => boolean;
  isReservedByOthers: (time: string) => boolean;
  handleReserve: (time: string) => void;
  canReserve: (time: string) => boolean;
}

export default function AvailableTimes({
  availableTimes,
  isReserved,
  isReservedByOthers,
  handleReserve,
  canReserve,
}: AvailableTimesProps) {
  return (
    <div className="px-6 mt-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Available Times</h2>

      <div className="space-y-4">
        {availableTimes.length > 1 ? (
          availableTimes.map((time) => (
            <TimeSlot
              key={time}
              time={time}
              reserved={isReserved(time)}
              reservedByOthers={isReservedByOthers(time)}
            canReserve={canReserve(time)}
            onReserve={() => handleReserve(time)}
          />
        ))) : <NoTimeSlots />}
      </div>
    </div>
  );
}
