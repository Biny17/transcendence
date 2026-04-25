"use client";
import { Button } from "../../app/animations/Button.jsx";
import { useState, useEffect} from "react";
export default function FriendList(props) {
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

  const [players, setPlayers] = useState([])
  const [friends, setFriends] = useState([])
  const [Img, setImg] = useState([])
  const [Added, setAdded] = useState([])
  const [UserName,setUserName] = useState("")
  const [Requests,setRequests] = useState("")
  const [deleted, setDeleted] = useState(false)

  function handleAdd(idx) {

    setAdded((prev) => {
      const updated = [...prev];
      updated[idx] = !updated[idx];
      return updated;
    });
  }

    async function fetchUsers() {
  const url = 'http://localhost:8080/api/users'
  const options = {
    method: 'GET',
    credentials: 'include',
    headers: {Accept: 'application/json, application/problem+json'}
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    setPlayers(data)
  } catch (error) {
    console.error(error);
  }
}
  async function fetchSendRequest(id) {
  const url = 'http://localhost:8080/api/friends/request';
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json, application/problem+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ friend_id: id }),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.title || 'Failed to delete friend');
      }
  } catch (error) {
    console.error(error);
  }
}

async function fetchDelete(id) {
  const url = 'http://localhost:8080/api/friends/delete';
  const options = {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json, application/problem+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ friend_id: id }),
  };
  try {
    const response = await fetch(url, options);
  if (!response.ok) {
        const err = await response.json();
        throw new Error(err.title || 'Failed to delete friend');
      }
      setDeleted(!deleted)
  } catch (error) {
    console.error(error);
  }
}

 async function fetchFriends() {
  const url = 'http://localhost:8080/api/friends/friendlist';
  const options = {
    method: 'GET',
    credentials: 'include',
    headers: {Accept: 'application/json, application/problem+json'}
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    setPlayers(data)
  } catch (error) {
    console.error(error);
  }
}

// async function findPendingRequests(){
//   const url = 'http://localhost:8080/api/friends/pending'
//   const options = {
//     method: 'GET',
//     credentials: 'include',
//     headers: {Accept: 'application/json, application/problem+json'}
//   };
//   try {
//     const response = await fetch(url, options);
//     const data = await response.json();
//     setRequests(data)
//   } catch (error) {
//     console.error(error);
//   }
// }
async function alreadyFriends() {
  const url = 'http://localhost:8080/api/friends/friendlist';
  const options = {
    method: 'GET',
    credentials: 'include',
    headers: {Accept: 'application/json, application/problem+json'}
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    setFriends(data)
  } catch (error) {
    console.error(error);
  }
}

async function fetchImg() {
  const url = 'https://picsum.photos/v2/list?page=2&limit=30'
  const options = {method: 'GET', headers: {Accept: 'application/json, application/problem+json'}};
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    setImg(data)
  } catch (error) {
    console.error(error);
  }
}
async function fetchData(id) {
  const url = 'http://localhost:8080/api/users/' + id;
  const options = {
    method: 'GET',
    credentials: 'include',
    headers: {Accept: 'application/json, application/problem+json'}
  };
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
}, []);

useEffect(() =>{props.FriendsDisplay ? fetchFriends():fetchUsers(); fetchImg();}, [props.FriendsDisplay, props.FriendsRequestsOpen, deleted])
useEffect(() => {alreadyFriends()})
// players.sort((a, b) => b.win - a.win);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1328]">
      <nav
        className="flex flex-col gap-4 w-full h-full overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]"
      >
        {(Array.isArray(players) ? players : [])
          .filter((player) =>
            props.FriendsDisplay
              ? player.username !== UserName
              : player.username !== UserName && !friends.some((friend) => friend.id === player.id)
          )
          .map((player, idx) => (
          <div
            key={idx}
            className="flex w-full items-center rounded-lg p-4 bg-[#0b1328] text-white shadow-md border border-slate-700 transition-all hover:bg-[#162447] focus:bg-[#162447] active:bg-[#162447]"
          >
            <div className="mr-4 flex items-center gap-2">
              <span className="font-bold w-6 text-center">{idx + 1}</span>
              <img
                alt={player.username}
                src={Img[idx]?.download_url || Img[idx]?.url }
                className="relative inline-block h-12 w-12 rounded-full! object-cover object-center"
              />
            </div>
            <div className="flex-1">
              <h6 className="font-medium text-white">{player.username}</h6>
              <span className="font-bold w-6 text-center">Wins: {player.win}</span>
            </div>
            <div className="ml-auto">
              {!props.FriendsDisplay && (
                <Button
                  statement={Added[idx] ? "Pending" : "Add"}
                  isAdded={Added[idx]}
                 onClick={() => {
                    if (!Added[idx]) {
                    handleAdd(idx);
                   fetchSendRequest(player. id);
                    }
                }}
                />
              )}
              {props.FriendsDisplay && <Button statement="Delete" onClick={() => {fetchDelete(player.id)}} />}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}