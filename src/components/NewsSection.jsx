import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsArrowRight,
  BsX,
  BsPlusCircle,
  BsPencilSquare,
  BsTrash,
} from "react-icons/bs";
import { toast } from "react-toastify";

// Firestore imports commented out — running in hardcoded/demo mode.
/*
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebase";
*/

import { useMyContext } from "../Context/MyContext";

const SCHOOL_ID = "main";

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
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
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: { duration: 0.2 },
  },
};

const getUniqueCategories = (items) => {
  const cats = new Set((items || []).map((i) => i.category).filter(Boolean));
  return ["All", ...Array.from(cats)];
};

const categoriesPreset = [
  "Admissions",
  "Events",
  "Academics",
  "Sports",
  "STEM",
  "Facilities",
  "General",
];

const formatDate = (val, createdAtMs) => {
  try {
    if (val?.toDate) return val.toDate().toLocaleDateString();
    if (val instanceof Date) return val.toLocaleDateString();
    if (typeof val === "string") return val;
    if (typeof createdAtMs === "number" && createdAtMs > 0) {
      return new Date(createdAtMs).toLocaleDateString();
    }
    return "";
  } catch {
    return "";
  }
};

/**
 * Hardcoded news for SHEVET-CITY Media (demo/local mode).
 * Update this array to add/remove demo posts.
 */
const HARDCODED_NEWS = [
  {
    id: "hc-1",
    title: "SHEVET-CITY Launches New Podcast Series",
    category: "Events",
    highlight: "Behind the scenes conversations with local creators.",
    content:
      "SHEVET-CITY Media is proud to announce a new weekly podcast where we interview filmmakers, journalists, and creatives from the community. Episodes drop every Monday and will cover storytelling, production tips, and career journeys.",
    createdAtMs: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
    createdAt: null,
  },
  {
    id: "hc-2",
    title: "Photo Feature: Community Arts Day",
    category: "Events",
    highlight: "A day of murals, music, and collaborative art.",
    content:
      "Our photographers captured inspiring moments from Community Arts Day — families painting murals, youth performances, and live installations. View the full gallery in the 'Gallery' section.",
    createdAtMs: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    createdAt: null,
  },
  {
    id: "hc-3",
    title: "Call for Contributors: Local Editorials",
    category: "General",
    highlight: "We want to hear your voice.",
    content:
      "SHEVET-CITY is opening submissions for local editorial pieces. If you're a writer or commentator with a perspective on culture, society, or media, submit a 600–1,200 word piece to editorial@shevecitymedia.com.",
    createdAtMs: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    createdAt: null,
  },
  {
    id: "hc-4",
    title: "New Art Residency Partnership",
    category: "STEM",
    highlight: "Cross-disciplinary residency for media & tech creators.",
    content:
      "We've partnered with local tech labs to offer a two-month residency that pairs media makers with technologists to explore interactive storytelling and AR experiences.",
    createdAtMs: Date.now(),
    createdAt: null,
  },
];

