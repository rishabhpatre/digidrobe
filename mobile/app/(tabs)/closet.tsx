/**
 * Closet Screen - Wardrobe Gallery
 * Matches the "My Closet" design mockup
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Pressable,
    useColorScheme,
    FlatList,
    Dimensions,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows, Typography, Categories } from '@/constants/Colors';
import { useWardrobe } from '@/services/hooks';
import { apiClient } from '@/services/api';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - Spacing.xl * 2 - Spacing.lg) / 2;

// Fallback mock data when API is unavailable
const MOCK_WARDROBE = [
    { id: 1, name: 'white tee', category: 'tops', primaryColor: 'white', imagePath: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', style: 'casual' },
    { id: 2, name: 'blue denim', category: 'bottoms', primaryColor: 'blue', imagePath: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', style: 'casual' },
    { id: 3, name: 'black hoodie', category: 'tops', primaryColor: 'black', imagePath: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', style: 'casual' },
    { id: 4, name: 'puffer jacket', category: 'layers', primaryColor: 'gray', imagePath: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400', style: 'casual' },
    { id: 5, name: 'new balance', category: 'shoes', primaryColor: 'white', imagePath: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400', style: 'sporty' },
    { id: 6, name: 'linen shirt', category: 'tops', primaryColor: 'beige', imagePath: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', style: 'casual' },
];

export default function ClosetScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [activeCategory, setActiveCategory] = useState('all');
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Try to use API, fall back to mock data
    const { items: apiItems, loading, error, refresh } = useWardrobe(activeCategory === 'all' ? undefined : activeCategory);

    // Use API data if available, otherwise use mock data
    const wardrobeItems = (apiItems.length > 0 ? apiItems : MOCK_WARDROBE).filter(item => !deletedIds.includes(item.id));

    // Filter by category and search query
    const filteredItems = wardrobeItems
        .filter(item => activeCategory === 'all' || item.category === activeCategory)
        .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleDeleteItem = (item: typeof MOCK_WARDROBE[0]) => {
        Alert.alert(
            'Delete Item',
            `Remove "${item.name}" from your closet?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.deleteClothingItem(item.id);
                            setDeletedIds(prev => [...prev, item.id]);
                        } catch (e) {
                            // Still remove from UI even if API fails
                            setDeletedIds(prev => [...prev, item.id]);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: typeof MOCK_WARDROBE[0] }) => (
        <Pressable
            style={[styles.itemCard, { backgroundColor: colors.surface }, Shadows.soft]}
            onPress={() => {/* Navigate to item detail */ }}
            onLongPress={() => handleDeleteItem(item)}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.imagePath || 'https://via.placeholder.com/200' }}
                    style={styles.itemImage}
                    resizeMode="cover"
                />
                <Pressable style={styles.favoriteButton}>
                    <MaterialIcons name="favorite-border" size={18} color="#fff" />
                </Pressable>
            </View>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.textMain }]}>{item.name}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSubtle }]}>{item.primaryColor || item.style}</Text>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textMain }]}>my closet</Text>
                <Pressable style={styles.searchButton} onPress={() => setShowSearch(true)}>
                    <MaterialIcons name="search" size={28} color={colors.textMain} />
                </Pressable>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {Categories.map((cat) => (
                        <Pressable
                            key={cat.key}
                            style={[
                                styles.filterChip,
                                activeCategory === cat.key
                                    ? { backgroundColor: colors.primary }
                                    : { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                            onPress={() => setActiveCategory(cat.key)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: activeCategory === cat.key ? '#131b0e' : colors.textSubtle },
                                ]}
                            >
                                {cat.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Grid */}
            <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            <Pressable
                style={[styles.fab, { backgroundColor: colors.primary }, Shadows.primaryGlow]}
                onPress={() => router.push('/add-item')}
            >
                <MaterialIcons name="add" size={32} color="#fff" />
            </Pressable>

            {/* Search Modal */}
            <Modal visible={showSearch} transparent animationType="fade">
                <Pressable style={styles.searchOverlay} onPress={() => setShowSearch(false)}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                        <View style={styles.searchInputRow}>
                            <MaterialIcons name="search" size={24} color={colors.textMuted} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.textMain }]}
                                placeholder="Search your closet..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="close" size={20} color={colors.textMuted} />
                                </Pressable>
                            )}
                        </View>
                        <Pressable
                            style={[styles.searchDone, { backgroundColor: colors.primary }]}
                            onPress={() => setShowSearch(false)}
                        >
                            <Text style={styles.searchDoneText}>Done</Text>
                        </Pressable>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.extrabold,
        textTransform: 'lowercase',
        letterSpacing: -0.5,
    },
    searchButton: {
        padding: Spacing.sm,
    },
    filterContainer: {
        paddingVertical: Spacing.sm,
    },
    filterScroll: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    filterChip: {
        height: 40,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.soft,
    },
    filterText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        textTransform: 'lowercase',
    },
    gridContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: 120,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: Spacing['2xl'],
    },
    itemCard: {
        width: ITEM_WIDTH,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 3 / 4,
        position: 'relative',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    favoriteButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    itemInfo: {
        padding: Spacing.md,
        paddingTop: Spacing.sm,
    },
    itemName: {
        fontSize: Typography.fontSize.base - 1,
        fontWeight: Typography.fontWeight.bold,
        textTransform: 'lowercase',
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
        textTransform: 'lowercase',
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: Spacing.xl,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        paddingTop: 100,
        paddingHorizontal: Spacing.xl,
    },
    searchContainer: {
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
    },
    searchInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.lg,
        paddingVertical: Spacing.md,
    },
    searchDone: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    searchDoneText: {
        color: '#fff',
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
});
