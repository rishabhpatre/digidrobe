/**
 * Onboarding Screen 1 - Smart Fit Intro
 * First screen of the onboarding flow
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    useColorScheme,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function OnboardingScreen1() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <MaterialIcons name="checkroom" size={20} color={colors.textMuted} />
                <Text style={[styles.logoText, { color: colors.textMuted }]}>DIGIDROBE</Text>
            </View>

            {/* Image Collage matching new design */}
            <View style={styles.imageArea}>
                <View style={styles.imageLayout}>
                    {/* Main coat image - left side */}
                    <View style={styles.leftColumn}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500' }}
                            style={[styles.mainImage, { backgroundColor: colors.surface }]}
                            resizeMode="cover"
                        />
                        {/* New fit badge */}
                        <View style={[styles.newFitBadge, { backgroundColor: colors.surface }]}>
                            <View style={[styles.greenDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.newFitText, { color: colors.textMain }]}>New fit</Text>
                        </View>
                    </View>

                    {/* Right column - jeans and sneakers */}
                    <View style={styles.rightColumn}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' }}
                            style={[styles.smallImage, { backgroundColor: colors.surface }]}
                            resizeMode="cover"
                        />
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400' }}
                            style={[styles.smallImage, { backgroundColor: colors.surface }]}
                            resizeMode="cover"
                        />
                    </View>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.textMain }]}>
                    your clothes.{'\n'}<Text style={[styles.titleBold, { color: colors.textMain }]}>smarter fits.</Text>
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
                    digital closet. fresh combos.{'\n'}zero overthinking.
                </Text>
            </View>

            {/* CTA Button */}
            <Pressable
                style={[styles.button, { backgroundColor: colors.primary }, Shadows.primaryGlow]}
                onPress={() => router.push('/(onboarding)/step2')}
            >
                <Text style={styles.buttonText}>start styling</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingTop: Spacing.lg,
    },
    logoText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
        letterSpacing: 2,
    },
    imageArea: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
    },
    imageLayout: {
        flexDirection: 'row',
        gap: Spacing.md,
        height: 320,
    },
    leftColumn: {
        flex: 1.2,
        position: 'relative',
    },
    mainImage: {
        flex: 1,
        borderRadius: BorderRadius['2xl'],
    },
    newFitBadge: {
        position: 'absolute',
        bottom: Spacing.md,
        right: -20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
        ...Shadows.soft,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    newFitText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    rightColumn: {
        flex: 0.8,
        gap: Spacing.md,
    },
    smallImage: {
        flex: 1,
        borderRadius: BorderRadius['2xl'],
    },
    content: {
        paddingBottom: Spacing['2xl'],
    },
    title: {
        fontSize: 34,
        fontWeight: Typography.fontWeight.bold,
        lineHeight: 42,
        letterSpacing: -0.5,
    },
    titleBold: {
        fontWeight: Typography.fontWeight.bold,
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
        lineHeight: 24,
        marginTop: Spacing.md,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing['2xl'],
    },
    buttonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
});
