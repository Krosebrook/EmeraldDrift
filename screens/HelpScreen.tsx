import React from "react";
import { StyleSheet, View, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I connect my social accounts?",
    answer: "Go to Profile > Connected Platforms and tap Connect next to the platform you want to add. Follow the authentication flow to grant access.",
  },
  {
    question: "Can I schedule posts for multiple platforms?",
    answer: "Yes! When creating content in the Studio, select multiple platforms and set your preferred schedule time. Your content will be published to all selected platforms.",
  },
  {
    question: "How do I view my analytics?",
    answer: "Navigate to the Analytics tab to see your performance metrics including followers, engagement, and views across all connected platforms.",
  },
  {
    question: "What file formats are supported?",
    answer: "We support JPEG, PNG, and GIF for images. For videos, MP4 and MOV formats are supported with a maximum file size of 50MB.",
  },
  {
    question: "How do I delete my account?",
    answer: "Go to Profile > scroll to the bottom and tap Delete Account. This will permanently remove all your data and cannot be undone.",
  },
];

export default function HelpScreen() {
  const { theme } = useTheme();
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScreenScrollView>
      <ThemedText type="title2">Help Center</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Find answers to common questions
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <View style={[styles.searchCard, { backgroundColor: theme.cardBackground }]}>
        <Feather name="search" size={20} color={theme.textSecondary} />
        <ThemedText secondary style={{ marginLeft: Spacing.md }}>
          Search help articles...
        </ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Frequently Asked Questions</ThemedText>
      <Spacer height={Spacing.md} />

      {FAQ_ITEMS.map((item, index) => (
        <React.Fragment key={index}>
          <Pressable
            onPress={() => toggleExpand(index)}
            style={({ pressed }) => [
              styles.faqItem,
              { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.faqHeader}>
              <ThemedText style={styles.faqQuestion}>{item.question}</ThemedText>
              <Feather
                name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </View>
            {expandedIndex === index ? (
              <ThemedText secondary style={styles.faqAnswer}>
                {item.answer}
              </ThemedText>
            ) : null}
          </Pressable>
          <Spacer height={Spacing.sm} />
        </React.Fragment>
      ))}

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Quick Links</ThemedText>
      <Spacer height={Spacing.md} />

      <View style={styles.quickLinks}>
        <Pressable
          onPress={() => Linking.openURL("https://example.com/docs")}
          style={({ pressed }) => [
            styles.quickLinkCard,
            { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="book-open" size={24} color={theme.primary} />
          <ThemedText style={styles.quickLinkText}>Documentation</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("https://example.com/tutorials")}
          style={({ pressed }) => [
            styles.quickLinkCard,
            { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="play-circle" size={24} color={theme.primary} />
          <ThemedText style={styles.quickLinkText}>Video Tutorials</ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  faqItem: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontWeight: "600",
    marginRight: Spacing.md,
  },
  faqAnswer: {
    marginTop: Spacing.md,
  },
  quickLinks: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  quickLinkCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  quickLinkText: {
    marginTop: Spacing.sm,
    fontWeight: "500",
    textAlign: "center",
  },
});
