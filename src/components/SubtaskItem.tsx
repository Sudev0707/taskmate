import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    PanResponder,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import theme from '../data/color-theme';
import { Subtask } from '../domain/models/TaskEntity';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type SubtaskItemProps = {
    subtask: Subtask;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
};

export default function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
    const pan = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const checkScale = useRef(new Animated.Value(subtask.isCompleted ? 1 : 0)).current;
    const strikeAnim = useRef(new Animated.Value(subtask.isCompleted ? 1 : 0)).current;

    // Animate when completion state changes
    useEffect(() => {
        Animated.parallel([
            Animated.spring(checkScale, {
                toValue: subtask.isCompleted ? 1 : 0,
                useNativeDriver: true,
                bounciness: 12,
            }),
            Animated.timing(strikeAnim, {
                toValue: subtask.isCompleted ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    }, [subtask.isCompleted]);

    // PanResponder for swipe-to-delete
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gs) => {
                return Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy);
            },
            onPanResponderMove: (_, gs) => {
                if (gs.dx < 0) {
                    pan.setValue(gs.dx);
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dx < -SWIPE_THRESHOLD) {
                    Animated.timing(pan, {
                        toValue: -SCREEN_WIDTH,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onDelete(subtask.id);
                    });
                } else {
                    Animated.spring(pan, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 12,
                    }).start();
                }
            },
        }),
    ).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 12,
            speed: 20,
        }).start();
    };

    return (
        <View style={styles.container}>
            {/* Delete background */}
            <Animated.View
                style={[
                    styles.deleteBg,
                    {
                        opacity: pan.interpolate({
                            inputRange: [-SWIPE_THRESHOLD, 0],
                            outputRange: [1, 0],
                            extrapolate: 'clamp',
                        }),
                    },
                ]}
            >
                <Trash2 color={theme.error} size={20} />
            </Animated.View>

            {/* Foreground item */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.itemContainer,
                    {
                        transform: [{ translateX: pan }],
                    },
                ]}
            >
                <Pressable
                    onPress={() => onToggle(subtask.id)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={styles.pressable}
                >
                    <Animated.View
                        style={[
                            styles.checkbox,
                            {
                                transform: [{ scale: scaleAnim }],
                                backgroundColor: checkScale.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['transparent', theme.success],
                                }),
                                borderColor: checkScale.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [theme.background + '40', theme.success],
                                }),
                            },
                        ]}
                    >
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        scale: checkScale.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [0, 0, 1],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <Check color={theme.white} size={14} strokeWidth={3} />
                        </Animated.View>
                    </Animated.View>

                    <Animated.View style={styles.textContainer}>
                        <Text
                            style={[
                                styles.title,
                                {
                                    color: subtask.isCompleted
                                        ? theme.background + '50'
                                        : theme.background + '90',
                                },
                            ]}
                            numberOfLines={2}
                        >
                            {subtask.title}
                        </Text>
                        {/* Strike-through line */}
                        <Animated.View
                            style={[
                                styles.strikethrough,
                                {
                                    width: strikeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                },
                            ]}
                        />
                    </Animated.View>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: 8,
    },
    deleteBg: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        backgroundColor: theme.error + '15',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        backgroundColor: theme.primary[13],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.text + '10',
        overflow: 'hidden',
    },
    pressable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    textContainer: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
    },
    title: {
        fontFamily: theme.fonts[500],
        fontSize: 15,
        lineHeight: 22,
    },
    strikethrough: {
        position: 'absolute',
        left: 0,
        top: '50%',
        height: 2,
        backgroundColor: theme.background + '40',
        marginTop: -1,
    },
});
