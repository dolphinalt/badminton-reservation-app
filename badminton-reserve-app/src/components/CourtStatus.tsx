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

      {canReleaseCourt && (
        <button
          onClick={onReleaseCourt}
          className="px-6 py-2 border-2 border-red-600 text-red-600 rounded-full font-medium hover:bg-red-50 transition-colors"
        >
          Release
        </button>
      )}
    </div>
  );
}
