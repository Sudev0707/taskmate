import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
    ArrowLeft,
    Mail,
    Github,
    Globe,
    ExternalLink,
} from "lucide-react-native";
import theme from "../data/color-theme";

// ─── Data ────────────────────────────────────────────────────────────────────

const LINKS = [
    {
        id: "email",
        label: "Email Support",
        value: "sudev97",
        sublabel: "Drop us a message anytime",
        icon: Mail,
        color: theme.primary[1],
        onPress: () => Linking.openURL("mailto:s"),
    },
    {
        id: "github",
        label: "GitHub Repository",
        value: " TaskMate-app",
        sublabel: "View source code & raise issues",
        icon: Github,
        color: theme.primary[2],
        onPress: () => Linking.openURL("https://github.com"),
    },
    {
        id: "website",
        label: "Official Website",
        value: "TaskMate.com",
        sublabel: "News, updates & documentation",
        icon: Globe,
        color: theme.primary[3],
        onPress: () => Linking.openURL("https://"),
    },
    {
        id: "producthunt",
        label: "Product Hunt",
        value: "TaskMate — Master Your Day",
        sublabel: "Leave a review & support us 🙌",
        icon: ExternalLink,
        color: theme.primary[4],
        onPress: () =>
            Linking.openURL(
                "https://www.producthunt.com/products/TaskMate-master-your-day?utm_source=other&utm_medium=social",
            ),
    },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HelpSupportScreen() {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            {/* ── Header ─────────────────────────────────────── */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => (pressed ? styles.backButtonPressed : styles.backButton)}
                >
                    <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
                </Pressable>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Help & Support</Text>
                </View>

                {/* Spacer */}
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Intro card ─────────────────────────────── */}
                <View style={styles.introCard}>
                    <Text style={styles.introTitle}>We're here to help 👋</Text>
                    <Text style={styles.introDescription}>
                        Have a bug report, feature request, or just want to say hi? Reach out through
                        any of the channels below.
                    </Text>
                </View>

                {/* ── Contact & links section label ────────── */}
                <Text style={styles.sectionLabel}>Contact & Links</Text>

                {/* ── Link rows card ─────────────────────────── */}
                <View style={styles.linkCard}>
                    {LINKS.map((item, idx) => (
                        <View key={item.id}>
                            <Pressable
                                onPress={item.onPress}
                                style={({ pressed }) => (pressed ? styles.linkRowPressed : styles.linkRow)}
                            >
                                {/* Icon */}
                                <View style={styles.iconContainer}>
                                    <item.icon size={18} color={item.color} strokeWidth={2} />
                                </View>

                                {/* Text */}
                                <View style={styles.linkTextContainer}>
                                    <Text style={styles.linkText}>{item.label}</Text>
                                    <Text style={styles.sublinkText} numberOfLines={1}>
                                        {item.sublabel}
                                    </Text>
                                </View>

                                {/* Value + chevron */}
                                <View style={styles.valueContainer}>
                                    <ExternalLink size={15} color={item.color} strokeWidth={2} />
                                </View>
                            </Pressable>

                            {/* Divider (skip after last) */}
                            {idx < LINKS.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.padding.paddingMainX,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.text + "10",
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.text + "0E",
    },
    backButtonPressed: {
        width: 44,
        height: 44,
        borderRadius: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.text + "18",
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        fontFamily: theme.fonts[700],
        fontSize: 20,
        color: theme.text,
    },
    headerSpacer: {
        width: 40,
    },
    // ScrollView
    scrollContent: {
        paddingHorizontal: theme.padding.paddingMainX,
        paddingTop: 24,
        paddingBottom: 56,
        gap: 20,
    },
    // Intro Card
    introCard: {
        backgroundColor: theme.primary[3] + "12",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.primary[3] + "25",
        padding: 20,
        gap: 8,
    },
    introTitle: {
        fontFamily: theme.fonts[600],
        fontSize: 16,
        color: theme.text,
    },
    introDescription: {
        fontFamily: theme.fonts[400],
        fontSize: 13,
        color: theme.text + "70",
        lineHeight: 20,
    },
    // Section Label
    sectionLabel: {
        fontFamily: theme.fonts[500],
        fontSize: 12,
        color: theme.text + "70",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    // Link Card
    linkCard: {
        backgroundColor: theme.text + "08",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.text + "10",
        overflow: "hidden",
    },
    // Link Row
    linkRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
        backgroundColor: "transparent",
    },
    linkRowPressed: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
        backgroundColor: theme.text + "0D",
    },
    // Icon Container
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.text + "18",
    },
    // Link Text Container
    linkTextContainer: {
        flex: 1,
        gap: 2,
    },
    linkText: {
        fontFamily: theme.fonts[500],
        fontSize: 15,
        color: theme.text,
    },
    sublinkText: {
        fontFamily: theme.fonts[400],
        fontSize: 12,
        color: theme.text + "55",
    },
    // Value Container
    valueContainer: {
        alignItems: "flex-end",
        gap: 2,
    },
    // Divider
    divider: {
        height: 1,
        backgroundColor: theme.text + "0D",
        marginHorizontal: 16,
    },
});
