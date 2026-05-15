"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, Download } from "lucide-react";
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

interface DesktopNavProps {
    aboutNavItems: NavItem[];
    resourceNavItems: NavItem[];
    mainNavItems: NavItem[];
    books: readonly Book[];
    coursesHref: string;
    testimonialsHref: string;
    isTeacher: boolean;
    onNavClick: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function DesktopNav({
    aboutNavItems,
    resourceNavItems,
    mainNavItems,
    books,
    coursesHref,
    testimonialsHref,
    isTeacher,
    onNavClick,
}: DesktopNavProps) {
    const isMobile = useIsMobile();

    return (
        <nav className="hidden lg:flex items-center gap-6 text-sm">
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 font-medium text-foreground/90 transition-colors hover:text-foreground focus:outline-none">
                    About <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {aboutNavItems.map((item) => (
                        <DropdownMenuItem key={item.name} asChild>
                            <Link href={item.href}>{item.name}</Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Guardians</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem asChild>
                                <Link href="/about/srila-bhaktisiddhanta-sarasvati-thakura">
                                    Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/about/jayapataka-swami">
                                    HH Jayapatākā Swami
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
            <Link
                href="/classroom"
                className="font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
                Classroom
            </Link>
            <Link
                href="/qna"
                className="font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
                QnA
            </Link>
            {isTeacher && (
                <>
                    <Link
                        href="/teacher"
                        className="font-medium text-foreground/90 transition-colors hover:text-foreground"
                    >
                        Teacher Dashboard
                    </Link>
                    <Link
                        href="/admin"
                        className="font-medium text-foreground/90 transition-colors hover:text-foreground"
                    >
                        Admin
                    </Link>
                </>
            )}
            <Link
                href={coursesHref}
                className="font-medium text-foreground/90 transition-colors hover:text-foreground"
                onClick={(e) => onNavClick(coursesHref, e)}
            >
                Courses
            </Link>
            <Link
                href={testimonialsHref}
                className="font-medium text-foreground/90 transition-colors hover:text-foreground"
                onClick={(e) => onNavClick(testimonialsHref, e)}
            >
                Testimonials
            </Link>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 font-medium text-foreground/90 transition-colors hover:text-foreground focus:outline-none">
                    Resources <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {resourceNavItems.map((item) => (
                        <DropdownMenuItem key={item.name} asChild>
                            <Link href={item.href} target="_blank" rel="noopener noreferrer">
                                {item.name}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Books</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {books.map((book) => (
                                <div key={book.key} className="flex items-center gap-2 px-2 py-1.5">
                                    <DropdownMenuItem asChild className="flex-1">
                                        <Link href={book.viewUrl} target="_blank" rel="noopener noreferrer">
                                            {book.name}
                                        </Link>
                                    </DropdownMenuItem>
                                    {isMobile && (
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={book.downloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="p-1 border-2 border-orange-500 rounded"
                                            >
                                                <Download className="h-4 w-4 text-orange-500" />
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </div>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
            {mainNavItems.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className="font-medium text-foreground/90 transition-colors hover:text-foreground"
                    onClick={(e) => onNavClick(item.href, e)}
                >
                    {item.name}
                </Link>
            ))}
        </nav>
    );
}
