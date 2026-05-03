import React, { useEffect, useState } from 'react';
import { View, StyleSheet, DeviceEventEmitter } from 'react-native';
import { shareIntentService } from '../services/ShareIntentService';
import AddTaskBottomSheet, { NewTaskData } from '../components/AddTaskBottomSheet';
import ChooseDestinationBottomSheet from '../components/ChooseDestinationBottomSheet';
import { useTaskManager } from '../hooks/useTaskManager';
import { ShareIntentData } from '../domain/models/ShareData';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptObject, decryptObject } from '../utils/security';

export const ShareIntentHandler = () => {
    const [shareData, setShareData] = useState<ShareIntentData | null>(null);
    const [showTaskSheet, setShowTaskSheet] = useState(false);
    const { saveNewTask } = useTaskManager();
    const navigation = useNavigation<any>();

    useEffect(() => {
        const listener = shareIntentService.setupListeners();

        const receiveSub = DeviceEventEmitter.addListener('onShareIntentReceived', (data: ShareIntentData) => {
            setShareData(data);
            setShowTaskSheet(false);
        });

        return () => {
            if (listener) listener.remove();
            receiveSub.remove();
        };
    }, []);

    const handleSaveTask = (taskData: NewTaskData) => {
        saveNewTask(taskData, () => {
            setShareData(null);
            setShowTaskSheet(false);
            DeviceEventEmitter.emit('onTaskCreatedFromShare');
        });
    };

    const handleSelectDestination = async (destination: 'task' | 'braindump') => {
        if (destination === 'task') {
            setShowTaskSheet(true);
        } else {
            const textToSave = shareData?.url || shareData?.text || shareData?.title || '';
            if (textToSave.trim()) {
                const STORAGE_KEY = "@TaskMate_braindump";
                try {
                    const raw = await AsyncStorage.getItem(STORAGE_KEY);
                    let entries: any[] = [];
                    if (raw) {
                        const decrypted = decryptObject(raw);
                        if (decrypted) entries = decrypted;
                        else {
                            const parsed = JSON.parse(raw);
                            entries = Array.isArray(parsed) ? parsed : [];
                        }
                    }
                    const newEntry = {
                        id: Date.now(),
                        text: textToSave,
                        createdAt: new Date().toISOString(),
                    };
                    const updated = [newEntry, ...entries];
                    const encrypted = encryptObject(updated);
                    await AsyncStorage.setItem(STORAGE_KEY, encrypted);
                } catch (e) {
                    console.error("Failed to save braindump", e);
                }
            }

            setShareData(null);
            navigation.navigate("MainTabs", { screen: "Brain Dump" });
        }
    };

    if (!shareData) return null;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {showTaskSheet ? (
                <AddTaskBottomSheet
                    visible={!!shareData && showTaskSheet}
                    onClose={() => {
                        setShareData(null);
                        setShowTaskSheet(false);
                    }}
                    onSave={handleSaveTask}
                    initialTaskData={{
                        title: shareData.title || 'Shared Content',
                        description: shareData.url || shareData.text || '',
                    }}
                />
            ) : (
                <ChooseDestinationBottomSheet
                    visible={!!shareData && !showTaskSheet}
                    onClose={() => setShareData(null)}
                    onSelectDestination={handleSelectDestination}
                    sharedText={shareData.url || shareData.text || shareData.title}
                />
            )}
        </View>
    );
};
