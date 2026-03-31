"use client";

import { Button } from "@/app/animations/Button.jsx";

export function Profile({ SetProfileOpen }) {
  return (
    <div
      data-dialog-backdrop="web-3-dialog"
      data-dialog-backdrop-close="true"
      className="modal-overlay"
      onClick={() => SetProfileOpen(false)}
    >
      <div
        className="relative m-4 h-130 max-w-5xl overflow-hidden rounded-3xl border-20 border-double border-yellow bg-[#0b1328] shadow-xl"
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
                  placeholder="Louloute"
                />
            </fieldset>

            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="name">
                Name
              </label>
               <input placeholder="Alix" className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"/>
            </fieldset>

            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Email
              </label>
              <input placeholder="alix.crusoe@gmail.com" className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"/>
            </fieldset>
			 <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Password
              </label>
                <input type="password" placeholder="..........." className="w-full bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-blue-500 hover:border-blue-300 shadow-sm focus:shadow"/>
            </fieldset>
          </div>

          <div className="mt-6 flex gap-3 justify-end pr-1">
            <Button statement="Go back" onClick={() => SetProfileOpen(false)} />
            <Button statement="Save Changes" onClick={() => SetProfileOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
