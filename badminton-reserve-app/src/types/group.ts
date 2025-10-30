export interface GroupMember {
  id: number;
  name: string;
  email: string;
  avatar: string;
  joined_at: string;
}

export interface Group {
  id: number;
  group_code: string;
  created_at: string;
}