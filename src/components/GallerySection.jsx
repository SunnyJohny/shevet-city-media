import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsChevronLeft,
  BsChevronRight,
  BsX,
  BsImages,
  BsPlusCircle,
  BsPencilSquare,
  BsTrash,
  BsShare,
  BsLink45Deg,
  BsWhatsapp,
  BsFacebook,
  BsTwitterX,
  BsLinkedin,
  BsTelegram,
  BsEnvelope,
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
import HardcodedGallery from "../data/HardcodedGallery";

const SHEVET_CITY_ID = "the-shevet-city";
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

const categoriesPreset = [
  "Media",
  "Productions",
  "Behind The Scenes",
  "Events",
  "Activities",
  "Culture",
  "Entertainment",
  "Lifestyle",
  "Magazine",
  "News",
];

const getUniqueCategories = (items) => {
  const cats = new Set((items || []).map((i) => i.category).filter(Boolean));
  return ["All", ...Array.from(cats)];
};

const normalize = (raw) => {
  if (!raw) return "/images/SheveCity.png";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
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

const GallerySection = ({ title, subtitle }) => {
  const { currentUser } = useMyContext();

  const [remoteGallery, setRemoteGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(null);

  const [activeCat, setActiveCat] = useState("All");
  const [activeIndex, setActiveIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newAlt, setNewAlt] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Media");
  const [newStatus, setNewStatus] = useState("published");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editAlt, setEditAlt] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("Media");
  const [editStatus, setEditStatus] = useState("published");
  const [editFile, setEditFile] = useState(null);
  const editFileInputRef = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [sharingImage, setSharingImage] = useState(false);

  const galleryCollectionRef = useMemo(() => {
    return collection(db, "shevetCity", SHEVET_CITY_ID, "gallery");
  }, []);

  const fallbackItems = useMemo(() => {
    return HardcodedGallery.map((h) => ({
      id: `hc-${h.id}`,
      src: normalize(h.image),
      imageUrl: normalize(h.image),
      alt: h.name || "SHEVET-CITY photo",
      title: h.name || "SHEVET-CITY photo",
      description: h.description || "",
      category: h.category || "Media",
      createdAtMs: h.createdAtMs || 0,
      createdAt: h.createdAt || null,
      status: "published",
      isFallback: true,
    }));
  }, []);

  const loadGallery = useCallback(async () => {
    try {
      setGalleryLoading(true);
      setGalleryError(null);

      const q = query(galleryCollectionRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const data = snap.docs.map(serializeDoc);
      setRemoteGallery(sortByCreatedDesc(data));
    } catch (error) {
      console.error("Shevet-City gallery fetch error:", error);
      setGalleryError(error.message || "Failed to load gallery.");
      setRemoteGallery([]);
    } finally {
      setGalleryLoading(false);
    }
  }, [galleryCollectionRef]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const sourceItems = remoteGallery.length > 0 ? remoteGallery : fallbackItems;

  const items = useMemo(() => {
    return sourceItems.map((item) => ({
      ...item,
      id: item.id,
      src: item.src || item.imageUrl || item.mediaUrl || normalize(item.image),
      imageUrl: item.imageUrl || item.src || item.mediaUrl || normalize(item.image),
      alt: item.alt || item.title || item.name || "SHEVET-CITY photo",
      title: item.title || item.alt || item.name || "SHEVET-CITY photo",
      description: item.description || "",
      category: item.category || "Media",
      createdAtMs: item.createdAtMs || 0,
      createdAt: item.createdAt || null,
      status: item.status || "published",
    }));
  }, [sourceItems]);

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

  const activeItem = activeIndex !== null ? filtered[activeIndex] : null;

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

  const getGalleryShareUrl = useCallback((item) => {
    if (typeof window === "undefined") return "";

    const url = new URL(window.location.href);
    url.searchParams.delete("news");
    url.searchParams.set("gallery", item?.id || "");
    url.hash = "gallery";

    return url.toString();
  }, []);

  const getShareDetails = useCallback(
    (item) => {
      const title =
        item?.alt ||
        item?.title ||
        "SHEVET-CITY gallery photo";

      const description =
        item?.description ||
        `View this ${item?.category || "gallery"} photo from SHEVET-CITY Media.`;

      return {
        title,
        description,
        imageUrl: item?.src || item?.imageUrl || item?.mediaUrl || "",
        url: getGalleryShareUrl(item),
      };
    },
    [getGalleryShareUrl],
  );

  const openShare = useCallback((item, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    setShareTarget(item);
    setShareOpen(true);
  }, []);

  const closeShare = useCallback(() => {
    if (sharingImage) return;
    setShareOpen(false);
    setShareTarget(null);
  }, [sharingImage]);

  const openShareWindow = useCallback((url) => {
    if (!url || typeof window === "undefined") return;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=760,height=680",
    );
  }, []);

  const copyShareLink = useCallback(async () => {
    if (!shareTarget) return;

    const { url } = getShareDetails(shareTarget);

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Gallery link copied.");
    } catch (error) {
      console.error("Gallery link copy failed:", error);
      toast.error("Unable to copy the gallery link.");
    }
  }, [getShareDetails, shareTarget]);

  const shareToPlatform = useCallback(
    (platform) => {
      if (!shareTarget) return;

      const { title, description, url } =
        getShareDetails(shareTarget);

      const message = `${title}\n\n${description}\n\n${url}`;
      const encodedUrl = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      const encodedDescription = encodeURIComponent(description);
      const encodedMessage = encodeURIComponent(message);

      const platformUrls = {
        whatsapp: `https://api.whatsapp.com/send?text=${encodedMessage}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}%0A${encodedDescription}`,
        email: `mailto:?subject=${encodedTitle}&body=${encodedMessage}`,
      };

      openShareWindow(platformUrls[platform]);
    },
    [getShareDetails, openShareWindow, shareTarget],
  );

  const shareToAvailableApps = useCallback(async () => {
    if (!shareTarget) return;

    const { title, description, imageUrl, url } =
      getShareDetails(shareTarget);

    try {
      setSharingImage(true);

      let imageFile = null;

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl, {
            mode: "cors",
            cache: "no-store",
          });

          if (response.ok) {
            const blob = await response.blob();
            const extension =
              blob.type?.split("/")[1]?.split("+")[0] || "jpg";

            imageFile = new File(
              [blob],
              `shevet-city-gallery-${shareTarget.id || Date.now()}.${extension}`,
              { type: blob.type || "image/jpeg" },
            );
          }
        } catch (imageError) {
          console.warn(
            "The gallery image could not be attached to native sharing:",
            imageError,
          );
        }
      }

      const text = `${description}\n\n${url}`;

      if (
        imageFile &&
        navigator.canShare?.({ files: [imageFile] })
      ) {
        await navigator.share({
          title,
          text,
          url,
          files: [imageFile],
        });

        return;
      }

      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });

        return;
      }

      setShareOpen(true);
      toast.info("Choose a social platform to share this photo.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Gallery native sharing failed:", error);
        toast.error("Sharing failed. Please choose a social platform.");
      }
    } finally {
      setSharingImage(false);
    }
  }, [getShareDetails, shareTarget]);

  useEffect(() => {
    if (galleryLoading || items.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const sharedGalleryId = params.get("gallery");

    if (!sharedGalleryId) return;

    const sharedIndex = filtered.findIndex(
      (item) => String(item.id) === String(sharedGalleryId),
    );

    const itemIndex =
      sharedIndex >= 0
        ? sharedIndex
        : items.findIndex(
            (item) => String(item.id) === String(sharedGalleryId),
          );

    if (itemIndex < 0) return;

    if (sharedIndex < 0) {
      setActiveCat("All");
    }

    const resolvedIndex =
      sharedIndex >= 0
        ? sharedIndex
        : items.findIndex(
            (item) => String(item.id) === String(sharedGalleryId),
          );

    setVisibleCount((previous) =>
      Math.max(previous, resolvedIndex + 1),
    );
    setActiveIndex(resolvedIndex);

    window.setTimeout(() => {
      document
        .getElementById("gallery")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [filtered, galleryLoading, items]);

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

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filtered.length));
  };

  const handleShowLess = () => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const resetAddForm = () => {
    setNewAlt("");
    setNewDesc("");
    setNewCategory("Media");
    setNewStatus("published");
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
    setEditAlt("");
    setEditDesc("");
    setEditCategory("Media");
    setEditStatus("published");
    setEditFile(null);
    setUploadProgress(0);

    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const closeEdit = () => {
    if (editing) return;
    setEditOpen(false);
    resetEditForm();
  };

  const handlePickFile = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type?.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handlePickEditFile = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type?.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      e.target.value = "";
      return;
    }

    setEditFile(selectedFile);
  };

  const uploadToCloudinary = (selectedFile, folderName) => {
    return new Promise((resolve, reject) => {
      if (!selectedFile) {
        resolve("");
        return;
      }

      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        reject(new Error("Cloudinary cloud name or upload preset is missing."));
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
            reject(new Error(data?.error?.message || "Cloudinary upload failed."));
          }
        } catch {
          reject(new Error("Invalid Cloudinary response."));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed. Check your internet connection."));
      };

      xhr.onabort = () => {
        reject(new Error("Upload was aborted."));
      };

      xhr.send(body);
    });
  };

  const handleUpload = async () => {
    if (!currentUser) {
      toast.error("Please sign in before adding gallery content.");
      return;
    }

    if (!file) {
      toast.error("Please choose an image.");
      return;
    }

    if (!newCategory) {
      toast.error("Please select a category.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const imageUrl = await uploadToCloudinary(file, "shevet-city/gallery");

      const payload = {
        title: newAlt || "SHEVET-CITY photo",
        alt: newAlt || "SHEVET-CITY photo",
        description: newDesc || "",
        category: newCategory,
        imageUrl,
        src: imageUrl,
        mediaUrl: imageUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: newStatus,
        storageProvider: "cloudinary",
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName:
          currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        createdByEmail: currentUser.email || "",
      };

      await addDoc(galleryCollectionRef, payload);

      toast.success("Gallery photo added successfully.");
      closeAdd();
      await loadGallery();
    } catch (error) {
      console.error("Error adding Shevet-City gallery photo:", error);
      toast.error(error.message || "Failed to add gallery photo.");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item) => {
    if (!currentUser) {
      toast.error("Please sign in before editing gallery content.");
      return;
    }

    if (item?.isFallback || String(item?.id || "").startsWith("hc-")) {
      toast.info("This is a hardcoded photo. Upload it first before editing.");
      return;
    }

    setEditId(item?.id || null);
    setEditAlt(item?.alt || item?.title || "");
    setEditDesc(item?.description || "");
    setEditCategory(item?.category || "Media");
    setEditStatus(item?.status || "published");
    setEditFile(null);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!currentUser) {
      toast.error("Please sign in before editing gallery content.");
      return;
    }

    if (!editId) {
      toast.error("Missing gallery item id.");
      return;
    }

    try {
      setEditing(true);
      setUploadProgress(0);

      let imageUrl = null;

      if (editFile) {
        imageUrl = await uploadToCloudinary(editFile, "shevet-city/gallery");
      }

      const payload = {
        title: editAlt || "SHEVET-CITY photo",
        alt: editAlt || "SHEVET-CITY photo",
        description: editDesc || "",
        category: editCategory,
        status: editStatus,
        updatedAt: serverTimestamp(),
        updatedAtMs: Date.now(),
        updatedBy: currentUser.uid,
        updatedByName:
          currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        updatedByEmail: currentUser.email || "",
      };

      if (imageUrl) {
        payload.imageUrl = imageUrl;
        payload.src = imageUrl;
        payload.mediaUrl = imageUrl;
        payload.fileName = editFile.name;
        payload.fileType = editFile.type;
        payload.fileSize = editFile.size;
        payload.storageProvider = "cloudinary";
      }

      const itemRef = doc(db, "shevetCity", SHEVET_CITY_ID, "gallery", editId);
      await updateDoc(itemRef, payload);

      toast.success("Gallery photo updated successfully.");
      closeEdit();
      await loadGallery();
    } catch (error) {
      console.error("Error updating Shevet-City gallery photo:", error);
      toast.error(error.message || "Failed to update gallery photo.");
    } finally {
      setEditing(false);
    }
  };

  const openDelete = (item) => {
    if (!currentUser) {
      toast.error("Please sign in before deleting gallery content.");
      return;
    }

    if (item?.isFallback || String(item?.id || "").startsWith("hc-")) {
      toast.info("This is a hardcoded photo and cannot be deleted from here.");
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
      toast.error("Please sign in before deleting gallery content.");
      return;
    }

    if (!deleteTarget?.id) {
      toast.error("Missing gallery item id.");
      return;
    }

    try {
      setDeleting(true);

      const itemRef = doc(
        db,
        "shevetCity",
        SHEVET_CITY_ID,
        "gallery",
        deleteTarget.id
      );

      await deleteDoc(itemRef);

      toast.success("Gallery photo deleted successfully.");
      closeDelete();
      await loadGallery();
    } catch (error) {
      console.error("Error deleting Shevet-City gallery photo:", error);
      toast.error(error.message || "Failed to delete gallery photo.");
    } finally {
      setDeleting(false);
    }
  };

  const primaryColor = "#5A005A";
  const accentColor = "#F29A00";
  const accentHover = "#FFA500";

  return (
    <section id="gallery" className="scroll-mt-24 bg-white py-16 md:py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
        >
          <div>
            <p
              className="text-xs font-semibold tracking-[0.3em] uppercase mb-2 inline-flex items-center gap-2"
              style={{ color: primaryColor }}
            >
              <BsImages className="text-base" />
              Gallery
            </p>

            <h2
              className="text-3xl md:text-4xl font-extrabold leading-tight"
              style={{ color: primaryColor }}
            >
              {title || "Moments from SHEVET-CITY Media"}
            </h2>

            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl">
              {subtitle ||
                "Explore snapshots from SHEVET-CITY — productions, behind-the-scenes, events and creative moments."}
            </p>

            {currentUser && (
              <p className="text-xs font-semibold mt-3" style={{ color: primaryColor }}>
                Signed-in CRUD mode active. You can add, edit, and delete gallery content.
              </p>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            {galleryLoading && (
              <div className="text-xs font-semibold text-slate-500">
                Loading gallery...
              </div>
            )}

            {galleryError && (
              <div className="text-xs font-semibold text-red-600">
                Failed to load Firestore gallery. Showing local fallback content.
              </div>
            )}

            {currentUser ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition"
                style={{
                  background: accentColor,
                  color: primaryColor,
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = accentHover)}
                onMouseOut={(e) => (e.currentTarget.style.background = accentColor)}
              >
                <BsPlusCircle className="text-base" />
                Add to Gallery
              </button>
            ) : (
              <div className="text-xs font-semibold text-slate-500">
                Sign in to add gallery content.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = cat === activeCat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCat(cat)}
                    className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold border transition"
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
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={!galleryLoading ? "show" : "hidden"}
          className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleItems.map((img, idx) => (
            <motion.article
              key={img.id || `${img.src}-${idx}`}
              variants={itemVar}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-shadow duration-500 flex flex-col"
            >
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

                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(to bottom right, rgba(242,154,0,0.07), rgba(0,0,0,0) 30%, rgba(90,0,90,0.08))",
                  }}
                />
              </button>

              <button
                type="button"
                onClick={(event) => openShare(img, event)}
                className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg border border-white/70 transition"
                aria-label={`Share ${img.alt || img.title || "gallery photo"}`}
                title="Share photo"
                style={{ color: primaryColor }}
              >
                <BsShare className="text-base" />
              </button>

              <div className="p-3 sm:p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] md:text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "#f7eef7",
                      color: primaryColor,
                      border: "1px solid #ead9ea",
                    }}
                  >
                    {img.category || "Media"}
                  </span>

                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {formatTimestamp(img.createdAt, img.createdAtMs)}
                  </span>
                </div>

                <p
                  className="mt-2 text-sm md:text-base font-extrabold line-clamp-1"
                  style={{ color: primaryColor }}
                >
                  {img.alt || img.title || "SHEVET-CITY photo"}
                </p>

                {!!img.description ? (
                  <p className="mt-1 text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {img.description}
                  </p>
                ) : (
                  <p className="mt-1 text-xs md:text-sm text-slate-400 italic">
                    No description yet.
                  </p>
                )}

                {currentUser && !img.isFallback && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(img)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 font-semibold text-xs hover:bg-slate-50"
                      aria-label="Edit"
                      title="Edit"
                      style={{ color: primaryColor }}
                    >
                      <BsPencilSquare /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => openDelete(img)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 font-semibold text-xs hover:bg-red-50"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <BsTrash style={{ color: "#dc2626" }} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>

        {!galleryLoading && filtered.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm md:text-base font-semibold transition shadow-sm"
                style={{ background: primaryColor, color: "#fff" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#6A006A")}
                onMouseOut={(e) => (e.currentTarget.style.background = primaryColor)}
              >
                More
              </button>
            )}

            {canShowLess && (
              <button
                type="button"
                onClick={handleShowLess}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm md:text-base font-semibold transition shadow-sm"
                style={{
                  background: "#fff",
                  color: primaryColor,
                  border: `1px solid ${primaryColor}`,
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#fff7ec")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
              >
                Show Less
              </button>
            )}
          </div>
        )}

        {!galleryLoading && filtered.length === 0 && (
          <div className="mt-10 text-center text-slate-600">
            No gallery photos yet.{" "}
            {currentUser ? "Click “Add to Gallery” to upload." : "Sign in to upload."}
          </div>
        )}
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
                    Signed-in User
                  </p>
                  <p className="text-base font-extrabold" style={{ color: primaryColor }}>
                    Add to Gallery
                  </p>
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
                  <label className="text-xs font-semibold text-slate-600">
                    Photo *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickFile}
                    className="mt-1 w-full text-sm"
                    disabled={uploading}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    JPG/PNG recommended. Max 10MB.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Caption / Title
                  </label>
                  <input
                    value={newAlt}
                    onChange={(e) => setNewAlt(e.target.value)}
                    placeholder="e.g. Behind the scenes"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Description
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short description..."
                    rows={4}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={uploading}
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
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={uploading}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {uploading && (
                  <div>
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
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-60"
                  style={{ background: accentColor, color: primaryColor }}
                >
                  {uploading ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            </motion.div>
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
                    Signed-in User
                  </p>
                  <p className="text-base font-extrabold" style={{ color: primaryColor }}>
                    Edit Gallery Item
                  </p>
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
                  <label className="text-xs font-semibold text-slate-600">
                    Replace Photo
                  </label>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickEditFile}
                    className="mt-1 w-full text-sm"
                    disabled={editing}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Leave empty to keep current image.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Caption / Title
                  </label>
                  <input
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
                    disabled={editing}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Description
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
                    disabled={editing}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={editing}
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
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={editing}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {editing && editFile && (
                  <div>
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
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={editing}
                  className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-60"
                  style={{ background: primaryColor, color: "#fff" }}
                >
                  {editing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
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
                    Signed-in User
                  </p>
                  <p className="text-base font-extrabold" style={{ color: primaryColor }}>
                    Delete Photo
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
                  Are you sure you want to delete this photo? This cannot be undone.
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
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareOpen && shareTarget && (
          <motion.div
            className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeShare();
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
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    Share Gallery Photo
                  </p>
                  <p
                    className="text-base font-extrabold truncate"
                    style={{ color: primaryColor }}
                  >
                    {shareTarget.alt ||
                      shareTarget.title ||
                      "SHEVET-CITY photo"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeShare}
                  disabled={sharingImage}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700 disabled:opacity-50"
                  aria-label="Close share options"
                >
                  <BsX className="text-2xl" />
                </button>
              </div>

              <div className="p-5">
                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img
                    src={
                      shareTarget.src ||
                      shareTarget.imageUrl ||
                      shareTarget.mediaUrl
                    }
                    alt={
                      shareTarget.alt ||
                      shareTarget.title ||
                      "SHEVET-CITY photo"
                    }
                    className="w-full h-52 object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={shareToAvailableApps}
                  disabled={sharingImage}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition disabled:opacity-60"
                  style={{ background: primaryColor }}
                >
                  <BsShare />
                  {sharingImage
                    ? "Preparing image..."
                    : "Share to available apps"}
                </button>

                <p className="mt-3 text-xs text-slate-500 text-center">
                  On supported devices, the actual photo will be attached.
                  Other options share the gallery link.
                </p>

                <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => shareToPlatform("whatsapp")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <BsWhatsapp className="text-2xl text-green-600" />
                    <span className="text-[11px] font-semibold">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => shareToPlatform("facebook")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <BsFacebook className="text-2xl text-blue-600" />
                    <span className="text-[11px] font-semibold">Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => shareToPlatform("x")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <BsTwitterX className="text-2xl text-slate-900" />
                    <span className="text-[11px] font-semibold">X</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => shareToPlatform("linkedin")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <BsLinkedin className="text-2xl text-blue-700" />
                    <span className="text-[11px] font-semibold">LinkedIn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => shareToPlatform("telegram")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <BsTelegram className="text-2xl text-sky-500" />
                    <span className="text-[11px] font-semibold">Telegram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => shareToPlatform("email")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <BsEnvelope className="text-2xl text-slate-700" />
                    <span className="text-[11px] font-semibold">Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <BsLink45Deg
                      className="text-2xl"
                      style={{ color: primaryColor }}
                    />
                    <span className="text-[11px] font-semibold">Copy link</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeItem && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70"
            variants={modalBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              variants={modalPanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    {activeItem.category || "Media"}
                  </p>

                  <p
                    className="text-sm sm:text-base font-bold truncate"
                    style={{ color: primaryColor }}
                  >
                    {activeItem.alt || activeItem.title || "SHEVET-CITY photo"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => openShare(activeItem, event)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100"
                    aria-label="Share photo"
                    title="Share photo"
                    style={{ color: primaryColor }}
                  >
                    <BsShare className="text-lg" />
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
                    aria-label="Close"
                  >
                    <BsX className="text-2xl" />
                  </button>
                </div>
              </div>

              <div className="relative bg-black">
                <img
                  src={activeItem.src}
                  alt={activeItem.alt || activeItem.title || "SHEVET-CITY photo"}
                  className="w-full max-h-[55vh] object-contain"
                />

                {filtered.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
                      aria-label="Previous image"
                    >
                      <BsChevronLeft
                        className="text-xl"
                        style={{ color: primaryColor }}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
                      aria-label="Next image"
                    >
                      <BsChevronRight
                        className="text-xl"
                        style={{ color: primaryColor }}
                      />
                    </button>
                  </>
                )}
              </div>

              <div className="px-4 sm:px-5 py-4 border-t border-slate-100 overflow-y-auto flex-1 min-h-0">
                {!!activeItem.description ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeItem.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    No description added yet.
                  </p>
                )}

                <div className="mt-3 text-xs text-slate-500">
                  {formatTimestamp(activeItem.createdAt, activeItem.createdAtMs)}
                </div>
              </div>

              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {activeIndex !== null ? activeIndex + 1 : 0} / {filtered.length}
                </p>

                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full"
                  style={{ background: primaryColor, color: "#fff" }}
                >
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