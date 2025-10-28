import React from "react";
import CourtTabs from "./CourtTabs.tsx";
import CourtStatus from "./CourtStatus.tsx";

interface HeaderProps {
  selectedCourt: number;
  setSelectedCourt: (court: number) => void;
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

export default function Header({
  selectedCourt,
  setSelectedCourt,
  courtStatus,
  onTakeCourt,
  onReleaseCourt,
  hasActiveReservation,
  isCurrentUserUsingAnyCourt,
  isCurrentUserUsingThisCourt,
}: HeaderProps) {
  return (
    <div className="bg-white px-6 pt-8 pb-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Badminton</h1>

      <CourtTabs
        selectedCourt={selectedCourt}
        setSelectedCourt={setSelectedCourt}
      />

      <CourtStatus
        courtStatus={courtStatus}
        onTakeCourt={onTakeCourt}
        onReleaseCourt={onReleaseCourt}
        hasActiveReservation={hasActiveReservation}
        isCurrentUserUsingAnyCourt={isCurrentUserUsingAnyCourt}
        isCurrentUserUsingThisCourt={isCurrentUserUsingThisCourt}
      />
    </div>
  );
}
