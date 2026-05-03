import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trash2, Plus, Brain, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { encryptObject, decryptObject } from '../utils/security';
import theme from '../data/color-theme';
import YouTubePreview from '../components/YouTubePreview';
import { extractYouTubeId, hideYouTubeUrl } from '../utils/youtube';

type DumpEntry = {
  id: number;
  text: string;
  createdAt: string;
};

const STORAGE_KEY = '@TaskMate_braindump';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const ABSOLUTE_FILL = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const t = new Date();
  const isToday =
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear();
  return isToday
    ? 'Today'
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function BrainDumpScreen() {
  const [entries, setEntries] = useState<DumpEntry[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'thoughts' | 'links' | 'notes'>('thoughts');

  const isLinkEntry = (text: string) => /(https?:\/\/[^\s]+)/g.test(text);

  const isLongEntry = (text: string) => text.length >= 100;

  const displayedEntries = entries.filter(entry => 
    activeTab === 'thoughts' ? !isLinkEntry(entry.text) && !isLongEntry(entry.text) :
    activeTab === 'notes' ? !isLinkEntry(entry.text) && isLongEntry(entry.text) :
    isLinkEntry(entry.text)
  );

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, []),
  );

  const loadEntries = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const decrypted: DumpEntry[] | null = decryptObject(raw);
      if (decrypted) {
        setEntries(decrypted);
      } else {
        const parsed = JSON.parse(raw);
        setEntries(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setEntries([]);
    }
  };

  const persist = async (updated: DumpEntry[]) => {
    try {
      const encrypted = encryptObject(updated);
      await AsyncStorage.setItem(STORAGE_KEY, encrypted);
    } catch {}
  };

  const addEntry = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const newEntry: DumpEntry = {
      id: Date.now(),
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    persist(updated);
    setInput('');
  };

  const deleteEntry = (id: number) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    persist(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Brain Dump</Text>
          <Text style={styles.headerSubtitle}>
             Write it down, free your mind
          </Text>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.sparklesContainer}>
            <Sparkles size={16} color={theme.primary[13]} strokeWidth={2} />
          </View>

          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={addEntry}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.text + '30'}
            multiline
            returnKeyType="done"
            blurOnSubmit
            style={styles.textInput}
          />

          <Pressable
            onPress={addEntry}
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: input.trim()
                  ? pressed
                    ? theme.primary[13] + 'CC'
                    : theme.primary[13]
                  : theme.text + '12',
              },
            ]}
          >
            <Plus
              size={20}
              color={input.trim() ? theme.background : theme.text + '35'}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>

        <View style={styles.tabsShell}>
          {(['thoughts', 'notes', 'links'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const count = entries.filter(e =>
              tab === 'thoughts' ? !isLinkEntry(e.text) && !isLongEntry(e.text) :
              tab === 'notes' ? !isLinkEntry(e.text) && isLongEntry(e.text) :
              isLinkEntry(e.text)
            ).length;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.tabTextActive : styles.tabTextIdle,
                  ]}
                >
                  {tab}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    isActive ? styles.countBadgeActive : styles.countBadgeIdle,
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      isActive
                        ? styles.countBadgeTextActive
                        : styles.countBadgeTextIdle,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={styles.scrollContent}
        >
          {displayedEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Brain size={34} color={theme.primary[13]} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'thoughts'
                  ? 'Your mind is clear'
                  : activeTab === 'notes'
                  ? 'No notes saved yet'
                  : 'No links saved yet'}
              </Text>
              <Text style={styles.emptyDescription}>
                {activeTab === 'thoughts'
                  ? 'Type a thought above and tap + to capture it'
                  : activeTab === 'notes'
                  ? 'Capture your detailed ideas and notes here'
                  : 'Share links from other apps to save them here'}
              </Text>
            </View>
          ) : (
            displayedEntries.map(entry => (
              <BrainDumpCard
                key={entry.id}
                entry={entry}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // SafeArea
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  // Header
  header: {
    paddingHorizontal: theme.padding.paddingMainX,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.text + '10',
  },
  headerTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 20,
    color: theme.text,
  },
  headerSubtitle: {
    fontFamily: theme.fonts[400],
    fontSize: 13,
    color: theme.text + '50',
    marginTop: 2,
  },
  // Input Card
  inputCard: {
    marginHorizontal: theme.padding.paddingMainX,
    marginTop: 16,
    backgroundColor: theme.text + '08',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.text + '10',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sparklesContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.primary[13] + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    fontFamily: theme.fonts[400],
    fontSize: 14,
    color: theme.text,
    minHeight: 40,
    maxHeight: 110,
    paddingTop: 10,
    paddingBottom: 10,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.padding.paddingMainX,
    marginTop: 24,
    marginBottom: 10,
    gap: 12,
  },
  // tab: {
  //     flexDirection: "row",
  //     alignItems: "center",
  //     gap: 6,
  //     paddingVertical: 8,
  //     paddingHorizontal: 16,
  //     borderRadius: 16,
  // },
  // tabText: {
  //     fontFamily: theme.fonts[600],
  //     fontSize: 14,
  //     textTransform: "capitalize",
  // },
  // countBadge: {
  //     paddingHorizontal: 6,
  //     paddingVertical: 2,
  //     borderRadius: 10,
  // },
  // countBadgeText: {
  //     fontFamily: theme.fonts[600],
  //     fontSize: 11,
  // },
  //  new tab

  tabsShell: {
    flexDirection: 'row',
    marginHorizontal: theme.padding.paddingMainX,
    marginTop: 12,
    marginBottom: 12,
    padding: 4,
    borderRadius: 999,
    backgroundColor: theme.text + '08',
    borderWidth: 1,
    borderColor: theme.text + '10',
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: theme.primary[13] + '22',
    borderWidth: 1,
    borderColor: theme.primary[13] + '40',
  },
  tabText: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: theme.primary[13],
  },
  tabTextIdle: {
    color: theme.text + '55',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    minWidth: 26,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: theme.primary[13] + '28',
  },
  countBadgeIdle: {
    backgroundColor: theme.text + '0E',
  },
  countBadgeText: {
    fontFamily: theme.fonts[700],
    fontSize: 11,
  },
  countBadgeTextActive: {
    color: theme.primary[13],
  },
  countBadgeTextIdle: {
    color: theme.text + '55',
  },
  // ScrollView Content
  scrollContent: {
    paddingHorizontal: theme.padding.paddingMainX,
    paddingBottom: 90,
    gap: 10,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 72,
    gap: 14,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: theme.primary[13] + '15',
    borderWidth: 1,
    borderColor: theme.primary[13] + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: theme.fonts[600],
    fontSize: 17,
    color: theme.text + '60',
  },
  emptyDescription: {
    fontFamily: theme.fonts[400],
    fontSize: 13,
    color: theme.text + '35',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 220,
  },
  // Card
  cardContainer: {
    // marginBottom: 5,
  },
  cardSwipeBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.text + '08',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.error + '15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 24,
  },
  deleteText: {
    fontFamily: theme.fonts[600],
    fontSize: 13,
    color: theme.error,
    marginRight: 16,
  },
  deleteIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardForeground: {
    backgroundColor: theme.dark,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.text + '10',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  accentBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.primary[13] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  linkText: {
    fontFamily: theme.fonts[400],
    fontSize: 14,
    color: theme.text,
    lineHeight: 21,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  timestampText: {
    fontFamily: theme.fonts[400],
    fontSize: 11,
    color: theme.text + '80',
  },
  link: {
    textDecorationLine: 'underline',
  },
});

