import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsArrowRight,
  BsBriefcase,
  BsBrush,
  BsCalendarEvent,
  BsCameraVideo,
  BsCheck2Circle,
  BsEnvelope,
  BsGlobe2,
  BsHeartPulse,
  BsImages,
  BsInstagram,
  BsLinkedin,
  BsMic,
  BsPencilSquare,
  BsPersonBadge,
  BsPlusCircle,
  BsSearch,
  BsShieldCheck,
  BsStars,
  BsTrash,
  BsX,
} from "react-icons/bs";
import { Link as ScrollLink } from "react-scroll";
import { toast } from "react-toastify";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { useMyContext } from "../Context/MyContext";
import schoolLogo from "../assets/SheveCity.png";

const SHEVET_CITY_ID = "the-shevet-city";
const INITIAL_VISIBLE_COUNT = 6;
const LOAD_MORE_COUNT = 6;

const container = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const itemVar = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const modalBackdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalPanel = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.2 } },
};

const values = [
  { letter: "I", word: "Integrity" },
  { letter: "P", word: "Professionalism" },
  { letter: "C", word: "Creativity" },
  { letter: "S", word: "Service" },
  { letter: "E", word: "Excellence" },
  { letter: "R", word: "Respect" },
];

const paradigms = [
  { label: "Film & Video", icon: <BsCameraVideo /> },
  { label: "Photography", icon: <BsBrush /> },
  { label: "Podcasts", icon: <BsMic /> },
  { label: "Live Events", icon: <BsCalendarEvent /> },
  { label: "Editorial & Investigations", icon: <BsSearch /> },
  { label: "Music & Performance", icon: <BsImages /> },
];

const departmentPreset = [
  "Leadership",
  "Editorial",
  "Production",
  "Photography",
  "Videography",
  "Podcast",
  "Events",
  "Creative Design",
  "Marketing",
  "Administration",
];

const additionalSections = {
  "Culture & Entertainment": [
    "Sports",
    "Movies",
    "Documentaries",
    "Music",
    "Shows & podcasts",
    "Arts & crafts",
    "Festivals",
  ],
  Lifestyle: ["Travels", "Food & hospitality", "Fashion", "Homes and gardens"],
  Magazine: ["The Legend", "The Mentor", "The Market Place"],
  News: ["Headlines", "Archives", "Inspiration"],
  Shop: ["Goods"],
  Partners: [
    "Corporate organizations",
    "Civil societies",
    "Government bodies",
    "Personalities",
  ],
  "Shevet-city Foundation": [
    "Leadership",
    "Environment",
    "Wildlife & marine conservation",
    "Education",
    "Health & Nutrition",
  ],
};

const primaryColor = "#5A005A";
const primaryDark = "#6A006A";
const accentColor = "#F29A00";
const accentHover = "#FFA500";
const pillLightBg = "#F7EEF7";
const pillLightBorder = "#EAD9EA";

