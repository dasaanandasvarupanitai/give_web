export function getFileNameFromUrl(url: string): string {
    try {
        if (!url || typeof url !== "string") return "file";

        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/(?:o|b\/[^\/]+\/o)\/(.+?)(?:\?|$)/);

        if (pathMatch && pathMatch[1]) {
            const decodedPath = decodeURIComponent(pathMatch[1]);
            const parts = decodedPath.split("/");
            return parts[parts.length - 1] || "file";
        }

        const fallbackMatch = urlObj.pathname.match(/\/([^\/]+)$/);
        if (fallbackMatch) {
            return decodeURIComponent(fallbackMatch[1]);
        }

        return "file";
    } catch {
        return "file";
    }
}

export function getFileType(fileName: string): "pdf" | "video" | "audio" | "image" | "other" {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const videoExts = ["mp4", "webm", "mov", "m4v", "avi", "mkv"];
    const audioExts = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    if (ext === "pdf") return "pdf";
    if (videoExts.includes(ext)) return "video";
    if (audioExts.includes(ext)) return "audio";
    if (imageExts.includes(ext)) return "image";
    return "other";
}
