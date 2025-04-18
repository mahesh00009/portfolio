// === Paragraph Show/Hide on Mobile ===
function removeParagraph() {
  const paragraph = document.getElementById('myParagraph');
  if (paragraph) {
    paragraph.style.display = 'none';
  }
}

function showParagraph() {
  const paragraph = document.getElementById('myParagraph');
  if (paragraph) {
    paragraph.style.display = 'block';
  }
}

const mediaQuery = window.matchMedia('(max-width: 768px)');
mediaQuery.addEventListener('change', () => {
  mediaQuery.matches ? removeParagraph() : showParagraph();
});
mediaQuery.matches ? removeParagraph() : showParagraph();


const today = new Date().toLocaleDateString();
let storedDate = localStorage.getItem('luckDate');
let luck = localStorage.getItem('dailyLuck');

if (storedDate !== today || luck === null) {
  luck = Math.floor(Math.random() * 51) + 50; // 50 - 100
  localStorage.setItem('dailyLuck', luck);
  localStorage.setItem('luckDate', today);
} else {
  luck = parseInt(luck);
}

const luckCanvas = document.createElement('canvas');
luckCanvas.width = 300;
luckCanvas.height = 50;
document.getElementById('luck-checker').appendChild(luckCanvas);
const luckCtx = luckCanvas.getContext('2d');

let currentWidth = 0;
const maxWidth = luckCanvas.width;
const barHeight = 30;
const targetWidth = (luck / 100) * maxWidth;
let currentLuckText = 0; // For animating the luck percentage text

function drawBackgroundBar() {
  luckCtx.fillStyle = '#eee';
  luckCtx.fillRect(0, 10, maxWidth, barHeight);
}

function drawProgressBar(width) {
  luckCtx.fillStyle = '#4caf50';
  luckCtx.fillRect(0, 10, width, barHeight);
}

function drawText() {
  luckCtx.font = '16px Arial';
  luckCtx.fillStyle = '#000';
  luckCtx.textAlign = 'center';
  luckCtx.fillText(`You have ${Math.round(currentLuckText)}% Luck Today`, luckCanvas.width / 2, 32); // Use animated text
}

function animateBar() {
  luckCtx.clearRect(0, 0, luckCanvas.width, luckCanvas.height);
  drawBackgroundBar();
  drawProgressBar(currentWidth);
  drawText();

  if (currentWidth < targetWidth) {
    currentWidth += 2;
    currentLuckText = (currentWidth / maxWidth) * 100; // Update the text value
    requestAnimationFrame(animateBar);
  } else if (currentLuckText < luck) { // Animate the final text value
    currentLuckText += 1; // Adjust the animation speed as needed
    requestAnimationFrame(animateBar);
  }
}

animateBar();

