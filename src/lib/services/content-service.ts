import { db } from "@/lib/firebase";
import {
    Quote,
    QuoteFirestore,
    quoteFromFirestore,
    quoteToFirestore,
} from "@/lib/models/quote";
import {
    Testimonial,
    TestimonialFirestore,
    testimonialFromFirestore,
    testimonialToFirestore,
} from "@/lib/models/testimonial";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
} from "firebase/firestore";

// ==================== Quote Operations ====================

export async function createQuote(quote: Omit<Quote, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
        const quoteRef = doc(collection(db, "quotes"));
        const now = new Date();
        const fullQuote: Quote = {
            ...quote,
            id: quoteRef.id,
            createdAt: now,
            updatedAt: now,
        };
        const quoteData: QuoteFirestore = quoteToFirestore(fullQuote);
        await setDoc(quoteRef, quoteData);
        return quoteRef.id;
    } catch (error) {
        throw new Error(`Failed to create quote: ${error}`);
    }
}

export async function updateQuote(id: string, quote: Partial<Quote>): Promise<void> {
    try {
        const quoteRef = doc(db, "quotes", id);
        const updates: Partial<QuoteFirestore> = {
            updatedAt: Timestamp.now(),
        };

        if (quote.quote !== undefined) updates.quote = quote.quote;
        if (quote.author !== undefined) updates.author = quote.author;
        if (quote.date !== undefined) updates.date = quote.date;

        await updateDoc(quoteRef, updates);
    } catch (error) {
        throw new Error(`Failed to update quote: ${error}`);
    }
}

export async function deleteQuote(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "quotes", id));
    } catch (error) {
        throw new Error(`Failed to delete quote: ${error}`);
    }
}

export async function getQuotes(): Promise<Quote[]> {
    try {
        const snapshot = await getDocs(collection(db, "quotes"));
        const quotes = snapshot.docs.map((doc) =>
            quoteFromFirestore(doc.id, doc.data() as QuoteFirestore)
        );
        quotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        return quotes;
    } catch (error) {
        throw new Error(`Failed to get quotes: ${error}`);
    }
}

export function subscribeQuotes(
    callback: (quotes: Quote[]) => void,
    onError?: (error: Error) => void
): () => void {
    const q = query(collection(db, "quotes"));

    return onSnapshot(
        q,
        (snapshot) => {
            const quotes = snapshot.docs.map((doc) =>
                quoteFromFirestore(doc.id, doc.data() as QuoteFirestore)
            );
            quotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            callback(quotes);
        },
        (error) => {
            console.error("Error in quotes subscription:", error);
            if (onError) {
                onError(error);
            }
            callback([]);
        }
    );
}

// ==================== Testimonial Operations ====================

export async function createTestimonial(testimonial: Omit<Testimonial, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
        const testimonialRef = doc(collection(db, "testimonials"));
        const now = new Date();
        const fullTestimonial: Testimonial = {
            ...testimonial,
            id: testimonialRef.id,
            createdAt: now,
            updatedAt: now,
        };
        const testimonialData: TestimonialFirestore = testimonialToFirestore(fullTestimonial);
        await setDoc(testimonialRef, testimonialData);
        return testimonialRef.id;
    } catch (error) {
        throw new Error(`Failed to create testimonial: ${error}`);
    }
}

export async function updateTestimonial(id: string, testimonial: Partial<Testimonial>): Promise<void> {
    try {
        const testimonialRef = doc(db, "testimonials", id);
        const updates: Partial<TestimonialFirestore> = {
            updatedAt: Timestamp.now(),
        };

        if (testimonial.name !== undefined) updates.name = testimonial.name;
        if (testimonial.designation !== undefined) updates.designation = testimonial.designation;
        if (testimonial.address !== undefined) updates.address = testimonial.address;
        if (testimonial.description !== undefined) updates.description = testimonial.description;
        if (testimonial.imageUrl !== undefined) updates.imageUrl = testimonial.imageUrl;

        await updateDoc(testimonialRef, updates);
    } catch (error) {
        throw new Error(`Failed to update testimonial: ${error}`);
    }
}

