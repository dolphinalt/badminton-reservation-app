import React, { useEffect } from "react";

interface CourtStatusProps {
  courtStatus: {
    status: string;
    time: string | null;
    color: string;
  };
  onTakeCourt: () => void;
  onReleaseCourt: () => void;
  hasActiveReservation: boolean;
  isCurrentUserUsingAnyCourt: boolean;
  isCurrentUserUsingThisCourt: boolean;
}

export default function CourtStatus({
  courtStatus,
  onTakeCourt,
  onReleaseCourt,
  hasActiveReservation,
  isCurrentUserUsingAnyCourt,
  isCurrentUserUsingThisCourt,
}: CourtStatusProps) {
  const isCourtOpen = courtStatus.status === "Open";
  const isCourtInUse = courtStatus.status.includes("In Use");
  const canTakeCourt =
    isCourtOpen && !hasActiveReservation && !isCurrentUserUsingAnyCourt;

  const canReleaseCourt = isCourtInUse && isCurrentUserUsingThisCourt;

  // Automatically release court when timer reaches 0
  useEffect(() => {
    if (courtStatus.time === "0:00" && isCurrentUserUsingThisCourt) {
      console.log("Timer reached 0, automatically releasing court");
      onReleaseCourt();
    }
  }, [courtStatus.time, isCurrentUserUsingThisCourt, onReleaseCourt]);

  return (
    <div className="flex justify-between items-center">
      <span className={`text-2xl font-semibold ${courtStatus.color}`}>
        {courtStatus.status}
      </span>
      {courtStatus.time && (
        <span className="text-2xl font-semibold text-teal-600">
          {courtStatus.time}
        </span>
      )}
      {isCourtOpen && (
        <button
          onClick={canTakeCourt ? onTakeCourt : undefined}
          disabled={!canTakeCourt}
          className={`px-6 py-2 border-2 rounded-full font-medium transition-colors ${
            canTakeCourt
              ? "border-teal-600 text-teal-600 hover:bg-teal-50 cursor-pointer"
              : "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
          }`}
        >
          {canTakeCourt ? "Take" : "Take"}
        </button>
      )}
    </div>
  );
}
