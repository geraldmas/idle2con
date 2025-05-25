import { ParticleStorage } from './ParticleStorage';

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
        // Ajouter 5 particules par défaut
        for (let i = 0; i < 5; i++) {
            this.storage.addParticle({ id: `default-${i}` });
        }
        console.log('Système de particules initialisé');
    }

    reset() {
        this.storage.clearParticles();
        this.initialize();
    }
} 