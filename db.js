const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_KEY;

async function sbGet(key) {
  const r = await fetch(`${SB_URL}/rest/v1/stockvet?key=eq.${key}&select=value`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  });
  const d = await r.json();
  return d[0]?.value ? JSON.parse(d[0].value) : null;
}

async function sbSet(key, value) {
  await fetch(`${SB_URL}/rest/v1/stockvet`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ key, value: JSON.stringify(value) })
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!SB_URL || !SB_KEY) return res.status(503).json({ error: 'Supabase não configurado' });
  try {
    if (req.method === 'GET') {
      const [stockData, movData] = await Promise.all([sbGet('stock'), sbGet('mov')]);
      return res.status(200).json({ stockData, movData });
    }
    if (req.method === 'POST') {
      const { payload } = req.body;
      await Promise.all([sbSet('stock', payload.stockData), sbSet('mov', payload.movData)]);
      return res.status(200).json({ ok: true });
    }
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
