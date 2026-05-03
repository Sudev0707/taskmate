import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable, Linking, ActivityIndicator } from "react-native";
import { Link2, Globe, ExternalLink } from "lucide-react-native";
import theme from "../data/color-theme";
import { HTMLParser } from "react-native-html-parser";

type Props = {
    url: string;
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
    /** Set false to hide the title/description info row below the thumbnail */
    showMeta?: boolean;
    /** Custom placeholder when metadata fails to load */
    fallbackTitle?: string;
    /** Maximum number of lines for title */
    titleLines?: number;
    /** Maximum number of lines for description */
    descriptionLines?: number;
};

type Metadata = {
    title: string;
    description: string;
    image: string | null;
    siteName: string;
    favicon: string | null;
    domain: string;
};

export default function URLPreview({ 
    url, 
    textColor = theme.text, 
    bgColor = theme.white + "05",
    borderColor = textColor + "15",
    showMeta = true,
    fallbackTitle = "Website Link",
    titleLines = 2,
    descriptionLines = 2
}: Props) {
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(false);
        
        fetchMetadata(url)
            .then(data => {
                if (isMounted && data) {
                    setMetadata(data);
                } else if (isMounted) {
                    setError(true);
                }
            })
            .catch(() => {
                if (isMounted) setError(true);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
            
        return () => { isMounted = false; };
    }, [url]);

    const fetchMetadata = async (targetUrl: string): Promise<Metadata | null> => {
        try {
            // Using a CORS proxy service (you can replace with your own backend)
            // Note: In production, you should use your own backend service
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            const html = await response.text();
            
// Parse metadata from HTML (React Native compatible)
            const doc = HTMLParser.parse(html);
            
// Tree traversal helpers for React Native HTML parsing
            const findNode = (root: any, tag: string, attr?: string, value?: string | RegExp): any => {
                const traverse = (node: any): any => {
                    if (node.tagName === tag.toUpperCase() &&
                        (!attr || (node.attributes && node.attributes[attr] &&
                            (typeof value === 'string' ? node.attributes[attr] === value : (value as RegExp).test(node.attributes[attr])))
                        ) {
                            return node;
                        }
                    }
                    if (node.children) {
                        for (const child of node.children) {
                            const found = traverse(child);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                return traverse(root.body || root);
            };

            const findTitleText = (root: any): string | null => {
                const titleNode = findNode(root, 'title');
                return titleNode ? titleNode.textContent?.trim() || null : null;
            };

            const findFaviconHref = (root: any): string | null => {
                const faviconLink = findNode(root, 'link', 'rel', /icon|shortcut\\s+icon/i );
                return faviconLink ? faviconLink.attributes?.href || null : null;
            };

            // Extract metadata
            const getMetaContent = (property: string): string | null => {
                const metaProp = findNode(doc, 'meta', 'property', property);
                if (metaProp?.attributes?.content) return metaProp.attributes.content;
                const metaName = findNode(doc, 'meta', 'name', property);
                return metaName?.attributes?.content || null;
            };
            
            const title = getMetaContent('og:title') || 
                         getMetaContent('twitter:title') || 
                         findTitleText(doc) || 
                         null;
                         
            const description = getMetaContent('og:description') || 
                               getMetaContent('twitter:description') || 
                               getMetaContent('description') || 
                               null;
                               
            const image = getMetaContent('og:image') || 
                         getMetaContent('twitter:image') || 
                         null;
                         
            const siteName = getMetaContent('og:site_name') || 
                            getMetaContent('application-name') || 
                            new URL(targetUrl).hostname.replace('www.', '');
                            
            const favicon = findFaviconHref(doc) || null;
            
            const domain = new URL(targetUrl).hostname.replace('www.', '');
            
            // Resolve relative favicon URL
            let resolvedFavicon = favicon;
            if (favicon && !favicon.startsWith('http')) {
                const baseUrl = new URL(targetUrl);
                resolvedFavicon = new URL(favicon, baseUrl.origin).href;
            }
            
            return {
                title: title || fallbackTitle,
                description: description || '',
                image,
                siteName,
                favicon: resolvedFavicon,
                domain
            };
        } catch (err) {
            console.error('Error fetching metadata:', err);
            return null;
        }
    };

    const handlePress = () => {
        Linking.openURL(url).catch(err => 
            console.log("Couldn't open URL", err)
        );
    };

    const getDomainFromUrl = (urlString: string) => {
        try {
            const urlObj = new URL(urlString);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return urlString.split('/')[2] || urlString;
        }
    };

    return (
        <Pressable 
            onPress={handlePress}
            style={{ 
                borderRadius: 16, 
                overflow: "hidden", 
                marginTop: 4, 
                width: "100%", 
                backgroundColor: bgColor, 
                borderWidth: 1, 
                borderColor: borderColor
            }}
        >
            {!error && metadata?.image && (
                <View style={{ height: 160, width: "100%", position: "relative" }}>
                    <Image
                        source={{ uri: metadata.image }}
                        style={{ width: "100%", height: "100%", resizeMode: "cover", opacity: 0.9 }}
                        onError={() => setError(true)}
                    />
                    <View style={{ 
                        position: "absolute", 
                        top: 8, 
                        right: 8, 
                        backgroundColor: theme.background + "80",
                        padding: 6,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4
                    }}>
                        <ExternalLink size={12} color={theme.white} />
                        <Text style={{ color: theme.white, fontSize: 10, fontFamily: theme.fonts[500] }}>
                            Visit
                        </Text>
                    </View>
                </View>
            )}
            
            {showMeta && (
                <View style={{ padding: 12, backgroundColor: bgColor, gap: 8 }}>
                    {loading ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <ActivityIndicator size="small" color={textColor} />
                            <Text style={{ fontFamily: theme.fonts[500], fontSize: 12, color: textColor + "70" }}>
                                Loading preview...
                            </Text>
                        </View>
                    ) : error || !metadata ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Globe size={20} color={textColor + "70"} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: theme.fonts[600], fontSize: 14, color: textColor }} numberOfLines={1}>
                                    {fallbackTitle}
                                </Text>
                                <Text style={{ fontFamily: theme.fonts[500], fontSize: 12, color: textColor + "50" }} numberOfLines={1}>
                                    {getDomainFromUrl(url)}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                {metadata.favicon && (
                                    <Image 
                                        source={{ uri: metadata.favicon }} 
                                        style={{ width: 16, height: 16, borderRadius: 4 }}
                                        onError={() => {}}
                                    />
                                )}
                                <Text style={{ fontFamily: theme.fonts[500], fontSize: 11, color: textColor + "60" }} numberOfLines={1}>
                                    {metadata.siteName || metadata.domain}
                                </Text>
                            </View>
                            
                            <Text style={{ fontFamily: theme.fonts[600], fontSize: 14, color: textColor, marginBottom: 2 }} numberOfLines={titleLines}>
                                {metadata.title}
                            </Text>
                            
                            {metadata.description && (
                                <Text style={{ fontFamily: theme.fonts[400], fontSize: 12, color: textColor + "70" }} numberOfLines={descriptionLines}>
                                    {metadata.description}
                                </Text>
                            )}
                            
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                                <Link2 size={12} color={textColor + "50"} />
                                <Text style={{ fontFamily: theme.fonts[500], fontSize: 10, color: textColor + "50" }} numberOfLines={1}>
                                    {metadata.domain}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            )}
        </Pressable>
    );
}