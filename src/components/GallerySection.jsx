import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsChevronLeft,
  BsChevronRight,
  BsX,
  BsImages,
  BsPlusCircle,
  BsPencilSquare,
  BsTrash,
} from "react-icons/bs";
import { toast } from "react-toastify";

// FIRESTORE / STORAGE imports intentionally commented out — running in hardcoded/demo mode.
/*
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  deleteObject,
} from "firebase/storage";

import { db, storage } from "../firebase";
*/

import { useMyContext } from "../Context/MyContext";
// Local fallback gallery (hardcoded images)
import HardcodedGallery from "../data/HardcodedGallery";

const SCHOOL_ID = "main";
const INITIAL_VISIBLE_COUNT = 6;
const LOAD_MORE_COUNT = 6;

const container = {
  hidden: { opacity: 0, y: 24 },
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

const getUniqueCategories = (items) => {
  const cats = new Set((items || []).map((i) => i.category).filter(Boolean));
  return ["All", ...Array.from(cats)];
};

const categoriesPreset = [
  "Academics",
  "STEM",
  "Sports",
  "Events",
  "Facilities",
  "Activities",
  "Media",
];

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

// kept for completeness (not used in demo mode)
const storagePathFromUrl = (url) => {
  try {
    if (!url) return null;
    const u = new URL(url);
    const idx = u.pathname.indexOf("/o/");
    if (idx === -1) return null;
    const encoded = u.pathname.substring(idx + 3);
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
};

const GallerySection = ({ title, subtitle }) => {
  // We still read admin/uid state from context so admin UI can show/hide appropriately,
  // but we do NOT read/write gallery data from Firestore in demo mode.
  const { /* gallery, */ galleryLoading, galleryError, isAdmin, currentUser } =
    useMyContext();

  // Build items exclusively from the local HardcodedGallery.
  // Normalizes image paths to use leading '/' for public/ folder files.
  const items = useMemo(() => {
    const normalize = (raw) => {
      if (!raw) return "/images/SheveCity.png";
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith("/") ? raw : `/${raw}`;
    };

    return HardcodedGallery.map((h) => ({
      id: `hc-${h.id}`,
      src: normalize(h.image),
      alt: h.name || "SHEVET-CITY photo",
      description: h.description || "",
      category: h.category || "Media",
      createdAtMs: h.createdAtMs || 0,
      createdAt: h.createdAt || null,
      storagePath: h.storagePath || null,
    }));
  }, []);

  // ✅ filter / lightbox
  const [activeCat, setActiveCat] = useState("All");
  const [activeIndex, setActiveIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // ✅ admin upload modal (demo mode: no Firestore)
  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newAlt, setNewAlt] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Media");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // ✅ admin edit modal (demo mode: no Firestore)
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editAlt, setEditAlt] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("Media");

  // ✅ admin delete confirm modal (demo mode: no Firestore)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories = useMemo(() => getUniqueCategories(items), [items]);

  const filtered = useMemo(() => {
    if (activeCat === "All") return items;
    return items.filter((x) => x.category === activeCat);
  }, [items, activeCat]);

  const visibleItems = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const hasMore = filtered.length > visibleCount;
  const canShowLess = visibleCount > INITIAL_VISIBLE_COUNT;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeCat, items.length]);

  const openModal = (index) => setActiveIndex(index);
  const closeModal = () => setActiveIndex(null);

  const goPrev = () => {
    if (activeIndex === null || filtered.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  const goNext = () => {
    if (activeIndex === null || filtered.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % filtered.length);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filtered.length));
  };

  const handleShowLess = () => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  // Keyboard navigation for lightbox modal
  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered.length]);

  const activeItem = activeIndex !== null ? filtered[activeIndex] : null;

  // ✅ IMPORTANT: Fix refresh “blank grid” by not depending on whileInView
  const shouldShowGrid = !galleryLoading;
  const gridAnimateState = shouldShowGrid ? "show" : "hidden";

  // Admin helpers (demo: no Firestore calls)
  const resetAddForm = () => {
    setNewAlt("");
    setNewDesc("");
    setNewCategory("Media");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeAdd = () => {
    if (uploading) return;
    setAddOpen(false);
    resetAddForm();
  };

  const handlePickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type?.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB.");
      return;
    }

    setFile(f);
  };

  const handleUpload = async () => {
    if (!isAdmin) return toast.error("Only admins can add to gallery.");
    if (!currentUser?.uid) return toast.error("Please sign in first.");
    if (!file) return toast.error("Please choose an image.");
    if (!newCategory) return toast.error("Please select a category.");

    try {
      setUploading(true);
      const toastId = toast.loading("Upload skipped in demo mode — using local gallery");
      setTimeout(() => {
        toast.update(toastId, {
          render: "Upload is disabled in demo mode. Use HardcodedGallery images instead.",
          type: "info",
          isLoading: false,
          autoClose: 2500,
        });
        closeAdd();
      }, 800);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item) => {
    if (!isAdmin) return;
    setEditId(item?.id || null);
    setEditAlt(item?.alt || "");
    setEditDesc(item?.description || "");
    setEditCategory(item?.category || "Media");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (editing) return;
    setEditOpen(false);
    setEditId(null);
    setEditAlt("");
    setEditDesc("");
    setEditCategory("Media");
  };

  const handleEditSave = async () => {
    if (!isAdmin) return toast.error("Only admins can edit gallery.");
    if (!currentUser?.uid) return toast.error("Please sign in first.");
    if (!editId) return toast.error("Missing gallery item id.");

    try {
      setEditing(true);
      const toastId = toast.loading("Save skipped in demo mode");
      setTimeout(() => {
        toast.update(toastId, {
          render: "Save is disabled in demo mode. Hardcoded images remain unchanged.",
          type: "info",
          isLoading: false,
          autoClose: 2200,
        });
        closeEdit();
      }, 700);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Update failed.");
    } finally {
      setEditing(false);
    }
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

  const handleDeleteConfirm = async () => {
    if (!isAdmin) return toast.error("Only admins can delete gallery.");
    if (!currentUser?.uid) return toast.error("Please sign in first.");
    if (!deleteTarget?.id) return toast.error("Missing gallery item id.");

    try {
      setDeleting(true);
      const toastId = toast.loading("Delete skipped in demo mode");
      setTimeout(() => {
        toast.update(toastId, {
          render: "Delete is disabled in demo mode. Hardcoded images remain unchanged.",
          type: "info",
          isLoading: false,
          autoClose: 2200,
        });
        closeDelete();
      }, 700);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section id="gallery" className="bg-white py-16 md:py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-blue-700 mb-2 inline-flex items-center gap-2">
              <BsImages className="text-base" />
              Gallery
            </p>

            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-900 leading-tight">
              {title || "Moments from SHEVET-CITY Media"}
            </h2>

            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl">
              {subtitle ||
                "Explore snapshots from SHEVET-CITY — productions, behind-the-scenes, events and creative moments."}
            </p>
          </div>

          {/* Right controls */}
          <div className="flex flex-col items-start md:items-end gap-3">
            {galleryLoading && (
              <div className="text-xs font-semibold text-slate-500">Loading gallery...</div>
            )}

            {galleryError && (
              <div className="text-xs font-semibold text-red-600">
                Failed to load gallery. Running in local/demo mode.
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-yellow-400 text-blue-900 hover:bg-yellow-300 transition"
              >
                <BsPlusCircle className="text-base" />
                Add to Gallery
              </button>
            )}

            {/* Category pills */}
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

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={gridAnimateState}
          className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleItems.map((img, idx) => (
            <motion.article
              key={img.id || `${img.src}-${idx}`}
              variants={itemVar}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-shadow duration-500 flex flex-col"
            >
              {/* Image opens lightbox */}
              <button
                type="button"
                onClick={() => openModal(idx)}
                className="relative block w-full"
              >
                <img
                  src={img.src}
                  alt={img.alt || "SHEVET-CITY photo"}
                  loading="lazy"
                  className="w-full h-40 sm:h-48 md:h-56 lg:h-52 xl:h-56 object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-yellow-400/10 via-transparent to-blue-900/10" />
              </button>

              {/* Text area UNDER the image */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col">
                {/* meta row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] md:text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
                    {img.category || "Media"}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {formatTimestamp(img.createdAt, img.createdAtMs)}
                  </span>
                </div>

                {/* title */}
                <p className="mt-2 text-sm md:text-base font-extrabold text-blue-900 line-clamp-1">
                  {img.alt || "SHEVET-CITY photo"}
                </p>

                {/* description */}
                {!!img.description ? (
                  <p className="mt-1 text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {img.description}
                  </p>
                ) : (
                  <p className="mt-1 text-xs md:text-sm text-slate-400 italic">No description yet.</p>
                )}

                {/* actions under the card content (only admin) */}
                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(img)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-blue-900 font-semibold text-xs hover:bg-slate-50"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <BsPencilSquare /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => openDelete(img)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-red-600 font-semibold text-xs hover:bg-red-50"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <BsTrash /> Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* More / Show Less */}
        {!galleryLoading && !galleryError && filtered.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-900 text-white text-sm md:text-base font-semibold hover:bg-blue-800 transition shadow-sm"
              >
                More
              </button>
            )}

            {canShowLess && (
              <button
                type="button"
                onClick={handleShowLess}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-blue-900 text-blue-900 bg-white text-sm md:text-base font-semibold hover:bg-blue-50 transition shadow-sm"
              >
                Show Less
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!galleryLoading && !galleryError && filtered.length === 0 && (
          <div className="mt-10 text-center text-slate-600">
            No gallery photos yet. {isAdmin ? "Click “Add to Gallery” to upload." : ""}
          </div>
        )}
      </div>

      {/* Admin Add Modal (demo/local mode) */}
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
            <motion.div variants={modalPanel} initial="hidden" animate="show" exit="exit" className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">Admin</p>
                  <p className="text-base font-extrabold text-blue-900">Add to Gallery</p>
                </div>

                <button type="button" onClick={closeAdd} className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700" aria-label="Close">
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Photo</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickFile} className="mt-1 w-full text-sm" disabled={uploading} />
                  <p className="mt-1 text-[11px] text-slate-500">JPG/PNG recommended. Max 5MB.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Caption / Title</label>
                  <input value={newAlt} onChange={(e) => setNewAlt(e.target.value)} placeholder="e.g. Behind the scenes" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring" disabled={uploading} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Description (place & moment)</label>
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short description..." rows={4} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none" disabled={uploading} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white" disabled={uploading}>
                    {categoriesPreset.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="button" onClick={handleUpload} disabled={uploading} className={["w-full py-3 rounded-lg font-semibold", "bg-yellow-400 text-blue-900 hover:bg-yellow-300 transition", uploading ? "opacity-60 cursor-not-allowed" : ""].join(" ")}>
                  {uploading ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Edit Modal (demo/local mode) */}
      <AnimatePresence>
        {editOpen && isAdmin && (
          <motion.div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70" variants={modalBackdrop} initial="hidden" animate="show" exit="exit" onMouseDown={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
            <motion.div variants={modalPanel} initial="hidden" animate="show" exit="exit" className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">Admin</p>
                  <p className="text-base font-extrabold text-blue-900">Edit Gallery Item</p>
                </div>

                <button type="button" onClick={closeEdit} className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700" aria-label="Close">
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Caption / Title</label>
                  <input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring" disabled={editing} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Description (place & moment)</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none" disabled={editing} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white" disabled={editing}>
                    {categoriesPreset.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button type="button" onClick={handleEditSave} disabled={editing} className={["w-full py-3 rounded-lg font-semibold", "bg-blue-900 text-white hover:bg-blue-800 transition", editing ? "opacity-60 cursor-not-allowed" : ""].join(" ")}>
                  {editing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Delete Confirm (demo/local mode) */}
      <AnimatePresence>
        {deleteOpen && isAdmin && (
          <motion.div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70" variants={modalBackdrop} initial="hidden" animate="show" exit="exit" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDelete(); }}>
            <motion.div variants={modalPanel} initial="hidden" animate="show" exit="exit" className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">Admin</p>
                  <p className="text-base font-extrabold text-blue-900">Delete Photo</p>
                </div>

                <button type="button" onClick={closeDelete} className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700" aria-label="Close">
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-700">Are you sure you want to delete this photo? This cannot be undone.</p>

                <div className="flex gap-3">
                  <button type="button" onClick={closeDelete} disabled={deleting} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>

                  <button type="button" onClick={handleDeleteConfirm} disabled={deleting} className={["flex-1 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-500", deleting ? "opacity-60 cursor-not-allowed" : ""].join(" ")}>
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {activeItem && (
          <motion.div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70" variants={modalBackdrop} initial="hidden" animate="show" exit="exit" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div variants={modalPanel} initial="hidden" animate="show" exit="exit" className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">{activeItem.category || "Media"}</p>
                  <p className="text-sm sm:text-base font-bold text-blue-900 truncate">{activeItem.alt || "SHEVET-CITY photo"}</p>
                </div>

                <button type="button" onClick={closeModal} className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700" aria-label="Close">
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="relative bg-black">
                <img src={activeItem.src} alt={activeItem.alt || "SHEVET-CITY photo"} className="w-full max-h-[55vh] object-contain" />

                {filtered.length > 1 && (
                  <>
                    <button type="button" onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-blue-900 shadow flex items-center justify-center" aria-label="Previous image">
                      <BsChevronLeft className="text-xl" />
                    </button>
                    <button type="button" onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-blue-900 shadow flex items-center justify-center" aria-label="Next image">
                      <BsChevronRight className="text-xl" />
                    </button>
                  </>
                )}
              </div>

              <div className="px-4 sm:px-5 py-4 border-t border-slate-100 overflow-y-auto flex-1 min-h-0">
                {!!activeItem.description ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{activeItem.description}</p>
                ) : (
                  <p className="text-sm text-slate-500">No description added yet.</p>
                )}

                <div className="mt-3 text-xs text-slate-500">{formatTimestamp(activeItem.createdAt, activeItem.createdAtMs)}</div>
              </div>

              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">{activeIndex !== null ? activeIndex + 1 : 0} / {filtered.length}</p>

                <button type="button" onClick={closeModal} className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full bg-blue-900 text-white hover:bg-blue-800">
                  Close <BsX />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;