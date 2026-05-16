"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AboutPage,
    AboutSection,
    getAboutPage,
    getAllAboutPages,
    setAboutPage,
} from "@/lib/services/firestore";
import { parseHtmlToParagraphs } from "@/lib/html-utils";

export function useAboutPage() {
    const [aboutPages, setAboutPages] = useState<AboutPage[]>([]);
    const [selectedAboutSlug, setSelectedAboutSlug] = useState<string>("");
    const [activeAboutPage, setActiveAboutPage] = useState<AboutPage | null>(null);
    const [savingAbout, setSavingAbout] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);

    useEffect(() => {
        if (!hasOpened) return;
        (async () => {
            const pages = await getAllAboutPages();
            setAboutPages(pages);
            if (pages.length > 0) {
                // Ensure we always have a valid selected slug from the collection
                const hasCurrent = pages.some((p) => p.slug === selectedAboutSlug);
                if (!hasCurrent) {
                    setSelectedAboutSlug(pages[0].slug);
                }
            }
        })();
    }, [hasOpened]);

    useEffect(() => {
        if (!selectedAboutSlug || !hasOpened) return;

        (async () => {
            const page = await getAboutPage(selectedAboutSlug);
            if (page) {
                setActiveAboutPage(page);
            }
        })();
    }, [selectedAboutSlug, hasOpened]);

    const selectedAboutName = useMemo(() => {
        const found = aboutPages.find((p) => p.slug === selectedAboutSlug);
        return found?.name ?? "About page";
    }, [aboutPages, selectedAboutSlug]);

    const getSectionContent = (section: AboutSection): string => {
        const paragraphs = section.paragraphs ?? [];
        if (paragraphs.length === 0) return "";
        if (paragraphs.length === 1) return paragraphs[0] ?? "";
        // For legacy data with multiple plain paragraphs, join them as simple HTML.
        return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
    };

    const handleAboutSectionContentChange = (
        sectionId: string,
        value: string
    ) => {
        if (!activeAboutPage) return;

        const nextSections: AboutSection[] = activeAboutPage.sections.map(
            (section) => {
                if (section.id !== sectionId) return section;
                return {
                    ...section,
                    paragraphs: [value],
                };
            }
        );

        setActiveAboutPage({
            ...activeAboutPage,
            sections: nextSections,
        });
    };

    const handleAboutTitleChange = (value: string) => {
        if (!activeAboutPage) return;
        setActiveAboutPage({
            ...activeAboutPage,
            heroTitle: value,
        });
    };

    const handleSaveAbout = async () => {
        if (!activeAboutPage) return;

        try {
            setSavingAbout(true);

            // Process sections to ensure paragraphs are split correctly
            const processedSections = activeAboutPage.sections.map(section => {
                if (section.paragraphs.length === 1) {
                    return {
                        ...section,
                        paragraphs: parseHtmlToParagraphs(section.paragraphs[0])
                    };
                }
                return section;
            });

            await setAboutPage({
                slug: activeAboutPage.slug,
                name: activeAboutPage.name,
                heroTitle: activeAboutPage.heroTitle,
                heroSubtitle: activeAboutPage.heroSubtitle,
                sections: processedSections,
            });
        } finally {
            setSavingAbout(false);
        }
    };

    const handleFixDatabase = async () => {
        if (!confirm("This will scan all About pages and split HTML blobs into paragraph arrays. Continue?")) return;

        try {
            setSavingAbout(true);
            const allPages = await getAllAboutPages();

            for (const page of allPages) {
                const updatedSections = page.sections.map(section => {
                    const joined = section.paragraphs.join("");
                    return {
                        ...section,
                        paragraphs: parseHtmlToParagraphs(joined)
                    };
                });

                await setAboutPage({
                    ...page,
                    sections: updatedSections
                });
            }
            alert("Database fixed successfully!");

            const freshPages = await getAllAboutPages();
            setAboutPages(freshPages);
            if (selectedAboutSlug) {
                const freshPage = freshPages.find(p => p.slug === selectedAboutSlug);
                if (freshPage) setActiveAboutPage(freshPage);
            }
        } catch (error) {
            console.error(error);
            alert("Error fixing database.");
        } finally {
            setSavingAbout(false);
        }
    };

    return {
        aboutPages,
        selectedAboutSlug,
        setSelectedAboutSlug,
        activeAboutPage,
        savingAbout,
        selectedAboutName,
        setHasOpened,
        getSectionContent,
        handleAboutSectionContentChange,
        handleAboutTitleChange,
        handleSaveAbout,
        handleFixDatabase,
    };
}
