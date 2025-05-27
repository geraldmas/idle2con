import { ParticleStorage } from './ParticleStorage';
import { formatNumber } from '../utils/format';

export class PrestigeService {
    constructor() {
        this.prestigeLevel = 0;
        this.prestigeMultiplier = 1;
        this.antiparticlesUnlocked = false;
        this.supersymmetricParticlesUnlocked = false;
        this.prestigeThreshold = 1000; // Seuil de prestige modulable
        this.antipotentialBaseCost = 3; // Coût de base pour observer une antiparticule
        this.antipotentialGrowthRate = 1.1; // Taux de croissance du coût
    }

    canPrestige(gameState) {
        // S'assurer que gameState et ses propriétés nécessaires existent
        const potential = gameState?.resources.get('Potentiel')?.getValue();
        const hasGen1 = gameState?.particles.some(p => p.generation === 1); // Exemple, à adapter si la vérification des particules est plus complexe
        const hasGen2 = gameState?.particles.some(p => p.generation === 2);
        const hasGen3 = gameState?.particles.some(p => p.generation === 3);

        return typeof potential === 'number' && potential > 0 && potential >= this.prestigeThreshold && hasGen1 && hasGen2 && hasGen3;
    }

    calculateAntipotentialGain(gameState) {
        const potential = gameState?.resources.get('Potentiel')?.getValue();
        if (typeof potential !== 'number' || potential <= 0) {
            return 0;
        }
        return Math.floor(Math.log10(potential));
    }

    getAntiparticleCost(antiparticleCount) {
        if (typeof antiparticleCount !== 'number' || antiparticleCount < 0) {
            return this.antipotentialBaseCost;
        }
        return Math.floor(this.antipotentialBaseCost * Math.pow(this.antipotentialGrowthRate, antiparticleCount));
    }

    applyPrestige(gameState) {
        // Valider l'état du jeu avant d'appliquer le prestige
        if (!gameState || typeof gameState.resources.get('Potentiel')?.getValue() !== 'number') {
            throw new Error('État de jeu invalide pour le prestige');
        }

        if (!this.canPrestige(gameState)) {
            throw new Error('Conditions de prestige non remplies');
        }

        const antipotentialGain = this.calculateAntipotentialGain(gameState);
        
        // Réinitialiser les ressources et structures
        gameState.resources.forEach(resource => {
            // Réinitialisation spécifique de Potentiel et États
            if (resource.name === 'Potentiel') {
                resource.value = 0;
                resource.generators = 0;
            }
            if (resource.name === 'États') {
                resource.value = 0;
                resource.nextStateMilestone = 1;
                resource.totalEarned = 0;
            }
        });

        if (Array.isArray(gameState.generators)) {
            gameState.generators.forEach(generator => {
                if (generator && typeof generator.count === 'number') {
                    generator.count = 0;
                    generator.maxCount = 0;
                    generator.manualPurchases = 0;
                    generator.reachedMilestones = [];
                }
            });
            // Assurez-vous que le Générateur 1 redémarre avec 1
            const gen1 = gameState.generators.find(g => g.rank === 1);
            if(gen1) {
                gen1.count = 1;
                gen1.maxCount = 1;
                // Mettre à jour la ressource Potentiel pour refléter le nouveau nombre de générateurs
                const potentielResource = gameState.resources.get('Potentiel');
                if (potentielResource) {
                    potentielResource.setGenerators(gen1.count);
                }
            }
        }

        // Perdre TOUTES les particules au prestige
        gameState.particles = [];

        // Ajouter les points d'antipotentiel
        gameState.antipotential = (gameState.antipotential || 0) + antipotentialGain;

        // Mettre à jour le niveau de prestige et le multiplicateur dans gameState
        gameState.prestigeLevel = (gameState.prestigeLevel || 0) + 1;
        gameState.prestigeMultiplier = Math.pow(1.5, gameState.prestigeLevel);
        
        // Débloquer les antiparticules si c'est le premier prestige
        if (gameState.prestigeLevel === 1) {
            gameState.antiparticlesUnlocked = true;
        }

        return { // Retourner les valeurs mises à jour pour l'interface
            antipotentialGain,
            newAntipotential: gameState.antipotential,
            prestigeLevel: gameState.prestigeLevel,
            prestigeMultiplier: gameState.prestigeMultiplier,
            antiparticlesUnlocked: gameState.antiparticlesUnlocked
        };
    }

