import { PrestigeService } from '../PrestigeService';
import Resource from '../../models/Resource'; // For creating mock resources
import Generator from '../../models/Generator'; // For creating mock generators
import { Particle } from '../../models/Particle'; // For creating mock particles

describe('PrestigeService', () => {
    let prestigeService;
    let mockGameState;

    beforeEach(() => {
        prestigeService = new PrestigeService(); // Methods are mostly static or operate on passed gameState

        // Setup a basic mockGameState structure for each test
        const potentiel = new Resource('Potentiel', 0);
        const etats = new Resource('États', 0);
        const gen1 = new Generator(1, {}, {});
        gen1.count = 1;
        potentiel.setGenerators(gen1.count);

        mockGameState = {
            resources: new Map([
                ['Potentiel', potentiel],
                ['États', etats]
            ]),
            generators: [gen1],
            particles: [],
            antiparticles: [], // Ensure this is present for calculateAntiparticleEffects
            antipotential: 0,
            prestigeLevel: 0,
            prestigeMultiplier: 1,
            antiparticlesUnlocked: false,
            supersymmetricParticlesUnlocked: false,
            //antiparticleEffects: {} // This is calculated by PrestigeService or TickService
        };
    });

    describe('canPrestige', () => {
        it('should return false if potential is too low', () => {
            mockGameState.resources.get('Potentiel').value = 500; // Below threshold 1000
            mockGameState.particles = [
                new Particle('g1', 1, 't1', {}),
                new Particle('g2', 2, 't2', {}),
                new Particle('g3', 3, 't3', {})
            ];
            expect(prestigeService.canPrestige(mockGameState)).toBe(false);
        });

        it('should return false if not all particle generations 1-3 are present', () => {
            mockGameState.resources.get('Potentiel').value = 1500;
            mockGameState.particles = [ // Missing Gen 3
                new Particle('g1', 1, 't1', {}),
                new Particle('g2', 2, 't2', {})
            ];
            expect(prestigeService.canPrestige(mockGameState)).toBe(false);
        });

        it('should return true if conditions are met', () => {
            mockGameState.resources.get('Potentiel').value = 1500;
            mockGameState.particles = [
                new Particle('g1', 1, 't1', {}),
                new Particle('g2', 2, 't2', {}),
                new Particle('g3', 3, 't3', {})
            ];
            expect(prestigeService.canPrestige(mockGameState)).toBe(true);
        });
    });

    describe('calculateAntipotentialGain', () => {
        it('should return 0 if potential is 0 or less', () => {
            mockGameState.resources.get('Potentiel').value = 0;
            expect(prestigeService.calculateAntipotentialGain(mockGameState)).toBe(0);
        });

        it('should calculate log10(potential) correctly', () => {
            mockGameState.resources.get('Potentiel').value = 1000; // log10(1000) = 3
            expect(prestigeService.calculateAntipotentialGain(mockGameState)).toBe(3);
            mockGameState.resources.get('Potentiel').value = 100000; // log10(100000) = 5
            expect(prestigeService.calculateAntipotentialGain(mockGameState)).toBe(5);
        });
    });
    
    describe('getAntiparticleCost', () => {
        it('should return base cost if count is 0', () => {
            expect(prestigeService.getAntiparticleCost(0)).toBe(3); // baseCost = 3
        });

        it('should increase cost exponentially', () => {
            // cost = floor(baseCost * growthRate^count) = floor(3 * 1.1^count)
            expect(prestigeService.getAntiparticleCost(1)).toBe(Math.floor(3 * 1.1)); // 3
            expect(prestigeService.getAntiparticleCost(2)).toBe(Math.floor(3 * 1.1 * 1.1)); // 3
            expect(prestigeService.getAntiparticleCost(5)).toBe(Math.floor(3 * Math.pow(1.1, 5))); // 4
        });
    });

    describe('applyPrestige', () => {
        beforeEach(() => {
            // Setup conditions to be able to prestige
            mockGameState.resources.get('Potentiel').value = 2000; // Potential > 1000
            mockGameState.particles = [
                new Particle('g1', 1, 'type1', {}),
                new Particle('g2', 2, 'type2', {}),
                new Particle('g3', 3, 'type3', {}),
                new Particle('boson1', 4, 'bosonType', {}), // Gen 4 (boson)
                new Particle('g1_extra', 1, 'type1_extra', {})
            ];
            mockGameState.generators[0].count = 100; // Example generator count
            mockGameState.generators[0].maxCount = 100;
            mockGameState.generators[0].manualPurchases = 50;
            mockGameState.resources.get('États').value = 50;
            mockGameState.resources.get('États').totalEarned = 50;
        });

        it('should throw error if conditions are not met', () => {
            mockGameState.resources.get('Potentiel').value = 100; // Not enough potential
            expect(() => prestigeService.applyPrestige(mockGameState)).toThrow('Conditions de prestige non remplies');
        });

        it('should reset resources (Potentiel to 0, États to 0)', () => {
            prestigeService.applyPrestige(mockGameState);
            expect(mockGameState.resources.get('Potentiel').getValue()).toBe(0);
            expect(mockGameState.resources.get('États').getValue()).toBe(0);
            expect(mockGameState.resources.get('États').totalEarned).toBe(0);
            expect(mockGameState.resources.get('États').nextStateMilestone).toBe(1);
        });

        it('should reset generators (except Gen1 count to 1)', () => {
            const gen2 = new Generator(2, {}, {});
            gen2.count = 50;
            mockGameState.generators.push(gen2);
            
            prestigeService.applyPrestige(mockGameState);
            
            expect(mockGameState.generators[0].count).toBe(1); // Gen1 count reset to 1
            expect(mockGameState.generators[0].maxCount).toBe(0); // maxCount reset
            expect(mockGameState.generators[0].manualPurchases).toBe(0); // manualPurchases reset

            expect(gen2.count).toBe(0);
            expect(gen2.maxCount).toBe(0);
            expect(gen2.manualPurchases).toBe(0);
            
            // Potentiel resource should reflect gen1's count
            expect(mockGameState.resources.get('Potentiel').generators).toBe(1);
        });

        it('should retain only Generation 4 (boson) particles', () => {
            prestigeService.applyPrestige(mockGameState);
            expect(mockGameState.particles.length).toBe(1);
            expect(mockGameState.particles[0].name).toBe('boson1');
            expect(mockGameState.particles[0].generation).toBe(4);
        });

        it('should add antipotential points', () => {
            const gain = prestigeService.calculateAntipotentialGain(mockGameState); // log10(2000) ~ 3.3 => 3
            prestigeService.applyPrestige(mockGameState);
            expect(mockGameState.antipotential).toBe(gain);
        });

        it('should increment prestigeLevel and update prestigeMultiplier', () => {
            prestigeService.applyPrestige(mockGameState);
            expect(mockGameState.prestigeLevel).toBe(1);
            expect(mockGameState.prestigeMultiplier).toBe(1.5);

            // Second prestige
            mockGameState.resources.get('Potentiel').value = 3000;
            mockGameState.particles.push(new Particle('g1',1,{},{}), new Particle('g2',2,{},{}), new Particle('g3',3,{},{})); // Add non-bosons for condition
            prestigeService.applyPrestige(mockGameState);
            expect(mockGameState.prestigeLevel).toBe(2);
            expect(mockGameState.prestigeMultiplier).toBe(1.5 * 1.5); // 2.25
        });

        it('should unlock antiparticles on first prestige', () => {
            prestigeService.applyPrestige(mockGameState);
            expect(mockGameState.antiparticlesUnlocked).toBe(true);
        });
    });

    describe('static calculateAntiparticleEffects', () => {
        it('should return default effects if no antiparticles', () => {
            const effects = PrestigeService.calculateAntiparticleEffects(mockGameState);
            expect(effects.dtExponent).toBe(1);
            expect(effects.stateThresholdBase).toBe(10); // Denominator = 10
            expect(effects.generatorProductionMultiplier).toBe(1);
            expect(effects.costDivider).toBe(1);
        });

        it('should correctly calculate dtExponent', () => {
            mockGameState.antiparticles = [
                { type: 'antielectron' }, // +0.15
                { type: 'antimuon' }      // +0.5
            ];
            const effects = PrestigeService.calculateAntiparticleEffects(mockGameState);
            // Expected: 1 (base) + 0.15 + 0.5 = 1.65
            expect(effects.dtExponent).toBeCloseTo(1.65);
        });
        
        it('should ensure dtExponent is at least 1', () => {
             // No antiparticles affecting dtExponent
            mockGameState.antiparticles = [{type: 'antiquarkUp'}];
            let effects = PrestigeService.calculateAntiparticleEffects(mockGameState);
            expect(effects.dtExponent).toBe(1);
        });

        it('should correctly calculate stateThresholdBase', () => {
            mockGameState.antiparticles = [
                { type: 'antineutrinoE' }, // M=1
                { type: 'antineutrinoMu' }  // N=1
            ];
            const effects = PrestigeService.calculateAntiparticleEffects(mockGameState);
            // Denominator = 10 + M*1 + N*4 + P*13 = 10 + 1 + 4 = 15
            expect(effects.stateThresholdBase).toBe(15);
        });

        it('should correctly calculate generatorProductionMultiplier', () => {
            mockGameState.antiparticles = [
                { type: 'antiquarkUp' },    // *1.15
                { type: 'antiquarkCharm' } // *1.5
            ];
            const effects = PrestigeService.calculateAntiparticleEffects(mockGameState);
            expect(effects.generatorProductionMultiplier).toBeCloseTo(1.15 * 1.5);
        });

        it('should correctly calculate costDivider', () => {
            mockGameState.antiparticles = [
                { type: 'antiquarkDown' },    // *1.15
                { type: 'antiquarkStrange' } // *1.5
            ];
            const effects = PrestigeService.calculateAntiparticleEffects(mockGameState);
            expect(effects.costDivider).toBeCloseTo(1.15 * 1.5);
        });
    });
});
