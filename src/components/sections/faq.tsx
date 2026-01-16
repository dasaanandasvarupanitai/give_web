import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
  {
    question: "Who can enroll in the courses?",
    answer: "Our courses are open to everyone, regardless of background or prior knowledge. We have introductory courses for beginners and advanced studies for those with more experience."
  },
  {
    question: "Are the classes live or pre-recorded?",
    answer: "We offer a mix of both. Many of our courses include live, interactive sessions with instructors, as well as pre-recorded lectures that you can watch at your own pace."
  },
  {
    question: "What is the medium of instruction?",
    answer: "Most of our courses are conducted in English. However, we are expanding our offerings in other languages. Please check the specific course details for more information."
  },
  {
    question: "Is there any certification upon completion?",
    answer: "Yes, upon successful completion of our structured courses, students receive a certificate from the Gaura-vāṇī Institute for Vaiṣṇava Education."
  },
  {
    question: "How do I register for a course?",
    answer: "You can register directly through our website. Simply navigate to the course you are interested in and click the 'Register' button to follow the enrollment process."
  }
];

export function Faq() {
  return (
    <section
      id="faq"
      className="relative py-16 md:py-24 bg-gradient-to-b from-muted/95 via-muted to-background border-t border-border/40 overflow-hidden"
    >
      <div className="relative container max-w-screen-lg">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Find quick answers to common questions about our institute and courses.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index + 1}`}>
              <AccordionTrigger className="text-left font-headline text-lg hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
