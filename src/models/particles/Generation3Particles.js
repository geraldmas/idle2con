import { Particle } from '../Particle';

// Effets spécifiques pour chaque type de particule
const effects = {
    tau: {
        value: 0, // As per instruction, value is 0 for Tau
        description: "Augmente dt de 75%",
        dtMultiplier: 1.75, // 75% increase
        generatorBonus: 0,
        costReduction: 0,
        // The apply function might need to be removed or updated
        // if dtMultiplier is handled globally in TickService.
        apply: (gameState) => ({ 
            ...gameState,
            // This specific dt modification might become redundant
        })
    },
    neutrinoTau: {
        value: 0.10,
        description: "Ajoute 10% des générateurs de rang 4 à n",
        dtMultiplier: 0,
        generatorBonus: 0.10,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            n: gameState.n + (gameState.generators[4] * 0.10)
        })
    },
    quarkTruth: {
        value: 0.10,
        description: "Augmente la production des générateurs de rang 1 de 10%",
        dtMultiplier: 0,
        generatorBonus: 0.10,
        costReduction: 0,
        apply: (gameState) => ({
            ...gameState,
            generator1Production: gameState.generator1Production * (1 + 0.10)
        })
    },
    quarkBeauty: {
        value: 0.10,
        description: "Réduit les coûts des générateurs de rang 4 de 10%",
        dtMultiplier: 0,
        generatorBonus: 0,
        costReduction: 0.10,
        apply: (gameState) => ({
            ...gameState,
            generator4Cost: gameState.generator4Cost * (1 - 0.10)
        })
    }
};

export class Tau extends Particle {
    constructor() {
        super('Tau', 3, 'tau', effects.tau);
    }
}

export class NeutrinoTau extends Particle {
    constructor() {
        super('Neutrino tauique', 3, 'neutrinoTau', effects.neutrinoTau);
    }
}

export class QuarkTruth extends Particle {
    constructor() {
        super('Quark Truth', 3, 'quarkTruth', effects.quarkTruth);
    }
}

export class QuarkBeauty extends Particle {
    constructor() {
        super('Quark Beauty', 3, 'quarkBeauty', effects.quarkBeauty);
    }
} 