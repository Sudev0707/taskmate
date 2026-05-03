import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
} from 'react';
import {
    View,
    Modal,
    Animated,
    PanResponder,
    StyleSheet,
    TouchableWithoutFeedback,
    StyleProp,
    ViewStyle,
    KeyboardAvoidingView,
    Platform,
    Easing,
} from 'react-native';



export interface BottomSheetProps {
    /** Height of the bottom sheet */
    height?: number;
    /** Duration of the open and close animations */
    animationDuration?: number;
    /** Whether the sheet can be closed by dragging it down */
    closeOnDragDown?: boolean;
    /** Whether the sheet should close when the background mask is pressed */
    closeOnPressMask?: boolean;
    /** Distance from dragging action to trigger close sheet */
    dragFromTopOnly?: boolean;
    /** Whether to close on hardware back press */
    closeOnPressBack?: boolean;
    /** Custom styles for different parts of the component */
    customStyles?: {
        wrapper?: StyleProp<ViewStyle>;
        container?: StyleProp<ViewStyle>;
        draggableIcon?: StyleProp<ViewStyle>;
    };
    /** Callback fired when the sheet opens */
    onOpen?: () => void;
    /** Callback fired when the sheet closes */
    onClose?: () => void;
    /** Content to display inside the sheet */
    children?: React.ReactNode;
}

export type BottomSheetRef = {
    open: () => void;
    close: () => void;
};

const CustomBottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
    (
        {
            height = 260,
            animationDuration = 380,
            closeOnDragDown = true,
            closeOnPressMask = true,
            dragFromTopOnly = false,
            closeOnPressBack = true,
            customStyles = {},
            onOpen,
            onClose,
            children,
        },
        ref
    ) => {
        const [modalVisible, setModalVisible] = useState(false);

        // Main translate value (0 = fully open, height = fully closed/hidden)
        const panY = useRef(new Animated.Value(height)).current;

        // Separate overlay opacity for smoother independent fade
        const overlayOpacity = useRef(new Animated.Value(0)).current;

        // Pulse animation for the drag indicator
        const pulseAnim = useRef(new Animated.Value(1)).current;

        // ─── Spring reset (snap back to open position) ───────────────────────
        const resetPanY = () => {
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }).start();
        };

        // ─── Close: slide sheet down + fade overlay out ───────────────────────
        const closeSheet = () => {
            Animated.parallel([
                Animated.timing(panY, {
                    toValue: height,
                    duration: animationDuration,
                    easing: Easing.bezier(0.36, 0.66, 0.04, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: animationDuration - 60,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setModalVisible(false);
                if (onClose) onClose();
            });
        };

        // ─── Open: just show modal; animation triggered in useEffect ─────────
        const openSheet = () => {
            setModalVisible(true);
        };

        useImperativeHandle(ref, () => ({
            open: openSheet,
            close: closeSheet,
        }));

        // ─── On modal visible: spring slide up + fade overlay in ─────────────
        useEffect(() => {
            if (modalVisible) {
                // Reset sheet to hidden position
                panY.setValue(height);
                // Overlay appears INSTANTLY at full opacity
                overlayOpacity.setValue(1);

                // Then spring the sheet up
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                    velocity: 0.3,
                }).start(() => {
                    // Start gentle pulse on drag indicator after sheet settles
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(pulseAnim, {
                                toValue: 1.25,
                                duration: 900,
                                easing: Easing.inOut(Easing.sin),
                                useNativeDriver: true,
                            }),
                            Animated.timing(pulseAnim, {
                                toValue: 1,
                                duration: 900,
                                easing: Easing.inOut(Easing.sin),
                                useNativeDriver: true,
                            }),
                        ]),
                        { iterations: 3 }
                    ).start();

                    if (onOpen) onOpen();
                });
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [modalVisible]);

        // ─── Drag-to-dismiss pan responder ───────────────────────────────────
        const panResponder = useRef(
            PanResponder.create({
                onStartShouldSetPanResponder: (_, gestureState) => {
                    if (!closeOnDragDown) return false;
                    if (dragFromTopOnly) return gestureState.y0 < 100;
                    return true;
                },
                onMoveShouldSetPanResponder: (_, gestureState) => {
                    return Math.abs(gestureState.dy) > 5;
                },
                onPanResponderMove: (_, gestureState) => {
                    if (gestureState.dy > 0) {
                        panY.setValue(gestureState.dy);
                        // Fade overlay as user drags down
                        const ratio = Math.min(gestureState.dy / height, 1);
                        overlayOpacity.setValue(1 - ratio * 0.85);
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.vy > 0.5 || gestureState.dy > height * 0.35) {
                        closeSheet();
                    } else {
                        resetPanY();
                        // Restore full overlay opacity
                        Animated.timing(overlayOpacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }).start();
                    }
                },
            })
        ).current;

        // ─── Sheet elevation: subtle lift as sheet opens ──────────────────────
        const sheetScale = panY.interpolate({
            inputRange: [0, height],
            outputRange: [1, 0.97],
            extrapolate: 'clamp',
        });

        // ─── Overlay tint: lightens slightly for dark-mode aesthetics ─────────
        const overlayColor = overlayOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'],
        });

        if (!modalVisible) return null;

        return (
            <Modal
                transparent
                visible={modalVisible}
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeOnPressBack ? closeSheet : undefined}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.wrapper, customStyles.wrapper]}
                >
                    {/* ── Animated overlay ── */}
                    <TouchableWithoutFeedback onPress={closeOnPressMask ? closeSheet : undefined}>
                        <Animated.View
                            style={[
                                styles.mask,
                                { backgroundColor: overlayColor, opacity: overlayOpacity },
                            ]}
                        />
                    </TouchableWithoutFeedback>

                    {/* ── Bottom sheet container ── */}
                    <Animated.View
                        {...(closeOnDragDown && !dragFromTopOnly ? panResponder.panHandlers : {})}
                        style={[
                            styles.container,
                            { height },
                            customStyles.container,
                            {
                                transform: [
                                    { translateY: panY },
                                    { scale: sheetScale },
                                ],
                            },
                        ]}
                    >
                        {/* Top notch decoration */}
                        <View style={styles.topDecoration} />

                        {/* ── Drag handle area ── */}
                        {closeOnDragDown && (
                            <View
                                {...(dragFromTopOnly ? panResponder.panHandlers : {})}
                                style={styles.draggableContainer}
                            >
                                <Animated.View
                                    style={[
                                        styles.draggableIcon,
                                        customStyles.draggableIcon,
                                        { transform: [{ scaleX: pulseAnim }] },
                                    ]}
                                />
                            </View>
                        )}

                        {/* ── Sheet content ── */}
                        {children}
                    </Animated.View>
                </KeyboardAvoidingView>
            </Modal>
        );
    }
);

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    mask: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        // Elevated shadow
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 24,
    },
    // Subtle gradient-like top edge decoration
    topDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(99, 102, 241, 0.35)', // indigo accent line
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    draggableContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 10,
        backgroundColor: 'transparent',
    },
    draggableIcon: {
        width: 40,
        height: 5,
        borderRadius: 100,
        backgroundColor: '#D1D5DB',
    },
});

export default CustomBottomSheet;
