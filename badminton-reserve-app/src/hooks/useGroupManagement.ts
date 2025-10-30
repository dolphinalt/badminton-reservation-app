import { useState, useEffect } from "react";
import { api } from "../utils/api";
import type { Group, GroupMember } from "../types/group";

export function useGroupManagement() {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const loadGroupInfo = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.getMyGroup();
      setGroup(data.group);
      setMembers(data.members || []);
    } catch (error: any) {
      console.error("Error loading group info:", error);
      setError("Failed to load group information");
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    try {
      setError(null);
      setIsCreating(true);
      await api.createGroup();
      await loadGroupInfo();
    } catch (error: any) {
      console.error("Error creating group:", error);
      setError(error.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a group code");
      return;
    }

    try {
      setError(null);
      setIsJoining(true);
      await api.joinGroup(joinCode.trim());
      setJoinCode("");
      await loadGroupInfo();
    } catch (error: any) {
      console.error("Error joining group:", error);
      setError(error.message || "Failed to join group");
    } finally {
      setIsJoining(false);
    }
  };

  const leaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) {
      return;
    }

    try {
      setError(null);
      setIsLeaving(true);
      await api.leaveGroup();
      await loadGroupInfo();
    } catch (error: any) {
      console.error("Error leaving group:", error);
      setError(error.message || "Failed to leave group");
    } finally {
      setIsLeaving(false);
    }
  };

  const copyGroupCode = () => {
    if (group?.group_code) {
      navigator.clipboard.writeText(group.group_code);
      alert("Group code copied to clipboard!");
    }
  };

  useEffect(() => {
    loadGroupInfo();
  }, []);

  return {
    group,
    members,
    loading,
    error,
    joinCode,
    isJoining,
    isCreating,
    isLeaving,
    setJoinCode,
    createGroup,
    joinGroup,
    leaveGroup,
    copyGroupCode,
    loadGroupInfo,
  };
}