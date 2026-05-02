// src/components/AuthModal.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Firebase Auth + Firestore
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

const SCHOOL_ID = "main";

// ✅ shared test credentials
const TEST_LOGIN = {
  email: "springfieldshools12@gmail.com",
  password: "springfieldshools12",
};

export default function AuthModal({
  open,
  mode,
  setMode,
  onClose,
  // Optional: if you want to disable background swipe/interaction from parent
  onOpenChange,
}) {
  const [loading, setLoading] = useState(false);

  // ✅ form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ refs
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const auth = getAuth();

  const resetAuthForm = useCallback(() => {
    setFullName("");
    setEmail("");
    setPassword("");
  }, []);

  const safeClose = useCallback(() => {
    setLoading(false);
    resetAuthForm();
    onClose?.();
  }, [onClose, resetAuthForm]);

  const fillTestCredentials = useCallback(() => {
    setMode?.("signin");
    setEmail(TEST_LOGIN.email);
    setPassword(TEST_LOGIN.password);

    setTimeout(() => {
      if (passwordRef.current) passwordRef.current.focus();
    }, 50);
  }, [setMode]);

  // ✅ Prevent background scroll when modal open
  useEffect(() => {
    if (!open) return;
    onOpenChange?.(true);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      onOpenChange?.(false);
    };
  }, [open, onOpenChange]);

  // ✅ Focus once on open/mode change
  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => {
      if (mode === "signup") {
        if (fullNameRef.current) fullNameRef.current.focus();
        else if (emailRef.current) emailRef.current.focus();
      } else {
        if (emailRef.current) emailRef.current.focus();
      }
    }, 60);

    return () => clearTimeout(t);
  }, [open, mode]);

  // ✅ Esc to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") safeClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, safeClose]);

  const niceAuthError = (e) => {
    const code = e?.code || "";
    if (code === "auth/email-already-in-use")
      return "This email is already registered. Please sign in instead.";
    if (code === "auth/invalid-credential") return "Incorrect email or password.";
    if (code === "auth/wrong-password") return "Incorrect password.";
    if (code === "auth/user-not-found") return "No account found with this email.";
    if (code === "auth/weak-password")
      return "Password is too weak. Use at least 6 characters.";
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/network-request-failed")
      return "Network error. Check your internet and try again.";
    return e?.message || "Something went wrong. Please try again.";
  };

  // ✅ Ensure school root doc exists: springfieldschool/main
  const ensureSchoolRootExists = async () => {
    const rootRef = doc(db, "springfieldschool", SCHOOL_ID);
    const snap = await getDoc(rootRef);

    if (!snap.exists()) {
      await setDoc(
        rootRef,
        {
          schoolName: "Springfield Golden Tulip Academy",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(rootRef, { updatedAt: serverTimestamp() }, { merge: true });
    }
    return true;
  };

  // ✅ Save user under: springfieldschool/main/users/{uid}
  const saveUserToSchool = async (user, extra = {}) => {
    await ensureSchoolRootExists();

    const userRef = doc(db, "springfieldschool", SCHOOL_ID, "users", user.uid);

    const payload = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || extra.fullName || null,
      fullName: extra.fullName || user.displayName || null,
      photoURL: user.photoURL || null,
      role: "user",
      updatedAt: serverTimestamp(),
      ...extra,
    };

    await setDoc(
      userRef,
      {
        ...payload,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Signing you in...");

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      toast.update(toastId, {
        render: "Signed in ✅ Saving to school records...",
        type: "info",
        isLoading: true,
        autoClose: false,
      });

      await saveUserToSchool(res.user, { lastLoginAt: serverTimestamp() });

      toast.update(toastId, {
        render: "Welcome back! ✅",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      safeClose();
    } catch (e) {
      console.error(e);
      toast.update(toastId, {
        render: niceAuthError(e),
        type: "error",
        isLoading: false,
        autoClose: 3500,
      });
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      toast.error("Please enter full name, email and password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      toast.update(toastId, {
        render: "Account created ✅ Setting display name...",
        type: "info",
        isLoading: true,
        autoClose: false,
      });

      await updateProfile(res.user, { displayName: fullName });

      toast.update(toastId, {
        render: "Saving to SpringfieldSchool records...",
        type: "info",
        isLoading: true,
        autoClose: false,
      });

      await saveUserToSchool(res.user, {
        fullName,
        lastLoginAt: serverTimestamp(),
      });

      toast.update(toastId, {
        render: "Signup complete! ✅ You’re logged in.",
        type: "success",
        isLoading: false,
        autoClose: 2200,
      });

      safeClose();
    } catch (e) {
      console.error(e);
      toast.update(toastId, {
        render: niceAuthError(e),
        type: "error",
        isLoading: false,
        autoClose: 3500,
      });
      setLoading(false);
    }
  };

  const onEnterGoNext = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) nextRef.current.focus();
    }
  };

  const onEnterSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!loading) {
        mode === "signin" ? handleSignIn() : handleSignUp();
      }
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* ✅ ToastContainer inside modal component so it always shows */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 20000 }}
      />

      <div
        className="fixed inset-0 z-[15000] bg-black/50 flex items-center justify-center px-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) safeClose();
        }}
      >
        <div
          className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h3 className="text-lg font-extrabold text-blue-900">
                {mode === "signin" ? "Sign In" : "Create Account"}
              </h3>
              <p className="text-xs text-gray-500">
                Springfield Golden Tulip Academy
              </p>
            </div>

            <button
              onClick={safeClose}
              className="text-gray-600 hover:text-gray-900 text-xl"
              aria-label="Close"
              type="button"
            >
              <IoClose />
            </button>
          </div>

          {/* tabs */}
          <div className="flex">
            <button
              type="button"
              className={[
                "w-1/2 py-3 text-sm font-semibold",
                mode === "signin"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-blue-900",
              ].join(" ")}
              onClick={() => setMode?.("signin")}
              disabled={loading}
            >
              Sign In
            </button>

            <button
              type="button"
              className={[
                "w-1/2 py-3 text-sm font-semibold",
                mode === "signup"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-blue-900",
              ].join(" ")}
              onClick={() => setMode?.("signup")}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>

          {/* body */}
          <div className="p-5">
            {mode === "signin" && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-900">
                      Test Login
                    </p>
                    <p className="mt-2 text-xs text-slate-700 break-all">
                      <span className="font-semibold text-blue-900">Email:</span>{" "}
                      {TEST_LOGIN.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-700 break-all">
                      <span className="font-semibold text-blue-900">Password:</span>{" "}
                      {TEST_LOGIN.password}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fillTestCredentials}
                    disabled={loading}
                    className="shrink-0 rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition disabled:opacity-60"
                  >
                    Use Test Login
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-600">
                  Full Name
                </label>
                <input
                  ref={fullNameRef}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Sunday"
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring"
                  onKeyDown={(e) => onEnterGoNext(e, emailRef)}
                  inputMode="text"
                />
              </div>
            )}

            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-600">Email</label>
              <input
                ref={emailRef}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  mode === "signin"
                    ? TEST_LOGIN.email
                    : "example@gmail.com"
                }
                type="email"
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring"
                onKeyDown={(e) => onEnterGoNext(e, passwordRef)}
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div className="mb-1">
              <label className="text-xs font-semibold text-gray-600">
                Password
              </label>
              <input
                ref={passwordRef}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signin" ? TEST_LOGIN.password : "******"}
                type="password"
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring"
                onKeyDown={onEnterSubmit}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            <button
              disabled={loading}
              onClick={mode === "signin" ? handleSignIn : handleSignUp}
              className={[
                "w-full mt-4 py-3 rounded-lg font-semibold",
                "bg-yellow-400 text-blue-900 hover:bg-yellow-300 transition",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              type="button"
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Tip: press <b>Enter</b> to move/submit. (Esc closes)
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}