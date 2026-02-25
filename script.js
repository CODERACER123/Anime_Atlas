/* ── Diagnostics overlay ───────────────────────────────────── */
const logToDiagnostics = (message) => {
  if (
    !window.location.search.includes("debug=1") &&
    window.location.protocol !== "file:"
  ) {
    return;
  }
  let panel = document.querySelector(".diagnostic-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "diagnostic-panel";
    panel.innerHTML = "<strong>Diagnostics</strong><div class=\"diagnostic-body\"></div>";
    document.body.appendChild(panel);
  }
  const body = panel.querySelector(".diagnostic-body");
  const item = document.createElement("div");
  item.textContent = message;
  body.appendChild(item);
  console.log(`[Diagnostic] ${message}`);
};

const initDiagnostics = () => {
  const shouldShow =
    window.location.search.includes("debug=1") ||
    window.location.protocol === "file:";

  if (shouldShow) {
    logToDiagnostics("Diagnostics enabled.");
    if (window.location.protocol === "file:") {
      logToDiagnostics("You are on file://. Fetch requests may be blocked.");
    }
  }

  window.addEventListener("error", (event) => {
    logToDiagnostics(`JS Error: ${event.message}`);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason);
    logToDiagnostics(`Unhandled Promise: ${reason}`);
  });

  const testAniList = async () => {
    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query: "query { Media(id: 1) { id } }",
        }),
      });
      if (!response.ok) {
        logToDiagnostics(`AniList request failed: ${response.status}`);
        return;
      }
      logToDiagnostics("AniList connectivity OK.");
    } catch (error) {
      logToDiagnostics(`AniList connectivity error: ${error.message || error}`);
    }
  };

  if (shouldShow) {
    testAniList();
  }
};

initDiagnostics();

/* ── Hero particle canvas ─────────────────────────────────── */
const initHeroCanvas = () => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const canvas = document.createElement("canvas");
  canvas.id = "hero-canvas";
  header.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = header.offsetWidth;
    canvas.height = header.offsetHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const count = 70;
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2.5 + 0.8,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.65 + 0.3,
  }));

  const accentColors = ["124,123,255", "255,139,209", "56,234,220"];

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      const color = accentColors[i % accentColors.length];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${p.alpha})`;
      ctx.fill();

      // draw faint lines to nearby particles
      particles.forEach((q, j) => {
        if (j <= i) return;
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${color},${0.18 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });
    });
    requestAnimationFrame(tick);
  };
  tick();
};

initHeroCanvas();

const facts = [
  "Studio Ghibli famously hand-paints every frame detail for a warm, tactile look.",
  "Spirited Away was the first anime film to win the Oscar for Best Animated Feature.",
  "Akira used over 160,000 cels to achieve its cinematic animation quality.",
  "One Piece has remained a top-selling manga for over two decades.",
  "Attack on Titan reimagined political fantasy within a survival story.",
  "Your Name became a global hit thanks to its emotional time-twist narrative.",
];

const factText = document.getElementById("fact-text");
const button = document.getElementById("random-fact");

// Apply saved theme immediately to prevent flash of wrong theme
(function () {
  const saved = localStorage.getItem("animeAtlasTheme");
  const prefersDark = window.matchMedia && !window.matchMedia("(prefers-color-scheme: light)").matches;
  if (saved === "light" || (!saved && !prefersDark)) {
    document.body.classList.add("light-theme");
  }
})();

const themeKey = "animeAtlasTheme";
const getPreferredTheme = () => {
  const saved = localStorage.getItem(themeKey);
  if (saved) {
    return saved;
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
};

const applyTheme = (theme) => {
  document.body.classList.toggle("light-theme", theme === "light");
};

const initThemeToggle = () => {
  const nav = document.querySelector(".nav");
  if (!nav) {
    return;
  }
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "ghost theme-toggle";
  const setLabel = (theme) => {
    toggle.textContent = theme === "light" ? "Dark mode" : "Light mode";
  };
  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);
  setLabel(currentTheme);
  toggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme")
      ? "dark"
      : "light";
    applyTheme(nextTheme);
    localStorage.setItem(themeKey, nextTheme);
    setLabel(nextTheme);
  });
  const cta = nav.querySelector(".cta");
  if (cta) {
    nav.insertBefore(toggle, cta);
  } else {
    nav.appendChild(toggle);
  }
};

initThemeToggle();

// Highlight the current page's nav link
(function () {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href")?.split("#")[0];
    if (href && (href === path || (path === "" && href === "index.html"))) {
      a.classList.add("active");
    }
  });
})();

const updateFact = () => {
  if (!factText) {
    return;
  }
  const next = facts[Math.floor(Math.random() * facts.length)];
  factText.textContent = next;
};

if (button) {
  button.addEventListener("click", updateFact);
}

const isValidEmail = (value) =>
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(
    value
  );

const createSignupDialog = () => {
  if (document.getElementById("signup-dialog")) {
    return;
  }

  const dialog = document.createElement("dialog");
  dialog.id = "signup-dialog";
  dialog.className = "signup-dialog";
  dialog.innerHTML = `
    <form class="signup-form" method="POST" action="https://formspree.io/f/mjgeawvy">
      <h3>Join the Anime Atlas Club</h3>
      <p>Get monthly recommendations and new story drops.</p>
      <label class="signup-field">
        Email address
        <input type="email" name="email" placeholder="you@example.com" required />
      </label>
      <label class="signup-check">
        <input type="checkbox" required />
        I agree to receive updates and can unsubscribe anytime.
      </label>
      <div class="signup-actions">
        <button type="button" class="ghost" data-close>Cancel</button>
        <button type="submit" class="primary">Join now</button>
      </div>
      <p class="signup-note">
        Replace the Formspree URL with your email provider for double opt-in.
      </p>
    </form>
  `;
  document.body.appendChild(dialog);

  dialog.querySelector("[data-close]")?.addEventListener("click", () => {
    dialog.close();
  });
};

const openSignupDialog = () => {
  createSignupDialog();
  const dialog = document.getElementById("signup-dialog");
  if (dialog?.showModal) {
    dialog.showModal();
    return;
  }
  const email = window.prompt("Join the club! Enter your email address:");
  if (!email) {
    return;
  }
  if (!isValidEmail(email.trim())) {
    window.alert("Please enter a valid email address.");
    return;
  }
  window.alert("Thanks for joining! Watchlist updates are on the way.");
};

document.querySelectorAll(".cta").forEach((ctaButton) => {
  ctaButton.addEventListener("click", openSignupDialog);
});

const weeklySpotlightCard = document.getElementById("weekly-spotlight");
const weeklySpotlightTitle = document.getElementById("spotlight-title");
const weeklySpotlightTags = document.getElementById("spotlight-tags");

const getWeekNumber = (date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
};

const weeklySpotlightKey = "animeAtlasWeeklySpotlight";

const setWeeklySpotlight = (entry) => {
  if (!weeklySpotlightTitle || !weeklySpotlightTags || !entry) {
    return;
  }
  weeklySpotlightTitle.textContent = entry.title;
  weeklySpotlightTags.textContent = entry.genres.length
    ? entry.genres.join(" • ")
    : "Genres updating soon";
};

const loadWeeklySpotlight = async () => {
  if (!weeklySpotlightCard || !weeklySpotlightTitle || !weeklySpotlightTags) {
    return;
  }
  const now = new Date();
  const week = getWeekNumber(now);
  const year = now.getFullYear();

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          title {
            english
            romaji
          }
          genres
        }
      }
    }
  `;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { page: 1, perPage: 40 },
      }),
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const list = payload?.data?.Page?.media || [];
    if (list.length === 0) {
      return;
    }

    const index = week % list.length;
    const pick = list[index];
    const title = pick.title?.english || pick.title?.romaji || "Weekly pick";
    const genres = Array.isArray(pick.genres) ? pick.genres.slice(0, 3) : [];
    const entry = { title, genres };

    setWeeklySpotlight(entry);
    localStorage.setItem(
      weeklySpotlightKey,
      JSON.stringify({ week, year, entry })
    );
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(weeklySpotlightKey) || "null");
      if (cached && cached.week === week && cached.year === year && cached.entry) {
        setWeeklySpotlight(cached.entry);
      }
    } catch (cacheError) {
      return;
    }
  }
};

loadWeeklySpotlight();

const scheduleData = [
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
  { title: "Frieren: Beyond Journey's End", query: "Sousou no Frieren" },
  { title: "Hell's Paradise", query: "Jigokuraku" },
  { title: "Fire Force", query: "Enen no Shouboutai" },
  { title: "Solo Leveling", query: "Solo Leveling" },
  { title: "Sakamoto Days", query: "Sakamoto Days" },
  { title: "Bleach", query: "Bleach" },
  { title: "Hunter x Hunter", query: "Hunter x Hunter" },
  { title: "Haikyu!!", query: "Haikyuu!!" },
  { title: "Black Clover", query: "Black Clover" },
  { title: "JoJo's Bizarre Adventure", query: "JoJo no Kimyou na Bouken (2012)" },
  { title: "Horimiya", query: "Horimiya" },
  { title: "Blue Box", query: "Ao no Hako" },
  { title: "Fullmetal Alchemist: Brotherhood", query: "Fullmetal Alchemist: Brotherhood" },
  { title: "Vinland Saga", query: "Vinland Saga" },
  { title: "Steins;Gate", query: "Steins;Gate" },
  { title: "Mashle: Magic and Muscles", query: "Mashle: Magic and Muscles" },
  { title: "Gintama", query: "Gintama" },
  { title: "Re:Zero", query: "Re:Zero kara Hajimeru Isekai Seikatsu" },
  { title: "Sword Art Online", query: "Sword Art Online" },
  // Batch 2 additions
  { title: "Neon Genesis Evangelion", query: "Neon Genesis Evangelion" },
  { title: "Paranoia Agent", query: "Mousou Dairinin" },
  { title: "Fruits Basket", query: "Fruits Basket (2019)" },
  { title: "86 Eighty Six", query: "86" },
  { title: "Oshi no Ko", query: "Oshi no Ko" },
  { title: "Tougen Anki", query: "Tougen Anki" },
  { title: "KonoSuba", query: "Kono Subarashii Sekai ni Shukufuku wo!" },
  { title: "Spirit Chronicles", query: "Seirei Gensouki" },
  { title: "Darwin's Game", query: "Darwin's Game" },
  { title: "Soul Eater", query: "Soul Eater" },
  { title: "Bungo Stray Dogs", query: "Bungou Stray Dogs" },
  { title: "Tokyo Revengers", query: "Tokyo Revengers" },
  { title: "Rent-a-Girlfriend", query: "Kanojo, Okarishimasu" },
  { title: "Alya Sometimes Hides Her Feelings in Russian", query: "Alya-san wa Koi wo Tonikaku Kakushitai" },
  { title: "Food Wars", query: "Shokugeki no Soma" },
  { title: "Kaiju No. 8", query: "Kaiju No. 8" },
  { title: "Delicious in Dungeon", query: "Dungeon Meshi" },
  { title: "Ranking of Kings", query: "Ousama Ranking" },
  { title: "Pluto", query: "Pluto" },
  { title: "Chihayafuru", query: "Chihayafuru" },
  { title: "Beastars", query: "Beastars" },
  { title: "Gachiakuta", query: "Gachiakuta" },
  { title: "Blue Exorcist", query: "Ao no Exorcist" },
  { title: "High School DxD", query: "High School DxD" },
  { title: "Toilet-bound Hanako-kun", query: "Jibaku Shounen Hanako-kun" },
  { title: "Zom 100", query: "Zom 100" },
  { title: "World Trigger", query: "World Trigger" },
];

const scheduleSelect = document.getElementById("anime-select");
const scheduleResult = document.getElementById("schedule-result");
let countdownTimerId = null;

const renderScheduleOptions = () => {
  if (!scheduleSelect) {
    return;
  }
  scheduleData.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.title;
    option.textContent = item.title;
    scheduleSelect.appendChild(option);
  });
};

const renderScheduleMessage = (title, details) => {
  if (!scheduleResult) {
    return;
  }
  scheduleResult.innerHTML = `
    <h3>${title}</h3>
    ${details}
  `;
};

const clearCountdown = () => {
  if (countdownTimerId) {
    clearInterval(countdownTimerId);
    countdownTimerId = null;
  }
  const countdownEl = document.getElementById("countdown");
  if (countdownEl) {
    countdownEl.textContent = "";
  }
};

