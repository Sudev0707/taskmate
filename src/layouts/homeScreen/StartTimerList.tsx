import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import theme from "../../data/color-theme";
import { Play, Pause } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useTimer } from "../../context/TimerContext";
import { useTaskManager } from "../../hooks/useTaskManager";

export default function StartTimerList() {
    const navigation = useNavigation<any>();
    const { timeLeft, isActive, activeTaskId, durationMins } = useTimer();
    const { tasks } = useTaskManager();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const totalSeconds = durationMins * 60;
    const hasActiveSession = isActive || (timeLeft > 0 && timeLeft < totalSeconds);
    const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;

    const activeTask = activeTaskId ? tasks.find((t: any) => t.id === activeTaskId) : null;
    const taskTitle = activeTask ? activeTask.title.split("-")[1]?.trim() || activeTask.title : "Focus Session";

    // Stylize the active vs inactive timer blocks
    const isActiveTimer = hasActiveSession;
    const cardBgColor = isActiveTimer ? theme.primary[5] : theme.text + "08";
    const cardBorderColor = isActiveTimer ? theme.primary[5] : theme.text + "15";
    const titleColor = isActiveTimer ? theme.background : theme.text;
    const subtitleColor = isActiveTimer ? theme.background + "90" : theme.text + "60";
    const iconContainerBg = isActiveTimer ? theme.background : theme.text + "15";
    const iconColor = isActiveTimer ? theme.white : theme.text;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    if (hasActiveSession) {
                        navigation.navigate("FocusScreen", {
                            duration: durationMins,
                            taskId: activeTaskId,
                            taskTitle
                        });
                    } else {
                        navigation.navigate("FocusSetupScreen");
                    }
                }}
                style={[
                    styles.timerCard,
                    {
                        backgroundColor: cardBgColor,
                        borderColor: cardBorderColor,
                    }
                ]}>

                {/* {isActiveTimer && (
                    <View style={styles.progressContainer}>
                        <View style={[
                            styles.progressBar,
                            { width: `${progress * 100}%` }
                        ]} />
                    </View>
                )} */}

                <View style={styles.timerInfo}>
                    <Text style={[styles.timerTitle, { color: titleColor }]}>
                        {isActiveTimer ? "Active Focus Timer" : "Focus Timer"}
                    </Text>
                    <Text
                        style={[styles.timerSubtitle, { color: subtitleColor }]}
                        numberOfLines={1}
                    >
                        {isActiveTimer ? `${taskTitle} • ${formatTime(timeLeft)}` : "Start a new focus session"}
                    </Text>
                </View>

                <View style={[styles.iconContainer, { backgroundColor: iconContainerBg }]}>
                    {isActiveTimer ? <Pause color={iconColor} size={20} /> : <Play color={iconColor} size={20} />}
                </View>

            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
    },
    timerCard: {
        backgroundColor: theme.text + "08",
        borderWidth: 1,
        borderColor: theme.text + "15",
        borderRadius: theme.border.radius.main,
        padding: 20,
        paddingHorizontal: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
    },
    progressContainer: {
        position: "absolute",
        bottom: 0,
        left: 4,
        right: 4,
        height: 6,
        backgroundColor: theme.background + "15",
    },
    progressBar: {
        height: "100%",
        backgroundColor: theme.background + "40",
    },
    timerInfo: {
        flex: 1,
        marginRight: 16,
    },
    timerTitle: {
        fontFamily: theme.fonts[600],
        fontSize: 16,
        marginBottom: 4,
    },
    timerSubtitle: {
        fontFamily: theme.fonts[500],
        fontSize: 14,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
});
