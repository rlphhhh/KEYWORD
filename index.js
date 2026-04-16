const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
const CANVAS_WIDTH = (canvas.width = window.innerWidth);
const CANVAS_HEIGHT = (canvas.height = window.innerHeight);
let game = document.getElementById("gameover");

let p1 = document.getElementById("start");

let time = 180;
let timer = document.getElementById("timer");
let mis = 0;

function showGameOver() {
  // stop gameplay & timer
  gameRun = false;
  gameSpeed = 0;
  playerState = "idle";
  mis = 0;

  // hide mission/dialog UI that might be open
  parent?.style &&
    ((parent.style.visibility = "hidden"),
    (parent.style.pointerEvents = "none"));
  const diaWrap = document.getElementById("dia");
  diaWrap?.style &&
    ((diaWrap.style.visibility = "hidden"),
    (diaWrap.style.pointerEvents = "none"));

  // show gameover overlay (contains retry button)
  if (game) {
    game.style.visibility = "visible";
    game.style.pointerEvents = "all";
  }
}

function play() {
  /* playAudio() */
  gameRun = true;
  p1.remove();
}

let gameSpeed = 0;
let gameRun = false;
let prevGameRun = false; // remember running state before opening overlays
let ownedItems = new Set(); // track purchased shop items
let playerPos = 0;
let playerX = 200;
const playerSpeed = 5;
const playerWidth = 200;
const groundY = CANVAS_HEIGHT * 0.65; // Position player at 65% of canvas height
let playerY = groundY;
let jumping = false;
let jumpVelocity = 0;
const gravity = 0.6;
const jumpPower = -15;

const playerImage = new Image();
playerImage.src = "character/dawg.png";
let playerImageLoaded = false;
playerImage.onload = () => {
  playerImageLoaded = true;
};
const spriteWidth = 575;
const spriteHeight = 523;

let gameFrame = 0;
let staggerFrames = 4; // was 5 — slower player animation
let playerState = "idle";

//npc

const npcImage = new Image();
npcImage.src = "character/Larry.png";
let npcImageLoaded = false;
npcImage.onload = () => {
  npcImageLoaded = true;
};
const npcWidth = 32;
const npcHeight = 48;
let npcFrameX = 0;
let npcFrameY = 0; // 4th row (depending on your sprite sheet)
const npcMaxFrame = 4; // how many frames horizontally
let npcFrameCount = 0;
const npcStaggerFrames = 12; // was 8 — slower npc animation
let npcX =
  Math.floor(Math.random() * (CANVAS_WIDTH - CANVAS_WIDTH * 0.3 + 1)) +
  CANVAS_WIDTH * 0.3;

//coin

const coinImage = new Image();
coinImage.src = "character/coins.png";
const coinSheetWidth = 222;
const coinSheetHeight = 227;
const coinMaxFrame = 3; // 4 frames total → 0,1,2,3
const coinFrameWidth = coinSheetWidth / 4;
const coinFrameHeight = coinSheetHeight;
let coinFrameX = 0;
let coinFrameY = 0;
let coinFrameCount = 0;
const coinStaggerFrames = 20; // slowed coin animation
let coinX = randomSpawnX([npcX], 800);

const spriteAnimations = [];
const animationStates = [
  { name: "idle", frames: 7 },
  { name: "jump", frames: 7 },
  { name: "jumpd", frames: 7 },
  { name: "right", frames: 9 },
  { name: "emote", frames: 11 },
  { name: "um", frames: 5 },
  { name: "attack", frames: 7 },
];

const spriteLengths = {}; // cache lengths for faster access
animationStates.forEach((state, index) => {
  let frames = { loc: [] };
  for (let j = 0; j < state.frames; j++) {
    let positionX = j * spriteWidth;
    let positionY = index * spriteHeight;
    frames.loc.push({ x: positionX, y: positionY });
  }
  spriteAnimations[state.name] = frames;
  spriteLengths[state.name] = state.frames;
});

// Background
const backgroundLayer1 = new Image();
backgroundLayer1.src = "backgrounds/Untitled design.png";
const backgroundLayer2 = new Image();
backgroundLayer2.src = "backgrounds/ulap.png";
const backgroundLayer3 = new Image();
backgroundLayer3.src = "backgrounds/grasss.png";
const backgroundLayer4 = new Image();
backgroundLayer4.src = "backgrounds/bato.png";
const backgroundLayer5 = new Image();
backgroundLayer5.src = "backgrounds/tree.png";
const backgroundLayer6 = new Image();
backgroundLayer6.src = "backgrounds/sunsun.png";