const normalize = (raw) => {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const getUserDisplayName = (user) => {
  return user?.displayName || user?.email?.split("@")[0] || "User";
};

const serializeDoc = (snap) => {
  const data = snap.data() || {};
  let createdAtMs = 0;

  if (typeof data.createdAtMs === "number" && data.createdAtMs > 0) {
    createdAtMs = data.createdAtMs;
  } else if (data.createdAt?.toDate) {
    createdAtMs = data.createdAt.toDate().getTime();
  }

  return {
    id: snap.id,
    ...data,
    createdAtMs,
  };
};

const sortByCreatedDesc = (items = []) => {
  return [...items].sort((a, b) => {
    const aMs = typeof a.createdAtMs === "number" ? a.createdAtMs : 0;
    const bMs = typeof b.createdAtMs === "number" ? b.createdAtMs : 0;
    return bMs - aMs;
  });
};

const getUniqueDepartments = (items) => {
  const departments = new Set((items || []).map((i) => i.department).filter(Boolean));
  return ["All", ...Array.from(departments)];
};

const formatTimestamp = (ts, createdAtMs) => {
  try {
    const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
    if (d) return d.toLocaleString();
    if (typeof createdAtMs === "number" && createdAtMs > 0) {
      return new Date(createdAtMs).toLocaleString();
    }
    return "";
  } catch {
    return "";
  }
};

const cleanUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const textToList = (value) => {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const listToText = (value) => {
  if (Array.isArray(value)) return value.join("\n");
  return String(value || "");
};

const emptyForm = {
  name: "",
  role: "",
  department: "Production",
  bio: "",
  portfolioTitle: "",
  portfolioSummary: "",
  skills: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  linkedin: "",
  status: "published",
};

const fallbackTeamMembers = [
  {
    id: "fallback-founder",
    name: "Madam Semira",
    role: "Founder / CEO",
    department: "Leadership",
    bio:
      "Leads SHEVET-CITY with a vision for thoughtful media, public value, cultural storytelling and creative excellence.",
    portfolioTitle: "Vision, partnerships and editorial direction",
    portfolioSummary:
      "Provides leadership for media strategy, community partnerships, content standards and long-term organisational growth.",
    skills: ["Leadership", "Media Strategy", "Partnerships"],
    imageUrl: "",
    status: "published",
    createdAtMs: 1,
    isFallback: true,
  },
  {
    id: "fallback-editorial",
    name: "Editorial Lead",
    role: "Editor / Research Coordinator",
    department: "Editorial",
    bio:
      "Coordinates news, research, magazine features and value-driven editorial work across SHEVET-CITY platforms.",
    portfolioTitle: "Editorial planning and research desk",
    portfolioSummary:
      "Develops story briefs, manages research, reviews scripts and supports ethical reporting for public-interest media.",
    skills: ["Editing", "Research", "Story Development"],
    imageUrl: "",
    status: "published",
    createdAtMs: 2,
    isFallback: true,
  },
  {
    id: "fallback-production",
    name: "Production Lead",
    role: "Producer / Director",
    department: "Production",
    bio:
      "Manages documentaries, interviews, studio work, field production and behind-the-scenes coordination.",
    portfolioTitle: "Video, documentary and programme production",
    portfolioSummary:
      "Handles production planning, shoot coordination, crew management and quality control for multimedia projects.",
    skills: ["Directing", "Production", "Video Planning"],
    imageUrl: "",
    status: "published",
    createdAtMs: 3,
    isFallback: true,
  },
  {
    id: "fallback-photo",
    name: "Creative Photographer",
    role: "Photographer / Visual Storyteller",
    department: "Photography",
    bio:
      "Captures people, places, events and creative moments that communicate the human side of each story.",
    portfolioTitle: "Events, portraits and visual archives",
    portfolioSummary:
      "Builds visual records for productions, magazine stories, events, campaigns and cultural documentation.",
    skills: ["Photography", "Lighting", "Visual Direction"],
    imageUrl: "",
    status: "published",
    createdAtMs: 4,
    isFallback: true,
  },
  {
    id: "fallback-podcast",
    name: "Podcast Host",
    role: "Host / Audio Producer",
    department: "Podcast",
    bio:
      "Develops conversations, interviews and audio experiences that make ideas accessible and engaging.",
    portfolioTitle: "Shows, podcasts and conversations",
    portfolioSummary:
      "Plans episodes, hosts interviews, edits audio direction and supports distribution for audience growth.",
    skills: ["Hosting", "Audio", "Interviews"],
    imageUrl: "",
    status: "published",
    createdAtMs: 5,
    isFallback: true,
  },
  {
    id: "fallback-design",
    name: "Creative Designer",
    role: "Brand / Graphics Designer",
    department: "Creative Design",
    bio:
      "Shapes the visual identity for stories, campaigns, social media, events, magazine layouts and brand materials.",
    portfolioTitle: "Branding, layouts and digital campaigns",
    portfolioSummary:
      "Creates visual assets for publications, productions, social media, event materials and audience engagement.",
    skills: ["Design", "Branding", "Digital Media"],
    imageUrl: "",
    status: "published",
    createdAtMs: 6,
    isFallback: true,
  },
];

const TeamMemberCard = ({ member, currentUser, onEdit, onDelete }) => {
  const imageSrc = member.imageUrl || member.photoUrl || member.src || schoolLogo;
  const skills = Array.isArray(member.skills)
    ? member.skills
    : String(member.skills || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

  return (
    <motion.article
      variants={itemVar}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden flex flex-col"
    >
      <div className="flex gap-3 p-3">
        <div className="relative w-24 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={imageSrc}
            alt={member.name || "SHEVET-CITY team member"}
            loading="lazy"
            className="w-full h-full object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = schoolLogo;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <span
            className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold border max-w-full truncate"
            style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}
          >
            {member.department || "Media Team"}
          </span>

          <h3 className="mt-2 text-sm md:text-base font-extrabold line-clamp-1" style={{ color: primaryColor }}>
            {member.name || "Team Member"}
          </h3>

          <p className="text-[11px] md:text-xs text-slate-600 font-semibold line-clamp-1">
            {member.role || "Media Professional"}
          </p>

          <p className="mt-2 text-[11px] md:text-xs text-slate-600 leading-relaxed line-clamp-2">
            {member.bio || "No biography has been added yet."}
          </p>
        </div>
      </div>

      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-start gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 text-sm"
              style={{ background: "#FFF6E6", color: accentColor, borderColor: "#FFEDD5" }}
            >
              <BsBriefcase />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold line-clamp-1" style={{ color: primaryColor }}>
                {member.portfolioTitle || "Portfolio"}
              </p>
              <p className="mt-1 text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                {member.portfolioSummary || "Portfolio details will appear here."}
              </p>
            </div>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                style={{ background: "#FFF6E6", color: accentColor, borderColor: "#FFEDD5" }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-600">
          {member.email && (
            <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1 hover:underline" style={{ color: primaryColor }}>
              <BsEnvelope /> Email
            </a>
          )}
          {member.website && (
            <a href={cleanUrl(member.website)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: primaryColor }}>
              <BsGlobe2 /> Portfolio
            </a>
          )}
          {member.instagram && (
            <a href={cleanUrl(member.instagram)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: primaryColor }}>
              <BsInstagram /> Instagram
            </a>
          )}
          {member.linkedin && (
            <a href={cleanUrl(member.linkedin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: primaryColor }}>
              <BsLinkedin /> LinkedIn
            </a>
          )}
        </div>

        {currentUser && !member.isFallback && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit(member)}
              className="inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 font-semibold text-[11px] hover:bg-slate-50"
              style={{ color: primaryColor }}
            >
              <BsPencilSquare /> Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(member)}
              className="inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 font-semibold text-[11px] hover:bg-red-50"
            >
              <BsTrash style={{ color: "#dc2626" }} /> Delete
            </button>
          </div>
        )}

        {currentUser && member.isFallback && (
          <p className="mt-3 text-[10px] text-slate-400 italic">
            Fallback profile. Add this person as a real team member before editing.
          </p>
        )}
      </div>
    </motion.article>
  );
};

