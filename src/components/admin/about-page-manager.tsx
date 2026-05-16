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
import { useAboutPage } from "./hooks/use-about-page";

export function AboutPageManager() {
    const {
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
    } = useAboutPage();

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