const startCountdown = (airingAt) => {
  clearCountdown();
  if (!airingAt) {
    return;
  }
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) {
    return;
  }

  const tick = () => {
    const diffMs = airingAt * 1000 - Date.now();
    if (diffMs <= 0) {
      countdownEl.textContent = "Episode is out now!";
      clearCountdown();
      return;
    }
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    countdownEl.textContent = `Countdown: ${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  tick();
  countdownTimerId = setInterval(tick, 1000);
};

const updateSchedule = async (title) => {
  if (!title) {
    renderScheduleMessage(
      "Next episode",
      "<p>Select an anime to view the schedule.</p>"
    );
    return;
  }

  renderScheduleMessage(title, "<p>Loading latest schedule...</p>");

  const item = scheduleData.find((entry) => entry.title === title);
  if (!item) {
    renderScheduleMessage(title, "<p>Title not found in the schedule list.</p>");
    return;
  }

  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
        }
        status
        episodes
        season
        seasonYear
        nextAiringEpisode {
          airingAt
          episode
        }
        siteUrl
        relations {
          edges {
            relationType
            node {
              id
              type
              title {
                romaji
                english
              }
              status
              episodes
              season
              seasonYear
              nextAiringEpisode {
                airingAt
                episode
              }
              siteUrl
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { search: item.query },
      }),
    });

    if (!response.ok) {
      throw new Error("AniList request failed");
    }

    const payload = await response.json();
    const media = payload?.data?.Media;

    if (!media) {
      renderScheduleMessage(title, "<p>No matching title found on AniList.</p>");
      return;
    }

    const displayTitle =
      media.title?.english || media.title?.romaji || item.title;

    const buildSeasonCard = (entry) => {
      const title = entry.title?.english || entry.title?.romaji || "Untitled";
      const seasonLabel = entry.season && entry.seasonYear
        ? `${entry.season} ${entry.seasonYear}`
        : "Season";
      const status = entry.status ? entry.status.replaceAll("_", " ") : "Unknown";
      const totalEpisodes = entry.episodes ? `${entry.episodes}` : "Unknown";
      const nextEpisode = entry.nextAiringEpisode?.episode;
      const nextAirAt = entry.nextAiringEpisode?.airingAt || null;
      const nextLine = nextEpisode ? `Episode ${nextEpisode}` : "Not currently scheduled";
      const dateLine = nextAirAt
        ? new Date(nextAirAt * 1000).toLocaleString()
        : "";
      return `
        <article class="card">
          <h3>${title}</h3>
          <p class="meta">${seasonLabel}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Next episode:</strong> ${nextLine}</p>
          ${dateLine ? `<p><strong>Airs on:</strong> ${dateLine}</p>` : ""}
          <p><strong>Total episodes:</strong> ${totalEpisodes}</p>
        </article>
      `;
    };

    const related = (media.relations?.edges || [])
      .filter((edge) => edge?.node?.type === "ANIME")
      .map((edge) => edge.node);

    const allSeasons = [media, ...related];
    if (item.title === "Jujutsu Kaisen") {
      allSeasons.push({
        id: "jjk-culling-game",
        title: { english: "JUJUTSU KAISEN Season 3: The Culling Game Part 1" },
        status: "RELEASING",
        episodes: 12,
        season: "WINTER",
        seasonYear: 2026,
        nextAiringEpisode: {
          episode: 8,
          airingAt: 1772119560,
        },
        siteUrl: "https://anilist.co/anime/172463",
      });
    }
    const uniqueSeasons = Array.from(
      new Map(allSeasons.map((entry) => [entry.id, entry])).values()
    ).sort((a, b) => {
      const yearA = a.seasonYear || 0;
      const yearB = b.seasonYear || 0;
      if (yearA !== yearB) return yearA - yearB;
      const order = { WINTER: 1, SPRING: 2, SUMMER: 3, FALL: 4 };
      return (order[a.season] || 0) - (order[b.season] || 0);
    });

    const seasonCards = uniqueSeasons.map(buildSeasonCard).join("");
    renderScheduleMessage(
      `${displayTitle} — All seasons` ,
      `
        <p>Showing next-airing info for each season or sequel.</p>
        <div class="grid two">
          ${seasonCards}
        </div>
      `
    );

    const primaryAiringAt = media.nextAiringEpisode?.airingAt || null;
    if (primaryAiringAt) {
      startCountdown(primaryAiringAt);
    } else {
      clearCountdown();
    }
  } catch (error) {
    clearCountdown();
    renderScheduleMessage(
      title,
      "<p>Unable to load schedule right now. Please try again later.</p>"
    );
  }
};

if (scheduleSelect) {
  renderScheduleOptions();
  scheduleSelect.addEventListener("change", (event) => {
    updateSchedule(event.target.value);
  });
}

const seasonSelect = document.getElementById("season-select");
const seasonYearSelect = document.getElementById("season-year");
const seasonAiringList = document.getElementById("season-airing-list");

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return "WINTER";
  if (month >= 4 && month <= 6) return "SPRING";
  if (month >= 7 && month <= 9) return "SUMMER";
  return "FALL";
};

const renderSeasonOptions = () => {
  if (!seasonSelect || !seasonYearSelect) {
    return;
  }
  const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
  const currentSeason = getCurrentSeason();
  seasonSelect.innerHTML = "";
  seasons.forEach((season) => {
    const option = document.createElement("option");
    option.value = season;
    option.textContent = season[0] + season.slice(1).toLowerCase();
    if (season === currentSeason) {
      option.selected = true;
    }
    seasonSelect.appendChild(option);
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  seasonYearSelect.innerHTML = "";
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = `${year}`;
    option.textContent = `${year}`;
    if (year === currentYear) {
      option.selected = true;
    }
    seasonYearSelect.appendChild(option);
  });
};

const renderSeasonAiring = (items) => {
  if (!seasonAiringList) {
    return;
  }
  seasonAiringList.innerHTML = "";
  if (!items || items.length === 0) {
    seasonAiringList.innerHTML = "<p class=\"muted\">No airing shows found for this season.</p>";
    return;
  }
  items.forEach((media) => {
    const title = media.title?.english || media.title?.romaji || "Untitled";
    const cover = media.coverImage?.large || "https://placehold.co/600x800?text=Anime";
    const nextEpisode = media.nextAiringEpisode?.episode;
    const airingAt = media.nextAiringEpisode?.airingAt;
    const nextLine = nextEpisode ? `Ep ${nextEpisode}` : "TBA";
    const airDate = airingAt
      ? new Date(airingAt * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "";
    const status = media.status ? media.status.replace("_", " ") : "";
    const eps = media.episodes ? `${media.episodes} eps` : "";
    const genres = (media.genres || []).slice(0, 2);

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img class="card-cover" src="${cover}" alt="${title} cover" />
      <h3>${title}</h3>
      <p class="meta">${[nextLine + (airDate ? ` · ${airDate}` : ""), eps].filter(Boolean).join(" — ")}</p>
      <div class="genre-badges" style="margin-top:8px">
        ${genres.map(g => `<span class="genre-badge" data-genre="${g}">${g}</span>`).join("")}
      </div>
      ${status === "FINISHED" ? `<p style="font-size:0.78rem;color:var(--muted);margin-top:6px">Finished airing</p>` : ""}
    `;
    if (media.siteUrl) {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => window.open(media.siteUrl, "_blank"));
    }
    seasonAiringList.appendChild(card);
  });
};

const loadSeasonAiring = async () => {
  if (!seasonSelect || !seasonYearSelect || !seasonAiringList) {
    return;
  }
  const season = seasonSelect.value;
  const seasonYear = Number(seasonYearSelect.value);
  seasonAiringList.innerHTML = "<p class=\"muted\">Loading season lineup...</p>";

  const query = `
    query ($season: MediaSeason, $seasonYear: Int) {
      Page(perPage: 20) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
          title {
            english
            romaji
          }
          siteUrl
          status
          episodes
          coverImage {
            large
          }
          genres
          nextAiringEpisode {
            episode
            airingAt
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { season, seasonYear },
      }),
    });

    if (!response.ok) {
      throw new Error("AniList request failed");
    }

    const payload = await response.json();
    const items = payload?.data?.Page?.media || [];
    renderSeasonAiring(items);
  } catch (error) {
    seasonAiringList.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:20px">
        <p class="muted">Unable to load season lineup — this requires a live server (not file://).</p>
        <button class="ghost" style="margin-top:12px" onclick="loadSeasonAiring()">↺ Try again</button>
      </div>
    `;
  }
};

if (seasonSelect && seasonYearSelect) {
  renderSeasonOptions();
  loadSeasonAiring();
  seasonSelect.addEventListener("change", loadSeasonAiring);
  seasonYearSelect.addEventListener("change", loadSeasonAiring);
}

const favoritesKey = "animeAtlasFavorites";
const favoritesList = document.getElementById("favorites-list");
const favoritesEmpty = document.getElementById("favorites-empty");
const watchlistKey = "animeAtlasWatchlist";
const watchlistList = document.getElementById("watchlist-list");
const watchlistEmpty = document.getElementById("watchlist-empty");
const watchlistClear = document.getElementById("watchlist-clear");
const watchlistCounts = document.getElementById("watchlist-counts");
const watchlistStatuses = {
  watching: "Watching",
  completed: "Completed",
  plan: "Plan to Watch",
  "on-hold": "On Hold",
  dropped: "Dropped",
};

const getFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(favoritesKey)) || [];
  } catch (error) {
    return [];
  }
};

const saveFavorites = (favorites) => {
  localStorage.setItem(favoritesKey, JSON.stringify(favorites));
};

const getWatchlist = () => {
  try {
    return JSON.parse(localStorage.getItem(watchlistKey)) || {};
  } catch (error) {
    return {};
  }
};

const saveWatchlist = (watchlist) => {
  localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
};

const renderFavorites = () => {
  if (!favoritesList || !favoritesEmpty) {
    return;
  }
  const favorites = getFavorites();
  favoritesList.innerHTML = "";
  if (favorites.length === 0) {
    favoritesEmpty.style.display = "block";
    return;
  }
  favoritesEmpty.style.display = "none";
  favorites.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    favoritesList.appendChild(listItem);
  });
};

const renderWatchlist = () => {
  if (!watchlistList || !watchlistEmpty) {
    return;
  }
  const watchlist = getWatchlist();
  const entries = Object.entries(watchlist)
    .filter(([, status]) => status)
    .sort((a, b) => a[0].localeCompare(b[0]));
  watchlistList.innerHTML = "";
  if (watchlistCounts) {
    const counts = entries.reduce((acc, [, status]) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const countMarkup = Object.keys(watchlistStatuses)
      .map((key) => {
        const label = watchlistStatuses[key];
        const value = counts[key] || 0;
        return `<span class="count-pill">${label}: ${value}</span>`;
      })
      .join("");
    watchlistCounts.innerHTML = countMarkup;
  }
  if (entries.length === 0) {
    watchlistEmpty.style.display = "block";
    return;
  }
  watchlistEmpty.style.display = "none";
  entries.forEach(([title, status]) => {
    const listItem = document.createElement("li");
    listItem.className = "watchlist-item";
    const label = watchlistStatuses[status] || status;
    listItem.innerHTML = `
      <span>${title} • ${label}</span>
      <button class="watchlist-remove" type="button" data-title="${title}">Remove</button>
    `;
    watchlistList.appendChild(listItem);
  });
};

const toggleFavorite = (title, button) => {
  const favorites = getFavorites();
  const exists = favorites.includes(title);
  const updated = exists
    ? favorites.filter((item) => item !== title)
    : [...favorites, title];
  saveFavorites(updated);
  button.textContent = exists ? "♡ Favorite" : "♥ Favorited";
  button.classList.toggle("is-favorite", !exists);
  renderFavorites();
};

const wireFavToggle = (button) => {
  const card = button.closest("[data-anime], article");
  const title = card?.dataset?.anime || card?.querySelector("h3")?.textContent?.trim() || "unknown";
  const stored = JSON.parse(localStorage.getItem("animeAtlasFavs") || "[]");
  if (stored.includes(title)) {
    button.textContent = "♥ Favourite";
    button.classList.add("is-favorite");
  }
  button.addEventListener("click", () => {
    const favs = JSON.parse(localStorage.getItem("animeAtlasFavs") || "[]");
    const idx = favs.indexOf(title);
    if (idx === -1) {
      favs.push(title);
      button.textContent = "♥ Favourite";
      button.classList.add("is-favorite");
    } else {
      favs.splice(idx, 1);
      button.textContent = "♡ Favourite";
      button.classList.remove("is-favorite");
    }
    localStorage.setItem("animeAtlasFavs", JSON.stringify(favs));
  });
};

document.querySelectorAll(".fav-toggle").forEach((button) => {
  const card = button.closest("[data-anime]");
  if (!card) {
    return;
  }
  const title = card.dataset.anime;
  const favorites = getFavorites();
  if (favorites.includes(title)) {
    button.textContent = "♥ Favorited";
    button.classList.add("is-favorite");
  }
  button.addEventListener("click", () => toggleFavorite(title, button));
});

renderFavorites();

document.querySelectorAll("[data-watchlist]").forEach((select) => {
  const card = select.closest("[data-anime]");
  if (!card) {
    return;
  }
  const title = card.dataset.anime;
  const watchlist = getWatchlist();
  if (watchlist[title]) {
    select.value = watchlist[title];
  }
  const updateBadge = (status) => {
    let badge = card.querySelector(".watchlist-badge");
    if (!status) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "watchlist-badge";
      card.prepend(badge);
    }
    badge.textContent = watchlistStatuses[status] || status;
  };
  updateBadge(watchlist[title]);
  select.addEventListener("change", (event) => {
    const updated = getWatchlist();
    const value = event.target.value;
    if (value) {
      updated[title] = value;
    } else {
      delete updated[title];
    }
    saveWatchlist(updated);
    updateBadge(value);
    renderWatchlist();
  });
});

renderWatchlist();

if (watchlistList) {
  watchlistList.addEventListener("click", (event) => {
    const button = event.target.closest(".watchlist-remove");
    if (!button) return;
    const title = button.dataset.title;
    if (!title) return;
    const updated = getWatchlist();
    delete updated[title];
    saveWatchlist(updated);
    renderWatchlist();
    document.querySelectorAll("[data-watchlist]").forEach((select) => {
      const card = select.closest("[data-anime]");
      if (card?.dataset.anime === title) {
        select.value = "";
        card.querySelector(".watchlist-badge")?.remove();
      }
    });
  });
}

if (watchlistClear) {
  watchlistClear.addEventListener("click", () => {
    saveWatchlist({});
    renderWatchlist();
    document.querySelectorAll("[data-watchlist]").forEach((select) => {
      select.value = "";
      select.closest("[data-anime]")?.querySelector(".watchlist-badge")?.remove();
    });
  });
}

const searchInput = document.getElementById("anime-search");
const animeGrid = document.getElementById("anime-grid");
const genreFilter = document.getElementById("genre-filter");

// Helper: get all genre text from a card (works before AND after applyCardMeta runs)
const getCardGenres = (card) => {
  const badges = card.querySelectorAll(".genre-badge");
  if (badges.length) {
    return [...badges].map((b) => b.textContent.trim().toLowerCase()).join(" ");
  }
  return (card.querySelector(".tag")?.textContent || "").toLowerCase();
};

// Populate genre dropdown from cards (call once at startup, re-call after posters load)
const populateGenreDropdown = () => {
  if (!genreFilter || !animeGrid) return;
  const tagSet = new Set();
  animeGrid.querySelectorAll("[data-anime]").forEach((card) => {
    const badges = card.querySelectorAll(".genre-badge");
    if (badges.length) {
      badges.forEach((b) => {
        const cleaned = b.textContent.trim();
        if (cleaned) tagSet.add(cleaned);
      });
    } else {
      const tagEl = card.querySelector(".tag");
      if (tagEl) {
        tagEl.textContent.split("•").forEach((t) => {
          const cleaned = t.trim();
          if (cleaned) tagSet.add(cleaned);
        });
      }
    }
  });
  const current = genreFilter.value;
  // Clear all options except "All genres"
  while (genreFilter.options.length > 1) genreFilter.remove(1);
  [...tagSet].sort().forEach((genre) => {
    const opt = document.createElement("option");
    opt.value = genre.toLowerCase();
    opt.textContent = genre;
    genreFilter.appendChild(opt);
  });
  // Restore previous selection if still valid
  if (current) genreFilter.value = current;
};

