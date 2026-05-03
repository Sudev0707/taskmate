import React, { useRef, useState, useEffect } from "react";
import {
    View,
    Text,
    Modal,
    Animated,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    Pressable,
    PanResponder,
    ScrollView,
} from "react-native";
import theme from "../data/color-theme";
import AnimatedIconButton from "./AnimatedIconButton";
import { CheckSquare, Brain, FileText } from "lucide-react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
    onSelectDestination: (destination: "task" | "braindump") => void;
    sharedText?: string;
};

export default function ChooseDestinationBottomSheet({ visible, onClose, onSelectDestination, sharedText }: Props) {
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Local state for when the modal is actually mounted (for exit animation)
    const [isMounted, setIsMounted] = useState(visible);

    useEffect(() => {
        if (visible) {
            setIsMounted(true);
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                bounciness: 0,
                speed: 14,
            }).start();
        } else if (isMounted) {
            closeSheet();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const closeSheet = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            setIsMounted(false);
            onClose();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    slideAnim.setValue(1 - gestureState.dy / 600);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.5) {
                    onClose(); // Triggers the useEffect to close it
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        bounciness: 0,
                    }).start();
                }
            },
        })
    ).current;

    if (!isMounted) return null;

    return (
        <Modal
            visible={isMounted}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.modalWrapper}
            >
                {/* Backdrop */}
                <Animated.View style={[
                    styles.backdrop,
                    {
                        opacity: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1]
                        })
                    }
                ]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                {/* Sheet */}
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.sheet,
                        {
                            transform: [{
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [600, 0]
                                })
                            }]
                        }
                    ]}
                >
                    {/* Drag handle */}
                    <View style={styles.handleBar} />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 40 : 20 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottomWidth: 1, borderColor: theme.background + "20" }}>
                            <Text style={{ fontFamily: theme.fonts[600], fontSize: 22, color: theme.background, paddingBottom: 16 }}>
                                Shared Content
                            </Text>
                        </View>

                        {sharedText && (
                            <View style={{ backgroundColor: theme.background + "08", padding: 16, borderRadius: 16, marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <FileText size={16} color={theme.background + "80"} />
                                    <Text style={{ fontFamily: theme.fonts[600], fontSize: 13, color: theme.background + "80" }}>
                                        Preview
                                    </Text>
                                </View>
                                <Text style={{ fontFamily: theme.fonts[500], fontSize: 15, color: theme.background, lineHeight: 22 }} numberOfLines={3}>
                                    {sharedText}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.label}>Where would you like to save this?</Text>

                        <View style={{ gap: 12, marginTop: 8 }}>
                            <AnimatedIconButton
                                onPress={() => onSelectDestination("task")}
                                style={{
                                    paddingVertical: 18,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: theme.background + "15",
                                    backgroundColor: theme.background + "05",
                                    alignItems: "center",
                                    flexDirection: "row",
                                    paddingHorizontal: 20,
                                    gap: 16
                                }}
                            >
                                <View style={{ backgroundColor: theme.background, padding: 10, borderRadius: 12 }}>
                                    <CheckSquare size={24} color={theme.white} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.background, fontFamily: theme.fonts[600], fontSize: 18, marginBottom: 4 }}>Add as Task</Text>
                                    <Text style={{ color: theme.background + "80", fontFamily: theme.fonts[500], fontSize: 13 }}>Create an actionable item</Text>
                                </View>
                            </AnimatedIconButton>

                            <AnimatedIconButton
                                onPress={() => onSelectDestination("braindump")}
                                style={{
                                    paddingVertical: 18,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: theme.background + "15",
                                    backgroundColor: theme.background + "05",
                                    alignItems: "center",
                                    flexDirection: "row",
                                    paddingHorizontal: 20,
                                    gap: 16
                                }}
                            >
                                <View style={{ backgroundColor: theme.background, padding: 10, borderRadius: 12 }}>
                                    <Brain size={24} color={theme.white} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.background, fontFamily: theme.fonts[600], fontSize: 18, marginBottom: 4 }}>Send to Brain Dump</Text>
                                    <Text style={{ color: theme.background + "80", fontFamily: theme.fonts[500], fontSize: 13 }}>Quickly capture a thought</Text>
                                </View>
                            </AnimatedIconButton>
                        </View>
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalWrapper: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    sheet: {
        backgroundColor: theme.white,
        borderRadius: 36,
        margin: 16,
        marginBottom: 32,
        overflow: "hidden",
        maxHeight: "85%",
    },
    handleBar: {
        width: 56,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.background + "20",
        alignSelf: "center",
        marginTop: 14,
        marginBottom: 4,
    },
    label: {
        fontFamily: theme.fonts[600],
        fontSize: 16,
        color: theme.background,
        marginBottom: 12,
        paddingLeft: 4,
    }
});
