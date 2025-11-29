import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useAuthContext } from "./AuthContext";
import {
  teamService,
  Workspace,
  TeamMember,
  TeamRole,
  TeamInvitation,
} from "@/services/teamService";

export type InviteResult = {
  success: boolean;
  invitation?: TeamInvitation;
  error?: "already_member" | "already_invited" | "unknown";
};

interface TeamContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: TeamMember[];
  pendingInvitations: TeamInvitation[];
  userRole: TeamRole | null;
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  updateWorkspace: (updates: Partial<Omit<Workspace, "id" | "createdAt" | "ownerId">>) => Promise<boolean>;
  deleteWorkspace: () => Promise<boolean>;
  inviteMember: (email: string, role: TeamRole) => Promise<InviteResult>;
  updateMemberRole: (memberId: string, newRole: TeamRole) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  refreshTeam: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const { user, isAuthenticated } = useAuthContext();

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [userRole, setUserRole] = useState<TeamRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequestRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadTeamData = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setMembers([]);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++loadRequestRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const workspace = await teamService.initializeDefaultWorkspace(
        user.id,
        user.name,
        user.email
      );

      if (requestId !== loadRequestRef.current || !isMountedRef.current) return;

      const userWorkspaces = await teamService.getUserWorkspaces(user.id);
      
      if (requestId !== loadRequestRef.current || !isMountedRef.current) return;
      setWorkspaces(userWorkspaces);

      const currentId = await teamService.getCurrentWorkspaceId();
      const activeWorkspace =
        userWorkspaces.find((w) => w.id === currentId) || userWorkspaces[0] || workspace;

      if (requestId !== loadRequestRef.current || !isMountedRef.current) return;
      setCurrentWorkspace(activeWorkspace);

      if (activeWorkspace) {
        const [workspaceMembers, role, invitations] = await Promise.all([
          teamService.getWorkspaceMembers(activeWorkspace.id),
          teamService.getUserRoleInWorkspace(activeWorkspace.id, user.id),
          teamService.getPendingInvitations(activeWorkspace.id),
        ]);

        if (requestId !== loadRequestRef.current || !isMountedRef.current) return;
        
        setMembers(workspaceMembers);
        setUserRole(role);
        setPendingInvitations(invitations);

        await teamService.updateMemberActivity(activeWorkspace.id, user.id);
      }
    } catch (err) {
      if (requestId !== loadRequestRef.current || !isMountedRef.current) return;
      console.error("Error loading team data:", err);
      setError("Failed to load team data");
    } finally {
      if (requestId === loadRequestRef.current && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!user) return;

      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (!workspace) return;

      const requestId = ++loadRequestRef.current;

      await teamService.setCurrentWorkspace(workspaceId);
      
      if (requestId !== loadRequestRef.current || !isMountedRef.current) return;
      setCurrentWorkspace(workspace);

      const [workspaceMembers, role, invitations] = await Promise.all([
        teamService.getWorkspaceMembers(workspaceId),
        teamService.getUserRoleInWorkspace(workspaceId, user.id),
        teamService.getPendingInvitations(workspaceId),
      ]);

      if (requestId !== loadRequestRef.current || !isMountedRef.current) return;
      
      setMembers(workspaceMembers);
      setUserRole(role);
      setPendingInvitations(invitations);

      await teamService.updateMemberActivity(workspaceId, user.id);
    },
    [user, workspaces]
  );

  const createWorkspace = useCallback(
    async (name: string, description?: string): Promise<Workspace | null> => {
      if (!user) return null;

      try {
        const workspace = await teamService.createWorkspace(
          name,
          user.id,
          user.name,
          user.email,
          description
        );

        setWorkspaces((prev) => [...prev, workspace]);
        setCurrentWorkspace(workspace);

        const workspaceMembers = await teamService.getWorkspaceMembers(workspace.id);
        setMembers(workspaceMembers);
        setUserRole("owner");
        setPendingInvitations([]);

        return workspace;
      } catch (err) {
        console.error("Error creating workspace:", err);
        return null;
      }
    },
    [user]
  );

  const updateWorkspace = useCallback(
    async (
      updates: Partial<Omit<Workspace, "id" | "createdAt" | "ownerId">>
    ): Promise<boolean> => {
      if (!currentWorkspace) return false;

      const updated = await teamService.updateWorkspace(currentWorkspace.id, updates);
      if (updated) {
        setCurrentWorkspace(updated);
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === updated.id ? updated : w))
        );
        return true;
      }
      return false;
    },
    [currentWorkspace]
  );

  const deleteWorkspace = useCallback(async (): Promise<boolean> => {
    if (!currentWorkspace || userRole !== "owner") return false;

    const success = await teamService.deleteWorkspace(currentWorkspace.id);
    if (success) {
      await loadTeamData();
    }
    return success;
  }, [currentWorkspace, userRole, loadTeamData]);

  const inviteMember = useCallback(
    async (email: string, role: TeamRole): Promise<InviteResult> => {
      if (!currentWorkspace || !user) {
        return { success: false, error: "unknown" };
      }

      try {
        const result = await teamService.inviteMember(
          currentWorkspace.id,
          email,
          role,
          user.id
        );
        if (result.invitation) {
          setPendingInvitations((prev) => [...prev, result.invitation!]);
          return { success: true, invitation: result.invitation };
        }
        return { success: false, error: result.error || "unknown" };
      } catch (err) {
        console.error("Error inviting member:", err);
        return { success: false, error: "unknown" };
      }
    },
    [currentWorkspace, user]
  );

  const updateMemberRole = useCallback(
    async (memberId: string, newRole: TeamRole): Promise<boolean> => {
      if (!currentWorkspace) return false;

      const updated = await teamService.updateMemberRole(
        currentWorkspace.id,
        memberId,
        newRole
      );
      if (updated) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? updated : m))
        );
        return true;
      }
      return false;
    },
    [currentWorkspace]
  );

  const removeMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      if (!currentWorkspace) return false;

      const success = await teamService.removeMember(currentWorkspace.id, memberId);
      if (success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
      return success;
    },
    [currentWorkspace]
  );

  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      const success = await teamService.cancelInvitation(invitationId);
      if (success) {
        setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      }
      return success;
    },
    []
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!userRole) return false;
      return teamService.hasPermission(userRole, permission);
    },
    [userRole]
  );

  const value: TeamContextType = {
    currentWorkspace,
    workspaces,
    members,
    pendingInvitations,
    userRole,
    isLoading,
    error,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    hasPermission,
    refreshTeam: loadTeamData,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeamContext must be used within a TeamProvider");
  }
  return context;
}
