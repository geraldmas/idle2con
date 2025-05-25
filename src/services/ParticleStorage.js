import { Particle } from '../models/Particle';

export class ParticleStorage {
    constructor() {
        this.storageKey = 'quantum_factory_particles';
        this._particles = null; // Cache pour les particules
        this.loadParticles(); // Chargement initial
    }

    get particles() {
        if (this._particles === null) {
            this._particles = this.loadParticles();
        }
        return this._particles;
    }

    set particles(value) {
        this._particles = value;
        this.saveParticles();
    }

    saveParticles() {
        try {
            if (!this._particles) return;
            const particlesData = this._particles.map(particle => particle.toJSON());
            localStorage.setItem(this.storageKey, JSON.stringify(particlesData));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des particules:', error);
        }
    }

    loadParticles() {
        try {
            const particlesData = localStorage.getItem(this.storageKey);
            if (!particlesData) {
                this._particles = [];
                return this._particles;
            }
            
            const parsedData = JSON.parse(particlesData);
            this._particles = parsedData.map(data => Particle.fromJSON(data));
            return this._particles;
        } catch (error) {
            console.error('Erreur lors du chargement des particules:', error);
            this._particles = [];
            return this._particles;
        }
    }

    addParticle(particle) {
        if (!this._particles) {
            this._particles = [];
        }
        this._particles.push(particle);
        this.saveParticles();
    }

    removeParticle(particleId) {
        if (!this._particles) return;
        this._particles = this._particles.filter(p => p.id !== particleId);
        this.saveParticles();
    }

    getParticlesByGeneration(generation) {
        return this.particles.filter(p => p.generation === generation);
    }

    getParticlesByType(type) {
        return this.particles.filter(p => p.type === type);
    }

    clearParticles() {
        this._particles = [];
        this.saveParticles();
    }

    getParticles() {
        return this.particles;
    }

    hasParticleOfGeneration(generation) {
        return this.particles.some(particle => particle.generation === generation);
    }

    getBosons() {
        return this.particles.filter(particle => particle.generation === 4);
    }

    clear() {
        this._particles = [];
        this.saveParticles();
    }
} 