"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@material-tailwind/react";
import { api } from "@/lib/api";

export default function LeaderBoardList() {
  const [players, setPlayers] = useState([]);
  const [img, setImg] = useState([]);
  const [UserName, setUserName] = useState("");
  const [playerImgs, setPlayerImgs] = useState({});
  const [ playersStats, setPlayerStats] = useState({})
  
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
      imgs[player.id] = url;
    }
    setPlayerImgs(imgs);
  }
  if (players.length > 0) {
    loadImages();
  }
}, [players]);

async function fetchImg(id) {
  try {
    const blob = await api.getBlob(`/api/users/${id}/picture`);
    if (!blob) return;
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(error);
    setImg(null);
  }
}

useEffect(() => {
  async function fetchUserData(id) {
    try {
      const statsData = await api.get<{ stats: { wins: number } }>(`/api/users/${id}/stats`);
      if (!statsData) return;
      return(statsData.stats);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchStats() {
  const wins = {};
  for (const player of players) {
      const data = await fetchUserData(player.id);
      wins[player.id] = data.wins;
  }
  setPlayerStats(wins);
}

  if (players.length > 0) {
    fetchStats();
  }
}, [players]);


useEffect(() => {
  fetchData();
}, []);

const sortedPlayers = useMemo(
    () =>
      [...players]
        .filter((player) => player.username !== UserName)
        .sort((a, b) => (playersStats[b.id] || 0) - (playersStats[a.id] || 0)),
    [players, playersStats, UserName],
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1328]">
      <nav
        className="flex flex-col gap-4 w-full h-full overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]"
      >
        {sortedPlayers
        .map((player, idx) => (
          <div
            key={idx}
            className="flex w-full items-center rounded-lg p-4 bg-[#0b1328] text-white shadow-md border border-slate-700 transition-all hover:bg-[#162447] focus:bg-[#162447] active:bg-[#162447]"
          >
            <div className="mr-4 flex items-center gap-2">
              <span className="font-bold w-6 text-center">{idx + 1}</span>
                <img
                  alt={player.username}
                  src={playerImgs[player.id]}
                  className="relative inline-block h-12 w-12 rounded-full object-cover object-center"
                />
            </div>
            <div>
              <h6 className="font-medium text-white">{player.username}</h6>
              <span className="font-bold w-6 text-center">Wins: {playersStats[player.id]}</span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}