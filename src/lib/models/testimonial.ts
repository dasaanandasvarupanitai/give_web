import { Timestamp } from "firebase/firestore";

export interface Testimonial {
  id: string;
  name: string;
  designation: string;
  address: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestimonialFirestore {
  name: string;
  designation: string;
  address: string;
  description: string;
  imageUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function testimonialFromFirestore(
  id: string,
  data: TestimonialFirestore
): Testimonial {
  return {
    id,
    name: data.name ?? "",
    designation: data.designation ?? "",
    address: data.address ?? "",
    description: data.description ?? "",
    imageUrl: data.imageUrl ?? "",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

export function testimonialToFirestore(
  testimonial: Testimonial
): TestimonialFirestore {
  return {
    name: testimonial.name,
    designation: testimonial.designation,
    address: testimonial.address,
    description: testimonial.description,
    imageUrl: testimonial.imageUrl,
    createdAt: Timestamp.fromDate(testimonial.createdAt),
    updatedAt: Timestamp.fromDate(testimonial.updatedAt),
  };
}

