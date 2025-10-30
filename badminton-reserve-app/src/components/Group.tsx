import CurrentGroupView from "./CurrentGroupView";
import NoGroupView from "./NoGroupView";

interface GroupHeaderProps {
  joinCode: string;
  isJoining: boolean;
  isCreating: boolean;
  onJoinCodeChange: (code: string) => void;
  onJoinGroup: () => void;
  onCreateGroup: () => void;
  onCopyCode: () => void;
  onLeaveGroup: () => void;
  isLeaving: boolean;
  group: {
    id: number;
    group_code: string;
    created_at: string;
  } | null;
  members: {
    id: number;
    name: string;
    email: string;
    avatar: string;
    joined_at: string;
  }[];
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string;
  } | null;
  logout: () => void;
}

export default function GroupHeader({
  joinCode,
  isJoining,
  isCreating,
  onJoinCodeChange,
  onJoinGroup,
  onCreateGroup,
  onCopyCode,
  onLeaveGroup,
  isLeaving,
  group,
  members,
  user,
  logout,
}: GroupHeaderProps) {
  return (
    <>
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Groups</h1>
        {group ? (
          <CurrentGroupView
            group={group}
            members={members}
            currentUserId={user?.id}
            isLeaving={isLeaving}
            onCopyCode={onCopyCode}
            onLeaveGroup={onLeaveGroup}
          />
        ) : (
          <NoGroupView
            joinCode={joinCode}
            isJoining={isJoining}
            isCreating={isCreating}
            onJoinCodeChange={onJoinCodeChange}
            onJoinGroup={onJoinGroup}
            onCreateGroup={onCreateGroup}
          />
        )}
        <div className="pt-4">
          <button
            onClick={logout}
            className="w-full px-4 py-2 border border-2 border-red-500 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
