/*==========================================================
 Interactive Chemistry Simulation Framework
 Version : 2.0
 Author  : IMPHUONGANH
 Engine  : p5.js
==========================================================*/

"use strict";

/*==========================================================
 CONFIGURATION
==========================================================*/

const CONFIG = {
    APP_NAME: "Interactive Chemistry Simulation",
    VERSION: "2.0",
    TARGET_FPS: 60,
    BACKGROUND: "#EEF5FF",
    GRID: false,
    DEBUG: false,
    SHOW_AXES: false,
    PIXEL_DENSITY: 1,
    CANVAS_PARENT: "canvas-container",
    CAMERA: { zoom: 1, x: 0, y: 0 },
    ATOM: {
        nucleusRadius: 28,
        shellGap: 34,
        glow: 14,
        labelOffset: 40
    },
    ELECTRON: {
        radius: 7,
        speed: 0.018,
        glow: 12,
        sharedSpeed: 0.06
    },
    ANIMATION: {
        approachDuration: 3000,
        overlapDuration: 2500,
        sharingDuration: 3500,
        stabilizeDuration: 2500
    }
};

/*==========================================================
 GLOBAL VARIABLES
==========================================================*/

let renderer;
let engine;
let ui;
let cameraController;
let simulationManager;
let notify;
let tooltip;
const particles = [];

/*==========================================================
 ENUMS
==========================================================*/

const SimulationState = {
    READY: "ready",
    PLAYING: "playing",
    PAUSED: "paused",
    STEP: "step",
    FINISHED: "finished"
};

const BondType = {
    SINGLE: 1,
    DOUBLE: 2,
    TRIPLE: 3
};

/*==========================================================
 ELEMENT DATABASE
==========================================================*/

const ELEMENT_DATABASE = {
    H: {
        symbol: "H", name: "Hydrogen", atomicNumber: 1, atomicMass: 1.008,
        valence: 1, shells: [1], color: "#4DA3FF", nucleus: "#1D4ED8"
    },
    O: {
        symbol: "O", name: "Oxygen", atomicNumber: 8, atomicMass: 15.999,
        valence: 6, shells: [2, 6], color: "#FF5C5C", nucleus: "#C62828"
    },
    N: {
        symbol: "N", name: "Nitrogen", atomicNumber: 7, atomicMass: 14.007,
        valence: 5, shells: [2, 5], color: "#4C7DFF", nucleus: "#1E40AF"
    },
    C: {
        symbol: "C", name: "Carbon", atomicNumber: 6, atomicMass: 12.011,
        valence: 4, shells: [2, 4], color: "#555555", nucleus: "#222222"
    },
    Cl: {
        symbol: "Cl", name: "Chlorine", atomicNumber: 17, atomicMass: 35.45,
        valence: 7, shells: [2, 8, 7], color: "#2ECC71", nucleus: "#18864A"
    },
    S: {
        symbol: "S", name: "Sulfur", atomicNumber: 16, atomicMass: 32.06,
        valence: 6, shells: [2, 8, 6], color: "#E8C547", nucleus: "#B8860B"
    }
};

/*==========================================================
 MOLECULE DATABASE
==========================================================*/

