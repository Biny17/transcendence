"use client";

import { useState, useEffect} from "react";
export default function ListCard() {
  // const players = [
  //   { nb: 1, name: "Tania Andrew", img: "https://docs.material-tailwind.com/img/face-1.jpg", win: 20 },
  //   { nb: 2, name: "Alexander", img: "https://docs.material-tailwind.com/img/face-2.jpg", win: 18 },
  //   { nb: 3, name: "Emma Willever", img: "https://docs.material-tailwind.com/img/face-3.jpg", win: 15 },
  //   { nb: 4,name: "Candice", img: "https://docs.material-tailwind.com/img/face-1.jpg", win: 10 },
  //   { nb: 5,name: "John Doe", img: "https://randomuser.me/api/portraits/men/1.jpg", win: 9 },
  //   { nb: 6,name: "Jane Smith", img: "https://randomuser.me/api/portraits/women/2.jpg", win: 8 },
  //   { nb: 7,name: "Lucas", img: "https://randomuser.me/api/portraits/men/3.jpg", win: 7 },
  //   { nb: 8,name: "Sophie", img: "https://randomuser.me/api/portraits/women/4.jpg", win: 6 },
  // ];

  const [players, setPlayers] = useState([])
  async function fetchData() {
  const url = 'http://localhost:8080/api/users'
  const options = {method: 'GET', headers: {Accept: 'application/json, application/problem+json'}};
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    setPlayers(data)
  } catch (error) {
    console.error(error);
  }
}

useEffect(() =>{fetchData()}, [])
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1328]">
      <nav
        className="flex flex-col gap-4 w-full h-full overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]"
      >
        {players.map((player, idx) => (
          <div
            key={idx}
            className="flex w-full items-center rounded-lg p-4 bg-[#0b1328] text-white shadow-md border border-slate-700 transition-all hover:bg-[#162447] focus:bg-[#162447] active:bg-[#162447]"
          >
            <div className="mr-4 flex items-center gap-2">
              <span className="font-bold w-6 text-center">{player.nb}</span>
              <img
                alt={player.username}
                src= "https://docs.material-tailwind.com/img/face-1.jpg"
                className="relative inline-block h-12 w-12 rounded-full! object-cover object-center"
              />
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