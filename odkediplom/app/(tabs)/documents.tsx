import { useApp } from "@/contexts/AppContext";
import { documentCategories } from "@/mocks/documents";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { Calendar, Download, FileText } from "lucide-react-native";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DocumentsScreen() {
  const { documents } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("Бүх баримт");

  const filteredDocuments =
    selectedCategory === "Бүх баримт"
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  const getCategoryCount = (category: string) => {
    if (category === "Бүх баримт") return documents.length;
    return documents.filter((doc) => doc.category === category).length;
  };

  const getFileIcon = (type: string) => {
    return <FileText size={24} color="#4F46E5" strokeWidth={2} />;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {documentCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(category);
            }}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
            <View
              style={[
                styles.categoryBadge,
                selectedCategory === category && styles.categoryBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,
                  selectedCategory === category &&
                    styles.categoryBadgeTextActive,
                ]}
              >
                {getCategoryCount(category)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyStateText}>Баримт олдсонгүй</Text>
          </View>
        ) : (
          <View style={styles.documentList}>
            {filteredDocuments.map((document) => (
              <TouchableOpacity
                key={document.id}
                style={styles.documentCard}
                activeOpacity={0.7}
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              >
                <View style={styles.documentIconContainer}>
                  {getFileIcon(document.type)}
                </View>

                <View style={styles.documentContent}>
                  <Text style={styles.documentName} numberOfLines={2}>
                    {document.name}
                  </Text>
                  <View style={styles.documentMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color="#9CA3AF" />
                      <Text style={styles.metaText}>
                        {format(document.uploadedAt, "MMM d, yyyy")}
                      </Text>
                    </View>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.metaText}>{document.size}</Text>
                  </View>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>
                      {document.category}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
                >
                  <Download size={20} color="#4F46E5" strokeWidth={2} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  categoryScroll: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    maxHeight: 64,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: "#EEF2FF",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#4F46E5",
  },
  categoryBadge: {
    backgroundColor: "#E5E7EB",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  categoryBadgeActive: {
    backgroundColor: "#4F46E5",
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#6B7280",
  },
  categoryBadgeTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  documentList: {
    padding: 20,
  },
  documentCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  documentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  documentContent: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 8,
    lineHeight: 22,
  },
  documentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  metaDivider: {
    fontSize: 13,
    color: "#D1D5DB",
    marginHorizontal: 8,
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500" as const,
    marginTop: 12,
  },
});
