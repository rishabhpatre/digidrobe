/**
 * Fits History Screen
 * Shows past outfit recommendations with feedback
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    useColorScheme,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Typography } from '@/constants/Colors';
import { apiClient, Outfit } from '@/services/api';

export default function HistoryScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [activeFilter, setActiveFilter] = React.useState('All');
    const [history, setHistory] = React.useState<Outfit[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await apiClient.getOutfitHistory();
            setHistory(data);
        } catch (e) {
            console.log('Failed to load history:', e);
        } finally {
            setLoading(false);
        }
    };

    const getFeedbackStatus = (item: Outfit) => {
        if (item.isLiked) return 'worn'; // Mapped isLiked -> worn
        if (item.isSaved) return 'saved';
        return 'skipped';
    };

    const FILTERS = ['All', 'Worn', 'Saved', 'Skipped']; // 'Worn' instead of 'Loved'

    const filteredHistory = history.filter(item => {
        if (activeFilter === 'All') return true;
        const status = getFeedbackStatus(item);
        if (activeFilter === 'Worn') return status === 'worn';
        if (activeFilter === 'Saved') return status === 'saved';
        if (activeFilter === 'Skipped') return status === 'skipped';
        return true;
    });

    const getFeedbackColor = (feedback: string) => {
        switch (feedback) {
            case 'worn': return colors.primary;
            case 'saved': return colors.accent;
            case 'skipped': return colors.textMuted;
            default: return colors.textSubtle;
        }
    };

    const getFeedbackIcon = (feedback: string) => {
        switch (feedback) {
            case 'worn': return 'check-circle'; // Worn icon
            case 'saved': return 'bookmark';
            case 'skipped': return 'close';
            default: return 'help-outline';
        }
    };

    const renderHistoryItem = ({ item }: { item: Outfit }) => (
        <View style={styles.historyItem}>
            <View style={styles.dateRow}>
                <Text style={[styles.dateText, { color: colors.textMain }]}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown Date'}
                </Text>
                <View style={[styles.feedbackBadge, { backgroundColor: getFeedbackColor(getFeedbackStatus(item)) }]}>
                    <MaterialIcons name={getFeedbackIcon(getFeedbackStatus(item)) as any} size={14} color="#fff" />
                </View>
            </View>

            <View style={styles.outfitPreview}>
                {item.items && Object.values(item.items).slice(0, 3).map((clothingItem, idx) => {
                    // Check if proper clothing item or just URI
                    const uri = (clothingItem as any).imagePath || (clothingItem as any).uri;
                    if (!uri) return null;

                    return (
                        <Image
                            key={idx}
                            source={{ uri }}
                            style={[
                                styles.previewImage,
                                { backgroundColor: colors.surface },
                                idx > 0 && { marginLeft: -40 },
                            ]}
                        />
                    );
                })}
            </View>

            <Text style={[styles.noteText, { color: colors.textSubtle }]}>{item.description}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                </Pressable>
                <Text style={[styles.title, { color: colors.textMain }]}>Fits History</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Filter toggles */}
            <View style={styles.filterRow}>
                {FILTERS.map((filter) => (
                    <Pressable
                        key={filter}
                        style={[
                            styles.filterButton,
                            activeFilter === filter && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: activeFilter === filter ? '#131b0e' : colors.textSubtle },
                            ]}
                        >
                            {filter}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* History list */}
            <FlatList
                data={filteredHistory}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 50, color: colors.textSubtle }}>
                        No history yet. Start exploring outfits!
                    </Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    placeholder: {
        width: 40, // Balance the back button
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    filterButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    filterText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['4xl'],
    },
    historyItem: {
        paddingVertical: Spacing.lg,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    dateText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.bold,
    },
    feedbackBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outfitPreview: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    previewImage: {
        width: 80,
        height: 100,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: '#fff',
    },
    noteText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    separator: {
        height: 1,
        marginVertical: Spacing.sm,
    },
});
