import { useState, useRef, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings, Upload, ChevronDown, Send, Check, Pencil,
  FileDown, Printer, Clock, Zap, Plus, X, ArrowLeft,
  Sun, Moon, FileText, BookOpen, User,
} from "lucide-react";
import undesignPng from "@/imports/Untitled_design-1.png";
import cowHead1Png from "@/imports/cow_head-1.PNG";
import baoPng from "@/imports/UserSignIn/3ad67dde473c9389281e28bf3bc5900a4fa1dd13.png";
import homeIconPng from "@/imports/home.png";
import translateIconPng from "@/imports/translate.png";
import filesIconPng from "@/imports/files.png";

/* ─────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────── */
type View = "login" | "home" | "translator" | "assistant" | "library";
type Lang = "en" | "tl";
type TransMode = "translate" | "proofread";

interface DraftFile {
  id: string; name: string; category: string;
  grade: string; subtitle: string; date: string;
}
interface ChatMsg { id: string; type: "user" | "bot"; content: string | React.ReactNode }

/* ─────────────────────────────────────────────────────
   Translations
───────────────────────────────────────────────────── */
const T = {
  en: {
    tagline: "AI-Powered Tool for Translating\nLearning Materials into Local Dialect",
    register: "Register", login: "Login",
    emailPh: "Email", passPh: "Password", namePh: "Full Name", back: "← Back",
    subtitle: "AI-Powered Translator for your learning materials",
    greeting: (n: string) => `Hello, ${n}!`, tools: "Tools",
    transTitle: "Translator", transDesc: "Convert raw English/Tagalog lessons into localized, context-aware teaching materials.", transCta: "Start Translating",
    libTitle: "My Library", libDesc: "Access, manage, and download your previously translated localized learning materials.", libCta: "Open My Library",
    aiTitle: "AI Assistant", aiDesc: "Collaborate with AI to generate custom lesson plans, interactive activities, or worksheets.", aiCta: "Chat with AI",
    inputMat: "Input Material", inputIn: "INPUT IN", english: "EN", tagalog: "TL",
    dropLesson: "Drop your learning material here", dropSub: "DOCX  PDF", orTxt: "OR", pasteTxt: "Paste your lesson text instead",
    translatedMat: "Translated Learning Material", waitingIdeas: "Waiting for your ideas...", uploadStart: "Upload a lesson to start translating!",
    exportLbl: "EXPORT", readyPrint: "Ready to Print", proofread: "Proofread",
    ctxParams: "Context Parameters", gradeLevel: "Grade Level", subjectArea: "Subject Area", targetDialect: "Target Dialect",
    proofTitle: "Proofreading Mode: Mathematics Module 1 (Grade 4)",
    saveDraft: "Save Draft", applyAll: "Accept & Print",
    selFile: "Selected File", changeFile: "Change File", selFromLib: "Select from Library", noFiles: "No files yet.",
    quickActs: "Quick Actions", lpLabel: "Lesson Plan", actLabel: "Activity", sumLabel: "Summarize", moreLabel: "More",
    outPrefs: "Output Preferences", outLang: "Output Language", duration: "Duration", learnStyle: "Learning Style",
    typeMsg: "Type your message to Bao...", myLib: "My Library",
    complete: "COMPLETE", processing: "PROCESSING", needsReview: "NEEDS REVIEW", error: "ERROR", schedule: "SCHEDULE", draft: "DRAFT",
    view: "VIEW", track: "TRACK", review: "REVIEW", retry: "RETRY", edit: "EDIT",
    printPreview: "Print Preview", printReadyDesc: "Your translated lesson is formatted and ready for printing.",
    printNow: "Print Now", close: "Close", fileSize: "1.2 MB · 12 pages",
    fileDesc: "This document contains lesson content regarding plant biology adapted for local dialects.",
    pasteTitle: "Paste Your Lesson Text", pasteHint: "Paste your content here...", pasteConfirm: "Use This Text", download: "Download",
  },
  tl: {
    tagline: "AI na Kasangkapan para sa Pagsasalin\nng Mga Kagamitang Panturo sa Lokal na Wika",
    register: "Magrehistro", login: "Mag-login",
    emailPh: "Email", passPh: "Password", namePh: "Buong Pangalan", back: "← Bumalik",
    subtitle: "Tagasalin ng Mga Kagamitang Panturo gamit ang AI",
    greeting: (n: string) => `Kamusta, ${n}!`, tools: "Mga Kasangkapan",
    transTitle: "Tagasalin", transDesc: "I-convert ang mga leksyon sa Ingles/Filipino sa lokal na kagamitang panturo.", transCta: "Magsimulang Magsalin",
    libTitle: "Aking Aklatan", libDesc: "I-access, pamahalaan, at i-download ang iyong mga naisalin na kagamitang panturo.", libCta: "Buksan ang Aklatan",
    aiTitle: "AI na Katulong", aiDesc: "Makipagtulungan sa AI para gumawa ng mga plano ng aralin, aktibidad, o worksheet.", aiCta: "Makipag-chat sa AI",
    inputMat: "Input na Materyal", inputIn: "INPUT SA", english: "EN", tagalog: "TL",
    dropLesson: "I-drop ang iyong materyal dito", dropSub: "DOCX  PDF", orTxt: "O", pasteTxt: "I-paste ang teksto ng aralin",
    translatedMat: "Isinalin na Kagamitang Panturo", waitingIdeas: "Naghihintay sa iyong mga ideya...", uploadStart: "Mag-upload ng aralin para magsimula!",
    exportLbl: "I-EXPORT", readyPrint: "Handa sa Pag-print", proofread: "Suriin",
    ctxParams: "Mga Parametro ng Konteksto", gradeLevel: "Antas", subjectArea: "Asignatura", targetDialect: "Target na Diyalekto",
    proofTitle: "Mode ng Pagwawasto: Matematika Modyul 1 (Grade 4)",
    saveDraft: "I-save ang Draft", applyAll: "Tanggapin at I-print",
    selFile: "Napiling File", changeFile: "Palitan", selFromLib: "Pumili mula sa Aklatan", noFiles: "Wala pang mga file.",
    quickActs: "Mabilis na Aksyon", lpLabel: "Plano ng Aralin", actLabel: "Aktibidad", sumLabel: "Buodin", moreLabel: "Dagdag",
    outPrefs: "Mga Kagustuhan sa Output", outLang: "Wika ng Output", duration: "Tagal", learnStyle: "Istilo ng Pagkatuto",
    typeMsg: "I-type ang iyong mensahe kay Bao...", myLib: "Aking Aklatan",
    complete: "KUMPLETO", processing: "PINOPROSESO", needsReview: "KAILANGAN NG PAGSUSURI", error: "ERROR", schedule: "ISKEDYUL", draft: "DRAFT",
    view: "TINGNAN", track: "SUBAYBAYAN", review: "SURIIN", retry: "SUBUKAN ULIT", edit: "I-EDIT",
    printPreview: "Preview ng Print", printReadyDesc: "Handa na ang iyong isinalin na aralin para i-print.",
    printNow: "I-print Ngayon", close: "Isara", fileSize: "1.2 MB · 12 pahina",
    fileDesc: "Naglalaman ito ng nilalaman ng aralin tungkol sa halaman na inangkop para sa lokal na mga diyalekto.",
    pasteTitle: "I-paste ang Iyong Teksto", pasteHint: "I-paste ang nilalaman dito...", pasteConfirm: "Gamitin Ito", download: "I-download",
  },
};

const BASE_CARDS = [
  { id:"1", category:"MATHEMATICS", catColor:"#2ec2fd", title:"Module 1 (Grade 4)",       subtitle:"Cultural Heritage (English to Ilocano)",        status:"complete"   as const, name:"Mathematics Module 1",  date:"Created on 06/24/26" },
  { id:"2", category:"SCIENCE",     catColor:"#bf8ffd", title:"Unit 2 (Grade 5)",          subtitle:"Photosynthesis (English to Cebuano)",            status:"processing" as const, name:"Science Unit 2",        date:"Created on 06/13/26" },
  { id:"3", category:"SOCIAL STUDIES",catColor:"#fe8bd0",title:"ch. 3 (Grade 6)",         subtitle:"Cultural Heritage (English to Hiligaynon)",      status:"review"     as const, name:"Social Studies ch. 3",  date:"Created on 06/24/26" },
  { id:"4", category:"ENGLISH",     catColor:"#2ec2fd", title:"Reading Comp. (Grade 3)",   subtitle:"The Story of Maria (English to Pangasinense)",  status:"complete"   as const, name:"English Reading",       date:"Created on 06/24/26" },
  { id:"5", category:"FILIPINO",    catColor:"#bf8ffd", title:"Filipino Wika (Grade 5)",   subtitle:"Pagbasa at Pagsunaw (Filipino to Bicolano)",     status:"processing" as const, name:"Filipino Wika",         date:"Created on 06/24/26" },
  { id:"6", category:"HISTORY",     catColor:"#fe8bd0", title:"History Overview (Grade 6)", subtitle:"Pre-Colonial Era (English to Waray)",           status:"error"      as const, name:"History Overview",      date:"Created on 06/24/26" },
];

