"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Eye, FileText, Plus, Save, Trash2 } from "lucide-react";
import { resumeSchema, type ResumeData } from "@mangystau/shared";
import { apiRequest, clearSession } from "@/lib/api";
import { usePreferences } from "@/components/app-preferences";
import { downloadResumePdf } from "@/lib/resume-pdf";

const empty: ResumeData = resumeSchema.parse({});
const fields = ["contacts", "about", "experience", "education", "skills"] as const;
const sectionIds = ["contact", "about", "experience", "education", "skills"] as const;
type TemplateId = "classic" | "sidebar" | "editorial" | "minimal";
type FocusedSection = "about" | "skills";
type ResumeTemplate = { id: TemplateId; nameKey: string; descriptionKey: string; accent: string };
const templates: ResumeTemplate[] = [
  { id: "classic", nameKey: "classicTemplate", descriptionKey: "classicInfo", accent: "#147d64" },
  { id: "sidebar", nameKey: "sidebarTemplate", descriptionKey: "sidebarInfo", accent: "#3159a5" },
  { id: "editorial", nameKey: "editorialTemplate", descriptionKey: "editorialInfo", accent: "#a84d32" },
  { id: "minimal", nameKey: "minimalTemplate", descriptionKey: "minimalInfo", accent: "#42474b" },
];

function isTemplateId(value: string | null): value is TemplateId {
  return templates.some((template) => template.id === value);
}

function parseLanguages(value: string) {
  return value.split(",").map((entry) => {
    const colonIndex = entry.indexOf(":");
    const dashIndex = entry.indexOf("—");
    const separatorIndex = colonIndex >= 0 ? colonIndex : dashIndex;
    if (separatorIndex < 0) return { name: entry.trim(), level: "" };
    return { name: entry.slice(0, separatorIndex).trim(), level: entry.slice(separatorIndex + 1).trim() };
  }).filter((language) => language.name || language.level);
}

