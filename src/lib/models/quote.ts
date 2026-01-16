import { Timestamp } from "firebase/firestore";

export interface Quote {
  id: string;
  quote: string;
  author: string;
  date?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteFirestore {
  quote: string;
  author: string;
  date?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function quoteFromFirestore(
  id: string,
  data: QuoteFirestore
): Quote {
  return {
    id,
    quote: data.quote ?? "",
    author: data.author ?? "",
    date: data.date,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

export function quoteToFirestore(
  quote: Quote
): QuoteFirestore {
  const data: QuoteFirestore = {
    quote: quote.quote,
    author: quote.author,
    createdAt: Timestamp.fromDate(quote.createdAt),
    updatedAt: Timestamp.fromDate(quote.updatedAt),
  };
  
  if (quote.date !== undefined) {
    data.date = quote.date;
  }
  
  return data;
}

