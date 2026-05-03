import { FlexWidget, TextWidget } from "react-native-android-widget";
import theme from "../data/color-theme";

interface TaskWidgetProps {
    streak?: number;
    task?: any | null;
}

export function TaskWidgetAndroid({ streak = 0, task = null }: TaskWidgetProps) {
    return (
        <FlexWidget
            style={{
                height: "match_parent",
                width: "match_parent",
                backgroundColor: theme.background as any,
                borderRadius: 24,
                padding: 16,
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <FlexWidget
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <FlexWidget
                    style={{
                        flexDirection: "row",
                        backgroundColor: theme.primary[1] as any, // Yellow
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        alignItems: "center",
                    }}
                >
                    <TextWidget
                        text={`🔥 ${streak} Days`}
                        style={{
                            fontSize: 14,
                            color: theme.background as any,
                            fontWeight: 'bold',
                        }}
                    />
                </FlexWidget>

                <TextWidget
                    text="SUMMARY"
                    style={{
                        fontSize: 12,
                        color: theme.text as any,
                        fontWeight: 'bold',
                        letterSpacing: 1,
                    }}
                />
            </FlexWidget>

            {task ? (
                <FlexWidget
                    style={{
                        backgroundColor: theme.primary[2] as any, // Light Green
                        borderRadius: 20,
                        padding: 16,
                        marginTop: 12,
                        flexDirection: "column",
                        flex: 1,
                        justifyContent: 'center',
                    }}
                >
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <FlexWidget
                            style={{
                                backgroundColor: theme.background as any,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12,
                            }}
                        >
                            <TextWidget
                                text="UP NEXT"
                                style={{
                                    fontSize: 10,
                                    color: theme.primary[2] as any,
                                    fontWeight: 'bold',
                                }}
                            />
                        </FlexWidget>
                    </FlexWidget>

                    <TextWidget
                        text={task.title || "No Title"}
                        style={{
                            fontSize: 22,
                            color: theme.background as any,
                            fontWeight: 'bold',
                        }}
                        maxLines={2}
                        truncate="END"
                    />
                </FlexWidget>
            ) : (
                <FlexWidget
                    style={{
                        backgroundColor: theme.primary[3] as any, // Light Blue
                        borderRadius: 20,
                        padding: 16,
                        marginTop: 12,
                        flexDirection: "column",
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <TextWidget
                        text="✨ All caught up!"
                        style={{
                            fontSize: 18,
                            color: theme.background as any,
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    />
                    <TextWidget
                        text="You have no pending tasks."
                        style={{
                            fontSize: 12,
                            color: theme.background as any,
                            marginTop: 4,
                        }}
                    />
                </FlexWidget>
            )}
        </FlexWidget>
    );
}

export default {
    TaskWidgetAndroid,
}