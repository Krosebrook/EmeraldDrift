import AsyncStorage from "@react-native-async-storage/async-storage";

const TEAM_STORAGE_KEY = "@creator_studio/team_data";
const CURRENT_WORKSPACE_KEY = "@creator_studio/current_workspace";

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: TeamRole;
  joinedAt: string;
  lastActiveAt: string;
  invitedBy: string;
  status: "active" | "pending" | "suspended";
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  defaultTimezone: string;
  allowMemberInvites: boolean;
  requireApprovalForPublish: boolean;
  brandColors: string[];
  brandVoice?: string;
}

export interface TeamData {
  workspaces: Workspace[];
  members: Record<string, TeamMember[]>;
  invitations: TeamInvitation[];
}

export interface TeamInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "declined";
}

export interface ActivityLogEntry {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceType: "content" | "media" | "settings" | "member";
  resourceId?: string;
  details?: string;
  timestamp: string;
}

const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: [
    "workspace.delete",
    "workspace.settings",
    "workspace.billing",
    "members.manage",
    "members.invite",
    "members.remove",
    "content.create",
    "content.edit",
    "content.delete",
    "content.publish",
    "content.schedule",
    "media.upload",
    "media.delete",
    "analytics.view",
    "analytics.export",
  ],
  admin: [
    "workspace.settings",
    "members.invite",
    "members.remove",
    "content.create",
    "content.edit",
    "content.delete",
    "content.publish",
    "content.schedule",
    "media.upload",
    "media.delete",
    "analytics.view",
    "analytics.export",
  ],
  editor: [
    "content.create",
    "content.edit",
    "content.schedule",
    "media.upload",
    "analytics.view",
  ],
  viewer: ["content.view", "analytics.view"],
};

const defaultTeamData: TeamData = {
  workspaces: [],
  members: {},
  invitations: [],
};