populateGenreDropdown();

// Re-populate dropdown once applyCardMeta has replaced .tag spans with .genre-badge spans
if (animeGrid) {
  const observer = new MutationObserver(() => {
    if (animeGrid.querySelector(".genre-badge")) {
      populateGenreDropdown();
      observer.disconnect();
    }
  });
  observer.observe(animeGrid, { childList: true, subtree: true });
}

const applySearchFilter = () => {
  if (!animeGrid) return;
  const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const genre = genreFilter ? genreFilter.value.toLowerCase() : "";
  animeGrid.querySelectorAll("[data-anime]").forEach((card) => {
    const title = card.dataset.anime.toLowerCase();
    const tags = getCardGenres(card);
    const matchTitle = title.includes(term);
    const matchGenre = !genre || tags.includes(genre);
    card.style.display = matchTitle && matchGenre ? "" : "none";
  });
};

if (searchInput) {
  searchInput.addEventListener("input", applySearchFilter);
}
if (genreFilter) {
  genreFilter.addEventListener("change", applySearchFilter);
}

const posterCacheKey = "animeAtlasPosterCache";
const posterCacheTtl = 1000 * 60 * 60 * 24 * 7;

// One-time bust: clear old cache entries that predate genre/score support
try {
  const _oldCache = JSON.parse(localStorage.getItem(posterCacheKey)) || {};
  const _hasMissingFields = Object.values(_oldCache).some(
    (entry) => entry && entry.url && entry.genres === undefined
  );
  if (_hasMissingFields) {
    localStorage.removeItem(posterCacheKey);
  }
} catch (_e) {
  localStorage.removeItem(posterCacheKey);
}

const getPosterCache = () => {
  try {
    return JSON.parse(localStorage.getItem(posterCacheKey)) || {};
  } catch (error) {
    return {};
  }
};

const savePosterCache = (cache) => {
  try {
    localStorage.setItem(posterCacheKey, JSON.stringify(cache));
  } catch (error) {
    return;
  }
};

const buildPosterKey = (search, type) => `${type || "ANIME"}:${search}`;

const setPosterCache = (search, type, url, title, extras = {}) => {
  if (!search || !url) {
    return;
  }
  const cache = getPosterCache();
  cache[buildPosterKey(search, type)] = {
    url,
    title,
    savedAt: Date.now(),
    genres: extras.genres || [],
    averageScore: extras.averageScore || null,
    popularity: extras.popularity || null,
  };
  savePosterCache(cache);
};

const getCachedPoster = (search, type) => {
  if (!search) {
    return null;
  }
  const cache = getPosterCache();
  return cache[buildPosterKey(search, type)] || null;
};

const loadPosterImages = async () => {
  const cards = document.querySelectorAll("[data-anilist-query]");
  if (cards.length === 0) {
    return;
  }

  const showPosterNotice = (message) => {
    if (document.querySelector(".poster-notice")) return;
    const notice = document.createElement("div");
    notice.className = "poster-notice";
    notice.textContent = message;
    const main = document.querySelector("main") || document.body;
    main.prepend(notice);
  };

  if (window.location.protocol === "file:") {
    showPosterNotice("Posters may not load on file://. Use a local server (Live Server) for AniList images.");
  }

  const cardsArray = Array.from(cards);
  const eagerCount = 6;

  const query = `
    query ($search: String, $type: MediaType) {
      Media(search: $search, type: $type) {
        coverImage {
          large
          extraLarge
        }
        title {
          english
          romaji
        }
        genres
        averageScore
        popularity
        status
        nextAiringEpisode {
          airingAt
          episode
        }
      }
    }
  `;

  const setImageSafely = (image, coverUrls, title, onFail) => {
    const placeholder = image.dataset.placeholder || image.src;
    image.dataset.placeholder = placeholder;
    image.loading = image.loading || "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";

    const urls = Array.isArray(coverUrls)
      ? coverUrls.filter(Boolean)
      : [coverUrls].filter(Boolean);

    if (urls.length === 0) {
      image.src = placeholder;
      image.alt = `${title} cover`;
      return;
    }

    let failed = false;
    const handleFail = () => {
      if (failed) return;
      failed = true;
      if (typeof onFail === "function") {
        onFail();
      }
    };

    const tryLoad = (index) => {
      const nextUrl = urls[index];
      if (!nextUrl) {
        image.src = placeholder;
        image.alt = `${title} cover`;
        handleFail();
        return;
      }
      image.onerror = () => {
        if (index + 1 >= urls.length) {
          image.src = placeholder;
          image.alt = `${title} cover`;
          handleFail();
          return;
        }
        tryLoad(index + 1);
      };
      image.onload = () => {
        image.dataset.loaded = "true";
        image.alt = `${title} cover`;
      };
      image.src = nextUrl;
    };

    tryLoad(0);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const posterStats = { attempts: 0, failures: 0, successes: 0 };
  const aniListEndpoints = [
    "https://graphql.anilist.co",
    "https://cors.isomorphic-git.org/https://graphql.anilist.co",
    "https://corsproxy.io/?https://graphql.anilist.co",
  ];
  let workingAniListEndpoint = null;

  const fetchJikanPoster = async (search, type = "ANIME") => {
    if (!search) return null;
    const isManga = type?.toUpperCase() === "MANGA";
    const endpoint = isManga ? "manga" : "anime";
    logToDiagnostics(`Trying Jikan fallback for "${search}" (${type})...`);
    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(search)}&limit=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) {
        logToDiagnostics(`Jikan request failed (${response.status}) for "${search}"`);
        return null;
      }
      const payload = await response.json();
      const item = payload?.data?.[0];
      const jpg = item?.images?.jpg;
      const coverUrl = jpg?.large_image_url || jpg?.image_url || jpg?.small_image_url || null;
      const title = item?.title || search;
      if (coverUrl) logToDiagnostics(`Jikan found cover for "${search}" (${type})`);
      return coverUrl
        ? {
            coverUrl,
            coverFallback: coverUrl,
            title,
            genres: Array.isArray(item?.genres) ? item.genres.map((g) => g.name).slice(0, 3) : [],
            averageScore: item?.score ? Math.round(item.score * 10) : null,
            popularity: item?.members || null,
          }
        : null;
    } catch (_error) {
      logToDiagnostics(`Jikan error for "${search}": ${_error.message}`);
      return null;
    }
  };

  const postAniList = async (body) => {
    const preferredOrder = window.location.protocol === "file:"
      ? [
          "https://cors.isomorphic-git.org/https://graphql.anilist.co",
          "https://corsproxy.io/?https://graphql.anilist.co",
          "https://graphql.anilist.co",
        ]
      : aniListEndpoints;

    const endpoints = workingAniListEndpoint
      ? [workingAniListEndpoint, ...preferredOrder.filter((url) => url !== workingAniListEndpoint)]
      : preferredOrder;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body,
        });
        if (!response.ok) {
          continue;
        }
        workingAniListEndpoint = endpoint;
        return response;
      } catch (error) {
        continue;
      }
    }
    return null;
  };

  const fetchPoster = async (search, type, attempt = 0) => {
    try {
      posterStats.attempts += 1;
      const response = await postAniList(
        JSON.stringify({
          query,
          variables: { search, type },
        })
      );

      if (!response) {
        posterStats.failures += 1;
        const fallback = await fetchJikanPoster(search, type);
        return fallback;
      }

      if (response.status === 429 && attempt < 2) {
        await sleep(400 * (attempt + 1));
        return fetchPoster(search, type, attempt + 1);
      }

      if (!response.ok) {
        posterStats.failures += 1;
        const fallback = await fetchJikanPoster(search, type);
        return fallback;
      }

      const payload = await response.json();
      const media = payload?.data?.Media;

      if (!media) {
        // AniList didn't find it, try Jikan next
        const fallback = await fetchJikanPoster(search, type);
        return fallback;
      }

      const coverUrl = media?.coverImage?.extraLarge || media?.coverImage?.large;
      const coverFallback = media?.coverImage?.large || media?.coverImage?.extraLarge;
      const title = media?.title?.english || media?.title?.romaji || search;
      const genres = Array.isArray(media?.genres) ? media.genres.slice(0, 3) : [];
      const averageScore = media?.averageScore || null;
      const popularity = media?.popularity || null;
      const status = media?.status || null;
      const nextAiringEpisode = media?.nextAiringEpisode || null;

      return {
        coverUrl,
        coverFallback,
        title,
        genres,
        averageScore,
        popularity,
        status,
        nextAiringEpisode,
      };
    } catch (error) {
      posterStats.failures += 1;
      if (attempt < 2) {
        await sleep(300 * (attempt + 1));
        return fetchPoster(search, type, attempt + 1);
      }
      const fallback = await fetchJikanPoster(search, type);
      return fallback;
    }
  };

  const runWithConcurrency = async (items, limit, worker) => {
    let index = 0;
    const workers = Array.from({ length: limit }, async () => {
      while (index < items.length) {
        const currentIndex = index;
        index += 1;
        await worker(items[currentIndex], currentIndex);
      }
    });
    await Promise.all(workers);
  };

  const applyCardMeta = (card, result) => {
    // ── Detail-page currently-airing banner ─────────────────
    const existingBanner = card.querySelector(".airing-banner");
    if (existingBanner) existingBanner.remove();

    const isDetailPage = !!card.querySelector(".detail-cover");
    if (isDetailPage && result?.status === "RELEASING" && result?.nextAiringEpisode?.airingAt) {
      const { airingAt, episode } = result.nextAiringEpisode;

      const formatBannerCountdown = (ts) => {
        const diffMs = ts * 1000 - Date.now();
        if (diffMs <= 0) return `Episode ${episode} is out now!`;
        const d = Math.floor(diffMs / 86400000);
        const h = Math.floor((diffMs % 86400000) / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        if (d > 0) return `Episode ${episode} airs in ${d}d ${h}h`;
        if (h > 0) return `Episode ${episode} airs in ${h}h ${m}m`;
        return `Episode ${episode} airs in ${m}m`;
      };

      const banner = document.createElement("div");
      banner.className = "airing-banner";
      banner.innerHTML = `
        <span class="airing-dot"></span>
        <span class="airing-banner-label">Currently Airing</span>
        <span class="airing-banner-sep">·</span>
        <span class="airing-banner-ep">${formatBannerCountdown(airingAt)}</span>
      `;

      const lead = card.querySelector(".hero-text .lead");
      if (lead) {
        lead.insertAdjacentElement("afterend", banner);
      } else {
        const heroText = card.querySelector(".hero-text");
        if (heroText) heroText.appendChild(banner);
      }

      // Live-update the banner countdown
      const bannerEpEl = banner.querySelector(".airing-banner-ep");
      const bannerInterval = setInterval(() => {
        if (!document.contains(banner)) { clearInterval(bannerInterval); return; }
        bannerEpEl.textContent = formatBannerCountdown(airingAt);
        if (airingAt * 1000 <= Date.now()) clearInterval(bannerInterval);
      }, 30000);
    }

    // ── Airing countdown badge ───────────────────────────────
    const existingAiring = card.querySelector(".airing-badge");
    if (existingAiring) existingAiring.remove();

    if (result?.status === "RELEASING" && result?.nextAiringEpisode?.airingAt && !isDetailPage) {
      const { airingAt, episode } = result.nextAiringEpisode;
      const badge = document.createElement("div");
      badge.className = "airing-badge";
      badge.dataset.airingAt = airingAt;
      badge.dataset.episode = episode;

      const formatCountdown = (airingAt) => {
        const diffMs = airingAt * 1000 - Date.now();
        if (diffMs <= 0) return `Ep ${episode} is out now!`;
        const d = Math.floor(diffMs / 86400000);
        const h = Math.floor((diffMs % 86400000) / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        if (d > 0) return `Ep ${episode} in ${d}d ${h}h`;
        if (h > 0) return `Ep ${episode} in ${h}h ${m}m`;
        return `Ep ${episode} in ${m}m`;
      };

      badge.innerHTML = `<span class="airing-dot"></span><span class="airing-text">${formatCountdown(airingAt)}</span>`;

      // Wrap cover in .card-media if not already, then place badge inside
      const cover = card.querySelector(".card-cover");
      let mediaWrap = card.querySelector(".card-media");
      if (!mediaWrap && cover) {
        mediaWrap = document.createElement("div");
        mediaWrap.className = "card-media";
        cover.insertAdjacentElement("beforebegin", mediaWrap);
        mediaWrap.appendChild(cover);
      }
      if (mediaWrap) {
        mediaWrap.appendChild(badge);
      } else {
        card.prepend(badge);
      }

      // Register for the global ticker
      if (!window._airingCards) window._airingCards = new Set();
      window._airingCards.add({ badge, airingAt, episode, formatCountdown });
    }

    // ── Genre badges ────────────────────────────────────────
    // Remove any existing badge row so we always re-render with fresh data
    const existingBadgeRow = card.querySelector(".genre-badges");
    if (existingBadgeRow) existingBadgeRow.remove();

    if (result?.genres?.length) {
      const badgeRow = document.createElement("div");
      badgeRow.className = "genre-badges";
      result.genres.slice(0, 3).forEach((g) => {
        const genre = String(g).trim();
        const badge = document.createElement("span");
        badge.className = "genre-badge";
        badge.setAttribute("data-genre", genre);
        badge.textContent = genre;
        badgeRow.appendChild(badge);
      });

      const heroBadge = card.querySelector(".hero-text .badge");
      const tagEl = card.querySelector(".tag");

      if (heroBadge) {
        // For detail pages, replace the static badge element with the dynamic row
        heroBadge.replaceWith(badgeRow);
        badgeRow.classList.add("detail-genre-badges");
      } else if (tagEl) {
        // Replace the .tag element entirely so we avoid its pink color inheritance
        tagEl.replaceWith(badgeRow);
      } else {
        card.appendChild(badgeRow);
      }
    }
    // ── Score + popularity pills ─────────────────────────────
    if ((result?.averageScore || result?.popularity) && !card.querySelector(".card-meta-row")) {
      const metaRow = document.createElement("div");
      metaRow.className = "card-meta-row";
      if (result.averageScore) {
        const score = result.averageScore;
        const scoreEl = document.createElement("span");
        const tierClass = score >= 80 ? "high" : score >= 60 ? "mid" : "low";
        scoreEl.className = `score-pill ${tierClass}`;
        scoreEl.textContent = `★ ${(score / 10).toFixed(1)}`;
        metaRow.appendChild(scoreEl);
      }
      if (result.popularity) {
        const popEl = document.createElement("span");
        popEl.className = "popularity-pill";
        const formatted =
          result.popularity >= 1000000
            ? `${(result.popularity / 1000000).toFixed(1)}M`
            : result.popularity >= 1000
            ? `${Math.round(result.popularity / 1000)}K`
            : `${result.popularity}`;
        popEl.textContent = `♥ ${formatted}`;
        metaRow.appendChild(popEl);
      }

      const container = card.querySelector(".genre-badges") || card.querySelector(".tag");
      if (container) {
        container.insertAdjacentElement("afterend", metaRow);
      } else {
        card.appendChild(metaRow);
      }
    }
  };

  const processCard = async (card, index) => {
    const search = card.dataset.anilistQuery;
    const type = card.dataset.anilistType || "ANIME";
    const image = card.querySelector(".card-cover, .detail-cover, .rank-cover");
    if (!search || !image) {
      return;
    }

    if (index < eagerCount) {
      image.loading = "eager";
      image.fetchPriority = "high";
    }

    const cachedPoster = getCachedPoster(search, type);
    const forceRefresh = async () => {
      if (image.dataset.forceRefresh === "true") return;
      image.dataset.forceRefresh = "true";
      const result = await fetchPoster(search, type);
      if (result?.coverUrl || result?.coverFallback) {
        const primary = result.coverUrl || result.coverFallback;
        setImageSafely(image, [result.coverUrl, result.coverFallback], result.title);
        setPosterCache(search, type, primary, result.title, {
          genres: result.genres,
          averageScore: result.averageScore,
          popularity: result.popularity,
        });
      }
      if (result) {
        applyCardMeta(card, result);
      }
    };

    if (cachedPoster?.url) {
      setImageSafely(image, cachedPoster.url, cachedPoster.title || search, forceRefresh);
    }

    // If cache has genre data already, inject it immediately
    if (cachedPoster?.genres?.length) {
      applyCardMeta(card, {
        genres: cachedPoster.genres,
        averageScore: cachedPoster.averageScore,
        popularity: cachedPoster.popularity,
      });
    }

    // Re-fetch if stale OR if genres/score are missing from old cache entries
    const isFresh =
      cachedPoster?.savedAt &&
      Date.now() - cachedPoster.savedAt < posterCacheTtl &&
      cachedPoster.genres !== undefined;
    if (isFresh) {
      return;
    }

    const result = await fetchPoster(search, type);
    if (result?.coverUrl || result?.coverFallback) {
      const primary = result.coverUrl || result.coverFallback;
      setImageSafely(image, [result.coverUrl, result.coverFallback], result.title);
      setPosterCache(search, type, primary, result.title, {
        genres: result.genres,
        averageScore: result.averageScore,
        popularity: result.popularity,
      });
    }
    if (result) {
      applyCardMeta(card, result);
    }
  };

  await runWithConcurrency(cardsArray, 6, processCard);

  if (posterStats.attempts > 0 && posterStats.failures >= posterStats.attempts) {
    showPosterNotice("Posters failed to load. Try Live Server or check your network/CORS settings.");
  }
};

loadPosterImages();

// ── Immediately convert every static .tag pill into colour-coded genre badges ──
// Runs synchronously so colours appear instantly, with no API or cache dependency.
(function upgradeStaticTags() {
  document.querySelectorAll(".tag").forEach((tagEl) => {
    // Split on " • ", commas, or slashes then trim each piece
    const genres = tagEl.textContent.split(/\s*[•,\/]\s*/).map((s) => s.trim()).filter(Boolean);
    if (!genres.length) return;

    const badgeRow = document.createElement("div");
    badgeRow.className = "genre-badges";
    genres.forEach((genre) => {
      const badge = document.createElement("span");
      badge.className = "genre-badge";
      badge.setAttribute("data-genre", genre);
      badge.textContent = genre;
      badgeRow.appendChild(badge);
    });
    tagEl.replaceWith(badgeRow);
  });
})();



const getEpisodeProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(episodeProgressKey)) || {};
  } catch (error) {
    return {};
  }
};

