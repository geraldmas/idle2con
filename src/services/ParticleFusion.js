import { ParticleStorage } from './ParticleStorage';
import { Muon, NeutrinoMu, QuarkCharm, QuarkStrange } from '../models/particles/Generation2Particles';
import { Tau, NeutrinoTau, QuarkTruth, QuarkBeauty } from '../models/particles/Generation3Particles';

export class ParticleFusion {
    constructor() {
        this.storage = new ParticleStorage();
    }

    canFuseParticles(type) {
        const particles = this.storage.getParticlesByType(type) || [];
        return particles.length >= 3;
    }

    getFusionResult(type) {
        const mapping = {
            // Génération 1 vers 2
            'electron': Muon,
            'neutrinoE': NeutrinoMu,
            'quarkUp': QuarkCharm,
            'quarkDown': QuarkStrange,
            
            // Génération 2 vers 3
            'muon': Tau,
            'neutrinoMu': NeutrinoTau,
            'quarkCharm': QuarkTruth,
            'quarkStrange': QuarkBeauty
        };

        return mapping[type];
    }

    fuseParticles(type) {
        const ResultClass = this.getFusionResult(type);
        if (!ResultClass) {
            throw new Error('Fusion impossible pour ce type de particule');
        }
        if (!this.canFuseParticles(type)) {
            throw new Error('Pas assez de particules pour la fusion');
        }

        const particles = this.storage.getParticlesByType(type) || [];

        // Supprimer les 3 particules utilisées pour la fusion
        const particlesToRemove = particles.slice(0, 3);
        particlesToRemove.forEach(particle => {
            this.storage.removeParticle(particle.id);
        });

        // Créer la nouvelle particule
        const newParticle = new ResultClass();
        this.storage.addParticle(newParticle);

        return newParticle;
    }

    getFusionRequirements(type) {
        return {
            required: 3,
            current: this.storage.getParticlesByType(type).length,
            result: this.getFusionResult(type)?.name || 'Fusion impossible'
        };
    }
} 