import CreateGroupCard from "./CreateGroupCard";
import JoinGroupCard from "./JoinGroupCard";

interface NoGroupViewProps {
  joinCode: string;
  isJoining: boolean;
  isCreating: boolean;
  onJoinCodeChange: (code: string) => void;
  onJoinGroup: () => void;
  onCreateGroup: () => void;
}

export default function NoGroupView({
  joinCode,
  isJoining,
  isCreating,
  onJoinCodeChange,
  onJoinGroup,
  onCreateGroup,
}: NoGroupViewProps) {
  return (
    <div className="space-y-4">
      <CreateGroupCard isCreating={isCreating} onCreateGroup={onCreateGroup} />
      <JoinGroupCard
        joinCode={joinCode}
        isJoining={isJoining}
        onJoinCodeChange={onJoinCodeChange}
        onJoinGroup={onJoinGroup}
      />
    </div>
  );
}