const TeamForm = ({
  title,
  fileInputRef,
  form,
  setForm,
  file,
  uploading,
  uploadProgress,
  onPickFile,
  onClose,
  onSubmit,
  submitLabel,
  fileLabel = "Photo *",
  fileHelp = "JPG/PNG recommended. Max 10MB.",
}) => {
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      variants={modalPanel}
      initial="hidden"
      animate="show"
      exit="exit"
      className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
    >
      <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
            Signed-in User
          </p>
          <p className="text-base font-extrabold" style={{ color: primaryColor }}>
            {title}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
          aria-label="Close"
        >
          <BsX className="text-2xl" />
        </button>
      </div>

      <div className="p-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">{fileLabel}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="mt-1 w-full text-sm"
            disabled={uploading}
          />
          <p className="mt-1 text-[11px] text-slate-500">{fileHelp}</p>
          {file && <p className="mt-1 text-[11px] text-slate-600">Selected: {file.name}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Full Name *</label>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Madam Semira"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Role / Position *</label>
          <input
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
            placeholder="e.g. Founder / CEO"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Department</label>
          <select
            value={form.department}
            onChange={(e) => updateField("department", e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
            disabled={uploading}
          >
            {departmentPreset.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Status</label>
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
            disabled={uploading}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">Bio / Staff Write-up</label>
          <textarea
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            rows={4}
            placeholder="Short professional profile of this team member..."
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Portfolio Title</label>
          <input
            value={form.portfolioTitle}
            onChange={(e) => updateField("portfolioTitle", e.target.value)}
            placeholder="e.g. Documentary Production"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Skills / Specialties</label>
          <input
            value={form.skills}
            onChange={(e) => updateField("skills", e.target.value)}
            placeholder="Separate with commas: Editing, Camera, Research"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">Portfolio Summary</label>
          <textarea
            value={form.portfolioSummary}
            onChange={(e) => updateField("portfolioSummary", e.target.value)}
            rows={4}
            placeholder="Describe the kind of projects, assignments or creative work this person handles..."
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="name@example.com"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+234..."
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Website / Portfolio Link</label>
          <input
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Instagram Link</label>
          <input
            value={form.instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
            placeholder="https://instagram.com/..."
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">LinkedIn Link</label>
          <input
            value={form.linkedin}
            onChange={(e) => updateField("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        {uploading && (
          <div className="md:col-span-2">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 transition-all"
                style={{ width: `${uploadProgress}%`, background: primaryColor }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Uploading... {uploadProgress}%</p>
          </div>
        )}

        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={uploading}
            className="flex-1 py-3 rounded-lg font-semibold transition disabled:opacity-60"
            style={{ background: accentColor, color: primaryColor }}
            onMouseOver={(e) => {
              if (!uploading) e.currentTarget.style.background = accentHover;
            }}
            onMouseOut={(e) => {
              if (!uploading) e.currentTarget.style.background = accentColor;
            }}
          >
            {uploading ? "Saving..." : submitLabel}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-3 rounded-lg font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
            style={{ color: primaryColor }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AboutUs = ({
  organizationName = "SHEVET-CITY Communications",
  tagline = "Amplifying stories & ideas",
}) => {
  const { currentUser } = useMyContext();

  const [remoteTeam, setRemoteTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState(null);
  const [activeDept, setActiveDept] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addForm, setAddForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editFile, setEditFile] = useState(null);
  const editFileInputRef = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const breadcrumbs = useMemo(() => ["Home", "About us"], []);


  const teamCollectionRef = useMemo(() => {
    return collection(db, "shevetCity", SHEVET_CITY_ID, "team");
  }, []);

  const loadTeam = useCallback(async () => {
    try {
      setTeamLoading(true);
      setTeamError(null);

      const q = query(teamCollectionRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(serializeDoc);
      setRemoteTeam(sortByCreatedDesc(data));
    } catch (error) {
      console.error("Shevet-City team fetch error:", error);
      setTeamError("Failed to load online team profiles. Showing fallback team structure.");
      setRemoteTeam([]);
    } finally {
      setTeamLoading(false);
    }
  }, [teamCollectionRef]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const sourceTeam = remoteTeam.length > 0 ? remoteTeam : fallbackTeamMembers;

  const teamMembers = useMemo(() => {
    return sourceTeam
      .map((member) => ({
        ...member,
        id: member.id,
        name: member.name || "Team Member",
        role: member.role || "Media Professional",
        department: member.department || "Media Team",
        bio: member.bio || "",
        portfolioTitle: member.portfolioTitle || "Portfolio",
        portfolioSummary: member.portfolioSummary || "",
        skills: Array.isArray(member.skills)
          ? member.skills
          : String(member.skills || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
        imageUrl:
          member.imageUrl || member.photoUrl || member.src || normalize(member.image) || schoolLogo,
        status: member.status || "published",
        createdAtMs: member.createdAtMs || 0,
        createdAt: member.createdAt || null,
      }))
      .filter((member) => currentUser || member.status === "published");
  }, [sourceTeam, currentUser]);

  const departments = useMemo(() => getUniqueDepartments(teamMembers), [teamMembers]);

  const filteredTeam = useMemo(() => {
    if (activeDept === "All") return teamMembers;
    return teamMembers.filter((member) => member.department === activeDept);
  }, [teamMembers, activeDept]);

  const visibleTeam = useMemo(() => {
    return filteredTeam.slice(0, visibleCount);
  }, [filteredTeam, visibleCount]);

  const hasMore = filteredTeam.length > visibleCount;
  const canShowLess = visibleCount > INITIAL_VISIBLE_COUNT;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeDept, teamMembers.length]);

  const uploadToCloudinary = (selectedFile, folderName) => {
    return new Promise((resolve, reject) => {
      if (!selectedFile) {
        resolve("");
        return;
      }

      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        reject(new Error("Upload configuration is missing."));
        return;
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const body = new FormData();
      body.append("file", selectedFile);
      body.append("upload_preset", uploadPreset);
      body.append("folder", folderName);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve(data.secure_url);
          } else {
            reject(new Error(data?.error?.message || "Image upload failed."));
          }
        } catch {
          reject(new Error("Image upload failed."));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed. Check your internet connection."));
      xhr.onabort = () => reject(new Error("Upload was aborted."));
      xhr.send(body);
    });
  };

  const validateImage = (selectedFile, inputElement) => {
    if (!selectedFile) return false;

    if (!selectedFile.type?.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      inputElement.value = "";
      return false;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      inputElement.value = "";
      return false;
    }

    return true;
  };

  const handlePickFile = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!validateImage(selectedFile, e.target)) return;
    setFile(selectedFile);
  };

  const handlePickEditFile = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!validateImage(selectedFile, e.target)) return;
    setEditFile(selectedFile);
  };

  const resetAddForm = () => {
    setAddForm(emptyForm);
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeAdd = () => {
    if (uploading) return;
    setAddOpen(false);
    resetAddForm();
  };

  const resetEditForm = () => {
    setEditId(null);
    setEditForm(emptyForm);
    setEditFile(null);
    setUploadProgress(0);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const closeEdit = () => {
    if (editing) return;
    setEditOpen(false);
    resetEditForm();
  };

  const buildPayload = (form, imageUrl, selectedFile, mode) => {
    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      department: form.department || "Media Team",
      bio: form.bio.trim(),
      portfolioTitle: form.portfolioTitle.trim(),
      portfolioSummary: form.portfolioSummary.trim(),
      skills: textToList(form.skills.replaceAll(",", "\n")),
      email: form.email.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      instagram: form.instagram.trim(),
      linkedin: form.linkedin.trim(),
      status: form.status || "published",
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    };

    if (imageUrl) {
      payload.imageUrl = imageUrl;
      payload.photoUrl = imageUrl;
      payload.src = imageUrl;
      payload.fileName = selectedFile?.name || "";
      payload.fileType = selectedFile?.type || "";
      payload.fileSize = selectedFile?.size || 0;
      payload.storageProvider = "cloudinary";
    }

    if (mode === "create") {
      payload.createdAt = serverTimestamp();
      payload.createdAtMs = Date.now();
      payload.createdBy = currentUser.uid;
      payload.createdByName = getUserDisplayName(currentUser);
      payload.createdByEmail = currentUser.email || "";
    } else {
      payload.updatedBy = currentUser.uid;
      payload.updatedByName = getUserDisplayName(currentUser);
      payload.updatedByEmail = currentUser.email || "";
    }

    return payload;
  };

  const handleAddTeamMember = async () => {
    if (!currentUser) {
      toast.error("Please sign in before adding team members.");
      return;
    }

    if (!addForm.name.trim()) {
      toast.error("Please enter the team member's name.");
      return;
    }

    if (!addForm.role.trim()) {
      toast.error("Please enter the team member's role.");
      return;
    }

    if (!file) {
      toast.error("Please choose a team member photo.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const imageUrl = await uploadToCloudinary(file, "shevet-city/team");
      const payload = buildPayload(addForm, imageUrl, file, "create");

      await addDoc(teamCollectionRef, payload);
      toast.success("Team member added successfully.");
      closeAdd();
      await loadTeam();
    } catch (error) {
      console.error("Error adding Shevet-City team member:", error);
      toast.error(error.message || "Failed to add team member.");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (member) => {
    if (!currentUser) {
      toast.error("Please sign in before editing team members.");
      return;
    }

    if (member?.isFallback || String(member?.id || "").startsWith("fallback-")) {
      toast.info("This is a fallback profile. Add it as a real team member before editing.");
      return;
    }

    setEditId(member.id);
    setEditForm({
      name: member.name || "",
      role: member.role || "",
      department: member.department || "Production",
      bio: member.bio || "",
      portfolioTitle: member.portfolioTitle || "",
      portfolioSummary: member.portfolioSummary || "",
      skills: listToText(member.skills),
      email: member.email || "",
      phone: member.phone || "",
      website: member.website || "",
      instagram: member.instagram || "",
      linkedin: member.linkedin || "",
      status: member.status || "published",
    });
    setEditFile(null);
    setEditOpen(true);
  };

  const handleEditTeamMember = async () => {
    if (!currentUser) {
      toast.error("Please sign in before editing team members.");
      return;
    }

    if (!editId) {
      toast.error("Missing team member id.");
      return;
    }

    if (!editForm.name.trim()) {
      toast.error("Please enter the team member's name.");
      return;
    }

    if (!editForm.role.trim()) {
      toast.error("Please enter the team member's role.");
      return;
    }

    try {
      setEditing(true);
      setUploadProgress(0);

      let imageUrl = "";
      if (editFile) {
        imageUrl = await uploadToCloudinary(editFile, "shevet-city/team");
      }

      const payload = buildPayload(editForm, imageUrl, editFile, "edit");
      const memberRef = doc(db, "shevetCity", SHEVET_CITY_ID, "team", editId);

      await updateDoc(memberRef, payload);
      toast.success("Team member updated successfully.");
      closeEdit();
      await loadTeam();
    } catch (error) {
      console.error("Error updating Shevet-City team member:", error);
      toast.error(error.message || "Failed to update team member.");
    } finally {
      setEditing(false);
    }
  };

  const openDelete = (member) => {
    if (!currentUser) {
      toast.error("Please sign in before deleting team members.");
      return;
    }

    if (member?.isFallback || String(member?.id || "").startsWith("fallback-")) {
      toast.info("This is a fallback profile and cannot be deleted from here.");
      return;
    }

    setDeleteTarget(member);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!currentUser) {
      toast.error("Please sign in before deleting team members.");
      return;
    }

    if (!deleteTarget?.id) {
      toast.error("Missing team member id.");
      return;
    }

    try {
      setDeleting(true);
      const memberRef = doc(db, "shevetCity", SHEVET_CITY_ID, "team", deleteTarget.id);
      await deleteDoc(memberRef);
      toast.success("Team member deleted successfully.");
      closeDelete();
      await loadTeam();
    } catch (error) {
      console.error("Error deleting Shevet-City team member:", error);
      toast.error(error.message || "Failed to delete team member.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section id="about" className="bg-white py-16 md:py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-10"
        >
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-2"
            style={{ color: primaryColor }}
          >
            About us
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {breadcrumbs.map((b, i) => (
              <span key={b} className="inline-flex items-center gap-2">
                <span
                  className={i === breadcrumbs.length - 1 ? "font-semibold" : ""}
                  style={i === breadcrumbs.length - 1 ? { color: primaryColor } : undefined}
                >
                  {b}
                </span>
                {i !== breadcrumbs.length - 1 && <span className="text-slate-300">/</span>}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: primaryColor }}>
                Who we are
              </h2>
              <p className="mt-3 text-sm md:text-base text-slate-600 max-w-3xl leading-relaxed">
                {organizationName} is a multimedia organisation promoting values and ideas through relevant media, arts, entertainment, news, programmes, events, research and development reportage.
              </p>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition shadow-sm"
                style={{ background: accentColor, color: primaryColor }}
                onMouseOver={(e) => (e.currentTarget.style.background = accentHover)}
                onMouseOut={(e) => (e.currentTarget.style.background = accentColor)}
              >
                <BsPlusCircle className="text-base" />
                Add Team Member
              </button>
            ) : (
              <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-4 py-2">
                Sign in to add or manage team profiles.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 lg:grid-cols-5 items-start mb-14"
        >
          <motion.div
            variants={itemVar}
            className="lg:col-span-2 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm p-4 md:p-5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-2" style={{ color: primaryColor }}>
                    <BsPersonBadge className="inline-block mr-2" />
                    Media Team
                  </p>
                  <h3 className="text-xl md:text-2xl font-extrabold leading-tight" style={{ color: primaryColor }}>
                    Team portfolio cards
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed">
                    Staff profiles, roles, departments, portfolio summaries, skills and links are managed here by signed-in users.
                  </p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  {teamLoading && <p className="text-xs font-semibold text-slate-500">Loading team...</p>}
                  {teamError && <p className="text-xs font-semibold text-red-600 max-w-[220px] sm:text-right">{teamError}</p>}
                  {currentUser && (
                    <p className="text-[11px] font-semibold" style={{ color: primaryColor }}>
                      CRUD mode active
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => {
                  const active = dept === activeDept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setActiveDept(dept)}
                      className="px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold border transition"
                      style={
                        active
                          ? { background: primaryColor, color: "#fff", borderColor: primaryColor }
                          : { background: "#fff", color: primaryColor, borderColor: "#e6e6e6" }
                      }
                      onMouseOver={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = accentColor;
                          e.currentTarget.style.background = "#fff7ec";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = "#e6e6e6";
                          e.currentTarget.style.background = "#fff";
                        }
                      }}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>

              <motion.div
                variants={container}
                initial="hidden"
                animate={!teamLoading ? "show" : "hidden"}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
              >
                {visibleTeam.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    currentUser={currentUser}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
              </motion.div>

              {!teamLoading && filteredTeam.length > INITIAL_VISIBLE_COUNT && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredTeam.length))}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition shadow-sm"
                      style={{ background: primaryColor, color: "#fff" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = primaryDark)}
                      onMouseOut={(e) => (e.currentTarget.style.background = primaryColor)}
                    >
                      More Team Members
                    </button>
                  )}

                  {canShowLess && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition shadow-sm"
                      style={{ background: "#fff", color: primaryColor, border: `1px solid ${primaryColor}` }}
                    >
                      Show Less
                    </button>
                  )}
                </div>
              )}

              {!teamLoading && filteredTeam.length === 0 && (
                <div className="rounded-2xl bg-white border border-slate-100 p-5 text-center text-sm text-slate-600">
                  No team profiles yet. {currentUser ? "Click “Add Team Member” to create one." : "Sign in to add team profiles."}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={itemVar}
            className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col justify-center"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}
              >
                <BsStars className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>
                  About {organizationName}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{tagline}</p>
              </div>
            </div>

            <p className="mt-5 text-sm md:text-base text-slate-600 leading-relaxed">
              {organizationName} is a multimedia organisation that promotes values and ideas through relevant media, cutting across arts and entertainment, news, programmes and events, research, development reportage and public-interest storytelling.
            </p>
            <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
              We produce content and run initiatives that inform, inspire and engage communities — from documentary films and podcasts to investigative features, live events and creative productions.
            </p>
            <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
              Our work places emphasis on integrity, rigorous research, creative storytelling and measurable public impact. Through partnerships, capacity building and community-focused projects, we strengthen local media ecosystems and amplify voices that matter.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Multimedia", "Production, podcasts and video stories"],
                ["Editorial", "News, research and magazine features"],
                ["Community", "Events, campaigns and partnerships"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-extrabold" style={{ color: primaryColor }}>{title}</p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            variants={itemVar}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-3">
              <img src={schoolLogo} alt="Shevet-city logo" className="w-full h-full object-contain" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold" style={{ color: primaryColor }}>
              {organizationName}
            </h3>
            <p className="mt-1 text-sm font-semibold italic" style={{ color: accentColor }}>
              {tagline}
            </p>

            <div className="mt-5 w-full rounded-xl bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-center gap-2 font-extrabold" style={{ color: primaryColor }}>
                <BsStars />
                <span>Core Values</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {values.map((v) => (
                  <div key={v.letter} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold" style={{ background: primaryColor, color: "#fff" }}>
                      {v.letter}
                    </div>
                    <p className="text-sm font-extrabold text-left" style={{ color: primaryColor }}>
                      {v.word}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-2 grid gap-6">
            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border" style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}>
                    <BsShieldCheck />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold" style={{ color: primaryColor }}>Our Mission</h3>
                    <p className="text-sm text-slate-600 mt-1">What we exist to achieve.</p>
                  </div>
                </div>
                <p className="mt-4 text-sm md:text-base text-slate-700 leading-relaxed">
                  To promote values and ideas through high-quality, ethical multimedia storytelling that educates, engages and drives positive change.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border" style={{ background: "#FFF6E6", color: accentColor, borderColor: "#FFEDD5" }}>
                    <BsGlobe2 />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold" style={{ color: primaryColor }}>Our Vision</h3>
                    <p className="text-sm text-slate-600 mt-1">Where we are headed.</p>
                  </div>
                </div>
                <p className="mt-4 text-sm md:text-base text-slate-700 leading-relaxed">
                  To be a leading multimedia organisation recognized for integrity, creativity and measurable impact across arts, journalism and public-interest media.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shrink-0" style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}>
                  <BsHeartPulse />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>
                    Why {organizationName}?
                  </h3>
                  <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
                    We combine creative production, investigative rigor and community focus to produce media that matters — delivered across platforms for maximum reach and effect.
                  </p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {[
                      "Multimedia storytelling & production",
                      "Investigative and research-driven reporting",
                      "Cross-platform distribution",
                      "Creative partnerships & community collaborations",
                      "Capacity building and training for local media",
                      "Audience-focused, impact-driven campaigns",
                    ].map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1" style={{ color: accentColor }}><BsCheck2Circle /></span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
            >
              <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>Our Focus Areas</h3>
              <p className="mt-2 text-sm md:text-base text-slate-600 max-w-3xl">
                We work across production, journalism, events, research and training to create content and initiatives that educate, inform and entertain.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paradigms.map((x) => (
                  <div key={x.label} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: primaryColor, color: "#fff" }}>
                      {x.icon}
                    </div>
                    <p className="text-sm font-extrabold" style={{ color: primaryColor }}>{x.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
            >
              <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>
                Editorial & Content Sections
              </h3>
              <p className="mt-2 text-sm md:text-base text-slate-600">
                Our editorial and content verticals span culture, lifestyle, magazine features, news and more.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(additionalSections).map(([section, items]) => (
                  <div key={section} className="rounded-xl border border-slate-100 p-4 bg-slate-50">
                    <h4 className="font-extrabold" style={{ color: primaryColor }}>{section}</h4>
                    <ul className="mt-2 text-sm text-slate-700 space-y-1">
                      {items.map((it) => (
                        <li key={it} className="flex items-start gap-2">
                          <span className="mt-1" style={{ color: accentColor }}><BsArrowRight /></span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="rounded-2xl overflow-hidden border shadow-sm"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryDark} 60%, ${accentColor})`, borderColor: "rgba(0,0,0,0.04)" }}
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white">Partner with SHEVET-CITY</h3>
                  <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">
                    Work with us on stories, productions, events, media campaigns and community-focused projects.
                  </p>
                </div>
                <ScrollLink
                  to="contact"
                  spy={true}
                  smooth={true}
                  offset={-120}
                  duration={500}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-sm font-extrabold cursor-pointer hover:bg-slate-50 transition"
                  style={{ color: primaryColor }}
                >
                  Contact us <BsArrowRight />
                </ScrollLink>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addOpen && currentUser && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeAdd();
            }}
          >
            <TeamForm
              title="Add Team Member"
              fileInputRef={fileInputRef}
              form={addForm}
              setForm={setAddForm}
              file={file}
              uploading={uploading}
              uploadProgress={uploadProgress}
              onPickFile={handlePickFile}
              onClose={closeAdd}
              onSubmit={handleAddTeamMember}
              submitLabel="Save Team Member"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editOpen && currentUser && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeEdit();
            }}
          >
            <TeamForm
              title="Edit Team Member"
              fileInputRef={editFileInputRef}
              form={editForm}
              setForm={setEditForm}
              file={editFile}
              uploading={editing}
              uploadProgress={uploadProgress}
              onPickFile={handlePickEditFile}
              onClose={closeEdit}
              onSubmit={handleEditTeamMember}
              submitLabel="Update Team Member"
              fileLabel="Replace Photo"
              fileHelp="Leave empty to keep current image. JPG/PNG recommended. Max 10MB."
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteOpen && currentUser && deleteTarget && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDelete();
            }}
          >
            <motion.div
              variants={modalPanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">Confirm Delete</p>
                  <p className="text-base font-extrabold" style={{ color: primaryColor }}>Delete Team Member</p>
                </div>
                <button
                  type="button"
                  onClick={closeDelete}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
                  aria-label="Close"
                >
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="p-5">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This removes the profile from the online team section.
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={closeDelete}
                    disabled={deleting}
                    className="flex-1 py-3 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-60"
                    style={{ color: primaryColor }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AboutUs;
