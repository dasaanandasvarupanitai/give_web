"use client";

import { AboutPageManager } from "@/components/admin/about-page-manager";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeacher } from "@/hooks/use-teacher";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
    const { isTeacher, initializing, user } = useTeacher();
    const router = useRouter();

    useEffect(() => {
        if (!initializing && (!user || !isTeacher)) {
            router.push("/");
        }
    }, [isTeacher, initializing, user, router]);

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

                            <AboutPageManager />

                            <Accordion
                                type="single"
                                collapsible
                                className="w-full space-y-2"
                            >
                                {/* AboutPageManager handles its own AccordionItem, 
                    but here we are nesting it or keeping it parallel?
                    The AboutPageManager returns an Accordion structure.
                    
                    Wait, `AboutPageManager` returns a full Accordion with one item "about".
                    I shouldn't nest Accordion inside Accordion if I want them to look like siblings.
                    However, the original code had one Accordion with values "about", "courses", "quotes", "testimonials".
                    
                    If `AboutPageManager` returns an Accordion, I can't put it directly inside another Accordion as an Item easily without breaking the flow.
                    
                    Let's check `AboutPageManager` again.
                    It wraps content in:
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      <AccordionItem value="about">...</AccordionItem>
                    </Accordion>
                    
                    This means I can't easily merge it with the other items if I want them in the *same* accordion group (i.e. only one open at a time across all).
                    But visual consistency is fine if they are stacked.
                    
                    Alternative: `AboutPageManager` should export `AboutPageManagerContent` which is the CONTENT of the accordion item, 
                    OR `AboutPageManager` should be an AccordionItem itself.
                    
                    Current implementation of `AboutPageManager` includes the `Accordion` wrapper.
                    So I should place it *outside* the main Accordion below, or refactor it.
                    
                    Merging 4 separate Accordions is fine, or I can just stack them.
                    Actually, the original behavior had them all in one Accordion (type="single").
                    If I separate them, multiple can be open at once (unless I control state, which I don't want to complicate).
                    
                    Let's just stack them. `AboutPageManager` is one block.
                    Then the rest can be another block or separate blocks.
                    
                    Let's keep `AboutPageManager` as is. 
                    And below it, I will put the other items.
                    
                    Actually, to make them look uniform, I should probably put them all in their own separate Accordions or Cards, 
                    OR just have `AboutPageManager` return the `AccordionItem`?
                    But `AccordionItem` relies on Context from `Accordion`. so it MUST be inside `Accordion`.
                    
                    So I will put `AboutPageManager` first.
                    Then another `Accordion` for the rest?
                    
                    Actually, `AboutPageManager` is quite heavy. 
                    Let's just render `AboutPageManager` (which has the accordion)
                    and then render the others in a separate Accordion.
                */}

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
