// hide splash
setTimeout(() => document.getElementById("splash").style.display = "none", 4000);

/* === Data === */
/* === Fetch Songs from Your JSON API === */
let songs = [];

fetch("https://my-json-server.typicode.com/G-Aravind/Aravind/songs")
  .then(res => res.json())
  .then(data => {
    songs = data;
    console.log("🎵 Songs loaded successfully:", songs);
    loadPlaylist();  // this function already exists in your code
    updateCounts();  // make sure the song count updates
  })
  .catch(err => {
    console.error("⚠️ Failed to fetch songs:", err);
    showToast("Unable to load songs from API");
  });


//   const songs = [
//   { title: "KU LO SA", artist: "SBTRKT", src: "songs/song1.mp3", cover: "https://a10.gaanacdn.com/gn_img/albums/9MAWe97WyJ/AWe9yL5LWy/size_l.jpg" },
//   { title: "Night Light", artist: "SBTRKT", src: "songs/song2.mp3", cover: "https://via.placeholder.com/300x300.png?text=Night+Light" },
// ];


let favs = JSON.parse(localStorage.getItem("favs") || "[]");
let currentIndex = -1, isPlaying = false, isMuted = false;
const audio = new Audio();

/* === Elements === */
const title = document.getElementById("title"),
  artist = document.getElementById("artist"),
  cover = document.getElementById("cover"),
  playBtn = document.getElementById("play"),
  playIcon = document.getElementById("play-icon"),
  bar = document.getElementById("bar"),
  currentTimeEl = document.getElementById("current-time"),
  totalTimeEl = document.getElementById("total-time"),
  favBtn = document.getElementById("favBtn"),
  favMainIcon = document.getElementById("favMainIcon"),
  playlistEl = document.getElementById("playlist"),
  favListEl = document.getElementById("favList"),
  searchInput = document.getElementById("searchInput"),
  searchResults = document.getElementById("searchResults"),
  muteBtn = document.getElementById("muteBtn"),
  muteIcon = document.getElementById("muteIcon"),
  toast = document.getElementById("toast"),
  toastText = document.getElementById("toast-text");

/* === Helpers === */
function showScreen(id) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.querySelector(`[data-target="${id}"]`).classList.add("active");
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("topBtns").style.display = id === "home" ? "flex" : "none";
}

function showToast(text, duration = 2500) {
  toastText.textContent = text;
  toast.classList.add("show");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("show"), duration);
}

/* === Playlist Rendering === */
function loadPlaylist() {
  playlistEl.innerHTML = "";
  songs.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "song-row";
    div.innerHTML = `
      <div class="song-left">
        <img src="${s.cover}" class="song-thumb">
        <div class="song-meta">
          <div class="t">${s.title}</div>
          <div class="a">${s.artist}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="play-icon"><i class="fa-solid fa-play"></i></div>
      </div>
    `;
    const left = div.querySelector(".song-left");
    const playIconEl = div.querySelector(".play-icon");

    left.onclick = () => (currentIndex === i ? showScreen("home") : playSong(i, true));
    playIconEl.onclick = (e) => {
      e.stopPropagation();
      if (currentIndex === i && isPlaying) pauseAudio();
      else if (currentIndex === i && !isPlaying) playAudio();
      else playSong(i, false);
    };

    playlistEl.appendChild(div);
  });
  updateCounts();
}
loadPlaylist();

/* === Play / Pause / Logic === */
function playSong(i, navigateHome = false) {
  const s = songs[i];
  if (audio.src.indexOf(s.src) === -1) audio.src = s.src;
  currentIndex = i;
  title.textContent = s.title;
  artist.textContent = s.artist;
  cover.src = s.cover;
  updateFavBtn();
  playAudio();
  highlightPlaying();
  if (navigateHome) showScreen("home");
}

function playAudio() {
  if (currentIndex < 0) {
    showToast("Pick a song from Playlist to play");
    showScreen("playlistScreen");
    return;
  }
  audio.play().catch(() => showToast("Playback blocked by browser. Interact to start."));
}

function pauseAudio() {
  audio.pause();
}

/* === Play button behavior === */
playBtn.onclick = () => {
  if (currentIndex < 0) {
    showToast("Pick a song from Playlist to play");
    showScreen("playlistScreen");
    return;
  }
  if (audio.paused) playAudio();
  else pauseAudio();
};

/* === Next / Prev === */
document.getElementById("next").onclick = () => {
  currentIndex = (currentIndex + 1) % songs.length;
  playSong(currentIndex, true);
};
document.getElementById("prev").onclick = () => {
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  playSong(currentIndex, true);
};

