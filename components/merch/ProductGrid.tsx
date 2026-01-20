import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ProductCard } from "./ProductCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MERCH_PRODUCTS } from "@/features/merch/data/products";
import {
  CATEGORY_INFO,
  type MerchProduct,
  type MerchProductType,
} from "@/features/merch/types";

interface ProductGridProps {
  selectedProductId: MerchProductType | null;
  onSelectProduct: (product: MerchProduct) => void;
  columns?: number;
}

type Category = MerchProduct["category"] | "all";

const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: "all", name: "All", icon: "grid" },
  { id: "apparel", name: "Apparel", icon: "user" },
  { id: "drinkware", name: "Drinkware", icon: "coffee" },
  { id: "accessories", name: "Accessories", icon: "shopping-bag" },
  { id: "home", name: "Home", icon: "home" },
  { id: "art", name: "Art", icon: "image" },
];

function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.categoryContainer}>
      {CATEGORIES.map((category) => {
        const selected = selectedCategory === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => onSelectCategory(category.id)}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selected
                  ? theme.primary
                  : theme.backgroundSecondary,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather
              name={
                category.icon as React.ComponentProps<typeof Feather>["name"]
              }
              size={14}
              color={selected ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              type="caption"
              style={{
                color: selected ? "#FFFFFF" : theme.text,
                marginLeft: 4,
                fontWeight: selected ? "600" : "400",
              }}
            >
              {category.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProductGrid({
  selectedProductId,
  onSelectProduct,
  columns = 2,
}: ProductGridProps) {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return MERCH_PRODUCTS;
    }
    return MERCH_PRODUCTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const renderItem = ({
    item,
    index,
  }: {
    item: MerchProduct;
    index: number;
  }) => {
    const isLastInRow = (index + 1) % columns === 0;
    return (
      <View
        style={[styles.gridItem, { marginRight: isLastInRow ? 0 : Spacing.sm }]}
      >
        <ProductCard
          product={item}
          selected={selectedProductId === item.id}
          onSelect={onSelectProduct}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title3">Product Catalog</ThemedText>
        <ThemedText type="caption" secondary>
          {filteredProducts.length} products
        </ThemedText>
      </View>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={columns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
      />
    </View>
  );
}

export function ProductGridCompact({
  selectedProductId,
  onSelectProduct,
}: Omit<ProductGridProps, "columns">) {
  const { theme } = useTheme();
  const popularProducts = useMemo(
    () => MERCH_PRODUCTS.filter((p) => p.popular),
    [],
  );

  return (
    <View style={styles.compactContainer}>
      <ThemedText type="title3" style={styles.compactTitle}>
        Quick Select
      </ThemedText>
      <FlatList
        horizontal
        data={popularProducts}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactList}
        renderItem={({ item }) => (
          <View style={styles.compactItem}>
            <ProductCard
              product={item}
              selected={selectedProductId === item.id}
              onSelect={onSelectProduct}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  gridContent: {
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: "flex-start",
  },
  gridItem: {
    flex: 1,
    maxWidth: "48%",
  },
  compactContainer: {
    marginBottom: Spacing.lg,
  },
  compactTitle: {
    marginBottom: Spacing.md,
  },
  compactList: {
    paddingRight: Spacing.base,
  },
  compactItem: {
    width: 160,
    marginRight: Spacing.sm,
  },
});
