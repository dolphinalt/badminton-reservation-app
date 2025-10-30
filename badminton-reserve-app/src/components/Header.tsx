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
  onAdvanceQueue: () => void;
  hasActiveReservation: boolean;
  hasAnyQueueReservation: boolean;
  isCurrentUserUsingAnyCourt: boolean;
  isCurrentUserUsingThisCourt: boolean;
  isGroupMemberUsingCourt: boolean;
}

export default function Header({
  selectedCourt,
  setSelectedCourt,
  courtStatus,
  onTakeCourt,
  onAdvanceQueue,
  hasActiveReservation,
  hasAnyQueueReservation,
  isCurrentUserUsingAnyCourt,
  isCurrentUserUsingThisCourt,
  isGroupMemberUsingCourt,
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
        onAdvanceQueue={onAdvanceQueue}
        hasActiveReservation={hasActiveReservation}
        hasAnyQueueReservation={hasAnyQueueReservation}
        isCurrentUserUsingAnyCourt={isCurrentUserUsingAnyCourt}
        isCurrentUserUsingThisCourt={isCurrentUserUsingThisCourt}
        isGroupMemberUsingCourt={isGroupMemberUsingCourt}
      />
    </div>
  );
}
