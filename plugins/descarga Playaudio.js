import fetch from "node-fetch";
import yts from "yt-search";
import axios from "axios";

const formatAudio = ["mp3", "m4a", "webm", "acc", "flac", "opus", "ogg", "wav"];
const formatVideo = ["360", "480", "720", "1080", "1440", "4k"];
const limit = 100;

const ddownr = {
  download: async (url, format) => {
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
      throw new Error("⚠ Formato no soportado.");
    }

    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    };

    try {
      const response = await axios.request(config);
      if (response.data?.success) {
        const { id, title, info } = response.data;
        const downloadUrl = await ddownr.cekProgress(id);
        return { id, title, image: info.image, downloadUrl };
      } else throw new Error("⛔ No se pudo obtener detalles.");
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  },

  cekProgress: async (id) => {
    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    };

    try {
      while (true) {
        const response = await axios.request(config);
        if (response.data?.success && response.data.progress === 1000) {
          return response.data.download_url;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  }
};

const handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply("Ingresa el nombre de un video o una URL de YouTube.");
  m.react("🕛");

  const res = await yts(text);
  if (!res.all.length) return m.reply("No se encontraron resultados para tu búsqueda.");

  const video = res.all[0];
  const total = Number(video.duration.seconds) || 0;

  const cap = `「❀」${video.title}

> ✧ Canal : » ${video.author.name}
> ✧ Duración : » ${video.duration.timestamp}
> ✧ Vistas : » ${video.views}
> ✧ URL : » ${video.url}`;

  await conn.sendFile(m.chat, await (await fetch(video.thumbnail)).buffer(), "thumb.jpg", cap, m);

  if (["play", "yta", "ytmp3"].includes(command)) {
    try {
      const api = await ddownr.download(video.url, "mp3");
      await conn.sendMessage(m.chat, {
        audio: { url: api.downloadUrl },
        mimetype: "audio/mpeg"
      }, { quoted: m });
      await m.react("✅");
    } catch (e) {
      return m.reply(`⛔ Error: ${e.message}`);
    }
  } else if (["play2", "ytv", "ytmp4"].includes(command)) {
    try {
      const sources = [
        `https://api.siputzx.my.id/api/d/ytmp4?url=${video.url}`,
        `https://api.zenkey.my.id/api/download/ytmp4?apikey=zenkey&url=${video.url}`,
        `https://axeel.my.id/api/download/video?url=${encodeURIComponent(video.url)}`,
        `https://delirius-apiofc.vercel.app/download/ytmp4?url=${video.url}`
      ];

      let success = false;
      for (let src of sources) {
        try {
          const res = await fetch(src);
          const json = await res.json();
          const link = json?.data?.dl || json?.result?.download?.url || json?.downloads?.url || json?.data?.download?.url;
          if (link) {
            success = true;
            const head = await fetch(link, { method: "HEAD" });
            const size = parseInt(head.headers.get("Content-Length")) || 0;
            const isDoc = (size / (1024 * 1024)) >= limit;

            await conn.sendFile(m.chat, link, `${video.title}.mp4`, "", m, null, {
              asDocument: isDoc,
              mimetype: "video/mp4"
            });
            await m.react("✅");
            break;
          }
        } catch (e) {
          console.error("⚠ Fuente fallida:", e.message);
        }
      }
      if (!success) return m.reply("⛔ No se pudo descargar el video.");
    } catch (e) {
      return m.reply(`⛔ Error: ${e.message}`);
    }
  }
};

handler.help = ["play"];
handler.tags = ["downloader"];
handler.command = ["play"];

export default handler;