const saveEpisodeProgress = (progress) => {
  try {
    localStorage.setItem(episodeProgressKey, JSON.stringify(progress));
  } catch (error) {
    return;
  }
};

const getTrackerState = (title) => {
  const progress = getEpisodeProgress();
  return progress[title] || { current: 0, total: null, status: null };
};

const setTrackerState = (title, nextState) => {
  const progress = getEpisodeProgress();
  progress[title] = nextState;
  saveEpisodeProgress(progress);
};

const formatTrackerStatus = (current, total, status) => {
  if (total) {
    return `Episode ${current} of ${total}`;
  }
  if (status === "RELEASING") {
    return `Episode ${current} (ongoing total TBA)`;
  }
  return `Episode ${current}`;
};

const renderEpisodeTracker = (tracker, state, title) => {
  const statusEl = tracker.querySelector("[data-status]");
  const bar = tracker.querySelector("[data-bar]");
  const current = Math.max(0, state.current || 0);
  const total = state.total || null;
  const effectiveTotal = total || Math.max(1, current);

  if (statusEl) {
    statusEl.textContent = formatTrackerStatus(current, total, state.status);
  }
  if (bar) {
    const percent = Math.min(100, (current / effectiveTotal) * 100);
    bar.style.width = `${percent}%`;
  }
  tracker.dataset.current = `${current}`;
  tracker.dataset.total = total ? `${total}` : "";
  tracker.dataset.status = state.status || "";
  tracker.dataset.title = title;
};

const updateTrackerProgress = (tracker, title, delta) => {
  const state = getTrackerState(title);
  let current = Math.max(0, state.current || 0);
  current += delta;
  if (current < 0) {
    current = 0;
  }
  if (state.total) {
    current = Math.min(current, state.total);
  }
  const nextState = { ...state, current };
  setTrackerState(title, nextState);
  renderEpisodeTracker(tracker, nextState, title);
};

const trackerCountdownTimers = new WeakMap();

