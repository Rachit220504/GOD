import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';

interface PetCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
  petLevel: number;
  unlockedAccessories: string[];
  onAccessoryChange: (accessory: string) => void;
  currentAccessory: string;
}

const ACCESSORIES = [
  { id: 'none', emoji: '', name: 'No Accessory', unlockLevel: 1 },
  { id: 'bow', emoji: '🎀', name: 'Bow', unlockLevel: 2 },
  { id: 'hat', emoji: '🧢', name: 'Cap', unlockLevel: 4 },
  { id: 'glasses', emoji: '👓', name: 'Glasses', unlockLevel: 6 },
  { id: 'crown', emoji: '👑', name: 'Crown', unlockLevel: 8 },
  { id: 'wand', emoji: '🪄', name: 'Magic Wand', unlockLevel: 10 },
  { id: 'cape', emoji: '🦸', name: 'Hero Cape', unlockLevel: 12 },
];

const PET_COLORS = [
  { id: 'default', name: 'Default', color: '#FFD93D' },
  { id: 'blue', name: 'Blue', color: '#6BCF7F' },
  { id: 'pink', name: 'Pink', color: '#FF69B4' },
  { id: 'purple', name: 'Purple', color: '#9B59B6' },
  { id: 'orange', name: 'Orange', color: '#FF8C00' },
];

export function PetCustomizationModal({ 
  visible, 
  onClose, 
  petLevel, 
  unlockedAccessories, 
  onAccessoryChange,
  currentAccessory 
}: PetCustomizationModalProps) {
  const [selectedAccessory, setSelectedAccessory] = useState(currentAccessory);
  const [selectedColor, setSelectedColor] = useState('default');

  const isAccessoryUnlocked = (accessoryId: string) => {
    if (accessoryId === 'none') return true;
    const accessory = ACCESSORIES.find(a => a.id === accessoryId);
    return accessory ? accessory.unlockLevel <= petLevel : false;
  };

  const handleAccessorySelect = (accessoryId: string) => {
    if (isAccessoryUnlocked(accessoryId)) {
      setSelectedAccessory(accessoryId);
      onAccessoryChange(accessoryId);
    }
  };

  const getUnlockLevel = (accessoryId: string) => {
    const accessory = ACCESSORIES.find(a => a.id === accessoryId);
    return accessory ? accessory.unlockLevel : 1;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Customize Pet</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Pet Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pet Preview</Text>
            <View style={styles.previewContainer}>
              <View style={[styles.petPreview, { backgroundColor: PET_COLORS.find(c => c.id === selectedColor)?.color || '#FFD93D' }]}>
                <Text style={styles.petEmoji}>🐥</Text>
                {selectedAccessory !== 'none' && (
                  <Text style={styles.accessoryEmoji}>
                    {ACCESSORIES.find(a => a.id === selectedAccessory)?.emoji}
                  </Text>
                )}
              </View>
              <Text style={styles.petLevel}>Level {petLevel}</Text>
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pet Color</Text>
            <View style={styles.colorGrid}>
              {PET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOption,
                    selectedColor === color.id && styles.colorSelected,
                    { backgroundColor: color.color }
                  ]}
                  onPress={() => setSelectedColor(color.id)}
                >
                  {selectedColor === color.id && (
                    <Text style={styles.selectedIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Accessories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessories</Text>
            <View style={styles.accessoryList}>
              {ACCESSORIES.map((accessory) => {
                const isUnlocked = isAccessoryUnlocked(accessory.id);
                const isSelected = selectedAccessory === accessory.id;
                
                return (
                  <TouchableOpacity
                    key={accessory.id}
                    style={[
                      styles.accessoryItem,
                      isSelected && styles.accessorySelected,
                      !isUnlocked && styles.accessoryLocked
                    ]}
                    onPress={() => handleAccessorySelect(accessory.id)}
                    disabled={!isUnlocked}
                  >
                    <View style={styles.accessoryInfo}>
                      <Text style={styles.accessoryEmojiLarge}>
                        {accessory.emoji || '❌'}
                      </Text>
                      <View style={styles.accessoryDetails}>
                        <Text style={[
                          styles.accessoryName,
                          !isUnlocked && styles.accessoryNameLocked
                        ]}>
                          {accessory.name}
                        </Text>
                        {!isUnlocked && (
                          <Text style={styles.unlockText}>
                            Unlock at Level {accessory.unlockLevel}
                          </Text>
                        )}
                        {isUnlocked && isSelected && (
                          <Text style={styles.equippedText}>Equipped</Text>
                        )}
                      </View>
                    </View>
                    {isUnlocked && (
                      <View style={[styles.statusIcon, isSelected && styles.statusSelected]}>
                        <Text style={styles.statusText}>
                          {isSelected ? '✓' : ''}
                        </Text>
                      </View>
                    )}
                    {!isUnlocked && (
                      <View style={styles.lockIcon}>
                        <Text style={styles.lockText}>🔒</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Unlock</Text>
            <View style={styles.tipsCard}>
              <Text style={styles.tipText}>📚 Read daily to gain XP and level up</Text>
              <Text style={styles.tipText}>⭐ Complete achievements for bonus XP</Text>
              <Text style={styles.tipText}>🔥 Maintain reading streaks for multipliers</Text>
              <Text style={styles.tipText}>🎁 Practice phonics to earn extra XP</Text>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={onClose}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.screen,
    backgroundColor: Colors.purple,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  previewContainer: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  petPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  petEmoji: {
    fontSize: 40,
  },
  accessoryEmoji: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 24,
  },
  petLevel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.purple,
  },
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  colorSelected: {
    borderColor: Colors.purple,
  },
  selectedIcon: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '800',
  },
  accessoryList: {
    gap: Spacing.sm,
  },
  accessoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  accessorySelected: {
    backgroundColor: Colors.lavender,
    borderWidth: 2,
    borderColor: Colors.purple,
  },
  accessoryLocked: {
    opacity: 0.6,
  },
  accessoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accessoryEmojiLarge: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  accessoryDetails: {
    flex: 1,
  },
  accessoryName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  accessoryNameLocked: {
    color: Colors.textSecondary,
  },
  unlockText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  equippedText: {
    fontSize: FontSize.sm,
    color: Colors.purple,
    fontWeight: '600',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSelected: {
    backgroundColor: Colors.purple,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '800',
  },
  lockIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 16,
  },
  tipsCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  tipText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  saveButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.white,
  },
});
