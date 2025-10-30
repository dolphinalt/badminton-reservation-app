import { useEffect } from "react";

interface CourtStatusProps {
  courtStatus: {
    status: string;
    time: string | null;
    color: string;
  };
  onTakeCourt: () => void;
  onAdvanceQueue: () => void;
  hasActiveReservation: boolean;
  hasAnyQueueReservation: boolean;
  isCurrentUserUsingAnyCourt: boolean;
  isCurrentUserUsingThisCourt: boolean;
  isGroupMemberUsingCourt: boolean;
}

export default function CourtStatus({
  courtStatus,
  onTakeCourt,
  onAdvanceQueue,
  hasActiveReservation,
  hasAnyQueueReservation,
  isCurrentUserUsingAnyCourt,
  isCurrentUserUsingThisCourt,
  isGroupMemberUsingCourt,
}: CourtStatusProps) {
  const isCourtOpen = courtStatus.status === "Open";
  const canTakeCourt =
    isCourtOpen &&
    !hasActiveReservation &&
    !hasAnyQueueReservation &&
    !isCurrentUserUsingAnyCourt &&
    !isGroupMemberUsingCourt;

  // Automatically advance queue when timer reaches 0
  useEffect(() => {
    if (courtStatus.time === "0:00" && isCurrentUserUsingThisCourt) {
      onAdvanceQueue();
    }
  }, [courtStatus.time, isCurrentUserUsingThisCourt, onAdvanceQueue]);

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
