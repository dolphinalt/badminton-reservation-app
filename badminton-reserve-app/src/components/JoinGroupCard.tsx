interface JoinGroupCardProps {
  joinCode: string;
  isJoining: boolean;
  onJoinCodeChange: (code: string) => void;
  onJoinGroup: () => void;
}

export default function JoinGroupCard({
  joinCode,
  isJoining,
  onJoinCodeChange,
  onJoinGroup,
}: JoinGroupCardProps) {
  return (
    <>
      <div className="flex justify-center items-center p-6 rounded-2xl transition-all bg-white text-gray-900 text-center bold">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => onJoinCodeChange(e.target.value)}
          placeholder="Group Code (e.g., alpha-beta-gamma)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
        />
        <button
          onClick={onJoinGroup}
          disabled={isJoining || !joinCode.trim()}
          className="ml-3 px-4 py-2 rounded-full font-medium border-2 border-teal-500 text-teal-500 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isJoining ? "Joining..." : "Join"}
        </button>
      </div>
    </>
  );
}
