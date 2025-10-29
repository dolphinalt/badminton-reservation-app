import TimeSlot from "./TimeSlot.tsx";

interface AvailableTimesProps {
  selectedCourt: number;
  queueData: any;
  handleReserve: (courtId: number) => void;
  handleCancel: (reservationId: number) => void;
  canReserve: () => boolean;
  user: any;
  courtStatus: {
    status: string;
    time: string | null;
    color: string;
  };
}

export default function AvailableTimes({
  selectedCourt,
  queueData,
  handleReserve,
  handleCancel,
  canReserve,
  user,
  courtStatus,
}: AvailableTimesProps) {
  const courtQueue = queueData[selectedCourt] || [];

  // Check if court is open and there's no queue - user should take court instead
  const isCourtOpen = courtStatus.status === "Open";
  const hasNoQueue = courtQueue.length === 0;
  const shouldTakeCourtInstead = isCourtOpen && hasNoQueue;

  // Modify canReserve logic to prevent joining queue when court should be taken
  const canJoinQueue = canReserve() && !shouldTakeCourtInstead;

  return (
    <div className="px-6 mt-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Queue</h2>

      <div className="space-y-4">
        {/* Add to queue button */}
        <div className="bg-white p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">
              {shouldTakeCourtInstead
                ? "Add your spot in line"
                : "Add your spot in line"}
            </span>
            <button
              onClick={() => handleReserve(selectedCourt)}
              disabled={!canJoinQueue}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                canJoinQueue
                  ? "border border-teal-600 border-2 text-teal-600 hover:bg-teal-50 font-bold"
                  : "border border-gray-300 border-2 text-gray-400 bg-gray-100 cursor-not-allowed"
              }`}
            >
              {shouldTakeCourtInstead ? "Join Queue" : "Join Queue"}
            </button>
          </div>
        </div>

        {/* Show current queue */}
        {courtQueue.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Current Queue:
            </h3>
            {courtQueue.map((reservation: any, index: number) => (
              <TimeSlot
                key={reservation.id}
                position={index + 1}
                userName={reservation.user_name}
                isCurrentUser={reservation.user_id === user?.id}
                onCancel={() => handleCancel(reservation.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 italic">
            <p>No one in queue. Be the first to join!</p>
          </div>
        )}
      </div>
    </div>
  );
}
