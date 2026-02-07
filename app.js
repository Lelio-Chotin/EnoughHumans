let particles = [];
const gameArea = document.getElementById("gameArea");
const gameCanvas = document.getElementById("gameCanvas");
let teamA = [], teamB = [];
let lastTime = 0, timeScale = 1, simTime = 0, isPaused = true;
let currentZoom = 1, translateX = 0, translateY = 0, isDragging = false, startX, startY;
let gameEnded = false;

gameCanvas.style.transformOrigin = "0 0";

const ResourceManager = {
    images: {},
    assets: {},
    loaded: 0,
    toLoad: 0,

    prepareAssets() {
        const states = ['idle', 'attack', 'hit'];
        if (typeof CHAR_TYPES !== 'undefined') {
            Object.keys(CHAR_TYPES).forEach(type => {
                states.forEach(state => {
                    this.assets[`${type}_${state}`] = `./sprites/${type}/${state}.svg`;
                });
            });
        }
    },

    init() {
        this.prepareAssets();
        this.toLoad = Object.keys(this.assets).length;
        this.loaded = 0;

        return new Promise((resolve) => {
            if (this.toLoad === 0) resolve();

            for (let key in this.assets) {
                const img = new Image();
                img.src = this.assets[key];
                img.onload = () => {
                    this.images[key] = img;
                    this.loaded++;
                    if (this.loaded === this.toLoad) resolve();
                };
                img.onerror = () => {
                    this.loaded++;
                    if (this.loaded === this.toLoad) resolve();
                };
            }
        });
    }
};

