import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme, lightTheme } from "../data/color-theme";

type ThemeType = typeof darkTheme;

interface ThemeContextType {
    theme: ThemeType;
    isDarkMode: boolean;
    toggleTheme: () => void;
    setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@taskmate_theme_mode";

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === "dark");
            }
        } catch (error) {
            console.error("Failed to load theme preference:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveThemePreference = async (darkMode: boolean) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
        } catch (error) {
            console.error("Failed to save theme preference:", error);
        }
    };

    const toggleTheme = () => {
        const newValue = !isDarkMode;
        setIsDarkMode(newValue);
        saveThemePreference(newValue);
    };

    const setDarkMode = (value: boolean) => {
        setIsDarkMode(value);
        saveThemePreference(value);
    };

    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
