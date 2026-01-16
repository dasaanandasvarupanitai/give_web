"use client";

import { CourseManagement } from "@/components/teacher/course-management";
import { QuoteManagement } from "@/components/teacher/quote-management";
import { TestimonialManagement } from "@/components/teacher/testimonial-management";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeacher } from "@/hooks/use-teacher";
import {
    getAboutPage,
    getAllAboutPages,
    setAboutPage,
    type AboutPage,
    type AboutSection,
} from "@/lib/services/firestore";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminPage() {
    const { isTeacher, initializing, user } = useTeacher();
    const router = useRouter();

    // About pages state
    const [aboutPages, setAboutPages] = useState<AboutPage[]>([]);
    const [selectedAboutSlug, setSelectedAboutSlug] = useState<string>("");
    const [activeAboutPage, setActiveAboutPage] = useState<AboutPage | null>(null);
    const [savingAbout, setSavingAbout] = useState(false);

    useEffect(() => {
        if (!initializing && (!user || !isTeacher)) {
            router.push("/");
        }
    }, [isTeacher, initializing, user, router]);

    useEffect(() => {
        if (!user || !isTeacher) return;

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
    }, [user, isTeacher, selectedAboutSlug]);

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

    if (initializing) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-muted-foreground">Loading admin data...</div>
                </div>
            </div>
        );
    }

    if (!user || !isTeacher) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        You do not have permission to access this page.
                    </p>
                    <Button onClick={() => router.push("/")}>Go to Home</Button>
                </div>
            </div>
        );
    }

    const getSectionContent = (section: AboutSection): string => {
        const paragraphs = section.paragraphs ?? [];
        if (paragraphs.length === 0) return "";
        if (paragraphs.length === 1) return paragraphs[0] ?? "";
        // For legacy data with multiple plain paragraphs, join them as simple HTML.
        return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
    };

    const handleAboutSectionContentChange = (sectionId: string, value: string) => {
        if (!activeAboutPage) return;

        const nextSections: AboutSection[] = activeAboutPage.sections.map((section) => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                // Store a single HTML blob per section in paragraphs[0]
                paragraphs: [value],
            };
        });

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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                        Admin Content Management
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Manage high-level website content. Only teachers can access this
                        page.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="content" className="w-full">
                <TabsList className="w-full grid grid-cols-1 md:w-auto md:inline-grid md:grid-cols-1 mb-4">
                    <TabsTrigger
                        value="content"
                        className="flex items-center justify-center gap-2"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span>Content controls</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SlidersHorizontal className="h-5 w-5" />
                                Content management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-muted-foreground">
                                Manage high-level website content from here. These tools are
                                moved out of the teacher dashboard so this page serves as your
                                central admin for courses, quotes, testimonials, and About text.
                            </p>
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full space-y-2"
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
                                                                    {section.imagePath ? ` • Image: ${section.imagePath}` : ""}
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
                                                        {savingAbout ? "Saving..." : `Save "${selectedAboutName}" content`}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="courses">
                                    <AccordionTrigger className="text-base font-semibold">
                                        Courses
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2">
                                        <CourseManagement />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="quotes">
                                    <AccordionTrigger className="text-base font-semibold">
                                        Quotes
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2">
                                        <QuoteManagement />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="testimonials">
                                    <AccordionTrigger className="text-base font-semibold">
                                        Testimonials
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2">
                                        <TestimonialManagement />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                </TabsContent>
            </Tabs>
        </div>
    );
}