const setTrackerCountdown = (tracker, nextAiringEpisode) => {
  const nextEl = tracker.querySelector("[data-next-episode]");
  const countdownEl = tracker.querySelector("[data-countdown]");
  if (!nextEl && !countdownEl) {
    return;
  }
  const nextEpisode = nextAiringEpisode?.episode;
  const airingAt = nextAiringEpisode?.airingAt;
  if (nextEl) {
    nextEl.textContent = nextEpisode
      ? `Next episode: ${nextEpisode}`
      : "Next episode: Not currently scheduled";
  }
  if (!countdownEl) {
    return;
  }
  const existing = trackerCountdownTimers.get(tracker);
  if (existing) {
    clearInterval(existing);
    trackerCountdownTimers.delete(tracker);
  }
  if (!airingAt) {
    countdownEl.textContent = "";
    return;
  }
  const tick = () => {
    const diffMs = airingAt * 1000 - Date.now();
    if (diffMs <= 0) {
      countdownEl.textContent = "Episode is out now!";
      return;
    }
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    countdownEl.textContent = `Airs in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  };
  tick();
  const timerId = setInterval(tick, 1000);
  trackerCountdownTimers.set(tracker, timerId);
};

const initInlineTrackers = () => {
  const grid = document.getElementById("anime-grid");
  if (!grid) {
    return;
  }
  grid.querySelectorAll("[data-anime]").forEach((card) => {
    if (card.querySelector(".tracker-inline")) {
      return;
    }
    const title = card.dataset.anime;
    if (!title) {
      return;
    }
    const tracker = document.createElement("div");
    tracker.className = "episode-tracker tracker-card tracker-inline";
    tracker.dataset.anime = title;
    if (card.dataset.anilistQuery) {
      tracker.dataset.anilistQuery = card.dataset.anilistQuery;
    }
    tracker.innerHTML = `
      <p class="tracker-status" data-status>Episode 0</p>
      <div class="progress">
        <div class="progress-bar" data-bar style="width: 0%;"></div>
      </div>
      <p class="next-episode" data-next-episode>Next episode: --</p>
      <p class="countdown" data-countdown></p>
      <div class="tracker-actions">
        <button type="button" class="ghost" data-action="decrease">-1</button>
        <button type="button" class="primary" data-action="increase">+1</button>
      </div>
    `;
    const insertBefore = card.querySelector(".watchlist-field") || card.querySelector(".fav-toggle");
    if (insertBefore) {
      card.insertBefore(tracker, insertBefore);
    } else {
      card.appendChild(tracker);
    }
  });
};

const resetTrackerProgress = (tracker, title) => {
  const state = getTrackerState(title);
  const nextState = { ...state, current: 0 };
  setTrackerState(title, nextState);
  renderEpisodeTracker(tracker, nextState, title);
};

const loadEpisodeTrackers = async () => {
  const trackers = document.querySelectorAll(".episode-tracker");
  if (trackers.length === 0) {
    return;
  }

  const episodeTotalOverrides = {
    // ── Big-three / long-runners ─────────────────────────────────────────
    "Naruto": 720,          // Naruto (220) + Shippuden (500)
    "One Piece": 1122,      // through ~2025
    "Bleach": 366,          // all arcs including TYBW
    "Dragon Ball Z": 291,
    "Gintama": 367,
    "Boruto": 293,          // Naruto Next Generations (complete TV run)
    "Fairy Tail": 328,      // 2009 (175) + 2014 (102) + Final (51)
    "Black Clover": 170,
    // ── Flagship shonen ─────────────────────────────────────────────────
    "Attack on Titan": 94,
    "My Hero Academia": 181,
    "Hunter x Hunter": 148,
    "Demon Slayer": 63,     // S1–Hashira Training arc
    "Jujutsu Kaisen": 53,
    "Haikyu!!": 85,
    "Fullmetal Alchemist: Brotherhood": 64,
    "JoJo's Bizarre Adventure": 190,
    "Blue Lock": 37,        // S1 (24) + S2 (13)
    "Chainsaw Man": 12,
    "Dandadan": 12,
    "Spy x Family": 37,     // S1 Part 1 (12) + Part 2 (13) + S2 (12)
    // ── Long ongoing ────────────────────────────────────────────────────
    "Kingdom": 146,         // S1 (38) + S2 (39) + S3 (26) + S4 (26) + S5 (17)
    "World Trigger": 99,    // S1 (73) + S2 (12) + S3 (14)
    "Baki": 52,             // Netflix: Baki 2018 (26) + Hanma S1 (13) + S2 (13)
    // ── Completed multi-season ──────────────────────────────────────────
    "Sword Art Online": 96,
    "Re:Zero": 50,
    "Steins;Gate": 24,
    "Vinland Saga": 48,
    "Fire Force": 48,
    "Tokyo Revengers": 50,  // S1 (24) + S2 (13) + S3 (13)
    "Bungo Stray Dogs": 60, // S1–S5
    "Rent-a-Girlfriend": 36,// S1–S3 (12 each)
    "Fruits Basket": 63,    // 2019 reboot: S1 (25) + S2 (25) + The Final (13)
    "Soul Eater": 51,
    "KonoSuba": 32,         // S1 (10) + S2 (10) + S3 (12)
    "That Time I Got Reincarnated as a Slime": 72, // S1–S3
    "The Rising of the Shield Hero": 50, // S1 (25) + S2 (13) + S3 (12)
    "Assassination Classroom": 47, // S1 (22) + S2 (25)
    "Mushoku Tensei": 46,   // S1 (23) + S2 (23)
    "Blue Exorcist": 50,    // S1 (25) + Kyoto Saga (12) + Shimane (13)
    "High School DxD": 49,  // S1–S4
    "Tokyo Ghoul": 48,      // S1 (12) + Root A (12) + :re (24)
    "Seven Deadly Sins": 96,// S1 (24) + S2 (24) + S3 (24) + S4 (24)
    "Chihayafuru": 72,      // S1 (25) + S2 (25) + S3 (22)
    "Beastars": 24,         // S1 (12) + S2 (12)
    "Food Wars": 86,        // S1 (24) + S2 (13) + S3 (24) + S4 (12) + S5 (13)
    "Hajime no Ippo": 127,  // S1 (76) + S2 (26) + S3 (25)
    "Kuroko's Basketball": 75, // S1–S3 (25 each)
    "Classroom of the Elite": 39, // S1 (13) + S2 (13) + S3 (13)
    "Dr. Stone": 57,        // S1 (24) + S2 (11) + S3 (22)
    "Mob Psycho 100": 37,   // S1 (12) + S2 (13) + S3 (12)
    "Code Geass": 50,       // S1 (25) + S2 (25)
    "86 Eighty Six": 23,    // S1 (11) + S2 (12)
    "Oshi no Ko": 24,       // S1 (11) + S2 (13)
    "Tokyo Ghoul": 48,
    "Spirit Chronicles": 26,// S1 (13) + S2 (13)
    // ── Currently airing / recent short series ──────────────────────────
    "Blue Box": 25,
    "Solo Leveling": 24,
    "Sakamoto Days": 25,
    "Mashle: Magic and Muscles": 25,
    "Horimiya": 26,         // original (13) + Piece (13)
    "Frieren: Beyond Journey's End": 38,
    "Hell's Paradise": 13,
    "Kaiju No. 8": 12,      // S1 (S2 ongoing)
    "Gachiakuta": 12,
    "Delicious in Dungeon": 24,
    "The Apothecary Diaries": 24,
    // ── Single-season complete ───────────────────────────────────────────
    "Neon Genesis Evangelion": 26,
    "Cowboy Bebop": 26,
    "Paranoia Agent": 13,
    "Erased": 12,
    "Death Note": 37,
    "Monster": 74,
    "Violet Evergarden": 13,
    "Rascal Does Not Dream of Bunny Girl Senpai": 13,
    "My Dress-Up Darling": 12,
    "The Promised Neverland": 23, // S1 (12) + S2 (11)
    "Cyberpunk: Edgerunners": 10,
    "Ranking of Kings": 23,
    "Chained Soldier": 12,
    "Tougen Anki": 13,
    "Darwin's Game": 11,
    "Alya Sometimes Hides Her Feelings in Russian": 12,
    "Toilet-bound Hanako-kun": 12,
    "Zom 100": 12,
    "Berserk": 25,          // 1997 classic series
    "One Punch Man": 24,    // S1 (12) + S2 (12)
    "Slam Dunk": 101,
    "Ao Ashi": 24,
    "Captain Tsubasa": 52,  // 2018 revival
    "The Fragrant Flower": 13,
  };

  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        episodes
        format
        status
        nextAiringEpisode {
          episode
          airingAt
        }
        title {
          english
          romaji
        }
        relations {
          edges {
            relationType
            node {
              id
              type
              format
              episodes
              status
              nextAiringEpisode {
                episode
                airingAt
              }
            }
          }
        }
      }
    }
  `;

  const getEpisodeCount = (entry) => {
    if (!entry) {
      return null;
    }
    if (typeof entry.episodes === "number") {
      return entry.episodes;
    }
    if (entry.nextAiringEpisode?.episode) {
      return Math.max(0, entry.nextAiringEpisode.episode - 1);
    }
    return null;
  };

  const getAggregateEpisodes = (media) => {
    const allowedFormats = new Set(["TV", "TV_SHORT", "ONA", "OVA"]);
    let total = 0;
    let hasValue = false;
    const baseCount = getEpisodeCount(media);
    if (typeof baseCount === "number" && baseCount > 0) {
      total += baseCount;
      hasValue = true;
    }
    const edges = media?.relations?.edges || [];
    edges.forEach((edge) => {
      const relation = edge.relationType;
      const node = edge.node;
      if (!node || node.type !== "ANIME") {
        return;
      }
      if (!allowedFormats.has(node.format)) {
        return;
      }
      if (relation !== "PREQUEL" && relation !== "SEQUEL") {
        return;
      }
      const count = getEpisodeCount(node);
      if (typeof count === "number" && count > 0) {
        total += count;
        hasValue = true;
      }
    });
    return hasValue ? total : null;
  };

  const getNextAiringEpisode = (media) => {
    if (!media) {
      return null;
    }
    const candidates = [];
    const pushCandidate = (entry) => {
      if (!entry?.nextAiringEpisode) {
        return;
      }
      const airingAt = entry.nextAiringEpisode.airingAt || null;
      candidates.push({
        airingAt: airingAt ?? Number.POSITIVE_INFINITY,
        entry,
      });
    };
    pushCandidate(media);
    (media.relations?.edges || []).forEach((edge) => {
      const node = edge?.node;
      if (!node || node.type !== "ANIME") {
        return;
      }
      if (edge.relationType !== "SEQUEL" && edge.relationType !== "PREQUEL") {
        return;
      }
      pushCandidate(node);
    });
    if (candidates.length === 0) {
      return null;
    }
    candidates.sort((a, b) => a.airingAt - b.airingAt);
    return candidates[0].entry.nextAiringEpisode || null;
  };

  const getReleasingRelation = (media) => {
    if (!media?.relations?.edges) {
      return null;
    }
    return (
      media.relations.edges
        .map((edge) => edge?.node)
        .find((node) => node?.type === "ANIME" && node?.status === "RELEASING") ||
      null
    );
  };

  const fetchNextAiringById = async (id) => {
    if (!id) {
      return null;
    }
    const detailQuery = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          nextAiringEpisode {
            episode
            airingAt
          }
        }
      }
    `;
    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: detailQuery,
          variables: { id },
        }),
      });
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.data?.Media?.nextAiringEpisode || null;
    } catch (error) {
      return null;
    }
  };

  for (const tracker of trackers) {
    const title = tracker.dataset.anime || tracker.dataset.title;
    if (!title) {
      continue;
    }

    const trackerActions = tracker.querySelector(".tracker-actions");
    if (!tracker.querySelector("[data-next-episode]")) {
      const nextEpisodeEl = document.createElement("p");
      nextEpisodeEl.className = "next-episode";
      nextEpisodeEl.dataset.nextEpisode = "";
      nextEpisodeEl.textContent = "Next episode: --";
      if (trackerActions) {
        tracker.insertBefore(nextEpisodeEl, trackerActions);
      } else {
        tracker.appendChild(nextEpisodeEl);
      }
    }
    if (!tracker.querySelector("[data-countdown]")) {
      const countdownEl = document.createElement("p");
      countdownEl.className = "countdown";
      countdownEl.dataset.countdown = "";
      if (trackerActions) {
        tracker.insertBefore(countdownEl, trackerActions);
      } else {
        tracker.appendChild(countdownEl);
      }
    }

    if (!tracker.dataset.bound) {
      tracker.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.dataset.action;
          if (action === "increase") {
            updateTrackerProgress(tracker, title, 1);
          } else if (action === "decrease") {
            updateTrackerProgress(tracker, title, -1);
          } else if (action === "reset") {
            resetTrackerProgress(tracker, title);
          }
        });
      });
      tracker.dataset.bound = "true";
    }

    const state = getTrackerState(title);
    const overrideTotal = episodeTotalOverrides[title] || null;
    if (overrideTotal && state.total !== overrideTotal) {
      const nextState = { ...state, total: overrideTotal };
      setTrackerState(title, nextState);
      renderEpisodeTracker(tracker, nextState, title);
      continue;
    }
    renderEpisodeTracker(tracker, state, title);

    const hasCountdown = tracker.querySelector("[data-countdown]") || tracker.querySelector("[data-next-episode]");
    if (state.total && !hasCountdown) {
      continue;
    }

    const search =
      tracker.dataset.anilistQuery || document.body.dataset.anilistQuery || title;

    try {
      const response = await fetch("https://graphql.anilist.co", {
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
        continue;
      }

      const payload = await response.json();
      const media = payload?.data?.Media;
      if (!media) {
        continue;
      }

      const status = media.status || null;
      const current = state.current || 0;
      const overrideTotal = episodeTotalOverrides[title] || null;
      const aggregateTotal = getAggregateEpisodes(media);
      const reportedTotal = media.episodes || null;
      const airingTotal = media.nextAiringEpisode?.episode
        ? Math.max(0, media.nextAiringEpisode.episode - 1)
        : null;
      const nextTotal = overrideTotal || aggregateTotal || reportedTotal || airingTotal || null;
      const clampedCurrent = nextTotal ? Math.min(current, nextTotal) : current;
      const nextState = {
        ...state,
        current: clampedCurrent,
        total: nextTotal,
        status,
      };
      setTrackerState(title, nextState);
      renderEpisodeTracker(tracker, nextState, title);
      let nextAiringEpisode = getNextAiringEpisode(media) || media.nextAiringEpisode;
      if (!nextAiringEpisode) {
        const releasingRelation = getReleasingRelation(media);
        if (releasingRelation?.id) {
          nextAiringEpisode = await fetchNextAiringById(releasingRelation.id);
        }
      }
      setTrackerCountdown(tracker, nextAiringEpisode);
    } catch (error) {
      continue;
    }
  }
};

initInlineTrackers();
loadEpisodeTrackers();

const initTrailerLinks = () => {
  document.querySelectorAll(".card[data-anime], .card[data-anilist-query]").forEach((card) => {
    const title = card.dataset.anime || card.dataset.anilistQuery;
    if (!title) {
      return;
    }
    const existingLinks = Array.from(card.querySelectorAll(".trailer-link"));
    const trailer = existingLinks.shift() || document.createElement("a");
    existingLinks.forEach((link) => link.remove());
    trailer.className = "trailer-link";
    trailer.target = "_blank";
    trailer.rel = "noopener noreferrer";
    trailer.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${title} official trailer`
    )}`;
    trailer.innerHTML = "▶ Watch Trailer";
    const cover = card.querySelector(".card-cover");
    if (cover) {
      // Trailer button is injected inside .card-preview by buildCardPreviews — skip overlay placement
      return;
    } else {
      const insertBefore = card.querySelector(".watchlist-field") || card.querySelector(".fav-toggle");
      if (insertBefore) {
        card.insertBefore(trailer, insertBefore);
      } else {
        card.appendChild(trailer);
      }
    }
  });
};

initTrailerLinks();

// ── Global airing countdown ticker ──────────────────────────
(function startAiringTicker() {
  const tick = () => {
    if (!window._airingCards) return;
    window._airingCards.forEach((entry) => {
      const textEl = entry.badge.querySelector(".airing-text");
      if (textEl) textEl.textContent = entry.formatCountdown(entry.airingAt);
    });
  };
  // Tick once per minute (badges show d/h/m precision)
  setInterval(tick, 60000);
})();

const reviewsKey = "animeAtlasReviews";

const getReviews = () => {
  try {
    return JSON.parse(localStorage.getItem(reviewsKey)) || {};
  } catch (error) {
    return {};
  }
};

const saveReviews = (reviews) => {
  try {
    localStorage.setItem(reviewsKey, JSON.stringify(reviews));
  } catch (error) {
    return;
  }
};

const getAnimeReviews = (title) => {
  const reviews = getReviews();
  return reviews[title] || [];
};

const addAnimeReview = (title, entry) => {
  const reviews = getReviews();
  const list = reviews[title] || [];
  reviews[title] = [entry, ...list].slice(0, 12);
  saveReviews(reviews);
};

const formatStars = (rating) => {
  const full = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return `${full}${empty}`;
};

const renderReviewsSummary = (summaryEl, entries) => {
  if (!summaryEl) {
    return;
  }
  if (entries.length === 0) {
    summaryEl.textContent = "No ratings yet. Be the first to review.";
    return;
  }
  const total = entries.reduce((sum, item) => sum + item.rating, 0);
  const average = (total / entries.length).toFixed(1);
  summaryEl.textContent = `${average} / 5 • ${entries.length} review(s)`;
};

const renderReviewsList = (listEl, entries) => {
  if (!listEl) {
    return;
  }
  listEl.innerHTML = "";
  if (entries.length === 0) {
    return;
  }
  entries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "review-card";
    item.innerHTML = `
      <div class="review-header">
        <strong>${entry.name}</strong>
        <span class="review-stars">${formatStars(entry.rating)}</span>
      </div>
      <p>${entry.text}</p>
    `;
    listEl.appendChild(item);
  });
};

const bindReviewForm = (section) => {
  const form = section.querySelector("[data-review-form]");
  const summaryEl = section.querySelector("[data-summary]");
  const listEl = section.querySelector("[data-reviews]");
  const title = section.dataset.anime;
  if (!form || !summaryEl || !listEl || !title) {
    return;
  }

  const render = () => {
    const entries = getAnimeReviews(title);
    renderReviewsSummary(summaryEl, entries);
    renderReviewsList(listEl, entries);
  };

  render();

  if (form.dataset.bound) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = `${formData.get("reviewer") || ""}`.trim();
    const rating = Number(formData.get("rating"));
    const text = `${formData.get("review") || ""}`.trim();

    if (!name || !rating || !text) {
      return;
    }

    addAnimeReview(title, {
      name,
      rating: Math.min(5, Math.max(1, rating)),
      text,
      createdAt: Date.now(),
    });
    form.reset();
    render();
  });

  form.dataset.bound = "true";
};

document.querySelectorAll(".reviews-section").forEach((section) => {
  bindReviewForm(section);
});

const characterFallbacks = {
  "Naruto": [
    { name: "Naruto Uzumaki", role: "MAIN" },
    { name: "Sasuke Uchiha", role: "MAIN" },
    { name: "Sakura Haruno", role: "MAIN" },
  ],
  "One Piece": [
    { name: "Monkey D. Luffy", role: "MAIN" },
    { name: "Roronoa Zoro", role: "MAIN" },
    { name: "Nami", role: "MAIN" },
  ],
  "Attack on Titan": [
    { name: "Eren Yeager", role: "MAIN" },
    { name: "Mikasa Ackerman", role: "MAIN" },
    { name: "Armin Arlert", role: "MAIN" },
  ],
  "My Hero Academia": [
    { name: "Izuku Midoriya", role: "MAIN" },
    { name: "Katsuki Bakugo", role: "MAIN" },
    { name: "Ochaco Uraraka", role: "MAIN" },
  ],
  "Dragon Ball Z": [
    { name: "Goku", role: "MAIN" },
    { name: "Vegeta", role: "MAIN" },
    { name: "Gohan", role: "MAIN" },
  ],
  "Demon Slayer": [
    { name: "Tanjiro Kamado", role: "MAIN" },
    { name: "Nezuko Kamado", role: "MAIN" },
    { name: "Zenitsu Agatsuma", role: "SUPPORTING" },
  ],
  "One Punch Man": [
    { name: "Saitama", role: "MAIN" },
    { name: "Genos", role: "SUPPORTING" },
    { name: "Tatsumaki", role: "SUPPORTING" },
  ],
  "Spy x Family": [
    { name: "Loid Forger", role: "MAIN" },
    { name: "Anya Forger", role: "MAIN" },
    { name: "Yor Forger", role: "MAIN" },
  ],
  "Chainsaw Man": [
    { name: "Denji", role: "MAIN" },
    { name: "Power", role: "MAIN" },
    { name: "Aki Hayakawa", role: "MAIN" },
  ],
  "Jujutsu Kaisen": [
    { name: "Yuji Itadori", role: "MAIN" },
    { name: "Megumi Fushiguro", role: "MAIN" },
    { name: "Nobara Kugisaki", role: "MAIN" },
  ],
  "Black Clover": [
    { name: "Asta", role: "MAIN" },
    { name: "Yuno", role: "MAIN" },
    { name: "Noelle Silva", role: "MAIN" },
  ],
  "Haikyu!!": [
    { name: "Shoyo Hinata", role: "MAIN" },
    { name: "Tobio Kageyama", role: "MAIN" },
    { name: "Daichi Sawamura", role: "SUPPORTING" },
  ],
  "JoJo's Bizarre Adventure": [
    { name: "Jotaro Kujo", role: "MAIN" },
    { name: "Joseph Joestar", role: "MAIN" },
    { name: "Dio Brando", role: "MAIN" },
  ],
  "Horimiya": [
    { name: "Kyoko Hori", role: "MAIN" },
    { name: "Izumi Miyamura", role: "MAIN" },
    { name: "Souta Hori", role: "SUPPORTING" },
  ],
  "Blue Box": [
    { name: "Taiki Inomata", role: "MAIN" },
    { name: "Chinatsu Kano", role: "MAIN" },
    { name: "Hina Chono", role: "SUPPORTING" },
  ],
  "Solo Leveling": [
    { name: "Sung Jinwoo", role: "MAIN" },
    { name: "Cha Hae-In", role: "SUPPORTING" },
    { name: "Yoo Jinho", role: "SUPPORTING" },
  ],
  "Death Note": [
    { name: "Light Yagami", role: "MAIN" },
    { name: "L", role: "MAIN" },
    { name: "Misa Amane", role: "SUPPORTING" },
  ],
  "Hunter x Hunter": [
    { name: "Gon Freecss", role: "MAIN" },
    { name: "Killua Zoldyck", role: "MAIN" },
    { name: "Kurapika", role: "MAIN" },
  ],
  "Bleach": [
    { name: "Ichigo Kurosaki", role: "MAIN" },
    { name: "Rukia Kuchiki", role: "MAIN" },
    { name: "Uryu Ishida", role: "SUPPORTING" },
  ],
  "Frieren: Beyond Journey's End": [
    { name: "Frieren", role: "MAIN" },
    { name: "Fern", role: "MAIN" },
    { name: "Stark", role: "MAIN" },
  ],
  "Hell's Paradise": [
    { name: "Gabimaru", role: "MAIN" },
    { name: "Sagiri Yamada Asaemon", role: "MAIN" },
    { name: "Yuzuriha", role: "SUPPORTING" },
  ],
  "Fire Force": [
    { name: "Shinra Kusakabe", role: "MAIN" },
    { name: "Arthur Boyle", role: "MAIN" },
    { name: "Iris", role: "SUPPORTING" },
  ],
  "Fullmetal Alchemist: Brotherhood": [
    { name: "Edward Elric", role: "MAIN" },
    { name: "Alphonse Elric", role: "MAIN" },
    { name: "Roy Mustang", role: "SUPPORTING" },
    { name: "Winry Rockbell", role: "SUPPORTING" },
    { name: "Riza Hawkeye", role: "SUPPORTING" },
    { name: "Greed", role: "SUPPORTING" },
  ],
  "Vinland Saga": [
    { name: "Thorfinn", role: "MAIN" },
    { name: "Askeladd", role: "MAIN" },
    { name: "Thors", role: "SUPPORTING" },
    { name: "Prince Canute", role: "SUPPORTING" },
    { name: "Bjorn", role: "SUPPORTING" },
    { name: "Leif Eriksson", role: "SUPPORTING" },
  ],
  "Steins;Gate": [
    { name: "Rintarou Okabe", role: "MAIN" },
    { name: "Kurisu Makise", role: "MAIN" },
    { name: "Mayuri Shiina", role: "MAIN" },
    { name: "Itaru Hashida", role: "SUPPORTING" },
    { name: "Suzuha Amane", role: "SUPPORTING" },
    { name: "Moeka Kiryu", role: "SUPPORTING" },
  ],
  "Mashle: Magic and Muscles": [
    { name: "Mash Burnedead", role: "MAIN" },
    { name: "Finn Ames", role: "SUPPORTING" },
    { name: "Lance Crown", role: "SUPPORTING" },
    { name: "Lemon Irvine", role: "SUPPORTING" },
    { name: "Dot Barrett", role: "SUPPORTING" },
    { name: "Abel Walker", role: "SUPPORTING" },
  ],
  "Gintama": [
    { name: "Gintoki Sakata", role: "MAIN" },
    { name: "Shinpachi Shimura", role: "MAIN" },
    { name: "Kagura", role: "MAIN" },
    { name: "Toshiro Hijikata", role: "SUPPORTING" },
    { name: "Sougo Okita", role: "SUPPORTING" },
    { name: "Kotaro Katsura", role: "SUPPORTING" },
  ],
  "Re:Zero": [
    { name: "Natsuki Subaru", role: "MAIN" },
    { name: "Emilia", role: "MAIN" },
    { name: "Rem", role: "SUPPORTING" },
    { name: "Ram", role: "SUPPORTING" },
    { name: "Beatrice", role: "SUPPORTING" },
    { name: "Roswaal L Mathers", role: "SUPPORTING" },
  ],
  "Sword Art Online": [
    { name: "Kirito", role: "MAIN" },
    { name: "Asuna Yuuki", role: "MAIN" },
    { name: "Sinon", role: "SUPPORTING" },
    { name: "Klein", role: "SUPPORTING" },
    { name: "Alice Zuberg", role: "SUPPORTING" },
    { name: "Eugeo", role: "SUPPORTING" },
  ],
};

const buildProxyImageUrl = (url) => {
  if (!url || url.includes("placehold.co")) {
    return url;
  }
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&h=520&fit=cover`;
};