const MOLECULES = {
    H2: {
        fullName: "Hydrogen (H₂)",
        atoms: [
            { symbol: "H", x: -240, y: 0, finalX: -90, finalY: 0 },
            { symbol: "H", x: 240, y: 0, finalX: 90, finalY: 0 }
        ],
        bonds: [{ a: 0, b: 1, type: 1 }],
        valence: "H: 1 electron<br>H: 1 electron",
        atomInfo: "H (Z=1, A=1)<br>1 electron lớp ngoài",
        explanations: [
            "Hai nguyên tử H tiến lại gần nhau. Mỗi H có 1 electron lớp ngoài.",
            "Orbital 1s của hai nguyên tử H bắt đầu xen phủ.",
            "Hai electron (mỗi H đóng góp 1) được chia sẻ giữa hai hạt nhân.",
            "Liên kết đơn H—H đã hình thành. Cả 2 H đạt cấu hình bền của He."
        ]
    },
    O2: {
        fullName: "Oxygen (O₂)",
        atoms: [
            { symbol: "O", x: -280, y: 0, finalX: -120, finalY: 0 },
            { symbol: "O", x: 280, y: 0, finalX: 120, finalY: 0 }
        ],
        bonds: [{ a: 0, b: 1, type: 2 }],
        valence: "O: 6 electron<br>O: 6 electron",
        atomInfo: "O (Z=8, A=16)<br>6 electron lớp ngoài",
        explanations: [
            "Hai nguyên tử O tiến lại gần nhau. Mỗi O có 6 electron lớp ngoài.",
            "Orbital p của hai O bắt đầu xen phủ.",
            "Mỗi O đóng góp 2 electron → 2 cặp electron chia sẻ (liên kết đôi).",
            "Liên kết đôi O=O đã hình thành. Mỗi O đạt 8 electron lớp ngoài."
        ]
    },
    N2: {
        fullName: "Nitrogen (N₂)",
        atoms: [
            { symbol: "N", x: -280, y: 0, finalX: -120, finalY: 0 },
            { symbol: "N", x: 280, y: 0, finalX: 120, finalY: 0 }
        ],
        bonds: [{ a: 0, b: 1, type: 3 }],
        valence: "N: 5 electron<br>N: 5 electron",
        atomInfo: "N (Z=7, A=14)<br>5 electron lớp ngoài",
        explanations: [
            "Hai nguyên tử N tiến lại gần nhau. Mỗi N có 5 electron lớp ngoài.",
            "Orbital p của hai N bắt đầu xen phủ mạnh.",
            "Mỗi N đóng góp 3 electron → 3 cặp electron chia sẻ (liên kết ba).",
            "Liên kết ba N≡N đã hình thành. Mỗi N đạt 8 electron lớp ngoài."
        ]
    },
    Cl2: {
        fullName: "Chlorine (Cl₂)",
        atoms: [
            { symbol: "Cl", x: -300, y: 0, finalX: -150, finalY: 0 },
            { symbol: "Cl", x: 300, y: 0, finalX: 150, finalY: 0 }
        ],
        bonds: [{ a: 0, b: 1, type: 1 }],
        valence: "Cl: 7 electron<br>Cl: 7 electron",
        atomInfo: "Cl (Z=17, A=35.5)<br>7 electron lớp ngoài",
        explanations: [
            "Hai nguyên tử Cl tiến lại gần nhau. Mỗi Cl có 7 electron lớp ngoài.",
            "Orbital p của hai Cl bắt đầu xen phủ.",
            "Mỗi Cl đóng góp 1 electron → 1 cặp electron chia sẻ (liên kết đơn).",
            "Liên kết đơn Cl—Cl đã hình thành. Mỗi Cl đạt 8 electron lớp ngoài."
        ]
    },
    NH3: {
        fullName: "Ammonia (NH₃)",
        atoms: [
            { symbol: "N", x: 0, y: -60, finalX: 0, finalY: 0 },
            { symbol: "H", x: -240, y: -140, finalX: -120, finalY: -70 },
            { symbol: "H", x: 240, y: -140, finalX: 120, finalY: -70 },
            { symbol: "H", x: 0, y: 260, finalX: 0, finalY: 130 }
        ],
        bonds: [
            { a: 0, b: 1, type: 1 },
            { a: 0, b: 2, type: 1 },
            { a: 0, b: 3, type: 1 }
        ],
        valence: "N: 5 electron<br>H: 1 electron (×3)",
        atomInfo: "N (Z=7), H (Z=1)<br>N tạo 3 liên kết đơn với 3H",
        explanations: [
            "Nguyên tử N ở giữa, 3 nguyên tử H tiến lại gần. N có 5e, mỗi H có 1e.",
            "Orbital của N và H bắt đầu xen phủ.",
            "N đóng góp 3 electron, mỗi H đóng góp 1 → 3 cặp electron chia sẻ.",
            "3 liên kết đơn N—H đã hình thành. N đạt 8e, mỗi H đạt 2e (bền)."
        ]
    },
    H2O: {
        fullName: "Water (H₂O)",
        atoms: [
            { symbol: "O", x: 0, y: -60, finalX: 0, finalY: 0 },
            { symbol: "H", x: -260, y: 140, finalX: -130, finalY: 70 },
            { symbol: "H", x: 260, y: 140, finalX: 130, finalY: 70 }
        ],
        bonds: [
            { a: 0, b: 1, type: 1 },
            { a: 0, b: 2, type: 1 }
        ],
        valence: "O: 6 electron<br>H: 1 electron (×2)",
        atomInfo: "O (Z=8), H (Z=1)<br>O tạo 2 liên kết đơn với 2H",
        explanations: [
            "Nguyên tử O ở giữa, 2 nguyên tử H tiến lại gần. O có 6e, mỗi H có 1e.",
            "Orbital của O và H bắt đầu xen phủ.",
            "O đóng góp 2 electron, mỗi H đóng góp 1 → 2 cặp electron chia sẻ.",
            "2 liên kết đơn O—H đã hình thành. O đạt 8e, góc liên kết ~104.5°."
        ]
    },
    CO2: {
        fullName: "Carbon Dioxide (CO₂)",
        atoms: [
            { symbol: "C", x: 0, y: 0, finalX: 0, finalY: 0 },
            { symbol: "O", x: -340, y: 0, finalX: -160, finalY: 0 },
            { symbol: "O", x: 340, y: 0, finalX: 160, finalY: 0 }
        ],
        bonds: [
            { a: 0, b: 1, type: 2 },
            { a: 0, b: 2, type: 2 }
        ],
        valence: "C: 4 electron<br>O: 6 electron (×2)",
        atomInfo: "C (Z=6), O (Z=8)<br>C tạo 2 liên kết đôi với 2O",
        explanations: [
            "Nguyên tử C ở giữa, 2 nguyên tử O tiến lại gần từ hai phía. C có 4e, mỗi O có 6e.",
            "Orbital p của C và O bắt đầu xen phủ.",
            "C đóng góp 2 electron cho mỗi O → 2 liên kết đôi C=O.",
            "2 liên kết đôi C=O đã hình thành. C và O đều đạt 8e. Phân tử tuyến tính."
        ]
    },
    H2S: {
        fullName: "Hydrogen Sulfide (H₂S)",
        atoms: [
            { symbol: "S", x: 0, y: -60, finalX: 0, finalY: 0 },
            { symbol: "H", x: -280, y: 140, finalX: -140, finalY: 70 },
            { symbol: "H", x: 280, y: 140, finalX: 140, finalY: 70 }
        ],
        bonds: [
            { a: 0, b: 1, type: 1 },
            { a: 0, b: 2, type: 1 }
        ],
        valence: "S: 6 electron<br>H: 1 electron (×2)",
        atomInfo: "S (Z=16), H (Z=1)<br>S tạo 2 liên kết đơn với 2H",
        explanations: [
            "Nguyên tử S ở giữa, 2 nguyên tử H tiến lại gần. S có 6e, mỗi H có 1e.",
            "Orbital của S và H bắt đầu xen phủ.",
            "S đóng góp 2 electron, mỗi H đóng góp 1 → 2 cặp electron chia sẻ.",
            "2 liên kết đơn S—H đã hình thành. S đạt 8e. Tương tự H₂O."
        ]
    },
    CH4: {
        fullName: "Methane (CH₄)",
        atoms: [
            { symbol: "C", x: 0, y: 0, finalX: 0, finalY: 0 },
            { symbol: "H", x: 0, y: -260, finalX: 0, finalY: -130 },
            { symbol: "H", x: -260, y: 0, finalX: -130, finalY: 0 },
            { symbol: "H", x: 260, y: 0, finalX: 130, finalY: 0 },
            { symbol: "H", x: 0, y: 260, finalX: 0, finalY: 130 }
        ],
        bonds: [
            { a: 0, b: 1, type: 1 },
            { a: 0, b: 2, type: 1 },
            { a: 0, b: 3, type: 1 },
            { a: 0, b: 4, type: 1 }
        ],
        valence: "C: 4 electron<br>H: 1 electron (×4)",
        atomInfo: "C (Z=6), H (Z=1)<br>C tạo 4 liên kết đơn với 4H",
        explanations: [
            "Nguyên tử C ở giữa, 4 nguyên tử H tiến lại gần. C có 4e, mỗi H có 1e.",
            "Orbital của C và H bắt đầu xen phủ.",
            "C đóng góp 4 electron, mỗi H đóng góp 1 → 4 cặp electron chia sẻ.",
            "4 liên kết đơn C—H đã hình thành. C đạt 8e. Cấu hình tứ diện."
        ]
    }
};

