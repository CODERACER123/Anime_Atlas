const fs = require("fs");
const path = require("path");

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const CACHE_FILE = path.join(__dirname, "..", "data", "last-episodes.json");
const SUBSCRIBERS_FILE = path.join(__dirname, "..", "data", "subscribers.json");

const animeList = [
  { title: "Naruto", query: "Naruto" },
  { title: "One Piece", query: "One Piece" },
  { title: "Attack on Titan", query: "Shingeki no Kyojin" },
  { title: "My Hero Academia", query: "Boku no Hero Academia" },
  { title: "Dragon Ball Z", query: "Dragon Ball Z" },
  { title: "Demon Slayer", query: "Kimetsu no Yaiba" },
  { title: "One Punch Man", query: "One Punch Man" },
  { title: "Spy x Family", query: "Spy x Family" },
  { title: "Chainsaw Man", query: "Chainsaw Man" },
  { title: "Jujutsu Kaisen", query: "Jujutsu Kaisen" },
];

const query = `
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      title {
        romaji
        english
      }
      status
      nextAiringEpisode {
        airingAt
        episode
      }
      siteUrl
    }
  }
`;

const readJson = (filePath, fallback) => {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    return fallback;
  }
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const toLocalDateTime = (unixSeconds) => {
  if (!unixSeconds) {
    return "Unknown";
  }
  return new Date(unixSeconds * 1000).toLocaleString();
};

const fetchAnime = async (search) => {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { search },
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList error for ${search}`);
  }

  const payload = await response.json();
  return payload?.data?.Media || null;
};

const buildEmail = (updates) => {
  const rows = updates
    .map(
      (update) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e6e6e6;">${update.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e6e6e6;">Episode ${update.episode}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e6e6e6;">${update.airingAt}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e6e6e6;"><a href="${update.url}">Link</a></td>
        </tr>
      `
    )
    .join("\n");

  return `
    <h2>New anime episodes are out!</h2>
    <p>Here’s what just released:</p>
    <table style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #111;">Anime</th>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #111;">Episode</th>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #111;">Aired</th>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #111;">More</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const sendEmail = async (html, subject) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Anime Atlas";

  if (!apiKey || !senderEmail) {
    throw new Error("Missing Brevo credentials.");
  }

  const recipients = readJson(SUBSCRIBERS_FILE, { emails: [] }).emails;
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("No subscribers found in data/subscribers.json");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: recipients.map((email) => ({ email })),
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo error: ${detail}`);
  }
};

const run = async () => {
  const cache = readJson(CACHE_FILE, {});
  const now = Date.now() / 1000;
  const updates = [];

  if (process.env.FORCE_NOTIFY === "1") {
    const html = buildEmail([
      {
        title: "Test Anime",
        episode: 1,
        airingAt: new Date().toLocaleString(),
        url: "https://anilist.co",
      },
    ]);
    await sendEmail(html, "Test anime episode notification");
    console.log("Sent test notification.");
    return;
  }

  for (const anime of animeList) {
    try {
      const media = await fetchAnime(anime.query);
      if (!media || !media.nextAiringEpisode) {
        continue;
      }

      const episode = media.nextAiringEpisode.episode;
      const airingAt = media.nextAiringEpisode.airingAt;
      const lastEpisode = cache[anime.title] || 0;

      if (airingAt <= now && episode > lastEpisode) {
        cache[anime.title] = episode;
        updates.push({
          title: media.title?.english || media.title?.romaji || anime.title,
          episode,
          airingAt: toLocalDateTime(airingAt),
          url: media.siteUrl || "#",
        });
      }
    } catch (error) {
      console.error(`Failed for ${anime.title}:`, error.message);
    }
  }

  if (updates.length > 0) {
    const html = buildEmail(updates);
    await sendEmail(html, "New anime episodes released");
    writeJson(CACHE_FILE, cache);
    console.log(`Sent ${updates.length} update(s).`);
  } else {
    console.log("No new episodes to notify.");
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
