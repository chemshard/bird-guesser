const $ = (id) => document.getElementById(id);

let allBirds = [];
let questions = [];
let mode = "common";
let possible = [];
let asked = [];
let history = [];
let currentQuestion = null;
let gameStarted = false;

function showError(message) {
    $("error-state").style.display = "block";
    $("error-msg").textContent = message;
}

function hideError() {
    $("error-state").style.display = "none";
}

function birdMatchesTest(bird, test) {
    let matched = false;
    let hasRule = false;

    if (test.colors_any) {
        hasRule = true;
        matched = matched || test.colors_any.some(c => bird.main_colors.includes(c));
    }
    if (test.habitats_any) {
        hasRule = true;
        matched = matched || test.habitats_any.some(h => bird.habitats.includes(h));
    }
    if (test.traits_any) {
        hasRule = true;
        matched = matched || test.traits_any.some(t => bird.traits.includes(t));
    }
    if (test.size_any) {
        hasRule = true;
        matched = matched || test.size_any.includes(bird.size);
    }

    return hasRule ? matched : false;
}

function candidatesForMode(selectedMode) {
    if (selectedMode === "common") {
        return allBirds.filter(b => b.mode === "common");
    }
    return [...allBirds];
}

function startGame(selectedMode = $("mode-select").value) {
    hideError();
    mode = selectedMode;
    $("mode-select").value = mode;
    possible = candidatesForMode(mode);
    asked = [];
    history = [];
    currentQuestion = null;
    gameStarted = true;

    $("empty-state").style.display = "none";
    $("history-block").classList.add("hidden");
    chooseAndRenderQuestion();
}

function restartGame() {
    startGame(mode);
}

function scoreQuestion(question) {
    if (asked.includes(question.key)) return Infinity;

    let yes = 0;
    let no = 0;

    for (const bird of possible) {
        if (birdMatchesTest(bird, question.test)) yes++;
        else no++;
    }

    if (yes === 0 || no === 0) return Infinity;

    return Math.abs(yes - no);
}

function chooseBestQuestion() {
    let best = null;
    let bestScore = Infinity;

    for (const q of questions) {
        const score = scoreQuestion(q);
        if (score < bestScore) {
            best = q;
            bestScore = score;
        }
    }

    return best;
}

function chooseAndRenderQuestion() {
    renderStats();
    renderCandidates();

    if (possible.length === 0) {
        renderNoMatch();
        return;
    }

    if (possible.length <= 3 || asked.length >= 20) {
        renderGuess();
        return;
    }

    const q = chooseBestQuestion();
    if (!q) {
        renderGuess();
        return;
    }

    currentQuestion = q;
    $("game-title").textContent = `Question ${asked.length + 1}`;
    $("game-meta").textContent = `${possible.length} candidate${possible.length === 1 ? "" : "s"} left · ${mode === "common" ? "Common mode" : "Full starter database"}`;
    $("question-text").textContent = q.text;
    $("answer-grid").style.display = "grid";
    updateProgress();
}

function answerCurrent(answer) {
    if (!gameStarted || !currentQuestion) return;

    const before = [...possible];
    const q = currentQuestion;

    if (answer !== "unknown") {
        const wantsYes = answer === "yes";
        possible = possible.filter(bird => birdMatchesTest(bird, q.test) === wantsYes);
    }

    asked.push(q.key);
    history.push({
        question: q.text,
        answer,
        before,
        after: [...possible]
    });

    currentQuestion = null;
    renderHistory();
    chooseAndRenderQuestion();
}

function undo() {
    if (!history.length) return;

    const last = history.pop();
    possible = last.before;
    asked.pop();

    renderHistory();
    chooseAndRenderQuestion();
}

function updateProgress() {
    const percent = Math.min(100, (asked.length / 20) * 100);
    $("progress-bar").style.width = `${percent}%`;
}

function renderStats() {
    $("stats").style.display = "block";
    $("stats").textContent = `${possible.length} remaining · ${asked.length}/20 questions used · ${mode === "common" ? "common birds" : "full starter database"}`;
}

function renderCandidates() {
    const grid = $("results-grid");
    grid.innerHTML = "";

    const birdsToShow = gameStarted ? possible : candidatesForMode(mode);

    birdsToShow.forEach((bird, index) => {
        grid.appendChild(createBirdCard(bird, index, gameStarted ? "candidate" : "browse"));
    });
}

function renderNoMatch() {
    $("game-title").textContent = "I got cooked.";
    $("game-meta").textContent = "No candidate matches your answers.";
    $("question-text").textContent = "One of the answers probably filtered out the right bird. Restart and use “not sure” for traits you are uncertain about.";
    $("answer-grid").style.display = "none";
    $("empty-state").style.display = "block";
    updateProgress();
    $("results-grid").innerHTML = "";
}

