# Ruins of Aethermoor

A complete tile-based JRPG built with **HTML5 Canvas + vanilla JavaScript** — no install, no build step, no dependencies.  
Inspired by *Castle of the Winds* (tile dungeon crawling, fog of war) and *Final Fantasy* (turn-based party combat, classes, magic).

---

## ▶️ How to Play (No Install Required)

### 🌐 Option 1 — Play in your browser (easiest)

**https://mylespeterson.github.io/ruins-of-aethermoor/**

The game is automatically deployed to GitHub Pages on every push to `main`. No download, no install — just open the link and play.

> **One-time repo setup:** In your GitHub repository go to **Settings → Pages → Source** and select **GitHub Actions**. After that, every push to `main` triggers a fresh deploy automatically.

---

### Running locally

Because the game uses ES modules (`<script type="module">`), opening `index.html` directly as a `file://` URL will not work. Use any one of the options below if you want a local copy:

### Option 2 — Python (built into macOS / Linux)
```bash
python3 -m http.server 8000
```
Then open **http://localhost:8000** in your browser.

### Option 3 — Node.js (included helper script)
```bash
node serve.js
```
Then open **http://localhost:8000** in your browser.  
Requires Node.js 14+. No npm install needed.

### Option 4 — VS Code Live Server extension
1. Install the **Live Server** extension by Ritwick Dey.
2. Right-click `index.html` → **Open with Live Server**.

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move up |
| `S` / `↓` | Move down |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Enter` / `Space` | Confirm / Interact |
| `Escape` | Back / Pause / Return to town |
| `I` | Open Inventory |
| `M` | Toggle minimap |
| `Tab` | Cycle party members in menus |
| Mouse click | Select menu options / buttons |

---

## 🗺️ How to Play

### 1. Main Menu
- **New Game** — start fresh; you will be taken to Party Creation.
- **Continue** — resumes your last save (stored in browser `localStorage`).
- **How to Play** — in-game reference screen.

### 2. Party Creation
Create four characters one by one:
1. Enter a **name**.
2. Choose a **race** (12 options) — each modifies base stats and grants a unique passive ability.
3. Choose a **class** (16 options) — determines role, weapon types, armor, and the class skill tree.

After confirming all four characters, the game begins in **Town**.

### 3. Town
Walk around the town map and enter buildings by moving into them:

| Building | What it does |
|----------|-------------|
| **Inn** | Fully restores all party HP/MP (costs gold) |
| **Weapon Shop** | Buy/sell weapons; stock improves as you go deeper |
| **Armor Shop** | Buy/sell armor (Head, Chest, Legs, Boots) |
| **Potion Shop** | Buy consumables (potions, antidotes, bombs…) |
| **Magic Shop** | Buy spell scrolls to teach spells to characters |
| **Material Shop** | Buy basic crafting ingredients and elemental cores |
| **Crafting Station** | Forge new gear from materials + cores + scrolls |
| **Dungeon Entrance** | Descend into the procedurally generated dungeon |
| **Party Management** | View stats, swap equipment, reorder party |

Press **I** anywhere to open the full inventory / equipment screen.

### 4. Dungeon
- Move with **WASD / Arrow keys**.
- Tiles start hidden (**fog of war**); vision radius ~5 tiles reveals them as you explore.
- **Random encounters** trigger as you walk on floor tiles.
- Special tiles you may find:
  - `▼` Stairs Down — go one floor deeper.
  - `▲` Stairs Up — return toward town (floor 1 stairs exit to town).
  - `C` Treasure Chest — contains gold and items.
  - `H` Healing Fountain — restores party HP/MP once.
  - `S` Dungeon Shop — a rare merchant with premium items.
  - `⚒` Crafting Station — craft gear mid-dungeon.
  - `!` Trap — triggers a negative effect.
- Press **M** to toggle the minimap overlay.
- Press **Escape** to return to town (auto-saves).

**Difficulty scales with depth** — enemy levels = floor × 1.5.  
**Mini-bosses** appear every 5 floors; **Floor Bosses** every 10 floors (must defeat to unlock the next staircase).

### 5. Battle
Combat is turn-based in a side-view style (party on the left, enemies on the right).

Turn order is determined by **Speed** (DEX + equipment).  
On your turn, choose one action:

| Action | Description |
|--------|-------------|
| **Attack** | Physical weapon strike against one enemy |
| **Skill** | Use a class ability (most cost MP or have cooldowns) |
| **Magic** | Cast a learned spell (costs MP) |
| **Item** | Use a consumable from inventory |
| **Defend** | Take 50% damage until your next turn; act first next turn |
| **Flee** | 50% base chance + DEX advantage; impossible vs bosses |

Victory awards **EXP**, **gold**, and random **item drops**.  
Defeat sends the party to the **Game Over** screen (load save or return to town losing 25% gold).

### 6. Leveling Up
- EXP threshold per level = `currentLevel × 100`.
- On level-up, stats improve based on class growth rates and new skills may unlock.
- Skill unlock milestones: levels **1, 3, 5, 8, 12, 16, 20, 25**.
- Maximum level: **50**.

### 7. Crafting
Open the Crafting Station in town or in the dungeon:
1. Slot a **Base Material** (Iron Ingot, Mithril Ingot, etc.)
2. Slot an **Elemental Core** (Fire Ruby, Aqua Pearl, Volt Shard, etc.)
3. Optionally slot an **Enchantment Scroll** (found only in dungeons)
4. Preview the resulting item stats, then click **Craft**.

Item names are auto-generated: `[Material] [Element][WeaponType]`  
Example: *Mithril Flamebrand* (Mithril + Fire Ruby → sword)

---

## ✨ Features at a Glance

- **12 races** — Human, Elf, Dwarf, Orc, Feykin, Halfling, Dragonborn, Undead, Celestial, Demon, Beastkin, Golem
- **16 classes** — Warrior, Mage, Ranger, Cleric, Rogue, Paladin, Necromancer, Berserker, Elementalist, Bard, Monk, Summoner, Dark Knight, Alchemist, Samurai, Witch Doctor
- **8-element system** with strength/weakness chart and status effects (Burn, Chill, Paralyze, Petrify, Poison, Freeze, Silence, Bleed)
- **Full magic system** — 8 elemental schools × 4 tiers (15–80 MP) + healing school + dark magic
- **40+ enemy types** scaling across 50+ floors, plus named mini-bosses and epic floor bosses
- **BSP dungeon generation** — unique layout every run
- **Deep crafting** — 5 material tiers × 8 elemental cores × 10 enchantment scrolls
- **Persistent saves** via browser `localStorage`
- **Zero dependencies** — pure HTML5 Canvas + vanilla JS ES modules

---

## 📁 Project Structure

```
ruins-of-aethermoor/
├── index.html          ← entry point (served via GitHub Pages or a local server)
├── serve.js            ← zero-dep Node.js dev server
├── .github/
│   └── workflows/
│       └── deploy.yml  ← auto-deploys to GitHub Pages on push to main
├── css/style.css
└── src/
    ├── main.js
    ├── data/           races, classes, skills, spells, items, enemies, crafting, shops
    ├── engine/         game state machine, canvas renderer, input handler
    ├── world/          BSP dungeon generator, tile types, town layout
    ├── entities/       Character, Party, Enemy
    ├── combat/         Battle system, elemental matrix, status effects
    ├── systems/        inventory, crafting, shop, localStorage save/load
    └── ui/             all screens — menu, party creation, town, dungeon,
                        battle, inventory, shop, crafting, HUD
```