/*==========================================================
 UTILITY
==========================================================*/

class Utils {
    static clamp(x, min, max) {
        return Math.max(min, Math.min(max, x));
    }
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    static ease(t) {
        if (t < 0.5) return 4 * t * t * t;
        return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    static distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
}

/*==========================================================
 CAMERA
==========================================================*/

class CameraController {
    constructor() {
        this.zoom = 1;
        this.x = 0;
        this.y = 0;
    }
    begin() {
        translate(width / 2 + this.x, height / 2 + this.y);
        scale(this.zoom);
    }
    end() {}
}

/*==========================================================
 RENDERER
==========================================================*/

class Renderer {
    constructor() {
        this.background = CONFIG.BACKGROUND;
    }
    begin() {
        background(this.background);
    }
    end() {}
}

/*==========================================================
 UI MANAGER
==========================================================*/

class UIManager {
    constructor() {
        this.progressFill = document.getElementById("progressFill");
        this.progressValue = document.getElementById("progressValue");
        this.simName = document.getElementById("simName");
        this.valence = document.getElementById("valenceInfo");
        this.atomInfo = document.getElementById("atomInfo");
        this.explanation = document.getElementById("explanation");
    }
    setSimulation(name) { this.simName.innerHTML = name; }
    setProgress(value) {
        value = Utils.clamp(value, 0, 100);
        this.progressFill.style.width = value + "%";
        this.progressValue.innerHTML = Math.floor(value) + "%";
    }
    setValence(html) { this.valence.innerHTML = html; }
    setAtomInfo(html) { this.atomInfo.innerHTML = html; }
    setExplanation(html) { this.explanation.innerHTML = html; }
}

/*==========================================================
 SIMULATION ENGINE
==========================================================*/

class SimulationEngine {
    constructor() {
        this.state = SimulationState.READY;
        this.progress = 0;
        this.time = 0;
        this.speed = 1;
    }
    play() { this.state = SimulationState.PLAYING; }
    pause() { this.state = SimulationState.PAUSED; }
    reset() {
        this.state = SimulationState.READY;
        this.progress = 0;
        this.time = 0;
    }
    update(dt) {
        if (this.state === SimulationState.PLAYING) {
            this.time += dt;
        }
    }
}

/*==========================================================
 ELECTRON
==========================================================*/

class Electron {
    constructor(angle, radius, color) {
        this.angle = angle;
        this.radius = radius;
        this.color = color;
        this.speed = CONFIG.ELECTRON.speed;
        this.size = CONFIG.ELECTRON.radius;
        this.shared = false;
        this.targetX = 0;
        this.targetY = 0;
        this.x = 0;
        this.y = 0;
        this.originalColor = color;
    }

