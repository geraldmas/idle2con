import { Muon, NeutrinoMu, QuarkCharm, QuarkStrange } from '../models/particles/Generation2Particles';
import { Tau, NeutrinoTau, QuarkTruth, QuarkBeauty } from '../models/particles/Generation3Particles';

export class ParticleFusion {
    constructor() {
        this.particles = [];
    }

    setParticles(particles) {
        this.particles = particles;
    }

    canFuseParticles(type) {
        const particles = this.particles.filter(p => p.type === type);
        // Désactiver la fusion des particules de génération 3
        if (particles.length > 0 && particles[0].generation === 3) {
            return false;
        }
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

        const particles = this.particles.filter(p => p.type === type);

        // Supprimer les 3 particules utilisées pour la fusion
        const particlesToRemove = particles.slice(0, 3);
        particlesToRemove.forEach(particle => {
            const index = this.particles.findIndex(p => p.id === particle.id);
            if (index !== -1) {
                this.particles.splice(index, 1);
            }
        });

        // Créer la nouvelle particule
        const newParticle = new ResultClass();
        this.particles.push(newParticle);

        return newParticle;
    }

    getFusionRequirements(type) {
        return {
            required: 3,
            current: this.particles.filter(p => p.type === type).length,
            result: this.getFusionResult(type)?.name || 'Fusion impossible'
        };
    }
} 