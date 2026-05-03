import React from "react";
import { View, Text, StyleSheet } from "react-native";
import theme from "../../data/color-theme";
import { useStreak, toDateKey } from "../../hooks/useStreak";
import { useTaskManager } from "../../hooks/useTaskManager";
import { TrendingUp, CheckCircle2, Target, Calendar } from "lucide-react-native";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(toDateKey(d));
    }
    return days;
}

export default function WeeklyFocusWidget() {
    const { tasks } = useTaskManager();
    const { log } = useStreak(tasks);

    const last7Keys = getLast7Days();
    const maxCompleted = Math.max(1, ...last7Keys.map(k => log[k]?.completed ?? 0));

    // Calculate weekly stats
    const weeklyStats = last7Keys.reduce(
        (acc, key) => {
            const record = log[key];
            acc.completed += record?.completed ?? 0;
            acc.total += record?.total ?? 0;
            return acc;
        },
        { completed: 0, total: 0 }
    );

    const completionRate = weeklyStats.total > 0 
        ? Math.round((weeklyStats.completed / weeklyStats.total) * 100) 
        : 0;
    
    const activeDays = last7Keys.filter(k => (log[k]?.completed ?? 0) > 0).length;

    const statsData = [
        {
            icon: <CheckCircle2 size={16} />,
            label: "Completed",
            value: weeklyStats.completed,
            color: "#10B981",
            bgColor: "#10B98118",
        },
        {
            icon: <Target size={16} />,
            label: "Total",
            value: weeklyStats.total,
            color: theme.primary[3],
            bgColor: theme.primary[3] + "18",
        },
        {
            icon: <TrendingUp size={16} />,
            label: "Rate",
            value: `${completionRate}%`,
            color: theme.primary[1],
            bgColor: theme.primary[1] + "18",
        },
        {
            icon: <Calendar size={16} />,
            label: "Active Days",
            value: activeDays,
            color: theme.primary[4],
            bgColor: theme.primary[4] + "18",
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Target size={20} color={theme.primary[3]} />
                    <Text style={styles.title}>This Week's Activity</Text>
                </View>
            </View>

            {/* Enhanced Bar Chart */}
            <View style={styles.chartContainer}>
                {last7Keys.map((dateKey, i) => {
                    const record = log[dateKey];
                    const completed = record?.completed ?? 0;
                    const total = record?.total ?? 0;
                    const barH = Math.max(8, Math.round((completed / maxCompleted) * 90));
                    const isToday = i === 6;
                    const hasActivity = completed > 0;
                    const isFullDay = total > 0 && completed >= total;
                    const dayName = DAYS_SHORT[new Date(dateKey + "T12:00:00").getDay()];

                    return (
                        <View key={dateKey} style={styles.barItem}>
                            {hasActivity && (
                                <View style={styles.completedCountContainer}>
                                    <Text
                                        style={[
                                            styles.completedCount,
                                            isToday && styles.completedCountToday,
                                        ]}
                                    >
                                        {completed}
                                    </Text>
                                    {completed >= total && total > 0 && (
                                        <View style={styles.completeBadge}>
                                            <Text style={styles.completeBadgeText}>✓</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: barH,
                                        backgroundColor: isToday
                                            ? theme.primary[9]
                                            : isFullDay
                                                ? "#10B981"
                                                : hasActivity
                                                    ? theme.primary[2]
                                                    : theme.text + "20",
                                    },
                                ]}
                            >
                                {/* Shine effect for premium feel */}
                                {hasActivity && !isToday && (
                                    <View style={styles.barShine} />
                                )}
                            </View>
                            <View style={styles.dayLabelContainer}>
                                <Text
                                    style={[
                                        styles.dayLabel,
                                        isToday && styles.dayLabelToday,
                                    ]}
                                >
                                    {dayName}
                                </Text>
                                {isToday && (
                                    <View style={styles.todayDot} />
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                {statsData.map((stat, index) => (
                    <View
                        key={index}
                        style={[styles.statCard, { backgroundColor: stat.bgColor }]}
                    >
                        <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
                            {React.cloneElement(stat.icon, { color: stat.color, size: 14 })}
                        </View>
                        <Text style={[styles.statValue, { color: stat.color }]}>
                            {stat.value}
                        </Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: theme.padding.paddingMainX,
        backgroundColor: theme.text + "08",
        borderRadius: theme.border.radius.main,
        borderWidth: 1,
        borderColor: theme.text + "15",
        padding: 20,
        marginTop: 12,
    },
    header: {
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    title: {
        fontFamily: theme.fonts[600],
         fontSize: 14,
        color: theme.text,
    },
    subtitle: {
        fontFamily: theme.fonts[400],
        fontSize: 13,
        color: theme.text + "60",
        marginLeft: 28,
    },
    chartContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        height: 120,
        paddingHorizontal: 4,
    },
    barItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
    },
    completedCountContainer: {
        position: "relative",
        alignItems: "center",
    },
    completedCount: {
        fontFamily: theme.fonts[600],
        fontSize: 11,
        color: theme.text + "70",
    },
    completedCountToday: {
        color: theme.primary[3],
        fontFamily: theme.fonts[700],
    },
    completeBadge: {
        position: "absolute",
        top: -6,
        right: -8,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#10B981",
        justifyContent: "center",
        alignItems: "center",
    },
    completeBadgeText: {
        fontSize: 8,
        color: theme.background,
        fontFamily: theme.fonts[700],
    },
    bar: {
        width: "100%",
        borderRadius: 8,
        minHeight: 8,
        overflow: "hidden",
    },
    barShine: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "40%",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    dayLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    dayLabel: {
        fontFamily: theme.fonts[500],
        fontSize: 10,
        color: theme.text + "50",
    },
    dayLabelToday: {
        fontFamily: theme.fonts[600],
        color: theme.primary[3],
    },
    todayDot: {
        position: "absolute",
        top: -6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.primary[3],
        left:5
    },
    statsContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.text + "10",
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
    },
    statIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    statValue: {
        fontFamily: theme.fonts[700],
        fontSize: 14,
    },
    statLabel: {
        fontFamily: theme.fonts[500],
        fontSize: 9,
        color: theme.text + "60",
        marginTop: 2,
    },
});
