const API_URL = Bun.env.API_URL ?? "http://api:8080";
const CREDENTIAL = Bun.env.CREDENTIAL ?? "";

export type PlayerResultPayload = {
	username: string;
	kill: number;
	death: number;
	rank: number;
};

export type GameResultPayload = {
	lobbyType: string;
	players: PlayerResultPayload[];
	totalPlayer: number;
};

export type UserProfile = {
  id: number;
  username: string;
  skin_color: string;
  face_color: string;
};

export async function fetchUserProfile(username: string): Promise<UserProfile | null> {
  const url = `${API_URL}/api/users/find?username=${encodeURIComponent(username)}`;
  try {
    const response = await fetch(url, {
      headers: { "Authorization": `Basic ${CREDENTIAL}` },
    });
    if (!response.ok) {
      console.error(`[API] GET /api/users/find failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log(`[API] fetchUserProfile raw response:`, JSON.stringify(data).slice(0, 500));
    const users = Array.isArray(data) ? data : (Array.isArray((data as any)?.body) ? (data as any).body : []);
    const profile = (users as UserProfile[])?.[0] ?? null;
    if (profile) console.log(`[API] Found profile:`, JSON.stringify(profile));
    return profile;
  } catch (err) {
    console.error(`[API] Network error fetching user profile:`, err);
    return null;
  }
}

export async function postGameResult(payload: GameResultPayload): Promise<void> {
	const url = `${API_URL}/api/game/add`;

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Basic ${CREDENTIAL}`,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const text = await response.text();
			console.error(`[API] POST /api/game/add failed: ${response.status} ${text}`);
		} else {
			const json = await response.json();
			console.log(`[API] Game result saved: game_id=${json.game_id}`);
		}
	} catch (err) {
		console.error(`[API] Network error posting game result:`, err);
	}
}