const buildProxyAlternates = (url) => {
  if (!url || url.includes("placehold.co")) {
    return [url];
  }
  const encoded = encodeURIComponent(url);
  return [
    `https://images.weserv.nl/?url=${encoded}&w=400&h=520&fit=cover`,
    `https://wsrv.nl/?url=${encoded}&w=400&h=520&fit=cover`,
    url,
  ];
};

const characterImageCacheKey = "animeAtlasCharacterImages";

const getCharacterImageCache = () => {
  try {
    return JSON.parse(localStorage.getItem(characterImageCacheKey)) || {};
  } catch (error) {
    return {};
  }
};

const saveCharacterImageCache = (cache) => {
  try {
    localStorage.setItem(characterImageCacheKey, JSON.stringify(cache));
  } catch (error) {
    return;
  }
};

const getCachedCharacterImage = (key) => {
  const cache = getCharacterImageCache();
  return cache[key] || null;
};

const setCachedCharacterImage = (key, url) => {
  if (!key || !url) {
    return;
  }
  const cache = getCharacterImageCache();
  cache[key] = url;
  saveCharacterImageCache(cache);
};

const loadImageWithFallbacks = (img, urls, cacheKey) => {
  const queue = urls.filter(Boolean);
  const placeholder = "assets/characters/placeholder.svg";
  if (queue.length === 0) {
    img.src = placeholder;
    return;
  }

  const tryNext = () => {
    const nextUrl = queue.shift();
    if (!nextUrl) {
      img.src = placeholder;
      return;
    }
    const probe = new Image();
    probe.referrerPolicy = "no-referrer";
    probe.onload = () => {
      img.src = nextUrl;
      if (cacheKey) {
        setCachedCharacterImage(cacheKey, nextUrl);
      }
    };
    probe.onerror = tryNext;
    probe.src = nextUrl;
  };

  tryNext();
};

const renderCharacterCards = (list, entries) => {
  list.innerHTML = "";
  entries.forEach((entry) => {
    const placeholder = "assets/characters/placeholder.svg";
    const name = entry?.name || "Unknown";
    const role = entry?.role ? entry.role.replaceAll("_", " ") : "Character";
    const image = entry?.image || placeholder;
    const cacheKey = `${name}-${role}`.toLowerCase();
    const cached = getCachedCharacterImage(cacheKey);
    const imageCandidates = cached
      ? [cached, ...buildProxyAlternates(image)]
      : buildProxyAlternates(image);
    const card = document.createElement("article");
    card.className = "character-card";
    card.innerHTML = `
      <img src="${placeholder}" alt="${name}" loading="lazy" />
      <div class="character-info">
        <h4>${name}</h4>
        <p>${role}</p>
      </div>
    `;
    list.appendChild(card);
    const img = card.querySelector("img");
    if (img) {
      img.referrerPolicy = "no-referrer";
      loadImageWithFallbacks(img, imageCandidates, cacheKey);
    }
  });
};

const fetchCharacterSection = async (section, gqlQuery) => {
  const title = section.dataset.anime;
  const list = section.querySelector("[data-characters]");
  if (!title || !list) return;

  // Show fallback immediately so the section is never blank
  const fallback = characterFallbacks[title];
  if (fallback) renderCharacterCards(list, fallback);

  const search = section.dataset.anilistQuery || document.body.dataset.anilistQuery || title;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: gqlQuery, variables: { search } }),
    });
    if (!response.ok) return;
    const payload = await response.json();
    const edges = payload?.data?.Media?.characters?.edges || [];
    if (edges.length === 0) return;
    const normalized = edges.map((edge) => ({
      name: edge?.node?.name?.full || "Unknown",
      role: edge?.role || "Character",
      image: edge?.node?.image?.large || "https://placehold.co/320x420?text=Character",
    }));
    renderCharacterCards(list, normalized);
  } catch (_) {
    // fallback already rendered above
  }
};

