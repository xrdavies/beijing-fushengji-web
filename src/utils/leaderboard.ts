export type ScoreRecord = {
  playerName: string;
  totalWealth: number;
  cash: number;
  bank: number;
  debt: number;
  health: number;
  fame: number;
  timestamp: number;
};

export type ScoreSubmission = Omit<ScoreRecord, 'timestamp'>;

export type LeaderboardResponse = {
  items: ScoreRecord[];
};

const LEADERBOARD_API_BASE = 'https://rank-api.beijingfushengji.xyz';

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function submitScore(payload: ScoreSubmission): Promise<ScoreRecord | null> {
  try {
    const response = await fetch(`${LEADERBOARD_API_BASE}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;

    const data = await parseJson<{ ok: boolean; record?: ScoreRecord }>(response);
    if (!data?.ok || !data.record) return null;

    return data.record;
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse | null> {
  try {
    const response = await fetch(`${LEADERBOARD_API_BASE}/api/leaderboard`, {
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await parseJson<{ ok: boolean; items: ScoreRecord[] }>(response);
    if (!data?.ok || !Array.isArray(data.items)) return null;

    return { items: data.items };
  } catch {
    return null;
  }
}
