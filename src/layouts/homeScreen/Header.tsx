import React from "react";
import { Text, View } from "react-native";
import theme from "../../data/color-theme";
import { Flame } from "lucide-react-native";

type Props = { streak?: number };

function HeaderHeroScreen({ streak = 0 }: Props) {

    const Day = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Morning";
        if (hours < 18) return "Afternoon";
        return "Evening";
    };

    const hasStreak = streak > 0;

    return (
        <View style={{
            paddingHorizontal: theme.padding.paddingMainX,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        }}>
            <View style={{ flexDirection: "column", gap: 2 }}>
                <Text style={{ color: theme.text + "80", fontFamily: theme.fonts[400], fontSize: 16 }}>
                    Welcome Back,
                </Text>
                <Text style={{ color: theme.text, fontFamily: theme.fonts[500], fontSize: 24 }}>
                    Good {Day()}
                </Text>
            </View>

            {/* Streak pill */}
            <View style={{
                flexDirection: "row",
                backgroundColor: hasStreak ? "#FF8C0018" : theme.white + "10",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 120,
                gap: 6,
                borderWidth: 1,
                borderColor: hasStreak ? "#FF8C0030" : theme.white + "20",
                alignItems: "center",
            }}>
                <Flame
                    stroke={hasStreak ? "#FF8C00" : theme.text + "30"}
                    fill={hasStreak ? "#FF8C00" : "transparent"}
                    size={20}
                />
                <Text style={{
                    fontFamily: theme.fonts[600],
                    fontSize: 16,
                    color: hasStreak ? "#FF8C00" : theme.text + "40",
                }}>
                    {String(streak).padStart(2, "0")}
                </Text>
            </View>
        </View>
    );
}

export default React.memo(HeaderHeroScreen);