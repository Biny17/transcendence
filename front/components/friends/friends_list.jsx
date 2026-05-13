"use client";
import { Button } from "../../app/animations/Button.jsx";
import { useState, useEffect} from "react";
import { api, API_BASE } from "@/lib/api";
export default function FriendList(props) {

  const [players, setPlayers] = useState([])
  const [friends, setFriends] = useState([])
  const [Img, setImg] = useState([])
  const [Added, setAdded] = useState([])
  const [UserName,setUserName] = useState("")
  const [Requests,setRequests] = useState([])
  const [SentRequests,setSentRequests] = useState([])
  const [deleted, setDeleted] = useState(false)
  const [Requested, setRequested] = useState(false)
  const [playerImgs, setPlayerImgs] = useState({});

  
    async function fetchUsers() {
  try {
    const data = await api.get('/api/users');
    setPlayers(data)
  } catch (error) {

  }
}
  async function fetchSendRequest(id) {
  try {
    await api.post('/api/friends/request', { friend_id: id });
  } catch (error) {

  }
}

  async function fetchDelete(id) {
  try {
    await api.delete('/api/friends/delete', { friend_id: id });
      setDeleted(!deleted)
      setAdded([])
  } catch (error) {

  }
}

  async function fetchFriends() {
  try {
    const data = await api.get('/api/friends/friendlist');
    setPlayers(data)
  } catch (error) {

  }
}

  async function findPendingRequests(){
  try {
    const data = await api.get('/api/friends/pending');
    setRequests(data)
  } catch (error) {

  }
}

  async function findSentRequests(){
  try {
    const data = await api.get('/api/friends/sent');
    setSentRequests(data)
  } catch (error) {

  }
}

  async function alreadyFriends() {
  try {
    const data = await api.get('/api/friends/friendlist');
    setFriends(data)
  } catch (error) {

  }
}

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

    setImg(null);
  }
}

  async function fetchData(id) {
  try {
    const data = await api.get('/api/users/' + id);
    setUserName(data[0].username);
  } catch (error) {

  }
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
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

useEffect(() => {
  const token = getCookie('auth_token');
  if (!token) return;

  const payload = token.split('.')[1];
  const decoded = JSON.parse(atob(payload));
  fetchData(decoded.sub);
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
  const addablePlayersIntervalId = setInterval(refreshAddablePlayers, 3000);

  return () => clearInterval(addablePlayersIntervalId);
}, [props.FriendsDisplay, deleted]);
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
            const isPending = SentRequests.some((req) => req.id === player.id);
            return (
          <div
            key={player.id}
            className="flex w-full items-center rounded-lg p-4 bg-[#0b1328] text-white shadow-md border border-slate-700 transition-all hover:bg-[#162447] focus:bg-[#162447] active:bg-[#162447]"
          >
            <div className="mr-4 flex items-center gap-2">
              <img
                alt={player.username}
                src={playerImgs[player.id]}
                className="relative inline-block h-12 w-12 rounded-full! object-cover object-center"
              />
            </div>
            <div className="flex-1">
              <h6 className="font-medium text-white">{player.username}</h6>
            </div>
            <div className="ml-auto">
              {!props.FriendsDisplay && (
                <Button
                  statement={isPending ? "Pending" : "Add"}
                  isAdded={isPending}
                  onClick={() => {
                    if (!isPending) {
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