    // Méthode pour calculer les effets des antiparticules
    calculateAntiparticleEffects(gameState) {
        if (!gameState || !Array.isArray(gameState.antiparticles)) {
            return {
                dtExponent: 1,
                stateThresholdBase: 10, // Valeur par défaut avant bonus
                generatorProductionMultiplier: 1,
                costDivider: 1
            };
        }

        let totalDtExponentBonus = 0;
        let totalGeneratorProductionMultiplier = 1;
        let totalCostDivider = 1;
        let antineutrinoECount = 0;
        let antineutrinoMuCount = 0;
        let antineutrinoTauCount = 0;

        // Compter les antiparticules et accumuler les bonus additifs et multiplicatifs
        gameState.antiparticles.forEach(antiparticle => {
            if (!antiparticle || !antiparticle.type) return;

            switch(antiparticle.type) {
                case 'antielectron':
                    totalDtExponentBonus += 0.15;
                    break;
                case 'antimuon':
                    totalDtExponentBonus += 0.5; // Corrigé
                    break;
                case 'antitauon':
                    totalDtExponentBonus += 2; // Corrigé
                    break;
                case 'antineutrinoE':
                    antineutrinoECount++;
                    break;
                case 'antineutrinoMu':
                    antineutrinoMuCount++;
                    break;
                case 'antineutrinoTau':
                    antineutrinoTauCount++;
                    break;
                case 'antiquarkUp':
                    totalGeneratorProductionMultiplier *= 1.15;
                    break;
                case 'antiquarkCharm':
                    totalGeneratorProductionMultiplier *= 1.5; // Corrigé
                    break;
                case 'antiquarkTruth':
                    totalGeneratorProductionMultiplier *= 3; // Corrigé
                    break;
                case 'antiquarkDown':
                    totalCostDivider *= 1.15;
                    break;
                case 'antiquarkStrange':
                    totalCostDivider *= 1.5; // Corrigé
                    break;
                case 'antiquarkBeauty':
                    totalCostDivider *= 3; // Corrigé
                    break;
            }
        });

        // Calculer la base du seuil d'état pour les antineutrinos
        // Nouvelle base : 2^(1/(10+M+4*N+13*P))
        const stateThresholdBase = 2 / (10 + (antineutrinoECount * 1) + (antineutrinoMuCount * 4) + (antineutrinoTauCount * 13));

        // Appliquer l'effet de l'exposant dt (s'assurer qu'il est >= 1)
        const finalDtExponent = Math.max(1, 1 + totalDtExponentBonus); // Exponentiel = 1 (base) + bonus additif

        return {
            dtExponent: finalDtExponent,
            stateThresholdBase: stateThresholdBase, // Appliquer la nouvelle base calculée
            generatorProductionMultiplier: totalGeneratorProductionMultiplier,
            costDivider: totalCostDivider
        };
    }

    // Les getters lisent maintenant directement depuis gameState
    getPrestigeLevel(gameState) {
        return gameState?.prestigeLevel || 0;
    }

    getPrestigeMultiplier(gameState) {
        return gameState?.prestigeMultiplier || 1;
    }

    isAntiparticlesUnlocked(gameState) {
        return gameState?.antiparticlesUnlocked || false;
    }

    isSupersymmetricParticlesUnlocked(gameState) {
        return gameState?.supersymmetricParticlesUnlocked || false;
    }

    // Ajout d'une méthode reset si PrestigeService gère un état interne qui nécessite une réinitialisation
    // Sinon, si toutes les données sont dans gameState, cette méthode n'est pas nécessaire ici.
    // reset(gameState) {
    //     // Réinitialiser les propriétés internes si elles existent
    //     this.prestigeLevel = 0;
    //     this.prestigeMultiplier = 1;
    //     this.antiparticlesUnlocked = false;
    //     this.supersymmetricParticlesUnlocked = false;
    //     // Le gameState est réinitialisé ailleurs, donc pas besoin de le faire ici.
    // }
}

// Déplacer ou rendre accessible ParticleStorage et GameState si nécessaire pour d'autres services
// export { ParticleStorage, GameState }; // Exemple si elles sont utilisées ailleurs et doivent être exportées 