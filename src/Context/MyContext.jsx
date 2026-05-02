// src/Context/MyContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { db } from "../firebase";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";

const MyContext = createContext(null);

export const useMyContext = () => {
  const context = useContext(MyContext);
  return context;
};

const SCHOOL_ID = "main";

// =========================
// Browser cache settings
// =========================
const CACHE_KEYS = {
  gallery: `springfieldschool_${SCHOOL_ID}_gallery_cache`,
  news: `springfieldschool_${SCHOOL_ID}_news_cache`,
  role: (uid) => `springfieldschool_${SCHOOL_ID}_role_cache_${uid}`,
};

const CACHE_TTL = {
  gallery: 1000 * 60 * 10, // 10 mins
  news: 1000 * 60 * 5, // 5 mins
  role: 1000 * 60 * 5, // 5 mins
};

// Optional admin email fallback
const ADMIN_EMAILS = ["johnsunday803@gmail.com"];

// =========================
// Safe browser storage helpers
// =========================
const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const readCache = (key) => {
  try {
    if (!canUseStorage()) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch (err) {
    console.error("readCache error:", err);
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    if (!canUseStorage()) return;
    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
  } catch (err) {
    console.error("writeCache error:", err);
  }
};

const isCacheFresh = (entry, ttl) => {
  if (!entry?.savedAt) return false;
  return Date.now() - entry.savedAt < ttl;
};

// =========================
// Normalize Firestore data
// =========================
const serializeDoc = (snap) => {
  const raw = snap.data() || {};

  let createdAtMs = 0;
  let createdAtISO = null;

  if (typeof raw?.createdAtMs === "number" && raw.createdAtMs > 0) {
    createdAtMs = raw.createdAtMs;
    createdAtISO = new Date(raw.createdAtMs).toISOString();
  } else if (raw?.createdAt?.toDate) {
    const d = raw.createdAt.toDate();
    createdAtMs = d.getTime();
    createdAtISO = d.toISOString();
  }

  return {
    id: snap.id,
    ...raw,
    createdAtMs,
    createdAtISO,
  };
};

const sortByCreatedDesc = (arr = []) => {
  return [...arr].sort((a, b) => {
    const aMs = typeof a?.createdAtMs === "number" ? a.createdAtMs : 0;
    const bMs = typeof b?.createdAtMs === "number" ? b.createdAtMs : 0;
    return bMs - aMs;
  });
};

const normalizeRolePayload = (data, email = "") => {
  const roleValue =
    typeof data?.role === "string" ? data.role.trim().toLowerCase() : "";

  const emailMatch = ADMIN_EMAILS.includes(String(email || "").toLowerCase());

  const admin =
    data?.isAdmin === true ||
    roleValue === "admin" ||
    roleValue === "superadmin" ||
    emailMatch;

  return {
    role: admin ? "admin" : roleValue || null,
    isAdmin: admin,
  };
};

export const MyContextProvider = ({ children }) => {
  // ✅ auth
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ role
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ gallery (GLOBAL)
  const [gallery, setGallery] = useState(() => {
    const cached = readCache(CACHE_KEYS.gallery);
    return Array.isArray(cached?.data) ? cached.data : [];
  });
  const [galleryLoading, setGalleryLoading] = useState(() => {
    const cached = readCache(CACHE_KEYS.gallery);
    return !(cached && Array.isArray(cached.data));
  });
  const [galleryError, setGalleryError] = useState(null);

  // ✅ news (GLOBAL)
  const [news, setNews] = useState(() => {
    const cached = readCache(CACHE_KEYS.news);
    return Array.isArray(cached?.data) ? cached.data : [];
  });
  const [newsLoading, setNewsLoading] = useState(() => {
    const cached = readCache(CACHE_KEYS.news);
    return !(cached && Array.isArray(cached.data));
  });
  const [newsError, setNewsError] = useState(null);

  // prevent duplicate fetches in React StrictMode / rapid rerenders
  const roleRequestRef = useRef({});
  const galleryRequestRef = useRef(null);
  const newsRequestRef = useRef(null);

  // -------------------------
  // 1) Watch auth state
  // -------------------------
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (u) => {
      const user = u || null;
      setCurrentUser(user);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      // quick zero-read fallback while role doc loads
      const email = String(user.email || "").toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        setIsAdmin(true);
      }
    });

    return () => unsub();
  }, []);

  // -------------------------
  // 2) Load role ONCE: springfieldschool/main/users/{uid}
  //    Uses localStorage cache to reduce reads
  // -------------------------
  const loadUserRole = useCallback(async (uid, email = "", forceRefresh = false) => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }

    const cacheKey = CACHE_KEYS.role(uid);
    const cached = readCache(cacheKey);

    // ✅ use fresh cache first
    if (!forceRefresh && cached && isCacheFresh(cached, CACHE_TTL.role)) {
      const cachedIsAdmin =
        cached?.data?.isAdmin === true ||
        String(cached?.data?.role || "").toLowerCase() === "admin";

      setIsAdmin(cachedIsAdmin);
      return;
    }

    if (!forceRefresh && roleRequestRef.current[uid]) {
      return roleRequestRef.current[uid];
    }

    const request = (async () => {
      try {
        const userRef = doc(db, "springfieldschool", SCHOOL_ID, "users", uid);
        const snap = await getDoc(userRef);

        const normalized = snap.exists()
          ? normalizeRolePayload(snap.data(), email)
          : normalizeRolePayload({}, email);

        setIsAdmin(normalized.isAdmin);
        writeCache(cacheKey, normalized);
      } catch (err) {
        console.error("Role get error:", err);

        const fallbackIsAdmin =
          cached?.data?.isAdmin === true ||
          String(cached?.data?.role || "").toLowerCase() === "admin" ||
          ADMIN_EMAILS.includes(String(email || "").toLowerCase());

        setIsAdmin(fallbackIsAdmin);
      } finally {
        delete roleRequestRef.current[uid];
      }
    })();

    roleRequestRef.current[uid] = request;
    return request;
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsAdmin(false);
      return;
    }

    loadUserRole(currentUser.uid, currentUser.email || "");
  }, [currentUser?.uid, currentUser?.email, loadUserRole]);

  // -------------------------
  // 3) Load gallery ONCE: springfieldschool/main/gallery
  //    Uses browser cache first to reduce reads
  // -------------------------
  const loadGallery = useCallback(async (forceRefresh = false) => {
    setGalleryError(null);

    const cached = readCache(CACHE_KEYS.gallery);

    // ✅ show fresh cache only, no read
    if (!forceRefresh && cached && isCacheFresh(cached, CACHE_TTL.gallery)) {
      setGallery(Array.isArray(cached.data) ? cached.data : []);
      setGalleryLoading(false);
      return;
    }

    // ✅ show stale cache while background refresh runs
    if (cached && Array.isArray(cached.data)) {
      setGallery(cached.data);
      setGalleryLoading(false);
    } else {
      setGalleryLoading(true);
    }

    if (!forceRefresh && galleryRequestRef.current) {
      return galleryRequestRef.current;
    }

    const request = (async () => {
      try {
        const galleryRef = collection(db, "springfieldschool", SCHOOL_ID, "gallery");
        const q = query(galleryRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const data = snap.docs.map(serializeDoc);
        const sorted = sortByCreatedDesc(data);

        setGallery(sorted);
        setGalleryLoading(false);
        setGalleryError(null);

        writeCache(CACHE_KEYS.gallery, sorted);
      } catch (err) {
        console.error("Gallery get error:", err);

        if (cached && Array.isArray(cached.data)) {
          setGallery(cached.data);
        } else {
          setGallery([]);
        }

        setGalleryLoading(false);
        setGalleryError(err?.message || "Failed to load gallery");
      } finally {
        galleryRequestRef.current = null;
      }
    })();

    galleryRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // -------------------------
  // 4) Load news ONCE: springfieldschool/main/news
  //    Strategy:
  //      A) Try orderBy(createdAtMs)
  //      B) Fallback orderBy(createdAt)
  //      C) Fallback no orderBy + client sort
  //    Uses browser cache first to reduce reads
  // -------------------------
  const loadNews = useCallback(async (forceRefresh = false) => {
    setNewsError(null);

    const cached = readCache(CACHE_KEYS.news);

    // ✅ use fresh cache first
    if (!forceRefresh && cached && isCacheFresh(cached, CACHE_TTL.news)) {
      setNews(Array.isArray(cached.data) ? cached.data : []);
      setNewsLoading(false);
      return;
    }

    // ✅ show stale cache while background refresh runs
    if (cached && Array.isArray(cached.data)) {
      setNews(cached.data);
      setNewsLoading(false);
    } else {
      setNewsLoading(true);
    }

    if (!forceRefresh && newsRequestRef.current) {
      return newsRequestRef.current;
    }

    const request = (async () => {
      const newsRef = collection(db, "springfieldschool", SCHOOL_ID, "news");

      try {
        const q1 = query(newsRef, orderBy("createdAtMs", "desc"));
        const snap = await getDocs(q1);

        const data = snap.docs.map(serializeDoc);
        const sorted = sortByCreatedDesc(data);

        setNews(sorted);
        setNewsLoading(false);
        setNewsError(null);

        writeCache(CACHE_KEYS.news, sorted);
        return;
      } catch (err1) {
        console.error("News primary get error (createdAtMs):", err1);

        try {
          const q2 = query(newsRef, orderBy("createdAt", "desc"));
          const snap2 = await getDocs(q2);

          const data2 = snap2.docs.map(serializeDoc);
          const sorted2 = sortByCreatedDesc(data2);

          setNews(sorted2);
          setNewsLoading(false);
          setNewsError(null);

          writeCache(CACHE_KEYS.news, sorted2);
          return;
        } catch (err2) {
          console.error("News fallback get error (createdAt):", err2);

          try {
            const snap3 = await getDocs(newsRef);

            const data3 = snap3.docs.map(serializeDoc);
            const sorted3 = sortByCreatedDesc(data3);

            setNews(sorted3);
            setNewsLoading(false);
            setNewsError(null);

            writeCache(CACHE_KEYS.news, sorted3);
            return;
          } catch (err3) {
            console.error("News fallback get error (no order):", err3);

            if (cached && Array.isArray(cached.data)) {
              setNews(cached.data);
            } else {
              setNews([]);
            }

            setNewsLoading(false);
            setNewsError(err3?.message || "Failed to load news");
          }
        }
      } finally {
        newsRequestRef.current = null;
      }
    })();

    newsRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // -------------------------
  // Optional manual refreshers
  // -------------------------
  const refreshGallery = useCallback(() => {
    return loadGallery(true);
  }, [loadGallery]);

  const refreshNews = useCallback(() => {
    return loadNews(true);
  }, [loadNews]);

  const refreshRole = useCallback(() => {
    if (!currentUser?.uid) {
      setIsAdmin(false);
      return Promise.resolve();
    }
    return loadUserRole(currentUser.uid, currentUser.email || "", true);
  }, [currentUser?.uid, currentUser?.email, loadUserRole]);

  const value = useMemo(
    () => ({
      // auth
      currentUser,
      isAdmin,

      // gallery
      gallery,
      galleryLoading,
      galleryError,
      refreshGallery,

      // news
      news,
      newsLoading,
      newsError,
      refreshNews,

      // role
      refreshRole,
    }),
    [
      currentUser,
      isAdmin,
      gallery,
      galleryLoading,
      galleryError,
      news,
      newsLoading,
      newsError,
      refreshGallery,
      refreshNews,
      refreshRole,
    ]
  );

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

export default MyContextProvider;  