const NewsSection = ({
  title = "Latest from SHEVET-CITY Media",
  subtitle = "Stay informed about updates, releases, and events from SHEVET-CITY Media.",
}) => {
  // useMyContext still provides admin state and optional external news,
  // but in demo/hardcoded mode we use the local HARDCODED_NEWS and in-memory updates.
  const { /* news, */ newsLoading, newsError, isAdmin, currentUser } =
    useMyContext();

  // Local in-memory news list (starts from hardcoded data).
  const [newsList, setNewsList] = useState(() => HARDCODED_NEWS);

  // items for display (derived from local list)
  const items = useMemo(() => (Array.isArray(newsList) ? newsList : []), [
    newsList,
  ]);

  const [activeCat, setActiveCat] = useState("All");
  const [openItem, setOpenItem] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newHighlight, setNewHighlight] = useState("");
  const [newContent, setNewContent] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editHighlight, setEditHighlight] = useState("");
  const [editContent, setEditContent] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories = useMemo(() => getUniqueCategories(items), [items]);

  const filtered = useMemo(() => {
    if (activeCat === "All") return items;
    return items.filter((x) => x.category === activeCat);
  }, [items, activeCat]);

  const shouldShowCards = !newsLoading;
  const gridAnimateState = shouldShowCards ? "visible" : "hidden";

  // Lock page scroll when read-more modal is open
  useEffect(() => {
    if (!openItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [openItem]);

  const resetAddForm = () => {
    setNewTitle("");
    setNewCategory("General");
    setNewHighlight("");
    setNewContent("");
  };

  const closeAdd = () => {
    if (savingAdd) return;
    setAddOpen(false);
    resetAddForm();
  };

  const openEdit = (item) => {
    if (!isAdmin) return;
    setEditId(item?.id || null);
    setEditTitle(item?.title || "");
    setEditCategory(item?.category || "General");
    setEditHighlight(item?.highlight || "");
    setEditContent(item?.content || "");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditOpen(false);
    setEditId(null);
    setEditTitle("");
    setEditCategory("General");
    setEditHighlight("");
    setEditContent("");
  };

  const openDelete = (item) => {
    if (!isAdmin) return;
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  // Demo: add news to in-memory list (no Firestore writes)
  const handleAddNews = async () => {
    if (!isAdmin) return toast.error("Only admins can add news.");
    if (!currentUser?.uid) return toast.error("Please sign in first.");
    if (!newTitle.trim()) return toast.error("Please enter a title.");
    if (!newCategory) return toast.error("Please select a category.");
    if (!newContent.trim()) return toast.error("Please enter the news content.");

    try {
      setSavingAdd(true);
      const toastId = toast.loading("Publishing news (demo mode)...");

      // Demo behavior: insert into local state
      const newItem = {
        id: `local-${Date.now()}`,
        title: newTitle.trim(),
        category: newCategory,
        highlight: newHighlight.trim(),
        content: newContent.trim(),
        createdAtMs: Date.now(),
        createdAt: null,
        createdBy: currentUser.uid,
      };

      setNewsList((prev) => [newItem, ...prev]);

      toast.update(toastId, {
        render: "News published (local) ✅",
        type: "success",
        isLoading: false,
        autoClose: 1500,
      });

      closeAdd();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Failed to publish news.");
    } finally {
      setSavingAdd(false);
    }
  };

  // Demo: update news in local state (no Firestore writes)
  const handleEditSave = async () => {
    if (!isAdmin) return toast.error("Only admins can edit news.");
    if (!currentUser?.uid) return toast.error("Please sign in first.");
    if (!editId) return toast.error("Missing news item id.");
    if (!editTitle.trim()) return toast.error("Please enter a title.");
    if (!editContent.trim()) return toast.error("Please enter the news content.");

    try {
      setSavingEdit(true);
      const toastId = toast.loading("Saving changes (demo mode)...");

      setNewsList((prev) =>
        prev.map((p) =>
          p.id === editId
            ? {
                ...p,
                title: editTitle.trim(),
                category: editCategory || "General",
                highlight: editHighlight.trim(),
                content: editContent.trim(),
                updatedAtMs: Date.now(),
                // updatedAt: serverTimestamp(), // Firestore timestamp commented out
                updatedBy: currentUser.uid,
              }
            : p
        )
      );

      toast.update(toastId, {
        render: "Updated (local) ✅",
        type: "success",
        isLoading: false,
        autoClose: 1400,
      });

      closeEdit();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Update failed.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Demo: delete from local state (no Firestore writes)
  const handleDeleteConfirm = async () => {
    if (!isAdmin) return toast.error("Only admins can delete news.");
    if (!currentUser?.uid) return toast.error("Please sign in first.");
    if (!deleteTarget?.id) return toast.error("Missing news item id.");

    try {
      setDeleting(true);
      const toastId = toast.loading("Deleting (demo mode)...");

      setNewsList((prev) => prev.filter((p) => p.id !== deleteTarget.id));

      toast.update(toastId, {
        render: "Deleted (local) ✅",
        type: "success",
        isLoading: false,
        autoClose: 1200,
      });

      closeDelete();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section
      id="news"
      className="relative bg-slate-50 py-16 md:py-20 px-4 md:px-8 lg:px-16"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-blue-700 mb-2">
              News & Updates
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-900 leading-tight">
              {title}
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-xl">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            {/* newsLoading / newsError still read from context; in hardcoded/demo mode these are usually false/null */}
            {newsLoading && (
              <div className="text-xs font-semibold text-slate-500">
                Loading news...
              </div>
            )}

            {newsError && (
              <div className="text-xs font-semibold text-red-600">
                Failed to load news. Running in local/demo mode.
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-yellow-400 text-blue-900 hover:bg-yellow-300 transition"
              >
                <BsPlusCircle className="text-base" />
                Add News
              </button>
            )}

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = cat === activeCat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCat(cat)}
                    className={[
                      "px-4 py-2 rounded-full text-xs md:text-sm font-semibold border transition",
                      active
                        ? "bg-blue-900 text-white border-blue-900"
                        : "bg-white text-blue-900 border-slate-200 hover:border-blue-300 hover:bg-blue-50",
                    ].join(" ")}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={gridAnimateState}
          className="grid gap-6 md:grid-cols-3"
        >
          {filtered.map((item) => (
            <motion.article
              key={item.id}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-500"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-900 via-blue-600 to-yellow-400" />

              <div className="p-5 pb-5 flex flex-col h-full">
                <div className="flex items-center justify-end mb-3">
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100">
                    {item.category || "General"}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-blue-900 group-hover:text-blue-800 transition-colors">
                  {item.title}
                </h3>

                {!!item.highlight && (
                  <p className="mt-2 text-sm font-medium text-yellow-600">
                    {item.highlight}
                  </p>
                )}

                <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1 line-clamp-4">
                  {item.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {formatDate(item.createdAt, item.createdAtMs)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenItem(item)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-900"
                    >
                      Read more
                      <span className="w-6 h-6 rounded-full border border-blue-200 flex items-center justify-center hover:bg-blue-800 hover:text-white transition-colors">
                        <BsArrowRight className="text-xs" />
                      </span>
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-blue-900 border border-slate-200 shadow-sm flex items-center justify-center"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <BsPencilSquare />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDelete(item)}
                          className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-red-600 border border-slate-200 shadow-sm flex items-center justify-center"
                          aria-label="Delete"
                          title="Delete"
                        >
                          <BsTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-900/5 via-transparent to-yellow-400/10" />
            </motion.article>
          ))}
        </motion.div>

        {!newsLoading && !newsError && filtered.length === 0 && (
          <div className="mt-10 text-center text-slate-600">
            No news posts yet. {isAdmin ? "Click “Add News” to publish one." : ""}
          </div>
        )}
      </div>

      {/* Read More Modal */}
      <AnimatePresence>
        {openItem && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-24 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpenItem(null);
            }}
          >
            <motion.div
              variants={modalPanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[calc(100vh-7rem)] flex flex-col"
            >
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    {openItem.category || "General"} •{" "}
                    {formatDate(openItem.createdAt, openItem.createdAtMs)}
                  </p>
                  <p className="text-base font-extrabold text-blue-900 truncate">
                    {openItem.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenItem(null)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
                  aria-label="Close"
                >
                  <BsX className="text-2xl" />
                </button>
              </div>

              {/* scrollable content */}
              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                {!!openItem.highlight && (
                  <p className="text-sm font-semibold text-yellow-600">
                    {openItem.highlight}
                  </p>
                )}
                <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                  {openItem.content}
                </p>
              </div>

              {/* footer */}
              <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenItem(null)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full bg-blue-900 text-white hover:bg-blue-800"
                >
                  Close <BsX />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Add Modal */}
      <AnimatePresence>
        {addOpen && isAdmin && (
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
            <motion.div
              variants={modalPanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    Admin
                  </p>
                  <p className="text-base font-extrabold text-blue-900">Add News</p>
                </div>

                <button
                  type="button"
                  onClick={closeAdd}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
                  aria-label="Close"
                >
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Title</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Entrance Exams 2026: Registration Now Open"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
                    disabled={savingAdd}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={savingAdd}
                  >
                    {categoriesPreset.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Highlight (optional)
                  </label>
                  <input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    placeholder="e.g. Secure a place for your child..."
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
                    disabled={savingAdd}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Content</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write the full news update here..."
                    rows={6}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
                    disabled={savingAdd}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddNews}
                  disabled={savingAdd}
                  className={[
                    "w-full py-3 rounded-lg font-semibold",
                    "bg-yellow-400 text-blue-900 hover:bg-yellow-300 transition",
                    savingAdd ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {savingAdd ? "Publishing..." : "Publish News"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {editOpen && isAdmin && (
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
            <motion.div
              variants={modalPanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    Admin
                  </p>
                  <p className="text-base font-extrabold text-blue-900">Edit News</p>
                </div>

                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
                  aria-label="Close"
                >
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
                    disabled={savingEdit}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={savingEdit}
                  >
                    {categoriesPreset.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Highlight (optional)
                  </label>
                  <input
                    value={editHighlight}
                    onChange={(e) => setEditHighlight(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
                    disabled={savingEdit}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
                    disabled={savingEdit}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={savingEdit}
                  className={[
                    "w-full py-3 rounded-lg font-semibold",
                    "bg-blue-900 text-white hover:bg-blue-800 transition",
                    savingEdit ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Delete Confirm */}
      <AnimatePresence>
        {deleteOpen && isAdmin && (
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
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    Admin
                  </p>
                  <p className="text-base font-extrabold text-blue-900">Delete News</p>
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

              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-700">
                  Are you sure you want to delete this news post? This cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDelete}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className={[
                      "flex-1 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-500",
                      deleting ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {deleting ? "Deleting..." : "Delete"}
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

export default NewsSection;