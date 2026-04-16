const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
const CANVAS_WIDTH = (canvas.width = 1400);
const CANVAS_HEIGHT = (canvas.height = 700);
let game = document.getElementById("gameover");

let p1 = document.getElementById("start");

let time = 5;
let timer = document.getElementById("timer");
let mis = 0;

function play() {
  gameRun = true;
  p1.remove();
}

let gameSpeed = 0;
let gameRun = false;
let playerPos = 0;
let playerX = 200;
const playerSpeed = 5;
const playerWidth = 200;
const groundY = 390;

const playerImage = new Image();
playerImage.src = "character/dawg.png";
const spriteWidth = 575;
const spriteHeight = 523;

let gameFrame = 0;
let staggerFrames = 3;
let playerState = "idle";

//npc

const npcImage = new Image();
npcImage.src = "character/stormtrooper.png";
const npcWidth = 32;
const npcHeight = 48;
let npcFrameX = 0;
let npcFrameY = 0; // 4th row (depending on your sprite sheet)
const npcMaxFrame = 3; // how many frames horizontally
let npcFrameCount = 0;
const npcStaggerFrames = 8; // how fast to animate
let npcX = Math.floor(Math.random() * (1900 - 500 + 1)) + 500;
300;

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

animationStates.forEach((state, index) => {
  let frames = { loc: [] };
  for (let j = 0; j < state.frames; j++) {
    let positionX = j * spriteWidth;
    let positionY = index * spriteHeight;
    frames.loc.push({ x: positionX, y: positionY });
  }
  spriteAnimations[state.name] = frames;
});

// Background
const backgroundLayer1 = new Image();
backgroundLayer1.src = "backgrounds/layer-1.png";
const backgroundLayer2 = new Image();
backgroundLayer2.src = "backgrounds/layer-2.png";
const backgroundLayer3 = new Image();
backgroundLayer3.src = "backgrounds/layer-3.png";
const backgroundLayer4 = new Image();
backgroundLayer4.src = "backgrounds/layer-4.png";
const backgroundLayer5 = new Image();
backgroundLayer5.src = "backgrounds/layer-5.png";

class Layer {
  constructor(image, speedModifier) {
    this.x = 0;
    this.y = 0;
    this.width = 2100;
    this.height = 700;
    this.x2 = this.width;
    this.image = image;
    this.speedModifier = speedModifier;
    this.speed = gameSpeed * this.speedModifier;
  }
  update() {
    this.speed = gameSpeed * this.speedModifier;

    this.x -= this.speed;
    this.x2 -= this.speed;

    if (this.x <= -this.width) {
      this.x = this.x2 + this.width;
    }

    if (this.x >= this.width) {
      this.x = this.x2 - this.width;
    }

    if (this.x2 <= -this.width) {
      this.x2 = this.x + this.width;
    }

    if (this.x2 >= this.width) {
      this.x2 = this.x - this.width;
    }
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.drawImage(this.image, this.x2, this.y, this.width, this.height);
  }
}

const layer1 = new Layer(backgroundLayer1, 5);
const layer2 = new Layer(backgroundLayer2, 5);
const layer3 = new Layer(backgroundLayer3, 5);
const layer4 = new Layer(backgroundLayer4, 5);
const layer5 = new Layer(backgroundLayer5, 5);
let gameObjects = [layer1, layer2, layer3, layer4, layer5];

function animate() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  gameObjects.forEach((object) => {
    object.update();
    object.draw();
  });

  npcFrameCount++;
  if (npcFrameCount % npcStaggerFrames === 0) {
    npcFrameX = (npcFrameX + 1) % (npcMaxFrame + 1);
  }

  // draw npc (same Y level as player)
  ctx.drawImage(
    npcImage,
    npcFrameX * npcWidth,
    npcFrameY * npcHeight,
    npcWidth,
    npcHeight,
    npcX, // X position on screen
    390, // same as player Y inangat ko lang baliw
    200, // scale width
    200, // scale heightWAIT NAY TINETESTING gegegej
  );

  let position =
    Math.floor(gameFrame / staggerFrames) %
    spriteAnimations[playerState].loc.length;
  let frameX = spriteWidth * position;
  let frameY = spriteAnimations[playerState].loc[position].y;

  ctx.drawImage(
    playerImage,
    frameX,
    frameY,
    spriteWidth,
    spriteHeight,
    playerX,
    groundY,
    200,
    200,
  );

  if (mis === 1) {
    timer.innerHTML = time;
  }

  if (time === 0) {
    gameRun = false;
    game.style.visibility = "visible";
    game.style.pointerEvents = "all";
  }

  gameFrame++;
  requestAnimationFrame(animate);
}
animate();

setInterval(() => {
  if (mis === 1 && time > 0) {
    time -= 1;
    timer.innerHTML = time;
  }
}, 1000);

let parent = document.getElementById("mis1");
let dia1 = document.getElementById("dia1");

document.addEventListener("keydown", function (event) {
  if (!gameRun) return;

  if (npcX - 50 <= playerPos) {
    dia1.style.visibility = "visible";
    dia1.style.pointerEvents = "all";
    npcX = 0;
    gameRun = false;
  }

  if (event.key === "d") {
    playerState = "right";
    gameSpeed = 2.5;
    playerPos += 1;
    npcX -= 10;
  }
  if (event.key === "a") {
    playerPos -= 1;
    playerState = "right";
    gameSpeed = -1;
    npcX += 10;
    if (playerPos <= -1) {
      gameSpeed = 0;
    }
  }
  if (event.key === "e") {
    playerState = "emote";
    playerPos = playerPos;
  }
});

document.addEventListener("keyup", function (event) {
  playerState = "idle";
  gameSpeed = 0;
});

function ans() {
  let answer = parent.children[1].value;

  parent.style.visibility = "visible";
  parent.style.pointerEvents = "all";

  if (answer === "patalom") {
    parent.remove();
    gameRun = true;

    // STOP THE TIMER HERE
    mis = 0;

    return true;
  } else {
    parent.style.backgroundColor = "rgba(8, 52, 30, 0.97)";

    // WRONG → timer DOES NOT STOP
    // NO reset, NO timer change
    return false;
  }
}

function closeD(btn) {
  let diaa = document.getElementById(`${btn.id}`);

  let correct = ans();

  diaa.remove();

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
