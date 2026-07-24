

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsArrowRight,
  BsCalendarEvent,
  BsImage,
  BsNewspaper,
  BsPencilSquare,
  BsPlusCircle,
  BsShareFill,
  BsFacebook,
  BsTwitter,
  BsWhatsapp,
  BsLinkedin,
  BsTelegram,
  BsEnvelope,
  BsLink45Deg,
  BsTrash,
  BsX,
} from "react-icons/bs";
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

const SHEVET_CITY_ID = "the-shevet-city";
const INITIAL_VISIBLE_COUNT = 6;
const LOAD_MORE_COUNT = 6;


const SITE_NAME = "SHEVET-CITY Media";

const getNewsShareUrl = (item) => {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  url.searchParams.set("news", item?.id || "");
  url.hash = "news";
  return url.toString();
};

const getShareText = (item) => {
  const title = item?.title || "SHEVET-CITY News";
  const highlight = item?.highlight || item?.content || "";
  const shortenedHighlight =
    highlight.length > 180 ? `${highlight.slice(0, 177)}...` : highlight;

  return [title, shortenedHighlight].filter(Boolean).join("\n\n");
};

const getImageFileForSharing = async (imageUrl, title) => {
  if (!imageUrl || typeof fetch === "undefined") return null;

  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.type?.startsWith("image/")) return null;

    const extension = blob.type.split("/")[1]?.split("+")[0] || "jpg";
    const safeName = String(title || "shevet-city-news")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    return new File([blob], `${safeName || "shevet-city-news"}.${extension}`, {
      type: blob.type,
    });
  } catch (error) {
    console.warn("Could not prepare the news image for sharing:", error);
    return null;
  }
};

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
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
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

const primaryColor = "#5A005A";
const primaryDark = "#6A006A";
const accentColor = "#F29A00";
const accentHover = "#FFA500";
const pillLightBg = "#F7EEF7";
const pillLightBorder = "#EAD9EA";

const categoriesPreset = [
  "General",
  "Events",
  "Culture",
  "Entertainment",
  "Lifestyle",
  "Magazine",
  "News",
  "Inspiration",
  "Sports",
  "Music",
  "Movies",
  "Documentaries",
];

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

const getUniqueCategories = (items) => {
  const categories = new Set(
    (items || []).map((item) => item.category).filter(Boolean),
  );

  return ["All", ...Array.from(categories)];
};

const formatTimestamp = (timestamp, createdAtMs) => {
  try {
    const date = timestamp?.toDate
      ? timestamp.toDate()
      : timestamp instanceof Date
        ? timestamp
        : null;

    if (date) return date.toLocaleString();

    if (typeof createdAtMs === "number" && createdAtMs > 0) {
      return new Date(createdAtMs).toLocaleString();
    }

    return "";
  } catch {
    return "";
  }
};

const emptyForm = {
  title: "",
  category: "General",
  highlight: "",
  content: "",
  status: "published",
};

const fallbackNews = [
  {
    id: "fallback-news-1",
    title: "SHEVET-CITY Launches New Podcast Series",
    category: "Events",
    highlight: "Behind-the-scenes conversations with local creators.",
    content:
      "SHEVET-CITY Media is proud to announce a new weekly podcast featuring filmmakers, journalists and creatives from the community. Episodes will explore storytelling, production skills and career journeys.",
    imageUrl: "",
    status: "published",
    createdAtMs: 3,
    createdAt: null,
    isFallback: true,
  },
  {
    id: "fallback-news-2",
    title: "Photo Feature: Community Arts Day",
    category: "Culture",
    highlight: "A day of murals, music and collaborative art.",
    content:
      "Our photographers captured memorable moments from Community Arts Day, including family mural sessions, youth performances and live creative installations.",
    imageUrl: "",
    status: "published",
    createdAtMs: 2,
    createdAt: null,
    isFallback: true,
  },
  {
    id: "fallback-news-3",
    title: "Call for Contributors: Local Editorials",
    category: "News",
    highlight: "SHEVET-CITY wants to hear your voice.",
    content:
      "Writers and commentators are invited to contribute thoughtful editorial pieces on culture, society, media, development and public-interest issues.",
    imageUrl: "",
    status: "published",
    createdAtMs: 1,
    createdAt: null,
    isFallback: true,
  },
];

