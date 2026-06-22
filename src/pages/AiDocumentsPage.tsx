import jsPDF from "jspdf";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit3,
  FileText,
  History,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import TeacherHeader from "../components/TeacherHeader";
import { useAuth } from "../lib/AuthContext";
import {
  generateCV,
  generateCoverLetter,
  type DocumentTemplate,
} from "../services/base";
import {
  useFetchJobs,
  useFetchMyApplications,
  useFetchMyTeacherProfile,
} from "../services/queries";

// ── Types ─────────────────────────────────────────────────────────

type DocType = "cv" | "cover-letter";

interface HistoryItem {
  id: string;
  docType: DocType;
  template: DocumentTemplate;
  text: string;
  generatedAt: Date;
  jobTitle?: string;
}

const TEMPLATES: DocumentTemplate[] = ["Professional", "Modern", "Entry Level"];

const templateDesc: Record<DocumentTemplate, string> = {
  Professional: "Formal tone, clear sections, full sentences.",
  Modern: "Confident, bullet-driven, impact-first.",
  "Entry Level": "Growth-focused, concise, one-page style.",
};

// ── Document renderer ─────────────────────────────────────────────
// Parses the plain-text AI output and renders it as a formatted document

type ParsedLine =
  | { kind: "section"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string }
  | { kind: "blank" };

function parseDocumentLines(raw: string): ParsedLine[] {
  return raw.split("\n").map((line): ParsedLine => {
    const t = line.trim();
    if (!t) return { kind: "blank" };
    // ALL CAPS line with no lowercase = section header
    if (/^[A-Z][A-Z\s&\/\-:]+$/.test(t) && t.length >= 4 && t.length <= 60)
      return { kind: "section", text: t };
    // Bullet / dash list item
    if (/^[-•*]\s/.test(t)) return { kind: "bullet", text: t.replace(/^[-•*]\s/, "") };
    return { kind: "text", text: t };
  });
}

interface DocumentRendererProps {
  text: string;
  docType: DocType;
  template: DocumentTemplate;
  editMode: boolean;
  onTextChange: (t: string) => void;
}