const loadCharacterSpotlights = () => {
  const sections = document.querySelectorAll(".character-spotlight");
  if (sections.length === 0) return;

  const gqlQuery = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        characters(perPage: 6, sort: [ROLE, RELEVANCE]) {
          edges {
            role
            node {
              name { full }
              image { large }
            }
          }
        }
      }
    }
  `;

  // Fire all section fetches in parallel — no sequential awaiting
  Promise.all([...sections].map((s) => fetchCharacterSection(s, gqlQuery)));
};

loadCharacterSpotlights();

const quizResults = document.getElementById("quiz-results");
const quizResultsNote = document.getElementById("quiz-results-note");

const quizData = {
  hype: [
    { title: "Demon Slayer", link: "demon-slayer.html", query: "Kimetsu no Yaiba", desc: "Tanjiro's quest to cure his demon sister — with the most jaw-dropping animation in shōnen history." },
    { title: "Jujutsu Kaisen", link: "jujutsu-kaisen.html", query: "Jujutsu Kaisen", desc: "MAPPA's kinetic fights meet a dark supernatural world packed with iconic characters." },
    { title: "Dragon Ball Z", link: "dragon-ball-z.html", query: "Dragon Ball Z", desc: "The template for every power-scaling battle anime. Goku vs the universe, over and over." },
    { title: "Kaiju No. 8", link: "kaiju-no-8.html", query: "Kaiju No. 8", desc: "A 32-year-old man unexpectedly turns into a kaiju mid-fight and joins the defence force. Explosive and surprisingly funny." },
    { title: "Tokyo Revengers", link: "tokyo-revengers.html", query: "Tokyo Revengers", desc: "Time-travel to your worst years and fix it. Gang fights, found family, and genuine high stakes." },
    { title: "Blue Exorcist", link: "blue-exorcist.html", query: "Ao no Exorcist", desc: "Satan's son decides to become an exorcist and fight his own father. Blue flames and great sibling drama." },
  ],
  heart: [
    { title: "Naruto", link: "naruto.html", query: "Naruto", desc: "An outcast's journey to becoming Hokage — the most emotionally driven shōnen ever made." },
    { title: "Haikyu!!", link: "haikyu.html", query: "Haikyuu!!", desc: "Every rally feels world-ending. Volleyball anime that will make you cry without warning." },
    { title: "Frieren: Beyond Journey's End", link: "frieren.html", query: "Sousou no Frieren", desc: "A quiet masterpiece about loss, memory, and the value of fleeting mortal lives." },
    { title: "Fruits Basket", link: "fruits-basket.html", query: "Fruits Basket (2019)", desc: "A girl moves in with a cursed family. One of the most emotionally complete anime ever made — the 2019 reboot is perfect." },
    { title: "Ranking of Kings", link: "ranking-of-kings.html", query: "Ousama Ranking", desc: "A deaf, weak prince and his shadow friend try to change the world. Hides devastating depth behind a fairy-tale look." },
    { title: "Oshi no Ko", link: "oshi-no-ko.html", query: "Oshi no Ko", desc: "Reincarnated into the children of a murdered idol. A dark, emotional dismantling of the entertainment industry." },
  ],
  chill: [
    { title: "Spy x Family", link: "spy-x-family.html", query: "Spy x Family", desc: "A fake family that becomes the most wholesome thing in anime. Anya carries every scene." },
    { title: "Horimiya", link: "horimiya.html", query: "Horimiya", desc: "A school romance that skips the drama tropes and just feels genuinely warm and real." },
    { title: "One Punch Man", link: "one-punch-man.html", query: "One Punch Man", desc: "A comedy about being too powerful. Surprisingly chill once you stop expecting tension." },
    { title: "Delicious in Dungeon", link: "delicious-in-dungeon.html", query: "Dungeon Meshi", desc: "Adventurers cook and eat dungeon monsters to survive. Cozy, clever, and surprisingly deep about food and ecology." },
    { title: "KonoSuba", link: "konosuba.html", query: "Kono Subarashii Sekai ni Shukufuku wo!", desc: "Isekai done as pure comedy. A useless goddess, an explosion maniac, and a masochist crusader. Endlessly re-watchable." },
    { title: "Rent-a-Girlfriend", link: "rent-a-girlfriend.html", query: "Kanojo, Okarishimasu", desc: "A broke student hires a rental girlfriend and it spirals from there. Fun, light, and surprisingly warm." },
  ],
  mind: [
    { title: "Death Note", link: "death-note.html", query: "Death Note", desc: "A notebook that kills anyone whose name you write. The world's greatest battle of wits." },
    { title: "Steins;Gate", link: "steins-gate.html", query: "Steins;Gate", desc: "Time travel gone catastrophically wrong. One of the greatest slow-burns in any medium." },
    { title: "Attack on Titan", link: "attack-on-titan.html", query: "Shingeki no Kyojin", desc: "Humanity vs giants — until it becomes a geopolitical thriller about cycles of violence." },
    { title: "Neon Genesis Evangelion", link: "neon-genesis-evangelion.html", query: "Neon Genesis Evangelion", desc: "Giant robots and psychological collapse. Anno's masterpiece deconstructs the mecha genre and its audience simultaneously." },
    { title: "Pluto", link: "pluto.html", query: "Pluto", desc: "Naoki Urasawa's reimagining of Astro Boy as a noir thriller about war, robots, and what makes something worth mourning." },
    { title: "Bungo Stray Dogs", link: "bungo-stray-dogs.html", query: "Bungou Stray Dogs", desc: "Detective agency vs criminal syndicate, where every character has a literary author's name and ability. Style meets substance." },
  ],
  dark: [
    { title: "Chainsaw Man", link: "chainsaw-man.html", query: "Chainsaw Man", desc: "Denji just wants a normal life — in a world that won't stop trying to kill him. Raw and cinematic." },
    { title: "Attack on Titan", link: "attack-on-titan.html", query: "Shingeki no Kyojin", desc: "A generation-defining descent into moral grey — with one of the most divisive endings in anime." },
    { title: "Vinland Saga", link: "vinland-saga.html", query: "Vinland Saga", desc: "A revenge epic that transforms into the most mature meditation on violence ever in shōnen." },
    { title: "Beastars", link: "beastars.html", query: "Beastars", desc: "Anthropomorphic animals in a high school where a student was devoured. Predator instinct, forbidden love, and social allegory." },
    { title: "Gachiakuta", link: "gachiakuta.html", query: "Gachiakuta", desc: "A boy thrown into a trash abyss fights back with discarded objects. Raw class-war anger with exceptional action." },
    { title: "86 Eighty Six", link: "86-eighty-six.html", query: "86", desc: "A war fought entirely by ethnic minorities piloting mechs. One of the most quietly devastating military anime ever made." },
  ],
  adventure: [
    { title: "One Piece", link: "one-piece.html", query: "One Piece", desc: "The greatest long-form adventure ever. 1000+ episodes and every arc is better than the last." },
    { title: "Hunter x Hunter", link: "hunter-x-hunter.html", query: "Hunter x Hunter", desc: "Gon's search for his father spirals into the most morally complex arcs in battle anime." },
    { title: "Black Clover", link: "black-clover.html", query: "Black Clover", desc: "A magicless underdog in a world of magic. A slow burn that rewards patience spectacularly." },
    { title: "World Trigger", link: "world-trigger.html", query: "World Trigger", desc: "Neighbours from another dimension invade Earth. Tactical battles and a team that has to outthink everyone they face." },
    { title: "Soul Eater", link: "soul-eater.html", query: "Soul Eater", desc: "Students at the Death Weapon Meister Academy collect souls. Stylish, macabre, and relentlessly fun." },
    { title: "Food Wars", link: "food-wars.html", query: "Shokugeki no Soma", desc: "Culinary battles at Japan's elite cooking school. Every dish is a spectacle. A genuinely great shōnen in disguise." },
  ],
  calm: [
    { title: "Frieren: Beyond Journey's End", link: "frieren.html", query: "Sousou no Frieren", desc: "An immortal elf revisits a world she outlived. Devastatingly peaceful." },
    { title: "Horimiya", link: "horimiya.html", query: "Horimiya", desc: "A romance with no contrived drama — just two people figuring each other out." },
    { title: "Spy x Family", link: "spy-x-family.html", query: "Spy x Family", desc: "Pure wholesome comfort. A fake family that genuinely loves each other." },
    { title: "Chihayafuru", link: "chihayafuru.html", query: "Chihayafuru", desc: "A competitive card game about 100 ancient poems. Passionate, gorgeous, and unexpectedly moving." },
    { title: "Spirit Chronicles", link: "spirit-chronicles.html", query: "Seirei Gensouki", desc: "A gentle isekai about memories, past lives, and finding your place in a new world." },
  ],
  survival: [
    { title: "Hell's Paradise", link: "hells-paradise.html", query: "Jigokuraku", desc: "A shinobi sent to a supernatural island to find the elixir of life. Dark, fast, and gripping." },
    { title: "Demon Slayer", link: "demon-slayer.html", query: "Kimetsu no Yaiba", desc: "Every fight is a survival trial. Tanjiro is never the strongest person in the room." },
    { title: "Chainsaw Man", link: "chainsaw-man.html", query: "Chainsaw Man", desc: "Denji's whole life is a survival trial. MAPPA makes every episode feel cinematic." },
    { title: "Zom 100", link: "zom-100.html", query: "Zom 100", desc: "The zombie apocalypse is the best thing that ever happened to a man who hated his job. Liberation through catastrophe." },
    { title: "Darwin's Game", link: "darwins-game.html", query: "Darwin's Game", desc: "A mobile game where players fight to the death. Each user has a unique power. Compact and brutally efficient." },
  ],
  blaze: [
    { title: "Fire Force", link: "fire-force.html", query: "Enen no Shouboutai", desc: "Firefighters with pyrokinesis battle humans who combust into demons. Pure spectacle." },
    { title: "One Punch Man", link: "one-punch-man.html", query: "One Punch Man", desc: "Season 1 has some of the best action animation ever produced. Saitama vs everything." },
    { title: "My Hero Academia", link: "my-hero-academia.html", query: "Boku no Hero Academia", desc: "A world of superheroes — and Deku inheriting the greatest ability from his idol." },
    { title: "Blue Exorcist", link: "blue-exorcist.html", query: "Ao no Exorcist", desc: "Satan's son wields blue demon flames and trains to become an exorcist. Flashy fights with surprising emotional weight." },
    { title: "High School DxD", link: "high-school-dxd.html", query: "High School DxD", desc: "A high schooler killed and resurrected as a devil, whose Sacred Gear doubles his power every ten seconds. Wild and committed." },
  ],
};

const renderQuizResults = (mood) => {
  if (!quizResults || !quizResultsNote) {
    return;
  }
  const picks = quizData[mood] || [];
  quizResults.innerHTML = "";
  if (picks.length === 0) {
    quizResultsNote.textContent = "No recommendations available for that mood.";
    return;
  }

  // Update heading note
  const moodLabels = {
    hype: "Hype & Action", heart: "Heart & Feels", chill: "Chill & Cozy",
    mind: "Mind Games", dark: "Dark & Intense", adventure: "Adventure",
    calm: "Calm & Reflective", survival: "Survival & Horror", blaze: "Blazing Action",
  };
  quizResultsNote.textContent = `Showing 3 picks for "${moodLabels[mood] || mood}"`;

  // Mark active quiz card
  document.querySelectorAll(".quiz-card").forEach((c) => c.classList.remove("quiz-card-active"));
  const activeCard = document.querySelector(`.quiz-card[data-mood="${mood}"]`);
  if (activeCard) activeCard.classList.add("quiz-card-active");

  // Scroll to results
  const resultSection = document.getElementById("quiz-results-section");
  if (resultSection) setTimeout(() => resultSection.scrollIntoView({ behavior: "smooth", block: "start" }), 80);

  picks.forEach((pick) => {
    const card = document.createElement("article");
    card.className = "card";
    if (pick.query) card.dataset.anilistQuery = pick.query;
    card.innerHTML = `
      <img class="card-cover" src="https://placehold.co/600x800?text=${encodeURIComponent(pick.title)}" alt="${pick.title} cover" />
      <h3>${pick.link === "#" ? pick.title : `<a href="${pick.link}">${pick.title}</a>`}</h3>
      <p class="meta">Recommended for you</p>
      <p>${pick.desc || "A great pick for this mood."}</p>
      <button class="fav-toggle" type="button">♡ Favourite</button>
    `;
    quizResults.appendChild(card);
  });

  // Let the shared loadPosterImages pipeline handle image fetching & meta
  loadPosterImages();

  // Re-run fav toggle wiring for new cards
  quizResults.querySelectorAll(".fav-toggle").forEach((btn) => wireFavToggle(btn));
};

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    renderQuizResults(card.dataset.mood);
  });
});

// ── Tier List Builder ────────────────────────────────────────
(function initTierList() {
  if (!document.getElementById("tl-board")) return;

  const ANIME_LIST = [
    { title: "Attack on Titan",                 query: "Shingeki no Kyojin",                       emoji: "⚔️" },
    { title: "Demon Slayer",                    query: "Kimetsu no Yaiba",                         emoji: "🔥" },
    { title: "Jujutsu Kaisen",                  query: "Jujutsu Kaisen",                           emoji: "👊" },
    { title: "Spy x Family",                    query: "Spy x Family",                             emoji: "🕵️" },
    { title: "Frieren",                         query: "Sousou no Frieren",                        emoji: "🌿" },
    { title: "Death Note",                      query: "Death Note",                               emoji: "📓" },
    { title: "Hunter x Hunter",                 query: "Hunter x Hunter",                          emoji: "🎯" },
    { title: "Fullmetal Alchemist: Brotherhood",query: "Fullmetal Alchemist: Brotherhood",         emoji: "⚗️" },
    { title: "One Punch Man",                   query: "One Punch Man",                            emoji: "👊" },
    { title: "Haikyu!!",                        query: "Haikyuu!!",                                emoji: "🏐" },
    { title: "Steins;Gate",                     query: "Steins;Gate",                              emoji: "⏰" },
    { title: "Vinland Saga",                    query: "Vinland Saga",                             emoji: "🪓" },
    { title: "My Hero Academia",                query: "Boku no Hero Academia",                    emoji: "🦸" },
    { title: "Bleach",                          query: "Bleach",                                   emoji: "⚡" },
    { title: "Naruto",                          query: "Naruto",                                   emoji: "🍜" },
    { title: "One Piece",                       query: "One Piece",                                emoji: "🏴‍☠️" },
    { title: "Dragon Ball Z",                   query: "Dragon Ball Z",                            emoji: "🐉" },
    { title: "Chainsaw Man",                    query: "Chainsaw Man",                             emoji: "🔪" },
    { title: "Hell's Paradise",                 query: "Jigokuraku",                               emoji: "🌸" },
    { title: "Fire Force",                      query: "Enen no Shouboutai",                       emoji: "🔥" },
    { title: "Solo Leveling",                   query: "Solo Leveling",                            emoji: "⬆️" },
    { title: "Sakamoto Days",                   query: "Sakamoto Days",                            emoji: "🛒" },
    { title: "Horimiya",                        query: "Horimiya",                                 emoji: "💕" },
    { title: "Black Clover",                    query: "Black Clover",                             emoji: "🍀" },
    { title: "JoJo's Bizarre Adventure",        query: "JoJo no Kimyou na Bouken (2012)",          emoji: "💫" },
    { title: "Blue Box",                        query: "Ao no Hako",                               emoji: "🏸" },
    { title: "Gintama",                              query: "Gintama",                                          emoji: "🗡️" },
    { title: "Re:Zero",                              query: "Re:Zero kara Hajimeru Isekai Seikatsu",            emoji: "🔄" },
    { title: "Sword Art Online",                     query: "Sword Art Online",                                 emoji: "⚔️" },
    // Batch 2 additions
    { title: "Neon Genesis Evangelion",              query: "Neon Genesis Evangelion",                          emoji: "🤖" },
    { title: "Paranoia Agent",                       query: "Mousou Dairinin",                                  emoji: "🦇" },
    { title: "Fruits Basket",                        query: "Fruits Basket (2019)",                             emoji: "🧺" },
    { title: "86 Eighty Six",                        query: "86",                                               emoji: "🚀" },
    { title: "Oshi no Ko",                           query: "Oshi no Ko",                                       emoji: "⭐" },
    { title: "Tougen Anki",                          query: "Tougen Anki",                                      emoji: "🌸" },
    { title: "KonoSuba",                             query: "Kono Subarashii Sekai ni Shukufuku wo!",           emoji: "💥" },
    { title: "Spirit Chronicles",                    query: "Seirei Gensouki",                                  emoji: "🏰" },
    { title: "Darwin's Game",                        query: "Darwin's Game",                                    emoji: "🎮" },
    { title: "Soul Eater",                           query: "Soul Eater",                                       emoji: "💀" },
    { title: "Bungo Stray Dogs",                     query: "Bungou Stray Dogs",                                emoji: "📚" },
    { title: "Tokyo Revengers",                      query: "Tokyo Revengers",                                  emoji: "⏳" },
    { title: "Rent-a-Girlfriend",                    query: "Kanojo, Okarishimasu",                             emoji: "💸" },
    { title: "Alya Hides Her Feelings",              query: "Alya-san wa Koi wo Tonikaku Kakushitai",           emoji: "📖" },
    { title: "Food Wars",                            query: "Shokugeki no Soma",                                emoji: "🍽️" },
    { title: "Kaiju No. 8",                          query: "Kaiju No. 8",                                      emoji: "🦕" },
    { title: "Delicious in Dungeon",                 query: "Dungeon Meshi",                                    emoji: "🍲" },
    { title: "Ranking of Kings",                     query: "Ousama Ranking",                                   emoji: "👑" },
    { title: "Pluto",                               query: "Pluto",                                            emoji: "🤖" },
    { title: "Chihayafuru",                          query: "Chihayafuru",                                      emoji: "🃏" },
    { title: "Beastars",                             query: "Beastars",                                         emoji: "🐺" },
    { title: "Gachiakuta",                           query: "Gachiakuta",                                       emoji: "🗑️" },
    { title: "Blue Exorcist",                        query: "Ao no Exorcist",                                   emoji: "🔵" },
    { title: "High School DxD",                      query: "High School DxD",                                  emoji: "😈" },
    { title: "Toilet-bound Hanako-kun",              query: "Jibaku Shounen Hanako-kun",                        emoji: "👻" },
    { title: "Zom 100",                              query: "Zom 100",                                          emoji: "🧟" },
    { title: "World Trigger",                        query: "World Trigger",                                    emoji: "🎯" },
  ];

  const pool = document.getElementById("tier-pool");

  // Build tiles in pool
  ANIME_LIST.forEach(({ title, query, emoji }) => {
    const tile = document.createElement("div");
    tile.className = "tl-tile";
    tile.draggable = true;
    tile.dataset.title = title;
    tile.innerHTML = `
      <span class="tl-tile-emoji">${emoji}</span>
      <span class="tl-tile-img-wrap">
        <img class="tl-tile-img" src="https://placehold.co/60x80/1a1a2e/888?text=..." alt="${title}" />
      </span>
      <span class="tl-tile-name">${title}</span>
    `;
    pool.appendChild(tile);

    // Load cover art: check the site's poster cache first, then fetch from AniList
    const img = tile.querySelector(".tl-tile-img");
    const cached = getCachedPoster(query, "ANIME");

    if (cached?.url) {
      img.src = cached.url;
    } else {
      // Lightweight AniList fetch with CORS proxy fallback
      const anilistBody = JSON.stringify({
        query: `query($s:String){Media(search:$s,type:ANIME){coverImage{large extraLarge}}}`,
        variables: { s: query },
      });
      const endpoints = window.location.protocol === "file:"
        ? ["https://cors.isomorphic-git.org/https://graphql.anilist.co", "https://corsproxy.io/?https://graphql.anilist.co", "https://graphql.anilist.co"]
        : ["https://graphql.anilist.co", "https://cors.isomorphic-git.org/https://graphql.anilist.co"];

      (async () => {
        for (const endpoint of endpoints) {
          try {
            const r = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: anilistBody,
            });
            if (!r.ok) continue;
            const d = await r.json();
            const url = d?.data?.Media?.coverImage?.extraLarge || d?.data?.Media?.coverImage?.large;
            if (url) {
              img.src = url;
              // Save into the site's poster cache so subsequent loads are instant
              setPosterCache(query, "ANIME", url, title, { genres: [] });
              break;
            }
          } catch { continue; }
        }
      })();
    }
  });

  // ── Drag & drop logic ──
  let draggedTile = null;

  document.addEventListener("dragstart", (e) => {
    const tile = e.target.closest(".tl-tile");
    if (!tile) return;
    draggedTile = tile;
    tile.classList.add("tl-dragging");
  });

  document.addEventListener("dragend", () => {
    if (draggedTile) draggedTile.classList.remove("tl-dragging");
    draggedTile = null;
    document.querySelectorAll(".tl-drop").forEach((z) => z.classList.remove("tl-drag-over"));
  });

  document.querySelectorAll(".tl-drop").forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("tl-drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("tl-drag-over"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("tl-drag-over");
      if (draggedTile) zone.appendChild(draggedTile);
    });
  });

  // Touch support (mobile)
  let touchTile = null;
  let touchClone = null;

  document.addEventListener("touchstart", (e) => {
    const tile = e.target.closest(".tl-tile");
    if (!tile) return;
    touchTile = tile;
    const rect = tile.getBoundingClientRect();
    touchClone = tile.cloneNode(true);
    touchClone.classList.add("tl-touch-clone");
    touchClone.style.width = rect.width + "px";
    touchClone.style.height = rect.height + "px";
    touchClone.style.left = rect.left + "px";
    touchClone.style.top = rect.top + "px";
    document.body.appendChild(touchClone);
    tile.classList.add("tl-dragging");
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    if (!touchClone) return;
    const t = e.touches[0];
    touchClone.style.left = (t.clientX - 30) + "px";
    touchClone.style.top  = (t.clientY - 40) + "px";
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (!touchTile || !touchClone) return;
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const zone = el?.closest(".tl-drop");
    if (zone) zone.appendChild(touchTile);
    touchTile.classList.remove("tl-dragging");
    touchClone.remove();
    touchTile = null;
    touchClone = null;
  });

  // ── Reset button ──
  document.getElementById("tl-reset").addEventListener("click", () => {
    document.querySelectorAll(".tl-tile").forEach((tile) => pool.appendChild(tile));
    document.getElementById("tl-share-wrap").style.display = "none";
  });

  // ── Copy results ──
  const buildShareText = () => {
    const tiers = ["S", "A", "B", "C", "D", "F"];
    let text = "🏆 My Anime Tier List (Anime Atlas)\n";
    text += "═".repeat(36) + "\n";
    tiers.forEach((tier) => {
      const tiles = [...document.querySelectorAll(`#tier-${tier} .tl-tile`)];
      const names = tiles.map((t) => t.dataset.title);
      text += `${tier} │ ${names.length ? names.join(", ") : "—"}\n`;
    });
    return text;
  };

  document.getElementById("tl-copy").addEventListener("click", () => {
    const text = buildShareText();
    const wrap = document.getElementById("tl-share-wrap");
    document.getElementById("tl-share-text").textContent = text;
    wrap.style.display = "block";
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  document.getElementById("tl-copy-confirm").addEventListener("click", () => {
    const text = document.getElementById("tl-share-text").textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById("tl-copy-confirm");
      btn.textContent = "✅ Copied!";
      setTimeout(() => (btn.textContent = "Copy to clipboard ✓"), 2000);
    });
  });
})();

