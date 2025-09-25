// index.js — Telegram Bot + Token Guard + Search via truecheck API
// Node 18+ | ES Modules
// DEP: npm i node-telegram-bot-api node-fetch

import fs from "fs";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

// ================= CONFIG =================
// 👉 ใส่ Token Bot ของคุณที่นี่
const TELEGRAM_TOKEN = "8335210571:AAE0w0UIdIRowHUoOXyjekWCyvfZflkjjpY";

// Token API
const TOKEN_API_BASE = "https://apikey-vip.netlify.app/api/pmsi";

// ✅ Search API (ใหม่)
const SEARCH_API_URL = "https://api.meaowxecross.xyz/truecheck/";

// Database file
const DB_FILE = path.join(process.cwd(), "db.json");

// ================= DB HELPERS =================
function loadDB() {
  try {
    const obj = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    if (!obj.users) obj.users = {};
    if (!obj.keys) obj.keys = {}; // key -> ownerId
    return obj;
  } catch {
    return { users: {}, keys: {} };
  }
}
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2));
}
const DB = loadDB();

function getUser(chatId) {
  const id = String(chatId);
  if (!DB.users[id]) {
    DB.users[id] = {
      chatId: id,
      userTokenKey: null,
      createdAt: new Date().toISOString(),
    };
  }
  return DB.users[id];
}
function setUserKey(chatId, key) {
  const id = String(chatId);
  if (DB.keys[key] && DB.keys[key] !== id) {
    return { ok: false, error: "❌ คีย์นี้ถูกผูกกับผู้ใช้อื่นแล้ว" };
  }
  DB.keys[key] = id;
  const u = getUser(id);
  u.userTokenKey = key;
  saveDB();
  return { ok: true };
}
function maskKey(k) {
  if (!k) return "-";
  return k.length > 12 ? `${k.slice(0, 6)}…${k.slice(-4)}` : k;
}

// ================= FORMAT RESULT =================
function formatResult(type, raw) {
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return `⚠️ ไม่สามารถอ่านข้อมูลผลลัพธ์ได้:\n\n${raw}`;
  }
  if (!obj.results || !Array.isArray(obj.results)) {
    return `📌 ข้อมูลที่ได้รับ:\n\n${JSON.stringify(obj, null, 2)}`;
  }
  if (obj.results.length === 0) {
    return `ℹ️ ไม่พบผลลัพธ์สำหรับ: ${type}`;
  }

  let out = `📌 ผลลัพธ์การค้นหา (${type})\n━━━━━━━━━━━━━━━\n`;
  obj.results.forEach((r, idx) => {
    out += `#${idx + 1}\n`;
    if (r.serviceId) out += `🔢 เบอร์/ID: ${r.serviceId}\n`;
    if (r.firstName || r.lastName)
      out += `👤 ชื่อ: ${r.firstName || ""} ${r.lastName || ""}\n`;
    if (r.birthDate)
      out += `🎂 วันเกิด: ${r.birthDate}${r.age ? ` (อายุ ${r.age})` : ""}\n`;
    if (r.idNumber) out += `🆔 เลขบัตร: ${r.idNumber}\n`;
    if (r.startDate) out += `📅 เริ่มใช้บริการ: ${r.startDate}\n`;
    if (r.address) {
      let addr = [];
      if (r.address.house) addr.push(`บ้านเลขที่ ${r.address.house}`);
      if (r.address.street) addr.push(`ถ.${r.address.street}`);
      if (r.address.khet) addr.push(`เขต ${r.address.khet}`);
      if (r.address.province) addr.push(r.address.province);
      out += `🏠 ที่อยู่: ${addr.join(", " )}\n`;
    }
    out += `━━━━━━━━━━━━━━━\n`;
  });
  return out;
}

// ================= BOT =================
console.log("Bot starting...");
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      [{ text: "🔑 ใส่คีย์" }, { text: "💳 เช็คโทเค็น" }],
      [{ text: "➡️ หน้าถัดไป" }],
    ],
    resize_keyboard: true,
  },
};

const SECOND_MENU = {
  reply_markup: {
    keyboard: [
      [{ text: "📞 ค้นหาด้วยเบอร์" }],
      [{ text: "🆔 ค้นหาด้วยเลขบัตร" }],
      [{ text: "🧑 ค้นหาด้วยชื่อ–นามสกุล" }],
      [{ text: "⬅️ กลับ" }],
    ],
    resize_keyboard: true,
  },
};

const STATE = {};

bot.onText(/\/start/i, (msg) => {
  const u = getUser(msg.chat.id);
  bot.sendMessage(
    msg.chat.id,
    `👋 <b>ยินดีต้อนรับ</b>\n\nเลือกเมนูด้านล่างได้เลย 👇\n\n🔑 คีย์ปัจจุบัน: <code>${maskKey(
      u.userTokenKey
    )}</code>`,
    { ...MAIN_MENU, parse_mode: "HTML" }
  );
});