let cachedTeamData: TeamData | null = null;

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const teamService = {
  async getTeamData(): Promise<TeamData> {
    if (cachedTeamData) {
      return cachedTeamData;
    }

    try {
      const data = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
      // We clone defaultTeamData to avoid mutation of the constant
      cachedTeamData = data ? JSON.parse(data) : JSON.parse(JSON.stringify(defaultTeamData));
      return cachedTeamData!;
    } catch (error) {
      console.error("Error loading team data:", error);
      // Return a fresh copy on error to avoid shared state issues if not caching
      return JSON.parse(JSON.stringify(defaultTeamData));
    }
  },

  async saveTeamData(data: TeamData): Promise<void> {
    cachedTeamData = data;
    await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(data));
  },

  async getCurrentWorkspaceId(): Promise<string | null> {
    return AsyncStorage.getItem(CURRENT_WORKSPACE_KEY);
  },

  async setCurrentWorkspace(workspaceId: string): Promise<void> {
    await AsyncStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId);
  },

  async createWorkspace(
    name: string,
    ownerId: string,
    ownerName: string,
    ownerEmail: string,
    description?: string
  ): Promise<Workspace> {
    const teamData = await this.getTeamData();
    const now = new Date().toISOString();

    const workspace: Workspace = {
      id: generateId(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      ownerId,
      settings: {
        defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        allowMemberInvites: true,
        requireApprovalForPublish: false,
        brandColors: ["#8B5CF6"],
      },
    };

    const ownerMember: TeamMember = {
      id: ownerId,
      email: ownerEmail,
      name: ownerName,
      role: "owner",
      joinedAt: now,
      lastActiveAt: now,
      invitedBy: ownerId,
      status: "active",
    };

    teamData.workspaces.push(workspace);
    teamData.members[workspace.id] = [ownerMember];

    await this.saveTeamData(teamData);
    await this.setCurrentWorkspace(workspace.id);

    return workspace;
  },

  async updateWorkspace(
    workspaceId: string,
    updates: Partial<Omit<Workspace, "id" | "createdAt" | "ownerId">>
  ): Promise<Workspace | null> {
    const teamData = await this.getTeamData();
    const index = teamData.workspaces.findIndex((w) => w.id === workspaceId);

    if (index === -1) return null;

    teamData.workspaces[index] = {
      ...teamData.workspaces[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTeamData(teamData);
    return teamData.workspaces[index];
  },

  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    const teamData = await this.getTeamData();
    const initialLength = teamData.workspaces.length;

    teamData.workspaces = teamData.workspaces.filter((w) => w.id !== workspaceId);
    delete teamData.members[workspaceId];
    teamData.invitations = teamData.invitations.filter(
      (i) => i.workspaceId !== workspaceId
    );

    if (teamData.workspaces.length < initialLength) {
      await this.saveTeamData(teamData);
      const currentId = await this.getCurrentWorkspaceId();
      if (currentId === workspaceId) {
        const nextWorkspace = teamData.workspaces[0];
        if (nextWorkspace) {
          await this.setCurrentWorkspace(nextWorkspace.id);
        } else {
          await AsyncStorage.removeItem(CURRENT_WORKSPACE_KEY);
        }
      }
      return true;
    }
    return false;
  },

  async getWorkspaces(): Promise<Workspace[]> {
    const teamData = await this.getTeamData();
    return teamData.workspaces;
  },

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const teamData = await this.getTeamData();
    return teamData.workspaces.find((w) => w.id === workspaceId) || null;
  },

  async getWorkspaceMembers(workspaceId: string): Promise<TeamMember[]> {
    const teamData = await this.getTeamData();
    return teamData.members[workspaceId] || [];
  },

  async inviteMember(
    workspaceId: string,
    email: string,
    role: TeamRole,
    invitedByUserId: string
  ): Promise<{ invitation?: TeamInvitation; error?: "already_member" | "already_invited" }> {
    const teamData = await this.getTeamData();
    const normalizedEmail = email.toLowerCase().trim();

    const existingMember = teamData.members[workspaceId]?.find(
      (m) => m.email.toLowerCase() === normalizedEmail && m.status === "active"
    );
    if (existingMember) {
      return { error: "already_member" };
    }

    const existingInvitation = teamData.invitations.find(
      (i) =>
        i.workspaceId === workspaceId &&
        i.email.toLowerCase() === normalizedEmail &&
        i.status === "pending" &&
        new Date(i.expiresAt) > new Date()
    );
    if (existingInvitation) {
      return { error: "already_invited" };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const invitation: TeamInvitation = {
      id: generateId(),
      workspaceId,
      email: normalizedEmail,
      role,
      invitedBy: invitedByUserId,
      invitedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "pending",
    };

    teamData.invitations.push(invitation);
    await this.saveTeamData(teamData);

    return { invitation };
  },

  async acceptInvitation(
    invitationId: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<TeamMember | null> {
    const teamData = await this.getTeamData();
    const invIndex = teamData.invitations.findIndex((i) => i.id === invitationId);

    if (invIndex === -1) return null;

    const invitation = teamData.invitations[invIndex];
    const now = new Date().toISOString();

    if (invitation.status !== "pending" || new Date(invitation.expiresAt) < new Date()) {
      return null;
    }

    const newMember: TeamMember = {
      id: userId,
      email: userEmail,
      name: userName,
      role: invitation.role,
      joinedAt: now,
      lastActiveAt: now,
      invitedBy: invitation.invitedBy,
      status: "active",
    };

    if (!teamData.members[invitation.workspaceId]) {
      teamData.members[invitation.workspaceId] = [];
    }

    teamData.members[invitation.workspaceId].push(newMember);
    teamData.invitations[invIndex].status = "accepted";

    await this.saveTeamData(teamData);
    return newMember;
  },

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    newRole: TeamRole
  ): Promise<TeamMember | null> {
    const teamData = await this.getTeamData();
    const members = teamData.members[workspaceId];

    if (!members) return null;

    const memberIndex = members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) return null;

    if (members[memberIndex].role === "owner") {
      return null;
    }

    members[memberIndex].role = newRole;
    await this.saveTeamData(teamData);

    return members[memberIndex];
  },

  async removeMember(workspaceId: string, memberId: string): Promise<boolean> {
    const teamData = await this.getTeamData();
    const members = teamData.members[workspaceId];

    if (!members) return false;

    const member = members.find((m) => m.id === memberId);
    if (!member || member.role === "owner") return false;

    teamData.members[workspaceId] = members.filter((m) => m.id !== memberId);
    await this.saveTeamData(teamData);

    return true;
  },

  async updateMemberActivity(workspaceId: string, memberId: string): Promise<void> {
    const teamData = await this.getTeamData();
    const members = teamData.members[workspaceId];

    if (members) {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        member.lastActiveAt = new Date().toISOString();
        await this.saveTeamData(teamData);
      }
    }
  },

  hasPermission(role: TeamRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  },

  getRolePermissions(role: TeamRole): string[] {
    return ROLE_PERMISSIONS[role] || [];
  },

  getRoleDisplayName(role: TeamRole): string {
    const names: Record<TeamRole, string> = {
      owner: "Owner",
      admin: "Admin",
      editor: "Editor",
      viewer: "Viewer",
    };
    return names[role];
  },

  getRoleDescription(role: TeamRole): string {
    const descriptions: Record<TeamRole, string> = {
      owner: "Full access including billing and workspace deletion",
      admin: "Manage team members and all content",
      editor: "Create and edit content, upload media",
      viewer: "View content and analytics only",
    };
    return descriptions[role];
  },

  async getPendingInvitations(workspaceId: string): Promise<TeamInvitation[]> {
    const teamData = await this.getTeamData();
    return teamData.invitations.filter(
      (i) => i.workspaceId === workspaceId && i.status === "pending"
    );
  },

  async cancelInvitation(invitationId: string): Promise<boolean> {
    const teamData = await this.getTeamData();
    const index = teamData.invitations.findIndex((i) => i.id === invitationId);

    if (index === -1) return false;

    teamData.invitations.splice(index, 1);
    await this.saveTeamData(teamData);

    return true;
  },

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const teamData = await this.getTeamData();
    return teamData.workspaces.filter((workspace) => {
      const members = teamData.members[workspace.id] || [];
      return members.some((m) => m.id === userId && m.status === "active");
    });
  },

  async getUserRoleInWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<TeamRole | null> {
    const teamData = await this.getTeamData();
    const members = teamData.members[workspaceId] || [];
    const member = members.find((m) => m.id === userId);
    return member?.role || null;
  },

  async initializeDefaultWorkspace(
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<Workspace> {
    const existingWorkspaces = await this.getUserWorkspaces(userId);

    if (existingWorkspaces.length > 0) {
      return existingWorkspaces[0];
    }

    return this.createWorkspace(
      "My Workspace",
      userId,
      userName,
      userEmail,
      "Your personal content studio"
    );
  },
};
