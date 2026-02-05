"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Download, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface NavItem {
    name: string;
    href: string;
}

interface Book {
    key: string;
    name: string;
    viewUrl: string;
    downloadUrl: string;
}

interface MobileNavProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    aboutNavItems: NavItem[];
    resourceNavItems: NavItem[];
    mainNavItems: NavItem[];
    books: readonly Book[];
    coursesHref: string;
    testimonialsHref: string;
    isTeacher: boolean;
    onMobileNavClick: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function MobileNav({
    isOpen,
    onOpenChange,
    aboutNavItems,
    resourceNavItems,
    mainNavItems,
    books,
    coursesHref,
    testimonialsHref,
    isTeacher,
    onMobileNavClick,
}: MobileNavProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 ml-2 border border-orange-500 rounded-full">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader className="sr-only">
                    <SheetTitle>Site navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                    <div className="flex items-center border-b pb-4">
                        <Link href="/" className="flex items-center space-x-2" onClick={() => onOpenChange(false)}>
                            <Image
                                src="/GIVE_logo.png"
                                alt="GIVE logo"
                                width={32}
                                height={32}
                                className="h-8 w-8"
                                priority
                            />
                            <span className="font-bold font-headline">GIVE</span>
                        </Link>
                    </div>
                    <nav className="flex flex-col gap-1 mt-4">
                        <Accordion type="single" collapsible className="w-full border-none">
                            <AccordionItem value="about" className="border-b-0">
                                <AccordionTrigger className="px-4 text-left text-lg font-medium text-foreground/90 transition-colors hover:text-foreground hover:no-underline py-2">
                                    About
                                </AccordionTrigger>
                                <AccordionContent className="pl-4">
                                    <div className="flex flex-col gap-2 mt-2">
                                        {aboutNavItems.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className="text-base font-medium text-foreground/90 transition-colors hover:text-foreground"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                        <Accordion type="single" collapsible className="w-full border-none">
                                            <AccordionItem value="guardians" className="border-b-0">
                                                <AccordionTrigger className="px-0 text-left text-base font-medium text-foreground/90 transition-colors hover:text-foreground hover:no-underline py-2">
                                                    Guardians
                                                </AccordionTrigger>
                                                <AccordionContent className="pl-4">
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        <Link
                                                            href="/about/srila-bhaktisiddhanta-sarasvati-thakura"
                                                            className="text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
                                                            onClick={() => onOpenChange(false)}
                                                        >
                                                            Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura
                                                        </Link>
                                                        <Link
                                                            href="/about/jayapataka-swami"
                                                            className="text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
                                                            onClick={() => onOpenChange(false)}
                                                        >
                                                            HH Jayapatākā Swami
                                                        </Link>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <Link
                            href="/classroom"
                            className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                            onClick={() => onOpenChange(false)}
                        >
                            Classroom
                        </Link>
                        {isTeacher && (
                            <>
                                <Link
                                    href="/teacher"
                                    className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Teacher Dashboard
                                </Link>
                                <Link
                                    href="/admin"
                                    className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Admin
                                </Link>
                            </>
                        )}
                        <Link
                            href={coursesHref}
                            className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                            onClick={(e) => onMobileNavClick(coursesHref, e)}
                        >
                            Courses
                        </Link>
                        <Link
                            href={testimonialsHref}
                            className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                            onClick={(e) => onMobileNavClick(testimonialsHref, e)}
                        >
                            Testimonials
                        </Link>
                        <Accordion type="single" collapsible className="w-full border-none">
                            <AccordionItem value="resources" className="border-b-0">
                                <AccordionTrigger className="px-4 text-left text-lg font-medium text-foreground/90 transition-colors hover:text-foreground hover:no-underline py-2">
                                    Resources
                                </AccordionTrigger>
                                <AccordionContent className="pl-4">
                                    <div className="flex flex-col gap-2 mt-2">
                                        {resourceNavItems.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-base font-medium text-foreground/90 transition-colors hover:text-foreground"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                        <Accordion type="single" collapsible className="w-full border-none">
                                            <AccordionItem value="books" className="border-b-0">
                                                <AccordionTrigger className="px-0 text-left text-base font-medium text-foreground/90 transition-colors hover:text-foreground hover:no-underline py-2">
                                                    Books
                                                </AccordionTrigger>
                                                <AccordionContent className="pl-4">
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        {books.map((book) => (
                                                            <div key={book.key} className="flex items-center justify-between">
                                                                <Link
                                                                    href={book.viewUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
                                                                    onClick={() => onOpenChange(false)}
                                                                >
                                                                    {book.name}
                                                                </Link>
                                                                <Link
                                                                    href={book.downloadUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="ml-2 p-1 border-2 border-orange-500 rounded"
                                                                    onClick={() => onOpenChange(false)}
                                                                    download
                                                                >
                                                                    <Download className="h-4 w-4 text-orange-500" />
                                                                </Link>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        {mainNavItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                                onClick={(e) => onMobileNavClick(item.href, e)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </SheetContent>
        </Sheet>
    );
}
