import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import { teamRepository, TeamRole } from "./repository";
import type { TeamMember, Workspace } from "@/features/shared/types";

export interface InviteMemberInput {
  email: string;
  name?: string;
  role: TeamRole;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  roleBreakdown: Record<TeamRole, number>;
}

export interface TeamService {
  getWorkspace(): AsyncResult<Workspace | null, AppError>;
  createWorkspace(name: string, ownerId: string): AsyncResult<Workspace, AppError>;
  updateWorkspace(updates: Partial<Workspace>): AsyncResult<Workspace, AppError>;
  getMembers(): AsyncResult<TeamMember[], AppError>;
  inviteMember(input: InviteMemberInput): AsyncResult<TeamMember, AppError>;
  updateMemberRole(memberId: string, role: TeamRole): AsyncResult<TeamMember, AppError>;
  removeMember(memberId: string): AsyncResult<void, AppError>;
  acceptInvite(memberId: string): AsyncResult<TeamMember, AppError>;
  getStats(): AsyncResult<TeamStats, AppError>;
  canPerformAction(memberId: string, action: string): AsyncResult<boolean, AppError>;
}

function generateId(): string {
  return `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: ["all"],
  admin: ["manage_members", "manage_content", "publish", "edit", "view"],
  editor: ["manage_content", "publish", "edit", "view"],
  viewer: ["view"],
};

export const teamService: TeamService = {
  async getWorkspace(): AsyncResult<Workspace | null, AppError> {
    return teamRepository.getWorkspace();
  },

  async createWorkspace(name: string, ownerId: string): AsyncResult<Workspace, AppError> {
    if (!name.trim()) {
      return err(AppError.validation("Workspace name is required"));
    }

    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: generateId(),
      name: name.trim(),
      ownerId,
      memberCount: 1,
      plan: "free",
      createdAt: now,
      updatedAt: now,
    };

    const saveResult = await teamRepository.saveWorkspace(workspace);
    if (!isOk(saveResult)) return saveResult as any;

    return ok(workspace);
  },

  async updateWorkspace(updates: Partial<Workspace>): AsyncResult<Workspace, AppError> {
    const existingResult = await teamRepository.getWorkspace();
    if (!isOk(existingResult)) return existingResult as any;

    if (!existingResult.data) {
      return err(AppError.notFound("Workspace"));
    }

    const updatedWorkspace: Workspace = {
      ...existingResult.data,
      ...updates,
      id: existingResult.data.id,
      ownerId: existingResult.data.ownerId,
      updatedAt: new Date().toISOString(),
    };

    const saveResult = await teamRepository.saveWorkspace(updatedWorkspace);
    if (!isOk(saveResult)) return saveResult as any;

    return ok(updatedWorkspace);
  },

  async getMembers(): AsyncResult<TeamMember[], AppError> {
    return teamRepository.getMembers();
  },

  async inviteMember(input: InviteMemberInput): AsyncResult<TeamMember, AppError> {
    if (!input.email.trim()) {
      return err(AppError.validation("Email is required"));
    }

    const existingResult = await teamRepository.getMemberByEmail(input.email);
    if (!isOk(existingResult)) return existingResult as any;

    if (existingResult.data) {
      return err(AppError.validation("Member with this email already exists"));
    }

    const now = new Date().toISOString();
    const member: TeamMember = {
      id: generateId(),
      userId: "",
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() || input.email.split("@")[0],
      role: input.role,
      status: "pending",
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    return teamRepository.addMember(member);
  },

  async updateMemberRole(memberId: string, role: TeamRole): AsyncResult<TeamMember, AppError> {
    const memberResult = await teamRepository.getMemberById(memberId);
    if (!isOk(memberResult)) return memberResult as any;

    if (!memberResult.data) {
      return err(AppError.notFound("Team member"));
    }

    if (memberResult.data.role === "owner") {
      return err(AppError.validation("Cannot change owner role"));
    }

    return teamRepository.updateMember(memberId, { role });
  },

  async removeMember(memberId: string): AsyncResult<void, AppError> {
    const memberResult = await teamRepository.getMemberById(memberId);
    if (!isOk(memberResult)) return memberResult as any;

    if (!memberResult.data) {
      return err(AppError.notFound("Team member"));
    }

    if (memberResult.data.role === "owner") {
      return err(AppError.validation("Cannot remove workspace owner"));
    }

    return teamRepository.removeMember(memberId);
  },

  async acceptInvite(memberId: string): AsyncResult<TeamMember, AppError> {
    return teamRepository.updateMember(memberId, {
      status: "active",
      joinedAt: new Date().toISOString(),
    });
  },

  async getStats(): AsyncResult<TeamStats, AppError> {
    const membersResult = await teamRepository.getMembers();
    if (!isOk(membersResult)) return membersResult as any;

    const members = membersResult.data;
    const roleBreakdown: Record<TeamRole, number> = {
      owner: 0,
      admin: 0,
      editor: 0,
      viewer: 0,
    };

    let activeCount = 0;
    let pendingCount = 0;

    for (const member of members) {
      roleBreakdown[member.role]++;
      if (member.status === "active") activeCount++;
      if (member.status === "pending") pendingCount++;
    }

    return ok({
      totalMembers: members.length,
      activeMembers: activeCount,
      pendingInvites: pendingCount,
      roleBreakdown,
    });
  },

  async canPerformAction(memberId: string, action: string): AsyncResult<boolean, AppError> {
    const memberResult = await teamRepository.getMemberById(memberId);
    if (!isOk(memberResult)) return memberResult as any;

    if (!memberResult.data) {
      return ok(false);
    }

    const permissions = ROLE_PERMISSIONS[memberResult.data.role];
    const canPerform = permissions.includes("all") || permissions.includes(action);

    return ok(canPerform);
  },
};
