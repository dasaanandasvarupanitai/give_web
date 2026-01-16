"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import Marquee from "react-fast-marquee";

export function LoginDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleGoogleLogin() {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            setOpen(false);
        } catch (err: any) {
            setError(err?.message ?? "Unable to sign in with Google.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="text-sm font-medium text-foreground/90 hover:text-foreground transition-colors border border-orange-500 px-4 py-2 rounded-md"
                >
                    Login
                </button>
            </DialogTrigger>
            <DialogContent
                className="max-w-md w-[90vw] sm:w-full border border-border bg-muted sm:rounded-xl shadow-xl"
            >
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl sm:text-2xl text-center sm:text-left">Login to GIVE</DialogTitle>
                </DialogHeader>
                <div className="mb-4 sm:mb-6 overflow-hidden rounded-full bg-background/60 border border-border">
                    <Marquee
                        gradient={false}
                        speed={25}
                        pauseOnHover
                        className="px-4 py-1 text-xs md:text-sm font-medium text-black"
                    >
                        <span className="mx-4">
                            Hare Krishna Hare Krishna Krishna Krishna Hare Hare, Hare Rama Hare Rama Rama Rama Hare Hare.
                        </span>
                    </Marquee>
                </div>
                <div className="space-y-4 mt-2">
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3 border-2 border-border bg-background hover:bg-muted py-6 sm:py-7 text-base sm:text-lg font-medium"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            "Connecting to Google..."
                        ) : (
                            <>
                                <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-sm bg-white flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 sm:h-6 sm:w-6"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                        focusable="false"
                                    >
                                        <path
                                            fill="#EA4335"
                                            d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.8l3 2.3c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.4-.2-2H12z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M6.6 14.3l-.5.4-2.4 1.9C5.1 18.9 8.3 21 12 21c2.4 0 4.4-.8 5.8-2.2l-3-2.3c-.8.5-1.8.8-2.8.8-2.2 0-4.1-1.5-4.8-3.6z"
                                        />
                                        <path
                                            fill="#4A90E2"
                                            d="M4.2 8.6C3.7 9.6 3.4 10.7 3.4 12s.3 2.4.8 3.4c0 0 2.3-1.8 2.4-1.9-.2-.5-.3-1-.3-1.5s.1-1 .3-1.5z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M12 6.4c1.3 0 2.5.4 3.4 1.3l2.5-2.5C16.4 3.8 14.4 3 12 3 8.3 3 5.1 5.1 3.4 8.6l3.1 2.4C7.9 7.9 9.8 6.4 12 6.4z"
                                        />
                                    </svg>
                                </span>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}


