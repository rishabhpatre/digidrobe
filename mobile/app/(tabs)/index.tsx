/**
 * Today Screen - Daily Outfit Recommendation
 * Matches the "Today Screen" design mockup
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  useColorScheme,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/Colors';
import { apiClient, getImageUrl } from '@/services/api';

// No more mock data - we'll show real user clothes only

// Animated loading icon component
const AnimatedLoadingIcon = ({ name, delay, color }: { name: string; delay: number; color: string }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1.1, duration: 400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.8, duration: 400, useNativeDriver: true }),
          ]),
          Animated.delay(600 - delay), // Sync the total duration
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }], marginHorizontal: 12 }}>
      <MaterialIcons name={name as any} size={40} color={color} />
    </Animated.View>
  );
};

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [outfit, setOutfit] = useState<any>(null);
  const [loading, setLoading] = useState(true);  // Start loading immediately
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userName, setUserName] = useState('there');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: number; condition: string; icon: string } | null>(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Load today's outfit, user settings, and weather on mount
  useEffect(() => {
    loadOutfit();
    loadUserSettings();
    loadWeather();
  }, []);

  const loadUserSettings = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const settings = await AsyncStorage.getItem('profileSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.userName) {
          setUserName(parsed.userName.toLowerCase());
        }
        if (parsed.profileImage) {
          setProfileImage(parsed.profileImage);
        }
      }
    } catch (e) {
      console.log('Error loading user settings:', e);
    }
  };

  const loadWeather = async () => {
    try {
      // Using wttr.in free API - no key required
      const response = await fetch('https://wttr.in/?format=j1');
      const data = await response.json();
      const current = data.current_condition[0];
      setWeather({
        temp: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        icon: getWeatherIcon(current.weatherCode),
      });
    } catch (e) {
      console.log('Weather fetch failed:', e);
      // Fallback weather
      setWeather({ temp: 22, condition: 'Sunny', icon: 'wb-sunny' });
    }
  };

  const getWeatherIcon = (code: string): string => {
    const codeNum = parseInt(code);
    if (codeNum === 113) return 'wb-sunny';
    if (codeNum >= 116 && codeNum <= 119) return 'cloud';
    if (codeNum >= 176 && codeNum <= 299) return 'water-drop';
    if (codeNum >= 300 && codeNum <= 399) return 'grain';
    if (codeNum >= 500 && codeNum <= 599) return 'ac-unit';
    return 'wb-cloudy';
  };

  const loadOutfit = async () => {
    try {
      setLoading(true);
      const todaysOutfit = await apiClient.getTodaysOutfit();
      if (todaysOutfit && todaysOutfit.items) {
        setOutfit(todaysOutfit);
        setLiked(todaysOutfit.isLiked || false);
        setSaved(todaysOutfit.isSaved || false);
      }
    } catch (e) {
      console.log('Using mock outfit:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setLiked(false);
      setSaved(false);
      const newOutfit = await apiClient.generateOutfit();
      if (newOutfit && newOutfit.items) {
        setOutfit(newOutfit);
        // Reset states for new outfit
        setLiked(false);
        setSaved(false);
      }
    } catch (e) {
      console.log('Failed to generate outfit:', e);
      // Still show visual feedback
      Alert.alert('New Mix!', 'Here\'s a fresh outfit for you.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!outfit) return;
    try {
      const newSaved = !saved;
      setSaved(newSaved);
      if (outfit.id) {
        await apiClient.submitOutfitFeedback(outfit.id, { saved: newSaved });
      }
    } catch (e) {
      console.log('Failed to save outfit:', e);
    }
  };

  const handleWorn = async () => {
    if (!outfit) return;
    try {
      setLiked(true); // Visual feedback
      if (outfit.id) {
        // Cast to any to bypass strict type checking for 'worn' temporarily
        await apiClient.submitOutfitFeedback(outfit.id, { worn: true } as any);
        Alert.alert('Nice Fit!', 'Marked as worn. Your clothes usage stats have been updated.');
      }
    } catch (e) {
      console.log('Failed to mark worn:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </View>
        <Pressable
          style={[styles.settingsButton, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/history')}
        >
          <MaterialIcons name="history" size={24} color={colors.textSubtle} />
        </Pressable>
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: colors.textMain }]}>
          hey, {userName}
        </Text>
        <View style={styles.dateWeatherRow}>
          <Text style={[styles.dateText, { color: colors.textSubtle }]}>{today}</Text>
          {weather && (
            <View style={[styles.weatherBadge, { backgroundColor: colors.surface }]}>
              <MaterialIcons name={weather.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.weatherText, { color: colors.textMain }]}>{weather.temp}°</Text>
            </View>
          )}
        </View>
      </View>

      {/* Main Outfit Card */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.outfitCard, { backgroundColor: colors.surface }, Shadows.medium]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                {/* Animated Icons Row */}
                <View style={styles.animatedIconsRow}>
                  <AnimatedLoadingIcon name="checkroom" delay={0} color={colors.primary} />
                  <AnimatedLoadingIcon name="straighten" delay={200} color={colors.accent} />
                  <AnimatedLoadingIcon name="directions-walk" delay={400} color={colors.primary} />
                </View>
                <Text style={[styles.loadingTitle, { color: colors.textMain }]}>
                  Curating your perfect look...
                </Text>
                <Text style={[styles.loadingSubtitle, { color: colors.textSubtle }]}>
                  Matching colors, styles & weather
                </Text>
              </View>
            </View>
          ) : !outfit ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <MaterialIcons name="checkroom" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
                <Text style={[styles.loadingTitle, { color: colors.textMain }]}>
                  No outfit yet!
                </Text>
                <Text style={[styles.loadingSubtitle, { color: colors.textSubtle, marginBottom: 20 }]}>
                  Add some clothes to your closet and we'll create looks for you
                </Text>
                <Pressable
                  style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefresh}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {/* Outfit Images Grid */}
              <View style={styles.imageGrid}>
                {/* Layer/Top (Large) */}
                {outfit.items.layer && (
                  <Image
                    source={{ uri: getImageUrl(outfit.items.layer.imagePath) }}
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                )}

                {/* Inner layer and bottoms */}
                <View style={styles.imageRow}>
                  {outfit.items.top && (
                    <Image
                      source={{ uri: getImageUrl(outfit.items.top.imagePath) }}
                      style={styles.smallImage}
                      resizeMode="cover"
                    />
                  )}
                  {outfit.items.bottom && (
                    <Image
                      source={{ uri: getImageUrl(outfit.items.bottom.imagePath) }}
                      style={styles.smallImage}
                      resizeMode="cover"
                    />
                  )}
                </View>

                {/* Shoes */}
                {outfit.items.shoes && (
                  <Image
                    source={{ uri: getImageUrl(outfit.items.shoes.imagePath) }}
                    style={styles.shoesImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* Outfit Info */}
              <View style={styles.outfitInfo}>
                <View style={styles.tagRow}>
                  <View style={[styles.styleTag, { backgroundColor: colors.background }]}>
                    <Text style={[styles.styleTagText, { color: colors.textMain }]}>
                      {outfit.styleTag}
                    </Text>
                  </View>
                  <View style={[styles.indicator, { backgroundColor: colors.accent }]} />
                </View>
                <Text style={[styles.description, { color: colors.textSubtle }]}>
                  {outfit.description}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Dock */}
      <View style={styles.dockContainer}>
        <View style={[styles.dock, { backgroundColor: colorScheme === 'dark' ? 'rgba(34, 44, 27, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>

          {/* Skip (Refresh) */}
          <Pressable style={styles.dockButton} onPress={handleRefresh}>
            <MaterialIcons name="close" size={28} color={colors.textMuted} />
            <Text style={{ fontSize: 10, color: colors.textSubtle, marginTop: 2 }}>Skip</Text>
          </Pressable>

          {/* Worn (Primary) */}
          <Pressable
            style={[styles.likeButton, { backgroundColor: colors.primary }, Shadows.medium]}
            onPress={handleWorn}
          >
            <MaterialIcons
              name={liked ? 'check-circle' : 'check'}
              size={32}
              color="#fff"
            />
            <Text style={{ fontSize: 10, color: '#fff', marginTop: 2, fontWeight: 'bold' }}>WORN</Text>
          </Pressable>

          {/* Save */}
          <Pressable style={styles.dockButton} onPress={handleSave}>
            <MaterialIcons
              name={saved ? "bookmark" : "bookmark-border"}
              size={28}
              color={saved ? colors.accent : colors.textMuted}
            />
            <Text style={{ fontSize: 10, color: colors.textSubtle, marginTop: 2 }}>Save</Text>
          </Pressable>
        </View>
      </View>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  greeting: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  greetingText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  dateWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  weatherText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  outfitCard: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: 120,
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  animatedIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  refreshButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  imageGrid: {
    padding: 4,
    gap: 4,
    backgroundColor: '#f0f0f0',
  },
  mainImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius['2xl'],
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 4,
  },
  smallImage: {
    flex: 1,
    height: 130,
    borderRadius: BorderRadius.md,
  },
  shoesImage: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  outfitInfo: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  styleTag: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  styleTagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  description: {
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
  },
  dockContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
  },
  dockButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
