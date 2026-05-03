import React from "react";
import { ScrollView, Text, View } from "react-native";
import theme from "../../data/color-theme";
import TaskCard, { PRIORITY_CONFIG } from "../../components/TaskCard";
import { CheckCircle, Rocket, PartyPopper, Inbox } from "lucide-react-native";

// ─── Date grouping helpers ────────────────────────────────────────────────
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const getGroupLabel = (dueDate: Date | string): string => {
    const d = new Date(dueDate);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (isSameDay(d, now)) return "Today";
    if (isSameDay(d, tomorrow)) return "Tomorrow";
    if (isSameDay(d, yesterday)) return "Yesterday";
    // e.g. "12 Jan, 2026"
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
};

type TaskGroup = { label: string; tasks: any[] };

// Map a group label back to a sortable timestamp for ordering groups
const getLabelSortKey = (label: string): number => {
    if (label === "Today") return 0; // always first
    const now = new Date();
    if (label === "Yesterday") {
        const d = new Date(now); d.setDate(now.getDate() - 1); return d.getTime();
    }
    if (label === "Tomorrow") {
        const d = new Date(now); d.setDate(now.getDate() + 1); return d.getTime();
    }
    // "12 Jan, 2026" → parse back to a Date for sorting
    return new Date(label).getTime() || 0;
};

const groupTasksByDate = (tasks: any[]): TaskGroup[] => {
    const sorted = [...tasks].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    const groupMap = new Map<string, any[]>();
    for (const task of sorted) {
        const label = getGroupLabel(task.dueDate);
        if (!groupMap.has(label)) groupMap.set(label, []);
        groupMap.get(label)!.push(task);
    }


    // Build groups and sort: Today always first, then ascending by date
    return Array.from(groupMap.entries())
        .map(([label, groupTasks]) => ({ label, tasks: groupTasks }))
        .sort((a, b) => {
            const aKey = getLabelSortKey(a.label);
            const bKey = getLabelSortKey(b.label);
            // Today (key=0) is always first; others sorted ascending
            if (aKey === 0) return -1;
            if (bKey === 0) return 1;
            return aKey - bKey;
        });
};

// ─── Card color pool ──────────────────────────────────────────────────────
const CARD_COLORS = [theme.primary[1], theme.primary[3], theme.primary[4]];

// ─── Props ────────────────────────────────────────────────────────────────
type Props = {
    currentTab: string;
    tasks: any[];
    onOpenTask: (task: any) => void;
    onAdvanceStatus: (taskId: number) => void;
    onSetStatus: (taskId: number, newStatus: string, newDueDate?: Date) => void;
    onDelete: (taskId: number) => void;
    onComplete?: (taskId: number) => void;
};

// ─── Component ────────────────────────────────────────────────────────────
export default function TaskListContent({
    currentTab,
    tasks,
    onOpenTask,
    onAdvanceStatus,
    onSetStatus,
    onDelete,
}: Props) {
    // Show all tasks matching the current tab's status
    const filteredTasks = tasks.filter((t) => t.status === currentTab);
    const groups = groupTasksByDate(filteredTasks);

    // Per-tab empty state
    const EMPTY: Record<string, { icon: React.ReactNode; title: string; hint: string }> = {
        "to-do": { icon: <CheckCircle size={48} color={theme.text + "80"} strokeWidth={1.5} />, title: "You're all caught up!", hint: "No to-do tasks. Tap \"Add Task\" to create one." },
        "in-progress": { icon: <Rocket size={48} color={theme.text + "80"} strokeWidth={1.5} />, title: "Nothing in progress yet", hint: "Swipe right on a to-do card to move it here." },
        "completed": { icon: <PartyPopper size={48} color={theme.text + "80"} strokeWidth={1.5} />, title: "No completions today yet", hint: "Finish a task and it will appear here." },
    };
    const empty = EMPTY[currentTab] ?? { icon: <Inbox size={48} color={theme.text + "80"} strokeWidth={1.5} />, title: "Nothing here", hint: "" };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        >
            <View style={{
                paddingHorizontal: theme.padding.paddingMainX,
                marginTop: 20,
                gap: 28,
            }}>
                {filteredTasks.length === 0 ? (
                    <View style={{ alignItems: "center", marginTop: 60, gap: 8, paddingHorizontal: 24 }}>
                        <View style={{ marginBottom: 8 }}>{empty.icon}</View>
                        <Text style={{ fontFamily: theme.fonts[600], fontSize: 17, color: theme.text + "CC", textAlign: "center", marginTop: 4 }}>
                            {empty.title}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts[400], fontSize: 14, color: theme.text + "55", textAlign: "center", lineHeight: 22 }}>
                            {empty.hint}
                        </Text>
                    </View>
                ) : (
                    groups.map(({ label, tasks: groupTasks }) => (
                        <View key={label} style={{ gap: 14 }}>

                            {/* ── Date section header ───────────────── */}
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                            }}>
                                <Text style={{
                                    fontFamily: theme.fonts[600],
                                    fontSize: 11,
                                    color: theme.text + "AA",
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                }}>
                                    {label}
                                </Text>
                                <View style={{
                                    flex: 1,
                                    height: 1,
                                    backgroundColor: theme.text + "18",
                                }} />
                                <View style={{
                                    backgroundColor: theme.text + "14",
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 10,
                                }}>
                                    <Text style={{
                                        fontFamily: theme.fonts[600],
                                        fontSize: 11,
                                        color: theme.text + "70",
                                    }}>
                                        {groupTasks.length}
                                    </Text>
                                </View>
                            </View>

{/* ── Task cards under this date ────────── */}
                            <View style={{ gap: 14 }}>
                                {groupTasks.map((task) => {
                                    // Get background color based on priority
                                    const priorityCfg = PRIORITY_CONFIG[task.priority] ?? null;
                                    const taskBgColor = priorityCfg?.bg ?? theme.primary[1];
                                    return (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            bgColor={taskBgColor}
                                            onPress={() => onOpenTask(task)}
                                            onAdvanceStatus={() => onAdvanceStatus(task.id)}
                                            onSetStatus={(s, d) => onSetStatus(task.id, s, d)}
                                            onDelete={() => onDelete(task.id)}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}