    update() {
        if (!this.shared) {
            this.angle += this.speed;
            this.x = Math.cos(this.angle) * this.radius;
            this.y = Math.sin(this.angle) * this.radius;
        } else {
            this.x = Utils.lerp(this.x, this.targetX, CONFIG.ELECTRON.sharedSpeed);
            this.y = Utils.lerp(this.y, this.targetY, CONFIG.ELECTRON.sharedSpeed);
        }
    }

    draw() {
        push();
        translate(this.x, this.y);
        noStroke();
        drawingContext.shadowBlur = 18;
        drawingContext.shadowColor = this.color;
        fill(this.color);
        circle(0, 0, this.size * 2);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(10);
        text("−", 0, 0);
        drawingContext.shadowBlur = 0;
        pop();
    }
}

/*==========================================================
 ORBIT
==========================================================*/

class Orbit {
    constructor(radius) {
        this.radius = radius;
        this.electrons = [];
        this.deformX = 1;
        this.deformY = 1;
        this.glowAlpha = 0;
    }

    addElectron(e) { this.electrons.push(e); }

    deform(value) {
        this.deformX = 1 + value * 0.18;
        this.deformY = 1 - value * 0.12;
        this.glowAlpha = value * 80;
    }

    resetVisual() {
        this.deformX = 1;
        this.deformY = 1;
        this.glowAlpha = 0;
    }

    update() {
        for (const e of this.electrons) { e.update(); }
    }

    draw() {
        /* glow halo during overlap */
        if (this.glowAlpha > 1) {
            noFill();
            stroke(120, 170, 255, this.glowAlpha);
            strokeWeight(3);
            circle(0, 0, this.radius * 2 + 10);
        }

        /* orbit path */
        push();
        scale(this.deformX, this.deformY);
        noFill();
        stroke(170, 190, 255);
        strokeWeight(1.3);
        circle(0, 0, this.radius * 2);
        pop();

        /* non-shared electrons only */
        for (const e of this.electrons) {
            if (!e.shared) { e.draw(); }
        }
    }
}

/*==========================================================
 NUCLEUS
==========================================================*/

class Nucleus {
    constructor(element) { this.element = element; }

    draw() {
        push();
        noStroke();
        drawingContext.shadowBlur = 22;
        drawingContext.shadowColor = this.element.color;
        fill(this.element.nucleus);
        circle(0, 0, CONFIG.ATOM.nucleusRadius * 2);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(18);
        textStyle(BOLD);
        text(this.element.symbol, 0, 0);
        textStyle(NORMAL);
        drawingContext.shadowBlur = 0;
        pop();
    }
}

/*==========================================================
 ATOM
==========================================================*/

class Atom {
    constructor(symbol, x, y) {
        this.data = ELEMENT_DATABASE[symbol];
        this.x = x;
        this.y = y;
        this.symbol = symbol;
        this.nucleus = new Nucleus(this.data);
        this.orbits = [];
        this.createOrbitals();
    }