const DocumentRenderer = ({
  text,
  docType,
  template,
  editMode,
  onTextChange,
}: DocumentRendererProps) => {
  const lines = parseDocumentLines(text);

  const accentColor =
    template === "Modern"
      ? "#0ea5e9"
      : template === "Entry Level"
        ? "#2563eb"
        : "#184e77";

  if (editMode) {
    return (
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="h-[700px] w-full resize-none rounded-none border-0 bg-transparent p-0 font-mono text-sm leading-relaxed text-slate-700 focus:outline-none"
        spellCheck
      />
    );
  }

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.kind === "blank") return <div key={i} className="h-3" />;
        if (line.kind === "section")
          return (
            <div key={i} className="pt-4 pb-1">
              <h2
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                {line.text}
              </h2>
              <div
                className="mt-1 h-px w-full"
                style={{ backgroundColor: accentColor, opacity: 0.25 }}
              />
            </div>
          );
        if (line.kind === "bullet")
          return (
            <div key={i} className="flex gap-2 pl-2 text-sm text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{line.text}</span>
            </div>
          );
        return (
          <p key={i} className="text-sm leading-relaxed text-slate-700">
            {line.text}
          </p>
        );
      })}
      {docType === "cv" && (
        <p className="pt-4 text-xs italic text-slate-400">
          References available on request.
        </p>
      )}
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getMissingFields(profile: ReturnType<typeof useFetchMyTeacherProfile>["data"]) {
  if (!profile) return [];
  const missing: string[] = [];
  if (!profile.bio) missing.push("Bio");
  if (!profile.subjectExpertise?.length) missing.push("Subject expertise");
  if (!profile.teachingRecords?.length) missing.push("Teaching history");
  if (!profile.teachingLevel) missing.push("Teaching level");
  if (!profile.state) missing.push("State");
  return missing;
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Main page ─────────────────────────────────────────────────────

const AiDocumentsPage = () => {
  const { isAuthenticated } = useAuth();

  const profileQuery = useFetchMyTeacherProfile(isAuthenticated);
  const myApplicationsQuery = useFetchMyApplications(isAuthenticated);
  const allJobsQuery = useFetchJobs();

  const profile = profileQuery.data;
  const missingFields = getMissingFields(profile);

  // ── State ──────────────────────────────────────────────────────

  const [docType, setDocType] = useState<DocType>("cv");
  const [template, setTemplate] = useState<DocumentTemplate>("Professional");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [showAppliedJobs, setShowAppliedJobs] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const docRef = useRef<HTMLDivElement>(null);

  const appliedJobIds = useMemo(
    () => new Set((myApplicationsQuery.data ?? []).map((application) => application.jobId)),
    [myApplicationsQuery.data],
  );

  const allJobOptions = useMemo(
    () =>
      (allJobsQuery.data ?? [])
        .filter((job) => job.isActive !== false)
        .map((job) => ({
          _id: job._id,
          title: job.title,
          institutionName: job.institutionName ?? "Unknown school",
          location: job.location,
          subject: job.subject ?? "General",
          employmentType: job.employmentType,
          level: job.level,
          hasApplied: appliedJobIds.has(job._id),
        })),
    [allJobsQuery.data, appliedJobIds],
  );

  const schoolOptions = useMemo(
    () =>
      Array.from(
        new Set(allJobOptions.map((job) => job.institutionName).filter(Boolean)),
      ).sort(),
    [allJobOptions],
  );

  const filteredJobOptions = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    return allJobOptions.filter((job) => {
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.subject.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.institutionName.toLowerCase().includes(q);
      const matchesSchool =
        schoolFilter === "ALL" || job.institutionName === schoolFilter;
      const matchesApplied = showAppliedJobs || !job.hasApplied;
      return matchesSearch && matchesSchool && matchesApplied;
    });
  }, [allJobOptions, jobSearch, schoolFilter, showAppliedJobs]);

  const availableJobOptions = filteredJobOptions.filter((job) => !job.hasApplied);
  const appliedJobOptions = filteredJobOptions.filter((job) => job.hasApplied);
  const jobOptions = allJobOptions;

  // ── Handlers ───────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (docType === "cover-letter" && !selectedJobId) {
      toast.error("Please select a job for the cover letter.");
      return;
    }
    setLoading(true);
    setResult("");
    setErrorMsg("");
    setEditMode(false);
    try {
      const res =
        docType === "cv"
          ? await generateCV({ template, additionalContext })
          : await generateCoverLetter({ jobId: selectedJobId, template, additionalContext });

      setResult(res.document);

      // Save to in-session history (max 10)
      const selectedJob = jobOptions.find((j) => j._id === selectedJobId);
      setHistory((prev) =>
        [
          {
            id: Date.now().toString(),
            docType,
            template,
            text: res.document,
            generatedAt: new Date(),
            jobTitle: selectedJob?.title,
          },
          ...prev,
        ].slice(0, 10)
      );
    } catch (err: unknown) {
      let message = "Generation failed. Please try again.";
      if (err && typeof err === "object") {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        message = e.response?.data?.message ?? e.message ?? message;
      }
      setErrorMsg(message);
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!docRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const name = profile ? `${profile.firstName} ${profile.lastName}` : "Document";
    const title = docType === "cv" ? `CV — ${name}` : `Cover Letter — ${name}`;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Georgia, serif; font-size: 13px; color: #1e293b; line-height: 1.7; padding: 40px; max-width: 750px; margin: 0 auto; }
            h2 { font-size: 10px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #184e77; margin: 20px 0 4px; }
            hr { border: none; border-top: 1px solid #cbd5e1; margin-bottom: 8px; }
            p { margin: 2px 0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>${docRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = margin;

      const checkPage = (needed: number) => {
        if (y + needed > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // ── Header: name + contact ──────────────────────────────
      if (profile) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(24, 78, 119);
        pdf.text(`${profile.firstName} ${profile.lastName}`, margin, y);
        y += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        const subLine = [
          profile.subjectExpertise?.map((s) => s.subject).join(" · ") || "Teacher",
          `${profile.location}${profile.state ? ", " + profile.state : ""}`,
          profile.email,
        ].join("   |   ");
        pdf.text(subLine, margin, y, { maxWidth: contentW });
        y += 5;

        // Divider
        pdf.setDrawColor(24, 78, 119);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, pageW - margin, y);
        y += 8;
      }

      // ── Body: parse and render sections ────────────────────
      const lines = result.split("\n");

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
          y += 3;
          continue;
        }

        // ALL CAPS section header
        if (/^[A-Z][A-Z\s&\/\-:]+$/.test(line) && line.length >= 4 && line.length <= 60) {
          checkPage(12);
          y += 2;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(24, 78, 119);
          pdf.text(line, margin, y);
          y += 2;
          pdf.setDrawColor(200, 214, 229);
          pdf.setLineWidth(0.3);
          pdf.line(margin, y, pageW - margin, y);
          y += 5;
          continue;
        }

        // Bullet / dash list item
        if (/^[-•*]\s/.test(line)) {
          const bulletText = line.replace(/^[-•*]\s/, "");
          const wrapped = pdf.splitTextToSize(`• ${bulletText}`, contentW - 4);
          checkPage(wrapped.length * 5 + 2);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(30, 41, 59);
          pdf.text(wrapped, margin + 3, y);
          y += wrapped.length * 5 + 1;
          continue;
        }

        // Normal text
        const wrapped = pdf.splitTextToSize(line, contentW);
        checkPage(wrapped.length * 5 + 2);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text(wrapped, margin, y);
        y += wrapped.length * 5 + 1;
      }

      // ── Footer on each page ─────────────────────────────────
      const totalPages = (pdf as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          `Generated by EduStaff Connect   ·   Page ${p} of ${totalPages}`,
          pageW / 2,
          pageH - 10,
          { align: "center" }
        );
      }

      const name = profile
        ? `${profile.firstName}-${profile.lastName}`
        : "Document";
      const fileName =
        docType === "cv"
          ? `CV-${name}.pdf`
          : `Cover-Letter-${name}.pdf`;
      pdf.save(fileName);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("PDF export failed. Try the Print option instead.");
    } finally {
      setExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <TeacherHeader active="ai-docs" />

      <main className="mx-auto max-w-6xl px-4 py-8">

        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#184e77] text-white shadow">
              <Sparkles size={20} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AI Documents</h1>
              <p className="text-sm text-slate-500">Generate professional CVs and cover letters from your profile.</p>
            </div>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <History size={15} />
              History ({history.length})
            </button>
          )}
        </div>

        {/* History panel */}
        {showHistory && history.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">Recent generations this session</h2>
              <button type="button" onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:border-[#184e77]/30 hover:bg-sky-50"
                  onClick={() => {
                    setResult(item.text);
                    setDocType(item.docType);
                    setTemplate(item.template);
                    setShowHistory(false);
                    setEditMode(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={15} className="text-[#184e77]" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {item.docType === "cv" ? "CV" : "Cover Letter"} — {item.template}
                        {item.jobTitle ? ` · ${item.jobTitle}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">{wordCount(item.text)} words</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    {timeAgo(item.generatedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* ── LEFT: Controls ─────────────────────────────────── */}
          <div className="space-y-4">

            {/* Profile warning */}
            {missingFields.length > 0 && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-800">Profile incomplete</p>
                  <p className="mt-0.5 text-amber-700">
                    Missing: {missingFields.join(", ")}.{" "}
                    <Link to="/dashboard" className="font-semibold underline">
                      Update <ChevronRight size={10} className="inline" />
                    </Link>
                  </p>
                  <p className="mt-1 text-amber-600">Use the context box below to fill gaps.</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              {/* Doc type */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Document type</p>
                <div className="flex gap-2">
                  {(["cv", "cover-letter"] as DocType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setDocType(t); setResult(""); setErrorMsg(""); setEditMode(false); }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm font-semibold transition ${
                        docType === t
                          ? "border-[#184e77] bg-[#184e77] text-white"
                          : "border-slate-200 text-slate-600 hover:border-[#184e77]/40"
                      }`}
                    >
                      <FileText size={14} />
                      {t === "cv" ? "CV / Resume" : "Cover Letter"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Template style</p>
                <div className="space-y-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => setTemplate(tmpl)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                        template === tmpl
                          ? "border-[#184e77] bg-sky-50 ring-1 ring-[#184e77]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`size-2 rounded-full ${template === tmpl ? "bg-[#184e77]" : "bg-slate-300"}`} />
                      <div>
                        <p className={`text-sm font-semibold ${template === tmpl ? "text-[#184e77]" : "text-slate-700"}`}>{tmpl}</p>
                        <p className="text-xs text-slate-400">{templateDesc[tmpl]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Job selector */}
              {docType === "cover-letter" && (
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Select job <span className="text-red-500">*</span>
                  </label>
                  {allJobOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No jobs found.{" "}
                      <Link to="/jobs" className="font-semibold text-[#184e77] underline">Browse listings</Link>
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid gap-2">
                        <label className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={jobSearch}
                            onChange={(e) => setJobSearch(e.target.value)}
                            placeholder="Search title, subject, location"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#184e77] focus:ring-1 focus:ring-[#184e77]"
                          />
                        </label>
                        <select
                          value={schoolFilter}
                          onChange={(e) => setSchoolFilter(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#184e77] focus:ring-1 focus:ring-[#184e77]"
                        >
                          <option value="ALL">All schools</option>
                          {schoolOptions.map((school) => (
                            <option key={school} value={school}>
                              {school}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-500">
                          <input
                            type="checkbox"
                            checked={showAppliedJobs}
                            onChange={(e) => setShowAppliedJobs(e.target.checked)}
                            className="size-4 accent-[#184e77]"
                          />
                          Show jobs I already applied to
                        </label>
                      </div>

                      {filteredJobOptions.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-[#f8fafc] p-3 text-xs text-slate-500">
                          No jobs match these filters. Try another school or turn on already-applied jobs.
                        </div>
                      ) : (
                        <select
                          value={selectedJobId}
                          onChange={(e) => setSelectedJobId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#184e77] focus:outline-none focus:ring-1 focus:ring-[#184e77]"
                        >
                          <option value="">-- Choose a job --</option>
                          {availableJobOptions.length > 0 && (
                            <optgroup label="Available jobs">
                              {availableJobOptions.map((j) => (
                                <option key={j._id} value={j._id}>
                                  {j.title} — {j.institutionName}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {appliedJobOptions.length > 0 && (
                            <optgroup label="Already applied">
                              {appliedJobOptions.map((j) => (
                                <option key={j._id} value={j._id}>
                                  {j.title} — {j.institutionName} (already applied)
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      )}
                      <p className="text-[11px] leading-5 text-slate-400">
                        Cover letters are meant to help before you apply, so available jobs are shown first.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional context */}
              <div className="mb-4">
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <User size={12} /> Additional context
                  <span className="font-normal normal-case text-slate-400">(recommended)</span>
                </label>
                <p className="mb-1.5 text-xs text-slate-400">
                  Awards, certifications, years of experience, specialisations, school types, languages spoken…
                </p>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={5}
                  placeholder={
                    docType === "cv"
                      ? "e.g. 5 years at a private secondary school in Lagos, trained in CBC curriculum, won best teacher award 2022, fluent in Yoruba and English..."
                      : "e.g. I am passionate about this school's mission, available to start immediately, relocating to Lagos..."
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-[#184e77] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#184e77]"
                />
              </div>

              {/* Profile data preview */}
              {profile && (
                <details className="mb-4 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                  <summary className="cursor-pointer px-3 py-2 font-semibold text-slate-500 hover:text-slate-700">
                    What the AI already knows ▾
                  </summary>
                  <div className="space-y-1 border-t border-slate-100 px-3 py-2 text-slate-600">
                    <p><span className="font-medium">Name:</span> {profile.firstName} {profile.lastName}</p>
                    <p><span className="font-medium">Location:</span> {profile.location}{profile.state ? `, ${profile.state}` : ""}</p>
                    <p><span className="font-medium">Level:</span> {profile.level} · Teaching: {profile.teachingLevel ?? "—"}</p>
                    <p><span className="font-medium">Subjects:</span> {profile.subjectExpertise?.map((s) => s.subject).join(", ") || "None"}</p>
                    <p><span className="font-medium">Records:</span> {profile.teachingRecords?.length ? `${profile.teachingRecords.length} record(s)` : "None"}</p>
                    <p><span className="font-medium">NYSC:</span> {profile.nyscStatus ?? "—"} · Practice: {profile.teachingPracticeStatus ?? "—"}</p>
                  </div>
                </details>
              )}

              {/* Generate button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || (docType === "cover-letter" && !selectedJobId)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#184e77] py-3 text-sm font-bold text-white shadow transition hover:bg-[#1a6b9a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating… (~15 seconds)
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate {docType === "cv" ? "CV" : "Cover Letter"}
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">Always uses your latest profile from the database.</p>
            </div>
          </div>

          {/* ── RIGHT: Document preview ─────────────────────────── */}
          <div>

            {/* Error */}
            {errorMsg && (
              <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <div className="text-sm">
                  <p className="font-semibold text-red-700">Generation failed</p>
                  <p className="mt-0.5 text-red-600 text-xs">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !errorMsg && (
              <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
                <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-slate-100">
                  <FileText size={28} className="text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-500">Your document will appear here</p>
                <p className="mt-1 text-sm text-slate-400">Fill in the form and click Generate</p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-[#184e77]" />
                  <span className="text-sm font-semibold text-slate-600">AI is writing your document…</span>
                </div>
                {[100, 70, 85, 60, 90, 55, 75, 65, 80, 50].map((w, i) => (
                  <div
                    key={i}
                    className="mb-2.5 h-3 animate-pulse rounded-full bg-slate-100"
                    style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Document result */}
            {result && !loading && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-[#184e77]" />
                    <span className="text-sm font-bold text-slate-700">
                      {docType === "cv" ? "CV" : "Cover Letter"} — {template}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">
                      {wordCount(result)} words
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditMode(!editMode)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        editMode
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Edit3 size={12} />
                      {editMode ? "Done editing" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      <Printer size={12} />
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={exporting}
                      className="flex items-center gap-1.5 rounded-lg bg-[#184e77] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a6b9a] disabled:opacity-60"
                    >
                      {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      {exporting ? "Exporting…" : "Download PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:opacity-50"
                    >
                      <RefreshCw size={12} />
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Document paper */}
                <div className="p-6">
                  <div
                    ref={docRef}
                    className="mx-auto min-h-[800px] rounded-lg bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
                    style={{ maxWidth: 680, fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    {/* Document header */}
                    {profile && (
                      <div className="mb-6 border-b-2 border-[#184e77] pb-4">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                          {profile.firstName} {profile.lastName}
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {profile.subjectExpertise?.map((s) => s.subject).join(" · ") || "Teacher"} ·{" "}
                          {profile.location}{profile.state ? `, ${profile.state}` : ""}
                        </p>
                        <p className="text-xs text-slate-400">{profile.email}</p>
                      </div>
                    )}

                    <DocumentRenderer
                      text={result}
                      docType={docType}
                      template={template}
                      editMode={editMode}
                      onTextChange={setResult}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiDocumentsPage;