/* === Progress === */
audio.ontimeupdate = () => {
  if (!audio.duration) return;
  const p = (audio.currentTime / audio.duration) * 100;
  bar.style.width = p + "%";
  currentTimeEl.textContent = format(audio.currentTime);
  totalTimeEl.textContent = format(audio.duration);
};
function format(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
document.getElementById("progress").onclick = (e) => {
  if (!audio.duration) return;
  audio.currentTime = (e.offsetX / e.target.clientWidth) * audio.duration;
};

/* === Favourites === */
function updateFavBtn() {
  if (currentIndex < 0) {
    favMainIcon.style.opacity = '0.6';
    return;
  }
  const s = songs[currentIndex];
  const f = favs.find(f => f.title === s.title);
  favMainIcon.style.color = f ? "#ff4b4b" : "#ffffff";
}

favBtn.onclick = () => {
  if (currentIndex < 0) {
    showToast("Choose a song from Playlist to play");
    showScreen("playlistScreen");
    return;
  }
  const s = songs[currentIndex];
  const i = favs.findIndex(f => f.title === s.title);
  if (i > -1) favs.splice(i, 1);
  else favs.unshift(s);
  localStorage.setItem("favs", JSON.stringify(favs));
  updateFavBtn();
  loadFavs();
  highlightPlaying();
};

function loadFavs() {
  favListEl.innerHTML = "";
  favs.forEach(s => {
    const idx = songs.findIndex(x => x.title === s.title);
    const div = document.createElement("div");
    div.className = "song-row";
    div.innerHTML = `
      <div class="song-left">
        <img src="${s.cover}" class="song-thumb">
        <div class="song-meta"><div class="t">${s.title}</div><div class="a">${s.artist}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="play-icon"><i class="fa-solid fa-play"></i></div>
        <button class="fav-remove"><i class="fa-solid fa-heart" style="color:#ff4b4b;"></i></button>
      </div>`;
    const left = div.querySelector(".song-left");
    const playIconEl = div.querySelector(".play-icon");
    const removeBtn = div.querySelector(".fav-remove");

    left.onclick = () => playSong(idx, true);
    playIconEl.onclick = (e) => {
      e.stopPropagation();
      if (currentIndex === idx && !audio.paused) pauseAudio();
      else if (currentIndex === idx && audio.paused) playAudio();
      else playSong(idx, false);
    };
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      favs = favs.filter(f => f.title !== s.title);
      localStorage.setItem("favs", JSON.stringify(favs));
      loadFavs();
      updateFavBtn();
    };
    favListEl.appendChild(div);
  });
  updateCounts();
}
loadFavs();

function updateCounts() {
  document.getElementById("allCount").textContent = songs.length;
  document.getElementById("favCount").textContent = favs.length;
}

/* === Enhanced Search with History === */
let searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
const searchHistoryEl = document.getElementById("searchHistory");
const clearSearchBtn = document.getElementById("clearSearch");

function renderHistory() {
  searchHistoryEl.innerHTML = "";
  if (searchHistory.length === 0) return;

  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-history";
  clearBtn.textContent = "Clear All";
  clearBtn.onclick = () => {
    searchHistory = [];
    localStorage.removeItem("searchHistory");
    renderHistory();
  };

  searchHistory.forEach((term) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = term;
    item.onclick = () => {
      searchInput.value = term;
      performSearch(term);
    };
    searchHistoryEl.appendChild(item);
  });
  searchHistoryEl.appendChild(clearBtn);
}

function performSearch(query) {
  const q = query.toLowerCase().trim();
  searchResults.innerHTML = "";

  if (!q) return;

  // Filter matching songs
  const results = songs.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q)
  );

  if (results.length === 0) {
    searchResults.innerHTML = `<div style="color:#aaa;text-align:center;padding:10px;">No results found</div>`;
    return;
  }

  results.forEach(resultSong => {
    const div = document.createElement("div");
    div.className = "song-row";
    div.innerHTML = `
      <div class="song-left">
        <img src="${resultSong.cover}" class="song-thumb">
        <div class="song-meta">
          <div class="t">${resultSong.title}</div>
          <div class="a">${resultSong.artist}</div>
        </div>
      </div>
    `;

    // When user clicks a result
    div.onclick = () => {
      // find correct index from full songs array by unique 'src'
      const i = songs.findIndex(s => s.src === resultSong.src);

      if (i === -1) {
        showToast("⚠️ Song not found in playlist!");
        return;
      }

      // Play instantly
      playSong(i, true);

      // Hide search results and reset input
      searchResults.innerHTML = "";
      searchInput.value = "";
      showScreen("home");
    };

    searchResults.appendChild(div);
  });

  // save query to search history
  if (query && !searchHistory.includes(query)) {
    searchHistory.unshift(query);
    if (searchHistory.length > 6) searchHistory.pop();
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    renderHistory();
  }
}


searchInput.oninput = () => performSearch(searchInput.value);
clearSearchBtn.onclick = () => {
  searchInput.value = "";
  searchResults.innerHTML = "";
};

renderHistory();


/* === Navigation === */
document.querySelectorAll(".nav-item").forEach(n => n.onclick = () => showScreen(n.dataset.target));

/* === Mute Toggle === */
muteBtn.onclick = () => {
  isMuted = !isMuted;
  audio.muted = isMuted;
  muteBtn.classList.toggle("glow", isMuted);
  muteIcon.className = isMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
};

/* === Audio Events === */
audio.onplay = () => { isPlaying = true; playIcon.className = "fa-solid fa-pause"; highlightPlaying(); };
audio.onpause = () => { isPlaying = false; playIcon.className = "fa-solid fa-play"; highlightPlaying(); };
audio.onended = () => { currentIndex = (currentIndex + 1) % songs.length; playSong(currentIndex, true); };
audio.onerror = () => showToast("Unable to play track (check file/URL).");

/* === Highlight Playing === */
function highlightPlaying() {
  document.querySelectorAll("#playlist .song-row").forEach((r, idx) => {
    const icon = r.querySelector(".play-icon i");
    const isCurrent = idx === currentIndex;
    r.classList.toggle("active", isCurrent);
    if (icon) icon.className = isCurrent && isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
  });
  document.querySelectorAll("#favList .song-row").forEach(r => {
    const t = r.querySelector(".t").textContent;
    const icon = r.querySelector(".play-icon i");
    const isCurrent = songs[currentIndex]?.title === t;
    r.classList.toggle("active", isCurrent);
    if (icon) icon.className = isCurrent && isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
  });
  playIcon.className = isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
}

/* === Init === */
updateFavBtn();
highlightPlaying();



