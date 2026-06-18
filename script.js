const MAX_TURNS = 20;

const COMMON_IDS = new Set([
  "common-myna", "large-billed-crow", "yellow-vented-bulbul", "javan-myna",
  "asian-koel", "white-breasted-waterhen", "asian-glossy-starling",
  "scarlet-backed-flowerpecker", "common-iora", "swinhoes-white-eye",
  "collared-kingfisher", "red-junglefowl", "eurasian-tree-sparrow",
  "white-throated-kingfisher", "common-tailorbird", "rock-pigeon",
  "olive-backed-sunbird", "oriental-magpie-robin", "spotted-dove",
  "brown-throated-sunbird", "blue-tailed-bee-eater", "black-naped-oriole",
  "blue-throated-bee-eater", "pink-necked-green-pigeon", "sunda-pygmy-woodpecker",
  "oriental-pied-hornbill", "common-flameback", "scaly-breasted-munia",
  "zebra-dove", "house-crow", "amur-paradise-flycatcher", "brown-shrike",
  "tiger-shrike", "daurian-starling", "brahminy-kite", "little-egret",
  "grey-heron", "lesser-whistling-duck", "pacific-swallow", "rose-ringed-parakeet"
]);

const QUESTIONS = [
  { id: "black", text: "Is it mostly black or very dark?", test: b => hasColor(b, "black") && !hasColor(b, "yellow") && !hasColor(b, "green") },
  { id: "brown", text: "Is it mostly brown?", test: b => hasColor(b, "brown") && !hasColor(b, "blue") && !hasColor(b, "green") },
  { id: "white", text: "Does it have obvious white parts?", test: b => hasColor(b, "white") || hasFeature(b, "white_belly") || hasFeature(b, "white_throat") || hasFeature(b, "white_wing_patch") },
  { id: "bright", text: "Is it brightly coloured?", test: b => ["yellow", "green", "blue", "red", "orange", "gold", "pink", "purple"].some(c => hasColor(b, c)) },
  { id: "green", text: "Is green one of the obvious colours?", test: b => hasColor(b, "green") },
  { id: "yellow", text: "Does it show obvious yellow?", test: b => hasColor(b, "yellow") || hasFeature(b, "yellow_belly") || hasFeature(b, "yellow_vent") },
  { id: "blue", text: "Does it show obvious blue?", test: b => hasColor(b, "blue") || hasFeature(b, "blue_back") || hasFeature(b, "blue_wings") },
  { id: "red", text: "Does it show obvious red, pink, or chestnut?", test: b => ["red", "pink", "chestnut"].some(c => hasColor(b, c)) || hasFeature(b, "red_bill") || hasFeature(b, "red_eye") },
  { id: "tiny", text: "Is it tiny, like a sunbird, white-eye, or flowerpecker?", test: b => b.size === "tiny" },
  { id: "small", text: "Is it smaller than a myna?", test: b => ["tiny", "small"].includes(b.size) },
  { id: "large", text: "Is it bigger than a myna?", test: b => ["large", "huge"].includes(b.size) },
  { id: "huge", text: "Is it huge, like an eagle, hornbill, owl, heron, or stork?", test: b => b.size === "huge" },
  { id: "urban", text: "Is it commonly seen around buildings, roads, gardens, or urban parks?", test: b => hasHabitat(b, "urban") },
  { id: "water", text: "Was it near water, drains, canals, ponds, reservoirs, mudflats, or the coast?", test: b => ["water", "coast", "mangrove", "mudflat", "marsh", "pond", "reservoir", "wetland", "canal"].some(h => hasHabitat(b, h)) || hasBehavior(b, "near_water") },
  { id: "forest", text: "Was it mainly in forest, dense vegetation, or mature wooded areas?", test: b => hasHabitat(b, "forest") || hasHabitat(b, "forest_edge") },
  { id: "grassland", text: "Was it on open grassland, lawns, fields, or reclaimed land?", test: b => ["grassland", "open_country", "reclaimed_land"].some(h => hasHabitat(b, h)) },
  { id: "mangrove", text: "Was it in mangrove or coastal vegetation?", test: b => hasHabitat(b, "mangrove") || hasHabitat(b, "coast") },
  { id: "raptor", text: "Did it look like a bird of prey?", test: b => hasShape(b, "raptor") || hasBehavior(b, "raptor") },
  { id: "wader", text: "Did it have long legs like a heron, egret, stork, rail, or shorebird?", test: b => hasShape(b, "wader") || b.legs === "long" },
  { id: "swims", text: "Was it swimming on water?", test: b => hasBehavior(b, "swims") || hasShape(b, "duck") },
  { id: "kingfisher", text: "Did it look like a kingfisher with a big head and dagger-like bill?", test: b => hasShape(b, "kingfisher") },
  { id: "parrot", text: "Did it look like a parrot, parakeet, or cockatoo?", test: b => hasShape(b, "parrot") || b.bill === "parrot" },
  { id: "pigeon", text: "Did it look like a pigeon or dove?", test: b => hasShape(b, "pigeon") || hasShape(b, "dove") },
  { id: "woodpecker", text: "Was it climbing tree trunks or looking like a woodpecker?", test: b => hasShape(b, "woodpecker") || hasBehavior(b, "pecks_wood") },
  { id: "sunbird", text: "Was it a tiny nectar-feeding bird with a curved bill?", test: b => hasShape(b, "sunbird") || hasBehavior(b, "nectar_feeder") },
  { id: "owl", text: "Was it an owl or mainly active at night?", test: b => hasShape(b, "owl") || hasBehavior(b, "nocturnal") },
  { id: "hornbill", text: "Did it have a huge hornbill-style bill or casque?", test: b => hasShape(b, "hornbill") || b.bill === "hornbill" || hasFeature(b, "casque") },
  { id: "shorebird", text: "Did it look like a shorebird on mudflats, beaches, or wet open ground?", test: b => hasShape(b, "shorebird") },
  { id: "long_tail", text: "Did it have a noticeably long tail?", test: b => ["long", "long_fan", "racket", "forked"].includes(b.tail) || hasFeature(b, "long_tail") || hasFeature(b, "racket_tail") },
  { id: "forked_tail", text: "Did it have a forked tail or swept-back wings like a swallow, swift, or tern?", test: b => b.tail === "forked" || hasShape(b, "swallow") || hasShape(b, "swift") || hasShape(b, "tern") },
  { id: "crest", text: "Did it have a crest or obvious raised feathers on the head?", test: b => hasFeature(b, "crest") || hasFeature(b, "small_crest") || hasFeature(b, "red_crest") || hasFeature(b, "ear_tufts") || hasFeature(b, "crest_optional") },
  { id: "red_eye", text: "Did it have red eyes?", test: b => hasFeature(b, "red_eye") },
  { id: "curved_bill", text: "Was the bill curved?", test: b => ["curved_slender", "slender_curved", "long_downcurved", "parrot", "hooked"].includes(b.bill) || hasFeature(b, "curved_bill") },
  { id: "hooked_bill", text: "Was the bill hooked at the tip?", test: b => b.bill === "hooked" || b.bill === "parrot" || hasShape(b, "raptor") },
  { id: "long_bill", text: "Did it have a long spear-like or probing bill?", test: b => ["dagger", "long_spear", "long_downcurved"].includes(b.bill) || hasFeature(b, "large_bill") },
  { id: "conical_bill", text: "Did it have a short thick seed-cracking bill?", test: b => b.bill === "conical" || hasBehavior(b, "seed_eater") },
  { id: "flock", text: "Was it in a flock or group?", test: b => hasBehavior(b, "flock") },
  { id: "ground", text: "Was it mostly walking or feeding on the ground?", test: b => hasBehavior(b, "ground_forager") || hasBehavior(b, "walks") },
  { id: "aerial", text: "Was it catching insects in the air or flying around constantly?", test: b => hasBehavior(b, "aerial_insect_eater") || hasBehavior(b, "fast_flight") },
  { id: "soars", text: "Was it soaring high in the sky?", test: b => hasBehavior(b, "soars") },
  { id: "loud", text: "Is it known for loud or distinctive calls?", test: b => hasBehavior(b, "loud_call") || hasBehavior(b, "loud_song") || hasBehavior(b, "whistling_call") },
  { id: "migrant", text: "Was it likely a migratory visitor rather than a year-round urban regular?", test: b => b.status.includes("migrant") || hasBehavior(b, "migrant") || hasBehavior(b, "forest_migrant") }
];

