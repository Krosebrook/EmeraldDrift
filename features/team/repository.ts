import AsyncStorage from "@react-native-async-storage/async-storage";
import { createFeatureRepository, Repository } from "@/features/shared/repository";
import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import type { TeamMember, Workspace } from "@/features/shared/types";

const STORAGE_KEYS = {
  TEAM_MEMBERS: "@creator_studio_team_members",
  WORKSPACE: "@creator_studio_workspace",
} as const;

const teamMemberRepository = createFeatureRepository<TeamMember>({
  storageKey: STORAGE_KEYS.TEAM_MEMBERS,
});

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export interface TeamRepository {
  getWorkspace(): AsyncResult<Workspace | null, AppError>;
  saveWorkspace(workspace: Workspace): AsyncResult<void, AppError>;
  getMembers(): AsyncResult<TeamMember[], AppError>;
  getMemberById(id: string): AsyncResult<TeamMember | null, AppError>;
  getMemberByEmail(email: string): AsyncResult<TeamMember | null, AppError>;
  addMember(member: TeamMember): AsyncResult<TeamMember, AppError>;
  updateMember(id: string, updates: Partial<TeamMember>): AsyncResult<TeamMember, AppError>;
  removeMember(id: string): AsyncResult<void, AppError>;
  getByRole(role: TeamRole): AsyncResult<TeamMember[], AppError>;
  getPendingInvites(): AsyncResult<TeamMember[], AppError>;
  clearAll(): AsyncResult<void, AppError>;
}

export const teamRepository: TeamRepository = {
  async getWorkspace(): AsyncResult<Workspace | null, AppError> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKSPACE);
      return ok(data ? JSON.parse(data) : null);
    } catch (error) {
      return err(AppError.persistence("get", "workspace", error instanceof Error ? error : undefined));
    }
  },

  async saveWorkspace(workspace: Workspace): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WORKSPACE, JSON.stringify(workspace));
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("save", "workspace", error instanceof Error ? error : undefined));
    }
  },

  async getMembers(): AsyncResult<TeamMember[], AppError> {
    return teamMemberRepository.getAll();
  },

  async getMemberById(id: string): AsyncResult<TeamMember | null, AppError> {
    return teamMemberRepository.getById(id);
  },

  async getMemberByEmail(email: string): AsyncResult<TeamMember | null, AppError> {
    const result = await teamMemberRepository.getFiltered(
      (member) => member.email.toLowerCase() === email.toLowerCase()
    );
    if (!isOk(result)) return result as any;
    return ok(result.data[0] ?? null);
  },

  async addMember(member: TeamMember): AsyncResult<TeamMember, AppError> {
    return teamMemberRepository.save(member);
  },

  async updateMember(id: string, updates: Partial<TeamMember>): AsyncResult<TeamMember, AppError> {
    return teamMemberRepository.update(id, updates);
  },

  async removeMember(id: string): AsyncResult<void, AppError> {
    return teamMemberRepository.delete(id);
  },

  async getByRole(role: TeamRole): AsyncResult<TeamMember[], AppError> {
    return teamMemberRepository.getFiltered((member) => member.role === role);
  },

  async getPendingInvites(): AsyncResult<TeamMember[], AppError> {
    return teamMemberRepository.getFiltered((member) => member.status === "pending");
  },

  async clearAll(): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TEAM_MEMBERS, STORAGE_KEYS.WORKSPACE]);
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("clear", "team", error instanceof Error ? error : undefined));
    }
  },
};
