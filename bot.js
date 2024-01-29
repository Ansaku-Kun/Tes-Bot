const TelegramBot = require('node-telegram-bot-api');

const token = '5756557722:AAEb9vKAi3CebQDyRFI6q46_HZ_CJyx__Kk';
const bot = new TelegramBot(token, { polling: true });
const usersData = {};

function createMainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Misi', callback_data: 'misi' }, { text: 'Bonus Harian', callback_data: 'bonus_harian' }],
        [{ text: 'Saldo', callback_data: 'saldo' }],
        [{ text: 'Undang Teman', callback_data: 'undang' }, { text: 'Tarik Saldo', callback_data: 'tarik_saldo' }],
      ],
    },
  };
}

function giveNewUserBonus(userId) {
  const bonusAmount = 25000;
  if (!usersData[userId]) {
    usersData[userId] = { saldo: bonusAmount, transactions: [] };
    return bonusAmount;
  }
  return 0; // Pengguna sudah mendapatkan bonus sebelumnya
}

function giveInvitationBonus(userId) {
  const bonusAmount = 10000;
  if (usersData[userId]) {
    usersData[userId].saldo += bonusAmount;
    usersData[userId].transactions.push({ type: 'bonus_undangan', amount: bonusAmount, timestamp: Date.now() });
    return bonusAmount;
  }
  return 0; // Pengguna belum terdaftar
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name;

  const bonusAmount = giveNewUserBonus(userId);

  const message = bonusAmount
    ? `Hi ${firstName}! Selamat datang di bot ini. Anda mendapatkan bonus saldo sebesar Rp${bonusAmount}.`
    : `Hi ${firstName}! Selamat datang kembali.`;

  bot.sendMessage(chatId, message, createMainMenu());
});

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (data === 'bonus_harian') {
    // Logika untuk menampilkan bonus harian
    const bonusResult = giveDailyBonus(userId);
    const bonusAmount = bonusResult.amount;
    const timeLeft = bonusResult.timeLeft;

    if (bonusAmount > 0) {
      usersData[userId].saldo += bonusAmount;
      usersData[userId].transactions.push({ type: 'bonus_harian', amount: bonusAmount, timestamp: Date.now() });
      bot.sendMessage(chatId, `Selamat! Anda mendapatkan bonus harian sebesar Rp${bonusAmount}. Waktu tersisa untuk mendapatkan bonus lagi: ${timeLeft}.`, createMainMenu());
    } else {
      bot.sendMessage(chatId, `Maaf, Anda sudah menerima bonus harian hari ini. Waktu tersisa untuk mendapatkan bonus lagi: ${timeLeft}.`, createMainMenu());
    }
  } else if (data === 'undang') {
    // Logika untuk menampilkan tautan undangan
    const invitationBonus = giveInvitationBonus(userId);
    if (invitationBonus > 0) {
      bot.sendMessage(chatId, `Selamat! Anda mendapatkan bonus undangan teman sebesar Rp${invitationBonus}.`, createMainMenu());
    } else {
      bot.sendMessage(chatId, 'Maaf, bonus undangan hanya berlaku jika teman yang diundang menggunakan bot ini.', createMainMenu());
    }
  } else {
    // Logika untuk tombol lainnya
    handleOtherButtons(chatId, userId, data);
  }

  // Hapus callback setelah menanggapi
  bot.answerCallbackQuery(callbackQuery.id);
});

function handleOtherButtons(chatId, userId, data) {
  // Logika untuk menangani tombol lainnya sesuai kebutuhan
  if (data === 'misi') {
    // Logika untuk menampilkan misi
  } else if (data === 'saldo') {
    if (usersData[userId]) {
      const saldo = usersData[userId].saldo;
      bot.sendMessage(chatId, `Saldo Anda: Rp${saldo}`, createMainMenu());
    } else {
      bot.sendMessage(chatId, 'Anda belum terdaftar. Silakan gunakan perintah /start terlebih dahulu.', createMainMenu());
    }
  } else if (data === 'tarik_saldo') {
    // Logika untuk menampilkan tautan tarik saldo
  }
}

// Fungsi untuk memberikan bonus saldo harian
function giveDailyBonus(userId) {
  const bonusAmount = 5000;
  const now = Date.now();
  const lastBonusTime = usersData[userId] && usersData[userId].lastBonusTime ? usersData[userId].lastBonusTime : 0;

  const timeElapsed = now - lastBonusTime;
  const timeLeft = Math.max(0, 24 * 60 * 60 * 1000 - timeElapsed); // Waktu tersisa dalam milidetik

  if (timeElapsed >= 24 * 60 * 60 * 1000) {
    usersData[userId].lastBonusTime = now;
    return { amount: bonusAmount, timeLeft: formatTimeLeft(timeLeft) };
  }

  return { amount: 0, timeLeft: formatTimeLeft(timeLeft) };
}

// Fungsi untuk memformat waktu tersisa dalam jam:menit:detik
function formatTimeLeft(timeLeft) {
  const hours = Math.floor(timeLeft / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

  return `${hours} jam ${minutes} menit ${seconds} detik`;
}
