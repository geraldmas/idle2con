import { ParticleStorage } from './ParticleStorage';
import { Electron, NeutrinoE, QuarkUp, QuarkDown } from '../models/particles/Generation1Particles';
import { Muon, NeutrinoMu, QuarkCharm, QuarkStrange } from '../models/particles/Generation2Particles';
import { Tau, NeutrinoTau, QuarkTruth, QuarkBeauty } from '../models/particles/Generation3Particles';
import { AntiElectron, AntiNeutrinoE, AntiQuarkUp, AntiQuarkDown } from '../models/particles/AntiParticles';
import { PrestigeService } from './PrestigeService';

export class ObservationService {
    constructor() {
        this.storage = new ParticleStorage();
        this.baseCost = 10; // Coût de base pour les particules normales en générateurs
        this.costGrowthRate = 1.1; // Taux de croissance du coût des particules normales
        this.observationCount = 0; // Compteur d'observations de particules normales

        // Coût et compteur pour les antiparticules
        // Les valeurs de base et taux de croissance sont dans PrestigeService
        this.antiparticleObservationCount = 0; // Compteur d'observations d'antiparticules
    }

    canObserveParticle(generatorRank, generatorCount, gameState) {
        // Assurez-vous que gameState et ses propriétés sont valides
        const requiredGenerators = this.getParticleObservationCost(); // Coût basé sur le compteur de particules normales
        return generatorCount >= requiredGenerators;
    }

    getParticleObservationCost() {
        return Math.floor(this.baseCost * Math.pow(this.costGrowthRate, this.observationCount));
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
        const requiredAntipotential = prestigeService.getAntiparticleCost(this.antiparticleObservationCount); // Coût basé sur le compteur d'antiparticules

        return currentAntipotential >= requiredAntipotential;
    }

    getAntiparticleObservationCost(prestigeService) {
        // Le coût est géré par le PrestigeService
        return prestigeService.getAntiparticleCost(this.antiparticleObservationCount);
    }

    observe(gameState, prestigeService, isAntiparticle = false, generatorRank = null, generatorCount = null) {
        let observedItem = null;
        let costPaid = 0;

        if (isAntiparticle) {
            if (!this.canObserveAntiparticle(gameState, prestigeService)) {
                throw new Error('Conditions non remplies pour observer une antiparticule');
            }
            // Payer le coût en antipotentiel
            costPaid = this.getAntiparticleObservationCost(prestigeService);
            gameState.antipotential = (gameState.antipotential || 0) - costPaid;
            
            // Générer une antiparticule
            observedItem = this.generateRandomParticle(null, true); // rang est null pour antiparticule
            this.storage.addParticle(observedItem); // Ajouter l'antiparticule au stockage (même stockage que les particules normales?)
            
            // Incrémenter le compteur d'observations d'antiparticules
            this.antiparticleObservationCount++;

        } else { // Observer une particule normale
            if (generatorRank === null || generatorCount === null) {
                throw new Error('Rang et compte de générateur requis pour observer une particule normale');
            }
            if (!this.canObserveParticle(generatorRank, generatorCount, gameState)) {
                throw new Error(`Pas assez de générateurs de rang ${generatorRank} pour observer`);
            }
            // Payer le coût en générateurs
            costPaid = this.getParticleObservationCost();
            // Assurez-vous que la logique pour réduire le count du générateur est ailleurs (dans App.vue ou le composant)
            // gameState.generators... trouver le générateur et réduire son count
            
            // Déterminer la génération de particule à obtenir selon le rang
            observedItem = this.generateRandomParticle(generatorRank, false);
            this.storage.addParticle(observedItem); // Ajouter la particule au stockage
            
            // Incrémenter le compteur d'observations de particules normales
            this.observationCount++;
        }

        return { // Retourner l'objet observé et le coût payé
            item: observedItem,
            cost: costPaid,
            isAntiparticle: isAntiparticle
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
    getObservationCount() {
        return this.observationCount;
    }

    getAntiparticleObservationCount() {
        return this.antiparticleObservationCount;
    }
} 