class Layer {
  constructor(image, speedModifier) {
    this.x = 0;
    this.y = 0;
    this.width = CANVAS_WIDTH;
    this.height = CANVAS_HEIGHT;
    this.x2 = this.width;
    this.image = image;
    this.speedModifier = speedModifier;
    this.speed = gameSpeed * this.speedModifier;
  }
  update() {
    // compute speed once
    const s = (this.speed = gameSpeed * this.speedModifier);
    if (s === 0) return; // nothing to do if not moving

    this.x -= s;
    this.x2 -= s;

    // wrap using while to handle large deltas robustly
    const w = this.width;
    while (this.x <= -w) this.x += w * 2;
    while (this.x2 <= -w) this.x2 += w * 2;
    while (this.x >= w) this.x -= w * 2;
    while (this.x2 >= w) this.x2 -= w * 2;
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.drawImage(this.image, this.x2, this.y, this.width, this.height);
  }
}

const layer1 = new Layer(backgroundLayer1, 1); // sky
const layer2 = new Layer(backgroundLayer2, 2);
const layer3 = new Layer(backgroundLayer3, 3);
const layer4 = new Layer(backgroundLayer4, 4);
const layer5 = new Layer(backgroundLayer5, 5);
const layer6 = new Layer(backgroundLayer6, 0); // front
// Draw order matters: earlier items render behind later ones.
let gameObjects = [layer1, layer2, layer3, layer6, layer5, layer4];

let currentLevel = 1;

