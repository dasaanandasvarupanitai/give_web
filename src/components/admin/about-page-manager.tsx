"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { parseHtmlToParagraphs } from "@/lib/html-utils";
import {
    AboutPage,
    AboutSection,
    getAboutPage,
    getAllAboutPages,
    setAboutPage,
} from "@/lib/services/firestore";
import { useEffect, useMemo, useState } from "react";

export function AboutPageManager() {
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

        // We don't parse immediately on every keystroke to avoid cursor jumping/re-rendering issues
        // We just store the raw HTML blob in paragraphs[0] for the editor to use.
        // The parsing happens on SAVE or we can do it here if we want to be "live".
        // BUT, the goal is to store as array.
        // Actually, for the editor to work seamlessly, it needs the full HTML string.
        // So we keep using paragraphs[0] (or a joined string) for the editor,
        // but when we SAVE, we split it.
        // However, the `activeAboutPage` logic below effectively updates the state.
        // If we split it here, `getSectionContent` needs to join it back.

        const nextSections: AboutSection[] = activeAboutPage.sections.map(
            (section) => {
                if (section.id !== sectionId) return section;
                return {
                    ...section,
                    // Temporarily store as joined string or just one item for the editor loop
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
                // If we have a single paragraph that contains HTML, try to split it
                // We assume if it's length 1, it might be a blob from the editor
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
                    // Join existing paragraphs first in case it's mixed, then re-parse
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

            // Refresh current view
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

    return (
        <Accordion
            type="single"
            collapsible
            className="w-full space-y-2"
            onValueChange={(val) => {
                if (val === "about") setHasOpened(true);
            }}
        >
            <AccordionItem value="about">
                <AccordionTrigger className="text-base font-semibold">
                    About pages
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="about-page-select">Select page</Label>
                        <select
                            id="about-page-select"
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={selectedAboutSlug}
                            onChange={(e) => setSelectedAboutSlug(e.target.value)}
                        >
                            {aboutPages.map((page) => (
                                <option key={page.slug} value={page.slug}>
                                    {page.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {activeAboutPage && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="block text-sm font-medium">
                                    Page title (hero)
                                </Label>
                                <input
                                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={activeAboutPage.heroTitle ?? ""}
                                    onChange={(e) => handleAboutTitleChange(e.target.value)}
                                />
                            </div>

                            {activeAboutPage.sections.map((section) => (
                                <Card key={section.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center justify-between gap-2">
                                            <span>{section.id}</span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                Layout: {section.layout}
                                                {section.imagePath
                                                    ? ` • Image: ${section.imagePath}`
                                                    : ""}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="space-y-1">
                                            <Label className="block text-xs font-medium">
                                                Section content
                                            </Label>
                                            <RichTextEditor
                                                value={getSectionContent(section)}
                                                onChange={(val: string) =>
                                                    handleAboutSectionContentChange(section.id, val)
                                                }
                                                placeholder="Edit section content..."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <div className="flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleFixDatabase}
                                    disabled={savingAbout}
                                >
                                    Fix Database
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveAbout}
                                    disabled={savingAbout}
                                >
                                    {savingAbout
                                        ? "Saving..."
                                        : `Save "${selectedAboutName}" content`}
                                </Button>
                            </div>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
