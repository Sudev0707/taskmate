import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import theme from '../data/color-theme';

export const PrivacyStatus = () => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
                <ShieldCheck size={16} color={theme.primary[2]} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>Privacy Protection Active</Text>
                <Text style={styles.subtitle}>On-device AES encryption enabled</Text>
                <Text style={styles.positioning}>Positioning: Local & Private</Text>
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>OFFLINE-FIRST</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
    },
    positioning: {
        color: 'rgba(59, 130, 246, 0.6)',
        fontSize: 10,
        marginTop: 2,
        fontStyle: 'italic',
    },
    badge: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    badgeText: {
        color: '#22C55E',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