let mode = "common";
let pool = [];
let possible = [];
let asked = [];
let history = [];
let currentQuestion = null;
let snapshots = [];

const $ = id => document.getElementById(id);

function hasColor(b, color) { return b.colors?.includes(color); }
function hasHabitat(b, habitat) { return b.habitats?.includes(habitat); }
function hasShape(b, shape) { return b.shapes?.includes(shape); }
function hasFeature(b, feature) { return b.features?.includes(feature); }
function hasBehavior(b, behavior) { return b.behavior?.includes(behavior); }

function startGame(selectedMode) {
  mode = selectedMode;
  pool = window.BIRD_DATABASE.filter(b => mode === "all" || COMMON_IDS.has(b.id));
  possible = [...pool];
  asked = [];
  history = [];
  snapshots = [];
  currentQuestion = null;

  $("startPanel").classList.add("hidden");
  $("gamePanel").classList.remove("hidden");
  $("historyPanel").classList.remove("hidden");
  $("modeLabel").textContent = mode === "all" ? "full starter database" : "common mode";
  $("tryAllBtn").classList.toggle("hidden", mode === "all");
  render();
}

function saveSnapshot() {
  snapshots.push({
    possible: [...possible],
    asked: [...asked],
    history: [...history],
    currentQuestionId: currentQuestion?.id ?? null
  });
}

