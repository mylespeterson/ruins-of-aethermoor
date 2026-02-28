import { Game } from './engine/game.js';

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  document.body.innerHTML = '<p style="color:red">Canvas not found!</p>';
  throw new Error('Canvas element not found');
}

// Scale canvas to window while maintaining aspect ratio
function resize() {
  const scaleX = window.innerWidth / canvas.width;
  const scaleY = window.innerHeight / canvas.height;
  const scale = Math.min(scaleX, scaleY);
  canvas.style.width = (canvas.width * scale) + 'px';
  canvas.style.height = (canvas.height * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

const game = new Game(canvas);
game.start();

// Make game accessible for debugging
window.game = game;