// ── Watch Time Calculator ────────────────────────────────────
(function initWatchTime() {
  if (!document.getElementById("wt-anime-grid")) return;

  const ANIME_DATA = [
    { title: "Attack on Titan",                  eps: 94,  avgMin: 24 },
    { title: "Demon Slayer",                     eps: 63,  avgMin: 23 },
    { title: "Jujutsu Kaisen",                   eps: 53,  avgMin: 24 },
    { title: "Spy x Family",                     eps: 37,  avgMin: 24 },
    { title: "Frieren: Beyond Journey's End",    eps: 38,  avgMin: 26 },
    { title: "Death Note",                       eps: 37,  avgMin: 23 },
    { title: "Hunter x Hunter",                  eps: 148, avgMin: 23 },
    { title: "Fullmetal Alchemist: Brotherhood", eps: 64,  avgMin: 24 },
    { title: "One Punch Man",                    eps: 24,  avgMin: 24 },
    { title: "Haikyu!!",                         eps: 85,  avgMin: 23 },
    { title: "Steins;Gate",                      eps: 24,  avgMin: 23 },
    { title: "Vinland Saga",                     eps: 48,  avgMin: 24 },
    { title: "My Hero Academia",                 eps: 181, avgMin: 24 },
    { title: "Bleach",                           eps: 366, avgMin: 23 },
    { title: "Naruto",                           eps: 720, avgMin: 23 },
    { title: "One Piece",                        eps: 1040,avgMin: 24 },
    { title: "Dragon Ball Z",                    eps: 291, avgMin: 22 },
    { title: "Chainsaw Man",                     eps: 12,  avgMin: 24 },
    { title: "Hell's Paradise",                  eps: 13,  avgMin: 24 },
    { title: "Fire Force",                       eps: 48,  avgMin: 24 },
    { title: "Solo Leveling",                    eps: 24,  avgMin: 24 },
    { title: "Sakamoto Days",                    eps: 25,  avgMin: 24 },
    { title: "Horimiya",                         eps: 26,  avgMin: 23 },
    { title: "Black Clover",                     eps: 170, avgMin: 23 },
    { title: "JoJo's Bizarre Adventure",         eps: 190, avgMin: 23 },
    { title: "Blue Box",                         eps: 25,  avgMin: 24 },
    { title: "Gintama",                              eps: 367, avgMin: 24 },
    { title: "Re:Zero",                              eps: 50,  avgMin: 24 },
    { title: "Sword Art Online",                     eps: 96,  avgMin: 24 },
    // Batch 2 additions
    { title: "Neon Genesis Evangelion",              eps: 26,  avgMin: 23 },
    { title: "Paranoia Agent",                       eps: 13,  avgMin: 24 },
    { title: "Fruits Basket",                        eps: 63,  avgMin: 23 },
    { title: "86 Eighty Six",                        eps: 23,  avgMin: 24 },
    { title: "Oshi no Ko",                           eps: 24,  avgMin: 30 },
    { title: "Tougen Anki",                          eps: 13,  avgMin: 24 },
    { title: "KonoSuba",                             eps: 32,  avgMin: 23 },
    { title: "Spirit Chronicles",                    eps: 26,  avgMin: 24 },
    { title: "Darwin's Game",                        eps: 11,  avgMin: 24 },
    { title: "Soul Eater",                           eps: 51,  avgMin: 24 },
    { title: "Bungo Stray Dogs",                     eps: 60,  avgMin: 24 },
    { title: "Tokyo Revengers",                      eps: 50,  avgMin: 24 },
    { title: "Rent-a-Girlfriend",                    eps: 36,  avgMin: 23 },
    { title: "Alya Hides Her Feelings",              eps: 12,  avgMin: 23 },
    { title: "Food Wars",                            eps: 86,  avgMin: 24 },
    { title: "Kaiju No. 8",                          eps: 12,  avgMin: 24 },
    { title: "Delicious in Dungeon",                 eps: 24,  avgMin: 24 },
    { title: "Ranking of Kings",                     eps: 23,  avgMin: 24 },
    { title: "Pluto",                                eps: 8,   avgMin: 60 },
    { title: "Chihayafuru",                          eps: 72,  avgMin: 23 },
    { title: "Beastars",                             eps: 24,  avgMin: 22 },
    { title: "Gachiakuta",                           eps: 12,  avgMin: 24 },
    { title: "Blue Exorcist",                        eps: 50,  avgMin: 24 },
    { title: "High School DxD",                      eps: 49,  avgMin: 24 },
    { title: "Toilet-bound Hanako-kun",              eps: 12,  avgMin: 23 },
    { title: "Zom 100",                              eps: 12,  avgMin: 24 },
    { title: "World Trigger",                        eps: 99,  avgMin: 23 },
  ];

  const grid    = document.getElementById("wt-anime-grid");
  const list    = document.getElementById("wt-list");
  const emptyEl = document.getElementById("wt-empty");
  const speedSel= document.getElementById("wt-speed");
  const searchEl= document.getElementById("wt-search");

  let selected = {}; // title → { eps, avgMin }

  // Build selectable tiles
  const renderGrid = (filter = "") => {
    grid.innerHTML = "";
    const q = filter.toLowerCase();
    ANIME_DATA
      .filter((a) => a.title.toLowerCase().includes(q))
      .forEach((anime) => {
        const tile = document.createElement("button");
        tile.className = "wt-tile" + (selected[anime.title] ? " wt-tile-selected" : "");
        tile.innerHTML = `
          <span class="wt-tile-name">${anime.title}</span>
          <span class="wt-tile-eps">${anime.eps} eps</span>
        `;
        tile.addEventListener("click", () => {
          if (selected[anime.title]) {
            delete selected[anime.title];
          } else {
            selected[anime.title] = { eps: anime.eps, avgMin: anime.avgMin };
          }
          renderGrid(searchEl.value);
          renderResults();
        });
        grid.appendChild(tile);
      });
  };

  const formatTime = (mins) => {
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}d ${rh}h` : `${d} days`;
  };

  const renderResults = () => {
    const titles = Object.keys(selected);
    const speed = parseFloat(speedSel.value);

    // Update speed label
    document.getElementById("wt-speed-label").textContent = speedSel.value + "×";

    if (titles.length === 0) {
      list.innerHTML = "";
      list.appendChild(emptyEl);
      emptyEl.style.display = "";
      document.getElementById("wt-total-eps").textContent  = "0";
      document.getElementById("wt-total-raw").textContent  = "0 min";
      document.getElementById("wt-total-speed").textContent= "0 min";
      document.getElementById("wt-total-days").textContent = "—";
      return;
    }

    emptyEl.style.display = "none";
    list.innerHTML = "";

    let totalEps = 0;
    let totalRaw = 0;

    titles.forEach((title) => {
      const { eps, avgMin } = selected[title];
      const raw = eps * avgMin;
      const adj = raw / speed;
      totalEps += eps;
      totalRaw += raw;

      const li = document.createElement("li");
      li.className = "wt-item";
      li.innerHTML = `
        <span class="wt-item-title">${title}</span>
        <span class="wt-item-detail">${eps} eps · ${formatTime(adj)}</span>
        <button class="wt-item-remove" title="Remove" data-title="${title}">✕</button>
      `;
      li.querySelector(".wt-item-remove").addEventListener("click", () => {
        delete selected[title];
        renderGrid(searchEl.value);
        renderResults();
      });
      list.appendChild(li);
    });

    const adjTotal = totalRaw / speed;
    document.getElementById("wt-total-eps").textContent   = totalEps.toLocaleString();
    document.getElementById("wt-total-raw").textContent   = formatTime(totalRaw);
    document.getElementById("wt-total-speed").textContent = formatTime(adjTotal);
    document.getElementById("wt-total-days").textContent  = formatTime(adjTotal);
  };

  // Wire up speed selector
  speedSel.addEventListener("change", renderResults);

  // Wire up search
  searchEl.addEventListener("input", () => renderGrid(searchEl.value));

  // Wire clear button
  document.getElementById("wt-clear").addEventListener("click", () => {
    selected = {};
    renderGrid(searchEl.value);
    renderResults();
  });

  // Init
  renderGrid();
  renderResults();
})();

// ── Card hover previews ──────────────────────────────────────
(function buildCardPreviews() {
  document.querySelectorAll(".card").forEach((card) => {
    // Only cards with a cover image get the overlay
    if (!card.querySelector(".card-cover")) return;
    // Don't double-inject
    if (card.querySelector(".card-preview")) return;

    const titleEl   = card.querySelector("h3");
    const metaEl    = card.querySelector(".meta");
    const synopsisEl = card.querySelector("p:not(.meta)");
    const tagEl     = card.querySelector(".tag, .genre-badge");
    const linkEl    = card.querySelector("h3 a");

    const title    = titleEl?.textContent?.trim() || "";
    const meta     = metaEl?.textContent?.trim() || "";
    const synopsis = synopsisEl?.textContent?.trim() || "";
    const href     = linkEl?.getAttribute("href") || "#";

    // Collect all badge/tag text for mini genre pills
    const badgeSources = card.querySelectorAll(".genre-badge, .tag");
    let badgesHTML = "";
    if (badgeSources.length > 0) {
      badgeSources.forEach((b) => {
        const text = b.textContent.trim();
        const genre = b.dataset?.genre || "";
        if (text) {
          badgesHTML += `<span class="genre-badge" ${
            genre ? `data-genre="${genre}"` : ""
          }>${text}</span>`;
        }
      });
    } else if (tagEl) {
      // raw .tag text — split on bullets
      tagEl.textContent.split("•").forEach((g) => {
        const t = g.trim();
        if (t) badgesHTML += `<span class="genre-badge" data-genre="${t}">${t}</span>`;
      });
    }

    const preview = document.createElement("div");
    preview.className = "card-preview";

    const trailerTitle = card.dataset.anime || card.dataset.anilistQuery || title;
    const trailerHref = trailerTitle
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(trailerTitle + " official trailer")}`
      : "";

    preview.innerHTML = `
      ${title ? `<p class="card-preview-title">${title}</p>` : ""}
      ${meta  ? `<p class="card-preview-meta">${meta}</p>` : ""}
      ${synopsis ? `<p class="card-preview-synopsis">${synopsis}</p>` : ""}
      ${badgesHTML ? `<div class="card-preview-badges">${badgesHTML}</div>` : ""}
      <div class="card-preview-actions">
        ${href !== "#" ? `<a class="card-preview-cta" href="${href}">View series →</a>` : ""}
        ${trailerHref ? `<a class="card-preview-trailer" href="${trailerHref}" target="_blank" rel="noopener noreferrer">▶ Trailer</a>` : ""}
      </div>
    `;

    card.appendChild(preview);
  });
})();