    createOrbitals() {
        let radius = 48;
        for (const electronCount of this.data.shells) {
            let orbit = new Orbit(radius);
            for (let i = 0; i < electronCount; i++) {
                orbit.addElectron(new Electron(
                    TWO_PI * i / electronCount,
                    radius,
                    "#1D4ED8"
                ));
            }
            this.orbits.push(orbit);
            radius += CONFIG.ATOM.shellGap;
        }
    }

    update() {
        for (const orbit of this.orbits) { orbit.update(); }
    }

    draw() {
        push();
        let idleY = Math.sin(frameCount * 0.02 + this.x * 0.01) * 1.5;
        translate(this.x, this.y + idleY);

        for (const orbit of this.orbits) { orbit.draw(); }
        this.nucleus.draw();

        pop();
    }
}

/*==========================================================
 BOND (structural — used by Molecule)
==========================================================*/

class Bond {
    constructor(a, b, type = BondType.SINGLE) {
        this.a = a;
        this.b = b;
        this.type = type;
    }

    draw() {
        let angle = Math.atan2(this.b.y - this.a.y, this.b.x - this.a.x);
        let perpX = Math.cos(angle + Math.PI / 2);
        let perpY = Math.sin(angle + Math.PI / 2);
        for (let i = 0; i < this.type; i++) {
            let offset = (i - (this.type - 1) / 2) * 8;
            stroke(120);
            strokeWeight(4);
            line(
                this.a.x + perpX * offset, this.a.y + perpY * offset,
                this.b.x + perpX * offset, this.b.y + perpY * offset
            );
        }
    }
}

/*==========================================================
 MOLECULE
==========================================================*/

class Molecule {
    constructor(name) {
        this.name = name;
        this.atoms = [];
        this.bonds = [];
    }
    addAtom(atom) { this.atoms.push(atom); }
    addBond(bond) { this.bonds.push(bond); }

    update() {
        for (const atom of this.atoms) { atom.update(); }
    }

    draw() {
        for (const atom of this.atoms) { atom.draw(); }
    }
}

/*==========================================================
 SHARED BOND — manages electron sharing visualization
==========================================================*/

class SharedBond {
    constructor(atomA, atomB, type, startIdxA, startIdxB) {
        this.atomA = atomA;
        this.atomB = atomB;
        this.type = type;
        this.visible = false;
        this.electronProgress = 0;
        this.angle = 0;
        this.sharedRadius = 14;

        let orbitA = atomA.orbits[atomA.orbits.length - 1];
        let orbitB = atomB.orbits[atomB.orbits.length - 1];

        this.sharedData = [];
        for (let i = 0; i < type; i++) {
            if (startIdxA + i < orbitA.electrons.length) {
                this.sharedData.push({ electron: orbitA.electrons[startIdxA + i], source: atomA });
            }
            if (startIdxB + i < orbitB.electrons.length) {
                this.sharedData.push({ electron: orbitB.electrons[startIdxB + i], source: atomB });
            }
        }
    }

    getMidpoint() {
        return {
            x: (this.atomA.x + this.atomB.x) / 2,
            y: (this.atomA.y + this.atomB.y) / 2
        };
    }

    startSharing() {
        this.sharedData.forEach(d => {
            if (!d.electron.shared) {
                /* convert from atom-local to world coordinates */
                d.electron.x += d.source.x;
                d.electron.y += d.source.y;
                d.electron.shared = true;
                d.electron.color = "#F59E0B"; /* amber for shared electrons */
            }
        });
    }

    update(dt) {
        if (!this.visible) return;
        this.angle += dt * 2.5;
        this.electronProgress = Math.min(this.electronProgress + dt * 0.8, 1);

        let mid = this.getMidpoint();
        let total = this.sharedData.length;
        this.sharedData.forEach((d, i) => {
            let a = this.angle + (TWO_PI * i / total);
            let r = this.sharedRadius * this.electronProgress;
            d.electron.targetX = mid.x + Math.cos(a) * r;
            d.electron.targetY = mid.y + Math.sin(a) * r;
        });
    }

    reset() {
        this.visible = false;
        this.electronProgress = 0;
        this.angle = 0;
        this.sharedData.forEach(d => {
            d.electron.shared = false;
            d.electron.color = d.electron.originalColor;
        });
    }

