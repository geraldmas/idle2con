import { ParticleStorage } from './ParticleStorage';
import GameState from '../models/GameState';

export class PrestigeService {
    constructor() {
        this.prestigeLevel = 0;
        this.prestigeMultiplier = 1;
        this.antiparticlesUnlocked = false;
        this.supersymmetricParticlesUnlocked = false;
    }

    canPrestige() {
        const storage = new ParticleStorage();
        const particles = storage.getParticles();

        // Vérifier la génération 1 (électron, neutrino e, quark up, quark down)
        const hasGen1Electron = particles.some(p => p.generation === 1 && p.type === 'electron');
        const hasGen1Neutrino = particles.some(p => p.generation === 1 && p.type === 'neutrinoE');
        const hasGen1QuarkUp = particles.some(p => p.generation === 1 && p.type === 'quarkUp');
        const hasGen1QuarkDown = particles.some(p => p.generation === 1 && p.type === 'quarkDown');
        const hasGen1 = hasGen1Electron && hasGen1Neutrino && hasGen1QuarkUp && hasGen1QuarkDown;

        // Vérifier la génération 2 (muon, neutrino mu, quark charm, quark strange)
        const hasGen2Muon = particles.some(p => p.generation === 2 && p.type === 'muon');
        const hasGen2Neutrino = particles.some(p => p.generation === 2 && p.type === 'neutrinoMu');
        const hasGen2QuarkCharm = particles.some(p => p.generation === 2 && p.type === 'quarkCharm');
        const hasGen2QuarkStrange = particles.some(p => p.generation === 2 && p.type === 'quarkStrange');
        const hasGen2 = hasGen2Muon && hasGen2Neutrino && hasGen2QuarkCharm && hasGen2QuarkStrange;

        // Vérifier la génération 3 (tau, neutrino tau, quark truth, quark beauty)
        const hasGen3Tau = particles.some(p => p.generation === 3 && p.type === 'tau');
        const hasGen3Neutrino = particles.some(p => p.generation === 3 && p.type === 'neutrinoTau');
        const hasGen3QuarkTruth = particles.some(p => p.generation === 3 && p.type === 'quarkTruth');
        const hasGen3QuarkBeauty = particles.some(p => p.generation === 3 && p.type === 'quarkBeauty');
        const hasGen3 = hasGen3Tau && hasGen3Neutrino && hasGen3QuarkTruth && hasGen3QuarkBeauty;
        
        return hasGen1 && hasGen2 && hasGen3;
    }

    performPrestige() {
        if (!this.canPrestige()) {
            return false;
        }

        // Sauvegarde des bosons (particules de génération 4)
        const storage = new ParticleStorage();
        const bosons = storage.getBosons();
        
        // Réinitialisation du jeu
        const gameState = new GameState();
        gameState.reset();

        // Restauration des bosons
        bosons.forEach(boson => {
            storage.addParticle(boson);
        });

        // Mise à jour du niveau de prestige
        this.prestigeLevel++;
        this.prestigeMultiplier = Math.pow(1.5, this.prestigeLevel);

        // Déblocage des antiparticules au premier prestige
        if (this.prestigeLevel === 1) {
            this.antiparticlesUnlocked = true;
        }

        // Déblocage des particules supersymétriques au deuxième prestige
        if (this.prestigeLevel === 2) {
            this.supersymmetricParticlesUnlocked = true;
        }

        return true;
    }

    getPrestigeMultiplier() {
        return this.prestigeMultiplier;
    }

    isAntiparticlesUnlocked() {
        return this.antiparticlesUnlocked;
    }

    isSupersymmetricParticlesUnlocked() {
        return this.supersymmetricParticlesUnlocked;
    }

    getPrestigeLevel() {
        return this.prestigeLevel;
    }
} 