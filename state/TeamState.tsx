import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, ReactNode } from "react";
import { teamRepository } from "../repositories";
import { useAuth } from "./AuthState";
import type { Workspace, TeamMember, TeamInvitation, TeamRole } from "../types";

interface TeamState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  currentUserRole: TeamRole | null;
  isLoading: boolean;
  error: string | null;
}

type TeamAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_WORKSPACES"; payload: Workspace[] }
  | { type: "SET_ACTIVE_WORKSPACE"; payload: Workspace | null }
  | { type: "SET_MEMBERS"; payload: TeamMember[] }
  | { type: "SET_INVITATIONS"; payload: TeamInvitation[] }
  | { type: "SET_USER_ROLE"; payload: TeamRole | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_WORKSPACE"; payload: Workspace }
  | { type: "ADD_MEMBER"; payload: TeamMember }
  | { type: "REMOVE_MEMBER"; payload: string }
  | { type: "ADD_INVITATION"; payload: TeamInvitation }
  | { type: "REMOVE_INVITATION"; payload: string }
  | { type: "RESET" };

const initialState: TeamState = {
  workspaces: [],
  activeWorkspace: null,
  members: [],
  invitations: [],
  currentUserRole: null,
  isLoading: false,
  error: null,
};

function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_WORKSPACES":
      return { ...state, workspaces: action.payload };
    case "SET_ACTIVE_WORKSPACE":
      return { ...state, activeWorkspace: action.payload };
    case "SET_MEMBERS":
      return { ...state, members: action.payload };
    case "SET_INVITATIONS":
      return { ...state, invitations: action.payload };
    case "SET_USER_ROLE":
      return { ...state, currentUserRole: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "ADD_WORKSPACE":
      return { ...state, workspaces: [action.payload, ...state.workspaces] };
    case "ADD_MEMBER":
      return { ...state, members: [action.payload, ...state.members] };
    case "REMOVE_MEMBER":
      return { ...state, members: state.members.filter((m) => m.id !== action.payload) };
    case "ADD_INVITATION":
      return { ...state, invitations: [action.payload, ...state.invitations] };
    case "REMOVE_INVITATION":
      return { ...state, invitations: state.invitations.filter((i) => i.id !== action.payload) };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface TeamContextValue extends TeamState {
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  loadMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (email: string, role: TeamRole) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (memberId: string, role: TeamRole) => Promise<{ success: boolean; error?: string }>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  canPerformAction: (action: string) => boolean;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(teamReducer, initialState);
  const { user } = useAuth();
  const loadRequestRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    } else {
      dispatch({ type: "RESET" });
    }
  }, [user?.id]);

  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    
    const requestId = ++loadRequestRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    
    try {
      const workspaces = await teamRepository.getWorkspacesByOwner(user.id);
      
      if (!isMountedRef.current || requestId !== loadRequestRef.current) return;
      
      dispatch({ type: "SET_WORKSPACES", payload: workspaces });
      
      if (workspaces.length > 0 && !state.activeWorkspace) {
        dispatch({ type: "SET_ACTIVE_WORKSPACE", payload: workspaces[0] });
        await loadMembers(workspaces[0].id);
      }
    } catch {
      if (isMountedRef.current && requestId === loadRequestRef.current) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load workspaces" });
      }
    } finally {
      if (isMountedRef.current && requestId === loadRequestRef.current) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, [user, state.activeWorkspace]);

  const createWorkspace = useCallback(async (name: string): Promise<Workspace | null> => {
    if (!user) return null;
    
    try {
      const workspace = await teamRepository.createWorkspace({ name, ownerId: user.id });
      
      const ownerMember = await teamRepository.addMember({
        workspaceId: workspace.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: "owner",
      });
      
      dispatch({ type: "ADD_WORKSPACE", payload: workspace });
      dispatch({ type: "SET_ACTIVE_WORKSPACE", payload: workspace });
      dispatch({ type: "SET_MEMBERS", payload: [ownerMember] });
      dispatch({ type: "SET_USER_ROLE", payload: "owner" });
      
      return workspace;
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to create workspace" });
      return null;
    }
  }, [user]);

  const setActiveWorkspace = useCallback((workspace: Workspace | null) => {
    dispatch({ type: "SET_ACTIVE_WORKSPACE", payload: workspace });
    if (workspace) {
      loadMembers(workspace.id);
    }
  }, []);

  const loadMembers = useCallback(async (workspaceId: string) => {
    if (!user) return;
    
    const requestId = ++loadRequestRef.current;
    
    try {
      const [members, invitations] = await Promise.all([
        teamRepository.getWorkspaceMembers(workspaceId),
        teamRepository.getPendingInvitations(workspaceId),
      ]);
      
      if (!isMountedRef.current || requestId !== loadRequestRef.current) return;
      
      const currentMember = members.find((m) => m.userId === user.id);
      
      dispatch({ type: "SET_MEMBERS", payload: members });
      dispatch({ type: "SET_INVITATIONS", payload: invitations });
      dispatch({ type: "SET_USER_ROLE", payload: currentMember?.role ?? null });
    } catch {
      if (isMountedRef.current && requestId === loadRequestRef.current) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load team members" });
      }
    }
  }, [user]);

  const inviteMember = useCallback(async (email: string, role: TeamRole): Promise<{ success: boolean; error?: string }> => {
    if (!state.activeWorkspace || !user) {
      return { success: false, error: "No active workspace" };
    }
    
    const result = await teamRepository.createInvitation({
      workspaceId: state.activeWorkspace.id,
      email,
      role,
      invitedBy: user.id,
    });
    
    if (result.success && result.invitation) {
      dispatch({ type: "ADD_INVITATION", payload: result.invitation });
    }
    
    return result;
  }, [state.activeWorkspace, user]);

  const removeMember = useCallback(async (memberId: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.currentUserRole) {
      return { success: false, error: "No permission" };
    }
    
    const result = await teamRepository.removeMember(memberId, state.currentUserRole);
    
    if (result.success) {
      dispatch({ type: "REMOVE_MEMBER", payload: memberId });
    }
    
    return result;
  }, [state.currentUserRole]);

  const updateMemberRole = useCallback(async (memberId: string, role: TeamRole): Promise<{ success: boolean; error?: string }> => {
    if (!state.currentUserRole) {
      return { success: false, error: "No permission" };
    }
    
    const result = await teamRepository.updateMemberRole(memberId, role, state.currentUserRole);
    
    if (result.success && result.member) {
      const updatedMembers = state.members.map((m) =>
        m.id === memberId ? result.member! : m
      );
      dispatch({ type: "SET_MEMBERS", payload: updatedMembers });
    }
    
    return result;
  }, [state.currentUserRole, state.members]);

  const cancelInvitation = useCallback(async (invitationId: string) => {
    await teamRepository.cancelInvitation(invitationId);
    dispatch({ type: "REMOVE_INVITATION", payload: invitationId });
  }, []);

  const canPerformAction = useCallback((action: string): boolean => {
    if (!state.currentUserRole) return false;
    return teamRepository.canPerformAction(state.currentUserRole, action);
  }, [state.currentUserRole]);

  const value: TeamContextValue = {
    ...state,
    loadWorkspaces,
    createWorkspace,
    setActiveWorkspace,
    loadMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    cancelInvitation,
    canPerformAction,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}

export function useActiveWorkspace(): Workspace | null {
  const { activeWorkspace } = useTeam();
  return activeWorkspace;
}

export function useTeamMembers(): TeamMember[] {
  const { members } = useTeam();
  return members;
}

export function useCanPerformTeamAction(action: string): boolean {
  const { canPerformAction } = useTeam();
  return canPerformAction(action);
}

export default TeamContext;