export function ResumeEditor({initialSection=null}:{initialSection?:FocusedSection|null}={}) {
  const { t, locale } = usePreferences();
  const [data,setData] = useState<ResumeData>(empty); const [loaded,setLoaded] = useState(false); const [authenticated,setAuthenticated] = useState(false); const [saveError,setSaveError] = useState(""); const [pdfError,setPdfError] = useState(""); const [pdfSuccess,setPdfSuccess] = useState(""); const [saveRevision,setSaveRevision] = useState(0); const [tab,setTab] = useState<"edit"|"preview">("edit"); const [saved,setSaved] = useState(true); const [templateId,setTemplateId] = useState<TemplateId>("classic"); const [accent,setAccent] = useState(templates[0].accent); const [skillsText,setSkillsText] = useState(empty.skills.join(", ")); const [languagesText,setLanguagesText] = useState(""); const [openSections,setOpenSections] = useState<Set<string>>(()=>new Set(initialSection?[initialSection]:["contact","about"])); const [targetSection,setTargetSection] = useState<string|null>(initialSection);
  useEffect(()=>{
    let cancelled=false;
    async function loadResume(){
      let savedData=empty;
      let hasSession=false;
      try {
        const raw=localStorage.getItem("mangystau-resume");
        if(raw) savedData=resumeSchema.parse(JSON.parse(raw));
        const storedTemplate=localStorage.getItem("mangystau-resume-template");
        if(isTemplateId(storedTemplate)) setTemplateId(storedTemplate);
        const storedAccent=localStorage.getItem("mangystau-resume-accent");
        if(storedAccent) setAccent(storedAccent);
        hasSession=Boolean(localStorage.getItem("mangystau-access-token"));
      } catch {}
      if(!cancelled) setAuthenticated(hasSession);
      if(hasSession){
        try {
          const response=await apiRequest("/api/resumes/latest");
          if(response.status===401){clearSession();if(!cancelled)setAuthenticated(false);}
          else if(response.ok){
            let latest = null;
            if (response.status !== 204) {
              const text = await response.text();
              if (text) {
                try {
                  latest = JSON.parse(text);
                } catch {}
              }
            }
            if(latest){
              savedData=resumeSchema.parse(latest.data);
              if(isTemplateId(latest.templateId)) setTemplateId(latest.templateId);
              if(latest.theme&&typeof latest.theme.accent==="string"&&/^#[0-9a-fA-F]{6}$/.test(latest.theme.accent)) setAccent(latest.theme.accent);
            } else {
              // New user with no resume yet in DB
              let userName = "";
              try {
                const u = localStorage.getItem("mangystau-user");
                if (u) userName = JSON.parse(u).fullName || "";
              } catch {}
              savedData = { ...empty, fullName: userName };
            }
          }
        } catch {}
      }
      if(cancelled) return;
      setData(savedData);
      setSkillsText(savedData.skills.join(", "));
      setLanguagesText(savedData.languages.map((language)=>language.level?`${language.name}: ${language.level}`:language.name).join(", "));
      setLoaded(true);
    }
    void loadResume();
    return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{
    setTargetSection(initialSection);
    setOpenSections(new Set(initialSection?[initialSection]:["contact","about"]));
  },[initialSection]);
  useEffect(()=>{
    if(!loaded||!targetSection) return;
    setOpenSections(new Set([targetSection]));
    const frame=window.requestAnimationFrame(()=>document.getElementById(`resume-section-${targetSection}`)?.scrollIntoView({behavior:"smooth",block:"center"}));
    return ()=>window.cancelAnimationFrame(frame);
  },[loaded,targetSection]);
  useEffect(()=>{
    if(!loaded) return;
    let cancelled=false;
    setSaved(false);
    setSaveError("");
    const id=window.setTimeout(async()=>{
      try {
        try { localStorage.setItem("mangystau-resume",JSON.stringify(data)); localStorage.setItem("mangystau-resume-template",templateId); localStorage.setItem("mangystau-resume-accent",accent); } catch {}
        if(authenticated){
          const response=await apiRequest("/api/resumes/latest",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data,templateId,accent})});
          if(!response.ok) throw new Error("Не удалось сохранить резюме в профиле");
        }
        if(!cancelled) setSaved(true);
      } catch(error){if(!cancelled)setSaveError(error instanceof Error?error.message:"Ошибка сохранения");}
    },1000);
    return ()=>{window.clearTimeout(id);cancelled=true;};
  },[data,templateId,accent,loaded,authenticated,saveRevision]);
  const focusedEdit=targetSection==="about"||targetSection==="skills";
  const focusedTitle=t(targetSection==="about"?"about":"skills");
  const update = (key:keyof ResumeData,value:any)=>setData(d=>({...d,[key]:value}));
  const toggleSection = (section:string,isOpen:boolean)=>setOpenSections(current=>{const next=new Set(current);if(isOpen)next.add(section);else next.delete(section);return next;});
  const download = async()=>{setPdfError("");setPdfSuccess("");try{const output=await downloadResumePdf(data,templateId,accent,locale);if(output.size>0)setPdfSuccess(t("pdfDownloaded"));}catch(error){console.error("PDF export failed",error);setPdfError(t("pdfDownloadError"));}};
  return <>{!focusedEdit&&<div className="mb-6"><p className="text-sm font-semibold text-brand">{t("resumeEyebrow")}</p><h1 className="mt-1 text-3xl font-black">{t("resumeTitle")}</h1><p className="mt-2 text-slate-500">{t("resumeIntro")}</p></div>}{focusedEdit&&<div className="mx-auto mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-brand">{t("editingProfile")}</p><h1 className="mt-1 text-2xl font-black">{focusedTitle}</h1><p className="mt-1 text-sm text-slate-500">{t("changesSaveIntoResume")}</p></div><div className="flex items-center gap-3"><span className="text-sm text-slate-500">{saveError?<span role="alert" className="text-red-600">{saveError}</span>:saved?authenticated?t("savedProfile"):t("savedBrowser"):t("saving")}</span>{saveError&&<button onClick={()=>setSaveRevision((revision)=>revision+1)} className="text-sm font-semibold text-brand hover:underline">{t("saveRetry")}</button>}<Link href="/dashboard" aria-disabled={!saved} onClick={(event)=>{if(!saved)event.preventDefault();}} className={`rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white ${saved?"":"pointer-events-none opacity-50"}`}>{t("backToProfile")}</Link></div></div>}
    {!focusedEdit&&<section className="mb-5" aria-labelledby="resume-templates-title"><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-brand">{t("appearance")}</p><h2 id="resume-templates-title" className="mt-1 text-lg font-black">{t("chooseTemplate")}</h2></div><span className="text-sm text-slate-500">{t(templates.find((template)=>template.id===templateId)?.nameKey||"classicTemplate")}</span></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{templates.map((template)=><TemplateCard key={template.id} template={template} selected={template.id===templateId} onSelect={()=>{setTemplateId(template.id);setAccent(template.accent);}}/>)}</div></section>}
    {!focusedEdit&&<div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-3 shadow-sm"><label className="flex items-center gap-2 text-sm font-semibold">{t("accentColor")} <input aria-label={t("accentColor")} type="color" value={accent} onChange={e=>setAccent(e.target.value)} className="h-9 w-10 cursor-pointer rounded border-0"/></label><div className="flex items-center gap-3 text-sm text-slate-500">{saveError?<span role="alert" className="text-red-600">{saveError}</span>:saved?<><Save size={16}/>{authenticated?t("savedProfile"):t("savedBrowser")}</>:t("saving")}{pdfError&&<span role="alert" className="text-red-600">{pdfError}</span>}<button onClick={download} className="flex h-10 items-center gap-2 rounded-xl bg-ink px-4 font-semibold text-white"><Download size={16}/>{t("downloadPdf")}</button></div></div>}
    {!focusedEdit&&pdfSuccess&&<p role="status" className="mb-3 text-sm font-semibold text-emerald-700">{pdfSuccess}</p>}
    {!focusedEdit&&<div className="mb-3 grid grid-cols-2 rounded-xl bg-slate-200 p-1 md:hidden"><button onClick={()=>setTab("edit")} className={`rounded-lg p-2 text-sm font-semibold ${tab==="edit"?"bg-white shadow":""}`}>{t("editTab")}</button><button onClick={()=>setTab("preview")} className={`rounded-lg p-2 text-sm font-semibold ${tab==="preview"?"bg-white shadow":""}`}><Eye className="mr-1 inline" size={15}/>{t("previewTab")}</button></div>}
    <div className={focusedEdit?"mx-auto max-w-3xl":"grid gap-5 md:grid-cols-[minmax(340px,.85fr)_minmax(0,1.15fr)]"}><section className={focusedEdit?"space-y-4":`${tab==="preview"?"hidden":""} space-y-4 md:block`}>{fields.map((titleKey,index)=>{const title=t(titleKey);const section=sectionIds[index];if(focusedEdit&&section!==targetSection)return null;const sectionContent=<div className={`space-y-3 p-5 ${focusedEdit?"":"border-t"}`}>
      {index===0&&<><Input label={t("fullName")} value={data.fullName} onChange={v=>update("fullName",v)}/><Input label={t("targetPosition")} value={data.headline} onChange={v=>update("headline",v)}/><div className="grid grid-cols-2 gap-3"><Input label={t("city")} value={data.city} onChange={v=>update("city",v)}/><Input label={t("phone")} value={data.phone} onChange={v=>update("phone",v)}/></div><Input label={t("email")} value={data.email} onChange={v=>update("email",v)}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.readyForRotation} onChange={e=>update("readyForRotation",e.target.checked)}/>{t("readyShift")}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.readyToRelocate} onChange={e=>update("readyToRelocate",e.target.checked)}/>{t("readyMove")}</label></>}
      {index===1&&<textarea className="min-h-32 w-full rounded-xl border p-3 outline-none focus:border-brand" placeholder={t("aboutPlaceholder")} value={data.about} onChange={e=>update("about",e.target.value)}/>}
      {index===2&&<><Input label={t("jobTitle")} value={data.experience[0]?.position||""} onChange={v=>update("experience",[{...(data.experience[0]||{company:"",position:"",description:"",startDate:"",endDate:"",current:false}),position:v}])}/><Input label={t("company")} value={data.experience[0]?.company||""} onChange={v=>update("experience",[{...(data.experience[0]||{company:"",position:"",description:"",startDate:"",endDate:"",current:false}),company:v}])}/><textarea className="min-h-24 w-full rounded-xl border p-3" placeholder={t("duties")} value={data.experience[0]?.description||""} onChange={e=>update("experience",[{...(data.experience[0]||{company:"",position:"",description:"",startDate:"",endDate:"",current:false}),description:e.target.value}])}/><button className="flex items-center gap-2 text-sm font-semibold text-brand"><Plus size={16}/>{t("addExperience")}</button></>}
      {index===3&&<><Input label={t("institution")} value={data.education[0]?.institution||""} onChange={v=>update("education",[{...(data.education[0]||{institution:"",degree:"",description:"",startDate:"",endDate:"",current:false}),institution:v}])}/><Input label={t("specialty")} value={data.education[0]?.degree||""} onChange={v=>update("education",[{...(data.education[0]||{institution:"",degree:"",description:"",startDate:"",endDate:"",current:false}),degree:v}])}/></>}
      {index===4&&<><Input label={t("skillsComma")} value={skillsText} onChange={v=>{setSkillsText(v);update("skills",v.split(",").map(x=>x.trim()).filter(Boolean));}}/>{!focusedEdit&&<Input label={t("languageExample")} value={languagesText} onChange={v=>{setLanguagesText(v);update("languages",parseLanguages(v));}}/>}</>}
    </div>;return focusedEdit?<section id={`resume-section-${section}`} key={title} className="rounded-2xl border bg-white shadow-sm"><h2 className="p-5 text-lg font-bold">{title}</h2>{sectionContent}</section>:<details id={`resume-section-${section}`} key={title} open={openSections.has(section)} onToggle={(event)=>toggleSection(section,event.currentTarget.open)} className="group rounded-2xl border bg-white shadow-sm"><summary className="cursor-pointer list-none p-5 font-bold marker:hidden">{title}<span className="float-right text-slate-400">⌄</span></summary>{sectionContent}</details>;})}</section>
    {!focusedEdit&&<section className={`${tab==="edit"?"hidden":""} overflow-auto rounded-2xl bg-[#e9ecea] p-4 md:block md:p-6`}><div className="mx-auto w-full max-w-[794px] overflow-hidden rounded shadow-xl"><ResumePreview data={data} templateId={templateId} accent={accent}/></div></section>}</div>{!focusedEdit&&<p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><FileText size={14}/>{authenticated?"Резюме сохраняется в профиле и доступно при следующем входе.":"Черновик сохраняется в этом браузере. Создайте аккаунт, чтобы хранить резюме в профиле."}</p>}</>;
}
function TemplateCard({template,selected,onSelect}:{template:ResumeTemplate,selected:boolean,onSelect:()=>void}){const {t}=usePreferences();return <button type="button" aria-pressed={selected} onClick={onSelect} className={`rounded-xl border p-2 text-left transition-colors ${selected?"border-brand bg-emerald-50 ring-1 ring-brand":"border-slate-200 bg-white hover:border-slate-400"}`}><div aria-hidden="true" className="mb-2 h-[88px] overflow-hidden rounded-md border bg-white p-2"><TemplateThumbnail template={template}/></div><span className="block text-sm font-bold">{t(template.nameKey)}</span><span className="mt-0.5 block text-xs text-slate-500">{t(template.descriptionKey)}</span></button>}
function TemplateThumbnail({template}:{template:ResumeTemplate}){return <div className={`flex h-full overflow-hidden ${template.id==="sidebar"?"gap-1":"flex-col"}`}>
  {template.id==="sidebar"?<><div className="w-[30%] space-y-1 p-1" style={{backgroundColor:template.accent}}><div className="h-2 w-4/5 rounded bg-white/80"/><div className="h-1 w-full rounded bg-white/50"/><div className="mt-2 h-1 w-3/4 rounded bg-white/50"/></div><div className="flex-1 space-y-2 p-1.5"><div className="h-2 w-2/3 rounded" style={{backgroundColor:template.accent}}/><div className="h-1 w-full rounded bg-slate-200"/><div className="h-1 w-4/5 rounded bg-slate-200"/><div className="mt-2 h-1 w-1/2 rounded bg-slate-300"/></div></>:<><div className={`${template.id==="editorial"?"mx-auto w-2/3 text-center":"w-3/4"} space-y-1 border-b pb-2`} style={{borderColor:template.accent}}><div className={`h-2 w-2/3 rounded ${template.id==="editorial"?"mx-auto":""}`} style={{backgroundColor:template.accent}}/><div className={`h-1 w-full rounded ${template.id==="minimal"?"bg-slate-300":"bg-slate-200"}`}/></div><div className="mt-2 space-y-1.5"><div className="h-1 w-full rounded bg-slate-200"/><div className="h-1 w-5/6 rounded bg-slate-200"/><div className="h-1 w-2/3 rounded bg-slate-200"/></div></>}
</div>}
function ResumePreview({data,templateId,accent}:{data:ResumeData,templateId:TemplateId,accent:string}){
  const {t,locale}=usePreferences();
  const contact=[data.city,data.phone,data.email].filter(Boolean);
  const availability=[data.readyForRotation&&t("workStatus"),data.readyToRelocate&&t("moveStatus")].filter(Boolean).join(" · ");
  if(templateId==="sidebar") return <article className="a4-page grid min-h-[900px] grid-cols-[30%_1fr] bg-white"><aside className="p-8" style={{backgroundColor:accent,color:readableTextColor(accent)}}><h2 className="break-words text-2xl font-black">{data.fullName||t("resumeName")}</h2><p className="mt-2 text-sm font-semibold opacity-80">{data.headline||t("desiredPosition")}</p><div className="mt-8 space-y-2 text-xs">{(contact.length?contact:[t("contactsPlaceholder")]).map((item)=><p key={item} className="break-words">{item}</p>)}</div>{availability&&<p className="mt-5 text-xs font-semibold">{availability}</p>}{data.skills.length>0&&<section className="mt-8"><h3 className="mb-2 text-xs font-black uppercase tracking-wide">{t("skills")}</h3><p className="text-xs leading-5">{data.skills.join(" · ")}</p></section>}{data.languages.length>0&&<section className="mt-6"><h3 className="mb-2 text-xs font-black uppercase tracking-wide">{t("languageLabel")}</h3><p className="text-xs leading-5">{data.languages.map((language)=>`${language.name} ${language.level}`).join(" · ")}</p></section>}</aside><main className="p-9"><ResumeSections data={data} accent={accent} includeSidebarDetails={false}/><div className="mt-16 border-t pt-4 text-xs text-slate-400">{t("resumeFooter")}</div></main></article>;
  const editorial=templateId==="editorial";
  return <article className={`a4-page min-h-[900px] bg-white p-10 sm:p-14 ${editorial?"font-serif":""}`} style={{borderTop:templateId==="classic"?`10px solid ${accent}`:undefined,borderLeft:templateId==="minimal"?`5px solid ${accent}`:undefined}}><header className={`${editorial?"pb-8 text-center":"border-b pb-7"}`} style={editorial?{borderBottom:`1px solid ${accent}`}:{}}><h2 className={`${editorial?"text-4xl":"text-3xl"} font-black`} style={{color:accent}}>{data.fullName||t("resumeName")}</h2><p className="mt-2 text-lg font-semibold">{data.headline||t("desiredPosition")}</p><p className="mt-3 text-sm text-slate-500">{contact.join(" · ")||t("contactsPlaceholder")}</p>{availability&&<p className="mt-2 text-xs font-semibold" style={{color:accent}}>{availability}</p>}</header><ResumeSections data={data} accent={accent}/><div className="mt-16 border-t pt-4 text-xs text-slate-400">{t("resumeFooter")}</div></article>;
}
function ResumeSections({data,accent,includeSidebarDetails=true}:{data:ResumeData,accent:string,includeSidebarDetails?:boolean}){
  const {t,locale}=usePreferences();
  const experience=data.experience.filter((item)=>item.position||item.company||item.description);
  const education=data.education.filter((item)=>item.institution||item.degree||item.description);
  const upper=(key:string)=>t(key).toLocaleUpperCase(locale==="kk"?"kk-KZ":"ru-RU");
  return <>
  {data.about&&<Block title={upper("about")} accent={accent}>{data.about}</Block>}
  {experience.length>0&&<section className="mt-8"><h3 className="mb-3 border-b pb-2 text-xs font-black tracking-[.16em]" style={{color:accent}}>{upper("experience")}</h3>{experience.map((item,index)=><div key={`experience-${index}`} className={index>0?"mt-5":""}><strong>{item.position}</strong><p>{item.company}</p><p className="mt-1 text-xs text-slate-500">{[item.startDate,item.current?t("pdfCurrent"):item.endDate].filter(Boolean).join(" — ")}</p><p className="mt-2 text-sm text-slate-600">{item.description}</p></div>)}</section>}
  {education.length>0&&<section className="mt-8"><h3 className="mb-3 border-b pb-2 text-xs font-black tracking-[.16em]" style={{color:accent}}>{upper("education")}</h3>{education.map((item,index)=><div key={`education-${index}`} className={index>0?"mt-5":""}><strong>{item.institution}</strong><p>{item.degree}</p><p className="mt-1 text-xs text-slate-500">{[item.startDate,item.current?t("pdfCurrent"):item.endDate].filter(Boolean).join(" — ")}</p>{item.description&&<p className="mt-2 text-sm text-slate-600">{item.description}</p>}</div>)}</section>}
  {includeSidebarDetails&&data.skills.length>0&&<Block title={upper("skills")} accent={accent}>{data.skills.join(" · ")}</Block>}
  {includeSidebarDetails&&data.languages.length>0&&<Block title={upper("languageLabel")} accent={accent}>{data.languages.map((language)=>`${language.name} ${language.level}`).join(" · ")}</Block>}
</>}
function readableTextColor(hex:string){const value=hex.replace("#","");if(value.length!==6)return "#ffffff";const channels=[0,2,4].map((offset)=>parseInt(value.slice(offset,offset+2),16)/255).map((channel)=>channel<=0.03928?channel/12.92:((channel+0.055)/1.055)**2.4);return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2]>0.42?"#182b25":"#ffffff"}
function Input({label,value,onChange}:{label:string,value:string,onChange:(v:string)=>void}){return <label className="block text-sm font-semibold">{label}<input value={value} onChange={e=>onChange(e.target.value)} className="mt-1.5 block min-h-11 w-full rounded-xl border px-3 font-normal outline-none focus:border-brand"/></label>}
function Block({title,accent,children}:{title:string,accent:string,children:React.ReactNode}){return <section className="mt-8"><h3 className="mb-3 border-b pb-2 text-xs font-black tracking-[.16em]" style={{color:accent}}>{title}</h3><div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{children}</div></section>}
