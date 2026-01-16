import { storage } from "@/lib/firebase";
import { getDownloadURL, ref } from "firebase/storage";
import { NextRequest, NextResponse } from "next/server";

// Map of book slugs to Firebase Storage paths
const BOOKS_MAP: Record<string, string> = {
  "bengali-bs-shb": "books/GIVE_Bengali_BS_SHB.pdf",
  "idc-students-handbook-english": "books/IDC Students Handbook (English).pdf",
  "idc-students-handbook-bengali": "books/IDC Students Handbook (Bengali).pdf",
  // Add more books here as needed
  // "another-book": "books/Another_Book.pdf",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  // Handle both sync and async params (Next.js 13/14 vs 15+)
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  
  try {
    console.log("API Route - Received slug:", slug);
    console.log("API Route - Available books:", Object.keys(BOOKS_MAP));

    // Get the Firebase Storage path for this book
    const storagePath = BOOKS_MAP[slug];

    if (!storagePath) {
      console.error("Book not found for slug:", slug);
      return NextResponse.json(
        { error: "Book not found", slug, availableBooks: Object.keys(BOOKS_MAP) },
        { status: 404 }
      );
    }

    // Get the download URL from Firebase Storage
    const storageRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(storageRef);

    // Check if download is requested via query parameter
    const url = new URL(request.url);
    const forceDownload = url.searchParams.get("download") === "true";
    
    // Build the redirect URL
    // For downloads, append alt=media to ensure proper download behavior
    // The browser's download attribute will also help force download
    let redirectURL = downloadURL;
    if (forceDownload) {
      // Append alt=media parameter if not already present
      const urlObj = new URL(downloadURL);
      urlObj.searchParams.set("alt", "media");
      redirectURL = urlObj.toString();
    }

    // Redirect to Firebase Storage URL instead of proxying
    // This eliminates Fast Origin Transfer usage while maintaining clean URLs
    // 307 Temporary Redirect preserves the request method (GET)
    return NextResponse.redirect(redirectURL, {
      status: 307,
      headers: {
        // Cache the redirect response for 1 hour
        // The Firebase Storage URL itself has its own caching
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error serving book:", {
      error,
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      slug: resolvedParams?.slug
    });
    return NextResponse.json(
      { 
        error: "Failed to serve book",
        message: error?.message || "Unknown error",
        slug: resolvedParams?.slug
      },
      { status: 500 }
    );
  }
}

