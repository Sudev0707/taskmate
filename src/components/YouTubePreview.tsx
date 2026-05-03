import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable, Linking } from "react-native";
import { Play } from "lucide-react-native";
import theme from "../data/color-theme";

type Props = {
    youtubeId: string;
    textColor?: string;
    bgColor?: string;
    /** Set false to hide the title/author info row below the thumbnail */
    showMeta?: boolean;
};

export default function YouTubePreview({ youtubeId, textColor = theme.text, bgColor = theme.white + "05", showMeta = true }: Props) {
    const [meta, setMeta] = useState<{ title: string; author: string } | null>(null);

    useEffect(() => {
        let isMounted = true;
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`)
            .then(res => res.json())
            .then(data => {
                if (isMounted && data) {
                    setMeta({ title: data.title, author: data.author_name });
                }
            })
            .catch(() => {
                // Silently ignore loading errors
            });
        return () => { isMounted = false; };
    }, [youtubeId]);

    return (
        <View style={{ borderRadius: 16, overflow: "hidden", marginTop: 0, width: "100%", backgroundColor: bgColor, borderWidth: 1, borderColor: textColor + "15" }}>
            <View style={{ height: 160, width: "100%", position: "relative" }}>
                <Image
                    source={{ uri: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
                    style={{ width: "100%", height: "100%", resizeMode: "cover", opacity: 0.9 }}
                />
                <Pressable
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}
                    onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${youtubeId}`).catch(err => console.log("Couldn't load page", err))}
                >
                    <View style={{ backgroundColor: theme.background + "40", padding: 14, borderRadius: 30, borderWidth: 1, borderColor: theme.white + "20" }}>
                        <Play fill={theme.white} color={theme.white} size={24} />
                    </View>
                </Pressable>
            </View>
            {showMeta && (
                <View style={{ padding: 12, backgroundColor: bgColor, flexDirection: "column", gap: 24 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        {meta ? (
                            <>
                                <Text style={{ fontFamily: theme.fonts[600], fontSize: 14, color: textColor, marginBottom: 2 }} numberOfLines={2}>
                                    {meta.title}
                                </Text>
                                <Text style={{ fontFamily: theme.fonts[500], fontSize: 12, color: textColor + "70" }} numberOfLines={1}>
                                    {meta.author}
                                </Text>
                            </>
                        ) : (
                            <Text style={{ fontFamily: theme.fonts[600], fontSize: 14, color: textColor }} numberOfLines={1}>
                                YouTube Video
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}