bot.on("message", async (msg) => {
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const u = getUser(chatId);

  if (text.startsWith("/start")) return;

  if (text === "➡️ หน้าถัดไป")
    return bot.sendMessage(chatId, "📂 เลือกรูปแบบการค้นหา:", SECOND_MENU);
  if (text === "⬅️ กลับ")
    return bot.sendMessage(chatId, "🔙 กลับสู่เมนูหลัก", MAIN_MENU);

  // ===== Await Key =====
  if (STATE[chatId]?.mode === "await_key") {
    const res = setUserKey(chatId, text);
    STATE[chatId] = null;
    if (!res.ok) return bot.sendMessage(chatId, res.error, MAIN_MENU);
    return bot.sendMessage(
      chatId,
      `✅ บันทึกคีย์สำเร็จ: <code>${maskKey(text)}</code>`,
      { parse_mode: "HTML", ...MAIN_MENU }
    );
  }
  if (text === "🔑 ใส่คีย์") {
    STATE[chatId] = { mode: "await_key" };
    return bot.sendMessage(chatId, "🔑 กรุณาส่งคีย์ของคุณ (API Key)", MAIN_MENU);
  }

  // ===== Check Token =====
  if (text === "💳 เช็คโทเค็น") {
    if (!u.userTokenKey)
      return bot.sendMessage(chatId, "❌ กรุณาใส่คีย์ก่อน", MAIN_MENU);
    try {
      bot.sendMessage(chatId, "กำลังตรวจสอบโทเค็น...", {
        reply_markup: { remove_keyboard: true },
      });
      const res = await fetch(
        `${TOKEN_API_BASE}/credit?key=${encodeURIComponent(u.userTokenKey)}`
      );
      const data = await res.json();
      if (!data.ok)
        return bot.sendMessage(chatId, `❌ ไม่สำเร็จ: ${data.error}`, MAIN_MENU);
      return bot.sendMessage(
        chatId,
        `💳 โทเค็นคงเหลือ: <b>${data.tokens_remaining}</b>`,
        { parse_mode: "HTML", ...MAIN_MENU }
      );
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, "⚠️ เชื่อมต่อ API ไม่ได้", MAIN_MENU);
    }
  }

  // ===== Search Handler =====
  async function handleCustomSearch(type, value) {
    if (!u.userTokenKey)
      return bot.sendMessage(chatId, "❌ กรุณาใส่คีย์ก่อน", MAIN_MENU);

    bot.sendMessage(chatId, "⏳ กำลังดำเนินการ โปรดรอสักครู่...", {
      reply_markup: { remove_keyboard: true },
    });

    // 1) Check credit
    try {
      const creditRes = await fetch(
        `${TOKEN_API_BASE}/credit?key=${encodeURIComponent(u.userTokenKey)}`
      );
      const creditData = await creditRes.json();
      if (!creditData.ok) {
        return bot.sendMessage(
          chatId,
          `❌ เช็คเครดิตไม่สำเร็จ: ${creditData.error}`,
          MAIN_MENU
        );
      }
      if (creditData.tokens_remaining < 10) {
        return bot.sendMessage(
          chatId,
          `⚠️ เครดิตไม่พอ (เหลือ ${creditData.tokens_remaining}) การค้นหาใช้ 10 โทเค็น กรุณาเติมเครดิต`,
          MAIN_MENU
        );
      }
    } catch (err) {
      console.error("Credit check error:", err);
      return bot.sendMessage(chatId, "⚠️ ไม่สามารถตรวจสอบเครดิตได้", MAIN_MENU);
    }

    // 2) Deduct tokens
    try {
      const useRes = await fetch(`${TOKEN_API_BASE}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: u.userTokenKey, tokens: 10 }),
      });
      const useData = await useRes.json();
      if (!useData.ok) {
        return bot.sendMessage(
          chatId,
          `❌ ใช้งานไม่สำเร็จ: ${useData.error}`,
          MAIN_MENU
        );
      }
    } catch (err) {
      console.error("Token deduction error:", err);
      return bot.sendMessage(chatId, "⚠️ ตัดเครดิตไม่สำเร็จ", MAIN_MENU);
    }

    // 3) Perform the search
    const url = `${SEARCH_API_URL}?type=${type}&value=${encodeURIComponent(
      value
    )}`;
    try {
      const res = await fetch(url);
      const data = await res.text();
      const pretty = formatResult(type, data);
      return bot.sendMessage(chatId, pretty, {
        parse_mode: "HTML",
        ...SECOND_MENU,
      });
    } catch (err) {
      console.error("Search error:", err);
      return bot.sendMessage(chatId, "❌ เกิดข้อผิดพลาดในการค้นหา", SECOND_MENU);
    }
  }

  // ===== Handle Search States =====
  if (STATE[chatId]?.mode === "phone") {
    STATE[chatId] = null;
    return handleCustomSearch("phone", text);
  }
  if (STATE[chatId]?.mode === "id") {
    STATE[chatId] = null;
    return handleCustomSearch("id", text);
  }
  if (STATE[chatId]?.mode === "name") {
    STATE[chatId] = null;
    return handleCustomSearch("name", text);
  }

  // ===== Set State =====
  if (text === "📞 ค้นหาด้วยเบอร์") {
    STATE[chatId] = { mode: "phone" };
    return bot.sendMessage(chatId, "📞 ส่งหมายเลขโทรศัพท์ที่ต้องการค้นหา:");
  }
  if (text === "🆔 ค้นหาด้วยเลขบัตร") {
    STATE[chatId] = { mode: "id" };
    return bot.sendMessage(chatId, "🆔 ส่งเลขบัตรประชาชนที่ต้องการค้นหา:");
  }
  if (text === "🧑 ค้นหาด้วยชื่อ–นามสกุล") {
    STATE[chatId] = { mode: "name" };
    return bot.sendMessage(
      chatId,
      "🧑 ส่งชื่อ–นามสกุลที่ต้องการค้นหา (เช่น สมชาย รักดี):"
    );
  }
});

console.log("Bot is running!");
