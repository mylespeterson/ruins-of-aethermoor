export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.keysJustPressed = {};
    this.keysJustReleased = {};
    this.mouse = { x: 0, y: 0, clicked: false, justClicked: false, rightClicked: false };
    this._clickedThisFrame = false;
    this._rightClickedThisFrame = false;
    this._setupListeners();
  }

  _setupListeners() {
    window.addEventListener('keydown', e => {
      if (!this.keys[e.code]) {
        this.keysJustPressed[e.code] = true;
      }
      this.keys[e.code] = true;
      // Prevent scrolling with arrow keys and browser tab focus trapping
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      this.keysJustReleased[e.code] = true;
    });
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });
    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
      this._clickedThisFrame = true;
      this.mouse.clicked = true;
    });
    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      this._rightClickedThisFrame = true;
      this.mouse.rightClicked = true;
    });
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.focus();
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  isKeyJustPressed(code) {
    return !!this.keysJustPressed[code];
  }

  wasClicked() {
    return this._clickedThisFrame;
  }

  wasRightClicked() {
    return this._rightClickedThisFrame;
  }

  isMouseOver(x, y, w, h) {
    return this.mouse.x >= x && this.mouse.x <= x+w &&
           this.mouse.y >= y && this.mouse.y <= y+h;
  }

  isClickIn(x, y, w, h) {
    return this._clickedThisFrame && this.isMouseOver(x, y, w, h);
  }

  endFrame() {
    this.keysJustPressed = {};
    this.keysJustReleased = {};
    this._clickedThisFrame = false;
    this._rightClickedThisFrame = false;
    this.mouse.clicked = false;
    this.mouse.justClicked = false;
  }

  // Directional helpers
  getMoveDir() {
    let dx = 0, dy = 0;
    if (this.isKeyJustPressed('ArrowUp') || this.isKeyJustPressed('KeyW')) dy = -1;
    if (this.isKeyJustPressed('ArrowDown') || this.isKeyJustPressed('KeyS')) dy = 1;
    if (this.isKeyJustPressed('ArrowLeft') || this.isKeyJustPressed('KeyA')) dx = -1;
    if (this.isKeyJustPressed('ArrowRight') || this.isKeyJustPressed('KeyD')) dx = 1;
    return { dx, dy };
  }
}
