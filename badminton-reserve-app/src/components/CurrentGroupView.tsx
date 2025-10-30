import type { Group, GroupMember } from "../types/group";
import GroupCodeDisplay from "./GroupCodeDisplay";
import GroupMemberList from "./GroupMemberList";

interface CurrentGroupViewProps {
  group: Group;
  members: GroupMember[];
  currentUserId?: number;
  isLeaving: boolean;
  onCopyCode: () => void;
  onLeaveGroup: () => void;
}

export default function CurrentGroupView({
  group,
  members,
  currentUserId,
  isLeaving,
  onCopyCode,
  onLeaveGroup,
}: CurrentGroupViewProps) {
  return (
    <>
      <GroupCodeDisplay groupCode={group.group_code} onCopy={onCopyCode} />
      <GroupMemberList members={members} currentUserId={currentUserId} />
      <button
        onClick={onLeaveGroup}
        disabled={isLeaving}
        className="w-full px-4 py-2 bg-white border border-2 border-red-500 text-red-500 rounded-full hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLeaving ? "Leaving..." : "Leave Group"}
      </button>
    </>
  );
}
