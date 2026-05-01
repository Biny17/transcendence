"use client"
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import './Navbar.css';
import './Background.css';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import KpiCard1, { KpiCard } from "@/components/cards/multicards";
import { useRouter } from 'next/navigation';
import Options from "@/components/cards/Options";
import { Avatar, Typography } from "@material-tailwind/react";
import Sloth from "@/public/sloth-meditate.json";
import lottie from "lottie-web";

export const Navbar = ({OptionsOpen, setOptionsOpen}) => {
const [dropdownOpen, setDropdownOpen] = useState(false);
const [error, setError] = useState("");
const [username, setUserName] = useState('');
const [Img, setImg] = useState("")
const router = useRouter();
const slothRef = useRef(null);

// const handleSubmit = () => {
//     if (!form.email || !form.password) { setError("Remplissez tous les champs !"); return; }
//     if (isSignUpMode && !form.username) { setError("Choisissez un pseudo !"); return; }
// 	else {router.push("/picks")}
// }

async function fetchImg() {
  const url = 'http://localhost:8080/api/update/profile-picture';
  const options = {method: 'GET',  credentials: 'include', headers: {Accept: 'application/json, application/problem+json'}};
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      setImg("");
      return;
    }
    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);
    console.log(imgUrl)
    setImg(imgUrl);
  } catch (error) {
    console.error(error);
    setImg("");
  }
}

async function fetchData(id) {
  const url = 'http://localhost:8080/api/users/' + id;
  const options = {method: 'GET', headers: {Accept: 'application/json, application/problem+json'}};
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    setUserName(data[0].username);
  } catch (error) {
    console.error(error);
  }
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}

useEffect(() => {
  const token = getCookie('auth_token');
  if (!token) return;

  const payload = token.split('.')[1];
  const decoded = JSON.parse(atob(payload));
  fetchData(decoded.sub);
  fetchImg()
}, [OptionsOpen]);

useEffect(function(){
    lottie.loadAnimation({
      container: slothRef.current,
      loop: true,
      autoplay: true,
      animationData: Sloth,
    })},[])
  return (
    <>
    <div className="navbar">
      <div>
        <KpiCard1 />
      </div>
      <div className="navbar-actions">
        <div className="dropdown-trigger" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
          <button type="button" className="navbar-avatar-btn">
            <div className="navbar-avatar-btn-lottie">
              <div ref={slothRef}/>
            </div>
          </button>
          {dropdownOpen && (
            <div className="dropdown-wrapper">
              <div className="dropdown-menu">
                <ul
                  role="menu"
                  data-popover="profile-menu"
                  data-popover-placement="bottom"
                  className="z-10 min-w-45 overflow-auto rounded-4xl border border-slate-200 bg-white p-1.5 shadow-lg focus:outline-none"
                >
              <li
                role="menuitem"
                className="cursor-pointer text-slate-800 flex w-full text-sm items-center rounded-md p-3 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100"
              >
					<div className="flex items-center gap-4">
				<Avatar src={Img} alt="avatar" />
				<div>
				<Typography variant="h6"> {username}</Typography>

				</div>
      				</div>
            
                {/* <p className="text-slate-800 font-medium ml-2">
                {username}
                </p> */}
              </li>
              <li
                role="menuitem"
                className="cursor-pointer text-slate-800 flex w-full text-sm items-center rounded-md p-3 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                  <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
            
                <button className="text-slate-800 font-medium ml-2" onClick={() => setOptionsOpen(true)}>
                  Options
                </button>
              </li>
              <hr className="my-2 border-slate-200" role="menuitem" />
              <li
                role="menuitem"
                className="cursor-pointer text-slate-800 flex w-full text-sm items-center rounded-md p-3 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
            
                <button className="text-slate-800 font-medium ml-2" onClick={() => router.push("/login")}>
                  Quitter
                </button>
              </li>
            </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {OptionsOpen && (
      <div
        className="modal-overlay backdrop-blur-sm" 
        onClick={() => setOptionsOpen(false)}
      >
        <div onClick={e => e.stopPropagation()}>
          <Options setOptionsOpen={setOptionsOpen}/>
        </div>
      </div>
    )}
    </>
  );
}
