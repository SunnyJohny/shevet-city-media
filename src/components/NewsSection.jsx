import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsArrowRight,
  BsX,
  BsPlusCircle,
  BsPencilSquare,
  BsTrash,
  BsImage,
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

const serializeDoc = (snap) => {
  const raw = snap.data() || {};
  let createdAtMs = 0;

  if (typeof raw.createdAtMs === "number" && raw.createdAtMs > 0) {
    createdAtMs = raw.createdAtMs;
  } else if (raw.createdAt?.toDate) {
    createdAtMs = raw.createdAt.toDate().getTime();
  }

  return {
    id: snap.id,
    ...raw,
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

const HARDCODED_NEWS = [
  {
    id: "hc-1",
    title: "SHEVET-CITY Launches New Podcast Series",
    category: "Events",
    highlight: "Behind the scenes conversations with local creators.",
    content:
      "SHEVET-CITY Media is proud to announce a new weekly podcast where we interview filmmakers, journalists, and creatives from the community. Episodes drop every Monday and will cover storytelling, production tips, and career journeys.",
    imageUrl: "",
    createdAtMs: Date.now() - 1000 * 60 * 60 * 24 * 7,
    createdAt: null,
    isFallback: true,
  },
  {
    id: "hc-2",
    title: "Photo Feature: Community Arts Day",
    category: "Events",
    highlight: "A day of murals, music, and collaborative art.",
    content:
      "Our photographers captured inspiring moments from Community Arts Day — families painting murals, youth performances, and live installations. View the full gallery in the Gallery section.",
    imageUrl: "",
    createdAtMs: Date.now() - 1000 * 60 * 60 * 24 * 3,
    createdAt: null,
    isFallback: true,
  },
  {
    id: "hc-3",
    title: "Call for Contributors: Local Editorials",
    category: "General",
    highlight: "We want to hear your voice.",
    content:
      "SHEVET-CITY is opening submissions for local editorial pieces. If you're a writer or commentator with a perspective on culture, society, or media, submit a 600–1,200 word piece to editorial@shevecitymedia.com.",
    imageUrl: "",
    createdAtMs: Date.now() - 1000 * 60 * 60 * 24,
    createdAt: null,
    isFallback: true,
  },
];

const NewsSection = ({
  title = "Latest from SHEVET-CITY Media",
  subtitle = "Stay informed about updates, releases, and events from SHEVET-CITY Media.",
}) => {
  const { currentUser } = useMyContext();

  const [newsList, setNewsList] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  const [activeCat, setActiveCat] = useState("All");
  const [openItem, setOpenItem] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addUploadProgress, setAddUploadProgress] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newHighlight, setNewHighlight] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newStatus, setNewStatus] = useState("published");
  const [newImageFile, setNewImageFile] = useState(null);
  const addFileInputRef = useRef(null);

  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editHighlight, setEditHighlight] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState("published");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editExistingImageUrl, setEditExistingImageUrl] = useState("");
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const editFileInputRef = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const newsCollectionRef = useMemo(() => {
    return collection(db, "shevetCity", SHEVET_CITY_ID, "news");
  }, []);

  const loadNews = useCallback(async () => {
    try {
      setNewsLoading(true);
      setNewsError(null);

      const q = query(newsCollectionRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const data = snap.docs.map(serializeDoc);
      setNewsList(sortByCreatedDesc(data));
    } catch (error) {
      console.error("Shevet-City news fetch error:", error);
      setNewsError(error.message || "Failed to load news.");
      setNewsList([]);
    } finally {
      setNewsLoading(false);
    }
  }, [newsCollectionRef]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const items = useMemo(() => {
    return newsList.length > 0 ? newsList : HARDCODED_NEWS;
  }, [newsList]);

  const categories = useMemo(() => getUniqueCategories(items), [items]);

  const filtered = useMemo(() => {
    if (activeCat === "All") return items;
    return items.filter((x) => x.category === activeCat);
  }, [items, activeCat]);

  const gridAnimateState = !newsLoading ? "visible" : "hidden";

  useEffect(() => {
    if (!openItem) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [openItem]);

  const validateImageFile = (selectedFile, inputElement) => {
    if (!selectedFile) return false;

    if (!selectedFile.type?.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      if (inputElement) inputElement.value = "";
      return false;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      if (inputElement) inputElement.value = "";
      return false;
    }

    return true;
  };

  const handlePickNewImage = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!validateImageFile(selectedFile, e.target)) return;

    setNewImageFile(selectedFile);
  };

  const handlePickEditImage = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!validateImageFile(selectedFile, e.target)) return;

    setEditImageFile(selectedFile);
    setRemoveExistingImage(false);
  };

  const uploadToCloudinary = (selectedFile, folderName, progressSetter) => {
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
        if (event.lengthComputable && progressSetter) {
          const progress = Math.round((event.loaded / event.total) * 100);
          progressSetter(progress);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300) {
            if (progressSetter) progressSetter(100);
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

  const resetAddForm = () => {
    setNewTitle("");
    setNewCategory("General");
    setNewHighlight("");
    setNewContent("");
    setNewStatus("published");
    setNewImageFile(null);
    setAddUploadProgress(0);

    if (addFileInputRef.current) addFileInputRef.current.value = "";
  };

  const closeAdd = () => {
    if (savingAdd) return;
    setAddOpen(false);
    resetAddForm();
  };

  const openAddModal = () => {
    if (!currentUser) {
      toast.error("Please sign in before adding news.");
      return;
    }

    setAddOpen(true);
  };

  const openEdit = (item) => {
    if (!currentUser) {
      toast.error("Please sign in before editing news.");
      return;
    }

    if (item?.isFallback || String(item?.id || "").startsWith("hc-")) {
      toast.info("This is a hardcoded news item. Add it first before editing.");
      return;
    }

    setEditId(item?.id || null);
    setEditTitle(item?.title || "");
    setEditCategory(item?.category || "General");
    setEditHighlight(item?.highlight || "");
    setEditContent(item?.content || "");
    setEditStatus(item?.status || "published");
    setEditExistingImageUrl(item?.imageUrl || item?.mediaUrl || "");
    setEditImageFile(null);
    setRemoveExistingImage(false);
    setEditUploadProgress(0);
    setEditOpen(true);

    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const closeEdit = () => {
    if (savingEdit) return;

    setEditOpen(false);
    setEditId(null);
    setEditTitle("");
    setEditCategory("General");
    setEditHighlight("");
    setEditContent("");
    setEditStatus("published");
    setEditImageFile(null);
    setEditExistingImageUrl("");
    setRemoveExistingImage(false);
    setEditUploadProgress(0);

    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const openDelete = (item) => {
    if (!currentUser) {
      toast.error("Please sign in before deleting news.");
      return;
    }

    if (item?.isFallback || String(item?.id || "").startsWith("hc-")) {
      toast.info("This is a hardcoded news item and cannot be deleted from here.");
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

  const getUserName = () => {
    return currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  };

  const handleAddNews = async () => {
    if (!currentUser) {
      toast.error("Please sign in before adding news.");
      return;
    }

    if (!newTitle.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    if (!newCategory) {
      toast.error("Please select a category.");
      return;
    }

    if (!newContent.trim()) {
      toast.error("Please enter the news content.");
      return;
    }

    try {
      setSavingAdd(true);
      setAddUploadProgress(0);

      let imageUrl = "";

      if (newImageFile) {
        imageUrl = await uploadToCloudinary(
          newImageFile,
          "shevet-city/news",
          setAddUploadProgress
        );
      }

      const payload = {
        title: newTitle.trim(),
        category: newCategory,
        highlight: newHighlight.trim(),
        content: newContent.trim(),
        status: newStatus,
        imageUrl,
        mediaUrl: imageUrl,
        fileName: newImageFile?.name || "",
        fileType: newImageFile?.type || "",
        fileSize: newImageFile?.size || 0,
        storageProvider: imageUrl ? "cloudinary" : "",
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByName: getUserName(),
        createdByEmail: currentUser.email || "",
      };

      await addDoc(newsCollectionRef, payload);

      toast.success("News published successfully.");
      closeAdd();
      await loadNews();
    } catch (error) {
      console.error("Error adding Shevet-City news:", error);
      toast.error(error.message || "Failed to publish news.");
    } finally {
      setSavingAdd(false);
    }
  };

  const handleEditSave = async () => {
    if (!currentUser) {
      toast.error("Please sign in before editing news.");
      return;
    }

    if (!editId) {
      toast.error("Missing news item id.");
      return;
    }

    if (!editTitle.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    if (!editContent.trim()) {
      toast.error("Please enter the news content.");
      return;
    }

    try {
      setSavingEdit(true);
      setEditUploadProgress(0);

      let imageUrl = editExistingImageUrl;

      if (removeExistingImage) {
        imageUrl = "";
      }

      if (editImageFile) {
        imageUrl = await uploadToCloudinary(
          editImageFile,
          "shevet-city/news",
          setEditUploadProgress
        );
      }

      const payload = {
        title: editTitle.trim(),
        category: editCategory || "General",
        highlight: editHighlight.trim(),
        content: editContent.trim(),
        status: editStatus,
        imageUrl,
        mediaUrl: imageUrl,
        updatedAt: serverTimestamp(),
        updatedAtMs: Date.now(),
        updatedBy: currentUser.uid,
        updatedByName: getUserName(),
        updatedByEmail: currentUser.email || "",
      };

      if (editImageFile) {
        payload.fileName = editImageFile.name;
        payload.fileType = editImageFile.type;
        payload.fileSize = editImageFile.size;
        payload.storageProvider = "cloudinary";
      }

      if (removeExistingImage) {
        payload.fileName = "";
        payload.fileType = "";
        payload.fileSize = 0;
        payload.storageProvider = "";
      }

      const newsRef = doc(db, "shevetCity", SHEVET_CITY_ID, "news", editId);
      await updateDoc(newsRef, payload);

      toast.success("News updated successfully.");
      closeEdit();
      await loadNews();
    } catch (error) {
      console.error("Error updating Shevet-City news:", error);
      toast.error(error.message || "Failed to update news.");
    } finally {
      setSavingEdit(false);
    }
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
        deleteTarget.id
      );

      await deleteDoc(newsRef);

      toast.success("News deleted successfully.");
      closeDelete();
      await loadNews();
    } catch (error) {
      console.error("Error deleting Shevet-City news:", error);
      toast.error(error.message || "Failed to delete news.");
    } finally {
      setDeleting(false);
    }
  };

  const primaryColor = "#5A005A";
  const accentColor = "#F29A00";
  const accentHover = "#FFA500";

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
            <p
              className="text-xs font-semibold tracking-[0.3em] uppercase mb-2"
              style={{ color: primaryColor }}
            >
              News & Updates
            </p>

            <h2
              className="text-3xl md:text-4xl font-extrabold leading-tight"
              style={{ color: primaryColor }}
            >
              {title}
            </h2>

            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-xl">
              {subtitle}
            </p>

            {currentUser && (
              <p className="text-xs font-semibold mt-3" style={{ color: primaryColor }}>
                Signed-in CRUD mode active. You can add, edit, and delete news.
              </p>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            {newsLoading && (
              <div className="text-xs font-semibold text-slate-500">
                Loading news...
              </div>
            )}

            {newsError && (
              <div className="text-xs font-semibold text-red-600">
                Failed to load Firestore news. Showing local fallback content.
              </div>
            )}

            {currentUser ? (
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition"
                style={{
                  background: accentColor,
                  color: primaryColor,
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = accentHover)}
                onMouseOut={(e) => (e.currentTarget.style.background = accentColor)}
              >
                <BsPlusCircle className="text-base" />
                Add News
              </button>
            ) : (
              <div className="text-xs font-semibold text-slate-500">
                Sign in to add news.
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
          variants={containerVariants}
          initial="hidden"
          animate={gridAnimateState}
          className="grid gap-6 md:grid-cols-3"
        >
          {filtered.map((item) => {
            const imageUrl = item.imageUrl || item.mediaUrl || "";

            return (
              <motion.article
                key={item.id}
                variants={cardVariants}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-500"
              >
                <div
                  className="absolute left-0 top-0 h-1 w-full z-10"
                  style={{
                    background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                  }}
                />

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.title || "SHEVET-CITY news"}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-48 bg-[#f7eef7] flex items-center justify-center">
                    <div className="text-center px-4">
                      <BsImage className="text-4xl mx-auto mb-2" style={{ color: primaryColor }} />
                      <p className="text-xs font-semibold" style={{ color: primaryColor }}>
                        SHEVET-CITY News
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-5 pb-5 flex flex-col h-full">
                  <div className="flex items-center justify-end mb-3">
                    <span
                      className="text-[11px] font-semibold px-3 py-1 rounded-full border"
                      style={{
                        background: "#f7eef7",
                        color: primaryColor,
                        borderColor: "#ead9ea",
                      }}
                    >
                      {item.category || "General"}
                    </span>
                  </div>

                  <h3
                    className="text-lg md:text-xl font-bold group-hover:transition-colors"
                    style={{ color: primaryColor }}
                  >
                    {item.title}
                  </h3>

                  {!!item.highlight && (
                    <p className="mt-2 text-sm font-medium" style={{ color: accentColor }}>
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
                        className="inline-flex items-center gap-2 text-sm font-semibold"
                        style={{ color: primaryColor }}
                      >
                        Read more
                        <span
                          className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors"
                          style={{
                            borderColor: "#f0e0c6",
                            color: primaryColor,
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = accentColor;
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = primaryColor;
                          }}
                        >
                          <BsArrowRight className="text-xs" />
                        </span>
                      </button>

                      {currentUser && !item.isFallback && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-inherit border border-slate-200 shadow-sm flex items-center justify-center"
                            aria-label="Edit"
                            title="Edit"
                            style={{ color: primaryColor }}
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

                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, rgba(90,0,90,0.03), rgba(242,154,0,0.06))`,
                  }}
                />
              </motion.article>
            );
          })}
        </motion.div>

        {!newsLoading && filtered.length === 0 && (
          <div className="mt-10 text-center text-slate-600">
            No news posts yet.{" "}
            {currentUser ? "Click “Add News” to publish one." : "Sign in to publish."}
          </div>
        )}
      </div>

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
              {(openItem.imageUrl || openItem.mediaUrl) && (
                <img
                  src={openItem.imageUrl || openItem.mediaUrl}
                  alt={openItem.title || "SHEVET-CITY news"}
                  className="w-full h-56 object-cover"
                />
              )}

              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    {openItem.category || "General"} •{" "}
                    {formatDate(openItem.createdAt, openItem.createdAtMs)}
                  </p>
                  <p
                    className="text-base font-extrabold truncate"
                    style={{ color: primaryColor }}
                  >
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

              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                {!!openItem.highlight && (
                  <p className="text-sm font-semibold" style={{ color: accentColor }}>
                    {openItem.highlight}
                  </p>
                )}
                <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                  {openItem.content}
                </p>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenItem(null)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition"
                  style={{ background: primaryColor, color: "#fff" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#6A006A")}
                  onMouseOut={(e) => (e.currentTarget.style.background = primaryColor)}
                >
                  Close <BsX />
                </button>
              </div>
            </motion.div>
          </motion.div>
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
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeAdd();
            }}
          >
            <motion.div
              variants={modalPanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    Signed-in User
                  </p>
                  <p className="text-base font-extrabold" style={{ color: primaryColor }}>
                    Add News
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
                    News Image
                  </label>
                  <input
                    ref={addFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickNewImage}
                    className="mt-1 w-full text-sm"
                    disabled={savingAdd}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Optional. JPG/PNG recommended. Max 10MB.
                  </p>
                  {newImageFile && (
                    <p className="mt-1 text-xs text-slate-600">
                      Selected: <span className="font-semibold">{newImageFile.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Title</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. SHEVET-CITY announces new production"
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
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={savingAdd}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Highlight
                  </label>
                  <input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    placeholder="Short highlight..."
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

                {savingAdd && newImageFile && (
                  <div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 transition-all"
                        style={{
                          width: `${addUploadProgress}%`,
                          background: primaryColor,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Uploading image... {addUploadProgress}%
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddNews}
                  disabled={savingAdd}
                  className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-60"
                  style={{ background: accentColor, color: primaryColor }}
                  onMouseOver={(e) => (e.currentTarget.style.background = accentHover)}
                  onMouseOut={(e) => (e.currentTarget.style.background = accentColor)}
                >
                  {savingAdd ? "Publishing..." : "Publish News"}
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
              className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
                    Signed-in User
                  </p>
                  <p className="text-base font-extrabold" style={{ color: primaryColor }}>
                    Edit News
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
                {editExistingImageUrl && !removeExistingImage && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Current Image
                    </label>
                    <img
                      src={editExistingImageUrl}
                      alt="Current news"
                      className="mt-2 w-full h-40 object-cover rounded-xl border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveExistingImage(true);
                        setEditExistingImageUrl("");
                      }}
                      disabled={savingEdit}
                      className="mt-2 text-xs font-semibold text-red-600"
                    >
                      Remove current image
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Replace News Image
                  </label>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickEditImage}
                    className="mt-1 w-full text-sm"
                    disabled={savingEdit}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Optional. Leave empty to keep current image.
                  </p>
                  {editImageFile && (
                    <p className="mt-1 text-xs text-slate-600">
                      Selected: <span className="font-semibold">{editImageFile.name}</span>
                    </p>
                  )}
                </div>

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
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring bg-white"
                    disabled={savingEdit}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Highlight
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

                {savingEdit && editImageFile && (
                  <div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 transition-all"
                        style={{
                          width: `${editUploadProgress}%`,
                          background: primaryColor,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Uploading image... {editUploadProgress}%
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={savingEdit}
                  className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-60"
                  style={{ background: primaryColor, color: "#fff" }}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
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
                  Are you sure you want to delete this news post? This cannot be undone.
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
    </section>
  );
};

export default NewsSection;