import { Particle } from '../Particle';

// Effets spécifiques pour chaque type d'antiparticule
const effects = {
    antielectron: {
        value: 0.15,
        description: "Augmente l'exposant de dt de 0.15",
        dtExponent: 0.15,
        apply: (gameState) => ({
            ...gameState,
            dtExponent: (gameState.dtExponent || 1) + 0.15 // Assurer un début à 1 pour l'exposant
        })
    },
    antimuon: {
        value: 0.5, // Corrigé de 0.3 à 0.5
        description: "Augmente l'exposant de dt de 0.5", // Corrigé la description
        dtExponent: 0.5, // Corrigé de 0.3 à 0.5
        apply: (gameState) => ({
            ...gameState,
            dtExponent: (gameState.dtExponent || 1) + 0.5 // Assurer un début à 1 pour l'exposant
        })
    },
    antitauon: {
        value: 2, // Corrigé de 1 à 2
        description: "Augmente l'exposant de dt de 2", // Corrigé la description
        dtExponent: 2, // Corrigé de 1 à 2
        apply: (gameState) => ({
            ...gameState,
            dtExponent: (gameState.dtExponent || 1) + 2 // Assurer un début à 1 pour l'exposant
        })
    },
    antineutrinoE: {
        value: 1, // La valeur de base n'est pas dans la spec, la garder à 1
        description: "Modifie la base du seuil d'obtention des états", // Description générique, la logique est dans le calcul global
        stateThresholdModifier: 1, // Utilisé pour le calcul global
        apply: (gameState) => ({
             ...gameState,
             // La logique de modification de la base est globale, pas par particule individuellement
             // On stocke juste le nombre de chaque type pour le calcul global
        })
    },
    antineutrinoMu: {
        value: 1, // La valeur de base n'est pas dans la spec, la garder à 1
        description: "Modifie la base du seuil d'obtention des états", // Description générique
        stateThresholdModifier: 4, // Utilisé pour le calcul global (4N)
        apply: (gameState) => ({
             ...gameState,
             // La logique de modification de la base est globale
        })
    },
    antineutrinoTau: {
        value: 1, // La valeur de base n'est pas dans la spec, la garder à 1
        description: "Modifie la base du seuil d'obtention des états", // Description générique
        stateThresholdModifier: 13, // Utilisé pour le calcul global (13P)
        apply: (gameState) => ({
             ...gameState,
             // La logique de modification de la base est globale
        })
    },
    antiquarkUp: {
        value: 0.15,
        description: "Augmente la production de tous les générateurs de 15%",
        generatorMultiplier: 1.15,
        apply: (gameState) => ({
            ...gameState,
            generatorProductionMultiplier: (gameState.generatorProductionMultiplier || 1) * 1.15
        })
    },
    antiquarkCharm: {
        value: 0.5, // Corrigé de 0.3 à 0.5
        description: "Augmente la production de tous les générateurs de 50%", // Corrigé la description
        generatorMultiplier: 1.5, // Corrigé de 1.3 à 1.5
        apply: (gameState) => ({
            ...gameState,
            generatorProductionMultiplier: (gameState.generatorProductionMultiplier || 1) * 1.5
        })
    },
    antiquarkTruth: {
        value: 2, // Corrigé de 1 à 2
        description: "Augmente la production de tous les générateurs de 200%", // Corrigé la description (200% = x3)
        generatorMultiplier: 3, // Corrigé de 2 à 3
        apply: (gameState) => ({
            ...gameState,
            generatorProductionMultiplier: (gameState.generatorProductionMultiplier || 1) * 3
        })
    },
    antiquarkDown: {
        value: 0.15,
        description: "Divise tous les coûts par 1.15",
        costDivider: 1.15,
        apply: (gameState) => ({
            ...gameState,
            costDivider: (gameState.costDivider || 1) * 1.15
        })
    },
    antiquarkStrange: {
        value: 1.5, // Corrigé de 0.3 à 1.5
        description: "Divise tous les coûts par 1.5", // Corrigé la description
        costDivider: 1.5, // Corrigé de 1.3 à 1.5
        apply: (gameState) => ({
            ...gameState,
            costDivider: (gameState.costDivider || 1) * 1.5
        })
    },
    antiquarkBeauty: {
        value: 3, // Corrigé de 1 à 3
        description: "Divise tous les coûts par 3", // Corrigé la description
        costDivider: 3, // Corrigé de 2 à 3
        apply: (gameState) => ({
            ...gameState,
            costDivider: (gameState.costDivider || 1) * 3
        })
    }
};

export class AntiElectron extends Particle {
    constructor() {
        super('Antiélectron', 1, 'antielectron', effects.antielectron);
    }
}

export class AntiMuon extends Particle {
    constructor() {
        super('Antimuon', 2, 'antimuon', effects.antimuon);
    }
}

export class AntiTauon extends Particle {
    constructor() {
        super('Antitauon', 3, 'antitauon', effects.antitauon);
    }
}

export class AntiNeutrinoE extends Particle {
    constructor() {
        super('Antineutrino électronique', 1, 'antineutrinoE', effects.antineutrinoE);
    }
}

export class AntiNeutrinoMu extends Particle {
    constructor() {
        super('Antineutrino muonique', 2, 'antineutrinoMu', effects.antineutrinoMu);
    }
}

export class AntiNeutrinoTau extends Particle {
    constructor() {
        super('Antineutrino tauique', 3, 'antineutrinoTau', effects.antineutrinoTau);
    }
}

export class AntiQuarkUp extends Particle {
    constructor() {
        super('Antiquark up', 1, 'antiquarkUp', effects.antiquarkUp);
    }
}

export class AntiQuarkCharm extends Particle {
    constructor() {
        super('Antiquark charm', 2, 'antiquarkCharm', effects.antiquarkCharm);
    }
}

export class AntiQuarkTruth extends Particle {
    constructor() {
        super('Antiquark truth', 3, 'antiquarkTruth', effects.antiquarkTruth);
    }
}

export class AntiQuarkDown extends Particle {
    constructor() {
        super('Antiquark down', 1, 'antiquarkDown', effects.antiquarkDown);
    }
}

export class AntiQuarkStrange extends Particle {
    constructor() {
        super('Antiquark strange', 2, 'antiquarkStrange', effects.antiquarkStrange);
    }
}

export class AntiQuarkBeauty extends Particle {
    constructor() {
        super('Antiquark beauty', 3, 'antiquarkBeauty', effects.antiquarkBeauty);
    }
} 