const NewsCard = ({
  item,
  currentUser,
  onEdit,
  onDelete,
  onView,
  onShare,
}) => {
  const imageUrl = item.imageUrl || item.mediaUrl || "";

  const stopAction = (event, action) => {
    event.stopPropagation();
    action();
  };

  return (
    <motion.article
      variants={itemVar}
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(item);
        }
      }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ "--tw-ring-color": primaryColor }}
      title={`Read ${item.title || "news article"}`}
    >
      <div className="p-1.5">
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title || "SHEVET-CITY news"}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: pillLightBg }}
            >
              <div className="text-center px-4">
                <BsNewspaper
                  className="text-4xl mx-auto"
                  style={{ color: primaryColor }}
                />
                <p
                  className="mt-2 text-xs font-extrabold"
                  style={{ color: primaryColor }}
                >
                  SHEVET-CITY News
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60" />

          <button
            type="button"
            onClick={(event) => stopAction(event, () => onShare(item))}
            className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/95 shadow-md hover:scale-105 transition"
            style={{ color: primaryColor }}
            aria-label={`Share ${item.title || "news article"}`}
            title="Share news"
          >
            <BsShareFill className="text-sm" />
          </button>
        </div>
      </div>

      <div className="px-2 pb-2 text-center flex flex-col flex-1">
        <h3
          className="text-[11px] sm:text-xs md:text-sm font-extrabold line-clamp-2"
          style={{ color: primaryColor }}
        >
          {item.title || "News Update"}
        </h3>

        <p className="mt-0.5 text-[9px] sm:text-[10px] md:text-[11px] text-slate-600 font-semibold line-clamp-1">
          {item.highlight || "Latest SHEVET-CITY update"}
        </p>

        <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-500 line-clamp-1">
          {item.category || "General"}
        </p>

        <div className="mt-1 hidden sm:flex flex-wrap justify-center gap-1">
          <span
            className="px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-semibold border max-w-full truncate"
            style={{
              background: "#FFF6E6",
              color: accentColor,
              borderColor: "#FFEDD5",
            }}
          >
            {item.status || "published"}
          </span>
        </div>

        <p
          className="mt-1 text-[9px] sm:text-[10px] font-semibold"
          style={{ color: accentColor }}
        >
          Read article
        </p>

        {currentUser && !item.isFallback && (
          <div className="mt-auto pt-2 border-t border-slate-100 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={(event) =>
                stopAction(event, () => onEdit(item))
              }
              className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 font-semibold text-[9px] hover:bg-slate-50"
              style={{ color: primaryColor }}
            >
              <BsPencilSquare /> Edit
            </button>

            <button
              type="button"
              onClick={(event) =>
                stopAction(event, () => onDelete(item))
              }
              className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 font-semibold text-[9px] hover:bg-red-50"
            >
              <BsTrash style={{ color: "#dc2626" }} /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
};

