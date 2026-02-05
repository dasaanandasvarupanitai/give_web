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

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        if (!selectedAboutSlug) return;

        (async () => {
            const page = await getAboutPage(selectedAboutSlug);
            if (page) {
                setActiveAboutPage(page);
            }
        })();
    }, [selectedAboutSlug]);

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
                    // Store a single HTML blob per section in paragraphs[0]
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
            await setAboutPage({
                slug: activeAboutPage.slug,
                name: activeAboutPage.name,
                heroTitle: activeAboutPage.heroTitle,
                heroSubtitle: activeAboutPage.heroSubtitle,
                sections: activeAboutPage.sections,
            });
        } finally {
            setSavingAbout(false);
        }
    };

    return (
        <Accordion type="single" collapsible className="w-full space-y-2">
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

                            <div className="flex justify-end">
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
