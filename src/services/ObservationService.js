import { ParticleStorage } from './ParticleStorage';
import { Electron, NeutrinoE, QuarkUp, QuarkDown } from '../models/particles/Generation1Particles';
import { Muon, NeutrinoMu, QuarkCharm, QuarkStrange } from '../models/particles/Generation2Particles';
import { Tau, NeutrinoTau, QuarkTruth, QuarkBeauty } from '../models/particles/Generation3Particles';
import { AntiElectron, AntiNeutrinoE, AntiQuarkUp, AntiQuarkDown } from '../models/particles/AntiParticles';
import { PrestigeService } from './PrestigeService';

export class ObservationService {
    constructor() {
        // this.storage = new ParticleStorage(); // ParticleStorage is not used by this service anymore
        this.baseCost = 10; // Coût de base pour les particules normales en générateurs
        this.costGrowthRate = 1.1; // Taux de croissance du coût des particules normales
        // this.observationCount = 0; // Removed
        // this.antiparticleObservationCount = 0; // Removed
    }

    canObserveParticle(generatorRank, generatorCount, gameState) {
        // Assurez-vous que gameState et ses propriétés sont valides
        const requiredGenerators = this.getParticleObservationCost(gameState.observationCount);
        return generatorCount >= requiredGenerators;
    }

    getParticleObservationCost(currentObservationCount) {
        return Math.floor(this.baseCost * Math.pow(this.costGrowthRate, currentObservationCount));
    }

    canObserveAntiparticle(gameState, prestigeService) {
        // Vérifier si les antiparticules sont débloquées
        const antiparticlesUnlocked = prestigeService.isAntiparticlesUnlocked(gameState); // Utilise gameState ici
        if (!antiparticlesUnlocked) {
            return false;
        }

        // Vérifier si le joueur a assez d'antipotentiel
        const currentAntipotential = gameState?.antipotential || 0;
        // Calculer le coût requis APRES avoir vérifié le déblocage
        const requiredAntipotential = this.getAntiparticleObservationCost(prestigeService, gameState.antiparticleObservationCount);
        return currentAntipotential >= requiredAntipotential;
    }

    getAntiparticleObservationCost(prestigeService, currentAntiparticleObservationCount) {
        // Le coût est géré par le PrestigeService
        return prestigeService.getAntiparticleCost(currentAntiparticleObservationCount);
    }

    observe(gameState, prestigeService, isAntiparticle = false, generatorRank = null, generatorCount = null) {
        let observedItem = null;
        let costPaid = 0;
        let updatedObservationCount = gameState.observationCount; // Get current counts
        let updatedAntiparticleObservationCount = gameState.antiparticleObservationCount;

        if (isAntiparticle) {
            if (!this.canObserveAntiparticle(gameState, prestigeService)) { // Uses gameState.antiparticleObservationCount
                throw new Error('Conditions non remplies pour observer une antiparticule');
            }
            costPaid = this.getAntiparticleObservationCost(prestigeService, gameState.antiparticleObservationCount);
            // gameState.antipotential is modified by the caller (App.vue or ParticleObservation.vue)
            
            observedItem = this.generateRandomParticle(null, true);
            // this.storage.addParticle(observedItem); // Caller should handle adding to particle list / storage

            updatedAntiparticleObservationCount = gameState.antiparticleObservationCount + 1; // Prepare new count
        } else { // Observe une particule normale
            if (generatorRank === null || generatorCount === null) { // generatorCount is for canObserveParticle check
                throw new Error('Rang et compte de générateur requis pour observer une particule normale');
            }
            // canObserveParticle check should be done by the caller using gameState.observationCount
            // For safety, or if this service is called directly, it might be good to have a check here too.
            // However, to keep it simple, assume caller checks canObserveParticle.
            // if (!this.canObserveParticle(generatorRank, generatorCount, gameState)) {
            //     throw new Error(`Pas assez de générateurs de rang ${generatorRank} pour observer`);
            // }
            costPaid = this.getParticleObservationCost(gameState.observationCount);
            // Deduction of generator cost is handled by the caller

            observedItem = this.generateRandomParticle(generatorRank, false);
            // this.storage.addParticle(observedItem); // Caller should handle

            updatedObservationCount = gameState.observationCount + 1; // Prepare new count
        }

        return {
            item: observedItem,
            cost: costPaid,
            isAntiparticle: isAntiparticle,
            newObservationCount: updatedObservationCount, // For normal particles
            newAntiparticleObservationCount: updatedAntiparticleObservationCount // For antiparticles
        };
    }

    generateRandomParticle(generatorRank, isAntiparticle = false) {
        const random = Math.random();
        let particle;

        if (isAntiparticle) {
            // Distribution des antiparticules (peut être basée sur un rang d'antiparticules si nécessaire)
            const antiparticles = [
                AntiElectron, AntiNeutrinoE, AntiQuarkUp, AntiQuarkDown // Exemple, à étendre
            ];
            const randomIndex = Math.floor(Math.random() * antiparticles.length);
            particle = new antiparticles[randomIndex]();
        } else {
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
                    // Gérer le cas où le rang n'est pas spécifié pour une particule normale
                    throw new Error(`Rang de générateur invalide ou manquant: ${generatorRank}`);
            }
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

    // Méthodes pour obtenir les compteurs d'observations si nécessaire pour l'affichage
    // getObservationCount() { // Removed
    //     return this.observationCount;
    // }

    // getAntiparticleObservationCount() { // Removed
    //     return this.antiparticleObservationCount;
    // }
} 