const levels = {
  1: {
    dialogue: "Giving or telling something to others",
    answer: "Share",
    time: 30,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.4) + CANVAS_WIDTH * 0.2,
  },
  2: {
    dialogue: "To look at similarities and differences",
    answer: "Compare",
    time: 25,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.35) + CANVAS_WIDTH * 0.2,
  },
  3: {
    dialogue: "Knowledge or skill gained from doing something",
    answer: "Experience",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.3) + CANVAS_WIDTH * 0.2,
  },
  4: {
    dialogue: "To arrange things in order",
    answer: "Organize",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.25) + CANVAS_WIDTH * 0.2,
  },
  5: {
    dialogue: "To show how something works",
    answer: "Demonstrate",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  6: {
    dialogue: "Difficult task or situation that tests your abilites",
    answer: "Challenge",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  7: {
    dialogue: "to introduce something new or make changes to improve something",
    answer: "Innovate",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  8: {
    dialogue:
      "To make an abstract or genaral idea inferred from specific instances",
    answer: "Concept",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  9: {
    dialogue: "To successfully complete or reach a goal after a period of time",
    answer: "Achieve",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  10: {
    dialogue: "A chance to do something useful",
    answer: "Opportunity",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  11: {
    dialogue: "The achievement of a goal or the positive outcome of an effort",
    answer: "Success",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  12: {
    dialogue:
      "To work jointly with others or together especially in an intellectual endeavor",
    answer: "Collaborate",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  13: {
    dialogue:
      "The act, process, or result of making something better, increasing its value, or advancing in quality",
    answer: "Improvement",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  14: {
    dialogue:
      "To make up for a loss, injury, or shortcoming, or to provide payment for work or services",
    answer: "Compensate",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  15: {
    dialogue:
      "To combine multiple ideas, elements, or substances to create a new, complex whole",
    answer: "Synthesize",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  16: {
    dialogue: "The collecting of information about a particular subject",
    answer: "Research",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  17: {
    dialogue:
      "To lie in wait in a place of concealment especially for an evil purpose",
    answer: "Lurking",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  18: {
    dialogue:
      "One who advocates or practices activism: a person who uses or supports strong actions (such as public protests) in support of or opposition to one side of a controversial issue",
    answer: "Activists",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  19: {
    dialogue: "To come together into a group, crowd, or assembly",
    answer: "Congregate",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
  20: {
    dialogue:
      "To give pleasure, satisfaction, or to indulge a need, desire, or whim",
    answer: "Gratify",
    time: 20,
    npcX: () =>
      Math.floor(Math.random() * CANVAS_WIDTH * 0.2) + CANVAS_WIDTH * 0.2,
  },
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomSpawnX(excludeXs = [], minDistance = 600) {
  let x;
  do {
    x =
      Math.floor(Math.random() * (CANVAS_WIDTH * 1.5 - CANVAS_WIDTH + 1)) +
      CANVAS_WIDTH;
  } while (excludeXs.some((other) => Math.abs(x - other) < minDistance));
  return x;
}

function spawnNpcForLevel(level) {
  const fn = levels?.[level]?.npcX;
  if (typeof fn === "function") return fn();
  return CANVAS_WIDTH * randomBetween(0.55, 0.85);
}

let dialogueActive = false;

// visibility / rAF throttling
let rafId = null;
let pageHidden = document.hidden;
document.addEventListener("visibilitychange", () => {
  pageHidden = document.hidden;
  if (!pageHidden && rafId === null) {
    // resume loop
    animate();
  }
});

function animate() {
  // stop scheduling more rAF if page hidden — use setTimeout low-frequency tick instead
  if (pageHidden) {
    // do a very cheap tick every 200ms to keep UI responsive
    setTimeout(animate, 200);
    return;
  }

  // cache locals for faster access
  const c = ctx;
  c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // update/draw layers
  for (let i = 0, len = gameObjects.length; i < len; i++) {
    const obj = gameObjects[i];
    obj.update();
    obj.draw();
  }

  if (gameRun) {
    if (!jumping) {
      playerState = "right";
    }
    // coin animation update
    coinFrameCount++;
    if (coinFrameCount % coinStaggerFrames === 0) {
      coinFrameX = (coinFrameX + 1) % (coinMaxFrame + 1);
    }

    gameSpeed = 2.5;
    playerPos += 0.6;
    // Move world objects towards player (increase multiplier if NPC feels too far)
    const worldMove = gameSpeed * 2.2;
    npcX -= worldMove;
    coinX -= worldMove;
  } else {
    if (!jumping) {
      playerState = "idle";
    }
    gameSpeed = 0;
  }

  if (jumping) {
    playerY += jumpVelocity;
    jumpVelocity += gravity;
    if (jumpVelocity > 0 && playerState === "jump") {
      playerState = "jumpd";
    }
    if (playerY >= groundY) {
      playerY = groundY;
      jumping = false;
      if (gameRun) {
        playerState = "right";
      } else {
        playerState = "idle";
      }
    }
  }

  // draw NPC only when on screen and loaded
  if (npcImageLoaded && npcX + 200 >= 0 && npcX <= CANVAS_WIDTH) {
    c.drawImage(npcImage, npcX, CANVAS_HEIGHT * 0.65, 200, 200);
  }

  // draw coin only when on screen
  if (coinX + 200 >= 0 && coinX <= CANVAS_WIDTH) {
    c.drawImage(
      coinImage,
      coinFrameX * coinFrameWidth,
      coinFrameY * coinFrameHeight,
      coinFrameWidth,
      coinFrameHeight,
      coinX,
      CANVAS_HEIGHT * 0.7,
      200,
      200,
    );
  }

  // player sprite (skip if completely offscreen)
  if (playerImageLoaded && playerX + 200 >= 0 && playerX <= CANVAS_WIDTH) {
    const frames = spriteAnimations[playerState];
    const totalFrames = spriteLengths[playerState] || frames.loc.length;
    const position = Math.floor(gameFrame / staggerFrames) % totalFrames;
    const frameX = spriteWidth * position;
    const frameY = frames.loc[position].y;
    c.drawImage(
      playerImage,
      frameX,
      frameY,
      spriteWidth,
      spriteHeight,
      playerX,
      playerY,
      200,
      200,
    );
  }

  gameFrame++;
  rafId = requestAnimationFrame(animate);

  checkGame();
}

setInterval(() => {
  if (mis !== 1) return;
  if (time > 0) {
    time -= 1;
    timer.innerHTML = time;
    return;
  }
  // time ran out
  showGameOver();
}, 1000);

let parent = document.getElementById("mis1");
let dia1 = document.getElementById("dia1");
let diaWrap = document.getElementById("dia");
let ansBox = document.getElementById("tt");

// Allow pressing Enter in the answer box to submit
ansBox.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    ans();
  }
});

// Auto-capitalize first letter of each word while typing
ansBox.addEventListener("input", function () {
  let value = ansBox.value;
  let formatted = value
    .split(" ")
    .map((word) =>
      word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : "",
    )
    .join(" ");
  if (formatted !== value) {
    ansBox.value = formatted;
  }
});

let attackCooldown = 5000; // 5 seconds
let lastAttackTime = 0;

let hints = 0;

// Score (awarded for correctly answering dialogues/levels)
let score = 0;
const scoredLevels = new Set(); // ensures each level only awards once
const scoreText = document.getElementById("scoreText");

function pointsForDialogueLevel(level) {
  if (level >= 1 && level <= 5) return 1;
  if (level >= 6 && level <= 10) return 2;
  if (level >= 11 && level <= 15) return 5;
  if (level >= 16 && level <= 20) return 10;
  return 0;
}

function updateScoreHud() {
  if (scoreText) scoreText.textContent = String(score);
}

function checkGame() {
  // NPC collision — check for overlap with offset
  if (!dialogueActive && npcX <= playerX) {
    gameRun = false;
    dialogueActive = true;

    diaWrap.style.visibility = "visible";
    diaWrap.style.pointerEvents = "all";

    if (levels[currentLevel]) {
      dia1.innerHTML = levels[currentLevel].dialogue;

      // ✅ set hint ONLY ONCE
      setHint();
    }

    // keep NPC visible near player while dialog is active
    npcX = playerX + 50;

    // autofocus the answer box
    ansBox.focus();

    // reset any previous wrong answer styling
    ansBox.style.border = "";
    ansBox.style.backgroundColor = "";
    parent.style.backgroundColor = "";
  }

  // Coin collection — check for overlap with offset
  // Coin collection — check for overlap with offset
  if (coinX - 50 <= playerX) {
    // award random coin amount (1-5)
    let coinAdd = Math.floor(Math.random() * 5) + 1;
    coins += coinAdd;
    coinText.innerHTML = coins;

    // play sound if audio enabled
    if (audioOn) {
      playDing();
    }

    // respawn coin far ahead
    coinX = randomSpawnX([npcX], 800);
  }
}

document.addEventListener("keydown", function (event) {
  // don't process key input when game is paused/stopped
  if (!gameRun) return;

  if (event.key === " ") {
    if (!jumping) {
      jumping = true;
      jumpVelocity = jumpPower;
      playerState = "jump";
    }
  }

  // placeholder for future controls (kept minimal to avoid prior commented-block syntax errors)
  // e.g. if (event.key === "d") { /* move right logic */ }
});

document.addEventListener("keyup", function (event) {
  playerState = "idle";
  gameSpeed = 0;
});

function setHint() {
  if (!levels[currentLevel]) return;

  let word = levels[currentLevel].answer;
  let hint = "";

  for (let i = 0; i < word.length; i++) {
    if (i === 0 || i === word.length - Math.floor(Math.random() * 5) + 1) {
      hint += word[i]; // show first and last letter
    } else {
      hint += " _ ";
    }
  }

  ansBox.placeholder = hint;
}

let coins = 0;

let coinText = document.getElementById("cText");

let coinIm = document.getElementById("cImage");

let ding = new Audio("./Ding Sound Effect.mp3");

function playDing() {
  ding.play();
}

function ans() {
  dialogueActive = false;
  hints = 0;

  let answer = parent.children[1].value.trim().toLowerCase();

  parent.style.visibility = "visible";
  parent.style.pointerEvents = "all";

  if (answer === levels[currentLevel].answer.toLowerCase()) {
    if (audioOn) {
      playDing();
    }

    // Award score based on which dialogue (level) was answered correctly
    if (!scoredLevels.has(currentLevel)) {
      scoredLevels.add(currentLevel);
      score += pointsForDialogueLevel(currentLevel);
      updateScoreHud();
    }

    let coinAdd = Math.floor(Math.random() * 5) + 1;

    coins += coinAdd;

    // Hide the input
    parent.style.visibility = "hidden";
    parent.style.pointerEvents = "none";

    // Hide dialogue
    diaWrap.style.visibility = "hidden";
    diaWrap.style.pointerEvents = "none";

    // Stop timer
    mis = 0;
    gameRun = true;

    // Move NPC ahead (closer than before so it doesn't take too long)
    npcX =
      spawnNpcForLevel(currentLevel + 1) +
      CANVAS_WIDTH * randomBetween(0.15, 0.35);

    // Reset input field
    parent.children[1].value = "";

    // Increment level so next NPC has new dialogue
    currentLevel += 1;

    coinText.innerHTML = coins;

    return true;
  } else {
    parent.style.backgroundColor = "rgba(8, 52, 30, 0.97)";
    ansBox.style.border = "2px solid rgba(86, 255, 141, 0.7)";
    ansBox.style.backgroundColor = "rgba(12, 58, 34, 0.55)";
    return false;
  }
}

function closeD(btn) {
  let diaa = document.getElementById(`${btn.id}`);

  let correct = ans();

  if (!correct) {
    // Only resume timer if WRONG
    mis = 1;
  }

  // If correct, mis = 0 from ans(), so timer stops
}

function closeA() {
  game.remove();
  mis = 0;
  window.location.reload();
}

let settInterface = document.getElementById("sett");
let audioEnabled = true;
let audioButton = document.getElementById("audio");
let shopOverlay = document.getElementById("shop-overlay");

function sett() {
  // remember whether the game was running and then pause
  prevGameRun = gameRun;
  settInterface.style.visibility = "visible";
  settInterface.style.pointerEvents = "all";
  gameRun = false;
  gameSpeed = 0;
  playerState = "idle";
}

function cont() {
  settInterface.style.visibility = "hidden";
  settInterface.style.pointerEvents = "none";
  // only resume if game was running before opening settings
  gameRun = !!prevGameRun;
}

/* let myMusic = new Audio('./it.mp3'); */

let audioOn = true;

function toggleAudio() {
  audioEnabled = !audioEnabled;

  if (audioEnabled) {
    /* playAudio() */
    audioButton.textContent = "ON";
  } else {
    /* myMusic.pause(); */
    audioOn = false;
    audioButton.textContent = "OFF";
  }
}

function shop() {
  // remember whether the game was running and then pause
  prevGameRun = gameRun;
  gameRun = false;
  if (shopOverlay) {
    shopOverlay.style.visibility = "visible";
    shopOverlay.style.pointerEvents = "all";

    // Ensure shop character images fit in their boxes
    // target images inside the overlay and adjust sizing/boxing
    const imgs = shopOverlay.querySelectorAll("img, .shop-character");
    imgs.forEach((img) => {
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";
      img.style.width = "100%";
      img.style.height = "auto";
      // ensure parent box centers and hides overflow
      const p = img.parentElement;
      if (p) {
        p.style.overflow = "hidden";
        p.style.display = "flex";
        p.style.alignItems = "center";
        p.style.justifyContent = "center";
      }
    });

    // update buy buttons to reflect owned items
    const buyButtons = shopOverlay.querySelectorAll("[data-item]");
    buyButtons.forEach((btn) => {
      const id = btn.dataset.item || btn.id;
      if (ownedItems.has(id)) {
        btn.textContent = "Owned";
        btn.disabled = true;
        btn.classList.add("owned");
      }
    });
  }
}

function closeShop() {
  if (shopOverlay) {
    shopOverlay.style.visibility = "hidden";
    shopOverlay.style.pointerEvents = "none";
  }
  // Only resume game if start screen has been removed and the game was running before opening shop
  if (document.getElementById("start") === null) {
    gameRun = !!prevGameRun;
  }
}

function BUY(event) {
  const buyButton = event?.currentTarget;
  if (!buyButton) return;

  // identify the shop item (use data-item attribute if available, otherwise fallback to id)
  const itemId = buyButton.dataset?.item || buyButton.id || "shop-item";

  // already owned?
  if (ownedItems.has(itemId)) {
    // ensure UI shows Owned
    buyButton.textContent = "Owned";
    buyButton.disabled = true;
    buyButton.classList.add("owned");
    alert("Owned");
    return;
  }

  // click animation
  buyButton.classList.remove("buy-clicked");
  void buyButton.offsetWidth;
  buyButton.classList.add("buy-clicked");

  const PRICE = 10;
  if (coins >= PRICE) {
    // mark owned in UI
    coins -= PRICE;
    coinText.innerHTML = coins;
    ownedItems.add(itemId);
    buyButton.textContent = "Owned";
    buyButton.disabled = true;
    buyButton.classList.add("owned");
    alert("Purchased");
  } else {
    alert("Not enough coins");
  }
}

/* function playAudio(){
    myMusic.play()
}

function stopAudio(){
    myMusic.stop()
} */

// call animate after everything is declared
animate();
