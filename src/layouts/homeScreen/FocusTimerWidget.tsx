import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import theme from "../../data/color-theme";
import { useNavigation } from "@react-navigation/native";
import { useTimer } from "../../context/TimerContext";
import { useStreak } from "../../hooks/useStreak";
import { useTaskManager } from "../../hooks/useTaskManager";
import { Flame, Target, Zap, Play, Pause, Clock } from "lucide-react-native";

export default function FocusTimerWidget() {
    const navigation = useNavigation<any>();
    const { timeLeft, isActive, activeTaskId, durationMins } = useTimer();
    const { tasks } = useTaskManager();
    const { currentStreak } = useStreak(tasks);

    // Calculate focus stats from completed tasks
    const completedTasks = tasks.filter(t => t.status === "completed" || t.isCompleted);
    const totalFocusedTasks = completedTasks.length;
    const productivityScore = Math.min(100, currentStreak * 10 + totalFocusedTasks * 5);

    // Format time for display
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Timer state calculations
    const totalSeconds = durationMins * 60;
    const hasActiveSession = isActive || (timeLeft > 0 && timeLeft < totalSeconds);
    const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;

    // Active task info
    const activeTask = activeTaskId ? tasks.find((t: any) => t.id === activeTaskId) : null;
    const taskTitle = activeTask 
        ? activeTask.title.split("-")[1]?.trim() || activeTask.title 
        : "Focus Session";

    // Dynamic styling based on active session
    const containerBg = hasActiveSession ? theme.primary[2] : theme.text + "08";
    const borderColor = hasActiveSession ? theme.primary[3] + "30" : theme.text + "15";
    const titleColor = hasActiveSession ? theme.background : theme.text;
    const subtitleColor = hasActiveSession ? theme.background + "90" : theme.text + "60";
    const iconBg = hasActiveSession ? theme.background : theme.text + "15";
    const iconColor = hasActiveSession ? theme.primary[2] : theme.text;
    const statCardBg = hasActiveSession ? theme.background + "15" : theme.text + "08";
    const statValueColor = hasActiveSession ? theme.background : theme.text;
    const statUnitColor = hasActiveSession ? theme.background + "70" : theme.text + "60";
    const buttonBg = hasActiveSession ? theme.background : theme.primary[2];
    const buttonTextColor = hasActiveSession ? theme.primary[2] : theme.background;

    const handlePress = () => {
        if (hasActiveSession) {
            navigation.navigate("FocusScreen", {
                duration: durationMins,
                taskId: activeTaskId,
                taskTitle
            });
        } else {
            navigation.navigate("FocusSetupScreen");
        }
    };

    const statsData = [
        {
            icon: <Flame size={16} />,
            label: "Streak",
            value: currentStreak,
            unit: "days",
            color: "#FF8C00",
        },
        {
            icon: <Target size={16} />,
            label: "Completed",
            value: totalFocusedTasks,
            unit: "tasks",
            color: "#10B981",
        },
        {
            icon: <Zap size={16} />,
            label: "Score",
            value: productivityScore,
            unit: "pts",
            color: theme.primary[3],
        },
    ];

return (
        <View style={styles.container}>
            {/* Header Section with Timer */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePress}
                style={[
                    styles.timerCard,
                    {
                        backgroundColor: containerBg,
                        borderColor: borderColor,
                    }
                ]}
            >
                {/* Progress Bar */}
                {hasActiveSession && (
                    <View style={styles.progressContainer}>
                        <View 
                            style={[
                                styles.progressBar, 
                                { width: `${progress * 100}%` }
                            ]} 
                        />
                    </View>
                )}

                <View style={styles.timerContent}>
                    <View style={styles.timerInfo}>
                        <View style={styles.timerHeader}>
                            <Clock size={18} color={titleColor} />
                            <Text style={[styles.timerTitle, { color: titleColor }]}>
                                {hasActiveSession ? "Active Focus" : "Focus Timer"}
                            </Text>
                            {hasActiveSession && (
                                <View style={styles.activeBadge}>
                                    <View style={styles.activeDot} />
                                    <Text style={[styles.activeText, { color: titleColor }]}>Active</Text>
                                </View>
                            )}
                        </View>
                        
                        <Text 
                            style={[styles.timerSubtitle, { color: subtitleColor }]}
                            numberOfLines={1}
                        >
                            {hasActiveSession 
                                ? `${taskTitle} • ${formatTime(timeLeft)}` 
                                : "Start a new focus session"}
                        </Text>
                    </View>

                    <View style={[styles.playButton, { backgroundColor: iconBg }]}>
                        {hasActiveSession 
                            ? <Pause color={iconColor} size={20} /> 
                            : <Play color={iconColor} size={20} />}
                    </View>
                </View>
            </TouchableOpacity>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
                {statsData.map((stat, index) => (
                    <View
                        key={index}
                        style={[styles.statCard, { backgroundColor: statCardBg }]}
                    >
                        <View style={styles.statIconWrapper}>
                            {React.cloneElement(stat.icon, { 
                                color: hasActiveSession ? stat.color + "80" : stat.color 
                            })}
                        </View>
                        <Text style={[styles.statValue, { color: statValueColor }]}>
                            {stat.value}
                        </Text>
                        <Text style={[styles.statLabel, { color: statUnitColor }]}>
                            {stat.unit}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    { backgroundColor: buttonBg }
                ]}
                onPress={handlePress}
            >
                <Text style={[styles.actionButtonText, { color: buttonTextColor }]}>
                    {hasActiveSession ? "Resume Focus Session" : "Start Focus Session"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: theme.padding.paddingMainX,
        marginTop: 12,
    },
    timerCard: {
        borderRadius: theme.border.radius.main,
        borderWidth: 1,
        padding: 20,
        paddingHorizontal: 24,
        overflow: "hidden",
    },
    progressContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: theme.background + "15",
    },
    progressBar: {
        height: "100%",
        backgroundColor: theme.background + "40",
    },
    timerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    timerInfo: {
        flex: 1,
        marginRight: 16,
    },
    timerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    timerTitle: {
        fontFamily: theme.fonts[600],
        fontSize: 16,
    },
    activeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: theme.background + "20",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    activeText: {
        fontFamily: theme.fonts[500],
        fontSize: 10,
    },
    timerSubtitle: {
        fontFamily: theme.fonts[500],
        fontSize: 14,
        marginTop: 2,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    statsContainer: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
    },
    statIconWrapper: {
        marginBottom: 6,
    },
    statValue: {
        fontFamily: theme.fonts[700],
        fontSize: 16,
    },
    statLabel: {
        fontFamily: theme.fonts[500],
        fontSize: 10,
        marginTop: 2,
    },
    actionButton: {
        marginTop: 14,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    actionButtonText: {
        fontFamily: theme.fonts[600],
        fontSize: 14,
    },
});
