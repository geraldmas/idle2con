import { Particle } from '../models/Particle';

export class ParticleStorage {
    constructor() {
        this.storageKey = 'quantum_factory_particles';
    }

    saveParticles(particles) {
        const particlesData = particles.map(particle => particle.toJSON());
        localStorage.setItem(this.storageKey, JSON.stringify(particlesData));
    }

    loadParticles() {
        const particlesData = localStorage.getItem(this.storageKey);
        if (!particlesData) return [];
        
        try {
            const parsedData = JSON.parse(particlesData);
            return parsedData.map(data => Particle.fromJSON(data));
        } catch (error) {
            console.error('Erreur lors du chargement des particules:', error);
            return [];
        }
    }

    addParticle(particle) {
        const particles = this.loadParticles();
        particles.push(particle);
        this.saveParticles(particles);
    }

    removeParticle(particleId) {
        const particles = this.loadParticles();
        const updatedParticles = particles.filter(p => p.id !== particleId);
        this.saveParticles(updatedParticles);
    }

    getParticlesByGeneration(generation) {
        const particles = this.loadParticles();
        return particles.filter(p => p.generation === generation);
    }

    getParticlesByType(type) {
        const particles = this.loadParticles();
        return particles.filter(p => p.type === type);
    }

    clearParticles() {
        localStorage.removeItem(this.storageKey);
    }
} 