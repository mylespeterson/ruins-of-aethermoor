import { Party } from '../entities/party.js';
import { Character } from '../entities/character.js';
import { RACES } from '../data/races.js';
import { CLASSES } from '../data/classes.js';

const RACE_IDS = Object.keys(RACES);
const CLASS_IDS = Object.keys(CLASSES);

export class PartyCreation {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.step = 0; // 0-3: creating 4 characters
    this.subStep = 0; // 0=name, 1=race, 2=class, 3=confirm
    this.currentName = '';
    this.selectedRace = 0;
    this.selectedClass = 0;
    this.createdChars = [];
    this.cursor = 0;
    this.raceScroll = 0;
    this.classScroll = 0;
    this.nameInput = '';
    this.errorMsg = '';
    this.classTabCols = 4;
  }

  onEnter() { this.reset(); }

  update(dt) {
    const input = this.game.input;
    const W = this.game.canvas.width, H = this.game.canvas.height;
    if (input.isKeyJustPressed('Escape') && this.step === 0 && this.subStep === 0) {
      this.game.setState('MAIN_MENU');
      return;
    }
    switch(this.subStep) {
      case 0: this._updateNameInput(input); break;
      case 1: this._updateRaceSelect(input, W, H); break;
      case 2: this._updateClassSelect(input, W, H); break;
      case 3: this._updateConfirm(input, W, H); break;
    }
  }

  _updateNameInput(input) {
    // Handle keyboard for name
    if (input.isKeyJustPressed('Backspace') && this.nameInput.length > 0) {
      this.nameInput = this.nameInput.slice(0, -1);
      this.errorMsg = '';
    }
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      if (this.nameInput.trim().length === 0) {
        this.nameInput = this._getDefaultName();
      }
      this.subStep = 1;
      return;
    }
    // Letter keys
    Object.keys(this.game.input.keysJustPressed).forEach(code => {
      if (code.startsWith('Key') && this.nameInput.length < 12) {
        const letter = code.slice(3);
        this.nameInput += this.game.input.keys['ShiftLeft'] || this.game.input.keys['ShiftRight']
          ? letter.toUpperCase() : letter.toLowerCase();
      }
      if (code === 'Space' && this.nameInput.length < 12 && this.nameInput.length > 0) {
        this.nameInput += ' ';
      }
    });
    // Click next button
    const W = this.game.canvas.width, H = this.game.canvas.height;
    if (this.game.input.isClickIn(W/2 - 80, H - 100, 160, 44)) {
      if (this.nameInput.trim().length === 0) this.nameInput = this._getDefaultName();
      this.subStep = 1;
    }
  }

  _getDefaultName() {
    const defaults = ['Aria','Brom','Cyra','Dex'];
    return defaults[this.step] || `Hero${this.step+1}`;
  }

  _updateRaceSelect(input, W, H) {
    const raceListY = 160, raceH = 58, raceW = 260;
    const visCount = Math.min(6, RACE_IDS.length);
    RACE_IDS.forEach((raceId, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      const by = raceListY + row * raceH;
      const bx = W/2 - raceW - 5 + col * (raceW + 10);
      if (input.isClickIn(bx, by, raceW, raceH - 4)) {
        this.selectedRace = i;
      }
    });
    if (input.isKeyJustPressed('ArrowRight')) this.selectedRace = Math.min(RACE_IDS.length-1, this.selectedRace + 1);
    if (input.isKeyJustPressed('ArrowLeft')) this.selectedRace = Math.max(0, this.selectedRace - 1);
    if (input.isKeyJustPressed('ArrowDown')) this.selectedRace = Math.min(RACE_IDS.length-1, this.selectedRace + 2);
    if (input.isKeyJustPressed('ArrowUp')) this.selectedRace = Math.max(0, this.selectedRace - 2);
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) { this.subStep = 2; }
    if (input.isKeyJustPressed('Escape')) { this.subStep = 0; }
    if (input.isClickIn(W/2 + 80, H - 100, 120, 44)) { this.subStep = 2; }
    if (input.isClickIn(W/2 - 200, H - 100, 120, 44)) { this.subStep = 0; }
  }

  _updateClassSelect(input, W, H) {
    const classListY = 160, classH = 52, classW = 200;
    const cols = 4;
    CLASS_IDS.forEach((clsId, i) => {
      const row = Math.floor(i / cols), col = i % cols;
      const bx = 20 + col * (classW + 5);
      const by = classListY + row * classH;
      if (input.isClickIn(bx, by, classW, classH - 4)) {
        this.selectedClass = i;
      }
    });
    if (input.isKeyJustPressed('ArrowRight')) this.selectedClass = Math.min(CLASS_IDS.length-1, this.selectedClass + 1);
    if (input.isKeyJustPressed('ArrowLeft')) this.selectedClass = Math.max(0, this.selectedClass - 1);
    if (input.isKeyJustPressed('ArrowDown')) this.selectedClass = Math.min(CLASS_IDS.length-1, this.selectedClass + cols);
    if (input.isKeyJustPressed('ArrowUp')) this.selectedClass = Math.max(0, this.selectedClass - cols);
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) { this.subStep = 3; }
    if (input.isKeyJustPressed('Escape')) { this.subStep = 1; }
    if (input.isClickIn(W - 140, H - 100, 120, 44)) { this.subStep = 3; }
    if (input.isClickIn(W - 280, H - 100, 120, 44)) { this.subStep = 1; }
  }

  _updateConfirm(input, W, H) {
    if (input.isKeyJustPressed('Enter') || input.isClickIn(W/2 - 80, H - 100, 160, 44)) {
      this._confirmCharacter();
    }
    if (input.isKeyJustPressed('Escape') || input.isClickIn(W/2 - 220, H - 100, 120, 44)) {
      this.subStep = 2;
    }
  }

  _confirmCharacter() {
    const raceId = RACE_IDS[this.selectedRace];
    const classId = CLASS_IDS[this.selectedClass];
    const char = new Character(this.nameInput.trim() || this._getDefaultName(), raceId, classId);
    this.createdChars.push(char);
    if (this.createdChars.length >= 4) {
      this._finishCreation();
    } else {
      this.step++;
      this.subStep = 0;
      this.nameInput = '';
      this.selectedRace = 0;
      this.selectedClass = 0;
    }
  }

  _finishCreation() {
    const party = new Party();
    party.members = [];
    this.createdChars.forEach(c => party.addMember(c));
    this.game.party = party;
    // Start the overworld for new games
    this.game.startOverworld();
  }

  render(r) {
    const W = r.width, H = r.height;
    r.drawGradientBG(0, 0, W, H, '#080818', '#18082a');
    // Title
    r.drawTextCentered(`Create Character ${this.step+1} of 4`, W/2, 20, '#aaaaff', 28, 'monospace', true);
    // Progress
    for (let i = 0; i < 4; i++) {
      const done = i < this.createdChars.length;
      const active = i === this.step;
      const col = done ? '#44ff88' : active ? '#ffdd44' : '#445566';
      r.drawRoundRect(W/2 - 110 + i * 60, 55, 50, 16, 4, col, '#888888', 1);
    }
    switch(this.subStep) {
      case 0: this._renderNameStep(r); break;
      case 1: this._renderRaceStep(r); break;
      case 2: this._renderClassStep(r); break;
      case 3: this._renderConfirmStep(r); break;
    }
    // Previously created chars
    if (this.createdChars.length > 0) {
      r.drawText('Created:', 10, H - 80, '#888899', 13);
      this.createdChars.forEach((c, i) => {
        r.drawText(`${c.name} (${c.raceId}/${c.classId})`, 10, H - 60 + i * 18, '#aaaacc', 12);
      });
    }
  }

  _renderNameStep(r) {
    const W = r.width, H = r.height;
    r.drawTextCentered('Step 1: Enter Name', W/2, 90, '#ffdd88', 22, 'monospace', true);
    r.drawRoundRect(W/2 - 150, H/2 - 40, 300, 50, 6, '#1a1a3a', '#5555aa', 2);
    const displayName = this.nameInput + (Math.floor(Date.now() / 500) % 2 ? '|' : ' ');
    r.drawText(displayName, W/2 - 140, H/2 - 28, '#ffffff', 24);
    r.drawTextCentered('Type a name (up to 12 chars)', W/2, H/2 + 20, '#888899', 14);
    r.drawTextCentered('Press Enter or click to continue', W/2, H/2 + 44, '#666677', 13);
    const hov = this.game.input.isMouseOver(W/2-80, H-100, 160, 44);
    r.drawButton(W/2-80, H-100, 160, 44, 'Next', hov);
  }

  _renderRaceStep(r) {
    const W = r.width, H = r.height;
    r.drawTextCentered('Step 2: Choose Race', W/2, 90, '#ffdd88', 22, 'monospace', true);
    const raceH = 58, raceW = 260;
    RACE_IDS.forEach((raceId, i) => {
      const race = RACES[raceId];
      const row = Math.floor(i / 2), col = i % 2;
      const bx = W/2 - raceW - 5 + col * (raceW + 10);
      const by = 155 + row * raceH;
      const selected = i === this.selectedRace;
      const hov = this.game.input.isMouseOver(bx, by, raceW, raceH-4);
      r.drawRoundRect(bx, by, raceW, raceH-4, 5,
        selected ? '#2a2a6a' : hov ? '#1e1e4e' : '#141428',
        selected ? '#aaaaff' : '#445566', selected ? 2 : 1);
      r.drawText(race.name, bx+8, by+5, selected ? '#ffffff' : '#aaaacc', 16, 'left', 'monospace', selected);
      // Stat summary
      const mods = race.statMods;
      const statStr = Object.entries(mods).map(([k,v]) => `${k}${v>0?'+':''}${v}`).join(' ');
      r.drawText(statStr, bx+8, by+26, '#7799aa', 11);
      r.drawText(race.passive.name, bx+8, by+40, '#aa88ff', 11);
    });
    // Selected race details
    const race = RACES[RACE_IDS[this.selectedRace]];
    if (race) {
      r.drawBorderBox(W - 280, 155, 270, 180, 'Race Info');
      r.drawText(race.name, W-270, 175, '#ffdd88', 18, 'left', 'monospace', true);
      r.drawText(race.description, W-270, 200, '#aaaacc', 13);
      r.drawText(`HP: ${race.hpMod >= 1 ? '+':''}${Math.round((race.hpMod-1)*100)}%  MP: ${race.mpMod >= 1 ? '+':''}${Math.round((race.mpMod-1)*100)}%`, W-270, 220, '#88ccff', 13);
      r.drawText(`Passive: ${race.passive.name}`, W-270, 240, '#aa88ff', 13);
      r.drawText(race.passive.description, W-270, 258, '#888899', 12);
    }
    const hovBack = this.game.input.isMouseOver(W/2-200, H-100, 120, 44);
    r.drawButton(W/2-200, H-100, 120, 44, 'Back', hovBack);
    const hovNext = this.game.input.isMouseOver(W/2+80, H-100, 120, 44);
    r.drawButton(W/2+80, H-100, 120, 44, 'Next', hovNext);
  }

  _renderClassStep(r) {
    const W = r.width, H = r.height;
    r.drawTextCentered('Step 3: Choose Class', W/2, 90, '#ffdd88', 22, 'monospace', true);
    const classH = 52, classW = 200, cols = 4;
    CLASS_IDS.forEach((clsId, i) => {
      const cls = CLASSES[clsId];
      const row = Math.floor(i / cols), col = i % cols;
      const bx = 20 + col * (classW + 5);
      const by = 155 + row * classH;
      const selected = i === this.selectedClass;
      const hov = this.game.input.isMouseOver(bx, by, classW, classH-4);
      r.drawRoundRect(bx, by, classW, classH-4, 5,
        selected ? '#2a2a6a' : hov ? '#1e1e4e' : '#141428',
        selected ? '#aaaaff' : '#445566', selected ? 2 : 1);
      r.drawText(cls.name, bx+8, by+6, selected ? '#ffffff' : '#aaaacc', 15, 'left', 'monospace', selected);
      r.drawText(cls.role, bx+8, by+26, '#7799aa', 11);
      r.drawText(cls.primaryStats.map(s=>s.toUpperCase()).join('/'), bx+8, by+38, '#aa88ff', 11);
    });
    // Selected class details
    const cls = CLASSES[CLASS_IDS[this.selectedClass]];
    if (cls) {
      r.drawBorderBox(W - 285, 155, 275, 220, 'Class Info');
      r.drawText(cls.name, W-275, 175, '#ffdd88', 18, 'left', 'monospace', true);
      r.drawText(cls.role, W-275, 198, '#aaaacc', 13);
      r.drawText(`Primary: ${cls.primaryStats.join('/')}`, W-275, 215, '#88ccff', 13);
      r.drawText(`Armor: ${cls.armorType}`, W-275, 232, '#88ccff', 13);
      r.drawText(`Special: ${cls.uniqueMechanic.name}`, W-275, 252, '#aa88ff', 13);
      // First few skills
      r.drawText('Skills:', W-275, 272, '#ffdd88', 13);
      cls.skills.slice(0,4).forEach((sId, si) => {
        r.drawText(`  Lv${['1','3','5','8'][si]}: ${sId.replace(/_/g,' ')}`, W-275, 290 + si*16, '#999999', 12);
      });
    }
    const hovBack = this.game.input.isMouseOver(W-280, H-100, 120, 44);
    r.drawButton(W-280, H-100, 120, 44, 'Back', hovBack);
    const hovNext = this.game.input.isMouseOver(W-140, H-100, 120, 44);
    r.drawButton(W-140, H-100, 120, 44, 'Confirm', hovNext);
  }

  _renderConfirmStep(r) {
    const W = r.width, H = r.height;
    r.drawTextCentered('Confirm Character', W/2, 90, '#ffdd88', 22, 'monospace', true);
    const raceId = RACE_IDS[this.selectedRace];
    const classId = CLASS_IDS[this.selectedClass];
    // Preview character
    const char = new Character(this.nameInput || this._getDefaultName(), raceId, classId);
    r.drawBorderBox(W/2-200, 130, 400, 320, 'Character Preview');
    r.drawTextCentered(`"${char.name}"`, W/2, 150, '#ffdd88', 24, 'monospace', true);
    r.drawTextCentered(`${RACES[raceId].name} ${CLASSES[classId].name}`, W/2, 180, '#aaaaff', 18);
    const stats = [
      `HP: ${char.maxHp}    MP: ${char.maxMp}`,
      `STR: ${char.str}  DEX: ${char.dex}  INT: ${char.int}`,
      `WIS: ${char.wis}  CON: ${char.con}  SPD: ${char.spd}`,
      `Passive: ${RACES[raceId].passive.name}`,
      `Special: ${CLASSES[classId].uniqueMechanic.name}`
    ];
    stats.forEach((s, i) => r.drawTextCentered(s, W/2, 215 + i * 26, '#cccccc', 16));
    // Draw sprite preview
    r.drawSprite(classId, W/2 - 35, 335, 70, 80, '#6688cc');
    const hovBack = this.game.input.isMouseOver(W/2-220, H-100, 120, 44);
    r.drawButton(W/2-220, H-100, 120, 44, 'Back', hovBack);
    const hovConfirm = this.game.input.isMouseOver(W/2-80, H-100, 160, 44);
    r.drawButton(W/2-80, H-100, 160, 44,
      this.createdChars.length >= 3 ? 'Start Game!' : `Create (${this.step+1}/4)`,
      hovConfirm);
  }
}
