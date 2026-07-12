(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const chance = (probability) => Math.random() < probability;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const SAVE_KEY = 'abyssCellsLivingDungeon_v2';

  const SLOT_ORDER = ['weapon', 'helm', 'armor', 'ring', 'boots', 'amulet'];
  const SLOT_ICONS = { weapon: '⚔️', helm: '⛑️', armor: '🛡️', ring: '💍', boots: '🥾', amulet: '📿' };
  const RARITIES = [
    { name: 'обычный', color: '#9aa5b7', mult: 1 },
    { name: 'редкий', color: '#5aa9ff', mult: 1.35 },
    { name: 'эпический', color: '#ad7cff', mult: 1.75 },
    { name: 'легендарный', color: '#f4bd4a', mult: 2.25 }
  ];

  const ROOM_META = {
    start: ['🔥', 'safe'], enemy: ['👹', 'enemy'], elite: ['💀', 'enemy'], nest: ['🕳️', 'enemy'],
    gold: ['🪙', 'loot'], chest: ['🧰', 'loot'], item: ['⚔️', 'loot'], shop: ['🏪', 'safe'],
    heal: ['⛲', 'safe'], shrine: ['🕯️', 'magic'], event: ['🗿', 'magic'], trap: ['🕸️', 'enemy'],
    stairs: ['🚪', 'magic'], boss: ['🐲', 'enemy'], cleared: ['·', 'safe']
  };

  const ENEMY_POOL = [
    { name: 'Голодный слизень', icon: '🟢', hp: 18, atk: 6, armor: 0, speed: 2, trait: 'Кислота иногда снижает защиту.', ability: 'shred' },
    { name: 'Костяной вор', icon: '💀', hp: 22, atk: 7, armor: 1, speed: 2, trait: 'Пытается украсть часть золота.', ability: 'steal' },
    { name: 'Пещерный волк', icon: '🐺', hp: 24, atk: 7, armor: 0, speed: 1, trait: 'Бьёт часто, но плохо защищён.', ability: 'fast' },
    { name: 'Паучий выводок', icon: '🕷️', hp: 21, atk: 6, armor: 0, speed: 2, trait: 'Укус может наложить яд.', ability: 'poison' },
    { name: 'Культист углей', icon: '🧙', hp: 27, atk: 8, armor: 1, speed: 2, trait: 'Иногда выжигает энергию.', ability: 'drain' },
    { name: 'Каменный страж', icon: '🗿', hp: 35, atk: 10, armor: 3, speed: 3, trait: 'Медленный, бронированный удар.', ability: 'crush' },
    { name: 'Теневой охотник', icon: '🥷', hp: 30, atk: 10, armor: 1, speed: 2, trait: 'Становится опаснее при низком HP.', ability: 'rage' },
    { name: 'Проклятый лучник', icon: '🏹', hp: 26, atk: 9, armor: 0, speed: 2, trait: 'Его выстрел нельзя остановить расстоянием.', ability: 'pierce' }
  ];

  const BOSS_POOL = [
    { name: 'Пожиратель комнат', icon: '🐲', hp: 92, atk: 15, armor: 2, speed: 2, trait: 'Каждый третий удар сокрушительный.', ability: 'bossCrush' },
    { name: 'Королева нитей', icon: '🕷️', hp: 108, atk: 13, armor: 2, speed: 1, trait: 'Частые укусы накапливают яд.', ability: 'bossPoison' },
    { name: 'Безликий надзиратель', icon: '👁️', hp: 122, atk: 17, armor: 3, speed: 2, trait: 'Крадёт энергию и усиливается.', ability: 'bossDrain' },
    { name: 'Костяной монарх', icon: '👑', hp: 146, atk: 19, armor: 4, speed: 3, trait: 'Тяжёлые удары пробивают защиту.', ability: 'bossPierce' }
  ];

  const ITEM_NAMES = {
    weapon: ['Сколотый тесак', 'Клык охотника', 'Молот палача', 'Коса затмения'],
    helm: ['Рваный капюшон', 'Шлем дозорного', 'Рогатая маска', 'Корона пепла'],
    armor: ['Кожаный панцирь', 'Кольчуга стража', 'Плиты титана', 'Плащ живой тени'],
    ring: ['Медное кольцо', 'Перстень охотника', 'Кольцо крови', 'Печать судьбы'],
    boots: ['Сапоги бродяги', 'Шаги ветра', 'Когти беглеца', 'Тихие подошвы'],
    amulet: ['Амулет искры', 'Глаз путника', 'Сердце глубин', 'Звезда бездны']
  };

  let state = null;
  let eventLocked = false;

  function newState() {
    return {
      version: 2,
      floor: 1,
      current: 12,
      revealedCount: 1,
      turn: 0,
      nextEnemyId: 1,
      cells: [],
      threats: [],
      hero: {
        level: 1, xp: 0, nextXp: 58,
        hp: 46, maxHp: 46,
        energy: 4, maxEnergy: 4,
        gold: 0, potions: 2, keys: 0,
        baseAtk: 9, baseDef: 2, baseCrit: 8, baseDodge: 2,
        guard: false, poison: 0, poisonTurns: 0, shred: 0, shredTurns: 0,
        equipment: {}
      },
      stats: { kills: 0, bosses: 0, rooms: 1, deepest: 1 },
      log: []
    };
  }

  function neighbors(index) {
    const x = index % 5;
    const y = Math.floor(index / 5);
    const list = [];
    if (x > 0) list.push(index - 1);
    if (x < 4) list.push(index + 1);
    if (y > 0) list.push(index - 5);
    if (y < 4) list.push(index + 5);
    return list;
  }

  function chooseRoomType() {
    const roll = Math.random();
    if (roll < 0.28) return 'enemy';
    if (roll < 0.34) return 'elite';
    if (roll < 0.39) return 'nest';
    if (roll < 0.49) return 'gold';
    if (roll < 0.58) return 'chest';
    if (roll < 0.66) return 'item';
    if (roll < 0.75) return 'event';
    if (roll < 0.82) return 'trap';
    if (roll < 0.88) return 'heal';
    if (roll < 0.93) return 'shop';
    return 'shrine';
  }

  function initFloor() {
    state.current = 12;
    state.revealedCount = 1;
    state.threats = [];
    state.hero.guard = false;
    state.hero.shred = 0;
    state.hero.shredTurns = 0;
    state.cells = Array.from({ length: 25 }, (_, index) => ({
      index, type: null, revealed: false, resolved: false, cleared: false, enemyId: null
    }));
    Object.assign(state.cells[12], { type: 'start', revealed: true, resolved: true, cleared: true });

    let exitIndex;
    do {
      exitIndex = rand(0, 24);
    } while (exitIndex === 12 || Math.abs(exitIndex % 5 - 2) + Math.abs(Math.floor(exitIndex / 5) - 2) < 3);
    state.cells[exitIndex].type = state.floor % 5 === 0 ? 'boss' : 'stairs';

    state.stats.deepest = Math.max(state.stats.deepest, state.floor);
    addLog(`Ты входишь на этаж ${state.floor}. Подземелье начинает двигаться.`, 'gold');
    render();
    saveGame();
  }

  function canReveal(index) {
    const cell = state.cells[index];
    return !eventLocked && !cell.revealed && neighbors(state.current).includes(index);
  }

  function interactCell(index) {
    if (eventLocked) return;
    const cell = state.cells[index];

    if (canReveal(index)) {
      revealCell(cell);
      return;
    }

    if (cell.revealed && neighbors(state.current).includes(index)) {
      state.current = index;
      render();
      saveGame();
      return;
    }

    if (cell.revealed && index === state.current) {
      revisitRoom(cell);
    }
  }

  function revealCell(cell) {
    state.current = cell.index;
    cell.revealed = true;
    cell.type = cell.type || chooseRoomType();
    state.revealedCount += 1;
    state.stats.rooms += 1;

    const result = resolveNewRoom(cell);
    if (state.hero.hp <= 0) {
      gameOver('опасность комнаты');
      return;
    }

    advanceWorld({ skipIds: result.skipIds || [] });
    if (state.hero.hp <= 0) return;

    if (typeof result.after === 'function') {
      window.setTimeout(result.after, 90);
    }

    render();
    saveGame();
  }

  function resolveNewRoom(cell) {
    cell.resolved = true;
    const result = { skipIds: [], after: null };

    switch (cell.type) {
      case 'enemy': {
        const enemy = spawnThreat('normal', cell.index);
        result.skipIds.push(enemy.id);
        addLog(`Из комнаты выходит ${enemy.name}. Он начинает преследование.`, 'bad');
        break;
      }
      case 'elite': {
        const enemy = spawnThreat('elite', cell.index);
        result.skipIds.push(enemy.id);
        addLog(`Пробуждена элита: ${enemy.name}.`, 'bad');
        break;
      }
      case 'nest': {
        const first = spawnThreat('swarm', cell.index);
        const second = spawnThreat('swarm', cell.index);
        result.skipIds.push(first.id, second.id);
        addLog('Из гнезда вырываются две угрозы.', 'bad');
        break;
      }
      case 'boss': {
        const boss = spawnThreat('boss', cell.index);
        result.skipIds.push(boss.id);
        addLog(`Босс этажа пробуждён: ${boss.name}.`, 'bad');
        break;
      }
      case 'gold': {
        const amount = rand(12, 28) + state.floor * 2;
        state.hero.gold += amount;
        cell.cleared = true;
        addLog(`Найден тайник: +${amount} золота.`, 'gold');
        notify('Тайник', `+${amount} золота`);
        break;
      }
      case 'trap': {
        const damage = Math.max(3, rand(7, 13) - Math.floor(totalDefense() / 3));
        state.hero.hp -= damage;
        cell.cleared = true;
        addLog(`Ловушка срабатывает: -${damage} HP.`, 'bad');
        flashDamage();
        notify('Ловушка', `-${damage} HP`);
        break;
      }
      case 'chest':
        result.after = () => chestEvent(cell);
        break;
      case 'item':
        cell.cleared = true;
        result.after = () => offerItem(makeItem());
        break;
      case 'shop':
        result.after = () => shopEvent();
        break;
      case 'heal':
        result.after = () => fountainEvent(cell);
        break;
      case 'shrine':
        result.after = () => shrineEvent(cell);
        break;
      case 'event':
        result.after = () => randomEvent(cell);
        break;
      case 'stairs':
        result.after = () => stairsEvent();
        break;
      default:
        cell.cleared = true;
    }

    return result;
  }

  function revisitRoom(cell) {
    if (cell.type === 'stairs') stairsEvent();
    else if (cell.type === 'shop') shopEvent();
    else if (cell.type === 'chest' && !cell.cleared) chestEvent(cell);
    else if (cell.type === 'heal' && !cell.cleared) fountainEvent(cell);
    else if (cell.type === 'shrine' && !cell.cleared) shrineEvent(cell);
  }

  function spawnThreat(kind, cellIndex) {
    const isBoss = kind === 'boss';
    const isElite = kind === 'elite';
    let template;

    if (isBoss) {
      template = BOSS_POOL[(Math.floor(state.floor / 5) - 1) % BOSS_POOL.length];
    } else {
      const depthIndex = Math.min(ENEMY_POOL.length - 1, Math.floor((state.floor - 1) / 2) + rand(0, 2));
      template = ENEMY_POOL[depthIndex];
    }

    const scale = 1 + (state.floor - 1) * 0.13 + (isElite ? 0.42 : 0) + (kind === 'swarm' ? -0.22 : 0);
    const maxHp = Math.max(10, Math.round(template.hp * scale));
    const threat = {
      id: state.nextEnemyId++,
      cellIndex,
      name: `${isElite ? 'Элита: ' : ''}${kind === 'swarm' ? 'Молодой ' : ''}${template.name}`,
      icon: template.icon,
      hp: maxHp,
      maxHp,
      atk: Math.max(3, Math.round(template.atk * (1 + (state.floor - 1) * 0.1 + (isElite ? 0.28 : 0) + (kind === 'swarm' ? -0.18 : 0)))),
      armor: Math.max(0, template.armor + (isElite ? 1 : 0)),
      speed: Math.max(1, template.speed + (isElite && template.speed > 1 ? -1 : 0)),
      counter: Math.max(1, template.speed),
      ability: template.ability,
      trait: template.trait,
      elite: isElite,
      boss: isBoss,
      attackCount: 0,
      stunned: 0
    };

    state.threats.push(threat);
    const cell = state.cells[cellIndex];
    cell.enemyId = threat.id;
    cell.cleared = false;
    return threat;
  }

  function advanceWorld({ skipIds = [] } = {}) {
    state.turn += 1;

    if (state.hero.poison > 0 && state.hero.poisonTurns > 0) {
      const poisonDamage = state.hero.poison;
      state.hero.hp -= poisonDamage;
      state.hero.poisonTurns -= 1;
      addLog(`Яд наносит ${poisonDamage} урона.`, 'bad');
      if (state.hero.poisonTurns <= 0) state.hero.poison = 0;
      flashDamage();
    }

    if (state.hero.hp <= 0) {
      gameOver('яд бездны');
      return;
    }

    const guardActive = state.hero.guard;
    let anyAttack = false;

    for (const threat of [...state.threats]) {
      if (skipIds.includes(threat.id)) continue;
      if (threat.stunned > 0) {
        threat.stunned -= 1;
        addLog(`${threat.name} оглушён и пропускает действие.`, 'good');
        continue;
      }

      threat.counter -= 1;
      if (threat.counter <= 0) {
        anyAttack = true;
        enemyAttack(threat, guardActive);
        threat.counter = threat.speed;
        if (state.hero.hp <= 0) break;
      }
    }

    if (guardActive && anyAttack) state.hero.guard = false;
    if (state.hero.shredTurns > 0) {
      state.hero.shredTurns -= 1;
      if (state.hero.shredTurns <= 0) state.hero.shred = 0;
    }

    if (state.turn % 2 === 0) {
      state.hero.energy = Math.min(totalMaxEnergy(), state.hero.energy + 1);
    }

    if (anyAttack) flashDamage();

    if (state.hero.hp <= 0) {
      gameOver('преследующие твари');
      return;
    }

    render();
    saveGame();
  }

  function enemyAttack(threat, guarded) {
    threat.attackCount += 1;
    const dodgeRoll = chance(totalDodge() / 100);
    if (dodgeRoll) {
      addLog(`Ты уклоняешься от атаки: ${threat.name}.`, 'good');
      return;
    }

    let armorIgnored = 0;
    let bonus = 0;
    let label = 'атакует';

    if (threat.ability === 'rage' && threat.hp / threat.maxHp <= 0.4) bonus += 3;
    if (threat.ability === 'crush' && threat.attackCount % 2 === 0) { bonus += 4; label = 'сокрушает'; }
    if (threat.ability === 'bossCrush' && threat.attackCount % 3 === 0) { bonus += 8; armorIgnored = 2; label = 'сокрушает комнату'; }
    if (threat.ability === 'pierce' || threat.ability === 'bossPierce') armorIgnored = threat.ability === 'bossPierce' ? 5 : 2;

    const effectiveDefense = Math.max(0, totalDefense() - armorIgnored);
    let damage = Math.max(1, threat.atk + bonus + rand(-2, 2) - effectiveDefense);
    if (guarded) damage = Math.max(0, Math.round(damage * 0.38));

    state.hero.hp -= damage;
    addLog(`${threat.name} ${label}: -${damage} HP${guarded ? ' под защитой' : ''}.`, 'bad');

    if (threat.ability === 'poison' && chance(0.35)) applyPoison(2, 3);
    if (threat.ability === 'bossPoison' && chance(0.55)) applyPoison(3, 4);
    if (threat.ability === 'shred' && chance(0.35)) applyShred(2, 3);
    if (threat.ability === 'steal' && chance(0.35) && state.hero.gold > 0) {
      const stolen = Math.min(state.hero.gold, rand(3, 9));
      state.hero.gold -= stolen;
      addLog(`${threat.name} крадёт ${stolen} золота.`, 'gold');
    }
    if ((threat.ability === 'drain' || threat.ability === 'bossDrain') && chance(0.4)) {
      const amount = threat.ability === 'bossDrain' ? 2 : 1;
      state.hero.energy = Math.max(0, state.hero.energy - amount);
      addLog(`${threat.name} выжигает ${amount} энергии.`, 'bad');
    }
  }

  function applyPoison(power, turns) {
    state.hero.poison = Math.max(state.hero.poison, power);
    state.hero.poisonTurns = Math.max(state.hero.poisonTurns, turns);
    addLog(`На тебя наложен яд: ${power} урона ещё ${turns} действия.`, 'bad');
  }

  function applyShred(amount, turns) {
    state.hero.shred = Math.max(state.hero.shred, amount);
    state.hero.shredTurns = Math.max(state.hero.shredTurns, turns);
    addLog(`Защита снижена на ${amount} ещё ${turns} действия.`, 'bad');
  }

  function attackThreat(id, heavy = false) {
    if (eventLocked) return;
    const threat = state.threats.find((entry) => entry.id === id);
    if (!threat) return;

    if (heavy && state.hero.energy < 2) {
      notify('Недостаточно энергии', 'Сильный удар требует 2 EN.');
      return;
    }

    if (heavy) state.hero.energy -= 2;
    let damage = totalAttack() + rand(-2, 3);
    if (heavy) damage = Math.round(damage * 1.72);
    const critical = chance(totalCrit() / 100);
    if (critical) damage = Math.round(damage * 1.65);
    damage = Math.max(1, damage - threat.armor);

    threat.hp -= damage;
    addLog(`${heavy ? 'Тяжёлый удар' : 'Атака'} по ${threat.name}: ${damage}${critical ? ' критического' : ''} урона.`, 'good');

    if (heavy && state.threats.length > 1 && chance(0.35)) {
      const splash = Math.max(1, Math.round(damage * 0.22));
      for (const other of state.threats) {
        if (other.id !== threat.id) other.hp -= splash;
      }
      addLog(`Ударная волна наносит остальным по ${splash}.`, 'good');
    }

    collectDeadThreats();
    advanceWorld();
  }

  function collectDeadThreats() {
    const dead = state.threats.filter((threat) => threat.hp <= 0);
    if (!dead.length) return;

    for (const threat of dead) {
      state.threats = state.threats.filter((entry) => entry.id !== threat.id);
      state.stats.kills += 1;
      if (threat.boss) state.stats.bosses += 1;

      const cell = state.cells[threat.cellIndex];
      if (cell) {
        const remainingInCell = state.threats.find((entry) => entry.cellIndex === threat.cellIndex);
        cell.enemyId = remainingInCell ? remainingInCell.id : null;
        cell.cleared = !remainingInCell;
      }

      const goldReward = rand(threat.boss ? 65 : threat.elite ? 25 : 10, threat.boss ? 95 : threat.elite ? 45 : 24) + state.floor * 2;
      const xpReward = threat.boss ? 72 : threat.elite ? 36 : 18;
      state.hero.gold += goldReward;
      gainExperience(xpReward);
      addLog(`${threat.name} повержен: +${goldReward} золота, +${xpReward} XP.`, 'gold');

      if (threat.boss) {
        if (cell) {
          cell.type = 'stairs';
          cell.cleared = true;
        }
        state.hero.potions += 1;
        notify('Босс повержен', 'Портал открылся в его комнате.');
      } else if (threat.elite && chance(0.62)) {
        window.setTimeout(() => { if (state.hero.hp > 0 && !eventLocked) offerItem(makeItem(2)); }, 130);
      } else if (chance(0.12)) {
        state.hero.potions += 1;
        addLog('С врага выпал эликсир.', 'good');
      } else if (chance(0.1)) {
        state.hero.keys += 1;
        addLog('С врага выпал ключ.', 'gold');
      }
    }
  }

  function guardAction() {
    if (eventLocked) return;
    state.hero.guard = true;
    addLog('Ты готовишь защиту на следующую вражескую фазу.', 'good');
    advanceWorld();
  }

  function potionAction() {
    if (eventLocked) return;
    if (state.hero.potions <= 0) {
      notify('Нет эликсиров', 'Их можно найти или купить.');
      return;
    }
    if (state.hero.hp >= totalMaxHp()) {
      notify('Здоровье полное', 'Эликсир пока не нужен.');
      return;
    }
    state.hero.potions -= 1;
    const amount = Math.round(totalMaxHp() * 0.42);
    heal(amount);
    addLog(`Эликсир восстанавливает ${amount} HP.`, 'good');
    advanceWorld();
  }

  function waitAction() {
    if (eventLocked) return;
    state.hero.energy = Math.min(totalMaxEnergy(), state.hero.energy + 2);
    addLog('Ты переводишь дыхание: +2 энергии.', 'good');
    advanceWorld();
  }

  function chestEvent(cell) {
    const locked = chance(0.62);
    if (!locked) {
      const gold = rand(18, 42) + state.floor * 2;
      state.hero.gold += gold;
      cell.cleared = true;
      addLog(`Сундук открыт: +${gold} золота.`, 'gold');
      if (chance(0.42)) state.hero.potions += 1;
      render();
      saveGame();
      notify('Сундук', `+${gold} золота`);
      return;
    }

    showEvent('Запертый сундук', '🧰', 'Замок выглядит старым, но внутри слышно тяжёлое содержимое.', [
      {
        title: 'Открыть ключом',
        subtitle: state.hero.keys > 0 ? 'Редкий предмет без риска' : 'У тебя нет ключа',
        disabled: state.hero.keys <= 0,
        action: () => {
          state.hero.keys -= 1;
          cell.cleared = true;
          closeEvent();
          offerItem(makeItem(2));
        }
      },
      {
        title: 'Взломать силой',
        subtitle: 'Получить добычу, но потерять 8–14 HP',
        action: () => {
          const damage = rand(8, 14);
          state.hero.hp -= damage;
          cell.cleared = true;
          closeEvent();
          flashDamage();
          if (state.hero.hp <= 0) return gameOver('сломанный замок');
          offerItem(makeItem(1));
        }
      },
      { title: 'Оставить', subtitle: 'Можно вернуться позже', action: closeEvent }
    ]);
  }

  function fountainEvent(cell) {
    const healAmount = Math.max(14, Math.round(totalMaxHp() * 0.35));
    showEvent('Источник под камнем', '⛲', 'Вода пахнет железом, но раны рядом с ней затягиваются.', [
      {
        title: `Восстановить ${healAmount} HP`, subtitle: 'Источник иссякнет', action: () => {
          heal(healAmount); cell.cleared = true; closeEvent(); addLog('Источник восстанавливает здоровье.', 'good'); render();
        }
      },
      {
        title: 'Наполнить эликсир', subtitle: '+1 эликсир', action: () => {
          state.hero.potions += 1; cell.cleared = true; closeEvent(); addLog('Ты наполняешь пустой флакон.', 'good'); render();
        }
      },
      { title: 'Не трогать', subtitle: 'Оставить источник на потом', action: closeEvent }
    ]);
  }

  function shrineEvent(cell) {
    showEvent('Шёпот святилища', '🕯️', 'Тёмный огонь предлагает постоянную силу, но требует цену.', [
      {
        title: 'Отдать 20 золота', subtitle: '+2 базовой атаки', action: () => {
          if (!pay(20)) return;
          state.hero.baseAtk += 2; cell.cleared = true; closeEvent(); addLog('Святилище усиливает оружие.', 'good'); render();
        }
      },
      {
        title: 'Отдать 10 максимального HP', subtitle: '+4% критического шанса', action: () => {
          if (state.hero.maxHp <= 24) return notify('Слишком опасно', 'Твоё тело уже слишком слабое.');
          state.hero.maxHp -= 10; state.hero.hp = Math.min(state.hero.hp, totalMaxHp()); state.hero.baseCrit += 4;
          cell.cleared = true; closeEvent(); addLog('Святилище принимает кровь.', 'bad'); render();
        }
      },
      { title: 'Уйти', subtitle: 'Святилище останется активным', action: closeEvent }
    ]);
  }

  function randomEvent(cell) {
    const eventNumber = rand(1, 5);
    if (eventNumber === 1) {
      showEvent('Кровавый алтарь', '🩸', 'Надпись обещает силу тому, кто не боится продолжить путь раненым.', [
        {
          title: 'Принять сделку', subtitle: '-12 HP, +2 атаки и +1 защита', action: () => {
            state.hero.hp -= 12; state.hero.baseAtk += 2; state.hero.baseDef += 1; cell.cleared = true; closeEvent();
            if (state.hero.hp <= 0) return gameOver('кровавый алтарь');
            addLog('Алтарь меняет твоё тело.', 'bad'); render();
          }
        },
        { title: 'Разрушить алтарь', subtitle: 'Получить 16–30 золота', action: () => { const g = rand(16,30); state.hero.gold += g; cell.cleared = true; closeEvent(); addLog(`Алтарь разбит: +${g} золота.`, 'gold'); render(); } },
        { title: 'Уйти', subtitle: 'Без последствий', action: closeEvent }
      ]);
    } else if (eventNumber === 2) {
      showEvent('Картограф без лица', '🧑‍🦯', 'Он предлагает показать ближайшие комнаты, не открывая их полностью.', [
        {
          title: 'Заплатить 18 золота', subtitle: 'Подсмотреть тип трёх соседних комнат', action: () => {
            if (!pay(18)) return;
            const hidden = state.cells.filter((entry) => !entry.revealed && neighbors(state.current).includes(entry.index)).slice(0, 3);
            hidden.forEach((entry) => { entry.type = entry.type || chooseRoomType(); entry.peeked = true; });
            cell.cleared = true; closeEvent(); addLog('Картограф отмечает опасности рядом.', 'good'); render();
          }
        },
        { title: 'Отказать', subtitle: 'Он исчезнет', action: () => { cell.cleared = true; closeEvent(); } }
      ]);
    } else if (eventNumber === 3) {
      showEvent('Кости судьбы', '🎲', 'Один бросок. Никаких объяснений.', [
        {
          title: 'Бросить кости', subtitle: 'Большая награда или тяжёлый урон', action: () => {
            cell.cleared = true; closeEvent();
            if (chance(0.52)) { const g = rand(38, 62); state.hero.gold += g; addLog(`Кости дают +${g} золота.`, 'gold'); notify('Удача', `+${g} золота`); }
            else { const d = rand(14, 22); state.hero.hp -= d; addLog(`Кости отнимают ${d} HP.`, 'bad'); flashDamage(); if (state.hero.hp <= 0) return gameOver('кости судьбы'); }
            render();
          }
        },
        { title: 'Не играть', subtitle: 'Без риска', action: () => { cell.cleared = true; closeEvent(); } }
      ]);
    } else if (eventNumber === 4) {
      showEvent('Пленный охотник', '⛓️', 'Цепи можно сломать, но шум привлечёт внимание.', [
        {
          title: 'Освободить', subtitle: '+1 эликсир, но появится враг', action: () => {
            state.hero.potions += 1; cell.cleared = true; closeEvent(); const enemy = spawnThreat('normal', cell.index); addLog(`${enemy.name} пришёл на шум.`, 'bad'); render();
          }
        },
        { title: 'Забрать его припасы', subtitle: '+25 золота', action: () => { state.hero.gold += 25; cell.cleared = true; closeEvent(); addLog('Ты забираешь припасы пленника.', 'gold'); render(); } }
      ]);
    } else {
      showEvent('Зеркало глубин', '🪞', 'Отражение показывает более сильную версию тебя.', [
        { title: 'Коснуться оружия', subtitle: '+3 атаки, -2 защиты на этот этаж', action: () => { state.hero.baseAtk += 3; state.hero.shred = Math.max(state.hero.shred, 2); state.hero.shredTurns = 99; cell.cleared = true; closeEvent(); render(); } },
        { title: 'Коснуться доспеха', subtitle: '+10 максимального HP', action: () => { state.hero.maxHp += 10; state.hero.hp += 10; cell.cleared = true; closeEvent(); render(); } },
        { title: 'Разбить зеркало', subtitle: 'Шанс получить предмет', action: () => { cell.cleared = true; closeEvent(); chance(.58) ? offerItem(makeItem(1)) : notify('Пусто', 'Осколки быстро почернели.'); } }
      ]);
    }
  }

  function shopEvent() {
    const first = makeItem(0);
    const second = makeItem(1);
    showEvent('Торговец в маске', '🏪', 'Он не задаёт вопросов и не боится существ, которые идут по твоему следу.', [
      { title: `${first.icon} ${first.name} — 42`, subtitle: first.description, action: () => buyItem(first, 42) },
      { title: `${second.icon} ${second.name} — 68`, subtitle: second.description, action: () => buyItem(second, 68) },
      { title: '🧪 Эликсир — 24', subtitle: 'Восстанавливает 42% максимального HP', action: () => { if (!pay(24)) return; state.hero.potions += 1; closeEvent(); notify('Куплено', '+1 эликсир'); render(); } },
      { title: '🗝️ Ключ — 31', subtitle: 'Открывает запертые сундуки', action: () => { if (!pay(31)) return; state.hero.keys += 1; closeEvent(); notify('Куплено', '+1 ключ'); render(); } },
      { title: 'Уйти', subtitle: 'Вернуться к исследованию', action: closeEvent }
    ]);
  }

  function stairsEvent() {
    const threatsAlive = state.threats.length;
    const escapeCost = Math.max(6, Math.round(totalMaxHp() * 0.18));
    const choices = [];

    if (threatsAlive === 0) {
      choices.push({
        title: 'Спуститься глубже', subtitle: 'Начать следующий этаж', action: () => {
          closeEvent(); state.floor += 1; state.hero.energy = totalMaxEnergy(); initFloor();
        }
      });
    } else {
      choices.push({
        title: `Прорваться сквозь преследование`, subtitle: `Потерять ${escapeCost} HP и половину найденного на этаже золота`, action: () => {
          state.hero.hp -= escapeCost;
          state.hero.gold = Math.floor(state.hero.gold * 0.5);
          if (state.hero.hp <= 0) { closeEvent(); return gameOver('поспешный побег'); }
          closeEvent(); state.floor += 1; state.hero.energy = totalMaxEnergy(); initFloor();
        }
      });
      choices.push({ title: 'Остаться и разобраться', subtitle: `${threatsAlive} активных угроз`, action: closeEvent });
    }

    showEvent('Дверь на следующий этаж', '🚪', threatsAlive ? 'Враги уже близко. Безопасный спуск невозможен.' : 'За дверью слышен новый слой живого подземелья.', choices);
  }

  function makeItem(bonus = 0) {
    const slot = SLOT_ORDER[rand(0, SLOT_ORDER.length - 1)];
    const rarityIndex = clamp(Math.floor((state.floor + bonus + rand(0, 5)) / 4), 0, 3);
    const rarity = RARITIES[rarityIndex];
    const basePower = Math.max(2, Math.round((2 + state.floor * 0.45) * rarity.mult));
    const stats = {};

    if (slot === 'weapon') {
      stats.atk = basePower + 2;
    } else if (slot === 'armor') {
      stats.def = Math.max(1, Math.round(basePower * 0.42));
      stats.hp = basePower * 3;
    } else if (slot === 'helm') {
      stats.def = Math.max(1, Math.round(basePower * 0.34));
      stats.hp = basePower * 2;
    } else if (slot === 'ring') {
      stats.crit = 3 + rarityIndex * 3;
      if (rarityIndex >= 2) stats.atk = 1 + rarityIndex;
    } else if (slot === 'boots') {
      stats.dodge = 2 + rarityIndex * 2;
      stats.def = rarityIndex;
    } else if (slot === 'amulet') {
      stats.hp = basePower * 2;
      stats.energy = rarityIndex >= 2 ? 1 : 0;
      stats.atk = 1 + rarityIndex;
    }

    const description = describeStats(stats);
    return {
      slot,
      icon: SLOT_ICONS[slot],
      name: ITEM_NAMES[slot][rarityIndex],
      rarityIndex,
      rarity: rarity.name,
      color: rarity.color,
      stats,
      description
    };
  }

  function describeStats(stats) {
    const parts = [];
    if (stats.atk) parts.push(`+${stats.atk} атаки`);
    if (stats.def) parts.push(`+${stats.def} защиты`);
    if (stats.hp) parts.push(`+${stats.hp} HP`);
    if (stats.crit) parts.push(`+${stats.crit}% крита`);
    if (stats.dodge) parts.push(`+${stats.dodge}% уклонения`);
    if (stats.energy) parts.push(`+${stats.energy} энергии`);
    return parts.join(', ');
  }

  function offerItem(item) {
    const previous = state.hero.equipment[item.slot];
    const compare = previous ? `Сейчас: ${previous.name} — ${previous.description}.` : 'Слот сейчас пуст.';
    showEvent(`${item.rarity.toUpperCase()}: ${item.name}`, item.icon, `${item.description}. ${compare}`, [
      { title: 'Экипировать', subtitle: 'Заменить предмет в этом слоте', action: () => { equipItem(item); closeEvent(); notify('Экипировано', item.name); } },
      { title: `Продать за ${18 + item.rarityIndex * 12}`, subtitle: 'Получить золото', action: () => { state.hero.gold += 18 + item.rarityIndex * 12; closeEvent(); render(); } },
      { title: 'Оставить', subtitle: 'Не брать предмет', action: closeEvent }
    ]);
  }

  function equipItem(item) {
    state.hero.equipment[item.slot] = item;
    state.hero.hp = Math.min(state.hero.hp, totalMaxHp());
    state.hero.energy = Math.min(state.hero.energy, totalMaxEnergy());
    addLog(`Экипирован предмет: ${item.name}.`, 'good');
    render();
    saveGame();
  }

  function buyItem(item, price) {
    if (!pay(price)) return;
    equipItem(item);
    closeEvent();
    notify('Куплено', item.name);
  }

  function pay(amount) {
    if (state.hero.gold < amount) {
      notify('Не хватает золота', `Нужно ${amount}, есть ${state.hero.gold}.`);
      return false;
    }
    state.hero.gold -= amount;
    return true;
  }

  function gainExperience(amount) {
    state.hero.xp += amount;
    while (state.hero.xp >= state.hero.nextXp) {
      state.hero.xp -= state.hero.nextXp;
      state.hero.level += 1;
      state.hero.nextXp = Math.round(state.hero.nextXp * 1.27);
      state.hero.maxHp += 7;
      state.hero.baseAtk += 2;
      if (state.hero.level % 2 === 0) state.hero.baseDef += 1;
      if (state.hero.level % 3 === 0) state.hero.baseCrit += 2;
      state.hero.hp = totalMaxHp();
      state.hero.potions += 1;
      addLog(`Новый уровень ${state.hero.level}: характеристики выросли.`, 'gold');
      notify('Новый уровень', `Теперь ты ${state.hero.level} уровня.`);
    }
  }

  function heal(amount) {
    state.hero.hp = Math.min(totalMaxHp(), state.hero.hp + amount);
  }

  function equipmentStat(statName) {
    return Object.values(state.hero.equipment).reduce((sum, item) => sum + (item.stats[statName] || 0), 0);
  }

  function totalAttack() { return state.hero.baseAtk + equipmentStat('atk'); }
  function totalDefense() { return Math.max(0, state.hero.baseDef + equipmentStat('def') - state.hero.shred); }
  function totalCrit() { return state.hero.baseCrit + equipmentStat('crit'); }
  function totalDodge() { return Math.min(35, state.hero.baseDodge + equipmentStat('dodge')); }
  function totalMaxHp() { return state.hero.maxHp + equipmentStat('hp'); }
  function totalMaxEnergy() { return state.hero.maxEnergy + equipmentStat('energy'); }

  function predictedDamage(threat) {
    const armorIgnored = threat.ability === 'bossPierce' ? 5 : threat.ability === 'pierce' ? 2 : 0;
    return Math.max(1, threat.atk - Math.max(0, totalDefense() - armorIgnored));
  }

  function incomingDamage() {
    return state.threats
      .filter((threat) => threat.counter <= 1 && threat.stunned <= 0)
      .reduce((sum, threat) => sum + predictedDamage(threat), 0);
  }

  function buildName() {
    if (state.threats.length >= 4) return 'Охотник в окружении';
    if (totalDodge() >= 16) return 'Теневой беглец';
    if (totalCrit() >= 21) return 'Кровавый дуэлянт';
    if (totalDefense() >= 12) return 'Железный странник';
    if (totalAttack() >= 26) return 'Клинок бездны';
    if (state.hero.level >= 8) return 'Ветеран глубин';
    return 'Безымянная сборка';
  }

  function cellDisplay(cell) {
    if (!cell.revealed) {
      if (cell.peeked && cell.type) return ROOM_META[cell.type]?.[0] || '◆';
      return '◆';
    }
    if (cell.cleared && ['enemy', 'elite', 'nest'].includes(cell.type)) return '☠️';
    return ROOM_META[cell.type]?.[0] || '·';
  }

  function cellClass(cell) {
    const classes = ['cell'];
    if (!cell.revealed) classes.push('hidden');
    else classes.push('revealed');
    if (cell.peeked && !cell.revealed) classes.push('peeked');
    if (canReveal(cell.index)) classes.push('reach');
    if (cell.index === state.current) classes.push('current');
    if (cell.cleared) classes.push('cleared');
    const meta = ROOM_META[cell.type];
    if (cell.revealed && meta) classes.push(meta[1]);
    if (state.threats.some((entry) => entry.cellIndex === cell.index)) classes.push('active-enemy');
    return classes.join(' ');
  }

  function renderThreats() {
    $('#threatCount').textContent = state.threats.length;
    const list = $('#threatList');
    if (!state.threats.length) {
      list.innerHTML = '<div class="threat-empty">Пока тихо. Открывай соседние комнаты — но помни, что найденные враги останутся в погоне.</div>';
      return;
    }

    list.innerHTML = state.threats.map((threat) => {
      const hpPercent = clamp((threat.hp / threat.maxHp) * 100, 0, 100);
      const ready = threat.counter <= 1;
      const intent = ready ? `УДАР: ~${predictedDamage(threat)}` : `через ${threat.counter}`;
      return `
        <article class="threat-card ${threat.elite ? 'elite' : ''} ${threat.boss ? 'boss' : ''}">
          <div class="enemy-face">${threat.icon}</div>
          <div>
            <div class="enemy-top">
              <div><div class="enemy-name">${threat.name}</div><div class="enemy-tags">ATK ${threat.atk} · ARM ${threat.armor} · темп ${threat.speed}</div></div>
              <div class="intent ${ready ? 'ready' : ''}">${intent}</div>
            </div>
            <div class="enemy-hptext"><span>HP</span><span>${Math.max(0, threat.hp)} / ${threat.maxHp}</span></div>
            <div class="enemybar"><i style="width:${hpPercent}%"></i></div>
          </div>
          <div class="enemy-actions">
            <button class="btn primary attack" data-id="${threat.id}">⚔️ Ударить</button>
            <button class="btn gold heavy" data-id="${threat.id}" ${state.hero.energy < 2 ? 'disabled' : ''}>🔥 Тяжёлый · 2 EN</button>
          </div>
          <div class="enemy-effect">${threat.trait}${threat.stunned ? ` · оглушён: ${threat.stunned}` : ''}</div>
        </article>`;
    }).join('');

    $$('.attack').forEach((button) => button.addEventListener('click', () => attackThreat(Number(button.dataset.id), false)));
    $$('.heavy').forEach((button) => button.addEventListener('click', () => attackThreat(Number(button.dataset.id), true)));
  }

  function render() {
    if (!state) return;
    const hero = state.hero;
    const maxHp = totalMaxHp();
    const maxEnergy = totalMaxEnergy();
    hero.hp = Math.min(hero.hp, maxHp);
    hero.energy = Math.min(hero.energy, maxEnergy);

    $('#heroLevel').textContent = hero.level;
    $('#build').textContent = buildName();
    $('#gold').textContent = hero.gold;
    $('#potions').textContent = hero.potions;
    $('#keys').textContent = hero.keys;
    $('#atk').textContent = totalAttack();
    $('#def').textContent = totalDefense();
    $('#crit').textContent = `${totalCrit()}%`;
    $('#dodge').textContent = `${totalDodge()}%`;
    $('#turn').textContent = state.turn;

    $('#hpText').textContent = `${Math.max(0, hero.hp)} / ${maxHp}`;
    $('#xpText').textContent = `${hero.xp} / ${hero.nextXp}`;
    $('#energyText').textContent = `${hero.energy} / ${maxEnergy}`;
    $('#hpBar').style.width = `${clamp((hero.hp / maxHp) * 100, 0, 100)}%`;
    $('#xpBar').style.width = `${clamp((hero.xp / hero.nextXp) * 100, 0, 100)}%`;
    $('#energyBar').style.width = `${clamp((hero.energy / maxEnergy) * 100, 0, 100)}%`;

    $('#floorTitle').textContent = `Этаж ${roman(state.floor)}`;
    $('#depth').textContent = `Глубина ${state.floor}`;
    $('#opened').textContent = `Открыто ${state.revealedCount} / 25`;
    $('#subtitle').textContent = state.threats.length ? `погоня: ${state.threats.length} угроз` : 'живое подземелье';

    const incoming = incomingDamage();
    $('#dangerBanner').classList.toggle('show', state.threats.length > 0);
    $('#incoming').textContent = incoming > 0 ? `сейчас ~${incoming} урона` : 'удары готовятся';

    $('#grid').innerHTML = state.cells.map((cell) => {
      const threat = state.threats.find((entry) => entry.cellIndex === cell.index) || null;
      const counter = threat ? `<span class="counter">${threat.counter}</span>` : '';
      return `<button class="${cellClass(cell)}" data-index="${cell.index}" aria-label="Комната ${cell.index + 1}">${cellDisplay(cell)}${counter}<span class="you">ТЫ</span></button>`;
    }).join('');
    $$('.cell').forEach((button) => button.addEventListener('click', () => interactCell(Number(button.dataset.index))));

    renderThreats();

    $('#potionBtn').textContent = `🧪 Эликсир (${hero.potions})`;
    $('#guardBtn').disabled = state.threats.length === 0;
    $('#waitBtn').disabled = state.threats.length === 0 && hero.energy >= maxEnergy;

    $('#equip').innerHTML = SLOT_ORDER.map((slot) => {
      const item = hero.equipment[slot];
      if (!item) return `<div class="slot"><div><span>${SLOT_ICONS[slot]}</span>пусто</div></div>`;
      return `<div class="slot has" style="border-color:${item.color}" title="${item.description}"><div><span>${item.icon}</span>${item.name.split(' ')[0]}</div></div>`;
    }).join('');

    $('#log').innerHTML = state.log.slice(-22).reverse().map((entry) => `<div class="${entry.type || ''}">${entry.text}</div>`).join('');
  }

  function roman(number) {
    const values = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    let remaining = number;
    for (const [value, symbol] of values) {
      while (remaining >= value) { result += symbol; remaining -= value; }
    }
    return result;
  }

  function showEvent(title, icon, text, choices) {
    eventLocked = true;
    $('#eventModal').innerHTML = `
      <div class="build">СОБЫТИЕ ПОДЗЕМЕЛЬЯ</div>
      <h2>${title}</h2>
      <div class="art">${icon}</div>
      <p>${text}</p>
      <div class="choices">
        ${choices.map((choice, index) => `<button class="choice" data-choice="${index}" ${choice.disabled ? 'disabled' : ''}><b>${choice.title}</b><small>${choice.subtitle || ''}</small></button>`).join('')}
      </div>`;
    $('#eventOverlay').classList.add('show');
    $$('.choice').forEach((button) => button.addEventListener('click', () => {
      const choice = choices[Number(button.dataset.choice)];
      if (!choice || choice.disabled) return;
      choice.action();
      saveGame();
    }));
  }

  function closeEvent() {
    eventLocked = false;
    $('#eventOverlay').classList.remove('show');
    render();
    saveGame();
  }

  function addLog(text, type = '') {
    state.log.push({ text, type });
    if (state.log.length > 80) state.log.shift();
  }

  function notify(title, text) {
    const toast = $('#toast');
    toast.innerHTML = `<b>${title}</b>${text}`;
    toast.classList.add('show');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => toast.classList.remove('show'), 2300);
  }

  function flashDamage() {
    document.body.classList.remove('hurt');
    void document.body.offsetWidth;
    document.body.classList.add('hurt');
    window.setTimeout(() => document.body.classList.remove('hurt'), 300);
  }

  function gameOver(cause) {
    localStorage.removeItem(SAVE_KEY);
    eventLocked = true;
    showEvent('Экспедиция окончена', '☠️', `Тебя остановили: ${cause}. Этаж ${state.floor}, открыто комнат ${state.stats.rooms}, убито врагов ${state.stats.kills}.`, [
      { title: 'Начать новую экспедицию', subtitle: 'Подземелье будет создано заново', action: () => { closeEvent(); startNewGame(); } }
    ]);
  }

  function saveGame() {
    if (!state) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Save failed', error);
    }
  }

  function loadGame() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || saved.version !== 2) return false;
      state = saved;
      eventLocked = false;
      $('#start').classList.add('hide');
      render();
      return true;
    } catch (error) {
      return false;
    }
  }

  function startNewGame() {
    state = newState();
    eventLocked = false;
    $('#eventOverlay').classList.remove('show');
    $('#start').classList.add('hide');
    initFloor();
  }

  $('#newBtn').addEventListener('click', startNewGame);
  $('#continueBtn').disabled = !localStorage.getItem(SAVE_KEY);
  $('#continueBtn').addEventListener('click', () => loadGame() || startNewGame());
  $('#saveBtn').addEventListener('click', () => { saveGame(); notify('Сохранено', 'Прогресс хранится в Safari.'); });
  $('#resetBtn').addEventListener('click', () => { if (window.confirm('Начать новую экспедицию и удалить текущий прогресс?')) startNewGame(); });
  $('#guardBtn').addEventListener('click', guardAction);
  $('#potionBtn').addEventListener('click', potionAction);
  $('#waitBtn').addEventListener('click', waitAction);
  window.addEventListener('beforeunload', saveGame);
})();
