import { persistence } from "../core/persistence";
import { STORAGE_KEYS } from "../core/constants";
import type { 
  Workspace, 
  TeamMember, 
  TeamInvitation, 
  TeamRole, 
  InvitationStatus 
} from "../types";

const workspaceRepo = persistence.createRepository<Workspace>(STORAGE_KEYS.WORKSPACES);
const memberRepo = persistence.createRepository<TeamMember>(STORAGE_KEYS.TEAM_MEMBERS);
const invitationRepo = persistence.createRepository<TeamInvitation>(STORAGE_KEYS.INVITATIONS);

const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

function canManageRole(managerRole: TeamRole, targetRole: TeamRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

export const teamRepository = {
  async createWorkspace(data: Omit<Workspace, "id" | "createdAt" | "updatedAt">): Promise<Workspace> {
    const now = new Date().toISOString();
    const workspace: Workspace = {
      ...data,
      id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    await workspaceRepo.save(workspace);
    return workspace;
  },

  async getWorkspace(id: string): Promise<Workspace | null> {
    return workspaceRepo.getById(id);
  },

  async getWorkspacesByOwner(ownerId: string): Promise<Workspace[]> {
    const workspaces = await workspaceRepo.getAll();
    return workspaces.filter((w) => w.ownerId === ownerId);
  },

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace | null> {
    const existing = await workspaceRepo.getById(id);
    if (!existing) return null;
    
    const updated: Workspace = {
      ...existing,
      ...updates,
      id: existing.id,
      ownerId: existing.ownerId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await workspaceRepo.save(updated);
    return updated;
  },

  async deleteWorkspace(id: string): Promise<void> {
    const members = await this.getWorkspaceMembers(id);
    const invitations = await this.getWorkspaceInvitations(id);
    
    for (const member of members) {
      await memberRepo.delete(member.id);
    }
    for (const invitation of invitations) {
      await invitationRepo.delete(invitation.id);
    }
    
    await workspaceRepo.delete(id);
  },

  async addMember(data: Omit<TeamMember, "id" | "joinedAt">): Promise<TeamMember> {
    const member: TeamMember = {
      ...data,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      joinedAt: new Date().toISOString(),
    };
    await memberRepo.save(member);
    return member;
  },

  async getMember(id: string): Promise<TeamMember | null> {
    return memberRepo.getById(id);
  },

  async getWorkspaceMembers(workspaceId: string): Promise<TeamMember[]> {
    const members = await memberRepo.getAll();
    return members.filter((m) => m.workspaceId === workspaceId);
  },

  async getMemberByEmail(workspaceId: string, email: string): Promise<TeamMember | null> {
    const members = await this.getWorkspaceMembers(workspaceId);
    return members.find((m) => m.email === email) ?? null;
  },

  async updateMemberRole(
    id: string, 
    newRole: TeamRole, 
    updaterRole: TeamRole
  ): Promise<{ success: boolean; error?: string; member?: TeamMember }> {
    const member = await memberRepo.getById(id);
    if (!member) {
      return { success: false, error: "Member not found" };
    }
    
    if (member.role === "owner") {
      return { success: false, error: "Cannot change owner's role" };
    }
    
    if (!canManageRole(updaterRole, member.role) || !canManageRole(updaterRole, newRole)) {
      return { success: false, error: "Insufficient permissions" };
    }
    
    const updated: TeamMember = { ...member, role: newRole };
    await memberRepo.save(updated);
    return { success: true, member: updated };
  },

  async removeMember(
    id: string, 
    removerRole: TeamRole
  ): Promise<{ success: boolean; error?: string }> {
    const member = await memberRepo.getById(id);
    if (!member) {
      return { success: false, error: "Member not found" };
    }
    
    if (member.role === "owner") {
      return { success: false, error: "Cannot remove workspace owner" };
    }
    
    if (!canManageRole(removerRole, member.role)) {
      return { success: false, error: "Insufficient permissions" };
    }
    
    await memberRepo.delete(id);
    return { success: true };
  },

  async createInvitation(
    data: Omit<TeamInvitation, "id" | "status" | "createdAt" | "expiresAt">
  ): Promise<{ success: boolean; error?: string; invitation?: TeamInvitation }> {
    const existingMember = await this.getMemberByEmail(data.workspaceId, data.email);
    if (existingMember) {
      return { success: false, error: "already_member" };
    }
    
    const existingInvitations = await this.getWorkspaceInvitations(data.workspaceId);
    const pendingInvitation = existingInvitations.find(
      (i) => i.email === data.email && i.status === "pending"
    );
    if (pendingInvitation) {
      return { success: false, error: "already_invited" };
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const invitation: TeamInvitation = {
      ...data,
      id: `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    await invitationRepo.save(invitation);
    return { success: true, invitation };
  },

  async getInvitation(id: string): Promise<TeamInvitation | null> {
    return invitationRepo.getById(id);
  },

  async getWorkspaceInvitations(workspaceId: string): Promise<TeamInvitation[]> {
    const invitations = await invitationRepo.getAll();
    return invitations.filter((i) => i.workspaceId === workspaceId);
  },

  async getPendingInvitations(workspaceId: string): Promise<TeamInvitation[]> {
    const invitations = await this.getWorkspaceInvitations(workspaceId);
    return invitations.filter((i) => i.status === "pending");
  },

  async acceptInvitation(id: string, userId: string, name: string): Promise<TeamMember | null> {
    const invitation = await invitationRepo.getById(id);
    if (!invitation || invitation.status !== "pending") return null;
    
    const now = new Date();
    if (new Date(invitation.expiresAt) < now) {
      await this.updateInvitationStatus(id, "expired");
      return null;
    }
    
    await this.updateInvitationStatus(id, "accepted");
    
    return this.addMember({
      workspaceId: invitation.workspaceId,
      userId,
      email: invitation.email,
      name,
      role: invitation.role,
    });
  },

  async declineInvitation(id: string): Promise<void> {
    await this.updateInvitationStatus(id, "declined");
  },

  async updateInvitationStatus(id: string, status: InvitationStatus): Promise<void> {
    const invitation = await invitationRepo.getById(id);
    if (invitation) {
      const updated: TeamInvitation = { ...invitation, status };
      await invitationRepo.save(updated);
    }
  },

  async cancelInvitation(id: string): Promise<void> {
    await invitationRepo.delete(id);
  },

  canPerformAction(role: TeamRole, action: string): boolean {
    const permissions: Record<string, TeamRole[]> = {
      view: ["owner", "admin", "editor", "viewer"],
      edit: ["owner", "admin", "editor"],
      publish: ["owner", "admin", "editor"],
      invite: ["owner", "admin"],
      manage_members: ["owner", "admin"],
      manage_workspace: ["owner"],
      delete_workspace: ["owner"],
    };
    
    return permissions[action]?.includes(role) ?? false;
  },

  async clearAll(): Promise<void> {
    await workspaceRepo.clear();
    await memberRepo.clear();
    await invitationRepo.clear();
  },
};

export default teamRepository;
