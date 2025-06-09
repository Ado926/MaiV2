// Código ofc de Anya ⚔️
//Creditos para SoyMaycol y Wirk
import fetch from "node-fetch";
import crypto from "crypto";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

let handler = async (m, { conn }) => {
  let q = m.quoted || m;
  let mime = (q.msg || q).mimetype || '';
  if (!mime) return conn.reply(m.chat, `📎 Por favor responde a un archivo válido (imagen, video, documento, etc).`, m, rcanal);

  await m.react('🕒');

  try {
    let media = await q.download();
    let linkData = await maybox(media, mime);

    if (!linkData?.data?.url) throw '❌ No se pudo subir el archivo';

    let info = linkData.data;
    let txt = `
🌸｡･:*:･ﾟ★ 𝚆𝚒𝚛𝚔𝚜𝚒 𝙱𝚘𝚡 ★･ﾟ:*:･｡🌸

📁 *Nombre:* ${info.originalName}
📦 *Peso:* ${formatBytes(info.size)}
🗓️ *Fecha:* ${formatDate(info.uploadedAt)}
🔗 *Link:* ${info.url}

🌐 *Processed By ${wm}*`;

    await conn.sendFile(m.chat, media, info.fileName, txt, m, rcanal);
    await m.react('✅');
  } catch (err) {
    console.error(err);
    await m.react('❌');
    await conn.reply(m.chat, `🚫 Hubo un error al subir el archivo a WirksiBox. Intenta de nuevo más tarde.`, m, rcanal);
  }
};

handler.help = ['tourl'];
handler.tags = ['tools'];
handler.command = ['wirksibox', 'tourl'];
export default handler;

// --- Funciones auxiliares ---
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

function formatDate(date) {
  return new Date(date).toLocaleString('es-ES', { timeZone: 'America/Tegucigalpa' });
}

async function maybox(content, mime) {
  const { ext } = (await fileTypeFromBuffer(content)) || { ext: 'bin' };
  const blob = new Blob([content.toArrayBuffer()], { type: mime });
  const form = new FormData();
  const filename = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
  form.append('file', blob, filename);

  const res = await fetch('https://wirksibox.onrender.com/api/upload', {
    method: 'POST',
    body: form,
    headers: {
      'User-Agent': 'AnyaForger',
    }
  });

  return await res.json();
}