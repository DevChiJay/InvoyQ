import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchBar } from "./SearchBar";

export interface SelectOption {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Called with the raw search query (debounced). Use for server-side filtering. When provided, client-side filtering is skipped. */
  onSearchChange?: (query: string) => void;
  /** Show a loading indicator in the options list (e.g. while fetching server-side results) */
  loading?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearchChange,
  loading = false,
}: SelectProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const selectedOption = options.find((opt) => opt.value === value);

  // Notify parent for server-side filtering; skip client-side filter when callback is provided
  React.useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange]);

  // Filter options based on search query (only when no server-side handler)
  const filteredOptions = useMemo(() => {
    if (!searchable || !debouncedSearch || onSearchChange) return options;
    const query = debouncedSearch.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, debouncedSearch, searchable, onSearchChange]);

  // Reset search when modal closes
  const handleModalClose = () => {
    setModalVisible(false);
    setSearchQuery("");
    if (onSearchChange) onSearchChange("");
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.select,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectContent}>
          {selectedOption?.icon && (
            <Ionicons
              name={selectedOption.icon}
              size={20}
              color={colors.text}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.selectText,
              {
                color: selectedOption ? colors.text : colors.textSecondary,
              },
            ]}
          >
            {selectedOption?.label || placeholder || "Select an option"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {placeholder || "Select an option"}
              </Text>
              <TouchableOpacity onPress={handleModalClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={searchPlaceholder}
                />
              </View>
            )}

            {loading && (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 8 }}
              />
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              renderItem={({ item: option }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        option.value === value
                          ? colors.primaryLight
                          : "transparent",
                    },
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    handleModalClose();
                  }}
                >
                  {option.icon && (
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={
                        option.value === value ? colors.primary : colors.text
                      }
                      style={styles.icon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          option.value === value ? colors.primary : colors.text,
                        fontWeight: option.value === value ? "600" : "400",
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  select: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectText: {
    fontSize: 16,
  },
  icon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});