const NewsForm = ({
  title,
  fileInputRef,
  form,
  setForm,
  file,
  existingImageUrl,
  uploading,
  uploadProgress,
  onPickFile,
  onRemoveExistingImage,
  onClose,
  onSubmit,
  submitLabel,
  fileLabel = "News Image",
  fileHelp = "Optional. JPG/PNG recommended. Max 10MB.",
}) => {
  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
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

          <p
            className="text-base font-extrabold"
            style={{ color: primaryColor }}
          >
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
        {existingImageUrl && (
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">
              Current Image
            </label>

            <img
              src={existingImageUrl}
              alt="Current news"
              className="mt-2 w-full h-52 object-cover rounded-2xl border border-slate-100"
            />

            {onRemoveExistingImage && (
              <button
                type="button"
                onClick={onRemoveExistingImage}
                disabled={uploading}
                className="mt-2 text-xs font-semibold text-red-600"
              >
                Remove current image
              </button>
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">
            {fileLabel}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="mt-1 w-full text-sm"
            disabled={uploading}
          />

          <p className="mt-1 text-[11px] text-slate-500">
            {fileHelp}
          </p>

          {file && (
            <p className="mt-1 text-[11px] text-slate-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            News Title *
          </label>

          <input
            value={form.title}
            onChange={(event) =>
              updateField("title", event.target.value)
            }
            placeholder="Enter news title"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Category
          </label>

          <select
            value={form.category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
            disabled={uploading}
          >
            {categoriesPreset.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Highlight
          </label>

          <input
            value={form.highlight}
            onChange={(event) =>
              updateField("highlight", event.target.value)
            }
            placeholder="Short article highlight"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Status
          </label>

          <select
            value={form.status}
            onChange={(event) =>
              updateField("status", event.target.value)
            }
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
            disabled={uploading}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">
            News Content *
          </label>

          <textarea
            value={form.content}
            onChange={(event) =>
              updateField("content", event.target.value)
            }
            rows={8}
            placeholder="Write the full news article..."
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
            disabled={uploading}
          />
        </div>

        {uploading && (
          <div className="md:col-span-2">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 transition-all"
                style={{
                  width: `${uploadProgress}%`,
                  background: primaryColor,
                }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Saving... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={uploading}
            className="flex-1 py-3 rounded-lg font-semibold transition disabled:opacity-60"
            style={{
              background: accentColor,
              color: primaryColor,
            }}
            onMouseOver={(event) => {
              if (!uploading) {
                event.currentTarget.style.background = accentHover;
              }
            }}
            onMouseOut={(event) => {
              if (!uploading) {
                event.currentTarget.style.background = accentColor;
              }
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

const NewsArticleModal = ({ item, onClose, onShare }) => {
  if (!item) return null;

  const imageUrl = item.imageUrl || item.mediaUrl || "";

  return (
    <motion.div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70"
      variants={modalBackdrop}
      initial="hidden"
      animate="show"
      exit="exit"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        variants={modalPanel}
        initial="hidden"
        animate="show"
        exit="exit"
        className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500">
              News & Updates
            </p>

            <p
              className="text-base font-extrabold truncate"
              style={{ color: primaryColor }}
            >
              {item.title || "News Article"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onShare(item)}
              className="inline-flex items-center justify-center gap-2 px-3 h-9 rounded-full hover:bg-slate-100 font-semibold text-xs"
              style={{ color: primaryColor }}
              aria-label={`Share ${item.title || "news article"}`}
              title="Share news"
            >
              <BsShareFill />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
              aria-label="Close"
            >
              <BsX className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-5">
          <div className="md:col-span-2 bg-slate-50 p-5">
            <div className="rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-sm">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.title || "SHEVET-CITY news"}
                  className="w-full h-72 md:h-[420px] object-cover"
                />
              ) : (
                <div
                  className="w-full h-72 md:h-[420px] flex items-center justify-center"
                  style={{ background: pillLightBg }}
                >
                  <div className="text-center px-4">
                    <BsNewspaper
                      className="text-6xl mx-auto"
                      style={{ color: primaryColor }}
                    />
                    <p
                      className="mt-3 text-sm font-extrabold"
                      style={{ color: primaryColor }}
                    >
                      SHEVET-CITY News
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-extrabold border"
                style={{
                  background: pillLightBg,
                  color: primaryColor,
                  borderColor: pillLightBorder,
                }}
              >
                {item.category || "General"}
              </span>

              {item.status && (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 text-slate-500 bg-white">
                  {item.status}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {formatTimestamp(item.createdAt, item.createdAtMs)}
            </p>
          </div>

          <div className="md:col-span-3 p-5 md:p-7">
            <h3
              className="text-2xl md:text-3xl font-extrabold leading-tight"
              style={{ color: primaryColor }}
            >
              {item.title || "News Article"}
            </h3>

            {item.highlight && (
              <p
                className="mt-2 text-sm md:text-base font-semibold"
                style={{ color: accentColor }}
              >
                {item.highlight}
              </p>
            )}

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                Full Story
              </p>

              <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {item.content || "This article will be updated soon."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


const ShareNewsModal = ({ item, onClose }) => {
  const [sharingImage, setSharingImage] = useState(false);

  if (!item) return null;

  const imageUrl = item.imageUrl || item.mediaUrl || "";
  const shareUrl = getNewsShareUrl(item);
  const shareText = getShareText(item);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(item.title || "SHEVET-CITY News");

  const openShareWindow = (url) => {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=760,height=680",
    );
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("News link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.info("Use one of the social media buttons below.");
      return;
    }

    try {
      setSharingImage(true);

      const imageFile = await getImageFileForSharing(
        imageUrl,
        item.title,
      );

      const shareData = {
        title: item.title || "SHEVET-CITY News",
        text: shareText,
        url: shareUrl,
      };

      if (
        imageFile &&
        navigator.canShare?.({ files: [imageFile] })
      ) {
        shareData.files = [imageFile];
      }

      await navigator.share(shareData);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Native news sharing failed:", error);
        toast.error("Sharing failed. Please use a social button below.");
      }
    } finally {
      setSharingImage(false);
    }
  };

  const socialOptions = [
    {
      name: "WhatsApp",
      icon: BsWhatsapp,
      action: () =>
        openShareWindow(
          `https://wa.me/?text=${encodeURIComponent(
            `${shareText}\n\n${shareUrl}`,
          )}`,
        ),
    },
    {
      name: "Facebook",
      icon: BsFacebook,
      action: () =>
        openShareWindow(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        ),
    },
    {
      name: "X",
      icon: BsTwitter,
      action: () =>
        openShareWindow(
          `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        ),
    },
    {
      name: "LinkedIn",
      icon: BsLinkedin,
      action: () =>
        openShareWindow(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        ),
    },
    {
      name: "Telegram",
      icon: BsTelegram,
      action: () =>
        openShareWindow(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        ),
    },
    {
      name: "Email",
      icon: BsEnvelope,
      action: () => {
        window.location.href =
          `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(
            `${shareText}\n\nRead more: ${shareUrl}`,
          )}`;
      },
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70"
      variants={modalBackdrop}
      initial="hidden"
      animate="show"
      exit="exit"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        variants={modalPanel}
        initial="hidden"
        animate="show"
        exit="exit"
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
              Share News
            </p>
            <p
              className="text-base font-extrabold line-clamp-1"
              style={{ color: primaryColor }}
            >
              {item.title || "SHEVET-CITY News"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
            aria-label="Close sharing options"
          >
            <BsX className="text-2xl" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.title || "News"}
                className="w-24 h-24 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: pillLightBg }}
              >
                <BsNewspaper
                  className="text-3xl"
                  style={{ color: primaryColor }}
                />
              </div>
            )}

            <div className="min-w-0">
              <p
                className="font-extrabold text-sm line-clamp-2"
                style={{ color: primaryColor }}
              >
                {item.title || "News Update"}
              </p>
              <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                {item.highlight ||
                  item.content ||
                  "Latest news from SHEVET-CITY Media."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNativeShare}
            disabled={sharingImage}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-white disabled:opacity-60"
            style={{ background: primaryColor }}
          >
            <BsShareFill />
            {sharingImage
              ? "Preparing image..."
              : "Share to any available app"}
          </button>

          <p className="mt-4 text-xs font-semibold text-slate-500">
            Or choose a platform
          </p>

          <div className="mt-3 grid grid-cols-3 gap-3">
            {socialOptions.map(({ name, icon: Icon, action }) => (
              <button
                key={name}
                type="button"
                onClick={action}
                className="inline-flex flex-col items-center justify-center gap-2 min-h-20 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm transition text-xs font-semibold"
                style={{ color: primaryColor }}
              >
                <Icon className="text-xl" />
                {name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copyShareLink}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
            style={{ color: primaryColor }}
          >
            <BsLink45Deg className="text-lg" />
            Copy news link
          </button>

          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            On supported phones and browsers, “Share to any available app”
            includes the news picture as an image file. Social websites use the
            shared article link and may generate their preview from your
            website metadata.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const NewsSection = ({
  title = "Latest from SHEVET-CITY Media",
  subtitle = "Stay informed about updates, releases and events from SHEVET-CITY Media.",
}) => {
  const { currentUser } = useMyContext();

  const [remoteNews, setRemoteNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
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
  const [editExistingImageUrl, setEditExistingImageUrl] = useState("");
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const editFileInputRef = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const newsCollectionRef = useMemo(() => {
    return collection(db, "shevetCity", SHEVET_CITY_ID, "news");
  }, []);

  const loadNews = useCallback(async () => {
    try {
      setNewsLoading(true);
      setNewsError(null);

      const newsQuery = query(
        newsCollectionRef,
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(newsQuery);
      const data = snapshot.docs.map(serializeDoc);

      setRemoteNews(sortByCreatedDesc(data));
    } catch (error) {
      console.error("Shevet-City news fetch error:", error);
      setNewsError(
        "Failed to load online news. Showing fallback news content.",
      );
      setRemoteNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, [newsCollectionRef]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const sourceNews =
    remoteNews.length > 0 ? remoteNews : fallbackNews;

  const newsItems = useMemo(() => {
    return sourceNews
      .map((item) => ({
        ...item,
        id: item.id,
        title: item.title || "News Update",
        category: item.category || "General",
        highlight: item.highlight || "",
        content: item.content || "",
        imageUrl: item.imageUrl || item.mediaUrl || "",
        status: item.status || "published",
        createdAtMs: item.createdAtMs || 0,
        createdAt: item.createdAt || null,
      }))
      .filter(
        (item) =>
          currentUser || item.status === "published",
      );
  }, [sourceNews, currentUser]);

  useEffect(() => {
    if (typeof window === "undefined" || newsItems.length === 0) return;

    const requestedNewsId = new URLSearchParams(
      window.location.search,
    ).get("news");

    if (!requestedNewsId) return;

    const requestedItem = newsItems.find(
      (item) => String(item.id) === String(requestedNewsId),
    );

    if (requestedItem) {
      setSelectedNews(requestedItem);
    }
  }, [newsItems]);

  const categories = useMemo(() => {
    return getUniqueCategories(newsItems);
  }, [newsItems]);

  const filteredNews = useMemo(() => {
    if (activeCategory === "All") return newsItems;

    return newsItems.filter(
      (item) => item.category === activeCategory,
    );
  }, [newsItems, activeCategory]);

  const visibleNews = useMemo(() => {
    if (!currentUser) return filteredNews;

    return filteredNews.slice(0, visibleCount);
  }, [filteredNews, visibleCount, currentUser]);

  const hasMore =
    currentUser && filteredNews.length > visibleCount;

  const canShowLess =
    currentUser && visibleCount > INITIAL_VISIBLE_COUNT;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeCategory, newsItems.length]);

  const uploadToCloudinary = (selectedFile, folderName) => {
    return new Promise((resolve, reject) => {
      if (!selectedFile) {
        resolve("");
        return;
      }

      const cloudName =
        process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset =
        process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

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
          const progress = Math.round(
            (event.loaded / event.total) * 100,
          );
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
            reject(
              new Error(
                data?.error?.message || "Image upload failed.",
              ),
            );
          }
        } catch {
          reject(new Error("Image upload failed."));
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            "Upload failed. Check your internet connection.",
          ),
        );
      };

      xhr.onabort = () => {
        reject(new Error("Upload was aborted."));
      };

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

  const handlePickFile = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;
    if (!validateImage(selectedFile, event.target)) return;

    setFile(selectedFile);
  };

  const handlePickEditFile = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;
    if (!validateImage(selectedFile, event.target)) return;

    setEditFile(selectedFile);
    setRemoveExistingImage(false);
  };

  const resetAddForm = () => {
    setAddForm(emptyForm);
    setFile(null);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    setEditExistingImageUrl("");
    setRemoveExistingImage(false);
    setUploadProgress(0);

    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const closeEdit = () => {
    if (editing) return;

    setEditOpen(false);
    resetEditForm();
  };

  const buildPayload = (
    form,
    imageUrl,
    selectedFile,
    mode,
  ) => {
    const payload = {
      title: form.title.trim(),
      category: form.category || "General",
      highlight: form.highlight.trim(),
      content: form.content.trim(),
      status: form.status || "published",
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    };

    if (imageUrl !== undefined) {
      payload.imageUrl = imageUrl;
      payload.mediaUrl = imageUrl;

      if (imageUrl && selectedFile) {
        payload.fileName = selectedFile.name;
        payload.fileType = selectedFile.type;
        payload.fileSize = selectedFile.size;
        payload.storageProvider = "cloudinary";
      }

      if (!imageUrl) {
        payload.fileName = "";
        payload.fileType = "";
        payload.fileSize = 0;
        payload.storageProvider = "";
      }
    }

    if (mode === "create") {
      payload.createdAt = serverTimestamp();
      payload.createdAtMs = Date.now();
      payload.createdBy = currentUser.uid;
      payload.createdByName =
        getUserDisplayName(currentUser);
      payload.createdByEmail = currentUser.email || "";
    } else {
      payload.updatedBy = currentUser.uid;
      payload.updatedByName =
        getUserDisplayName(currentUser);
      payload.updatedByEmail = currentUser.email || "";
    }

    return payload;
  };

  const handleAddNews = async () => {
    if (!currentUser) {
      toast.error("Please sign in before adding news.");
      return;
    }

    if (!addForm.title.trim()) {
      toast.error("Please enter the news title.");
      return;
    }

    if (!addForm.content.trim()) {
      toast.error("Please enter the news content.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      let imageUrl = "";

      if (file) {
        imageUrl = await uploadToCloudinary(
          file,
          "shevet-city/news",
        );
      }

      const payload = buildPayload(
        addForm,
        imageUrl,
        file,
        "create",
      );

      await addDoc(newsCollectionRef, payload);

      toast.success("News added successfully.");
      closeAdd();
      await loadNews();
    } catch (error) {
      console.error("Error adding Shevet-City news:", error);
      toast.error(error.message || "Failed to add news.");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item) => {
    if (!currentUser) {
      toast.error("Please sign in before editing news.");
      return;
    }

    if (
      item?.isFallback ||
      String(item?.id || "").startsWith("fallback-")
    ) {
      toast.info(
        "This is fallback news. Add it as a real news item before editing.",
      );
      return;
    }

    setEditId(item.id);
    setEditForm({
      title: item.title || "",
      category: item.category || "General",
      highlight: item.highlight || "",
      content: item.content || "",
      status: item.status || "published",
    });
    setEditExistingImageUrl(
      item.imageUrl || item.mediaUrl || "",
    );
    setEditFile(null);
    setRemoveExistingImage(false);
    setEditOpen(true);
  };

  const handleEditNews = async () => {
    if (!currentUser) {
      toast.error("Please sign in before editing news.");
      return;
    }

    if (!editId) {
      toast.error("Missing news item id.");
      return;
    }

    if (!editForm.title.trim()) {
      toast.error("Please enter the news title.");
      return;
    }

    if (!editForm.content.trim()) {
      toast.error("Please enter the news content.");
      return;
    }

    try {
      setEditing(true);
      setUploadProgress(0);

      let imageUrl;

      if (removeExistingImage) {
        imageUrl = "";
      } else if (editFile) {
        imageUrl = await uploadToCloudinary(
          editFile,
          "shevet-city/news",
        );
      }

      const payload = buildPayload(
        editForm,
        imageUrl,
        editFile,
        "edit",
      );

      const newsRef = doc(
        db,
        "shevetCity",
        SHEVET_CITY_ID,
        "news",
        editId,
      );

      await updateDoc(newsRef, payload);

      toast.success("News updated successfully.");
      closeEdit();
      await loadNews();
    } catch (error) {
      console.error(
        "Error updating Shevet-City news:",
        error,
      );
      toast.error(error.message || "Failed to update news.");
    } finally {
      setEditing(false);
    }
  };

  const openDelete = (item) => {
    if (!currentUser) {
      toast.error("Please sign in before deleting news.");
      return;
    }

    if (
      item?.isFallback ||
      String(item?.id || "").startsWith("fallback-")
    ) {
      toast.info(
        "This is fallback news and cannot be deleted from here.",
      );
      return;
    }

    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    if (deleting) return;

    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!currentUser) {
      toast.error("Please sign in before deleting news.");
      return;
    }

    if (!deleteTarget?.id) {
      toast.error("Missing news item id.");
      return;
    }

    try {
      setDeleting(true);

      const newsRef = doc(
        db,
        "shevetCity",
        SHEVET_CITY_ID,
        "news",
        deleteTarget.id,
      );

      await deleteDoc(newsRef);

      toast.success("News deleted successfully.");
      closeDelete();
      await loadNews();
    } catch (error) {
      console.error(
        "Error deleting Shevet-City news:",
        error,
      );
      toast.error(error.message || "Failed to delete news.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section
      id="news"
      className="bg-white py-16 md:py-20 px-4 md:px-8 lg:px-16"
    >
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
            News & Updates
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Home</span>
            <span className="text-slate-300">/</span>
            <span
              className="font-semibold"
              style={{ color: primaryColor }}
            >
              News
            </span>
          </div>

          <div className="mt-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h2
                className="text-3xl md:text-4xl font-extrabold leading-tight"
                style={{ color: primaryColor }}
              >
                {title}
              </h2>

              <p className="mt-3 text-sm md:text-base text-slate-600 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition shadow-sm"
                style={{
                  background: accentColor,
                  color: primaryColor,
                }}
                onMouseOver={(event) => {
                  event.currentTarget.style.background =
                    accentHover;
                }}
                onMouseOut={(event) => {
                  event.currentTarget.style.background =
                    accentColor;
                }}
              >
                <BsPlusCircle className="text-base" />
                Add News
              </button>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="bg-slate-50 rounded-3xl border border-slate-100 shadow-sm p-4 md:p-5"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase mb-2"
                  style={{ color: primaryColor }}
                >
                  <BsNewspaper className="inline-block mr-2" />
                  Latest News
                </p>

                <h3
                  className="text-xl md:text-2xl font-extrabold leading-tight"
                  style={{ color: primaryColor }}
                >
                  Explore our latest stories
                </h3>

                <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed">
                  Read updates, reports, events, programmes,
                  entertainment stories and public-interest
                  content from SHEVET-CITY.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                {newsLoading && (
                  <p className="text-xs font-semibold text-slate-500">
                    Loading news...
                  </p>
                )}

                {newsError && (
                  <p className="text-xs font-semibold text-red-600 max-w-[220px] sm:text-right">
                    {newsError}
                  </p>
                )}

                {currentUser && (
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: primaryColor }}
                  >
                    Signed-in CRUD mode
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active =
                  category === activeCategory;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setActiveCategory(category)
                    }
                    className="px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold border transition"
                    style={
                      active
                        ? {
                            background: primaryColor,
                            color: "#fff",
                            borderColor: primaryColor,
                          }
                        : {
                            background: "#fff",
                            color: primaryColor,
                            borderColor: "#e6e6e6",
                          }
                    }
                    onMouseOver={(event) => {
                      if (!active) {
                        event.currentTarget.style.borderColor =
                          accentColor;
                        event.currentTarget.style.background =
                          "#fff7ec";
                      }
                    }}
                    onMouseOut={(event) => {
                      if (!active) {
                        event.currentTarget.style.borderColor =
                          "#e6e6e6";
                        event.currentTarget.style.background =
                          "#fff";
                      }
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate={
                !newsLoading ? "show" : "hidden"
              }
              className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4"
            >
              {visibleNews.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  currentUser={currentUser}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onView={setSelectedNews}
                  onShare={setShareTarget}
                />
              ))}
            </motion.div>

            {currentUser &&
              !newsLoading &&
              filteredNews.length >
                INITIAL_VISIBLE_COUNT && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((previous) =>
                          Math.min(
                            previous + LOAD_MORE_COUNT,
                            filteredNews.length,
                          ),
                        )
                      }
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition shadow-sm"
                      style={{
                        background: primaryColor,
                        color: "#fff",
                      }}
                      onMouseOver={(event) => {
                        event.currentTarget.style.background =
                          primaryDark;
                      }}
                      onMouseOut={(event) => {
                        event.currentTarget.style.background =
                          primaryColor;
                      }}
                    >
                      More News
                    </button>
                  )}

                  {canShowLess && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount(
                          INITIAL_VISIBLE_COUNT,
                        )
                      }
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition shadow-sm"
                      style={{
                        background: "#fff",
                        color: primaryColor,
                        border: `1px solid ${primaryColor}`,
                      }}
                    >
                      Show Less
                    </button>
                  )}
                </div>
              )}

            {!newsLoading &&
              filteredNews.length === 0 && (
                <div className="rounded-2xl bg-white border border-slate-100 p-5 text-center text-sm text-slate-600">
                  No news posts yet.{" "}
                  {currentUser
                    ? "Click “Add News” to create one."
                    : "Please check back soon for updates."}
                </div>
              )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedNews && (
          <NewsArticleModal
            item={selectedNews}
            onClose={() => setSelectedNews(null)}
            onShare={setShareTarget}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareTarget && (
          <ShareNewsModal
            item={shareTarget}
            onClose={() => setShareTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addOpen && currentUser && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeAdd();
              }
            }}
          >
            <NewsForm
              title="Add News"
              fileInputRef={fileInputRef}
              form={addForm}
              setForm={setAddForm}
              file={file}
              existingImageUrl=""
              uploading={uploading}
              uploadProgress={uploadProgress}
              onPickFile={handlePickFile}
              onClose={closeAdd}
              onSubmit={handleAddNews}
              submitLabel="Add News"
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
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeEdit();
              }
            }}
          >
            <NewsForm
              title="Edit News"
              fileInputRef={editFileInputRef}
              form={editForm}
              setForm={setEditForm}
              file={editFile}
              existingImageUrl={
                removeExistingImage
                  ? ""
                  : editExistingImageUrl
              }
              uploading={editing}
              uploadProgress={uploadProgress}
              onPickFile={handlePickEditFile}
              onRemoveExistingImage={() => {
                setRemoveExistingImage(true);
                setEditExistingImageUrl("");
              }}
              onClose={closeEdit}
              onSubmit={handleEditNews}
              submitLabel="Save Changes"
              fileLabel="Replace News Image"
              fileHelp="Optional. Leave empty to keep the current image."
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteOpen && currentUser && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDelete();
              }
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
                    Signed-in User
                  </p>

                  <p
                    className="text-base font-extrabold"
                    style={{ color: primaryColor }}
                  >
                    Delete News
                  </p>
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
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    {deleteTarget?.title ||
                      "this news article"}
                  </span>
                  ? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDelete}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                    style={{ background: "#dc2626" }}
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete"}
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