    drawBond() {
        if (!this.visible) return;
        let pulse = 1 + Math.sin(frameCount * 0.08) * 0.15;
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = "#60A5FA";

        let angle = Math.atan2(this.atomB.y - this.atomA.y, this.atomB.x - this.atomA.x);
        let perpX = Math.cos(angle + Math.PI / 2);
        let perpY = Math.sin(angle + Math.PI / 2);

        for (let i = 0; i < this.type; i++) {
            let offset = (i - (this.type - 1) / 2) * 8;
            stroke("#4F8EF7");
            strokeWeight(4 * pulse);
            line(
                this.atomA.x + perpX * offset, this.atomA.y + perpY * offset,
                this.atomB.x + perpX * offset, this.atomB.y + perpY * offset
            );
        }
        drawingContext.shadowBlur = 0;
    }

    drawSharedElectrons() {
        if (!this.visible) return;
        for (const d of this.sharedData) { d.electron.draw(); }
    }
}

/*==========================================================
 MOLECULE SIMULATION (generic — replaces HydrogenSimulation)
==========================================================*/

class MoleculeSimulation {
    constructor(config) {
        this.config = config;
        this.phase = 0;
        this.timer = 0;
        this.progress = 0;
        this.finished = false;
        this.createScene();
    }

    createScene() {
        this.atoms = this.config.atoms.map(a => new Atom(a.symbol, a.x, a.y));
        this.molecule = new Molecule(this.config.fullName);
        this.atoms.forEach(a => this.molecule.addAtom(a));

        this.initialPositions = this.config.atoms.map(a => ({ x: a.x, y: a.y }));
        this.finalPositions = this.config.atoms.map(a => ({ x: a.finalX, y: a.finalY }));

        /* create shared bonds with electron-assignment tracking */
        this.bonds = [];
        let assignedCount = {};
        this.config.atoms.forEach((_, i) => assignedCount[i] = 0);

        this.config.bonds.forEach(b => {
            let bond = new SharedBond(
                this.atoms[b.a], this.atoms[b.b], b.type,
                assignedCount[b.a], assignedCount[b.b]
            );
            assignedCount[b.a] += b.type;
            assignedCount[b.b] += b.type;
            this.bonds.push(bond);
        });
    }

    reset() {
        this.phase = 0;
        this.timer = 0;
        this.progress = 0;
        this.finished = false;
        this.atoms.forEach((a, i) => {
            a.x = this.initialPositions[i].x;
            a.y = this.initialPositions[i].y;
            a.orbits.forEach(o => o.resetVisual());
        });
        this.bonds.forEach(b => b.reset());
    }

    update(dt, advancePhase) {
        this.timer += dt;

        if (engine.state === SimulationState.PLAYING || advancePhase) {
            switch (this.phase) {
                case 0: this.phaseApproach(dt); break;
                case 1: this.phaseOverlap(dt); break;
                case 2: this.phaseShare(dt); break;
                case 3: this.phaseStable(dt); break;
            }
        }

        this.molecule.update();
        this.bonds.forEach(b => b.update(dt));
    }

    phaseApproach(dt) {
        this.progress += dt / (CONFIG.ANIMATION.approachDuration / 1000);
        this.progress = Utils.clamp(this.progress, 0, 1);
        let t = Utils.ease(this.progress);

        this.atoms.forEach((a, i) => {
            a.x = Utils.lerp(this.initialPositions[i].x, this.finalPositions[i].x, t);
            a.y = Utils.lerp(this.initialPositions[i].y, this.finalPositions[i].y, t);
        });

        ui.setProgress(t * 25);
        ui.setExplanation(this.config.explanations[0]);

        if (this.progress >= 1) { this.progress = 0; this.phase = 1; }
    }

    phaseOverlap(dt) {
        this.progress += dt / (CONFIG.ANIMATION.overlapDuration / 1000);
        this.progress = Utils.clamp(this.progress, 0, 1);

        this.atoms.forEach(a => {
            a.orbits.forEach(o => o.deform(this.progress));
        });

        ui.setProgress(25 + this.progress * 25);
        ui.setExplanation(this.config.explanations[1]);

        if (this.progress >= 1) { this.progress = 0; this.phase = 2; }
    }