class Particle {
    constructor(x, y, targetCanvasId = "gameCanvas") {
        this.x = x;
        this.y = y;
        this.groundY = y + (Math.random() * 30 - 10);
        const colors = ['#FF007F', '#4b84fd', '#3cd301', '#CCFF00', '#FF00FF', '#FFAC1C'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const force = 0.5 + Math.random() * 2.5;
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force - 2;
        this.gravity = 0.15;
        this.friction = 0.95;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 3;
        this.el = document.createElement('div');
        this.el.className = 'particle';
        this.isLanded = false;
        Object.assign(this.el.style, {
            width: `${this.size}px`, height: `${this.size}px`,
            backgroundColor: randomColor, left: '0', top: '0', position: 'absolute',
            borderRadius: '1px'
        });
        const container = document.getElementById(targetCanvasId);
        if (container) container.appendChild(this.el);
        else gameCanvas.appendChild(this.el);
    }

    update() {
        if (this.isLanded) return true;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        const rotation = this.y * 2;
        if (this.y >= this.groundY || (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1)) {
            this.land();
        }
        this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${rotation}deg)`;
        return true;
    }

    land() {
        this.isLanded = true;
        this.el.classList.add('landed');
        this.el.style.transform = `translate(${this.x}px, ${this.groundY}px) rotate(${Math.random() * 360}deg)`;
        this.el.style.opacity = "0.7";
        this.el.style.transition = "none";
    }
}

class Entity {
    constructor(type, x, y, teamLabel, targetCanvasId = "gameCanvas") {
        const stats = CHAR_TYPES[type];
        this.type = type;
        this.team = teamLabel;
        this.x = x;
        this.y = y;
        this.w = stats.w;
        this.h = stats.h;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.kbForce = stats.kbForce;
        this.mass = stats.mass || 1;
        this.range = stats.range;
        this.splash = stats.splash || 0;
        this.attackCooldown = stats.cooldown;
        this.lastAttackTime = 0;
        this.kb = {x: 0, y: 0};
        this.kbFriction = 0.90;
        this.isDying = false;
        this.exploded = false;
        this.facing = teamLabel === 'A' ? 1 : -1;
        this.isHitVisualActive = false;
        this.walkCycle = Math.random() * 100;
        this.isMoving = false;
        this.lastSpriteKey = null;

        this.element = document.createElement("div");
        this.element.className = `entity ${type}`;
        this.isAttackLocked = false;
        Object.assign(this.element.style, {
            width: `${this.w}px`, height: `${this.h}px`,
            position: 'absolute', left: '0', top: '0',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center bottom',
            zIndex: '10'
        });

        this.hpContainer = document.createElement("div");
        this.hpContainer.className = "hp-bar-container";
        this.hpBar = document.createElement("div");
        this.hpBar.className = "hp-bar-fill";
        this.hpContainer.appendChild(this.hpBar);
        this.element.appendChild(this.hpContainer);
        this.hpTimer = null;

        const container = document.getElementById(targetCanvasId);
        if (container) container.appendChild(this.element);
        else {
            const fallback = document.getElementById("gameCanvas");
            if (fallback) fallback.appendChild(this.element);
        }
    }

    get center() {
        return {x: this.x + this.w / 2, y: this.y + this.h / 2};
    }

    update(dt, areaW, areaH) {
        const frameFactor = dt * 60;

        this.x += this.kb.x * frameFactor;
        this.y += this.kb.y * frameFactor;
        this.kb.x *= Math.pow(this.kbFriction, frameFactor);
        this.kb.y *= Math.pow(this.kbFriction, frameFactor);

        if (this.isHitVisualActive && Math.hypot(this.kb.x, this.kb.y) < 1.0) {
            this.isHitVisualActive = false;
            setTimeout(() => this.element.classList.remove('hit'), 200);
        }

        this.x = Math.max(0, Math.min(this.x, areaW - this.w));
        this.y = Math.max(0, Math.min(this.y, areaH - this.h));

        if (this.isDying && !this.exploded) {
            if (Math.hypot(this.kb.x, this.kb.y) < 0.5) {
                const count = this.type === 'gorille' ? 30 : 12;
                for (let i = 0; i < count; i++) particles.push(new Particle(this.center.x, this.center.y));
                this.exploded = true;
                this.shouldRemove = true;
            }
        }
    }

    draw() {
        let hopY = 0;
        let hopRot = 0;
        let stretch = 1;
        let squash = 1;

        if (this.isMoving && !this.isDying) {
            hopY = Math.abs(Math.sin(this.walkCycle * 10)) * -7;
            hopRot = Math.sin(this.walkCycle * 10) * 5;
            const deformation = hopY * -0.01;
            stretch = 1 + deformation;
            squash = 1 - (deformation * 0.5);
        }

        let state = 'idle';
        if (this.isHitVisualActive) state = 'hit';
        else if (this.element.classList.contains('attacking')) state = 'attack';

        const spriteKey = `${this.type}_${state}`;
        if (this.lastSpriteKey !== spriteKey) {
            const imgObj = ResourceManager.images[spriteKey];
            if (imgObj) {
                this.element.style.backgroundImage = `url('${imgObj.src}')`;
                this.lastSpriteKey = spriteKey;
            }
        }

        const flip = this.facing === -1 ? "scaleX(-1)" : "scaleX(1)";

        this.element.style.transform =
            `translate(${this.x}px, ${this.y + hopY}px) 
             ${flip} 
             scale(${squash}, ${stretch}) 
             rotate(${hopRot}deg)`;

        this.element.style.zIndex = Math.floor(this.y + this.h);
        if (this.isDying) this.element.style.opacity = "0.4";
    }

    takeDamage(amt, fx, fy, rawForce) {
        if (this.isDying) return;
        this.hp -= amt;
        const effectiveForce = rawForce / this.mass;
        const dx = this.center.x - fx, dy = this.center.y - fy, d = Math.hypot(dx, dy) || 1;
        this.kb.x = (dx / d) * effectiveForce;
        this.kb.y = (dy / d) * effectiveForce;

        if (effectiveForce > 3.5 && !this.isAttackLocked) {
            this.element.classList.add('hit');
            this.isHitVisualActive = true;
            setTimeout(() => {
                this.element.classList.remove('hit');
                this.isHitVisualActive = false;
            }, 450);
        }

        const pct = Math.max(0, (this.hp / this.maxHp) * 100);
        this.hpBar.style.width = `${pct}%`;
        this.hpContainer.classList.remove('hp-low', 'hp-mid');
        if (pct < 30) this.hpContainer.classList.add('hp-low');
        else if (pct < 60) this.hpContainer.classList.add('hp-mid');
        this.hpContainer.style.opacity = "1";

        if (this.hpTimer) clearTimeout(this.hpTimer);
        this.hpTimer = setTimeout(() => {
            if (!this.isDying) this.hpContainer.style.opacity = "0";
        }, 750);

        if (this.hp <= 0) {
            this.isDying = true;
            this.hpContainer.style.opacity = "0";
        }
    }
}

function resolveCollisions(entities) {
    const iterations = 2;
    for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const a = entities[i];
                const b = entities[j];

                if (a.isDying || b.isDying) continue;

                const dx = a.center.x - b.center.x;
                const dy = a.center.y - b.center.y;
                const dist = Math.hypot(dx, dy);

                const minDist = (a.w + b.w) * 0.35;

                if (dist < minDist && dist > 0) {
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const totalMass = a.mass + b.mass;
                    const mRatioA = b.mass / totalMass;
                    const mRatioB = a.mass / totalMass;

                    const moveX = nx * overlap;
                    const moveY = ny * overlap;

                    a.x += moveX * mRatioA;
                    a.y += moveY * mRatioA;
                    b.x -= moveX * mRatioB;
                    b.y -= moveY * mRatioB;
                }
            }
        }
    }
}

function updateCanvasTransform() {
    gameCanvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

gameArea.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let nextX = e.clientX - startX;
    let nextY = e.clientY - startY;
    const minX = -(gameArea.clientWidth * (currentZoom - 1));
    const minY = -(gameArea.clientHeight * (currentZoom - 1));
    translateX = Math.min(0, Math.max(nextX, minX));
    translateY = Math.min(0, Math.max(nextY, minY));
    updateCanvasTransform();
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});
gameArea.addEventListener('dragstart', (e) => e.preventDefault());

let currentSpeedIndex = 0;
const speeds = [1, 2, 4];

function cycleSpeed() {
    currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
    timeScale = speeds[currentSpeedIndex];
    document.getElementById('cycleSpeed').innerText = `x${timeScale}`;
}

let currentZoomIndex = 0;
const zooms = [1, 1.5, 2];

function cycleZoom() {
    currentZoomIndex = (currentZoomIndex + 1) % zooms.length;
    currentZoom = zooms[currentZoomIndex];
    document.getElementById('cycleZoom').innerText = `x${currentZoom}`;
    const minX = -(gameArea.clientWidth * (currentZoom - 1));
    const minY = -(gameArea.clientHeight * (currentZoom - 1));
    translateX = Math.min(0, Math.max(translateX, minX));
    translateY = Math.min(0, Math.max(translateY, minY));
    updateCanvasTransform();
}

function togglePlay() {
    const sandbox = document.getElementById('sandboxUI');
    const winModal = document.getElementById('winModal');
    const allEntities = [...teamA, ...teamB];

    if (isPaused && !gameEnded) {
        if (sandbox) {
            sandbox.classList.add('hidden');
            setTimeout(() => {
                if (sandbox.classList.contains('hidden')) sandbox.style.display = 'none';
            }, 300);
        }
        if (winModal) {
            winModal.classList.add('hidden');
            winModal.style.pointerEvents = "none";
        }
        allEntities.forEach(e => {
            e.element.classList.add('visible');
        });
    }

    isPaused = !isPaused;
    document.getElementById('playPause').innerText = isPaused ? "REPRENDRE" : "PAUSE";
    document.getElementById('playPause').classList.toggle('paused', isPaused);
}

function createShockwave(x, y, r) {
    const w = document.createElement("div");
    w.className = "shockwave";
    Object.assign(w.style, {left: `${x - r}px`, top: `${y - r}px`, width: `${r * 2}px`, height: `${r * 2}px`});
    gameCanvas.appendChild(w);
    gameArea.classList.remove('shake');
    void gameArea.offsetWidth;
    gameArea.classList.add('shake');
    setTimeout(() => {
        w.style.transform = "scale(1)";
        w.style.opacity = "0";
    }, 10);
    setTimeout(() => {
        w.remove();
        gameArea.classList.remove('shake');
    }, 300);
}

function toggleInfoModal(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('infoModal');
    modal.classList.toggle('hidden-modal');
    if (!modal.classList.contains('hidden-modal')) updateInfoContent();
}

function updateInfoContent() {
    const params = new URLSearchParams(window.location.search);
    const combatId = params.get('combat');
    const titleElement = document.getElementById('infoTitle');
    const bodyElement = document.getElementById('infoBody');
    if (combatId && SCENARIOS[combatId]) {
        titleElement.innerText = SCENARIOS[combatId].nom;
        bodyElement.innerHTML = SCENARIOS[combatId].description || "Aucune donnée disponible.";
    } else if (combatId === 'sandbox') {
        titleElement.innerText = "Mode Bac à Sable";
        bodyElement.innerHTML = "Ajustez les paramètres pour observer les simulations.";
    }
}

function startHomeDemo() {
    const simuDiv = document.querySelector('.simu');
    if (!simuDiv) return;
    simuDiv.innerHTML = `
        <div class="scene-combat">
            <div class="hero-center">
                <img src="./sprites/gorille/attack.svg" class="sprite-hero yoyo">
            </div>
            <img src="./sprites/adulte/idle.svg" class="attacker pos-top-left yoyo-delay-1">
            <img src="./sprites/adulte/attack.svg" class="attacker pos-bottom-left yoyo-delay-2">
            <img src="./sprites/adulte/idle.svg" class="attacker pos-right yoyo-delay-3">
            <img src="./sprites/adulte/hit.svg" class="attacker pos-knockback">
        </div>
    `;
}

function resetSimulation() {
    gameCanvas.innerHTML = '';
    teamA = [];
    teamB = [];
    particles = [];
    simTime = 0;
    isPaused = true;
    gameEnded = false;
    timeScale = speeds[currentSpeedIndex];

    const winModal = document.getElementById('winModal');
    if (winModal) {
        winModal.classList.add('hidden');
        winModal.style.opacity = "0";
        winModal.style.pointerEvents = "none";
    }

    document.getElementById('playPause').innerText = "LANCER";
    document.getElementById('playPause').classList.remove('paused');

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('combat');
    if (!id) return;

    document.getElementById('homeView').style.display = 'none';
    document.getElementById('simuView').style.display = 'flex';

    const s = SCENARIOS[id];
    const areaW = gameArea.clientWidth;
    const areaH = gameArea.clientHeight;
    const sandboxUI = document.getElementById('sandboxUI');

    if (s.isSandbox || id === 'sandbox') {
        sandboxUI.style.display = "flex";
        sandboxUI.classList.remove('hidden');
        document.getElementById('scenarioName').innerText = "Bac à Sable";
        const typeA = document.getElementById('selectA').value || 'adulte';
        const typeB = document.getElementById('selectB').value || 'enfant';
        const numA = parseInt(document.getElementById('inputA').value) || 1;
        const numB = parseInt(document.getElementById('inputB').value) || 1;
        for (let i = 0; i < numA; i++) teamA.push(new Entity(typeA, 50 + Math.random() * 100, Math.random() * (areaH - 100), 'A'));
        for (let i = 0; i < numB; i++) teamB.push(new Entity(typeB, areaW - 200 - Math.random() * 100, Math.random() * (areaH - 100), 'B'));
    } else {
        if (sandboxUI) sandboxUI.style.display = "none";
        document.getElementById('scenarioName').innerText = s.nom;
        for (let i = 0; i < s.teamA.count; i++) teamA.push(new Entity(s.teamA.type, 50 + Math.random() * 50, Math.random() * (areaH - 100), 'A'));
        for (let i = 0; i < s.teamB.count; i++) teamB.push(new Entity(s.teamB.type, areaW - 150 - Math.random() * 50, Math.random() * (areaH - 100), 'B'));
    }
    [...teamA, ...teamB].forEach(e => e.draw());
}

document.querySelectorAll('#sandboxUI input, #sandboxUI select').forEach(el => {
    el.addEventListener('change', () => {
        if (isPaused) resetSimulation();
    });
});

function updateLogic(curr, enemy, dt) {
    const areaW = gameArea.clientWidth;
    const areaH = gameArea.clientHeight;
    const alive = enemy.filter(e => !e.isDying);

    for (let i = curr.length - 1; i >= 0; i--) {
        const m = curr[i];
        if (m.isDying) {
            m.update(dt, areaW, areaH);
            if (m.shouldRemove) {
                m.element.remove();
                curr.splice(i, 1);
            }
            continue;
        }

        const knockbackSpeed = Math.hypot(m.kb.x, m.kb.y);
        const isStunned = knockbackSpeed > 2.0;

        if (!isStunned && alive.length > 0) {
            let target = alive[0], minDist = Math.hypot(m.center.x - target.center.x, m.center.y - target.center.y);
            for (let e of alive) {
                let d = Math.hypot(m.center.x - e.center.x, m.center.y - e.center.y);
                if (d < minDist) {
                    minDist = d;
                    target = e;
                }
            }
            const dx = (target.center.x - m.center.x) || 0.01, dy = (target.center.y - m.center.y) || 0.01;

            if (knockbackSpeed < 1.0) {
                if (minDist > m.range * 0.7) {
                    const speedMult = m.speed * dt;
                    m.x += (dx / minDist) * speedMult;
                    m.y += (dy / minDist) * speedMult;
                    m.facing = dx > 0 ? 1 : -1;
                    m.isMoving = true;
                    m.walkCycle += dt * (m.speed / 100) * 0.75;
                } else m.isMoving = false;
            } else m.isMoving = false;

            if (minDist < m.range && simTime - m.lastAttackTime > m.attackCooldown) {
                const animDur = Math.min(350, m.attackCooldown - 200);
                m.element.classList.remove('hit');
                m.element.classList.add('attacking');
                setTimeout(() => m.element.classList.remove('attacking'), animDur);

                if (m.splash > 0) {
                    const maxR = m.range + m.splash;
                    createShockwave(m.center.x, m.center.y, maxR);
                    alive.forEach(e => {
                        const d = Math.hypot(m.center.x - e.center.x, m.center.y - e.center.y);
                        if (d < maxR) {
                            const ratio = Math.max(0, 1 - d / maxR);
                            e.takeDamage(m.damage * ratio, m.center.x, m.center.y, m.kbForce * ratio);
                        }
                    });
                } else target.takeDamage(m.damage, m.center.x, m.center.y, m.kbForce);
                m.lastAttackTime = simTime;
            }
        } else m.isMoving = false;

        m.update(dt, areaW, areaH);
    }
}

function showVictory(msg) {
    if (gameEnded) return;
    gameEnded = true;
    const winModal = document.getElementById('winModal');
    const winTitle = document.getElementById('winTitle');
    const winSurvivors = document.getElementById('winSurvivors');
    const winTime = document.getElementById('winTime');

    if (winModal && winTitle) {
        let finalMsg = msg;
        const aliveA = teamA.filter(e => !e.isDying);
        const aliveB = teamB.filter(e => !e.isDying);
        const winners = aliveA.length > 0 ? aliveA : aliveB;
        if (winners.length > 0) {
            const type = winners[0].type.toLowerCase();
            const det = winners.length > 1 ? "DES" : (/^[aeiouy]/i.test(type) ? "DE L'" : "DU");
            finalMsg = `VICTOIRE ${det} ${type.toUpperCase()}${winners.length > 1 ? "S" : ""} !`;
        } else if (msg !== "ÉGALITÉ !") finalMsg = "MATCH NUL !";

        winTitle.innerText = finalMsg;
        const totalAlive = aliveA.length + aliveB.length;
        if (winSurvivors) winSurvivors.innerText = `Survivants: ${totalAlive}`;
        if (winTime) winTime.innerText = `Temps réel: ${(simTime / 1000).toFixed(1)}s`;
        winModal.classList.remove('hidden');
        winModal.style.opacity = "1";
        winModal.style.pointerEvents = "auto";
        timeScale = .5;
    }
}

function loop(t) {
    let realDt = Math.min(0.1, (t - lastTime) / 1000);
    lastTime = t;
    particles = particles.filter(p => p.update());

    if (!isPaused) {
        let currentSlowMo = (teamA.filter(e => !e.isDying).length === 0 || teamB.filter(e => !e.isDying).length === 0) ? 0.25 : 1;
        const dt = realDt * timeScale * currentSlowMo;
        simTime += dt * 1000;

        updateLogic(teamA, teamB, dt);
        updateLogic(teamB, teamA, dt);

        const allEntities = [...teamA, ...teamB];
        resolveCollisions(allEntities);

        allEntities.forEach(e => e.draw());

        if (!gameEnded && simTime > 500) {
            const aliveA = teamA.filter(e => !e.isDying).length;
            const aliveB = teamB.filter(e => !e.isDying).length;
            if (aliveA === 0 && aliveB === 0) showVictory("ÉGALITÉ !");
            else if (aliveA > 0 && aliveB === 0) showVictory("A");
            else if (aliveB > 0 && aliveA === 0) showVictory("B");
        }
    }
    const countA = document.getElementById("countA");
    const countB = document.getElementById("countB");
    if (countA) countA.innerText = teamA.filter(e => !e.isDying).length;
    if (countB) countB.innerText = teamB.filter(e => !e.isDying).length;
    requestAnimationFrame(loop);
}

const selA = document.getElementById('selectA'), selB = document.getElementById('selectB');
if (selA && selB && typeof CHAR_TYPES !== 'undefined') {
    Object.keys(CHAR_TYPES).forEach(k => {
        selA.add(new Option(k.toUpperCase(), k));
        selB.add(new Option(k.toUpperCase(), k));
    });
}

window.addEventListener('load', () => {
    ResourceManager.init().then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('combat')) {
            document.getElementById('homeView').style.display = 'none';
            document.getElementById('simuView').style.display = 'block';
            resetSimulation();
        } else {
            document.getElementById('homeView').style.display = 'block';
            document.getElementById('simuView').style.display = 'none';
            startHomeDemo();
        }
        requestAnimationFrame(loop);
    });
});