import { Suspense } from "react";
import JobsListing from "@/components/jobs-listing";

export default function JobsPage() {
  return <Suspense fallback={<main className="mx-auto min-h-screen max-w-7xl px-5 py-10" aria-busy="true"/>}><JobsListing/></Suspense>;
}