function undo() {
  const last = snapshots.pop();
  if (!last) return;
  possible = last.possible;
  asked = last.asked;
  history = last.history;
  currentQuestion = QUESTIONS.find(q => q.id === last.currentQuestionId) ?? null;
  render();
}

function answerCurrent(answer) {
  if (!currentQuestion) return;
  saveSnapshot();

  if (answer !== "unknown") {
    const wanted = answer === "yes";
    possible = possible.filter(b => currentQuestion.test(b) === wanted);
  }

  asked.push(currentQuestion.id);
  history.push({ question: currentQuestion.text, answer });
  render();
}

function chooseBestQuestion() {
  const remainingQuestions = QUESTIONS.filter(q => !asked.includes(q.id));
  let best = null;
  let bestScore = Infinity;

  for (const q of remainingQuestions) {
    let yes = 0;
    let no = 0;

    for (const bird of possible) {
      q.test(bird) ? yes++ : no++;
    }

    if (yes === 0 || no === 0) continue;

    const splitBadness = Math.abs(yes - no);
    const questionPower = Math.min(yes, no);
    const score = splitBadness - questionPower * 0.01;

    if (score < bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best;
}

function shouldGuess(nextQuestion) {
  return possible.length <= 3 || asked.length >= MAX_TURNS || !nextQuestion;
}

function render() {
  const nextQuestion = chooseBestQuestion();
  const guessing = shouldGuess(nextQuestion);
  currentQuestion = guessing ? null : nextQuestion;

  $("turnText").textContent = `${asked.length}/${MAX_TURNS}`;
  $("remainingText").textContent = `${possible.length} left`;
  $("progressBar").style.width = `${Math.min(100, (asked.length / MAX_TURNS) * 100)}%`;
  $("candidateList").innerHTML = possible.map(birdCard).join("") || `<p class="muted">No candidates left. Something went sideways.</p>`;
  renderHistory();

  if (guessing) {
    $("mainTitle").textContent = "Final guess";
    $("questionCard").classList.add("hidden");
    $("guessCard").classList.remove("hidden");
    renderGuess();
  } else {
    $("mainTitle").textContent = `Question ${asked.length + 1}`;
    $("questionCard").classList.remove("hidden");
    $("guessCard").classList.add("hidden");
    $("questionText").textContent = currentQuestion.text;
  }
}

function renderGuess() {
  if (possible.length === 0) {
    $("guessIntro").textContent = "I got cooked.";
    $("guessList").innerHTML = `<p class="muted">No bird matches your answers. Either the bird is missing from the starter database, or one answer was off. This is why real field guides are thick as bricks.</p>`;
    return;
  }

  if (possible.length === 1) {
    $("guessIntro").textContent = "My guess is:";
    $("guessList").innerHTML = birdCard(possible[0], true);
    return;
  }

  $("guessIntro").textContent = `I narrowed it down to ${possible.length} candidates:`;
  $("guessList").innerHTML = possible.map(b => birdCard(b, true)).join("");
}

function renderHistory() {
  $("historyList").innerHTML = history.map(item => {
    const label = item.answer === "yes" ? "Yes" : item.answer === "no" ? "No" : "Not sure";
    return `<li>${escapeHtml(item.question)} <strong>${label}</strong></li>`;
  }).join("") || `<li class="muted">No answers yet.</li>`;
}

function birdCard(b, isGuess = false) {
  const tags = [b.size, ...(b.habitats || []).slice(0, 3), ...(b.shapes || []).slice(0, 2)]
    .map(t => `<span class="tag">${escapeHtml(t.replaceAll("_", " "))}</span>`).join("");

  return `<article class="bird-card ${isGuess ? "guess" : ""}">
    <h3>${escapeHtml(b.name)}</h3>
    <div class="sci">${escapeHtml(b.scientific)}</div>
    <p>${escapeHtml(b.notes)}</p>
    <div class="tags">${tags}</div>
  </article>`;
}

function restartToStart() {
  $("startPanel").classList.remove("hidden");
  $("gamePanel").classList.add("hidden");
  $("historyPanel").classList.add("hidden");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wireEvents() {
  document.querySelectorAll(".mode-card").forEach(btn => {
    btn.addEventListener("click", () => startGame(btn.dataset.mode));
  });

  document.querySelectorAll(".answer").forEach(btn => {
    btn.addEventListener("click", () => answerCurrent(btn.dataset.answer));
  });

  $("restartBtn").addEventListener("click", restartToStart);
  $("playAgainBtn").addEventListener("click", restartToStart);
  $("tryAllBtn").addEventListener("click", () => startGame("all"));
  $("undoBtn").addEventListener("click", undo);
}

function init() {
  $("birdCount").textContent = window.BIRD_DATABASE.length;
  wireEvents();
}

init();
