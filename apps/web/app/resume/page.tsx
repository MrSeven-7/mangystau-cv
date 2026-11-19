import { ResumeEditor } from "@/components/resume-editor";
type FocusedSection = "about" | "skills";
export default function ResumePage({ searchParams }: { searchParams: { section?: string } }) {
	const initialSection: FocusedSection | null = searchParams.section === "about" || searchParams.section === "skills" ? searchParams.section : null;
	return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-4 py-7 md:px-8"><ResumeEditor initialSection={initialSection}/></main>;
}