// ─── Brain Dump Card ─────────────────────────────────────────────────────────

function BrainDumpCard({
  entry,
  onDelete,
}: {
  entry: DumpEntry;
  onDelete: () => void;
}) {
  const youtubeId = extractYouTubeId(entry.text);
  const pan = useRef(new Animated.Value(0)).current;
  const [dismissed, setDismissed] = useState(false);

  const latestCb = useRef({ onDelete });
  latestCb.current = { onDelete };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        return gs.dx < -10 && Math.abs(gs.dx) > Math.abs(gs.dy) && !dismissed;
      },
      onPanResponderMove: (_, gs) => pan.setValue(Math.min(0, gs.dx)),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setDismissed(true);
            latestCb.current.onDelete();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 12,
            speed: 20,
          }).start();
        }
      },
    }),
  ).current;

  if (dismissed) return null;

  return (
    <View style={styles.cardContainer}>
      {/* ── RIGHT bg (swipe left) ── */}
      <Animated.View
        style={[
          styles.cardSwipeBg,
          {
            opacity: pan.interpolate({
              inputRange: [-SWIPE_THRESHOLD, 0],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: pan.interpolate({
                  inputRange: [-SWIPE_THRESHOLD, 0],
                  outputRange: [1, 0.95],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.deleteText}>Delete</Text>
        <View
          style={[styles.deleteIcon, { backgroundColor: theme.error + '25' }]}
        >
          <Trash2 color={theme.error} size={16} />
        </View>
      </Animated.View>

      {/* ── Foreground card ── */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardForeground,
          {
            transform: [
              { translateX: pan },
              {
                rotateZ: pan.interpolate({
                  inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                  outputRange: ['-12deg', '0deg', '12deg'],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        {/* Accent icon badge */}
        {!youtubeId && (
          <View style={styles.accentBadge}>
            <Sparkles size={15} color={theme.primary[ 13]} strokeWidth={2} />
          </View>
        )}

        {/* Text + timestamp */}
        <View style={styles.textContainer}>
          {youtubeId && <YouTubePreview youtubeId={youtubeId} />}
          {!!hideYouTubeUrl(entry.text) && (
            <Text style={styles.linkText}>
              {hideYouTubeUrl(entry.text)
                .split(/(https?:\/\/[^\s]+)/g)
                .map((part, index) => {
                  if (part.match(/(https?:\/\/[^\s]+)/g)) {
                    return (
                      <Text
                        key={index}
                        style={styles.link}
                        onPress={e => {
                          e.stopPropagation();
                          Linking.openURL(part).catch(err =>
                            console.log("Couldn't load page", err),
                          );
                        }}
                      >
                        {part}
                      </Text>
                    );
                  }
                  return part;
                })}
            </Text>
          )}
          <View style={styles.timestampContainer}>
            <View
              style={[
                styles.timestampDot,
                { backgroundColor: theme.primary[13] + '60' },
              ]}
            />
            <Text style={styles.timestampText}>
              {formatDate(entry.createdAt)} · {formatTime(entry.createdAt)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
