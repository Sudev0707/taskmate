import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle, PressableProps } from 'react-native';

interface AnimatedIconButtonProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    activeScale?: number;
}

export default function AnimatedIconButton({
    children,
    style,
    activeScale = 0.85,
    ...props
}: AnimatedIconButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
        Animated.spring(scale, {
            toValue: activeScale,
            useNativeDriver: true,
            speed: 20,
        }).start();
        props.onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 12,
            speed: 20,
        }).start();
        props.onPressOut?.(e);
    };

    return (
        <Pressable
            {...props}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </Pressable>
    );
}
