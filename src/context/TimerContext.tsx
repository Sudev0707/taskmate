import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptObject, decryptObject } from '../utils/security';

type TimerContextType = {
    activeTaskId: number | null;
    timeLeft: number;
    isActive: boolean;
    durationMins: number;
    completedWhileAway: boolean;
    startTimer: (taskId: number | null, duration: number) => void;
    stopTimer: () => void;
    resumeTimer: () => void;
    endTimer: () => void;
    resetTimer: () => void;
    clearCompletedWhileAway: () => void;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);
const TIMER_STORAGE_KEY = '@myapp_timer_data';

export function TimerProvider({ children }: { children: ReactNode }) {
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [durationMins, setDurationMins] = useState(0);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [completedWhileAway, setCompletedWhileAway] = useState(false);

    const stateRef = useRef({ activeTaskId, timeLeft, isActive, durationMins, endTime, completedWhileAway });
    useEffect(() => {
        stateRef.current = { activeTaskId, timeLeft, isActive, durationMins, endTime, completedWhileAway };
    }, [activeTaskId, timeLeft, isActive, durationMins, endTime, completedWhileAway]);

    const saveTimerState = async (customState?: any) => {
        try {
            const dataToSave = customState || stateRef.current;
            const encrypted = encryptObject(dataToSave);
            await AsyncStorage.setItem(TIMER_STORAGE_KEY, encrypted);
        } catch { }
    };

    // Initial load
    useEffect(() => {
        const loadTimer = async () => {
            try {
                const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
                if (stored) {
                    let data: any = decryptObject(stored);
                    if (!data) {
                        try {
                            data = JSON.parse(stored);
                        } catch {
                            data = null;
                        }
                    }

                    if (data) {
                        setActiveTaskId(data.activeTaskId);
                        setDurationMins(data.durationMins);

                        let finalCompletedWhileAway = data.completedWhileAway || false;
                        let finalIsActive = data.isActive || false;
                        let finalEndTime = data.endTime || null;
                        let finalTimeLeft = data.timeLeft || 0;

                        if (data.isActive && data.endTime) {
                            const now = Date.now();
                            if (now >= data.endTime) {
                                finalTimeLeft = 0;
                                finalIsActive = false;
                                finalEndTime = null;
                                finalCompletedWhileAway = true;
                            } else {
                                finalTimeLeft = Math.floor((data.endTime - now) / 1000);
                            }
                        }

                        setTimeLeft(finalTimeLeft);
                        setIsActive(finalIsActive);
                        setEndTime(finalEndTime);
                        setCompletedWhileAway(finalCompletedWhileAway);

                        // Update storage if we just calculated completion
                        if (finalCompletedWhileAway && !data.completedWhileAway) {
                            saveTimerState({ ...data, timeLeft: 0, isActive: false, endTime: null, completedWhileAway: true });
                        }
                    }
                }
            } catch { }
        };
        loadTimer();
    }, []);

    // Handle AppState changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                const { isActive: curActive, endTime: curEndTime } = stateRef.current;
                if (curActive && curEndTime) {
                    const now = Date.now();
                    if (now >= curEndTime) {
                        setTimeLeft(0);
                        setIsActive(false);
                        setEndTime(null);
                        setCompletedWhileAway(true);
                        saveTimerState({ ...stateRef.current, timeLeft: 0, isActive: false, endTime: null, completedWhileAway: true });
                    } else {
                        setTimeLeft(Math.floor((curEndTime - now) / 1000));
                    }
                }
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                saveTimerState();
            }
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && endTime) {
            interval = setInterval(() => {
                const now = Date.now();
                if (now >= endTime) {
                    setTimeLeft(0);
                    setIsActive(false);
                    setEndTime(null);
                    setCompletedWhileAway(true);
                    saveTimerState({ ...stateRef.current, timeLeft: 0, isActive: false, endTime: null, completedWhileAway: true });
                    if (interval) clearInterval(interval);
                } else {
                    setTimeLeft(Math.floor((endTime - now) / 1000));
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, endTime]);

    const startTimer = (taskId: number | null, duration: number) => {
        const seconds = duration * 60;
        const newEndTime = Date.now() + seconds * 1000;
        setDurationMins(duration);
        setActiveTaskId(taskId);
        setTimeLeft(seconds);
        setIsActive(true);
        setEndTime(newEndTime);
        setCompletedWhileAway(false);
        saveTimerState({ activeTaskId: taskId, durationMins: duration, timeLeft: seconds, isActive: true, endTime: newEndTime, completedWhileAway: false });
    };

    const stopTimer = () => {
        setIsActive(false);
        setEndTime(null);
        saveTimerState({ ...stateRef.current, isActive: false, endTime: null });
    };

    const resumeTimer = () => {
        const newEndTime = Date.now() + stateRef.current.timeLeft * 1000;
        setIsActive(true);
        setEndTime(newEndTime);
        saveTimerState({ ...stateRef.current, isActive: true, endTime: newEndTime });
    };

    const endTimer = () => {
        setIsActive(false);
        setTimeLeft(0);
        setEndTime(null);
        setActiveTaskId(null);
        setCompletedWhileAway(false);
        saveTimerState({ activeTaskId: null, durationMins: stateRef.current.durationMins, timeLeft: 0, isActive: false, endTime: null, completedWhileAway: false });
    };

    const resetTimer = () => {
        const seconds = stateRef.current.durationMins * 60;
        setIsActive(false);
        setTimeLeft(seconds);
        setEndTime(null);
        setCompletedWhileAway(false);
        saveTimerState({ ...stateRef.current, timeLeft: seconds, isActive: false, endTime: null, completedWhileAway: false });
    };

    const clearCompletedWhileAway = () => {
        setCompletedWhileAway(false);
        saveTimerState({ ...stateRef.current, completedWhileAway: false });
    };

    return (
        <TimerContext.Provider value={{ activeTaskId, timeLeft, isActive, durationMins, completedWhileAway, startTimer, stopTimer, resumeTimer, endTimer, resetTimer, clearCompletedWhileAway }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}
