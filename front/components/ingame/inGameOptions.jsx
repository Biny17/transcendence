"use client";
import { useState, useEffect, Fragment } from "react";
import OptionsIngame from "@/components/ingame/optionswindow.jsx";
export function IngameOptions({ SetProfileOpen }){


const [OptionsOpen, setOptionsOpen]= useState(false)

useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            setOptionsOpen(true);
        }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
        window.removeEventListener("keydown", handleKeyDown);
    };
}, []);

return(
<Fragment>menu_options
{OptionsOpen && <div className="modal-overlay backdrop-blur-sm">
    <div onClick={e => e.stopPropagation()}>
        <OptionsIngame setOptionsOpen={setOptionsOpen}/>
    </div>
</div>}
</Fragment>
)
}