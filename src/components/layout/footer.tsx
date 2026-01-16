import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="w-full bg-gradient-to-b from-muted/95 via-muted to-background border-t border-border/40 text-secondary-foreground py-12 md:py-16"
    >
      <div className="container max-w-screen-2xl grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="space-y-4">
          <h3 className="text-2xl font-headline font-bold">Gaura-vāṇī Institute</h3>
          <p className="text-secondary-foreground/80">
            Dedicated to the study and practice of Vaiṣṇava wisdom for a meaningful life.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1 shrink-0" />
              <span>Sridham Mayapur Nabadwip, Nadia, West Bengal || Pincode: 741313</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0" />
              <span>+91 89729 16108</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0" />
              <a href="mailto:studyatgive.108@gmail.com" className="hover:underline">
                studyatgive.108@gmail.com
              </a>
            </div>
          </div>
          <div className="flex space-x-4 pt-2">
            <Link
              href="https://www.facebook.com/vaikunthagunanuvarnana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:opacity-80 transition-opacity"
            >
              <svg className="h-6 w-6" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Link>
            <Link
              href="https://youtube.com/@VaikunthaGunanuvarnana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="hover:opacity-80 transition-opacity"
            >
              <svg className="h-6 w-6" fill="#FF0000" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </Link>
            <Link
              href="http://wa.me/918972916108"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hover:opacity-80 transition-opacity"
            >
              <svg className="h-6 w-6" fill="#25D366" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-2xl font-headline font-bold">Get in Touch</h3>
          <p className="text-secondary-foreground/80">
            Have questions? Fill out the form below, and we'll get back to you.
          </p>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your Name" type="text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" placeholder="your.email@example.com" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your question or message..." rows={4} />
            </div>
            <Button type="submit" className="w-full sm:w-auto">Send Message</Button>
          </form>
        </div>
      </div>
      <div className="container max-w-screen-2xl mt-12 text-center text-sm text-secondary-foreground/60">
        <p>&copy; {new Date().getFullYear()} Gaura-vāṇī Institute for Vaiṣṇava Education. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
