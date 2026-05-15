import { PublicQnAPage } from "@/components/public/public-qna-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QnA | GIVE",
  description:
    "Browse sincere questions asked by devotees for upcoming QnA sessions. Explore topics on Krishna consciousness and devotional life.",
};

export default function QnAPage() {
  return <PublicQnAPage />;
}
