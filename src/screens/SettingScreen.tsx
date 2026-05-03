import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
    Info,
    BarChart2,
    CalendarDays,
    Cpu,
    ChevronRight,
    Moon,
    Sun,
    Settings
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import theme from "../data/color-theme";


function SectionHeader({ title, icon: Icon, color }: { title: string; icon: any; color: string }) {
    return (
        <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionHeaderIconWrapper, { backgroundColor: color + "15" }]}>
                <Icon size={14} color={color} strokeWidth={2.5} />
            </View>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );
}

function SettingRow({
    label,
    sublabel,
    icon: Icon,
    iconColor,
    onPress,
    rightElement,
}: {
    label: string;
    sublabel?: string;
    icon: any;
    iconColor: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.settingRow,
                { backgroundColor: pressed ? theme.text + "08" : "transparent" }
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconColor + "15" }]}>
                <Icon size={18} color={iconColor} strokeWidth={2.5} />
            </View>
            <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{label}</Text>
                {sublabel ? <Text style={styles.sublabelText}>{sublabel}</Text> : null}
            </View>
            <View>
                {rightElement ?? <ChevronRight size={18} color={theme.text + "30"} strokeWidth={2.5} />}
            </View>
        </Pressable>
    );
}


function SettingScreen() {
    const navigation = useNavigation<any>();
    const { theme: activeTheme, isDarkMode, toggleTheme } = useTheme();

    // Animated value for toggle
    const toggleAnim = React.useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(toggleAnim, {
            toValue: isDarkMode ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isDarkMode, toggleAnim]);

    const handleToggle = () => {
        toggleTheme();
    };

    const thumbInterpolate = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 24],
    });

    const backgroundColorInterpolate = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.primary[2], theme.primary[3]],
    });

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
            <View style={styles.pageHeading}>

                <View>
                    <Text style={[styles.headingTitle, { color: theme.text }]}>Settings</Text>
                    <Text style={[styles.headingSubtitle, { color: theme.text + "60" }]}>App information & resources</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={true}
                overScrollMode="never"
                contentContainerStyle={styles.scrollContent}
            >

                {/* <SectionHeader title="Appearance" icon={Sun} color={theme.primary[3]} />
                <View style={[styles.sectionContainer, { backgroundColor: theme.text + "04", borderColor: theme.text + "0A" }]}>
                    <Pressable
                        onPress={handleToggle}
                        style={({ pressed }) => [
                            styles.settingRow,
                            { backgroundColor: pressed ? theme.text + "08" : "transparent" }
                        ]}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? theme.primary[3] + "15" : theme.primary[2] + "15" }]}>
                            {isDarkMode ? (
                                <Moon size={18} color={theme.primary[3]} strokeWidth={2.5} />
                            ) : (
                                <Sun size={18} color={theme.primary[2]} strokeWidth={2.5} />
                            )}
                        </View>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.labelText, { color: theme.text }]}>Dark Mode</Text>
                            <Text style={[styles.sublabelText, { color: theme.text + "60" }]}>
                                {isDarkMode ? "On" : "Off"}
                            </Text>
                        </View>
                        <Animated.View
                            style={[
                                styles.toggleContainer,
                                { backgroundColor: backgroundColorInterpolate },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.toggleThumb,
                                    { left: thumbInterpolate },
                                ]}
                            />
                        </Animated.View>
                    </Pressable>
                </View> */}


                <SectionHeader title="Analytics" icon={BarChart2} color={theme.primary[4]} />
                <View style={[styles.sectionContainer, { backgroundColor: theme.text + "04", borderColor: theme.text + "0A" }]}>
                    <SettingRow
                        label="View Analytics"
                        sublabel="Tasks, streaks, weekly focus & more"
                        icon={BarChart2}
                        iconColor={theme.primary[4]}
                        onPress={() => navigation.navigate("AnalyticsScreen")}
                        rightElement={
                            <ChevronRight size={18} color={theme.primary[4]} strokeWidth={2.5} />
                        }
                    />
                    <View style={[styles.rowDivider, { backgroundColor: theme.text + "08" }]} />
                    <SettingRow
                        label="Calendar"
                        sublabel="View tasks by date & schedule"
                        icon={CalendarDays}
                        iconColor={theme.primary[2]}
                        onPress={() => navigation.navigate("CalendarScreen")}
                        rightElement={
                            <ChevronRight size={18} color={theme.primary[2]} strokeWidth={2.5} />
                        }
                    />
                </View>


                <SectionHeader title="About" icon={Info} color={theme.primary[2]} />
                <View style={[styles.sectionContainer, { backgroundColor: theme.text + "04", borderColor: theme.text + "0A" }]}>
                    <SettingRow
                        label="App Version"
                        sublabel="TaskMate v1.0.0"
                        icon={Cpu}
                        iconColor={theme.primary[2]}
                        rightElement={
                            <View style={[styles.versionBadge, { backgroundColor: theme.primary[2] + "1A", borderColor: theme.primary[2] + "30" }]}>
                                <Text style={[styles.versionBadgeText, { color: theme.primary[2] }]}>Latest</Text>
                            </View>
                        }
                    />
                </View>


                <View style={styles.copyrightContainer}>
                    <View style={[styles.logo, { backgroundColor: theme.text + "15" }]} />
                    <Text style={[styles.copyrightText, { color: theme.text + "90" }]}>Copyright © {new Date().getFullYear()} TaskMate</Text>
                    <Text style={[styles.footerText, { color: theme.text + "60" }]}>Built with ❤️ for Privacy{"\n"}Your data never leaves your device.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default SettingScreen;


