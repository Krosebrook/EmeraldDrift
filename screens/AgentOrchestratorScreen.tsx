import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { agentService, AGENT_CAPABILITIES } from "@/features";
import type { Agent, AgentTask, AgentWorkflow, AgentCapability } from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function AgentOrchestratorScreen() {
  const { theme, isDark } = useTheme();
  const { isMobile, contentWidth } = useResponsive();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<AgentCapability[]>(["text_generation"]);
  const [taskInput, setTaskInput] = useState("");
  
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [agentsResult, workflowsResult, tasksResult] = await Promise.all([
      agentService.getAgents(),
      agentService.getWorkflows(),
      agentService.getAgentTasks(),
    ]);

    if (isOk(agentsResult)) setAgents(agentsResult.data);
    if (isOk(workflowsResult)) setWorkflows(workflowsResult.data);
    if (isOk(tasksResult)) setTasks(tasksResult.data.slice(0, 20));
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      Alert.alert("Required", "Please enter an agent name.");
      return;
    }

    const result = await agentService.createAgent({
      name: agentName.trim(),
      description: agentDescription.trim(),
      config: {
        capabilities: selectedCapabilities,
      },
    });

    if (isOk(result)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
      setShowCreateAgent(false);
      resetAgentForm();
    } else {
      Alert.alert("Error", "Failed to create agent.");
    }
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim() || selectedAgentIds.length === 0) {
      Alert.alert("Required", "Please enter a name and select at least one agent.");
      return;
    }

    const result = await agentService.createWorkflow({
      name: workflowName.trim(),
      description: workflowDescription.trim(),
      agents: selectedAgentIds,
    });

    if (isOk(result)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
      setShowCreateWorkflow(false);
      resetWorkflowForm();
    } else {
      Alert.alert("Error", "Failed to create workflow.");
    }
  };

  const handleExecuteAgent = async () => {
    if (!selectedAgent || !taskInput.trim()) {
      Alert.alert("Required", "Please select an agent and enter a task.");
      return;
    }

    setIsExecuting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await agentService.executeAgent(selectedAgent.id, taskInput.trim());

    setIsExecuting(false);

    if (isOk(result)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
      setTaskInput("");
    } else {
      Alert.alert("Execution Failed", "Unable to execute agent task.");
    }
  };

  const handleDeleteAgent = async (id: string) => {
    Alert.alert("Delete Agent", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await agentService.deleteAgent(id);
          loadData();
          if (selectedAgent?.id === id) setSelectedAgent(null);
        },
      },
    ]);
  };

  const handleToggleActive = async (id: string) => {
    await agentService.toggleAgentActive(id);
    loadData();
  };

  const toggleCapability = (cap: AgentCapability) => {
    if (selectedCapabilities.includes(cap)) {
      setSelectedCapabilities(selectedCapabilities.filter((c) => c !== cap));
    } else {
      setSelectedCapabilities([...selectedCapabilities, cap]);
    }
  };

  const toggleAgentSelection = (id: string) => {
    if (selectedAgentIds.includes(id)) {
      setSelectedAgentIds(selectedAgentIds.filter((a) => a !== id));
    } else {
      setSelectedAgentIds([...selectedAgentIds, id]);
    }
  };

  const resetAgentForm = () => {
    setAgentName("");
    setAgentDescription("");
    setSelectedCapabilities(["text_generation"]);
  };

  const resetWorkflowForm = () => {
    setWorkflowName("");
    setWorkflowDescription("");
    setSelectedAgentIds([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#10B981";
      case "running": return "#F59E0B";
      case "failed": return "#EF4444";
      default: return theme.textSecondary;
    }
  };

  const styles = createStyles(theme, isDark, isMobile, contentWidth);

  return (
    <ScreenKeyboardAwareScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title2">Agent Orchestrator</ThemedText>
            <ThemedText type="body" secondary>
              Create and manage AI agents
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                setShowCreateWorkflow(!showCreateWorkflow);
                setShowCreateAgent(false);
              }}
              style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            >
              <Feather name="git-branch" size={18} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => {
                setShowCreateAgent(!showCreateAgent);
                setShowCreateWorkflow(false);
              }}
              style={[styles.headerButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <Spacer height={Spacing.lg} />

        {showCreateAgent ? (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <ThemedText type="subhead">New Agent</ThemedText>
              <Pressable onPress={() => setShowCreateAgent(false)}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Spacer height={Spacing.md} />

            <ThemedText type="caption" secondary>Name</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Agent name..."
              placeholderTextColor={theme.textSecondary}
              value={agentName}
              onChangeText={setAgentName}
            />

            <Spacer height={Spacing.sm} />

            <ThemedText type="caption" secondary>Description</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="What does this agent do?"
              placeholderTextColor={theme.textSecondary}
              value={agentDescription}
              onChangeText={setAgentDescription}
            />

            <Spacer height={Spacing.sm} />

            <ThemedText type="caption" secondary>Capabilities</ThemedText>
            <View style={styles.capabilitiesGrid}>
              {AGENT_CAPABILITIES.map((cap) => (
                <Pressable
                  key={cap.value}
                  onPress={() => toggleCapability(cap.value)}
                  style={[
                    styles.capabilityButton,
                    {
                      backgroundColor: selectedCapabilities.includes(cap.value)
                        ? theme.primary
                        : theme.backgroundSecondary,
                      borderColor: selectedCapabilities.includes(cap.value)
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <Feather
                    name={cap.icon as keyof typeof Feather.glyphMap}
                    size={14}
                    color={selectedCapabilities.includes(cap.value) ? "#FFFFFF" : theme.textSecondary}
                  />
                  <ThemedText
                    style={{
                      color: selectedCapabilities.includes(cap.value) ? "#FFFFFF" : theme.text,
                      fontSize: Typography.caption.fontSize,
                      marginLeft: Spacing.xs,
                    }}
                  >
                    {cap.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer height={Spacing.md} />

            <Button onPress={handleCreateAgent}>
              <View style={styles.buttonContent}>
                <Feather name="cpu" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Create Agent</ThemedText>
              </View>
            </Button>
          </Card>
        ) : null}

        {showCreateWorkflow ? (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <ThemedText type="subhead">New Workflow</ThemedText>
              <Pressable onPress={() => setShowCreateWorkflow(false)}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Spacer height={Spacing.md} />

            <ThemedText type="caption" secondary>Name</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Workflow name..."
              placeholderTextColor={theme.textSecondary}
              value={workflowName}
              onChangeText={setWorkflowName}
            />

            <Spacer height={Spacing.sm} />

            <ThemedText type="caption" secondary>Description</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Workflow description..."
              placeholderTextColor={theme.textSecondary}
              value={workflowDescription}
              onChangeText={setWorkflowDescription}
            />

            <Spacer height={Spacing.sm} />

            <ThemedText type="caption" secondary>Select Agents (in order)</ThemedText>
            <View style={styles.agentSelectionList}>
              {agents.map((agent) => (
                <Pressable
                  key={agent.id}
                  onPress={() => toggleAgentSelection(agent.id)}
                  style={[
                    styles.agentSelectionItem,
                    {
                      backgroundColor: selectedAgentIds.includes(agent.id)
                        ? theme.backgroundTertiary
                        : theme.backgroundSecondary,
                      borderColor: selectedAgentIds.includes(agent.id)
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <View style={styles.agentSelectionInfo}>
                    <ThemedText type="body">{agent.name}</ThemedText>
                    <ThemedText type="caption" secondary>
                      {agent.config.capabilities.slice(0, 2).join(", ")}
                    </ThemedText>
                  </View>
                  {selectedAgentIds.includes(agent.id) ? (
                    <View style={[styles.orderBadge, { backgroundColor: theme.primary }]}>
                      <ThemedText style={{ color: "#FFFFFF", fontSize: 12 }}>
                        {selectedAgentIds.indexOf(agent.id) + 1}
                      </ThemedText>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Spacer height={Spacing.md} />

            <Button onPress={handleCreateWorkflow}>
              <View style={styles.buttonContent}>
                <Feather name="git-branch" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Create Workflow</ThemedText>
              </View>
            </Button>
          </Card>
        ) : null}

        {selectedAgent ? (
          <Card style={styles.executionCard}>
            <View style={styles.formHeader}>
              <View>
                <ThemedText type="subhead">{selectedAgent.name}</ThemedText>
                <ThemedText type="caption" secondary>
                  {selectedAgent.config.capabilities.join(", ")}
                </ThemedText>
              </View>
              <Pressable onPress={() => setSelectedAgent(null)}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Spacer height={Spacing.md} />

            <ThemedText type="caption" secondary>Task Input</ThemedText>
            <TextInput
              style={[styles.input, styles.taskInput, { color: theme.text }]}
              placeholder="Enter your task for this agent..."
              placeholderTextColor={theme.textSecondary}
              value={taskInput}
              onChangeText={setTaskInput}
              multiline
            />

            <Spacer height={Spacing.md} />

            <Button onPress={handleExecuteAgent} disabled={isExecuting}>
              {isExecuting ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText style={styles.buttonText}>Executing...</ThemedText>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="play" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Execute</ThemedText>
                </View>
              )}
            </Button>
          </Card>
        ) : null}

        <Spacer height={Spacing.lg} />

        <ThemedText type="subhead">Agents ({agents.length})</ThemedText>
        <Spacer height={Spacing.sm} />

        {agents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="cpu" size={40} color={theme.textSecondary} />
            <Spacer height={Spacing.sm} />
            <ThemedText type="body" secondary>
              No agents yet. Create your first one!
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.agentsList}>
            {agents.map((agent) => (
              <Pressable
                key={agent.id}
                onPress={() => setSelectedAgent(agent)}
                style={[
                  styles.agentCard,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: selectedAgent?.id === agent.id ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.agentCardHeader}>
                  <View style={[styles.agentIcon, { backgroundColor: theme.primary + "20" }]}>
                    <Feather name="cpu" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.agentCardInfo}>
                    <ThemedText type="subhead">{agent.name}</ThemedText>
                    <ThemedText type="caption" secondary numberOfLines={1}>
                      {agent.description || "No description"}
                    </ThemedText>
                  </View>
                  <View style={styles.agentCardActions}>
                    <Pressable
                      onPress={() => handleToggleActive(agent.id)}
                      style={[
                        styles.statusBadge,
                        { backgroundColor: agent.isActive ? "#10B98120" : theme.backgroundSecondary },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: agent.isActive ? "#10B981" : theme.textSecondary },
                        ]}
                      />
                      <ThemedText
                        style={{
                          fontSize: Typography.caption.fontSize,
                          color: agent.isActive ? "#10B981" : theme.textSecondary,
                        }}
                      >
                        {agent.isActive ? "Active" : "Inactive"}
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteAgent(agent.id)} hitSlop={8}>
                      <Feather name="trash-2" size={16} color={theme.error} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.agentMeta}>
                  <ThemedText type="caption" secondary>
                    {agent.executionCount} executions
                  </ThemedText>
                  <View style={styles.capabilitiesList}>
                    {agent.config.capabilities.slice(0, 3).map((cap) => (
                      <View key={cap} style={[styles.capabilityTag, { backgroundColor: theme.backgroundDefault }]}>
                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>
                          {cap.replace("_", " ")}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {workflows.length > 0 ? (
          <>
            <Spacer height={Spacing.xl} />
            <ThemedText type="subhead">Workflows ({workflows.length})</ThemedText>
            <Spacer height={Spacing.sm} />
            <View style={styles.workflowsList}>
              {workflows.map((workflow) => (
                <Card key={workflow.id} style={styles.workflowCard}>
                  <View style={styles.workflowHeader}>
                    <Feather name="git-branch" size={18} color={theme.primary} />
                    <ThemedText type="subhead" style={{ marginLeft: Spacing.sm }}>
                      {workflow.name}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" secondary>
                    {workflow.agents.length} agents | {workflow.executionCount} runs
                  </ThemedText>
                </Card>
              ))}
            </View>
          </>
        ) : null}

        {tasks.length > 0 ? (
          <>
            <Spacer height={Spacing.xl} />
            <ThemedText type="subhead">Recent Tasks</ThemedText>
            <Spacer height={Spacing.sm} />
            <View style={styles.tasksList}>
              {tasks.slice(0, 5).map((task) => (
                <View
                  key={task.id}
                  style={[styles.taskItem, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <View style={styles.taskInfo}>
                    <ThemedText type="body" numberOfLines={1}>
                      {task.input.substring(0, 50)}...
                    </ThemedText>
                    <ThemedText type="caption" secondary>
                      {new Date(task.startedAt).toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={[styles.taskStatus, { backgroundColor: getStatusColor(task.status) + "20" }]}>
                    <ThemedText style={{ fontSize: 12, color: getStatusColor(task.status) }}>
                      {task.status}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Spacer height={Spacing.xl} />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const createStyles = (theme: any, isDark: boolean, isMobile: boolean, contentWidth: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
    },
    content: {
      padding: Spacing.base,
      maxWidth: contentWidth,
      alignSelf: "center",
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerActions: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },
    formCard: {
      padding: Spacing.base,
      marginBottom: Spacing.md,
    },
    executionCard: {
      padding: Spacing.base,
      marginBottom: Spacing.md,
    },
    formHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    input: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.body.fontSize,
      marginTop: Spacing.xs,
    },
    taskInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    capabilitiesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    capabilityButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
    },
    agentSelectionList: {
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    agentSelectionItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    agentSelectionInfo: {
      flex: 1,
    },
    orderBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyCard: {
      padding: Spacing.xl,
      alignItems: "center",
    },
    agentsList: {
      gap: Spacing.sm,
    },
    agentCard: {
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    agentCardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    agentIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      justifyContent: "center",
      alignItems: "center",
    },
    agentCardInfo: {
      flex: 1,
      marginLeft: Spacing.sm,
    },
    agentCardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      gap: Spacing.xs,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    agentMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: Spacing.sm,
    },
    capabilitiesList: {
      flexDirection: "row",
      gap: Spacing.xs,
    },
    capabilityTag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    workflowsList: {
      gap: Spacing.sm,
    },
    workflowCard: {
      padding: Spacing.md,
    },
    workflowHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.xs,
    },
    tasksList: {
      gap: Spacing.xs,
    },
    taskItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    taskInfo: {
      flex: 1,
    },
    taskStatus: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
  });
