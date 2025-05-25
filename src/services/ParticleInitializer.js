import { ParticleStorage } from './ParticleStorage';
import { Particle } from '../models/Particle';

export class ParticleInitializer {
    constructor() {
        this.storage = new ParticleStorage();
    }

    initialize() {
        // Vérifier si des particules existent déjà
        const existingParticles = this.storage.loadParticles() || [];
        if (existingParticles.length > 0) {
            console.log('Des particules existent déjà');
            return;
        }

        // Initialiser avec un tableau vide
        this.storage.clearParticles();
        
        // Ajouter 5 particules par défaut avec le bon format
        for (let i = 0; i < 5; i++) {
            const particle = new Particle(
                `Particule par défaut ${i}`,
                1,
                'default',
                {
                    value: 0,
                    description: `Particule de test ${i}`,
                    dtMultiplier: 0,
                    generatorBonus: 0,
                    costReduction: 0,
                    apply: (gameState) => gameState
                }
            );
            this.storage.addParticle(particle);
        }
        console.log('Système de particules initialisé');
    }

    reset() {
        this.storage.clearParticles();
        this.initialize();
    }
} 