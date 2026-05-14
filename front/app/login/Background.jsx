"use client";
import "./Background.css";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from "motion/react"
import {Button } from "../animations/Button.jsx"
import { useEffect, useRef, useState } from 'react';
import lottie from "lottie-web";
import Mascot from "@/public/mascot.json";
import MascotCartoon from "@/public/mascot-cartoon.json";
import Celeb from "@/public/celebrations.json";
import { useRouter } from 'next/navigation';
import api from "@/lib/api";

export function Background({ signInOpen, setSignInOpen }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [Submit, setSubmit] = useState(false);
  const [isSignUpMode, setisSignUpMode] = useState(false);
  const [form, setForm] = useState({ age: "", email: "", password: "", username: "" });
  const [Profile, setProfile] = useState([]);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function showNotification(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 6000);
  }

  async function fetchVerified() {
    try {
      const data = await api.get(`/api/users/find?email=${form.email}`);
      if (data && data.length > 0) {
        setProfile(data[0]);
      }
      setIsSignIn(true);
      setSubmit(!Submit)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid credentials");
      showNotification(error instanceof Error ? error.message : "Invalid credentials");
      setForm({ email: "", password: "", age: "", username: "" });
      setLoading(false);
    }
  }

  function handle42Login() {
    window.location.href = api.getUrl('/api/auth/42/login');
  }

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (loading) return;
    if (!form.email || !form.password) { setError("Remplissez tous les champs !"); showNotification("Remplissez tous les champs !"); return; }
    if (isSignUpMode && !form.age) { setError("Remplissez tous les champs !"); showNotification("Remplissez tous les champs !"); return; }
    if (isSignUpMode && !form.username) { setError("Choisissez un pseudo !"); showNotification("Choisissez un pseudo !"); return; }
    else if (isSignUpMode) { setLoading(true); setIsSignUp(true); setSubmit(!Submit); return; }
    else { setLoading(true); fetchVerified(); return; }
  };

  useEffect(() => {
    if (!isSignUp && !isSignIn) return;
    async function fetchData() {
      try {
        if (isSignUp) {
          await api.post('/api/users/add', {
            ...form,
            age: Number(form.age),
            verified: false,
          });
        } else {
          await api.post('/api/auth/login', {
            email: form.email,
            password: form.password,
          });
        }
        setIsSignIn(false);
        setIsSignUp(false);
        setSubmit(false);
        if (isSignUpMode) {
          setLoading(false);
          setisSignUpMode(false);
          setForm({ email: "", password: "", age: "", username: "" });
        } else if (Profile.verified) {
          router.push("/home");
        } else {
          setLoading(false);
          setError("Mail not verified");
          showNotification("Mail not verified");
          setForm({ email: "", password: "", age: "", username: "" });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Invalid credentials");
        showNotification(error instanceof Error ? error.message : "Invalid credentials");
        setForm({ email: "", password: "", age: "", username: "" });
        setLoading(false);
        setIsSignUp(false);
        setIsSignIn(false);
        setSubmit(false);
      }
    }
    fetchData();
  }, [isSignUp, isSignIn, Submit])

  const mascotRef = useRef(null);
  const mascotRef2 = useRef(null);
  const mascotCartoonRef = useRef(null);
  const mascotCartoonRef2 = useRef(null);
  const celebRef = useRef(null);

  useEffect(function () {
  const anim = lottie.loadAnimation({
    container: mascotRef.current,
    loop: true,
    autoplay: true,
    animationData: Mascot,
  });

  const anim2 = lottie.loadAnimation({
    container: mascotRef2.current,
    loop: true,
    autoplay: true,
    animationData: Mascot,
  });

  const anim3 = lottie.loadAnimation({
    container: mascotCartoonRef.current,
    loop: true,
    autoplay: true,
    animationData: MascotCartoon,
  });

  const anim4 = lottie.loadAnimation({
    container: mascotCartoonRef2.current,
    loop: true,
    autoplay: true,
    animationData: MascotCartoon,
  });

  const anim5 = lottie.loadAnimation({
    container: celebRef.current,
    loop: false,
    autoplay: true,
    animationData: Celeb,
  });

  return () => {
    anim.destroy();
    anim2.destroy();
    anim3.destroy();
    anim4.destroy();
    anim5.destroy();
  };
}, []);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("error");
  if (err === "need_reconnect") {
    showNotification("Session expirée — veuillez vous reconnecter");
  }
}, []);
 
    
  return (
	<>
    {notification && (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        background: "#ef4444", color: "#fff", textAlign: "center",
        padding: "14px 20px", fontSize: "16px", fontWeight: 600
      }}>
        {notification}
      </div>
    )}
    <div className="background">
		 <div ref={celebRef} className="absolute inset-0 z-10 pointer-events-none"/>
	      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      <div className="blob blob-4"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative px-20 py-14 text-center">
          <div className="dot1 absolute -top-1 -left-1 h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotRef} />
          </div>
          <div className="dot2 absolute -top-1 -right-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotCartoonRef} />
          </div>
          <div className="absolute -bottom-1 -left-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotCartoonRef2} />
          </div>
          <div className="absolute -bottom-1 -right-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotRef2} />
          </div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: signInOpen ? 0 : 1, scale: signInOpen ? 0.8 : 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="party-title mb-6 text-5xl md:text-7xl lg:text-6xl xl:text-8xl text-white"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
                Fun Guys
              </span>{" "}
              <span className="text-white">(For Sure)</span>

              <p className="mt-3 text-2xl font-semibold text-white lg:text-3xl">
                Here comes the Fun
              </p>
          </motion.h1>
           <Button onClick={() => { setSignInOpen(true);}} statement= "Let's play"/>
        </div>
        
      </div>
    </div>
    {signInOpen && (
  <div
    data-dialog-backdrop="web-3-dialog"
    data-dialog-backdrop-close="true"
    className="modal-overlay"
    onClick={() => setSignInOpen(false)}
  >
    <div
      className="relative m-4 h-auto max-w-5xl overflow-hidden rounded-3xl border-20 border-double shadow-xl"
      style={{
        fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif",
        borderColor: "var(--color-yellow, #facc15)"
      }}
      data-dialog="web-3-dialog"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b bg-yellow px-4 py-3">
        <h3 className="text-lg font-medium text-white">
          {isSignUpMode ? "Let's get to know each other!" : "Let's Play!"}
        </h3>
      </div>
      <div className="flex flex-col justify-between bg-[#05113a] px-4 py-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignUpMode && (
            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200">Pseudo</label>
              <input
                type="text"
                value={form.username ?? ""}
                className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder={error ? error : "Your Pseudo here"}
              />
            </fieldset>
          )}
          <fieldset className="flex items-center gap-4">
            <label className="w-24 text-right text-[15px] text-slate-200">Email</label>
            <input
              type="email"
              value={form.email ?? ""}
              className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder={error ? error : "Your Email here"}
            />
          </fieldset>
           {isSignUpMode && (
                       <fieldset className="flex items-center gap-4">
            <label className="w-24 text-right text-[15px] text-slate-200">Age</label>
            <input
              type="age"
              value={form.age ?? ""}
              className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"
              onChange={e => setForm({ ...form, age: e.target.value })}
              placeholder={error ? error : "Your Age here"}
            />
          </fieldset>
          )}
          <fieldset className="flex items-center gap-4">
            <label className="w-24 text-right text-[15px] text-slate-200">Password</label>
            <input
              id = "password"
              type="password"
              value={form.password ?? ""}
              className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder={error ? error : "Your Password here"}
            />
          </fieldset>
          {/* <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" className="checkbox-input" id="check-2" />
            <label className="text-slate-200" htmlFor="check-2">Remember Me</label>
          </div> */}
          <button type="submit" style={{ display: "none" }}>Submit</button>
        </form>
        <div className="mt-6 flex flex-col gap-5 justify-end pr-1">
          <Button statement={loading ? (isSignUpMode ? "Signing Up..." : "Signing In...") : (isSignUpMode ? "Sign Up" : "Sign In")} pressed={loading} isAdded={loading} onClick={handleSubmit} />
          <Button
            statement={
              <span className="flex items-center gap-2">
                {/* <img src="https://upload.wikimedia.org/wikipedia/commons/8/8d/42_Logo.svg" alt="google" className="w-5 h-5" /> */}
                Continue with
                <img src="42.svg" alt="42" className="w-5 h-5" />
              </span>
            }
            onClick={() => {handle42Login()}}
          />
          <p className="text-center text-slate-300 mt-2">
            {isSignUpMode ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={function(){setisSignUpMode(!isSignUpMode); setError("")}}
              className="ml-2 text-blue-400 hover:underline"
            >
              {isSignUpMode ? "Sign In?" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
)}
	</>
  );
}
