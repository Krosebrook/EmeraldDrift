import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import { useTeamContext } from "@/context/TeamContext";
import { TeamRole, TeamMember, teamService } from "@/services/teamService";

type RoleOption = { value: TeamRole; label: string; description: string };

const ROLE_OPTIONS: RoleOption[] = [
  { value: "admin", label: "Admin", description: "Manage team and content" },
  { value: "editor", label: "Editor", description: "Create and edit content" },
  { value: "viewer", label: "Viewer", description: "View only access" },
];

export default function TeamScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    currentWorkspace,
    members,
    pendingInvitations,
    userRole,
    isLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    hasPermission,
    refreshTeam,
  } = useTeamContext();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>("editor");
  const [isInviting, setIsInviting] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshTeam();
    }, [refreshTeam])
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsInviting(true);

    try {
      const result = await inviteMember(inviteEmail.trim().toLowerCase(), selectedRole);
      if (result.success && result.invitation) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setShowInviteModal(false);
        setInviteEmail("");
        setSelectedRole("editor");
        Alert.alert("Invitation Sent", `An invitation has been sent to ${result.invitation.email}`);
      } else {
        let errorMessage = "Failed to send invitation. Please try again.";
        if (result.error === "already_member") {
          errorMessage = "This person is already a member of the workspace.";
        } else if (result.error === "already_invited") {
          errorMessage = "An invitation has already been sent to this email address.";
        }
        Alert.alert("Cannot Invite", errorMessage);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (member: TeamMember, newRole: TeamRole) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const success = await updateMemberRole(member.id, newRole);
    if (success) {
      setShowRoleModal(false);
      setEditingMember(null);
    } else {
      Alert.alert("Error", "Failed to update role. Please try again.");
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    Alert.alert(
      "Remove Team Member",
      `Are you sure you want to remove ${member.name} from the workspace?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const success = await removeMember(member.id);
            if (success) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
            } else {
              Alert.alert("Error", "Failed to remove member. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleCancelInvitation = (invitationId: string, email: string) => {
    Alert.alert(
      "Cancel Invitation",
      `Are you sure you want to cancel the invitation to ${email}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Invitation",
          style: "destructive",
          onPress: async () => {
            await cancelInvitation(invitationId);
          },
        },
      ]
    );
  };

  const openRoleModal = (member: TeamMember) => {
    if (member.role === "owner") return;
    setEditingMember(member);
    setShowRoleModal(true);
  };

  const canManageMembers = hasPermission("members.manage") || hasPermission("members.invite");
  const canRemoveMembers = hasPermission("members.remove");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView>
        <View style={styles.headerSection}>
          <View>
            <ThemedText type="title2">
              {currentWorkspace?.name || "Workspace"}
            </ThemedText>
            <ThemedText secondary style={{ marginTop: 4 }}>
              {members.length} {members.length === 1 ? "member" : "members"}
            </ThemedText>
          </View>

          {canManageMembers ? (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowInviteModal(true);
              }}
              style={[styles.inviteButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="user-plus" size={16} color="#FFFFFF" />
              <ThemedText style={{ color: "#FFFFFF", marginLeft: 8, fontWeight: "600" }}>
                Invite
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={18} color={theme.primary} />
            <ThemedText type="title3" style={{ marginLeft: Spacing.sm }}>
              Team Members
            </ThemedText>
          </View>

          {members.map((member, index) => (
            <Pressable
              key={member.id}
              onPress={() => openRoleModal(member)}
              disabled={member.role === "owner" || !canManageMembers}
              style={({ pressed }) => [
                styles.memberRow,
                index < members.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
                { opacity: pressed && member.role !== "owner" ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}>
                <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
                  {getInitials(member.name)}
                </ThemedText>
              </View>

              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <ThemedText type="body" style={{ fontWeight: "500" }}>
                    {member.name}
                  </ThemedText>
                  {member.role === "owner" ? (
                    <View style={[styles.roleBadge, { backgroundColor: theme.warning + "20" }]}>
                      <Feather name="star" size={10} color={theme.warning} />
                      <ThemedText style={{ fontSize: 11, color: theme.warning, marginLeft: 4 }}>
                        Owner
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                <ThemedText secondary type="caption">
                  {member.email}
                </ThemedText>
                <ThemedText secondary type="caption" style={{ marginTop: 2 }}>
                  Active {formatDate(member.lastActiveAt)}
                </ThemedText>
              </View>

              <View style={styles.memberActions}>
                {member.role !== "owner" ? (
                  <View style={[styles.roleChip, { backgroundColor: theme.backgroundTertiary }]}>
                    <ThemedText type="caption">
                      {teamService.getRoleDisplayName(member.role)}
                    </ThemedText>
                  </View>
                ) : null}
                {canManageMembers && member.role !== "owner" ? (
                  <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        {pendingInvitations.length > 0 ? (
          <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Feather name="mail" size={18} color={theme.warning} />
              <ThemedText type="title3" style={{ marginLeft: Spacing.sm }}>
                Pending Invitations
              </ThemedText>
            </View>

            {pendingInvitations.map((invitation, index) => (
              <View
                key={invitation.id}
                style={[
                  styles.memberRow,
                  index < pendingInvitations.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: theme.warning + "20" }]}>
                  <Feather name="clock" size={18} color={theme.warning} />
                </View>

                <View style={styles.memberInfo}>
                  <ThemedText type="body">{invitation.email}</ThemedText>
                  <ThemedText secondary type="caption">
                    Invited as {teamService.getRoleDisplayName(invitation.role)}
                  </ThemedText>
                  <ThemedText secondary type="caption" style={{ marginTop: 2 }}>
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </ThemedText>
                </View>

                {canManageMembers ? (
                  <Pressable
                    onPress={() => handleCancelInvitation(invitation.id, invitation.email)}
                    style={[styles.cancelButton, { backgroundColor: theme.error + "15" }]}
                  >
                    <Feather name="x" size={16} color={theme.error} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <Feather name="shield" size={18} color={theme.success} />
            <ThemedText type="title3" style={{ marginLeft: Spacing.sm }}>
              Your Permissions
            </ThemedText>
          </View>

          <View style={styles.permissionsContent}>
            <View style={[styles.currentRoleBadge, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="user" size={16} color={theme.primary} />
              <ThemedText style={{ marginLeft: Spacing.sm, color: theme.primary, fontWeight: "600" }}>
                {userRole ? teamService.getRoleDisplayName(userRole) : "Member"}
              </ThemedText>
            </View>
            <ThemedText secondary type="caption" style={{ marginTop: Spacing.sm }}>
              {userRole ? teamService.getRoleDescription(userRole) : ""}
            </ThemedText>
          </View>
        </View>

        <Spacer height={Spacing["2xl"]} />
      </ScreenScrollView>

      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowInviteModal(false)}>
              <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="title3">Invite Member</ThemedText>
            <Pressable onPress={handleInvite} disabled={isInviting}>
              {isInviting ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>Send</ThemedText>
              )}
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText type="caption" secondary style={{ marginBottom: Spacing.xs }}>
                Email Address
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.backgroundSecondary, color: theme.text },
                ]}
                placeholder="colleague@company.com"
                placeholderTextColor={theme.textSecondary}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="caption" secondary style={{ marginBottom: Spacing.xs }}>
                Role
              </ThemedText>
              {ROLE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedRole(option.value);
                  }}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor:
                        selectedRole === option.value
                          ? theme.primary + "15"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedRole === option.value ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <View style={styles.roleOptionContent}>
                    <ThemedText
                      style={{
                        fontWeight: selectedRole === option.value ? "600" : "400",
                        color: selectedRole === option.value ? theme.primary : theme.text,
                      }}
                    >
                      {option.label}
                    </ThemedText>
                    <ThemedText type="caption" secondary>
                      {option.description}
                    </ThemedText>
                  </View>
                  {selectedRole === option.value ? (
                    <Feather name="check-circle" size={20} color={theme.primary} />
                  ) : (
                    <View
                      style={[styles.radioOuter, { borderColor: theme.textSecondary }]}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </ThemedView>
      </Modal>

      <Modal
        visible={showRoleModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRoleModal(false)}
      >
        <Pressable
          style={styles.roleModalOverlay}
          onPress={() => setShowRoleModal(false)}
        >
          <View
            style={[styles.roleModalContent, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.roleModalHeader}>
              <ThemedText type="title3">Change Role</ThemedText>
              <ThemedText secondary style={{ marginTop: 4 }}>
                {editingMember?.name}
              </ThemedText>
            </View>

            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => editingMember && handleUpdateRole(editingMember, option.value)}
                style={[
                  styles.roleModalOption,
                  {
                    backgroundColor:
                      editingMember?.role === option.value
                        ? theme.primary + "15"
                        : "transparent",
                  },
                ]}
              >
                <View>
                  <ThemedText
                    style={{
                      fontWeight: editingMember?.role === option.value ? "600" : "400",
                    }}
                  >
                    {option.label}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {option.description}
                  </ThemedText>
                </View>
                {editingMember?.role === option.value ? (
                  <Feather name="check" size={20} color={theme.primary} />
                ) : null}
              </Pressable>
            ))}

            {canRemoveMembers ? (
              <Pressable
                onPress={() => {
                  setShowRoleModal(false);
                  if (editingMember) {
                    handleRemoveMember(editingMember);
                  }
                }}
                style={[styles.removeButton, { backgroundColor: theme.error + "15" }]}
              >
                <Feather name="user-minus" size={18} color={theme.error} />
                <ThemedText style={{ marginLeft: Spacing.sm, color: theme.error }}>
                  Remove from Team
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  section: {
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  roleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionsContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  currentRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  modalContent: {
    padding: Spacing.base,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  roleOptionContent: {
    flex: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  roleModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  roleModalContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  roleModalHeader: {
    padding: Spacing.md,
    alignItems: "center",
  },
  roleModalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
