"use client";

import { useEffect, useState } from "react";
import { Badge } from "@material-tailwind/react";
import { api, API_BASE } from "@/lib/api";

export default function LeaderBoardList() {
  const [players, setPlayers] = useState([]);
  const [img, setImg] = useState([]);
  const [UserName, setUserName] = useState("");
  const [playerImgs, setPlayerImgs] = useState({});

  async function fetchData() {
    try {
      const data = await api.get("/api/users");
      setPlayers([...data]);
    } catch (error) {
      console.error(error);
    }
  }
useEffect(() => {
  async function loadImages() {
    const imgs = {};
    for (const player of players) {
      const url = await fetchImg(player.id);
      console.log(url)
      imgs[player.id] = url;
    }
    setPlayerImgs(imgs);
  }
  if (players.length > 0) {
    loadImages();
  }
}, [players]);

async function fetchImg(id) {
  const url = `${API_BASE}/api/users/${id}/picture`;
  const options = {method: 'GET', credentials: 'include'};
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      return;
    }
    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);
    return (imgUrl);

  } catch (error) {
    console.error(error);
    setImg(null);
  }
}

useEffect(() => {
  fetchData();
  fetchImg();
}, []);
players.sort((a, b) => b.win - a.win);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1328]">
      <nav
        className="flex flex-col gap-4 w-full h-full overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]"
      >
        {players
        .filter((player) => player.username !== UserName)
        .map((player, idx) => (
          <div
            key={idx}
            className="flex w-full items-center rounded-lg p-4 bg-[#0b1328] text-white shadow-md border border-slate-700 transition-all hover:bg-[#162447] focus:bg-[#162447] active:bg-[#162447]"
          >
            <div className="mr-4 flex items-center gap-2">
              <span className="font-bold w-6 text-center">{idx + 1}</span>
              <Badge
                color="green"
                // withBorder
                overlap="circular"
                placement="top-bottom"
              >
                <img
                  alt={player.username}
                  src={playerImgs[player.id]}
                  className="relative inline-block h-12 w-12 rounded-full object-cover object-center"
                />
              </Badge>
            </div>
            <div>
              <h6 className="font-medium text-white">{player.username}</h6>
              <span className="font-bold w-6 text-center">Wins: {player.win}</span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}