export async function deleteTestimonial(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "testimonials", id));
    } catch (error) {
        throw new Error(`Failed to delete testimonial: ${error}`);
    }
}

export async function getTestimonials(): Promise<Testimonial[]> {
    try {
        const snapshot = await getDocs(collection(db, "testimonials"));
        const testimonials = snapshot.docs.map((doc) =>
            testimonialFromFirestore(doc.id, doc.data() as TestimonialFirestore)
        );
        testimonials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return testimonials;
    } catch (error) {
        throw new Error(`Failed to get testimonials: ${error}`);
    }
}

export function subscribeTestimonials(
    callback: (testimonials: Testimonial[]) => void,
    onError?: (error: Error) => void
): () => void {
    const q = query(collection(db, "testimonials"));

    return onSnapshot(
        q,
        (snapshot) => {
            const testimonials = snapshot.docs.map((doc) =>
                testimonialFromFirestore(doc.id, doc.data() as TestimonialFirestore)
            );
            testimonials.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            callback(testimonials);
        },
        (error) => {
            console.error("Error in testimonials subscription:", error);
            if (onError) {
                onError(error);
            }
            callback([]);
        }
    );
}

// ==================== About Page Content ====================

export type AboutSectionLayout = "image-left" | "image-right" | "text-only";

export interface AboutSection {
    id: string;
    layout: AboutSectionLayout;
    title?: string;
    subtitle?: string;
    imagePath?: string;
    imageAlt?: string;
    paragraphs: string[];
}

export interface AboutPage {
    slug: string;
    name: string;
    heroTitle?: string;
    heroSubtitle?: string;
    sections: AboutSection[];
    updatedAt: Date;
}

export interface AboutPageFirestore {
    slug: string;
    name: string;
    heroTitle?: string;
    heroSubtitle?: string;
    sections: AboutSection[];
    updatedAt: Timestamp;
}

export function aboutPageFromFirestore(
    data: AboutPageFirestore
): AboutPage {
    return {
        slug: data.slug,
        name: data.name,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        sections: data.sections ?? [],
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
    };
}

export function aboutPageToFirestore(
    page: AboutPage
): AboutPageFirestore {
    const base: AboutPageFirestore = {
        slug: page.slug,
        name: page.name,
        sections: page.sections,
        updatedAt: Timestamp.fromDate(page.updatedAt),
    };

    if (page.heroTitle != null) {
        base.heroTitle = page.heroTitle;
    }
    if (page.heroSubtitle != null) {
        base.heroSubtitle = page.heroSubtitle;
    }

    return base;
}

export async function getAboutPage(slug: string): Promise<AboutPage | null> {
    try {
        const ref = doc(db, "aboutPages", slug);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return null;
        }

        return aboutPageFromFirestore(snap.data() as AboutPageFirestore);
    } catch (error) {
        console.error("Failed to get about page:", error);
        return null;
    }
}

export async function setAboutPage(
    page: Omit<AboutPage, "updatedAt">
): Promise<void> {
    try {
        const ref = doc(db, "aboutPages", page.slug);
        const payload = aboutPageToFirestore({
            ...page,
            updatedAt: new Date(),
        });
        await setDoc(ref, payload, { merge: true });
    } catch (error) {
        console.error("Failed to set about page:", error);
        throw error;
    }
}

export async function getAllAboutPages(): Promise<AboutPage[]> {
    try {
        const snapshot = await getDocs(collection(db, "aboutPages"));
        const pages = snapshot.docs.map((docSnap) =>
            aboutPageFromFirestore(docSnap.data() as AboutPageFirestore)
        );
        pages.sort((a, b) => a.name.localeCompare(b.name));
        return pages;
    } catch (error) {
        console.error("Failed to list about pages:", error);
        return [];
    }
}