    phaseShare(dt) {
        this.progress += dt / (CONFIG.ANIMATION.sharingDuration / 1000);
        this.progress = Utils.clamp(this.progress, 0, 1);

        if (this.progress < 0.02) {
            this.bonds.forEach(b => b.startSharing());
        }
        this.bonds.forEach(b => { b.visible = true; });

        ui.setProgress(50 + this.progress * 35);
        ui.setExplanation(this.config.explanations[2]);

        if (this.progress >= 1) { this.progress = 0; this.phase = 3; }
    }

    phaseStable(dt) {
        this.progress += dt / (CONFIG.ANIMATION.stabilizeDuration / 1000);
        this.progress = Utils.clamp(this.progress, 0, 1);

        ui.setProgress(85 + this.progress * 15);
        ui.setExplanation(this.config.explanations[3]);

        if (this.progress >= 1) {
            this.finished = true;
            engine.state = SimulationState.FINISHED;
            notify.show("✔ " + this.config.fullName + " — Liên kết đã hình thành");
        }
    }

    draw() {
        this.bonds.forEach(b => b.drawBond());
        this.molecule.draw();
        this.bonds.forEach(b => b.drawSharedElectrons());
    }
}

/*==========================================================
 SIMULATION MANAGER
==========================================================*/

class SimulationManager {
    constructor() {
        this.current = null;
        this.currentKey = null;
    }

    loadMolecule(key) {
        this.currentKey = key;
        let config = MOLECULES[key];
        this.current = new MoleculeSimulation(config);

        ui.setSimulation(config.fullName);
        ui.setValence(config.valence);
        ui.setAtomInfo(config.atomInfo);
        ui.setExplanation("Nhấn Play để bắt đầu mô phỏng.");
        ui.setProgress(0);

        engine.reset();
    }

    update(dt) {
        if (this.current) { this.current.update(dt, false); }
    }

    draw() {
        if (this.current) { this.current.draw(); }
    }
}

/*==========================================================
 PLAYBACK CONTROLLER
==========================================================*/

class PlaybackController {
    play() {
        if (engine.state === SimulationState.FINISHED) {
            simulationManager.current.reset();
        }
        engine.play();
    }
    pause() { engine.pause(); }
    reset() {
        engine.reset();
        simulationManager.current.reset();
        ui.setProgress(0);
        ui.setExplanation("Nhấn Play để bắt đầu mô phỏng.");
    }
    step() {
        if (engine.state !== SimulationState.PLAYING) {
            simulationManager.current.update(1 / 60, true);
        }
    }
}

/*==========================================================
 TOOLTIP
==========================================================*/

class Tooltip {
    constructor() {
        this.element = document.getElementById("tooltip");
    }
    show(text, x, y) {
        this.element.innerHTML = text;
        this.element.style.left = (x + 15) + "px";
        this.element.style.top = (y + 15) + "px";
        this.element.style.opacity = 1;
    }
    hide() { this.element.style.opacity = 0; }
}

/*==========================================================
 NOTIFICATION
==========================================================*/

class NotificationManager {
    constructor() {
        this.box = document.createElement("div");
        this.box.style.cssText = `
            position:fixed;top:25px;right:25px;padding:14px 20px;
            background:rgba(255,255,255,.88);backdrop-filter:blur(12px);
            border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.15);
            opacity:0;transition:.35s;z-index:9998;font-weight:600;
        `;
        document.body.appendChild(this.box);
    }
    show(message) {
        this.box.innerHTML = message;
        this.box.style.opacity = 1;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => { this.box.style.opacity = 0; }, 1800);
    }
}

/*==========================================================
 FPS MONITOR
==========================================================*/

class FPSMonitor {
    constructor() { this.fps = 60; }
    update() { this.fps = Math.round(frameRate()); }
    draw() {
        if (!CONFIG.DEBUG) return;
        noStroke();
        fill(40);
        textSize(14);
        text("FPS: " + this.fps, -width / 2 + 20, -height / 2 + 25);
    }
}

/*==========================================================
 DEBUG PANEL
==========================================================*/

class DebugPanel {
    constructor() { this.enabled = false; }
    toggle() { this.enabled = !this.enabled; }
    draw() {
        if (!this.enabled) return;
        push();
        noStroke();
        fill(255, 250);
        rect(-width / 2 + 10, -height / 2 + 10, 220, 100, 12);
        fill(40);
        textSize(13);
        text("Version: " + CONFIG.VERSION, -width / 2 + 20, -height / 2 + 35);
        text("State: " + engine.state, -width / 2 + 20, -height / 2 + 55);
        text("Phase: " + (simulationManager.current ? simulationManager.current.phase : "-"), -width / 2 + 20, -height / 2 + 75);
        text("FPS: " + Math.round(frameRate()), -width / 2 + 20, -height / 2 + 95);
        pop();
    }
}

