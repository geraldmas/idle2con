import { ParticleStorage } from './ParticleStorage';
import { Electron, NeutrinoE, QuarkUp, QuarkDown } from '../models/particles/Generation1Particles';
import { Muon, NeutrinoMu, QuarkCharm, QuarkStrange } from '../models/particles/Generation2Particles';
import { Tau, NeutrinoTau, QuarkTruth, QuarkBeauty } from '../models/particles/Generation3Particles';

export class ObservationService {
    constructor() {
        this.storage = new ParticleStorage();
        this.baseCost = 10; // Coût de base en générateurs
        this.costMultiplier = 2; // Multiplicateur de coût
    }

    canObserve(generatorRank, generatorCount) {
        // Vérifier si on a assez de générateurs du rang spécifié
        return generatorCount >= this.getObservationCost(generatorRank);
    }

    getObservationCost(generatorRank) {
        // Le coût augmente exponentiellement avec le rang
        return Math.floor(this.baseCost * Math.pow(this.costMultiplier, generatorRank - 1));
    }

    observe(generatorRank, generatorCount = this.getObservationCost(generatorRank)) {
        if (!this.canObserve(generatorRank, generatorCount)) {
            throw new Error(`Pas assez de générateurs de rang ${generatorRank} pour observer`);
        }

        // Déterminer la génération de particule à obtenir selon le rang
        const particle = this.generateRandomParticle(generatorRank);
        this.storage.addParticle(particle);

        return {
            particle,
            cost: this.getObservationCost(generatorRank)
        };
    }

    generateRandomParticle(generatorRank) {
        const random = Math.random();
        let particle;

        switch (generatorRank) {
            case 1:
                // 100% Génération 1
                particle = this.getRandomGeneration1Particle();
                break;
            case 2:
                // 80% Génération 1, 20% Génération 2
                if (random < 0.8) {
                    particle = this.getRandomGeneration1Particle();
                } else {
                    particle = this.getRandomGeneration2Particle();
                }
                break;
            case 3:
                // 50% Génération 1, 35% Génération 2, 15% Génération 3
                if (random < 0.5) {
                    particle = this.getRandomGeneration1Particle();
                } else if (random < 0.85) {
                    particle = this.getRandomGeneration2Particle();
                } else {
                    particle = this.getRandomGeneration3Particle();
                }
                break;
            default:
                throw new Error(`Rang de générateur invalide: ${generatorRank}`);
        }

        return particle;
    }

    getRandomGeneration1Particle() {
        const particles = [Electron, NeutrinoE, QuarkUp, QuarkDown];
        const randomIndex = Math.floor(Math.random() * particles.length);
        return new particles[randomIndex]();
    }

    getRandomGeneration2Particle() {
        const particles = [Muon, NeutrinoMu, QuarkCharm, QuarkStrange];
        const randomIndex = Math.floor(Math.random() * particles.length);
        return new particles[randomIndex]();
    }

    getRandomGeneration3Particle() {
        const particles = [Tau, NeutrinoTau, QuarkTruth, QuarkBeauty];
        const randomIndex = Math.floor(Math.random() * particles.length);
        return new particles[randomIndex]();
    }
} 