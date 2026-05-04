"use client";
import { Button } from "../../app/animations/Button.jsx";
import { useState, useEffect} from "react";
import { api, API_BASE } from "@/lib/api";
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
  const [Requests,setRequests] = useState([])
  const [SentRequests,setSentRequests] = useState([])
  const [deleted, setDeleted] = useState(false)
  const [Requested, setRequested] = useState(false)

  function handleAdd(idx) {

    setAdded((prev) => {
      const updated = [...prev];
      updated[idx] = !updated[idx];
      return updated;
    });
  }

    async function fetchUsers() {
  try {
    const data = await api.get('/api/users');
    setPlayers(data)
  } catch (error) {
    console.error(error);
  }
}
  async function fetchSendRequest(id) {
  try {
    await api.post('/api/friends/request', { friend_id: id });
  } catch (error) {
    console.error(error);
  }
}

  async function fetchDelete(id) {
  try {
    await api.delete('/api/friends/delete', { body: JSON.stringify({ friend_id: id }) });
      setDeleted(!deleted)
      setAdded([])
  } catch (error) {
    console.error(error);
  }
}

  async function fetchFriends() {
  try {
    const data = await api.get('/api/friends/friendlist');
    setPlayers(data)
  } catch (error) {
    console.error(error);
  }
}

  async function findPendingRequests(){
  try {
    const data = await api.get('/api/friends/pending');
    setRequests(data)
  } catch (error) {
    console.error(error);
  }
}

  async function findSentRequests(){
  try {
    const data = await api.get('/api/friends/sent');
    setSentRequests(data)
  } catch (error) {
    console.error(error);
  }
}

  async function alreadyFriends() {
  try {
    const data = await api.get('/api/friends/friendlist');
    setFriends(data)
  } catch (error) {
    console.error(error);
  }
}

  async function fetchImg() {
  try {
    const response = await fetch(`${API_BASE}/api/update/profile-picture`, {
      method: 'GET',
      credentials: 'include',
      headers: {Accept: 'application/json, application/problem+json'}
    });
    if (!response.ok) {
      setImg("");
      return;
    }
    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);
    setImg(imgUrl);
  } catch (error) {
    console.error(error);
    setImg("");
  }
}

  async function fetchData(id) {
  try {
    const data = await api.get('/api/users/' + id);
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

useEffect(() => {
  fetchImg();
}, []);

useEffect(() => {
  setAdded([]);
}, [deleted]);

useEffect(() => {
  if (props.FriendsDisplay) {
    const refreshFriendsView = () => {
      fetchFriends();
      findPendingRequests();
    };

    refreshFriendsView();
    const friendsIntervalId = setInterval(refreshFriendsView, 5000);

    return () => clearInterval(friendsIntervalId);
  }

  const refreshAddablePlayers = () => {
    fetchUsers();
    alreadyFriends();
    findPendingRequests();
    findSentRequests();
  };

  refreshAddablePlayers();
  const addablePlayersIntervalId = setInterval(refreshAddablePlayers, 5000);

  return () => clearInterval(addablePlayersIntervalId);
}, [props.FriendsDisplay, deleted]);
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
              && !Requests.some((request) => request.id === player.id)
          )
          .map((player, idx) => {
            const isPending = SentRequests.some((req) => req.username === player.username);
            return (
          <div
            key={idx}
            className="flex w-full items-center rounded-lg p-4 bg-[#0b1328] text-white shadow-md border border-slate-700 transition-all hover:bg-[#162447] focus:bg-[#162447] active:bg-[#162447]"
          >
            <div className="mr-4 flex items-center gap-2">
              <span className="font-bold w-6 text-center">{idx + 1}</span>
              <img
                alt={player.username}
                src={Img}
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
                  statement={isPending || Added[idx] ? "Pending" : "Add"}
                  isAdded={isPending || Added[idx]}
                 onClick={() => {
                    if (!isPending && !Added[idx]) {
                    handleAdd(idx);
                   fetchSendRequest(player.id);
                    }
                }}
                />
              )}
              {props.FriendsDisplay && <Button statement="Delete" onClick={() => {fetchDelete(player.id)}} />}
            </div>
          </div>
        );
      })}
      </nav>
    </div>
  );
}