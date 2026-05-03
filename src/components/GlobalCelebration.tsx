import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTimer } from '../context/TimerContext';
import { useTaskManager } from '../hooks/useTaskManager';
import theme from '../data/color-theme';
import { PartyPopper } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function GlobalCelebration() {
    const { activeTaskId, completedWhileAway, clearCompletedWhileAway } = useTimer();
    const { tasks, setTaskStatus } = useTaskManager();
    const [showConfetti, setShowConfetti] = React.useState(false);

    React.useEffect(() => {
        if (completedWhileAway && activeTaskId) {
            // Only update if tasks are loaded and task is not already marked completed
            const targetTask = tasks.find(t => t.id === activeTaskId);
            if (targetTask && targetTask.status !== 'completed') {
                setTaskStatus(activeTaskId, 'completed' as any);
            }

            // Show confetti with a small delay for smoother animation
            const timer = setTimeout(() => setShowConfetti(true), 100);
            return () => clearTimeout(timer);
        } else {
            setShowConfetti(false);
        }
    }, [completedWhileAway, activeTaskId, tasks, setTaskStatus]);

    if (!completedWhileAway) return null;

    return (
        <Modal
            transparent
            visible={completedWhileAway}
            animationType="fade"
            onRequestClose={clearCompletedWhileAway}
        >
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <PartyPopper color={theme.primary[4]} size={48} />
                    </View>
                    <Text style={styles.title}>Session Complete!</Text>
                    <Text style={styles.message}>
                        Great job focusing! Your session finished while you were away.
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={clearCompletedWhileAway}
                    >
                        <Text style={styles.buttonText}>Keep it up!</Text>
                    </TouchableOpacity>
                </View>

                {showConfetti && (
                    <ConfettiCannon
                        count={200}
                        origin={{ x: width / 2, y: -20 }}
                        fallSpeed={3000}
                        fadeOut={true}
                        autoStart={true}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: theme.white,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.primary[4] + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontFamily: theme.fonts[700],
        color: theme.background,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        fontFamily: theme.fonts[400],
        color: theme.background + '80',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    button: {
        backgroundColor: theme.background,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 100,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: theme.white,
        fontSize: 16,
        fontFamily: theme.fonts[600],
    },
});
