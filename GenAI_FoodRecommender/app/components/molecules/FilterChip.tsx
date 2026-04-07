import React from 'react'
import { StyleSheet, View, ScrollView, TouchableOpacity, Text } from 'react-native'
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme'

interface FilterChipProps {
  label: string
  selected: boolean
  onPress: () => void
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipLabel,
          selected && styles.chipLabelSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

interface FilterChipGroupProps {
  options: string[]
  selected: string[]
  onSelect: (value: string) => void
  label?: string
  horizontal?: boolean
}

export function FilterChipGroup({
  options,
  selected,
  onSelect,
  label,
  horizontal = true,
}: FilterChipGroupProps) {
  const content = (
    <>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.chipContainer,
        horizontal && styles.chipContainerHorizontal,
      ]}>
        {options.map((option) => (
          <FilterChip
            key={option}
            label={option}
            selected={selected.includes(option)}
            onPress={() => onSelect(option)}
          />
        ))}
      </View>
    </>
  )

  if (horizontal) {
    return (
      <View>
        {label && <Text style={styles.label}>{label}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainerHorizontal}>
            {options.map((option) => (
              <FilterChip
                key={option}
                label={option}
                selected={selected.includes(option)}
                onPress={() => onSelect(option)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }

  return <View>{content}</View>
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipLabel: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium as any,
  },
  chipLabelSelected: {
    color: Colors.text.inverse,
  },
  label: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipContainerHorizontal: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
})
