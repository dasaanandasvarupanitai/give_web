"use client";

import { UserMenu } from "@/components/auth/user-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTeacher } from "@/hooks/use-teacher";
import { ChevronDown, Download, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

const mainNavItems = [
  { name: "Contact", href: "#contact" },
];

const resourceNavItems = [
  { name: "Youtube", href: "https://youtube.com/@VaikunthaGunanuvarnana" },
  { name: "Facebook", href: "https://www.facebook.com/vaikunthagunanuvarnana" },
  { name: "SP Nectar Drops", href: "https://www.youtube.com/playlist?list=PLqRizzK9qLnIhYlasqoQKDxSlbSzON3pd" },
];

const aboutNavItems = [
  { name: "Srila Prabhupada", href: "/about/srila-prabhupada" },
  { name: "ISKCON", href: "/about/iskcon" },
  { name: "GIVE", href: "/about/give" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isTeacher } = useTeacher();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  // Use clean API route instead of direct Firebase Storage URL
  // This hides the Firebase Storage URL from users
  const books = [
    {
      key: "bengali-bs-shb",
      name: "Bhakti-Sastri Student Handbook (Bengali)",
      viewUrl: "/api/books/bengali-bs-shb",
      downloadUrl: "/api/books/bengali-bs-shb?download=true",
    },
    {
      key: "idc-students-handbook-english",
      name: "IDC Students Handbook (English)",
      viewUrl: "/api/books/idc-students-handbook-english",
      downloadUrl: "/api/books/idc-students-handbook-english?download=true",
    },
    {
      key: "idc-students-handbook-bengali",
      name: "IDC Students Handbook (Bengali)",
      viewUrl: "/api/books/idc-students-handbook-bengali",
      downloadUrl: "/api/books/idc-students-handbook-bengali?download=true",
    },
  ] as const;

  const coursesHref = isHomePage ? "#courses" : "/courses";
  const testimonialsHref = isHomePage ? "#testimonials" : "/testimonials";

  const scrollToSection = React.useCallback((hash: string) => {
    // Remove the # from hash if present
    const id = hash.startsWith("#") ? hash.substring(1) : hash;

    // Try multiple methods to find the element
    const element = document.getElementById(id) || document.querySelector(`[id="${id}"]`);

    if (element) {
      const headerHeight = 56; // h-14 = 56px
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const elementTop = rect.top + scrollTop;
      const offsetPosition = elementTop - headerHeight - 20; // 20px extra padding

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth"
      });
    }
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle hash links manually, let regular links use default behavior
    if (href.startsWith("#")) {
      e.preventDefault();
      // Hash links work on all pages (e.g., #contact in footer is on every page)
      scrollToSection(href);
    }
  };

  const handleMobileNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle hash links manually, let regular links use default behavior
    if (href.startsWith("#")) {
      e.preventDefault();
      // Close the menu first
      setIsMobileMenuOpen(false);
      // Hash links work on all pages (e.g., #contact in footer is on every page)
      // Wait for menu to close, then scroll
      setTimeout(() => {
        scrollToSection(href);
      }, 350);
    } else {
      // For regular links, just close the menu
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-secondary/90 backdrop-blur supports-[backdrop-filter]:bg-secondary/80">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/GIVE_logo.png"
            alt="GIVE logo"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="font-bold font-headline sm:inline-block">
            GIVE
          </span>
        </Link>

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
            onClick={(e) => handleNavClick(coursesHref, e)}
          >
            Courses
          </Link>
          <Link
            href={testimonialsHref}
            className="font-medium text-foreground/90 transition-colors hover:text-foreground"
            onClick={(e) => handleNavClick(testimonialsHref, e)}
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
              onClick={(e) => handleNavClick(item.href, e)}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center">
          <UserMenu />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <UserMenu />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
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
                              onClick={() => setIsMobileMenuOpen(false)}
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
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura
                                  </Link>
                                  <Link
                                    href="/about/jayapataka-swami"
                                    className="text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
                                    onClick={() => setIsMobileMenuOpen(false)}
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
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Classroom
                  </Link>
                  {isTeacher && (
                    <>
                      <Link
                        href="/teacher"
                        className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Teacher Dashboard
                      </Link>
                      <Link
                        href="/admin"
                        className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    </>
                  )}
                  <Link
                    href={coursesHref}
                    className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                    onClick={(e) => handleMobileNavClick(coursesHref, e)}
                  >
                    Courses
                  </Link>
                  <Link
                    href={testimonialsHref}
                    className="px-4 py-2 text-lg font-medium text-foreground/90 transition-colors hover:text-foreground"
                    onClick={(e) => handleMobileNavClick(testimonialsHref, e)}
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
                              onClick={() => setIsMobileMenuOpen(false)}
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
                                        onClick={() => setIsMobileMenuOpen(false)}
                                      >
                                        {book.name}
                                      </Link>
                                      <Link
                                        href={book.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 p-1 border-2 border-orange-500 rounded"
                                        onClick={() => setIsMobileMenuOpen(false)}
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
                      onClick={(e) => handleMobileNavClick(item.href, e)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
