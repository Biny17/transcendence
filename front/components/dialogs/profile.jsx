"use client";

import { Button } from "@/app/animations/Button.jsx";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { useRouter } from 'next/navigation';

export function Profile({ SetProfileOpen}) {
  const [Profile, setProfile] = useState({ age: "", email: "", password: ".........", username: "" })
  const [initialProfile, setinitialProfile] = useState({ age: "", email: "", password: ".........", username: "" })
  const [userError, setUserError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [decoded, setDecoded] = useState("")
  const inputRef = useRef(null);
  const router = useRouter();

  async function fetchData(id) {
    const url = 'http://localhost:8080/api/users/' + id;
    let options = {method: 'GET', headers: {Accept: 'application/json, application/problem+json'}};
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      setProfile({age: data[0].age, email: data[0].email, password: ".........", username: data[0].username })
	  setinitialProfile({age: data[0].age, email: data[0].email, password: ".........", username: data[0].username })
    } catch (error) {
      console.error(error);
    }
  }
    async function uploadPicture(e){
    const url = 'http://localhost:8080/api/users/me/profile-picture';
    const file = event.target.files[0];
    if (file)
    {
        const form = new FormData();
        form.append('file', file);
        const options = {method: 'PUT', credentials: 'include', headers: {'Accept': 'application/json, application/problem+json'}}
        options.body = form;
        try {
        const response = await fetch(url, options);
        if (!response.ok) {
                const err = await response.json();
                throw new Error(err.title);
            }
        if (response.status === 200)
        {
            console.log("avatar changed!")
        }
        } catch (error) {
        console.error(error);
        }
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
    setDecoded(decoded.sub);
    fetchData(decoded.sub);
  }, []);

  async function handleSave(){
    const url = 'http://localhost:8080/api/users/' + decoded;

    let payload;
    if (Profile.password === initialProfile.password) {
      const { password: _password, ...profileWithoutPassword } = Profile;
      payload = profileWithoutPassword;
    }
    else
      payload = Profile
    const options = {method: 'PATCH', credentials: 'include', headers: {'Accept': 'application/json, application/problem+json', 'Content-Type': 'application/json'}, body: JSON.stringify(payload)};
    try 
	{
		const response = await fetch(url, options);
		if (!response.ok) {
			const err = await response.json();
			throw new Error(err.title);
		}
		if (response.status === 200)
			SetProfileOpen(false)
  } 
    catch (error) 
    {
      console.log(error);
	  if (initialProfile.username !== Profile.username)
      	setUserError("Invalid credentials");
	  if (initialProfile.email !== Profile.email)
	  	setEmailError("Invalid credentials");
    }
  }

function handleFileSelect(e){

}

async function handleDelete() {
  const url = 'http://localhost:8080/api/users/delete?user_id='+ decoded;
  const options = {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Accept': 'application/problem+json',
      'Content-Type': 'application/json'
    },
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
			const err = await response.json();
			throw new Error(err.title);
		}
    if (response.status === 200)
    {
      SetProfileOpen(false)
      router.push("/login")
    }
  } catch (error) {
    console.error(error);
  }
}
  return (
    <div
      data-dialog-backdrop="web-3-dialog"
      data-dialog-backdrop-close="true"
      className="modal-overlay"
      onClick={() => SetProfileOpen(false)}
    >
      <div
        className="relative w-[min(92vw,800px)] h-[min(88vh,600px)] overflow-hidden rounded-3xl border-20 border-double border-yellow bg-[#0b1328] shadow-xl"
        style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
        data-dialog="web-3-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b bg-yellow px-4 py-3">
          <h5 className="text-lg font-medium text-[#292524]">Edit Profile</h5>
        </div>
        <div className="flex h-[calc(100%-58px)] flex-col justify-between bg-[#05113a] px-4 py-5">
          <div className="space-y-4">
            <div className="mb-8">
              <p className="text-sm font-light text-slate-300">
                Make changes to your profile here. Click save when you're done.
              </p>
            </div>
            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="username">
                Username
              </label>
                <input
                  className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"
                  value={userError ? "" : Profile.username}
				  placeholder= {userError ? userError : ""}
                  onChange={(e) => { setUserError("");
                    setProfile({ ...Profile, username: e.target.value });
                  }}
                />
            </fieldset>
            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"
                value={emailError ? "" : Profile.email}
				placeholder= {emailError ? emailError : ""}
                onChange={(e) => { setEmailError("");
                  setProfile({ ...Profile, email: e.target.value });
                }}
              />
            </fieldset>
			 <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Password
              </label>
                <input type="password" 
                onChange={(e) => {
                  setProfile({ ...Profile, password: e.target.value });
                }}
                value= {Profile.password} className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"/>
            </fieldset>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-end pr-1">
            <Button statement="Go back" onClick={() => SetProfileOpen(false)} />
            <Button statement="Upload un avatar" onClick={() => inputRef.current.click()}/>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => uploadPicture(event)}
            />
            <Button statement="Delete Profile" onClick={() => {handleDelete()}} />
            <Button statement="Save Changes" onClick={() => {handleSave()}} />
          </div>
        </div>
      </div>
    </div>
  );
}
