interface Env {
  'beijingfushengji-data': KVNamespace;
}

type ScoreRecord = {
  playerName: string;
  totalWealth: number;
  cash: number;
  bank: number;
  debt: number;
  health: number;
  fame: number;
  timestamp: number;
};

const RANK_PREFIX = 'rank:';
const MAX_RECORDS = 1000;
const MAX_RESPONSE = 100;
const MAX_NAME_LENGTH = 32;
const SCORE_OFFSET = 1_000_000_000_000;
const SCORE_KEY_WIDTH = 13;
const TIME_OFFSET = 9_999_999_999_999;
const TIME_KEY_WIDTH = 13;
const LIST_PAGE_SIZE = 1000;

const ALLOWED_ORIGINS = new Set(['https://beijingfushengji.xyz', 'http://localhost:3000']);

function buildCorsHeaders(origin: string | null): HeadersInit {
  const normalized = origin?.trim() ?? '';
  if (!normalized || !ALLOWED_ORIGINS.has(normalized)) return {};
  return {
    'Access-Control-Allow-Origin': normalized,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResponse(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...buildCorsHeaders(origin),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(message: string, status: number, origin: string | null): Response {
  return jsonResponse({ ok: false, error: message }, status, origin);
}

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  return Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('');
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value > SCORE_OFFSET) return SCORE_OFFSET;
  if (value < -SCORE_OFFSET) return -SCORE_OFFSET;
  return value;
}

function toScoreKey(totalWealth: number): string {
  const clamped = clampScore(Math.floor(totalWealth));
  const inverted = SCORE_OFFSET - clamped;
  return String(inverted).padStart(SCORE_KEY_WIDTH, '0');
}

function toTimeKey(timestamp: number): string {
  const clamped = Math.min(Math.max(0, Math.floor(timestamp)), TIME_OFFSET);
  const inverted = TIME_OFFSET - clamped;
  return String(inverted).padStart(TIME_KEY_WIDTH, '0');
}

function buildRankKey(totalWealth: number, timestamp: number, id: string): string {
  return `${RANK_PREFIX}${toScoreKey(totalWealth)}:${toTimeKey(timestamp)}:${id}`;
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return await request.json<T>();
  } catch {
    return null;
  }
}

async function getRecord(kv: KVNamespace, key: string): Promise<ScoreRecord | null> {
  const value = await kv.get(key);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as ScoreRecord;
    if (
      typeof parsed.playerName === 'string' &&
      typeof parsed.totalWealth === 'number' &&
      typeof parsed.timestamp === 'number'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function recordFromMetadata(metadata: unknown): ScoreRecord | null {
  const meta = metadata as Partial<ScoreRecord> | undefined;
  if (!meta) return null;
  if (
    typeof meta.playerName !== 'string' ||
    typeof meta.totalWealth !== 'number' ||
    typeof meta.cash !== 'number' ||
    typeof meta.bank !== 'number' ||
    typeof meta.debt !== 'number' ||
    typeof meta.health !== 'number' ||
    typeof meta.fame !== 'number' ||
    typeof meta.timestamp !== 'number'
  ) {
    return null;
  }

  return {
    playerName: meta.playerName,
    totalWealth: meta.totalWealth,
    cash: meta.cash,
    bank: meta.bank,
    debt: meta.debt,
    health: meta.health,
    fame: meta.fame,
    timestamp: meta.timestamp,
  };
}

async function pruneBeyondTop(kv: KVNamespace, keep: number): Promise<void> {
  let cursor: string | undefined = undefined;
  let remaining = keep;

  do {
    const list = await kv.list({ prefix: RANK_PREFIX, cursor, limit: LIST_PAGE_SIZE });
    for (const entry of list.keys) {
      if (remaining > 0) {
        remaining -= 1;
        continue;
      }
      await kv.delete(entry.name);
    }

    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);
}

async function handleSubmitScore(request: Request, env: Env, origin: string | null): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('method_not_allowed', 405, origin);
  }

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) {
    return errorResponse('invalid_json', 400, origin);
  }

  const playerName = sanitizeName(body.playerName);
  if (!playerName) {
    return errorResponse('player_name_required', 400, origin);
  }

  const cash = parseNumber(body.cash);
  const bank = parseNumber(body.bank);
  const debt = parseNumber(body.debt);
  const health = parseNumber(body.health);
  const fame = parseNumber(body.fame);
  if ([cash, bank, debt, health, fame].some((value) => value === null)) {
    return errorResponse('invalid_score_fields', 400, origin);
  }

  const totalWealth = (cash as number) + (bank as number) - (debt as number);
  const timestamp = Date.now();
  const record: ScoreRecord = {
    playerName,
    totalWealth,
    cash: cash as number,
    bank: bank as number,
    debt: debt as number,
    health: health as number,
    fame: fame as number,
    timestamp,
  };

  const kv = env['beijingfushengji-data'];
  const id = crypto.randomUUID();
  const rankKey = buildRankKey(totalWealth, timestamp, id);
  const list = await kv.list({ prefix: RANK_PREFIX, limit: MAX_RECORDS });

  let stored = false;
  if (list.keys.length < MAX_RECORDS) {
    stored = true;
  } else if (list.keys.length > 0) {
    const worstKey = list.keys[list.keys.length - 1].name;
    if (rankKey < worstKey) {
      stored = true;
    }
  }

  if (stored) {
    await kv.put(rankKey, JSON.stringify(record), { metadata: record });
    if (list.keys.length >= MAX_RECORDS) {
      const worstKey = list.keys[list.keys.length - 1].name;
      await kv.delete(worstKey);
    }
  }

  if (!list.list_complete) {
    await pruneBeyondTop(kv, MAX_RECORDS);
  }

  return jsonResponse({ ok: true, stored, record }, 201, origin);
}

async function handleLeaderboard(request: Request, env: Env, origin: string | null): Promise<Response> {
  if (request.method !== 'GET') {
    return errorResponse('method_not_allowed', 405, origin);
  }

  const kv = env['beijingfushengji-data'];
  const list = await kv.list({ prefix: RANK_PREFIX, limit: MAX_RESPONSE });
  const items: ScoreRecord[] = [];

  for (const entry of list.keys) {
    const record = recordFromMetadata(entry.metadata) ?? (await getRecord(kv, entry.name));
    if (record) items.push(record);
  }

  return jsonResponse({ ok: true, items }, 200, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const normalizedOrigin = origin?.trim() ?? null;
    const isAllowedOrigin = normalizedOrigin !== null && ALLOWED_ORIGINS.has(normalizedOrigin);

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: buildCorsHeaders(normalizedOrigin) });
    }

    if (!isAllowedOrigin) {
      return errorResponse('forbidden', 403, null);
    }

    const url = new URL(request.url);
    switch (url.pathname) {
      case '/api/score':
        return handleSubmitScore(request, env, normalizedOrigin);
      case '/api/leaderboard':
        return handleLeaderboard(request, env, normalizedOrigin);
      default:
        return errorResponse('not_found', 404, normalizedOrigin);
    }
  },
};
