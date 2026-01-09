/**
 * Profile Screen - Settings & Preferences
 * Matches the "Profile and settings screen" design mockup
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    useColorScheme,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/Colors';
import { apiClient } from '@/services/api';

const VIBES = [
    { key: 'chill', label: 'Chill', icon: 'cloud' },
    { key: 'clean', label: 'Clean', icon: 'auto-awesome' },
    { key: 'smart', label: 'Smart', icon: 'business-center' },
];

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [currentVibe, setCurrentVibe] = useState('clean');
    const [weatherEnabled, setWeatherEnabled] = useState(true);
    const [dailyInspo, setDailyInspo] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [userName, setUserName] = useState('Rishabh');
    const [editingName, setEditingName] = useState('');
    const tagline = 'Make it feel like you';

    // Load saved settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    // Save settings when they change
    useEffect(() => {
        saveSettings();
    }, [currentVibe, weatherEnabled, dailyInspo, userName]);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem('profileSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                if (parsed.userName) setUserName(parsed.userName);
                if (parsed.currentVibe) setCurrentVibe(parsed.currentVibe);
                if (parsed.weatherEnabled !== undefined) setWeatherEnabled(parsed.weatherEnabled);
                if (parsed.dailyInspo !== undefined) setDailyInspo(parsed.dailyInspo);
            }
        } catch (e) {
            console.log('Error loading settings:', e);
        }
    };

    const saveSettings = async () => {
        try {
            await AsyncStorage.setItem('profileSettings', JSON.stringify({
                userName,
                currentVibe,
                weatherEnabled,
                dailyInspo,
            }));
        } catch (e) {
            console.log('Error saving settings:', e);
        }
    };

    const handleEditProfile = () => {
        setEditingName(userName);
        setShowEditModal(true);
    };

    const handleSaveProfile = () => {
        if (editingName.trim()) {
            setUserName(editingName.trim());
        }
        setShowEditModal(false);
    };

    const handleResetCloset = () => {
        Alert.alert(
            'Reset Closet',
            'This will remove all your clothing items. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Get all items and delete them
                            const items = await apiClient.getWardrobe();
                            for (const item of items) {
                                await apiClient.deleteClothingItem(item.id);
                            }
                            Alert.alert('Done', 'Your closet has been reset.');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to reset closet. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleVibeChange = (vibe: string) => {
        setCurrentVibe(vibe);
        // Show feedback
        const vibeLabels: Record<string, string> = {
            chill: 'Relaxed & casual',
            clean: 'Minimal & polished',
            smart: 'Sharp & professional',
        };
        // Haptic feedback would go here in production
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                            <View style={styles.avatarGradient} />
                        </View>
                        <Pressable style={[styles.editButton, { backgroundColor: colors.accent }]} onPress={handleEditProfile}>
                            <MaterialIcons name="edit" size={14} color="#fff" />
                        </Pressable>
                    </View>
                    <Text style={[styles.userName, { color: colors.textMain }]}>{userName}</Text>
                    <Text style={[styles.tagline, { color: colors.accent }]}>{tagline}</Text>
                </View>

                {/* Current Vibe */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Current Vibe</Text>
                    <View style={[styles.vibeContainer, { backgroundColor: colors.surface }, Shadows.soft]}>
                        {VIBES.map((vibe) => (
                            <Pressable
                                key={vibe.key}
                                style={[
                                    styles.vibeOption,
                                    currentVibe === vibe.key && { backgroundColor: colors.background },
                                ]}
                                onPress={() => handleVibeChange(vibe.key)}
                            >
                                <MaterialIcons
                                    name={vibe.icon as any}
                                    size={24}
                                    color={currentVibe === vibe.key ? colors.accent : colors.textMuted}
                                />
                                <Text
                                    style={[
                                        styles.vibeLabel,
                                        { color: currentVibe === vibe.key ? colors.accent : colors.textSubtle },
                                    ]}
                                >
                                    {vibe.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Preferences</Text>

                    <View style={[styles.prefItem, { backgroundColor: colors.surface }, Shadows.soft]}>
                        <View style={styles.prefLeft}>
                            <View style={[styles.prefIcon, { backgroundColor: `${colors.accent}20` }]}>
                                <MaterialIcons name="wb-sunny" size={22} color={colors.accent} />
                            </View>
                            <View>
                                <Text style={[styles.prefTitle, { color: colors.textMain }]}>Weather-based fits</Text>
                                <Text style={[styles.prefSubtitle, { color: colors.textSubtle }]}>
                                    Match outfit to local forecast
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={weatherEnabled}
                            onValueChange={setWeatherEnabled}
                            trackColor={{ false: colors.border, true: colors.accent }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={[styles.prefItem, { backgroundColor: colors.surface }, Shadows.soft]}>
                        <View style={styles.prefLeft}>
                            <View style={[styles.prefIcon, { backgroundColor: `${colors.primary}20` }]}>
                                <MaterialIcons name="lightbulb" size={22} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.prefTitle, { color: colors.textMain }]}>Daily Inspo</Text>
                                <Text style={[styles.prefSubtitle, { color: colors.textSubtle }]}>
                                    Morning outfit notifications
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={dailyInspo}
                            onValueChange={setDailyInspo}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Reset */}
                <Pressable style={[styles.resetButton, { borderColor: colors.border }]} onPress={handleResetCloset}>
                    <MaterialIcons name="refresh" size={20} color={colors.textSubtle} />
                    <Text style={[styles.resetText, { color: colors.textSubtle }]}>Reset Closet</Text>
                </Pressable>

                <Text style={[styles.version, { color: colors.textMuted }]}>digidrobe v1.1.0</Text>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={showEditModal} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textMain }]}>Edit Profile</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
                            value={editingName}
                            onChangeText={setEditingName}
                            placeholder="Your name"
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <Pressable style={[styles.modalButton, { borderColor: colors.border }]} onPress={() => setShowEditModal(false)}>
                                <Text style={[styles.modalButtonText, { color: colors.textSubtle }]}>Cancel</Text>
                            </Pressable>
                            <Pressable style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
                                <Text style={[styles.modalButtonText, { color: '#131b0e' }]}>Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 120,
    },
    avatarSection: {
        alignItems: 'center',
        paddingTop: Spacing['3xl'],
        paddingBottom: Spacing['2xl'],
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
    },
    avatarGradient: {
        flex: 1,
        backgroundColor: '#4c99e6',
        opacity: 0.8,
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.lg,
    },
    tagline: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginTop: Spacing.xs,
    },
    section: {
        marginBottom: Spacing['2xl'],
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.md,
    },
    vibeContainer: {
        flexDirection: 'row',
        borderRadius: BorderRadius.xl,
        padding: Spacing.sm,
    },
    vibeOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    vibeLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    prefItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
    },
    prefLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    prefIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    prefTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    prefSubtitle: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginTop: Spacing.lg,
    },
    resetText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    version: {
        textAlign: 'center',
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing['2xl'],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        width: '100%',
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.lg,
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        fontSize: Typography.fontSize.base,
        marginBottom: Spacing.lg,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
    },
    modalButtonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
});
