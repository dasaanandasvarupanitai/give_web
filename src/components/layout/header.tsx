"use client";

import { UserMenu } from "@/components/auth/user-menu";
import { useTeacher } from "@/hooks/use-teacher";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";

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

// Use clean API route instead of direct Firebase Storage URL
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

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isTeacher } = useTeacher();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const coursesHref = isHomePage ? "#courses" : "/courses";
  const testimonialsHref = isHomePage ? "#testimonials" : "/testimonials";

  const scrollToSection = React.useCallback((hash: string) => {
    const id = hash.startsWith("#") ? hash.substring(1) : hash;
    const element = document.getElementById(id) || document.querySelector(`[id="${id}"]`);

    if (element) {
      const headerHeight = 56;
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const elementTop = rect.top + scrollTop;
      const offsetPosition = elementTop - headerHeight - 20;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth"
      });
    }
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      scrollToSection(href);
    }
  };

  const handleMobileNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      setTimeout(() => {
        scrollToSection(href);
      }, 350);
    } else {
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

        <DesktopNav
          aboutNavItems={aboutNavItems}
          resourceNavItems={resourceNavItems}
          mainNavItems={mainNavItems}
          books={books}
          coursesHref={coursesHref}
          testimonialsHref={testimonialsHref}
          isTeacher={isTeacher}
          onNavClick={handleNavClick}
        />

        <div className="hidden lg:flex items-center" suppressHydrationWarning>
          <UserMenu />
        </div>

        <div className="flex items-center gap-2 lg:hidden" suppressHydrationWarning>
          <UserMenu />
          <MobileNav
            isOpen={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
            aboutNavItems={aboutNavItems}
            resourceNavItems={resourceNavItems}
            mainNavItems={mainNavItems}
            books={books}
            coursesHref={coursesHref}
            testimonialsHref={testimonialsHref}
            isTeacher={isTeacher}
            onMobileNavClick={handleMobileNavClick}
          />
        </div>
      </div>
    </header>
  );
}