/* ─────────────────────────────────────────────────────
   Interactive Pupil — linear cursor-following, no bounce
   Size is computed from the container (10% of its width).
   Pupil always moves to full max offset in cursor direction.
───────────────────────────────────────────────────── */
function InteractivePupil({
  mouseX, mouseY, containerRef, eyePctX, eyePctY,
}: {
  mouseX: number; mouseY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  eyePctX: number; eyePctY: number;
}) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(32);

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    /* Pupil size = 10% of container width, min 28px */
    const s = Math.max(28, rect.width * 0.10);
    setSize(s);

    const eyeX = rect.left + eyePctX * rect.width;
    const eyeY = rect.top + eyePctY * rect.height;
    const dx = mouseX - eyeX;
    const dy = mouseY - eyeY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }

    /* Always move to full max offset in cursor direction — no capping by distance */
    const maxOffset = s * 0.38;
    const angle = Math.atan2(dy, dx);
    setPupilOffset({
      x: Math.cos(angle) * maxOffset,
      y: Math.sin(angle) * maxOffset,
    });
  }, [mouseX, mouseY, containerRef, eyePctX, eyePctY]);

  return (
    /* type:"tween" + linear ease = direct tracking, zero bounce */
    <motion.div
      animate={{ x: pupilOffset.x, y: pupilOffset.y }}
      transition={{ type: "tween", duration: 0.04, ease: "linear" }}
      style={{ width: size, height: size, borderRadius: "50%", background: "#12100a", position: "relative" }}
    >
      {/* Primary reflection spot */}
      <div style={{
        position: "absolute", borderRadius: "50%", background: "rgba(255,255,255,0.88)",
        width: "30%", height: "30%", top: "10%", left: "12%",
      }} />
      {/* Secondary soft glint */}
      <div style={{
        position: "absolute", borderRadius: "50%", background: "rgba(255,255,255,0.28)",
        width: "16%", height: "16%", bottom: "14%", right: "16%",
      }} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Hills SVG with grass tufts
───────────────────────────────────────────────────── */
function GreenHills() {
  return (
    <svg viewBox="0 0 1000 130" preserveAspectRatio="none" className="w-full h-full" fill="none">
      <path d="M0,60 C80,22 200,88 340,45 C480,2 600,80 740,40 C860,8 940,65 1000,42 L1000,130 L0,130 Z" fill="#a8e15e"/>
      <path d="M0,88 C130,58 270,108 410,78 C550,48 690,95 830,72 C910,60 965,82 1000,74 L1000,130 L0,130 Z" fill="#8ed650" opacity="0.6"/>
      {[70,180,310,430,540,660,780,880].map((cx,i)=>(
        <g key={i} transform={`translate(${cx},${[55,58,50,63,45,57,52,59][i]})`}>
          <ellipse cx="0" cy="-6" rx="14" ry="9" fill="#70CA97" opacity="0.82"/>
          <ellipse cx="-9" cy="-4" rx="10" ry="7" fill="#5ab868" opacity="0.72"/>
          <ellipse cx="10" cy="-5" rx="9" ry="6" fill="#70CA97" opacity="0.78"/>
        </g>
      ))}
      {[120,450,680,820].map((cx,i)=>(
        <circle key={i} cx={cx} cy={[51,62,46,55][i]} r="4" fill={["#ffe066","#ff9ecd","#ffe066","#ff9ecd"][i]} opacity="0.88"/>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   Floating leaf
───────────────────────────────────────────────────── */
function FloatingLeaf({ x, y, size, delay, dur, rot }: { x:number;y:number;size:number;delay:number;dur:number;rot:number }) {
  return (
    <motion.div className="absolute pointer-events-none" style={{ left:`${x}%`, top:`${y}%`, zIndex:3 }}
      animate={{ y:[-10,15,-5,10,-10], rotate:[rot,rot+14,rot-10,rot+6,rot], opacity:[0.42,0.68,0.52,0.72,0.42] }}
      transition={{ duration:dur, repeat:Infinity, delay, ease:"easeInOut" }}>
      <svg width={size} height={size*1.65} viewBox="0 0 30 50" fill="none">
        <ellipse cx="15" cy="27" rx="10" ry="21" fill="#70CA97" transform={`rotate(${rot*0.25} 15 27)`}/>
        <ellipse cx="15" cy="27" rx="6.5" ry="15" fill="#a8e15e" opacity="0.6" transform={`rotate(${rot*0.25} 15 27)`}/>
        <line x1="15" y1="48" x2="15" y2="8" stroke="#44A76F" strokeWidth="1.3"/>
      </svg>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Horizontal language toggle (in header)
───────────────────────────────────────────────────── */
function LangToggleH({ lang, setLang, isDark }: { lang:Lang; setLang:(l:Lang)=>void; isDark:boolean }) {
  return (
    <div className={`relative flex rounded-xl p-1 gap-0.5 ${isDark?"bg-white/10 border border-white/15":"bg-black/8 border border-[#cbd4db]"}`}>
      {(["en","tl"] as Lang[]).map(l=>(
        <button key={l} onClick={()=>setLang(l)}
          className="relative text-[11px] font-['Poppins',sans-serif] font-bold px-3 py-1.5 rounded-lg z-10 transition-colors"
          style={{ color: lang===l ? "#0073ff" : isDark?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)" }}>
          {lang===l && (
            <motion.div layoutId="lang-h-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" style={{zIndex:-1}}
              transition={{ type:"spring", stiffness:420, damping:32 }}/>
          )}
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Shared App Header (all dashboard pages)
───────────────────────────────────────────────────── */
function AppHeader({ lang, setLang, isDark, onToggleDark }: {
  lang:Lang; setLang:(l:Lang)=>void; isDark:boolean; onToggleDark:()=>void;
}) {
  const tx = T[lang];
  return (
    <div className="relative mb-4 shrink-0">
      <div className="absolute inset-0 rounded-2xl border border-white/40"
        style={{ background:isDark?"rgba(20,26,46,0.85)":"rgba(255,255,255,0.68)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          boxShadow: isDark?"0 4px 24px rgba(0,0,0,0.3)":"0 4px 24px rgba(46,194,253,0.08)" }}/>
      <div className="relative z-10 px-5 py-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-['Montserrat',sans-serif] font-bold text-[26px] leading-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage:"radial-gradient(ellipse at left,#0fefff 0%,#08c0fc 50%,#0091fa 100%)" }}>DiyaLikha</span>
            {" "}<span className="text-[#bf8ffd]">AI</span>
          </h1>
          <p className={`font-['Nunito',sans-serif] font-extrabold text-[12px] mt-0.5 ${isDark?"text-[#5dd3fc]":"text-[#0a88c8]"}`}>{tx.subtitle}</p>
        </div>
        {/* Language + Dark mode controls — right side */}
        <div className="flex items-center gap-2 ml-auto">
          <LangToggleH lang={lang} setLang={setLang} isDark={isDark}/>
          <motion.button whileHover={{ scale:1.08, rotate:15 }} whileTap={{ scale:0.88 }}
            onClick={onToggleDark}
            className={`p-2.5 rounded-xl border transition-all ${isDark
              ?"bg-[#1e2130] border-[#334155] text-yellow-300"
              :"bg-white border-[#c0cdd8] text-[#64748b] hover:border-[#2ec2fd] hover:text-[#0073ff]"}`}
            style={{ boxShadow:isDark?"0 0 14px rgba(253,224,71,0.28)":"0 2px 6px rgba(0,0,0,0.08)" }}>
            {isDark ? <Sun size={16}/> : <Moon size={16}/>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Sidebar — layoutId sliding pill animation
───────────────────────────────────────────────────── */
function Sidebar({ active, nav, isDark, onLogout }: { active:View; nav:(v:View)=>void; isDark:boolean; onLogout:()=>void }) {
  /* All icons are white. Active icon is full opacity + glassmorphism pill.
     Inactive icons are white at reduced opacity. No color tints. */
  const items: { id:View; label:string; renderIcon:(isActive:boolean)=>React.ReactNode }[] = [
    { id:"home",       label:"Home",
      renderIcon:(a)=><img src={homeIconPng}      className="w-5 h-5 object-contain" style={{ filter:"brightness(0) invert(1)", opacity:a?1:0.52 }}/> },
    { id:"translator", label:"Translator",
      renderIcon:(a)=><img src={translateIconPng} className="w-5 h-5 object-contain" style={{ filter:"brightness(0) invert(1)", opacity:a?1:0.52 }}/> },
    { id:"assistant",  label:"AI Chat",
      renderIcon:(a)=>(
        /* cowHead1Png: flat image, no circle crop, horns visible */
        <img src={cowHead1Png} alt="Bao"
          style={{ width:"28px", height:"auto", objectFit:"contain",
            filter:"brightness(0) invert(1)", opacity:a?1:0.52 }}/>
      )},
    { id:"library",    label:"Library",
      renderIcon:(a)=><img src={filesIconPng}     className="w-5 h-5 object-contain" style={{ filter:"brightness(0) invert(1)", opacity:a?1:0.52 }}/> },
  ];

  return (
    <aside className="w-[78px] shrink-0 rounded-[28px] flex flex-col items-center py-5 gap-3 self-stretch"
      style={{
        background:isDark?"linear-gradient(160deg,#1a3a6b 0%,#0e2548 100%)":"linear-gradient(160deg,#1ec9ff 0%,#0099ee 100%)",
        boxShadow:isDark?"0 8px 32px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.08)":"0 8px 36px rgba(46,194,253,0.38),inset 0 1px 0 rgba(255,255,255,0.35)",
      }}>

      {/* User profile placeholder */}
      <div className="w-10 h-10 rounded-full border-2 border-white/35 flex items-center justify-center overflow-hidden shrink-0"
        style={{ background:"rgba(255,255,255,0.18)", boxShadow:"0 0 12px rgba(255,255,255,0.18)" }}>
        <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
          <circle cx="20" cy="16" r="8" fill="rgba(255,255,255,0.75)"/>
          <ellipse cx="20" cy="36" rx="13" ry="9" fill="rgba(255,255,255,0.75)"/>
        </svg>
      </div>

      {/* Nav items — layoutId sliding glassmorphism pill travels between icons */}
      <nav className="flex flex-col items-center gap-2.5 flex-1 w-full px-2.5 relative">
        {items.map(({ id, label, renderIcon }) => {
          const isActive = active === id;
          return (
            <motion.button key={id} onClick={()=>nav(id)} title={label}
              whileHover={{ scale: isActive ? 1 : 1.09 }} whileTap={{ scale:0.88 }}
              className="relative w-full flex items-center justify-center py-2.5 rounded-2xl transition-colors">
              {/* Sliding pill — only rendered on active item, layoutId makes it animate between positions */}
              {isActive && (
                <motion.div layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background:"rgba(255,255,255,0.24)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
                    border:"1px solid rgba(255,255,255,0.38)", boxShadow:"0 4px 20px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.28)" }}
                  transition={{ type:"spring", stiffness:380, damping:30 }}/>
              )}
              {/* Ambient pulse on active */}
              {isActive && (
                <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{ opacity:[0.1,0.28,0.1] }} transition={{ duration:2.5, repeat:Infinity }}
                  style={{ background:"radial-gradient(circle,rgba(255,255,255,0.32) 0%,transparent 70%)" }}/>
              )}
              <span className="relative z-10">{renderIcon(isActive)}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Logout button */}
      <motion.button onClick={onLogout} whileHover={{ scale:1.08 }} whileTap={{ scale:0.88 }}
        className="p-2 rounded-xl opacity-55 hover:opacity-90 transition-opacity"
        style={{ border:"1px solid rgba(255,255,255,0.2)" }} title="Log out">
        {/* Arrow-right-from-box icon via SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </motion.button>

      <motion.button whileHover={{ scale:1.08, rotate:30 }} whileTap={{ scale:0.88 }}
        className="p-2 rounded-xl opacity-55 hover:opacity-90 transition-opacity"
        style={{ border:"1px solid rgba(255,255,255,0.2)" }} title="Settings">
        <Settings className="text-white" size={18}/>
      </motion.button>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────
   Print Modal
───────────────────────────────────────────────────── */
function PrintModal({ lang, isDark, onClose }:{ lang:Lang; isDark:boolean; onClose:()=>void }) {
  const tx = T[lang];
  const bg = isDark?"bg-gray-900":"bg-white";
  const textMain = isDark?"text-white":"text-[#1e293b]";
  const border = isDark?"border-gray-700":"border-[#f1f5f9]";
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background:"rgba(0,0,0,0.55)", backdropFilter:"blur(10px)" }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <motion.div className={`${bg} rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden`}
        initial={{ scale:0.88, y:32 }} animate={{ scale:1, y:0 }} exit={{ scale:0.88, y:32 }}
        transition={{ type:"spring", stiffness:320, damping:26 }}>
        <div className={`flex items-center justify-between px-7 py-5 border-b ${border} shrink-0`}>
          <div>
            <h2 className={`font-['Montserrat',sans-serif] font-bold text-xl ${textMain}`}>{tx.printPreview}</h2>
            <p className={`text-xs mt-0.5 ${isDark?"text-gray-400":"text-[#94a3b8]"}`}>{tx.printReadyDesc}</p>
          </div>
          <motion.button onClick={onClose} whileHover={{scale:1.1}} whileTap={{scale:0.9}}
            className={`p-2 rounded-xl ${isDark?"hover:bg-gray-800":"hover:bg-[#f8fafc]"} transition`}><X size={20}/></motion.button>
        </div>
        <div className="flex-1 overflow-auto px-7 py-5">
          <div className={`border rounded-2xl p-8 ${isDark?"border-gray-700 bg-gray-800":"border-[#e2e8f0]"}`}>
            <div className={`text-center pb-5 mb-6 border-b ${isDark?"border-gray-600":"border-[#e2e8f0]"}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <img src={undesignPng} alt="" className="w-8 h-8 object-contain"/>
                <span className="font-['Montserrat',sans-serif] font-bold text-lg text-[#265a80]">DiyaLikha AI</span>
              </div>
              <h1 className={`font-['Montserrat',sans-serif] font-bold text-2xl mt-2 ${textMain}`}>Mathematics Module 1 — Grade 4</h1>
              <p className={`text-sm mt-1 ${isDark?"text-gray-400":"text-[#64748b]"}`}>Translated to Ilocano · Prepared by: Teacher</p>
            </div>
            <div className={`space-y-4 font-['Poppins',sans-serif] text-sm leading-7 ${textMain}`}>
              <div><h2 className="font-bold text-base mb-1">I. Paksa / Topic</h2><p className={isDark?"text-gray-300":"text-[#374151]"}>Dagiti Numero ken Panagbilang — Polynomial Expressions</p></div>
              <div><h2 className="font-bold text-base mb-1">II. Mga Katapusan / Objectives</h2>
                <ul className={`list-disc list-inside space-y-1 ${isDark?"text-gray-300":"text-[#374151]"}`}>
                  <li>Maamoan dagiti ubing ti konsepto ti polynomial.</li>
                  <li>Mabalin nga agbilang ken mag-organisa kadagiti numero.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className={`flex items-center justify-end gap-3 px-7 py-4 border-t ${border} shrink-0`}>
          <motion.button onClick={onClose} whileHover={{scale:1.03}} whileTap={{scale:0.96}}
            className={`px-5 py-2.5 text-sm font-semibold border rounded-xl transition ${isDark?"border-gray-600 text-gray-300 hover:bg-gray-800":"border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"}`}>{tx.close}</motion.button>
          <motion.button onClick={()=>window.print()} whileHover={{scale:1.03,boxShadow:"0 8px 24px rgba(46,194,253,0.4)"}} whileTap={{scale:0.96}}
            className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2ec2fd] to-[#0091fa] rounded-xl shadow-lg flex items-center gap-2">
            <Printer size={15}/> {tx.printNow}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Screen A — Login Page
   Layout rules:
   • Content (title + subtitle + buttons) is vertically centered
     inside the upper 50vh (the space above the cow head).
   • Title is 1 line only — whitespace:nowrap.
   • When Register/Login clicked: standalone buttons morph via layoutId
     into the bottom of the glassmorphism form card.
   • Cow uses natural dimensions (height:70vh, width:auto).
───────────────────────────────────────────────────── */
function LoginPage({ onLogin, lang }: { onLogin:(name:string)=>void; lang:Lang }) {
  const tx = T[lang];
  const [step, setStep] = useState<"welcome"|"login"|"register">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const leaves = [
    {x:4,y:8,size:24,delay:0,dur:5,rot:-22},{x:90,y:6,size:19,delay:0.7,dur:5.5,rot:28},
    {x:14,y:38,size:17,delay:1.3,dur:4.2,rot:-38},{x:84,y:35,size:21,delay:0.4,dur:5.8,rot:18},
    {x:48,y:5,size:15,delay:2.1,dur:4.5,rot:12},{x:28,y:18,size:13,delay:1.8,dur:3.8,rot:-17},
    {x:72,y:22,size:16,delay:0.6,dur:5.1,rot:33},{x:93,y:55,size:14,delay:2.4,dur:4.4,rot:-28},
    {x:2,y:60,size:18,delay:1.2,dur:5.3,rot:22},{x:60,y:12,size:12,delay:3,dur:4.8,rot:-8},
  ];

  const inputCls = "w-full bg-white/75 border border-white/80 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2ec2fd]/40 font-['Poppins',sans-serif]";

  /* Shared button style for layoutId morphing */
  const btnStyle = (primary: boolean): React.CSSProperties => ({
    background: primary
      ? "linear-gradient(180deg,#1a8fff 0%,#0da2ff 100%)"
      : "rgba(255,255,255,0.55)",
    boxShadow: primary
      ? "0 8px 32px rgba(0,115,255,0.42),inset 0 1px 0 rgba(255,255,255,0.3)"
      : "inset 0 1px 0 rgba(255,255,255,0.4)",
    border: primary ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(0,115,255,0.3)",
    color: primary ? "#fff" : "#0073ff",
    borderRadius: "26px",
    fontFamily: "'Montserrat',sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    backdropFilter: primary ? "none" : "blur(8px)",
  });

  return (
    <div className="w-screen h-screen relative overflow-hidden"
      style={{ background:"linear-gradient(180deg,#b0dcff 0%,#cce8ff 28%,#e4f2ff 55%,#f0f7ff 100%)" }}>

      {/* Background leaves */}
      {leaves.map((l,i)=><FloatingLeaf key={i} {...l}/>)}

      {/* Ambient top glow */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex:1,
        background:"radial-gradient(ellipse 80% 50% at 50% 0%,rgba(46,194,253,0.18) 0%,transparent 70%)" }}
        animate={{ opacity:[0.3,0.55,0.3] }} transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}/>

      {/* ── CONTENT — pushed to bottom of the top 50vh, right above the cow ── */}
      <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center justify-end"
        style={{ height:"50vh", paddingBottom:"18px" }}>
        <div className="flex flex-col items-center text-center" style={{ width:"min(92vw,500px)" }}>

          {/* Title — 1 line, bigger, never wraps */}
          <motion.h1
            initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.65, ease:[0.16,1,0.3,1] }}
            className="font-['Montserrat',sans-serif] font-bold text-[#265a80] leading-none"
            style={{ fontSize:"clamp(60px,13vw,112px)", whiteSpace:"nowrap",
              textShadow:"0 6px 32px rgba(255,255,255,0.6),0 2px 8px rgba(38,90,128,0.2)",
              letterSpacing:"-2.5px" }}>
            DiyaLikha AI
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.65, delay:0.08, ease:[0.16,1,0.3,1] }}
            className="font-['Montserrat',sans-serif] font-semibold italic text-[#1f6099] text-center mt-3 leading-snug whitespace-pre-line"
            style={{ fontSize:"clamp(14px,3.2vw,20px)" }}>
            {tx.tagline}
          </motion.p>

          {/* ── Standalone buttons (shown only on welcome step) ──
              Simple fade-out on exit — no layoutId, no jitter. */}
          <AnimatePresence>
            {step === "welcome" && (
              <motion.div
                key="standalone-buttons"
                className="mt-5 w-full flex gap-4"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:6 }}
                transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}>
                <motion.button
                  className="flex-1 font-['Montserrat',sans-serif] font-bold"
                  style={{ ...btnStyle(true), fontSize:"clamp(18px,3.8vw,26px)", padding:"15px 0" }}
                  whileHover={{ scale:1.05, boxShadow:"0 12px 48px rgba(0,115,255,0.6)" }}
                  whileTap={{ scale:0.93 }}
                  onClick={() => setStep("register")}>
                  {tx.register}
                </motion.button>
                <motion.button
                  className="flex-1 font-['Montserrat',sans-serif] font-bold"
                  style={{ ...btnStyle(true), fontSize:"clamp(18px,3.8vw,26px)", padding:"15px 0" }}
                  whileHover={{ scale:1.05, boxShadow:"0 12px 48px rgba(0,115,255,0.6)" }}
                  whileTap={{ scale:0.93 }}
                  onClick={() => setStep("login")}>
                  {tx.login}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── FORM OVERLAY — centered, floats as dialog, z-30 ──
          Buttons morph INTO the bottom of this card via layoutId.
          pointer-events-none on backdrop so bg clicks pass through. */}
      <AnimatePresence>
        {step !== "welcome" && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom:"22vh" }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.2 }}>
            <motion.div
              className="pointer-events-auto w-full rounded-3xl px-6 py-5 flex flex-col gap-3"
              style={{ maxWidth:"360px",
                background:"rgba(255,255,255,0.46)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
                border:"1px solid rgba(255,255,255,0.74)",
                boxShadow:"0 12px 48px rgba(0,115,255,0.14),inset 0 1px 0 rgba(255,255,255,0.6)" }}
              initial={{ scale:0.9, y:-20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:-20 }}
              transition={{ type:"spring", stiffness:320, damping:28 }}>

              {/* Form title */}
              <h2 className="font-['Montserrat',sans-serif] font-bold text-xl text-[#265a80] text-center">
                {step==="login" ? tx.login : tx.register}
              </h2>

              {/* Fields */}
              <div className="flex flex-col gap-2.5">
                {step==="register" && (
                  <motion.input type="text" placeholder={tx.namePh} value={name}
                    onChange={e=>setName(e.target.value)} className={inputCls}
                    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"44px" }}
                    transition={{ duration:0.28 }}/>
                )}
                <input type="email" placeholder={tx.emailPh} value={email}
                  onChange={e=>setEmail(e.target.value)} className={inputCls}/>
                <input type="password" placeholder={tx.passPh} value={password}
                  onChange={e=>setPassword(e.target.value)} className={inputCls}/>
              </div>

              {/* Buttons at bottom — simple, no layoutId, no jitter */}
              <motion.div className="flex gap-3 mt-1"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.12, duration:0.3, ease:[0.16,1,0.3,1] }}>
                {/* Primary submit */}
                <motion.button
                  className="flex-1 font-['Montserrat',sans-serif] font-bold text-base py-3 rounded-[24px]"
                  style={{ ...btnStyle(true), opacity: authLoading ? 0.7 : 1 }}
                  whileHover={{ scale: authLoading ? 1 : 1.04, boxShadow:"0 10px 36px rgba(0,115,255,0.55)" }}
                  whileTap={{ scale: authLoading ? 1 : 0.95 }}
                  disabled={authLoading}
                  onClick={async () => {
                    setAuthError(null);
                    setAuthLoading(true);
                    try {
                      if (step === "login") {
                        const cred = await signInWithEmailAndPassword(auth, email, password);
                        onLogin(cred.user.displayName || cred.user.email || "User");
                      } else {
                        const cred = await createUserWithEmailAndPassword(auth, email, password);
                        onLogin(name || cred.user.email || "User");
                      }
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : String(e);
                      setAuthError(msg.replace("Firebase: ", "").replace(/ \(auth\/.*\)\.?/, ""));
                    } finally {
                      setAuthLoading(false);
                    }
                  }}>
                  {authLoading ? "..." : (step==="login" ? tx.login : tx.register)}
                </motion.button>
                {/* Switch action */}
                <motion.button
                  className="flex-1 font-['Montserrat',sans-serif] font-bold text-base py-3 rounded-[24px]"
                  style={btnStyle(false)}
                  whileHover={{ scale:1.04 }}
                  whileTap={{ scale:0.95 }}
                  onClick={() => setStep(step==="login" ? "register" : "login")}>
                  {step==="login" ? tx.register : tx.login}
                </motion.button>
              </motion.div>

              {/* Error message */}
              {authError && (
                <p className="text-xs text-red-500 text-center font-['Poppins',sans-serif] -mt-1">
                  {authError}
                </p>
              )}

              {/* Back link */}
              <button onClick={() => { setStep("welcome"); setAuthError(null); }}
                className="text-xs text-[#0073ff]/70 hover:text-[#0073ff] hover:underline text-center font-['Poppins',sans-serif] transition-colors">
                {tx.back}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hills — z-10 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height:"26vh" }}>
        <GreenHills/>
      </div>

      {/* Leaf clusters */}
      {([["left","0px",false],["right","0px",true]] as [string,string,boolean][]).map(([side,pos,flip])=>(
        <div key={side} className="absolute bottom-16 z-10 pointer-events-none"
          style={{ [side]:pos, width:"80px", height:"110px" }}>
          <svg viewBox="0 0 80 110" className="w-full h-full" fill="none" style={flip?{transform:"scaleX(-1)"}:{}}>
            <defs><linearGradient id={`lc${side}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#70CA97"/><stop offset="1" stopColor="#44A76F"/></linearGradient></defs>
            <ellipse cx="40" cy="80" rx="28" ry="48" fill={`url(#lc${side})`} transform="rotate(-28 40 80)"/>
            <ellipse cx="44" cy="80" rx="22" ry="40" fill={`url(#lc${side})`} transform="rotate(18 44 80)" opacity="0.8"/>
            <ellipse cx="40" cy="76" rx="14" ry="28" fill="#a8e15e" opacity="0.65"/>
          </svg>
        </div>
      ))}

      {/* ── COW HEAD — cow_head-1.PNG with original built-in eyes (no cursor tracking) ──
          Container clips at nose (overflow:hidden, height:50vh).
          Image: height:70vh, width:auto, bottom:-20vh → nose sits at container bottom. */}
      {/* Cow head — cowHead1Png with original built-in eyes, no interactive pupils */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none overflow-hidden"
        style={{ height:"50vh" }}>
        <img
          src={cowHead1Png}
          alt="Bao mascot"
          style={{
            position:"absolute",
            height:"70vh",
            width:"auto",
            bottom:"-20vh",
            left:"50%",
            transform:"translateX(-50%)",
            display:"block",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Screen B — Home Dashboard
───────────────────────────────────────────────────── */
function HomePage({ nav, lang, setLang, isDark, onToggleDark, userName }:{
  nav:(v:View)=>void; lang:Lang; setLang:(l:Lang)=>void; isDark:boolean; onToggleDark:()=>void; userName:string;
}) {
  const tx = T[lang];
  const firstName = userName.split(" ")[0]||"User";
  const cardBg = isDark?"bg-gray-800":"bg-white";
  const textMain = isDark?"text-white":"text-[#1e293b]";

  const tools = [
    { accent:"#bf8ffd", tint:"rgba(191,143,253,0.10)", label:tx.transTitle, desc:tx.transDesc, cta:tx.transCta, view:"translator" as View,
      icon:<img src={translateIconPng} className="w-8 h-8 object-contain" style={{ filter:"invert(55%) sepia(60%) saturate(700%) hue-rotate(228deg) brightness(110%)" }}/> },
    { accent:"#fe8bd0", tint:"rgba(254,139,208,0.10)", label:tx.libTitle,   desc:tx.libDesc,   cta:tx.libCta,   view:"library" as View,
      icon:<img src={filesIconPng} className="w-8 h-8 object-contain" style={{ filter:"invert(65%) sepia(50%) saturate(600%) hue-rotate(291deg) brightness(110%)" }}/> },
    { accent:"#ffb425", tint:"rgba(255,180,37,0.10)",  label:tx.aiTitle,    desc:tx.aiDesc,    cta:tx.aiCta,    view:"assistant" as View,
      icon:<img src={cowHead1Png} style={{ width:"36px", height:"auto", objectFit:"contain", filter:"invert(70%) sepia(80%) saturate(600%) hue-rotate(10deg) brightness(110%)" }}/> },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Banner */}
      <div className="relative rounded-[28px] overflow-hidden shrink-0 shadow-xl"
        style={{ height:"clamp(210px,27vh,285px)", background:"linear-gradient(115deg,#1ec6ff 0%,#42cfff 45%,#90e2ff 100%)",
          boxShadow:"0 12px 40px rgba(46,194,253,0.38)" }}>
        <motion.div className="absolute inset-0 pointer-events-none z-5"
          animate={{ x:["-100%","120%"] }} transition={{ duration:3.5, repeat:Infinity, repeatDelay:5, ease:"easeInOut" }}
          style={{ background:"linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.18) 50%,transparent 100%)" }}/>
        <motion.h2 initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }}
          transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-10 font-['Montserrat',sans-serif] font-bold tracking-tight select-none"
          style={{ fontSize:"clamp(36px,5.5vw,70px)",
            background:"linear-gradient(170deg,rgba(255,255,255,0.28) 11%,rgba(248,250,255,0.9) 40%,rgba(245,248,255,0.95) 62%,rgba(255,255,255,0.18) 96%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
          {tx.greeting(firstName)}
        </motion.h2>
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height:"38%" }}><GreenHills/></div>
        {/* Cow head rightmost — cowHead1Png */}
        <div className="absolute top-0 bottom-0 right-0 z-20 pointer-events-none overflow-hidden" style={{ width:"42%" }}>
          <img src={cowHead1Png} alt="Bao"
            style={{ position:"absolute", height:"105%", width:"auto", right:"-8px", top:"0", objectFit:"contain", objectPosition:"right top" }}/>
        </div>
      </div>

      {/* Tools strip */}
      <div className={`mt-3 mb-3 px-4 py-2.5 rounded-2xl border shrink-0 ${isDark?"bg-gray-800 border-gray-700":"bg-white border-[#f1f5f9]"}`}
        style={{ boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <span className="font-['Montserrat',sans-serif] font-bold text-xl text-[#a8e15e]">{tx.tools}</span>
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden" style={{ perspective:"1200px" }}>
        {tools.map(({ accent, tint, label, desc, cta, view, icon }) => (
          <motion.div key={label}
            whileHover={{ scale:1.022, rotateY:3, rotateX:-2 }}
            whileTap={{ scale:0.97 }}
            transition={{ type:"spring", stiffness:280, damping:22 }}
            className={`relative rounded-[32px] p-7 overflow-hidden flex flex-col cursor-pointer ${cardBg}`}
            style={{ borderBottom:`7px solid ${accent}`, boxShadow:`0 6px 20px ${tint}`, transformStyle:"preserve-3d" }}>
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none" style={{ background:tint }}/>
            <motion.div className="absolute inset-0 rounded-[32px] pointer-events-none"
              initial={{ opacity:0 }} whileHover={{ opacity:1 }}
              style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0) 60%)" }}/>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shrink-0" style={{ background:tint }}>
              {icon}
            </div>
            <h3 className={`font-['Nunito',sans-serif] font-black text-2xl mb-2 shrink-0 ${textMain}`}>{label}</h3>
            <p className={`font-['Poppins',sans-serif] text-sm leading-relaxed flex-1 ${isDark?"text-gray-400":"text-[#64748b]"}`}>{desc}</p>
            <motion.button onClick={()=>nav(view)}
              whileHover={{ scale:1.04, boxShadow:`0 12px 32px ${tint}` }} whileTap={{ scale:0.95 }}
              className="w-full py-3.5 rounded-3xl font-['Fredoka',sans-serif] font-bold text-lg text-white mt-6 shrink-0"
              style={{ background:accent }}>
              {cta}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Screen C — Translator (with embedded Proofread + download + paste popup)
───────────────────────────────────────────────────── */
function TranslatorPage({ nav, lang, setLang, isDark, onToggleDark, onSaveDraft, preloadItem }:{
  nav:(v:View)=>void; lang:Lang; setLang:(l:Lang)=>void; isDark:boolean; onToggleDark:()=>void; onSaveDraft:(f:DraftFile)=>void;
  preloadItem?: { doc_id: string; translated_text: string; mode?: TransMode };
}) {
  const tx = T[lang];
  const [transMode, setTransMode] = useState<TransMode>(preloadItem?.mode ?? "translate");
  const [gradeLevel, setGradeLevel] = useState("Grade 3");
  const [subject, setSubject] = useState("Science & Nature");
  const [dialect, setDialect] = useState("Waray (Samar-Leyte)");
  const [inputLang, setInputLang] = useState<"english"|"tagalog">("english");
  const [dragging, setDragging] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [exportFmt, setExportFmt] = useState<"pdf"|"docx"|null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── API state ──────────────────────────────────────────────────────────────
  const [extractedText, setExtractedText] = useState("");
  const [currentDocId, setCurrentDocId] = useState<string | null>(preloadItem?.doc_id ?? null);
  const [translatedText, setTranslatedText] = useState(preloadItem?.translated_text ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // ── Proofread state ────────────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<Array<{severity:string;original:string;corrected:string;reason:string}>>([]);
  const [proofText, setProofText] = useState(preloadItem?.translated_text ?? "");
  const [addressedCount, setAddressedCount] = useState(0);
  const [isProofreading, setIsProofreading] = useState(false);

  // Load proofreading suggestions when entering proofread mode
  useEffect(() => {
    if (transMode === "proofread" && translatedText && suggestions.length === 0 && !isProofreading) {
      setIsProofreading(true);
      setProofText(translatedText);
      import("../lib/api").then(({ apiClient }) =>
        apiClient.post<{ quality_score: number; suggestions: typeof suggestions }>(
          "/proofread", { text: translatedText, dialect, grade_level: gradeLevel }
        ).then(res => setSuggestions(res.suggestions))
          .catch(() => {/* silently fall back to empty suggestions */})
          .finally(() => setIsProofreading(false))
      );
    }
  }, [transMode]);

  const cardBg = isDark?"bg-gray-800":"bg-white";
  const textMain = isDark?"text-white":"text-[#1e293b]";
  const textMuted = isDark?"text-gray-400":"text-[#64748b]";
  const inputCls = `w-full border rounded-xl px-3 py-2.5 text-sm font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#bf8ffd]/30 ${isDark?"bg-gray-700 border-gray-600 text-white":"bg-white/70 border-[#d8b4fe] text-[#1e293b]"}`;

  const grades = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"];
  const subjects = lang==="en"?["Science & Nature","Mathematics","English","Filipino","Social Studies"]:["Agham","Matematika","Ingles","Filipino","Araling Panlipunan"];
  const dialects = ["Waray (Samar-Leyte)","Ilocano","Cebuano","Bicolano","Kapampangan","Hiligaynon"];

  /* Upload file → extract text */
  const handleFileSelected = useCallback(async (file: File) => {
    setHasFile(true);
    setFileName(file.name);
    setTranslateError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { apiClient } = await import("../lib/api");
      const res = await apiClient.upload<{ doc_id: string; extracted_text: string; storage_url: string }>(
        "/files/upload", formData
      );
      setExtractedText(res.extracted_text);
      setCurrentDocId(res.doc_id);
    } catch (e: unknown) {
      setTranslateError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  /* Translate */
  const handleTranslate = useCallback(async () => {
    const text = extractedText || pastedText;
    if (!text) return;
    setTranslateError(null);
    setIsTranslating(true);
    setTranslatedText("");
    try {
      const { apiClient } = await import("../lib/api");
      const res = await apiClient.post<{ translated_text: string; bilingual_script: string; key_terms: unknown[]; quality_score: number }>(
        "/translate", { text, grade_level: gradeLevel, subject_area: subject, target_dialect: dialect, source_language: inputLang === "english" ? "English" : "Tagalog" }
      );
      setTranslatedText(res.translated_text);
      setSuggestions([]);
      // Persist to library
      if (currentDocId) {
        apiClient.patch(`/library/${currentDocId}`, {
          translated_text: res.translated_text, status: "complete",
        }).catch(() => {});
      }
    } catch (e: unknown) {
      setTranslateError(e instanceof Error ? e.message : "Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  }, [extractedText, pastedText, gradeLevel, subject, dialect, inputLang, currentDocId]);

  /* Download */
  const handleDownload = useCallback(() => {
    if (!exportFmt || !translatedText) return;
    const content = `DiyaLikha AI — Translated Lesson Material\n\nGrade Level: ${gradeLevel}\nSubject: ${subject}\nTarget Dialect: ${dialect}\n\n--- TRANSLATED CONTENT ---\n\n${translatedText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lesson-material.${exportFmt}`; a.click();
    URL.revokeObjectURL(url);
  }, [exportFmt, translatedText, gradeLevel, subject, dialect]);

  /* Save draft (proofread) */
  const handleSaveDraft = useCallback(async () => {
    if (currentDocId) {
      const { apiClient } = await import("../lib/api");
      apiClient.patch(`/library/${currentDocId}`, { translated_text: proofText, status: "review" }).catch(() => {});
    }
    onSaveDraft({
      id: currentDocId ?? Date.now().toString(), name: fileName || "Translated Material",
      category: subject.toUpperCase(), grade: gradeLevel,
      subtitle: `${inputLang === "english" ? "English" : "Tagalog"} to ${dialect}`,
      date: new Date().toLocaleDateString("en-US", { month:"2-digit", day:"2-digit", year:"2-digit" }),
    });
  }, [currentDocId, proofText, fileName, subject, gradeLevel, inputLang, dialect, onSaveDraft]);

  return (
    <>
      <AnimatePresence>{printOpen && <PrintModal lang={lang} isDark={isDark} onClose={()=>setPrintOpen(false)}/>}</AnimatePresence>

      {/* Paste popup */}
      <AnimatePresence>
        {pasteOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)" }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className={`${cardBg} rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden`}
              initial={{ scale:0.88,y:28 }} animate={{ scale:1,y:0 }} exit={{ scale:0.88,y:28 }}
              transition={{ type:"spring", stiffness:320, damping:26 }}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark?"border-gray-700":"border-[#f1f5f9]"}`}>
                <h2 className={`font-['Montserrat',sans-serif] font-bold text-lg ${textMain}`}>{tx.pasteTitle}</h2>
                <motion.button onClick={()=>setPasteOpen(false)} whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                  className={`p-2 rounded-xl ${isDark?"hover:bg-gray-700":"hover:bg-[#f8fafc]"}`}><X size={18}/></motion.button>
              </div>
              <div className="p-6">
                <textarea value={pastedText} onChange={e=>setPastedText(e.target.value)}
                  placeholder={tx.pasteHint} rows={8}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm font-['Poppins',sans-serif] resize-none focus:outline-none focus:ring-2 focus:ring-[#bf8ffd]/40 ${isDark?"bg-gray-700 border-gray-600 text-white placeholder-gray-500":"bg-[#f9fbff] border-[#e2e8f0] text-[#1e293b] placeholder-[#94a3b8]"}`}/>
              </div>
              <div className={`flex justify-end gap-3 px-6 pb-5`}>
                <button onClick={()=>setPasteOpen(false)} className={`px-4 py-2.5 text-sm font-semibold border rounded-xl ${isDark?"border-gray-600 text-gray-300":"border-[#e2e8f0] text-[#64748b]"}`}>{tx.close}</button>
                <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                  onClick={()=>{ if(pastedText.trim()){ setHasFile(true); setFileName("Pasted text"); } setPasteOpen(false); }}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#bf8ffd] to-[#a855f7] rounded-xl shadow">
                  {tx.pasteConfirm}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {transMode==="translate" ? (
            <motion.div key="trans"
              initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
              transition={{ type:"spring", stiffness:300, damping:28 }}
              className="flex gap-5 flex-1 min-h-0 overflow-hidden">

              {/* Left */}
              <div className="w-[370px] shrink-0 flex flex-col gap-4 overflow-auto">
                <div className={`${cardBg} rounded-2xl p-5 shadow-sm`}>
                  {/* Input Material label — same color as paste text (purple/blue) */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-['Nunito',sans-serif] font-extrabold text-[10px] tracking-widest uppercase text-[#7c3aed]">{tx.inputMat}</span>
                    <div className="flex items-center gap-1 text-[10px] font-['Nunito',sans-serif] font-extrabold">
                      <span className={`${textMuted} mr-1`}>{tx.inputIn}</span>
                      {(["english","tagalog"] as const).map(l=>(
                        <motion.button key={l} whileTap={{scale:0.88}} onClick={()=>setInputLang(l)}
                          className={`px-2.5 py-1 rounded-lg transition text-xs ${inputLang===l?"bg-[#2ec2fd] text-white":`${isDark?"text-gray-400":"text-[#64748b]"}`}`}>
                          {l==="english"?tx.english:tx.tagalog}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                    onChange={e=>{const f=e.target.files?.[0];if(f) handleFileSelected(f);}}/>
                  <div onClick={()=>fileRef.current?.click()}
                    onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
                    onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f) handleFileSelected(f);}}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragging?"border-[#2ec2fd] bg-[#f0fbff]":`${isDark?"border-gray-600 bg-gray-750":"border-[#cbd4db] bg-[#f9fbff]"}`}`}>
                    <div className="w-14 h-14 rounded-full bg-[#bf8ffd]/15 flex items-center justify-center mx-auto mb-3">
                      <Upload className="text-[#bf8ffd]" size={24}/>
                    </div>
                    <p className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm mb-1 ${textMain}`}>
                      {isUploading ? "Uploading..." : hasFile ? fileName : tx.dropLesson}
                    </p>
                    <p className={`text-xs ${textMuted}`}>DOCX  PDF  TXT</p>
                    <p className={`text-xs ${textMuted} my-2`}>{tx.orTxt}</p>
                    {/* Paste text — same color as Input Material label */}
                   <button onClick={e=>{e.stopPropagation();setPasteOpen(true);}}
                     className="text-xs text-[#7c3aed] font-['Plus_Jakarta_Sans',sans-serif] font-semibold hover:underline">{tx.pasteTxt}</button>
                 </div>
               </div>

               {/* Translate button */}
               <motion.button
                 onClick={handleTranslate}
                 disabled={isTranslating || isUploading || (!extractedText && !pastedText)}
                 whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                 className="w-full py-3 rounded-2xl font-['Fredoka',sans-serif] font-bold text-base text-white shadow-lg transition"
                 style={{ background: (isTranslating || isUploading || (!extractedText && !pastedText)) ? "#c4b5fd" : "linear-gradient(135deg,#bf8ffd 0%,#a855f7 100%)" }}>
                 {isTranslating ? "Translating..." : isUploading ? "Uploading..." : "Translate"}
               </motion.button>
               {translateError && (
                 <p className="text-xs text-red-500 text-center font-['Poppins',sans-serif]">{translateError}</p>
               )}

                {/* Context params */}
                <div className="rounded-2xl p-5 shadow-sm border border-[#e9d5ff]"
                  style={{ background:"linear-gradient(135deg,rgba(191,143,253,0.14) 0%,rgba(168,85,247,0.08) 100%)" }}>
                  <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-[#7c3aed] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#bf8ffd] shrink-0"/>{tx.ctxParams}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[{label:tx.gradeLevel,val:gradeLevel,set:setGradeLevel,opts:grades},{label:tx.subjectArea,val:subject,set:setSubject,opts:subjects}].map(({label,val,set,opts})=>(
                      <div key={label}>
                        <label className="text-[10px] font-semibold text-[#7c3aed] uppercase tracking-wider block mb-1">{label}</label>
                        <div className="relative">
                          <select value={val} onChange={e=>set(e.target.value)} className={inputCls}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                          <ChevronDown className="absolute right-2.5 top-3 text-[#bf8ffd] pointer-events-none" size={13}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#7c3aed] uppercase tracking-wider block mb-1">{tx.targetDialect}</label>
                    <div className="relative">
                      <select value={dialect} onChange={e=>setDialect(e.target.value)} className={inputCls}>{dialects.map(d=><option key={d}>{d}</option>)}</select>
                      <ChevronDown className="absolute right-2.5 top-3 text-[#bf8ffd] pointer-events-none" size={13}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className={`flex-1 min-h-0 ${cardBg} rounded-2xl shadow-sm flex flex-col overflow-hidden`}>
                <div className={`px-6 pt-5 pb-2 text-center shrink-0 border-b ${isDark?"border-gray-700":"border-[#f1f5f9]"}`}>
                  <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm tracking-wide ${textMuted}`}>{tx.translatedMat}</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-8 min-h-0 overflow-auto">
                  {isTranslating ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-[#bf8ffd] border-t-transparent animate-spin"/>
                      <p className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base ${textMain}`}>Translating your lesson…</p>
                    </div>
                  ) : translatedText ? (
                    <div className={`w-full h-full p-6 font-['Plus_Jakarta_Sans',sans-serif] text-sm leading-8 whitespace-pre-wrap ${textMain}`}>
                      {translatedText}
                    </div>
                  ) : (
                    <>
                      <motion.img src={baoPng} alt="Bao"
                        animate={{ y:[0,-8,0] }} transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
                        style={{ height:"clamp(120px,24vh,210px)", width:"auto" }}/>
                      <p className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl mt-4 ${textMain}`}>{tx.waitingIdeas}</p>
                      <p className={`text-sm mt-1 text-center ${textMuted}`}>{tx.uploadStart}</p>
                    </>
                  )}
                </div>
                {/* Action buttons inside right panel */}
                <div className={`px-6 pb-5 pt-3 border-t ${isDark?"border-gray-700":"border-[#f1f5f9]"} shrink-0`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-['Nunito',sans-serif] font-extrabold tracking-widest ${textMuted}`}>{tx.exportLbl}</span>
                      {[{fmt:"pdf" as const,label:"PDF"},{fmt:"docx" as const,label:"DOCX"}].map(({fmt,label})=>(
                        <motion.button key={fmt} whileHover={{scale:1.05}} whileTap={{scale:0.9}}
                          onClick={()=>setExportFmt(exportFmt===fmt?null:fmt)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border transition ${exportFmt===fmt?"bg-[#0073ff] text-white border-[#0073ff] shadow-md":`${isDark?"border-gray-600 text-gray-300":"border-[#e2e8f0] text-[#64748b]"}`}`}>
                          <FileDown size={12}/> {label} {exportFmt===fmt&&<Check size={10}/>}
                        </motion.button>
                      ))}
                      {/* Download button — immediate, no prompt */}
                      <motion.button whileHover={{scale:1.05,boxShadow:"0 6px 18px rgba(0,115,255,0.3)"}} whileTap={{scale:0.9}}
                        onClick={handleDownload}
                        disabled={!exportFmt}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${exportFmt?"bg-gradient-to-r from-[#2ec2fd] to-[#0091fa] text-white shadow":"opacity-40 cursor-not-allowed bg-gray-200 text-gray-500"}`}>
                        <FileDown size={12}/> {tx.download}
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{scale: translatedText ? 1.05 : 1}} whileTap={{scale: translatedText ? 0.9 : 1}}
                        onClick={()=>{ if(translatedText) setPrintOpen(true); }}
                        disabled={!translatedText}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border transition ${translatedText ? "text-[#2d8653] bg-[#f0fdf4] border-[#a8e15e]" : "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"}`}>
                        <Printer size={12}/> {tx.readyPrint}
                      </motion.button>
                      <motion.button
                        whileHover={{scale: translatedText ? 1.05 : 1, boxShadow: translatedText ? "0 8px 24px rgba(191,143,253,0.5)" : "none"}}
                        whileTap={{scale: translatedText ? 0.9 : 1}}
                        onClick={()=>{ if(translatedText) setTransMode("proofread"); }}
                        disabled={!translatedText}
                        className={`px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow flex items-center gap-1.5 transition ${translatedText ? "bg-gradient-to-r from-[#bf8ffd] to-[#a855f7]" : "opacity-40 cursor-not-allowed bg-gray-300"}`}>
                        <Pencil size={12}/> {tx.proofread}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Proofread */
            <motion.div key="proof"
              initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:40 }}
              transition={{ type:"spring", stiffness:300, damping:28 }}
              className="flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setTransMode("translate")}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${isDark?"bg-gray-800 border-gray-700 text-gray-300":"bg-white border-[#e2e8f0] text-[#64748b]"}`}>
                    <ArrowLeft size={13}/> {tx.back}
                  </motion.button>
                  <h2 className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg ${textMain}`}>{tx.proofTitle}</h2>
                </div>
                {suggestions.length > 0 && (
                  <span className={`text-xs font-semibold ${textMuted}`}>
                    {addressedCount} of {suggestions.length + addressedCount} addressed &nbsp;
                    <span className="inline-block w-16 h-1.5 rounded-full bg-gray-200 align-middle">
                      <span className="block h-full rounded-full bg-[#bf8ffd]"
                        style={{ width: `${((addressedCount/(suggestions.length+addressedCount))*100)}%` }}/>
                    </span>
                  </span>
                )}
              </div>

              <div className="flex gap-5 flex-1 min-h-0 overflow-hidden">
                {/* Editable text panel */}
                <div className={`flex-1 ${cardBg} rounded-2xl shadow-sm p-6 overflow-auto min-h-0`}>
                  {isProofreading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-10 h-10 rounded-full border-4 border-[#bf8ffd] border-t-transparent animate-spin"/>
                      <p className={`text-sm ${textMuted}`}>Analyzing your translation…</p>
                    </div>
                  ) : (
                    <div className={`font-['Plus_Jakarta_Sans',sans-serif] text-sm leading-8 ${textMain} whitespace-pre-wrap`}>
                      {/* Highlight spans for each suggestion's original text */}
                      {(() => {
                        if (suggestions.length === 0) return proofText;
                        let result = proofText;
                        const colorMap: Record<string, string> = { critical:"bg-pink-100 border-pink-400", major:"bg-orange-100 border-orange-400", suggestion:"bg-purple-100 border-purple-400" };
                        const parts: React.ReactNode[] = [];
                        let remaining = result;
                        suggestions.forEach((s, i) => {
                          const idx = remaining.indexOf(s.original);
                          if (idx === -1) return;
                          if (idx > 0) parts.push(remaining.slice(0, idx));
                          parts.push(
                            <motion.span key={i} className={`${colorMap[s.severity] ?? "bg-purple-100 border-purple-400"} border-b-2 px-0.5 rounded-sm cursor-pointer`}
                              whileHover={{ scale: 1.02 }} title={s.reason}>
                              {s.original}
                            </motion.span>
                          );
                          remaining = remaining.slice(idx + s.original.length);
                        });
                        if (remaining) parts.push(remaining);
                        return parts;
                      })()}
                    </div>
                  )}
                </div>

                {/* Suggestions panel */}
                {suggestions.length > 0 && (
                  <div className="w-72 shrink-0 flex flex-col gap-3 overflow-auto">
                    <p className={`text-[10px] font-extrabold tracking-widest uppercase ${textMuted}`}>Feedback and Suggestions</p>
                    {suggestions.map((s, i) => {
                      const colors: Record<string, string> = { critical:"border-pink-400 bg-pink-50", major:"border-orange-400 bg-orange-50", suggestion:"border-purple-400 bg-purple-50" };
                      const labelColors: Record<string, string> = { critical:"text-pink-600 bg-pink-100", major:"text-orange-600 bg-orange-100", suggestion:"text-purple-600 bg-purple-100" };
                      return (
                        <div key={i} className={`rounded-2xl border p-4 ${colors[s.severity] ?? colors.suggestion}`}>
                          <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${labelColors[s.severity] ?? labelColors.suggestion}`}>{s.severity}</span>
                          <p className={`text-xs mt-2 leading-5 ${textMuted}`}>{s.reason}</p>
                          <p className="text-xs mt-1 line-through text-gray-400">{s.original}</p>
                          <p className="text-xs mt-0.5 text-green-700 font-semibold">{s.corrected}</p>
                          <div className="flex gap-2 mt-3">
                            <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                              onClick={() => {
                                setProofText(t => t.replace(s.original, s.corrected));
                                setSuggestions(prev => prev.filter((_, j) => j !== i));
                                setAddressedCount(c => c + 1);
                              }}
                              className="flex-1 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#bf8ffd] to-[#a855f7] rounded-xl">
                              Accept
                            </motion.button>
                            <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                              onClick={() => { setSuggestions(prev => prev.filter((_, j) => j !== i)); setAddressedCount(c => c + 1); }}
                              className={`flex-1 py-1.5 text-xs font-semibold border rounded-xl ${isDark?"border-gray-600 text-gray-300":"border-[#e2e8f0] text-[#64748b]"}`}>
                              Keep
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-3 shrink-0">
                {suggestions.length > 0 && (
                  <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                    onClick={() => {
                      let t = proofText;
                      suggestions.forEach(s => { t = t.replace(s.original, s.corrected); });
                      setProofText(t);
                      setAddressedCount(c => c + suggestions.length);
                      setSuggestions([]);
                    }}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2ec2fd] to-[#0091fa] rounded-xl shadow">
                    Apply All Corrections
                  </motion.button>
                )}
                <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                  onClick={async ()=>{ await handleSaveDraft(); nav("library"); }}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#bf8ffd] to-[#a855f7] rounded-xl shadow">
                  {tx.saveDraft}
                </motion.button>
                <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}} onClick={()=>setPrintOpen(true)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2ec2fd] to-[#0091fa] rounded-xl shadow flex items-center gap-2">
                  <Printer size={14}/> {tx.applyAll}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   parseBold — converts **text** to <strong> without asterisks
───────────────────────────────────────────────────── */
function parseBold(text: string): React.ReactNode {
  if (!text.includes("**")) return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : part
  );
}

/* ─────────────────────────────────────────────────────
   Screen E — AI Assistant  (wider left panel, functional quick actions)
───────────────────────────────────────────────────── */
function AssistantPage({ lang, setLang, isDark, onToggleDark, allLibCards }:{
  lang:Lang; setLang:(l:Lang)=>void; isDark:boolean; onToggleDark:()=>void;
  allLibCards:{id:string;name:string;category:string}[];
}) {
  const tx = T[lang];
  const en = lang==="en";

  /* Demo initial messages */
  const INIT_MSGS: ChatMsg[] = [
    { id:"b0", type:"bot", content: en
      ? <><b>Hello Teacher!</b> I'm Bao, your AI teaching assistant. I can help you create lesson plans, activities, summaries and more. What would you like to create today?</>
      : <><b>Kamusta, Guro!</b> Ako si Bao. Maaari akong tumulong sa mga plano ng aralin, aktibidad, buod at iba pa. Ano ang gusto mong gawin ngayon?</> },
    { id:"u0", type:"user", content: en?"Create a 30-minute lesson plan focusing on plant parts, including a group activity.":"Gumawa ng 30-minutong plano ng aralin tungkol sa mga bahagi ng halaman." },
    { id:"b1", type:"bot", content: (
      <div className="bg-white dark:bg-gray-800 border border-[#e2e8f0] rounded-xl p-4">
        <p className="font-bold text-sm text-[#1e293b] mb-3">{en?"Lesson Plan: Parts of a Plant (Grade 3)":"Plano ng Aralin: Mga Bahagi ng Halaman (Grade 3)"}</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[{h:en?"Objectives":"Layunin",items:[en?"Identify major parts of a plant.":"Makilala ang mga pangunahing bahagi ng halaman.",en?"Describe root, stem, leaf functions.":"Ilarawan ang tungkulin ng ugat, tangkay, dahon."]},{h:en?"Materials":"Kagamitan",items:[en?"Potted plant, Sheets":"Palayok na halaman, Sheets",en?"Colored markers.":"Mga pangkulay."]}].map(({h,items})=>(
            <div key={h}><p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">{h}</p><ul className="text-xs space-y-1">{items.map(it=><li key={it}>• {it}</li>)}</ul></div>
          ))}
        </div>
        <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">{en?"Lesson Flow":"Takbo ng Aralin"}</p>
        {[{t:"00-05m",a:en?"Introduction: Plant Scavenger Hunt":"Panimula: Plant Scavenger Hunt"},{t:"05-15m",a:en?"Discussion: Visual aids for roots, stem, leaves.":"Talakayan: Visual aids para sa ugat, tangkay, dahon."},{t:"15-25m",a:en?"Group Activity: Label diagram in local dialect.":"Pangkatang Gawain: Mag-label ng diagram."},{t:"25-30m",a:en?"Wrap-up: Quick quiz!":"Pangwakas: Mabilis na pagsubok!"}].map(({t,a})=>(
          <div key={t} className="flex gap-2 text-xs mb-1.5"><span className="font-bold text-[#2ec2fd] shrink-0 w-14">{t}</span><span className="text-[#64748b]">{a}</span></div>
        ))}
      </div>
    )},
  ];

  const [messages, setMessages] = useState<ChatMsg[]>(INIT_MSGS);
  const [message, setMessage] = useState("");
  const [outputLang, setOutputLang] = useState("Filipino");
  const [gradeLevel, setGradeLevel] = useState("Grade 3");
  const [learningStyles, setLearningStyles] = useState<string[]>(["Visual","Kinesthetic"]);
  const [showPicker, setShowPicker] = useState(false);
  const [selId, setSelId] = useState<string|null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const toggleStyle = (s:string)=>setLearningStyles(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const selCard = allLibCards.find(c=>c.id===selId);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  useEffect(()=>{ scrollToBottom(); },[messages]);

  /* Core send — calls Bao API */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isChatLoading) return;
    const userMsg: ChatMsg = { id: Date.now()+"u", type:"user", content: text };
    const typingMsg: ChatMsg = { id: "typing", type:"bot", content: (
      <div className="flex gap-1 items-center py-1">
        {[0,1,2].map(i=>(
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#bf8ffd]"
            animate={{ y:[0,-5,0] }} transition={{ duration:0.6, repeat:Infinity, delay:i*0.15 }}/>
        ))}
      </div>
    )};
    setMessages(prev => [...prev, userMsg, typingMsg]);
    setIsChatLoading(true);
    try {
      const { apiClient } = await import("../lib/api");
      const res = await apiClient.post<{ content: string }>("/chat", {
        message: text,
        output_language: outputLang,
        grade_level: gradeLevel,
        learning_style: learningStyles.join(" + "),
        file_context: selCard ? selCard.name : null,
      });
      const botMsg: ChatMsg = { id: Date.now()+"b", type:"bot", content: (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{parseBold(res.content)}</div>
      )};
      setMessages(prev => prev.filter(m => m.id !== "typing").concat(botMsg));
    } catch (e: unknown) {
      const errMsg: ChatMsg = { id: Date.now()+"e", type:"bot", content: (
        <span className="text-red-400 text-xs">{e instanceof Error ? e.message : "Something went wrong. Try again."}</span>
      )};
      setMessages(prev => prev.filter(m => m.id !== "typing").concat(errMsg));
    } finally {
      setIsChatLoading(false);
    }
  }, [isChatLoading, outputLang, gradeLevel, learningStyles, selCard]);

  const handleQuickAction = (label: string) => {
    const promptMap: Record<string, string> = {
      [tx.lpLabel]: en
        ? `Create a 45-minute lesson plan for ${gradeLevel} using ${outputLang}.`
        : `Gumawa ng 45-minutong plano ng aralin para sa ${gradeLevel} sa ${outputLang}.`,
      [tx.actLabel]: en
        ? `Create a group activity for ${gradeLevel} students in ${outputLang}.`
        : `Gumawa ng pangkatang gawain para sa ${gradeLevel} sa ${outputLang}.`,
      [tx.sumLabel]: en
        ? `Summarize the selected lesson for ${gradeLevel} in ${outputLang}.`
        : `Ibuod ang napiling aralin para sa ${gradeLevel} sa ${outputLang}.`,
      [tx.moreLabel]: en
        ? "What other tools can you help me with?"
        : "Ano pa ang maaari mong tulungan sa akin?",
    };
    sendMessage(promptMap[label] ?? label);
  };

  const handleSend = () => {
    sendMessage(message);
    setMessage("");
  };

  const quickActions = [
    { label:tx.lpLabel, color:"#bf8ffd" },
    { label:tx.actLabel, color:"#fe8bd0" },
    { label:tx.sumLabel, color:"#2ec2fd" },
    { label:tx.moreLabel, color:"#ffb425" },
  ];

  const cardBg = isDark?"bg-gray-800":"bg-white";
  const textMain = isDark?"text-white":"text-[#1e293b]";
  const textMuted = isDark?"text-gray-400":"text-[#64748b]";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left panel — wider */}
        <div className="w-[280px] shrink-0 flex flex-col gap-3 overflow-auto">
          <div className={`${cardBg} rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`font-['Poppins',sans-serif] font-bold text-xs ${textMain}`}>{tx.selFile}</p>
              <button onClick={()=>setShowPicker(!showPicker)} className="text-[10px] text-[#2ec2fd] font-semibold hover:underline">{tx.changeFile} ›</button>
            </div>
            {showPicker && (
              <div className={`mb-3 border rounded-xl overflow-hidden ${isDark?"border-gray-700 bg-gray-750":"border-[#e2e8f0] bg-[#f8fafc]"}`}>
                <p className={`text-[10px] font-semibold px-3 pt-2 pb-1 uppercase tracking-wider ${textMuted}`}>{tx.selFromLib}</p>
                {allLibCards.length===0 ? <p className={`text-xs px-3 pb-3 ${textMuted}`}>{tx.noFiles}</p>
                  : <div className="divide-y divide-gray-100 max-h-44 overflow-auto">
                    {allLibCards.map(card=>(
                      <button key={card.id} onClick={()=>{setSelId(card.id);setShowPicker(false);}}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition hover:bg-white ${selId===card.id?isDark?"bg-gray-700":"bg-white":""}`}>
                        <div className="w-6 h-6 rounded-lg bg-[#fe8bd0]/15 flex items-center justify-center shrink-0"><FileText size={11} className="text-[#fe8bd0]"/></div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${textMain}`}>{card.name}</p>
                          <p className={`text-[10px] ${textMuted}`}>{card.category}</p>
                        </div>
                        {selId===card.id&&<Check size={11} className="text-[#2ec2fd] shrink-0"/>}
                      </button>
                    ))}
                  </div>}
              </div>
            )}
            <div className="flex items-start gap-2 bg-[#fff7fd] border border-[#fce7f3] rounded-xl p-3">
              {/* Cow head pfp — small, horns visible, NOT circular */}
              <div className="w-10 shrink-0 flex items-center justify-center" style={{ height:"32px" }}>
                <img src={cowHead1Png} alt="Bao" style={{ height:"32px", width:"auto", objectFit:"contain" }}/>
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold leading-snug ${textMain}`}>{selCard?selCard.name+".pdf":"Grade 3 Science - Plants (Waray+Filipino).pdf"}</p>
                <p className={`text-[10px] mt-0.5 ${textMuted}`}>{tx.fileSize}</p>
              </div>
            </div>
            <p className={`text-[10px] mt-2 leading-relaxed ${textMuted}`}>{tx.fileDesc}</p>
          </div>

          {/* Quick actions — functional */}
          <div className={`${cardBg} rounded-2xl p-4 shadow-sm`}>
            <p className={`font-['Poppins',sans-serif] font-bold text-xs mb-3 flex items-center gap-1 ${textMain}`}>
              <Zap size={12} className="text-[#ffb425]"/> {tx.quickActs}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(({label,color})=>(
                <motion.button key={label} whileHover={{scale:1.05,y:-2}} whileTap={{scale:0.93}}
                  onClick={()=>handleQuickAction(label)}
                  className={`flex flex-col items-center gap-1.5 border rounded-xl py-3 px-2 transition ${isDark?"bg-gray-750 border-gray-700 hover:bg-gray-700":"bg-[#f8fafc] border-[#e2e8f0] hover:bg-[#f0f9ff] hover:border-[#2ec2fd]/40"}`}
                  style={{ "--accent":color } as React.CSSProperties}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background:`${color}25` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background:color }}/>
                  </div>
                  <span className={`text-[10px] font-['Poppins',sans-serif] font-semibold text-center leading-tight ${isDark?"text-gray-300":"text-[#64748b]"}`}>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Output preferences */}
          <div className={`${cardBg} rounded-2xl p-4 shadow-sm`}>
            <p className={`font-['Poppins',sans-serif] font-bold text-xs mb-3 ${textMain}`}>{tx.outPrefs}</p>
            <div className="space-y-3">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${textMuted}`}>{tx.outLang}</label>
                <div className="relative">
                  <select value={outputLang} onChange={e=>setOutputLang(e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-xs font-medium appearance-none pr-7 focus:outline-none ${isDark?"bg-gray-700 border-gray-600 text-white":"bg-[#f8fafc] border-[#e2e8f0] text-[#1e293b]"}`}>
                    {["Filipino","Waray","Ilocano","Cebuano"].map(l=><option key={l}>{l}</option>)}
                  </select>
                  <ChevronDown className={`absolute right-2 top-2.5 pointer-events-none ${textMuted}`} size={11}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${textMuted}`}>{tx.gradeLevel}</label>
                  <div className="relative">
                    <select value={gradeLevel} onChange={e=>setGradeLevel(e.target.value)} className={`w-full border rounded-xl px-2 py-2 text-xs font-medium appearance-none pr-5 focus:outline-none ${isDark?"bg-gray-700 border-gray-600 text-white":"bg-[#f8fafc] border-[#e2e8f0] text-[#1e293b]"}`}>
                      {["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"].map(g=><option key={g}>{g}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-1.5 top-2.5 pointer-events-none ${textMuted}`} size={10}/>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${textMuted}`}>{tx.duration}</label>
                  <div className={`border rounded-xl px-2.5 py-2 text-xs font-medium flex items-center gap-1 ${isDark?"bg-gray-700 border-gray-600 text-white":"bg-[#f8fafc] border-[#e2e8f0] text-[#1e293b]"}`}>
                    <Clock size={10} className="text-[#94a3b8]"/> 30 min
                  </div>
                </div>
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-2 ${textMuted}`}>{tx.learnStyle}</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Visual","Kinesthetic","Auditory","Reading"].map(s=>(
                    <motion.button key={s} onClick={()=>toggleStyle(s)} whileTap={{scale:0.88}}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition ${learningStyles.includes(s)?"bg-[#2ec2fd] text-white":`border ${isDark?"border-gray-600 text-gray-400":"border-[#e2e8f0] text-[#64748b]"}`}`}>
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right chat panel */}
        <div className={`flex-1 flex flex-col ${cardBg} rounded-2xl shadow-sm overflow-hidden min-h-0`}>
          {/* Chat header */}
          <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${isDark?"border-gray-700":"border-[#f1f5f9]"} shrink-0`}>
            {/* Cow head — small, horns visible, no circle crop */}
            <div className="flex items-center justify-center shrink-0" style={{ width:"36px", height:"32px" }}>
              <img src={cowHead1Png} alt="Bao" style={{ height:"32px", width:"auto", objectFit:"contain" }}/>
            </div>
            <div>
              <p className={`font-['Poppins',sans-serif] font-bold text-sm ${textMain}`}>Bao AI</p>
              <div className="flex items-center gap-1">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
                  animate={{ opacity:[1,0.4,1] }} transition={{ duration:2, repeat:Infinity }}/>
                <span className={`text-[10px] ${textMuted}`}>Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {messages.map((msg,i)=>(
              <motion.div key={msg.id}
                initial={{ opacity:0, y:10, scale:0.96 }}
                animate={{ opacity:1, y:0, scale:1 }}
                transition={{ type:"spring", stiffness:300, damping:24, delay:i<3?0:0 }}
                className={`flex ${msg.type==="user"?"justify-end":"items-end gap-2"}`}>
                {msg.type==="bot" && (
                  <div className="flex items-center justify-center shrink-0" style={{ width:"28px", height:"24px" }}>
                    <img src={cowHead1Png} alt="" style={{ height:"24px", width:"auto", objectFit:"contain" }}/>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 max-w-[78%] ${msg.type==="user"
                  ?"bg-gradient-to-br from-[#ffb425] to-[#f59e0b] text-white rounded-br-sm"
                  :`rounded-bl-sm ${isDark?"bg-gray-700 text-gray-100":"bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b]"}`}`}>
                  {typeof msg.content==="string"
                    ? <p className="font-['Poppins',sans-serif] text-sm leading-relaxed whitespace-pre-wrap">{parseBold(msg.content)}</p>
                    : msg.content}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef}/>
          </div>

          {/* Input */}
          <div className={`px-5 py-4 border-t ${isDark?"border-gray-700":"border-[#f1f5f9]"} shrink-0`}>
            <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 ${isDark?"bg-gray-700 border-gray-600":"bg-[#f8fafc] border-[#e2e8f0]"}`}>
              <input value={message} onChange={e=>setMessage(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&handleSend()}
                disabled={isChatLoading}
                placeholder={isChatLoading ? "Bao is typing…" : tx.typeMsg}
                className={`flex-1 bg-transparent text-sm placeholder-[#94a3b8] outline-none font-['Poppins',sans-serif] ${textMain}`}/>
              <motion.button
                whileHover={{scale: isChatLoading ? 1 : 1.12, boxShadow: isChatLoading ? "none" : "0 6px 20px rgba(46,194,253,0.5)"}}
                whileTap={{scale: isChatLoading ? 1 : 0.88}}
                onClick={handleSend}
                disabled={isChatLoading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md transition ${isChatLoading ? "bg-gray-200 cursor-not-allowed" : "bg-gradient-to-br from-[#2ec2fd] to-[#0091fa]"}`}>
                <Send size={14} className={isChatLoading ? "text-gray-400" : "text-white"}/>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Screen F — Library
───────────────────────────────────────────────────── */
function LibraryPage({ lang, setLang, isDark, onToggleDark, draftFiles, onOpenTranslator }:{
  lang:Lang; setLang:(l:Lang)=>void; isDark:boolean; onToggleDark:()=>void; draftFiles:DraftFile[];
  onOpenTranslator:(item:{ doc_id:string; translated_text:string; mode?:TransMode })=>void;
}) {
  const tx = T[lang];
  type S = "complete"|"processing"|"review"|"error"|"draft"|"schedule";

  // ── API library items ────────────────────────────────────────────────────────
  interface ApiItem { doc_id:string; title:string; category:string; grade:string; subtitle:string; status:string; translated_text:string; created_at:string; }
  const [apiItems, setApiItems] = useState<ApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(()=>{
    import("../lib/api").then(({ apiClient })=>
      apiClient.get<ApiItem[]>("/library")
        .then(items => setApiItems(items))
        .catch(()=>{/* fall back to base cards */})
        .finally(()=>setIsLoading(false))
    );
  },[]);

  const handleDelete = async (doc_id: string) => {
    const { apiClient } = await import("../lib/api");
    await apiClient.delete(`/library/${doc_id}`).catch(()=>{});
    setApiItems(prev => prev.filter(i => i.doc_id !== doc_id));
  };

  const statusMap: Record<S,{lbl:string;cls:string;actLbl:string;actCls:string}> = {
    complete:   {lbl:tx.complete,    cls:"bg-emerald-100 text-emerald-700", actLbl:tx.view,    actCls:"bg-[#2ec2fd] text-white"},
    processing: {lbl:tx.processing,  cls:"bg-amber-100 text-amber-700",     actLbl:tx.track,   actCls:"bg-[#ffb425] text-white"},
    review:     {lbl:tx.needsReview, cls:"bg-orange-100 text-orange-600",   actLbl:tx.review,  actCls:"bg-orange-400 text-white"},
    error:      {lbl:tx.error,       cls:"bg-red-100 text-red-600",         actLbl:tx.retry,   actCls:"bg-red-400 text-white"},
    draft:      {lbl:tx.draft,       cls:"bg-purple-100 text-purple-600",   actLbl:tx.edit,    actCls:"bg-[#bf8ffd] text-white"},
    schedule:   {lbl:tx.schedule,    cls:"bg-amber-100 text-amber-700",     actLbl:tx.schedule,actCls:"bg-[#ffb425] text-white"},
  };
  const outerTint = (cat:string) => cat==="MATHEMATICS"||cat==="ENGLISH"?{bg:"#e0f7ff",border:"#bae6fd"}:cat==="SCIENCE"||cat==="FILIPINO"?{bg:"#f3e8ff",border:"#d8b4fe"}:{bg:"#ffe4f0",border:"#fbcfe8"};
  const draftCards = draftFiles.map(d=>({doc_id:d.id,category:d.category,title:d.grade,subtitle:d.subtitle,status:"draft",name:d.name,date:d.date,translated_text:""}));

  // Merge: API items first, then local drafts not already in API results, then BASE_CARDS as fallback if nothing loaded
  const merged = apiItems.length > 0
    ? [...apiItems.map(a=>({doc_id:a.doc_id,category:a.category,title:a.grade,subtitle:a.subtitle,status:a.status,name:a.title,date:a.created_at.slice(0,10),translated_text:a.translated_text})),...draftCards.filter(d=>!apiItems.find(a=>a.doc_id===d.doc_id))]
    : isLoading ? [] : [...draftCards, ...BASE_CARDS.map(c=>({doc_id:c.id,category:c.category,title:c.title,subtitle:c.subtitle,status:c.status,name:c.name,date:c.date,translated_text:""}))];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto">
      <motion.h2 initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
        transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
        className={`font-['Montserrat',sans-serif] font-bold text-2xl mb-4 shrink-0 ${isDark?"text-white":"text-[#1e293b]"}`}>
        {tx.myLib}
      </motion.h2>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 pb-6">
          {[1,2,3,4,5,6].map(i=>(
            <div key={i} className={`rounded-[28px] p-3 border animate-pulse h-48 ${isDark?"bg-gray-800 border-gray-700":"bg-[#f1f5f9] border-[#e2e8f0]"}`}/>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 pb-6">
          {merged.map((card,i)=>{
            const rawStatus = (card.status ?? "draft") as S;
            const s = statusMap[rawStatus] ?? statusMap.draft;
            const tint = outerTint(card.category);
            return (
              <motion.div key={card.doc_id}
                initial={{ opacity:0, y:20, scale:0.95 }}
                animate={{ opacity:1, y:0, scale:1 }}
                transition={{ duration:0.4, delay:i*0.07, ease:[0.16,1,0.3,1] }}
                whileHover={{ y:-5, scale:1.016, boxShadow:`0 20px 40px ${tint.bg}` }}
                whileTap={{ scale:0.97 }}
                className={`rounded-[28px] p-3 border ${isDark?"bg-gray-800 border-gray-700":""}`}
                style={isDark?{}:{ background:tint.bg, borderColor:tint.border }}>
                <div className={`rounded-[20px] p-4 mb-3 shadow-sm ${isDark?"bg-gray-700":"bg-white"}`}>
                  <span className="text-[10px] font-['Poppins',sans-serif] font-bold uppercase tracking-widest text-[#2ec2fd]">
                    {card.category}
                  </span>
                  <h3 className={`font-['Nunito',sans-serif] font-black text-base mt-0.5 leading-snug ${isDark?"text-white":"text-[#1e293b]"}`}>{card.title}</h3>
                  <p className={`text-[11px] mt-1 leading-relaxed ${isDark?"text-gray-400":"text-[#94a3b8]"}`}>{card.subtitle}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${s.cls}`}>{s.lbl}</span>
                    <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.92}}
                      onClick={()=>{
                        if (rawStatus==="complete" || rawStatus==="draft") onOpenTranslator({ doc_id:card.doc_id, translated_text:card.translated_text });
                        if (rawStatus==="review") onOpenTranslator({ doc_id:card.doc_id, translated_text:card.translated_text, mode:"proofread" });
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase hover:opacity-80 transition ${s.actCls}`}>{s.actLbl}</motion.button>
                    {/* Delete button for API items */}
                    {apiItems.find(a=>a.doc_id===card.doc_id) && (
                      <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                        onClick={()=>handleDelete(card.doc_id)}
                        className="ml-auto p-1 rounded-lg text-gray-400 hover:text-red-400 transition">
                        <X size={12}/>
                      </motion.button>
                    )}
                  </div>
                </div>
                <div className="px-1">
                  <p className={`font-['Poppins',sans-serif] font-semibold text-xs ${isDark?"text-white":"text-[#1e293b]"}`}>{card.name}</p>
                  <p className={`text-[10px] mt-0.5 ${isDark?"text-gray-500":"text-[#64748b]"}`}>{card.date}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   App Root
───────────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState<View>("login");
  const [lang, setLang] = useState<Lang>("en");
  const [isDark, setIsDark] = useState(false);
  const [draftFiles, setDraftFiles] = useState<DraftFile[]>([]);
  const [userName, setUserName] = useState("User");
  const [authReady, setAuthReady] = useState(false);
  const [translatorPreload, setTranslatorPreload] = useState<{ doc_id: string; translated_text: string; mode?: TransMode } | undefined>();

  // ── Dark mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  // ── Firebase Auth observer ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setUserName(user.displayName || user.email || "User");
        setView("home");
      } else {
        setView("login");
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const handleLogin = (name: string) => { setUserName(name || "User"); setView("home"); };
  const handleSaveDraft = (f: DraftFile) => {
    setDraftFiles(prev => prev.find(p=>p.id===f.id) ? prev : [f,...prev]);
    setView("library");
  };
  const allLibCards = [...draftFiles.map(d=>({id:d.id,name:d.name,category:d.category})),...BASE_CARDS.map(c=>({id:c.id,name:c.name,category:c.category}))];

  // ── Waiting for auth state resolution ─────────────────────────────────────
  if (!authReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center"
        style={{ background: "linear-gradient(180deg,#b0dcff 0%,#cce8ff 50%,#f0f7ff 100%)" }}>
        <div className="w-10 h-10 rounded-full border-4 border-[#2ec2fd] border-t-transparent animate-spin"/>
      </div>
    );
  }

  if (view==="login") return <LoginPage onLogin={handleLogin} lang={lang}/>;

  const toggleDark = () => setIsDark(d=>!d);
  const sharedProps = { lang, setLang, isDark, onToggleDark: toggleDark };

  return (
    <div className="flex h-screen w-screen overflow-hidden p-4 gap-4 transition-colors duration-300"
      style={{ background:isDark?"linear-gradient(135deg,#0a0e1a 0%,#0f1729 50%,#0a0e1a 100%)":"linear-gradient(234deg,rgba(197,179,250,.09) 17%,rgba(43,30,255,.09) 42%,rgba(239,56,171,.09) 78%,rgba(255,210,247,.09) 99%),linear-gradient(90deg,#f9fbff 0%,#f9fbff 100%)" }}>
      <Sidebar active={view} nav={setView} isDark={isDark} onLogout={() => signOut(auth)}/>

      {/* Outer column — header is STATIC (never re-mounts between pages) */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden gap-0">

        {/* ── Static header — rendered once at this level, outside AnimatePresence.
            Page transitions never cause it to unmount or re-animate. ── */}
        <AppHeader lang={lang} setLang={setLang} isDark={isDark} onToggleDark={toggleDark}/>

        {/* Page content — opacity-only fade so the static header above never appears to move */}
        <AnimatePresence mode="wait">
          <motion.main key={view}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.2, ease:"easeInOut" }}
            className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {view==="home"       && <HomePage      {...sharedProps} nav={setView} userName={userName}/>}
            {view==="translator" && <TranslatorPage {...sharedProps} nav={setView} onSaveDraft={handleSaveDraft} preloadItem={translatorPreload}/>}
            {view==="assistant"  && <AssistantPage  {...sharedProps} allLibCards={allLibCards}/>}
            {view==="library"    && <LibraryPage    {...sharedProps} draftFiles={draftFiles} onOpenTranslator={(item)=>{ setTranslatorPreload(item); setView("translator"); }}/>}
          </motion.main>
        </AnimatePresence>

      </div>
    </div>
  );
}
