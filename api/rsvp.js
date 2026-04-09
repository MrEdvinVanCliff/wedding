const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('Postgres connection string is missing.');
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }

  return pool;
}

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id SERIAL PRIMARY KEY,
      surname TEXT NOT NULL,
      name TEXT NOT NULL,
      patronymic TEXT,
      attendance TEXT NOT NULL,
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function normalize(value) {
  return String(value || '').trim();
}

function attendanceLabel(value) {
  if (value === 'yes') return 'Буде присутній';
  if (value === 'maybe') return 'Ще не знає';
  if (value === 'no') return 'Не зможе';
  return value;
}

async function sendTelegramMessage(message) {
  const token = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Telegram credentials are missing.');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || 'Telegram message was not sent.');
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    await ensureTable();

    const surname = normalize(req.body?.surname);
    const name = normalize(req.body?.name);
    const patronymic = normalize(req.body?.patronymic);
    const attendance = normalize(req.body?.attendance);
    const comment = normalize(req.body?.comment);

    if (!surname || !name || !attendance) {
      return res.status(400).json({
        error: 'Будь ласка, заповніть прізвище, імʼя та варіант присутності.'
      });
    }

    const validAttendance = new Set(['yes', 'maybe', 'no']);
    if (!validAttendance.has(attendance)) {
      return res.status(400).json({ error: 'Некоректний статус присутності.' });
    }

    const insertResult = await getPool().query(
      `
        INSERT INTO rsvps (surname, name, patronymic, attendance, comment)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `,
      [surname, name, patronymic || null, attendance, comment || null]
    );

    const record = insertResult.rows[0];

    const lines = [
      '<b>Нова відповідь на весільну анкету</b>',
      '',
      `<b>Прізвище:</b> ${surname}`,
      `<b>Імʼя:</b> ${name}`,
      `<b>По батькові:</b> ${patronymic || '—'}`,
      `<b>Статус:</b> ${attendanceLabel(attendance)}`,
      `<b>Коментар:</b> ${comment || '—'}`,
      '',
      `<b>ID запису:</b> ${record.id}`,
      `<b>Час:</b> ${new Date(record.created_at).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`
    ];

    await sendTelegramMessage(lines.join('\n'));

    return res.status(200).json({
      ok: true,
      message: 'Дякуємо! Вашу відповідь збережено.'
    });
  } catch (error) {
    console.error('RSVP submit failed:', error);
    return res.status(500).json({
      error: 'Не вдалося відправити відповідь. Спробуйте ще раз.'
    });
  }
};
