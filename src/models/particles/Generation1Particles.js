import { Particle } from '../Particle';

// Effets spécifiques pour chaque type de particule
const effects = {
    electron: {
        value: 0.03,
        description: "Augmente dt de 3%",
        dtMultiplier: 0.03,
        generatorBonus: 0,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            dt: gameState.dt * (1 + 0.03)
        })
    },
    neutrinoE: {
        value: 0.10,
        description: "Ajoute 10% des générateurs de rang 2 à n",
        dtMultiplier: 0,
        generatorBonus: 0.10,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            n: gameState.n + (gameState.generators[2] * 0.10)
        })
    },
    quarkUp: {
        value: 0.03,
        description: "Augmente la production des générateurs de rang 1 de 3%",
        dtMultiplier: 0,
        generatorBonus: 0.03,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            generator1Production: gameState.generator1Production * (1 + 0.03)
        })
    },
    quarkDown: {
        value: 0.03,
        description: "Réduit les coûts des générateurs de rang 2 de 3%",
        dtMultiplier: 0,
        generatorBonus: 0,
        costReduction: 0.03,
        apply: (gameState) => ({
            ...gameState,
            generator2Cost: gameState.generator2Cost * (1 - 0.03)
        })
    }
};

export class Electron extends Particle {
    constructor() {
        super('Électron', 1, 'electron', effects.electron);
    }
}

export class NeutrinoE extends Particle {
    constructor() {
        super('Neutrino électronique', 1, 'neutrinoE', effects.neutrinoE);
    }
}

export class QuarkUp extends Particle {
    constructor() {
        super('Quark Up', 1, 'quarkUp', effects.quarkUp);
    }
}

export class QuarkDown extends Particle {
    constructor() {
        super('Quark Down', 1, 'quarkDown', effects.quarkDown);
    }
} 