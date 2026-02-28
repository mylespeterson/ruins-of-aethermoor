export class HUD {
  constructor(game) {
    this.game = game;
  }

  render(r) {
    // Only shown in dungeon/town via ui_manager
    // Additional overlay info
    const state = this.game.state;
    if (state === 'DUNGEON' && this.game.dungeon) {
      const W = r.width;
      const floor = this.game.dungeon.floor;
      // Floor badge at top center
      r.drawRoundRect(W/2 - 55, 4, 110, 24, 4, 'rgba(0,0,0,0.7)', '#334466', 1);
      r.drawTextCentered(`Floor ${floor}`, W/2, 8, '#aaaaff', 15, 'monospace', true);
    }
  }
}