const styles = StyleSheet.create({
    // SectionHeader
    sectionHeaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: theme.padding.paddingMainX + 4,
        marginTop: 28,
        marginBottom: 12,
    },
    sectionHeaderIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    sectionHeaderText: {
        fontFamily: theme.fonts[600],
        fontSize: 13,
        color: theme.text + "80",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    // SettingRow
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    labelContainer: {
        flex: 1,
        gap: 3,
    },
    labelText: {
        fontFamily: theme.fonts[600],
        fontSize: 15,
        color: theme.text,
        letterSpacing: 0.2,
    },
    sublabelText: {
        fontFamily: theme.fonts[400],
        fontSize: 12,
        color: theme.text + "60",
    },
    // SafeArea
    safeArea: {
        flex: 1,
    },
    // Page Heading
    pageHeading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: theme.padding.paddingMainX,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.text + '10',
    },
    pageHeadingIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: theme.primary[4] + "15",
        alignItems: "center",
        justifyContent: "center",
    },
    headingTitle: {
          fontSize: 20,
              color: theme.text,
              fontFamily: theme.fonts[700],
    },
    headingSubtitle: {
        fontFamily: theme.fonts[400],
        fontSize: 14,
        marginTop: 4,
    },
    // ScrollView
    scrollContent: {
        paddingBottom: 60,
    },
    // Section Container
    sectionContainer: {
        marginHorizontal: theme.padding.paddingMainX,
        borderRadius: 24,
        borderWidth: 1,
        overflow: "hidden",
    },
    // Row Divider
    rowDivider: {
        height: 1,
        marginHorizontal: 16,
    },
    // Copyright
    copyrightContainer: {
        alignItems: "center",
        paddingHorizontal: theme.padding.paddingMainX,
        paddingTop: 48,
    },
    logo: {
        width: 40,
        height: 3,
        borderRadius: 2,
        marginBottom: 16,
    },
    copyrightText: {
        fontFamily: theme.fonts[600],
        fontSize: 13,
        letterSpacing: 0.3,
    },
    footerText: {
        fontFamily: theme.fonts[400],
        fontSize: 12,
        textAlign: "center",
        lineHeight: 20,
        marginTop: 8,
    },
    // Version Badge
    versionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    versionBadgeText: {
        fontFamily: theme.fonts[700],
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    // Toggle styles
    toggleContainer: {
        width: 50,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: "center",
    },
    toggleThumb: {
        position: "absolute",
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});