function renderGuess() {
    $("game-title").textContent = possible.length === 1 ? "My guess" : "Closest matches";
    $("game-meta").textContent = `${possible.length} candidate${possible.length === 1 ? "" : "s"} after ${asked.length} question${asked.length === 1 ? "" : "s"}`;
    $("question-text").textContent = possible.length === 1
        ? `I think it is ${possible[0].name}.`
        : "I narrowed it down to these birds.";
    $("answer-grid").style.display = "none";
    updateProgress();
    renderCandidates();
}

function renderHistory() {
    const block = $("history-block");
    const list = $("history-list");
    list.innerHTML = "";

    if (!history.length) {
        block.classList.add("hidden");
        return;
    }

    block.classList.remove("hidden");
    history.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.question} — ${item.answer}`;
        list.appendChild(li);
    });
}

function createBirdCard(bird, index, labelText) {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${Math.min(index, 8) * 0.04}s`;

    const imgWrap = document.createElement("div");
    imgWrap.className = "card-img-wrap";
    imgWrap.addEventListener("click", () => openModal(bird));

    const emoji = document.createElement("div");
    emoji.className = "bird-emoji";
    emoji.textContent = chooseEmoji(bird);
    imgWrap.appendChild(emoji);

    const tag = document.createElement("div");
    tag.className = "fig-label-tag";
    tag.textContent = bird.group;
    imgWrap.appendChild(tag);

    const modeTag = document.createElement("div");
    modeTag.className = "mode-tag";
    modeTag.textContent = bird.mode === "common" ? "common" : "extra";
    imgWrap.appendChild(modeTag);

    const body = document.createElement("div");
    body.className = "card-body";

    const journal = document.createElement("div");
    journal.className = "card-journal";
    journal.textContent = `${bird.size} · ${bird.habitats.slice(0, 3).join(" / ")}`;
    body.appendChild(journal);

    const caption = document.createElement("div");
    caption.className = "card-caption";
    caption.innerHTML = `<strong>${bird.name}</strong><em>${bird.scientific}</em>`;
    body.appendChild(caption);

    const abs = document.createElement("div");
    abs.className = "card-abstract";
    abs.textContent = bird.notes;
    body.appendChild(abs);

    card.appendChild(imgWrap);
    card.appendChild(body);
    return card;
}

function chooseEmoji(bird) {
    if (bird.traits.includes("duck shape") || bird.group === "Ducks") return "🦆";
    if (bird.group === "Owls") return "🦉";
    if (bird.group === "Raptors") return "🦅";
    if (bird.group === "Parrots & parakeets") return "🦜";
    if (bird.group === "Herons & egrets" || bird.group === "Shorebirds") return "🪶";
    return "🐦";
}

function openModal(bird) {
    $("modal-label").textContent = bird.name;
    $("modal-caption").textContent = bird.notes;
    $("modal-paper").textContent = `${bird.scientific} · ${bird.group} · ${bird.size} · habitats: ${bird.habitats.join(", ")} · traits: ${bird.traits.join(", ")}`;
    $("modal").classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    $("modal").classList.remove("open");
    document.body.style.overflow = "";
}

function browseSpecies() {
    gameStarted = false;
    mode = $("mode-select").value;
    possible = candidatesForMode(mode);
    $("game-title").textContent = "Species browser";
    $("game-meta").textContent = `${possible.length} birds in ${mode === "common" ? "Common mode" : "Full starter database"}`;
    $("question-text").textContent = "These are the birds currently loaded into the game database. Click a card to see traits.";
    $("answer-grid").style.display = "none";
    $("empty-state").style.display = "none";
    $("history-block").classList.add("hidden");
    renderStats();
    renderCandidates();
}

function init() {
    if (!window.BIRD_DATABASE || !window.BIRD_QUESTIONS) {
        showError("data.js did not load. Check that data.js is in the same folder as index.html.");
        return;
    }

    allBirds = window.BIRD_DATABASE;
    questions = window.BIRD_QUESTIONS;
    possible = candidatesForMode(mode);

    const count = $("bird-count");
    if (count) count.textContent = allBirds.length;

    $("start-btn").addEventListener("click", () => startGame());
    $("restart-btn").addEventListener("click", restartGame);
    $("undo-btn").addEventListener("click", undo);
    $("show-all-birds").addEventListener("click", browseSpecies);
    $("modal-close").addEventListener("click", closeModal);

    document.querySelectorAll(".answer-btn").forEach(btn => {
        btn.addEventListener("click", () => answerCurrent(btn.dataset.answer));
    });

    document.querySelectorAll(".chip[data-mode]").forEach(btn => {
        btn.addEventListener("click", () => {
            $("mode-select").value = btn.dataset.mode;
            startGame(btn.dataset.mode);
        });
    });

    $("modal").addEventListener("click", e => {
        if (e.target === $("modal")) closeModal();
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeModal();
    });

    browseSpecies();
}

init();
