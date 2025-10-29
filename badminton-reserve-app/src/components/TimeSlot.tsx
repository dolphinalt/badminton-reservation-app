interface TimeSlotProps {
  position: number;
  userName: string;
  isCurrentUser: boolean;
  onCancel?: () => void;
}

export default function TimeSlot({
  position,
  userName,
  isCurrentUser,
  onCancel,
}: TimeSlotProps) {
  return (
    <div
      className={`flex justify-between items-center p-6 rounded-2xl transition-all ${
        isCurrentUser
          ? "bg-white border-2 border-green-500"
          : "bg-gray-100 border-2 border-gray-300 opacity-80"
      }`}
    >
      <div className="flex items-center space-x-4">
        <span
          className={`text-2xl font-bold ${
            isCurrentUser ? "text-green-600" : "text-gray-500"
          }`}
        >
          #{position}
        </span>
        <span
          className={`text-lg font-medium ${
            isCurrentUser ? "text-green-600" : "text-gray-600"
          }`}
        >
          {userName}
        </span>
      </div>

      {isCurrentUser && onCancel && (
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-full font-medium border-2 border-red-500 text-red-500 hover:bg-red-50 transition-all"
        >
          Leave
        </button>
      )}
    </div>
  );
}
