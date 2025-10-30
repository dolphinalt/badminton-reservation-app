import type { GroupMember } from "../types/group";

interface GroupMemberListProps {
  members: GroupMember[];
  currentUserId?: number;
}

export default function GroupMemberList({
  members,
  currentUserId,
}: GroupMemberListProps) {
  return (
    <div className="mb-4">
      <h4 className="text-lg font-medium text-gray-900 mb-3">
        Group Members ({members.length})
      </h4>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center space-x-3 p-3 bg-white rounded-lg"
          >
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-full border-2 border-gray-200"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {member.name}
                {member.id === currentUserId && (
                  <span className="ml-2 text-xs bg-teal-50 text-teal-500 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">{member.email}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
