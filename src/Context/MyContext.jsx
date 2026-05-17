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

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const MyContext = createContext(null);

export const useMyContext = () => {
  const context = useContext(MyContext);
  return context;
};

const SHEVET_CITY_ID = "the-shevet-city";

const CACHE_KEYS = {
  gallery: `shevetcity_${SHEVET_CITY_ID}_gallery_cache`,
  news: `shevetcity_${SHEVET_CITY_ID}_news_cache`,
  role: (uid) => `shevetcity_${SHEVET_CITY_ID}_role_cache_${uid}`,
};

const CACHE_TTL = {
  gallery: 1000 * 60 * 10,
  news: 1000 * 60 * 5,
  role: 1000 * 60 * 5,
};

const ADMIN_EMAILS = ["johnsunday803@gmail.com"];

const canUseStorage = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

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

const removeCache = (key) => {
  try {
    if (!canUseStorage()) return;
    localStorage.removeItem(key);
  } catch (err) {
    console.error("removeCache error:", err);
  }
};

const isCacheFresh = (entry, ttl) => {
  if (!entry?.savedAt) return false;
  return Date.now() - entry.savedAt < ttl;
};

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
    role: admin ? "admin" : roleValue || "viewer",
    isAdmin: admin,
  };
};

export const MyContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [gallery, setGallery] = useState(() => {
    const cached = readCache(CACHE_KEYS.gallery);
    return Array.isArray(cached?.data) ? cached.data : [];
  });

  const [galleryLoading, setGalleryLoading] = useState(() => {
    const cached = readCache(CACHE_KEYS.gallery);
    return !(cached && Array.isArray(cached.data));
  });

  const [galleryError, setGalleryError] = useState(null);

  const [news, setNews] = useState(() => {
    const cached = readCache(CACHE_KEYS.news);
    return Array.isArray(cached?.data) ? cached.data : [];
  });

  const [newsLoading, setNewsLoading] = useState(() => {
    const cached = readCache(CACHE_KEYS.news);
    return !(cached && Array.isArray(cached.data));
  });

  const [newsError, setNewsError] = useState(null);

  const roleRequestRef = useRef({});
  const galleryRequestRef = useRef(null);
  const newsRequestRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (user) => {
      const activeUser = user || null;
      setCurrentUser(activeUser);

      if (!activeUser) {
        setIsAdmin(false);
        return;
      }

      const email = String(activeUser.email || "").toLowerCase();

      if (ADMIN_EMAILS.includes(email)) {
        setIsAdmin(true);
      }
    });

    return () => unsub();
  }, []);

  const loadUserRole = useCallback(
    async (uid, email = "", forceRefresh = false) => {
      if (!uid) {
        setIsAdmin(false);
        return;
      }

      const cacheKey = CACHE_KEYS.role(uid);
      const cached = readCache(cacheKey);

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
          const userRef = doc(db, "shevetCity", SHEVET_CITY_ID, "users", uid);
          const snap = await getDoc(userRef);

          const normalized = snap.exists()
            ? normalizeRolePayload(snap.data(), email)
            : normalizeRolePayload({}, email);

          setIsAdmin(normalized.isAdmin);
          writeCache(cacheKey, normalized);
        } catch (err) {
          console.error("Shevet-City role get error:", err);

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
    },
    []
  );

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsAdmin(false);
      return;
    }

    loadUserRole(currentUser.uid, currentUser.email || "");
  }, [currentUser?.uid, currentUser?.email, loadUserRole]);

  const signInShevetCityUser = useCallback(
    async ({ email, password }) => {
      const auth = getAuth();

      if (!email || !password) {
        throw new Error("Email and password are required.");
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      await loadUserRole(result.user.uid, result.user.email || "", true);

      return result.user;
    },
    [loadUserRole]
  );

  const signUpShevetCityUser = useCallback(
    async ({ name, phone, email, password, role = "viewer" }) => {
      const auth = getAuth();

      if (!name || !email || !password) {
        throw new Error("Name, email, and password are required.");
      }

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (result.user) {
        await updateProfile(result.user, {
          displayName: name,
        });
      }

      const normalizedRole = ADMIN_EMAILS.includes(
        String(email || "").toLowerCase()
      )
        ? "admin"
        : role || "viewer";

      const userPayload = {
        uid: result.user.uid,
        name,
        displayName: name,
        phone: phone || "",
        email,
        role: normalizedRole,
        isAdmin: normalizedRole === "admin",
        provider: "email-password",
        platform: "shevet-city",
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
        updatedAt: serverTimestamp(),
      };

      const userRef = doc(
        db,
        "shevetCity",
        SHEVET_CITY_ID,
        "users",
        result.user.uid
      );

      await setDoc(userRef, userPayload, { merge: true });

      writeCache(CACHE_KEYS.role(result.user.uid), {
        role: normalizedRole,
        isAdmin: normalizedRole === "admin",
      });

      setIsAdmin(normalizedRole === "admin");

      return result.user;
    },
    []
  );

  const logoutShevetCityUser = useCallback(async () => {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;

    await signOut(auth);

    setCurrentUser(null);
    setIsAdmin(false);

    if (uid) {
      removeCache(CACHE_KEYS.role(uid));
    }
  }, []);

  const loadGallery = useCallback(async (forceRefresh = false) => {
    setGalleryError(null);

    const cached = readCache(CACHE_KEYS.gallery);

    if (!forceRefresh && cached && isCacheFresh(cached, CACHE_TTL.gallery)) {
      setGallery(Array.isArray(cached.data) ? cached.data : []);
      setGalleryLoading(false);
      return;
    }

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
        const galleryRef = collection(
          db,
          "shevetCity",
          SHEVET_CITY_ID,
          "gallery"
        );

        const q = query(galleryRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const data = snap.docs.map(serializeDoc);
        const sorted = sortByCreatedDesc(data);

        setGallery(sorted);
        setGalleryLoading(false);
        setGalleryError(null);

        writeCache(CACHE_KEYS.gallery, sorted);
      } catch (err) {
        console.error("Shevet-City gallery get error:", err);

        if (cached && Array.isArray(cached.data)) {
          setGallery(cached.data);
        } else {
          setGallery([]);
        }

        setGalleryLoading(false);
        setGalleryError(err?.message || "Failed to load Shevet-City gallery");
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

  const loadNews = useCallback(async (forceRefresh = false) => {
    setNewsError(null);

    const cached = readCache(CACHE_KEYS.news);

    if (!forceRefresh && cached && isCacheFresh(cached, CACHE_TTL.news)) {
      setNews(Array.isArray(cached.data) ? cached.data : []);
      setNewsLoading(false);
      return;
    }

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
      const newsRef = collection(db, "shevetCity", SHEVET_CITY_ID, "news");

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
        console.error("Shevet-City news primary get error:", err1);

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
          console.error("Shevet-City news fallback get error:", err2);

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
            console.error("Shevet-City news final get error:", err3);

            if (cached && Array.isArray(cached.data)) {
              setNews(cached.data);
            } else {
              setNews([]);
            }

            setNewsLoading(false);
            setNewsError(err3?.message || "Failed to load Shevet-City news");
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
      currentUser,
      isAdmin,

      signInShevetCityUser,
      signUpShevetCityUser,
      logoutShevetCityUser,

      signInShevetUser: signInShevetCityUser,
      signUpShevetUser: signUpShevetCityUser,
      logoutShevetUser: logoutShevetCityUser,

      gallery,
      galleryLoading,
      galleryError,
      refreshGallery,

      news,
      newsLoading,
      newsError,
      refreshNews,

      refreshRole,

      shevetGallery: gallery,
      publishedShevetGallery: gallery,
    }),
    [
      currentUser,
      isAdmin,
      signInShevetCityUser,
      signUpShevetCityUser,
      logoutShevetCityUser,
      gallery,
      galleryLoading,
      galleryError,
      refreshGallery,
      news,
      newsLoading,
      newsError,
      refreshNews,
      refreshRole,
    ]
  );

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

export default MyContextProvider;