/*==========================================================
 BACKGROUND PARTICLES
==========================================================*/

class BackgroundParticle {
    constructor() { this.reset(); }
    reset() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.r = random(1, 3);
        this.speed = random(0.2, 0.7);
    }
    update() {
        this.y -= this.speed;
        if (this.y < -height) { this.reset(); this.y = height; }
    }
    draw() {
        noStroke();
        fill(150, 190, 255, 70);
        circle(this.x, this.y, this.r);
    }
}

function drawParticles() {
    push();
    for (const p of particles) { p.update(); p.draw(); }
    pop();
}

/*==========================================================
 p5.js SETUP
==========================================================*/

let fpsMonitor;
let debugPanel;
let playback;

function setup() {
    let container = document.getElementById(CONFIG.CANVAS_PARENT);
    let canvas = createCanvas(container.clientWidth, container.clientHeight);
    canvas.parent(CONFIG.CANVAS_PARENT);
    pixelDensity(CONFIG.PIXEL_DENSITY);
    frameRate(CONFIG.TARGET_FPS);
    smooth();

    /* initialize global objects */
    renderer = new Renderer();
    engine = new SimulationEngine();
    ui = new UIManager();
    cameraController = new CameraController();
    simulationManager = new SimulationManager();
    notify = new NotificationManager();
    tooltip = new Tooltip();
    fpsMonitor = new FPSMonitor();
    debugPanel = new DebugPanel();
    playback = new PlaybackController();

    /* initialize background particles */
    for (let i = 0; i < 60; i++) {
        particles.push(new BackgroundParticle());
    }

    /* load default molecule */
    simulationManager.loadMolecule("H2");

    notify.show("Interactive Chemistry Simulation Ready");
}

/*==========================================================
 p5.js DRAW
==========================================================*/

function draw() {
    renderer.begin();
    drawParticles();

    let dt = deltaTime / 1000;
    engine.update(dt);

    push();
    cameraController.begin();
    simulationManager.update(dt);
    simulationManager.draw();
    debugPanel.draw();
    cameraController.end();
    pop();

    fpsMonitor.update();
    renderer.end();
}

/*==========================================================
 BUTTON EVENTS
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("playBtn").onclick = () => {
        playback.play();
        notify.show("▶ Animation Started");
    };
    document.getElementById("pauseBtn").onclick = () => {
        playback.pause();
        notify.show("⏸ Animation Paused");
    };
    document.getElementById("resetBtn").onclick = () => {
        playback.reset();
        notify.show("⏹ Simulation Reset");
    };
    document.getElementById("stepBtn").onclick = () => {
        playback.step();
    };
    document.getElementById("fullscreenBtn").onclick = () => {
        document.documentElement.requestFullscreen();
    };
    document.getElementById("helpBtn").onclick = () => {
        document.getElementById("modal").classList.remove("hidden");
    };
    document.getElementById("closeModal").onclick = () => {
        document.getElementById("modal").classList.add("hidden");
    };

    /* molecule selector */
    document.getElementById("moleculeSelect").onchange = (e) => {
        simulationManager.loadMolecule(e.target.value);
        notify.show("Đã chuyển sang: " + MOLECULES[e.target.value].fullName);
    };

    /* toolbar tooltips */
    document.querySelectorAll(".toolbar button").forEach(btn => {
        btn.addEventListener("mousemove", e => {
            tooltip.show(btn.innerText.trim(), e.clientX, e.clientY);
        });
        btn.addEventListener("mouseleave", () => { tooltip.hide(); });
    });
});

/*==========================================================
 KEYBOARD SHORTCUTS
==========================================================*/

window.addEventListener("keydown", e => {
    switch (e.code) {
        case "Space":
            e.preventDefault();
            if (engine.state === SimulationState.PLAYING) { playback.pause(); }
            else { playback.play(); }
            break;
        case "KeyR": playback.reset(); break;
        case "KeyF": document.documentElement.requestFullscreen(); break;
        case "ArrowRight": playback.step(); break;
        case "KeyD": debugPanel.toggle(); break;
    }
});

/*==========================================================
 AUTO RESIZE
==========================================================*/

window.addEventListener("resize", () => {
    let p = document.getElementById(CONFIG.CANVAS_PARENT);
    if (p) resizeCanvas(p.clientWidth, p.clientHeight);
});

/*==========================================================
 FRAMEWORK INFO
==========================================================*/

console.log(CONFIG.APP_NAME + " v" + CONFIG.VERSION + " Ready");
