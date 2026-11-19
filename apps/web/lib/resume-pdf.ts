import type { Content, TDocumentDefinitions, TVirtualFileSystem } from "pdfmake/interfaces";
import type { ResumeData } from "@mangystau/shared";
import type { Locale } from "@/components/app-preferences";

type TemplateId = "classic" | "sidebar" | "editorial" | "minimal";

const labels = {
  ru: {
    resume: "РЕЗЮМЕ", about: "О СЕБЕ", experience: "ОПЫТ РАБОТЫ", education: "ОБРАЗОВАНИЕ", skills: "НАВЫКИ", languages: "ЯЗЫКИ",
    position: "Желаемая должность", contacts: "Город · Телефон · Email", rotation: "Готов(а) к вахте", relocation: "Готов(а) к переезду", current: "по настоящее время", noName: "Ваше имя",
  },
  kk: {
    resume: "ТҮЙІНДЕМЕ", about: "ӨЗІМ ТУРАЛЫ", experience: "ЖҰМЫС ТӘЖІРИБЕСІ", education: "БІЛІМІ", skills: "ДАҒДЫЛАР", languages: "ТІЛДЕР",
    position: "Қалаған лауазым", contacts: "Қала · Телефон · Email", rotation: "Вахтаға дайын", relocation: "Көшуге дайын", current: "қазіргі уақытқа дейін", noName: "Атыңыз",
  },
};

function section(title: string, lines: Content[]): Content[] {
  if (lines.length === 0) return [];
  return [{ text: title, style: "sectionTitle", margin: [0, 14, 0, 6] }, ...lines];
}

export async function downloadResumePdf(data: ResumeData, templateId: TemplateId, accent: string, locale: Locale) {
  const pdfMake = await import("pdfmake/build/pdfmake");
  const pdfApi = { ...pdfMake };
  const fontModule = await import("pdfmake/build/vfs_fonts");
  const fontFiles = ((fontModule as unknown as { default?: TVirtualFileSystem }).default ?? fontModule) as TVirtualFileSystem;
  pdfApi.addVirtualFileSystem(fontFiles);
  pdfApi.addFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  });

  const text = labels[locale];
  const contact = [data.city, data.phone, data.email].filter(Boolean).join(" · ") || text.contacts;
  const experience: Content[] = [];
  for (const item of data.experience.filter((entry) => entry.position || entry.company || entry.description)) {
    if (item.position) experience.push({ text: item.position, bold: true, margin: [0, 4, 0, 1] });
    if (item.company) experience.push({ text: item.company });
    const dates = [item.startDate, item.current ? text.current : item.endDate].filter(Boolean).join(" — ");
    if (dates) experience.push({ text: dates, style: "muted" });
    if (item.description) experience.push({ text: item.description, style: "body" });
  }
  const education: Content[] = [];
  for (const item of data.education.filter((entry) => entry.institution || entry.degree || entry.description)) {
    if (item.institution) education.push({ text: item.institution, bold: true, margin: [0, 4, 0, 1] });
    if (item.degree) education.push({ text: item.degree });
    const dates = [item.startDate, item.current ? text.current : item.endDate].filter(Boolean).join(" — ");
    if (dates) education.push({ text: dates, style: "muted" });
    if (item.description) education.push({ text: item.description, style: "body" });
  }

  const mainContent: Content[] = [];
  if (data.about) mainContent.push(...section(text.about, [{ text: data.about, style: "body" }]));
  mainContent.push(...section(text.experience, experience));
  mainContent.push(...section(text.education, education));
  if (templateId !== "sidebar") {
    mainContent.push(...section(text.skills, data.skills.length ? [{ text: data.skills.join(" · "), style: "body" }] : []));
    mainContent.push(...section(text.languages, data.languages.length ? [{ text: data.languages.map((item) => [item.name, item.level].filter(Boolean).join(" — ")).join(" · "), style: "body" }] : []));
  }

  const header: Content[] = [
    { text: data.fullName || text.noName, style: "name", alignment: templateId === "editorial" ? "center" : "left" },
    { text: data.headline || text.position, style: "headline", alignment: templateId === "editorial" ? "center" : "left" },
    { text: contact, style: "muted", alignment: templateId === "editorial" ? "center" : "left" },
  ];
  if (data.readyForRotation || data.readyToRelocate) {
    header.push({ text: [data.readyForRotation && text.rotation, data.readyToRelocate && text.relocation].filter(Boolean).join(" · "), style: "accentLine", alignment: templateId === "editorial" ? "center" : "left" });
  }

  let content: Content[];
  if (templateId === "sidebar") {
    const sidebar: Content[] = [
      { text: data.fullName || text.noName, style: "sideName" },
      { text: data.headline || text.position, style: "sideHeadline" },
      { text: contact, style: "sideText", margin: [0, 14, 0, 4] },
      ...(data.readyForRotation || data.readyToRelocate ? [{ text: [data.readyForRotation && text.rotation, data.readyToRelocate && text.relocation].filter(Boolean).join(" · "), style: "sideText", margin: [0, 6, 0, 0] } as Content] : []),
      ...(data.skills.length ? [{ text: text.skills, style: "sideHeading", margin: [0, 18, 0, 5] } as Content, { text: data.skills.join(" · "), style: "sideText" } as Content] : []),
      ...(data.languages.length ? [{ text: text.languages, style: "sideHeading", margin: [0, 16, 0, 5] } as Content, { text: data.languages.map((item) => [item.name, item.level].filter(Boolean).join(" — ")).join(" · "), style: "sideText" } as Content] : []),
    ];
    content = [{ table: { widths: [155, "*"], body: [[{ stack: sidebar, fillColor: accent, color: "#ffffff", margin: [18, 24, 18, 24] }, { stack: [...section(text.resume, header.slice(0, 0)), ...header.slice(0), ...mainContent], margin: [28, 28, 24, 28] }]] }, layout: "noBorders" }];
  } else {
    content = [...header];
    if (templateId === "classic") content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 3, lineColor: accent }], margin: [0, 10, 0, 4] });
    if (templateId === "minimal") content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 44, y2: 0, lineWidth: 3, lineColor: accent }], margin: [0, 12, 0, 2] });
    content.push(...mainContent);
  }

  const definition: TDocumentDefinitions = {
    content,
    pageSize: "A4",
    pageMargins: templateId === "sidebar" ? [0, 0, 0, 0] : [48, 44, 48, 46],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#23352f", lineHeight: 1.25 },
    styles: {
      name: { fontSize: templateId === "editorial" ? 27 : 24, bold: true, color: accent, margin: [0, 0, 0, 4] },
      headline: { fontSize: 13, bold: true, margin: [0, 0, 0, 5] },
      sectionTitle: { fontSize: 10, bold: true, color: accent, characterSpacing: 1.2 },
      body: { fontSize: 10, lineHeight: 1.35 },
      muted: { fontSize: 9, color: "#687a73", margin: [0, 3, 0, 3] },
      accentLine: { fontSize: 9, color: accent, margin: [0, 4, 0, 4] },
      sideName: { fontSize: 17, bold: true, color: "#ffffff" },
      sideHeadline: { fontSize: 10, color: "#ffffff", margin: [0, 5, 0, 0] },
      sideHeading: { fontSize: 9, bold: true, color: "#ffffff", characterSpacing: 0.6 },
      sideText: { fontSize: 8.5, color: "#ffffff", lineHeight: 1.3 },
    },
  };

  const filename = `mangystau-resume-${locale}.pdf`;
  const blob = await pdfApi.createPdf(definition).getBlob();
  if (blob.size === 0) throw new Error("Empty PDF output");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { filename, size: blob.size };
}