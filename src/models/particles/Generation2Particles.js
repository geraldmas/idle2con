import { Particle } from '../Particle';

// Effets spécifiques pour chaque type de particule
const effects = {
    muon: {
        value: 0.20,
        description: "Augmente dt de 20%",
        dtMultiplier: 0.20,
        generatorBonus: 0,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            dt: gameState.dt * (1 + 0.20)
        })
    },
    neutrinoMu: {
        value: 0.10,
        description: "Ajoute 10% des générateurs de rang 3 à n",
        dtMultiplier: 0,
        generatorBonus: 0.10,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            n: gameState.n + (gameState.generators[3] * 0.10)
        })
    },
    quarkCharm: {
        value: 0.05,
        description: "Augmente la production des générateurs de rang 1 de 5%",
        dtMultiplier: 0,
        generatorBonus: 0.05,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            generator1Production: gameState.generator1Production * (1 + 0.05)
        })
    },
    quarkStrange: {
        value: 0.05,
        description: "Réduit les coûts des générateurs de rang 3 de 5%",
        dtMultiplier: 0,
        generatorBonus: 0,
        costReduction: 0.05,
        apply: (gameState) => ({
            ...gameState,
            generator3Cost: gameState.generator3Cost * (1 - 0.05)
        })
    }
};

export class Muon extends Particle {
    constructor() {
        super('Muon', 2, 'muon', effects.muon);
    }
}

export class NeutrinoMu extends Particle {
    constructor() {
        super('Neutrino muonique', 2, 'neutrinoMu', effects.neutrinoMu);
    }
}

export class QuarkCharm extends Particle {
    constructor() {
        super('Quark Charm', 2, 'quarkCharm', effects.quarkCharm);
    }
}

export class QuarkStrange extends Particle {
    constructor() {
        super('Quark Strange', 2, 'quarkStrange', effects.quarkStrange);
    }
} 