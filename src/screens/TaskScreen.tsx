import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfettiCannon from "react-native-confetti-cannon";
import { useNavigation } from "@react-navigation/native";
import theme from "../data/color-theme";
import { useTaskManager } from "../hooks/useTaskManager";
import HeaderTaskScreen from "../layouts/TasksScreen/Header";
import TaskListContent from "../layouts/TasksScreen/TaskListContent";
import AddTaskBottomSheet from "../components/AddTaskBottomSheet";

export default function TaskScreen() {
    const [isAddSheetVisible, setAddSheetVisible] = useState(false);
    const [currentTab, setCurrentTab] = useState("to-do");
    const [showConfetti, setShowConfetti] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigation = useNavigation<any>();

    const {
        tasks,
        saveNewTask,
        deleteTask,
        advanceTaskStatus,
        setTaskStatus,
    } = useTaskManager();

    // Old sheet-based details flow kept intentionally (commented) as requested.
    // const {
    //     selectedTask,
    //     sheetVisible,
    //     slideAnim,
    //     panResponder,
    //     openTaskSheet,
    //     closeTaskSheet,
    // } = useTaskSheet();

    const safeQuery = searchQuery.trim().toLowerCase();
    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(safeQuery) ||
        t.description.toLowerCase().includes(safeQuery)
    );

    const filteredTodoCount = filteredTasks.filter(t => t.status === "to-do").length;
    const filteredInProgressCount = filteredTasks.filter(t => t.status === "in-progress").length;
    const filteredCompletedCount = filteredTasks.filter(t => t.status === "completed").length;

    // Old inline TaskDetailsScreen render kept intentionally (commented) as requested.
    // if (selectedTaskForScreen) {
    //     return (
    //         <TaskDetailsScreen
    //             task={selectedTaskForScreen}
    //             onBack={() => setSelectedTaskForScreen(null)}
    //             onAdvanceStatus={() => {
    //                 advanceTaskStatus(selectedTaskForScreen.id, (tid, nextStatus) => {
    //                     if (nextStatus === "completed") setShowConfetti(true);
    //                 });
    //                 setSelectedTaskForScreen(null);
    //             }}
    //             onDelete={() => {
    //                 deleteTask(selectedTaskForScreen.id, () => setSelectedTaskForScreen(null));
    //             }}
    //         />
    //     );
    // }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <HeaderTaskScreen
                onAddTaskPress={() => setAddSheetVisible(true)}
                currentTab={currentTab}
                onTabChange={setCurrentTab}
                todoCount={filteredTodoCount}
                inProgressCount={filteredInProgressCount}
                completedCount={filteredCompletedCount}
                totalCount={filteredTasks.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <TaskListContent
                currentTab={currentTab}
                tasks={filteredTasks}
                onOpenTask={(task) => navigation.navigate("TaskDetailsScreen", { task })}
                onAdvanceStatus={(id) => advanceTaskStatus(id, (tid, nextStatus) => {
                    if (nextStatus === "completed") setShowConfetti(true);
                })}
                onSetStatus={(id, status, dueDate) => setTaskStatus(id, status as any, dueDate, () => {
                    if (status === "completed") setShowConfetti(true);
                })}
                onDelete={(id) => deleteTask(id)}
            />

            <AddTaskBottomSheet
                visible={isAddSheetVisible}
                onClose={() => setAddSheetVisible(false)}
                onSave={(data) =>
                    saveNewTask(data, () => setAddSheetVisible(false))
                }
            />

            {/* <TaskDetailsSheet
                visible={sheetVisible}
                selectedTask={selectedTask}
                slideAnim={slideAnim}
                panHandlers={panResponder.panHandlers}
                onClose={closeTaskSheet}
                onAdvanceStatus={() => {
                    if (selectedTask) {
                        advanceTaskStatus(selectedTask.id, (tid, nextStatus) => {
                            if (nextStatus === "completed") setShowConfetti(true);
                        });
                        closeTaskSheet();
                    }
                }}
                onDelete={() =>
                    selectedTask && deleteTask(selectedTask.id, () => closeTaskSheet())
                }
            /> */}

            {showConfetti && (
                <View style={styles.confettiOverlay}> 
                    <ConfettiCannon
                        count={200}
                        origin={{ x: Dimensions.get("window").width / 2, y: -20 }}
                        fallSpeed={2500}
                        fadeOut={true}
                        autoStart={true}
                        onAnimationEnd={() => setShowConfetti(false)}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    confettiOverlay: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: "none",
        zIndex: 9999,
    },
});
