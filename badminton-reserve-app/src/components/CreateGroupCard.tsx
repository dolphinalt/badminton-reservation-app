interface CreateGroupCardProps {
  isCreating: boolean;
  onCreateGroup: () => void;
}

export default function CreateGroupCard({
  isCreating,
  onCreateGroup,
}: CreateGroupCardProps) {
  return (
    <>
      <div
        className={`flex justify-center items-center p-6 rounded-2xl transition-all text-white text-center cursor-pointer ${
          isCreating
            ? "bg-teal-400 cursor-not-allowed"
            : "bg-teal-600 hover:bg-teal-700"
        }`}
        onClick={isCreating ? undefined : onCreateGroup}
      >
        <div className="flex items-center space-x-4">
          <span className="text-2xl text-white">
            {isCreating ? "Creating..." : "Create a Group"}
          </span>
        </div>
      </div>
    </>
  );
}
