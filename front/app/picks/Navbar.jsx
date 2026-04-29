"use client"
import { useState } from 'react';
import Image from 'next/image';
import './Navbar.css';
import './Background.css';

export const Navbar = ({ signInOpen, setSignInOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
    <div className="navbar">
      <div className="navbar-logo">
      </div>
      <div className="navbar-actions">
        <div className="relative" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
          <button type="button" className="flex text-sm rounded-full">
            <img className="w-20 h-20 rounded-full" src="/among-game.png" alt="user photo" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full pt-2 z-50">
              <div className="bg-white border border-gray-200 rounded shadow-lg w-44">
                <div className="px-4 py-3 text-sm border-b border-gray-200">
                  <span className="block font-medium text-gray-900">Alix Crusoe</span>
                  <span className="block text-gray-500 truncate">acrusoe@student.42.fr</span>
                </div>
                <ul className="p-2 text-sm text-gray-700 font-medium">
                  <li><button className="inline-flex items-center w-full p-2 hover:bg-gray-100 rounded" onClick={() => setSignInOpen(true)}>Options</button></li>
                  <li><a href="#" className="inline-flex items-center w-full p-2 hover:bg-gray-100 rounded"onClick={() => setSignInOpen(true)}>Se deconnecter</a></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {signInOpen && (
      <div
        className="fixed inset-0 z-[999] grid h-screen w-screen place-items-center"
        onClick={() => setSignInOpen(false)}
      >
        <div
          className="auth-card relative flex flex-col w-full max-w-md rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative m-2.5 items-center flex justify-center text-white h-24 rounded-xl auth-header">
            <h3 className="text-2xl font-semibold tracking-wide">Sign In</h3>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div className="w-full">
              <label className="block mb-2 text-sm text-cyan-100">Email</label>
              <input type="email" className="auth-input w-full rounded-md px-3 py-2 text-sm transition duration-300 ease focus:outline-none" placeholder="Your Email" />
            </div>
            <div className="w-full">
              <label className="block mb-2 text-sm text-cyan-100">Password</label>
              <input type="password" className="auth-input w-full rounded-md px-3 py-2 text-sm transition duration-300 ease focus:outline-none" placeholder="Your Password" />
            </div>
            <div className="inline-flex items-center mt-2">
              <label className="flex items-center cursor-pointer relative" htmlFor="check-2">
                <input type="checkbox" className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded border border-cyan-300 checked:bg-cyan-400 checked:border-cyan-300" id="check-2" />
                <span className="absolute text-slate-900 opacity-0 pointer-events-none peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </label>
              <label className="cursor-pointer ml-2 text-cyan-100 text-sm" htmlFor="check-2">Remember Me</label>
            </div>
          </div>
          <div className="p-6 pt-0">
            <button className="auth-button w-full rounded-md py-2 px-4 border border-transparent text-center text-sm text-white transition-all" type="button">Sign In</button>
            <button className="auth-button w-full rounded-md flex items-center justify-center mt-2 py-2 px-4 border border-transparent text-center text-sm text-white transition-all" type="button">
              <img src="https://docs.material-tailwind.com/icons/google.svg" alt="google" className="h-5 w-5 mr-2" />
              Continue with Google
            </button>
            <p className="flex justify-center mt-6 text-sm text-cyan-100">
              Don&apos;t have an account?
              <a href="#signup" className="ml-1 text-sm font-semibold text-cyan-300 underline underline-offset-2">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
