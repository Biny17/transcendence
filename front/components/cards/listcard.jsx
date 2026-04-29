"use client";

import { useEffect, useState } from "react";
import { Badge } from "@material-tailwind/react";

export default function ListCard() {
  // const players = [
  //   {  name: "Tania Andrew", img: "https://docs.material-tailwind.com/img/face-1.jpg", win: 20 },
  //   {  name: "Alexander", img: "https://docs.material-tailwind.com/img/face-2.jpg", win: 18 },
  //   {  name: "Emma Willever", img: "https://docs.material-tailwind.com/img/face-3.jpg", win: 15 },
  //   { name: "Candice", img: "https://docs.material-tailwind.com/img/face-1.jpg", win: 10 },
  //   { name: "John Doe", img: "https://randomuser.me/api/portraits/men/1.jpg", win: 9 },
  //   { name: "Jane Smith", img: "https://randomuser.me/api/portraits/women/2.jpg", win: 8 },
  //   { name: "Lucas", img: "https://randomuser.me/api/portraits/men/3.jpg", win: 7 },
  //   { name: "Sophie", img: "https://randomuser.me/api/portraits/women/4.jpg", win: 6 },
  // ];
  const [players, setPlayers] = useState([]);
  const [img, setImg] = useState([]);
  const [UserName, setUserName] = useState("");

  async function fetchData() {
    const url = "http://localhost:8080/api/users";
    const options = {
      method: "GET",
      headers: { Accept: "application/json, application/problem+json" },
    };
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error(error);
    }
  }

async function fetchImg() {
  const url = "https://picsum.photos/v2/list?page=2&limit=30";
  const options = {
    method: "GET",
    headers: { Accept: "application/json, application/problem+json" },
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    setImg(data);
  } catch (error) {
    console.error(error);
  }
}
async function fetchUserById(id) {
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
  fetchUserById(decoded.sub);
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
                  src={img[idx]?.download_url || img[idx]?.url}
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