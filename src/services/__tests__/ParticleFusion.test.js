import { ParticleFusion } from '../ParticleFusion';
import { Electron, NeutrinoE, QuarkUp } from '../../models/particles/Generation1Particles';
import { Muon, NeutrinoMu, QuarkCharm } from '../../models/particles/Generation2Particles';
import { Tau, NeutrinoTau, QuarkTruth } from '../../models/particles/Generation3Particles';

describe('ParticleFusion', () => {
    let fusion;
    let mockStorage;

    beforeEach(() => {
        mockStorage = {
            getParticlesByType: jest.fn(),
            removeParticle: jest.fn(),
            addParticle: jest.fn()
        };
        fusion = new ParticleFusion();
        fusion.storage = mockStorage;
    });

    test('should check if particles can be fused', () => {
        mockStorage.getParticlesByType.mockImplementation((type) => {
            if (type === 'electron') return [new Electron(), new Electron(), new Electron()];
            return [];
        });

        expect(fusion.canFuseParticles('electron')).toBe(true);
        expect(fusion.canFuseParticles('muon')).toBe(false);
    });

    test('should get correct fusion result for generation 1 particles', () => {
        expect(fusion.getFusionResult('electron')).toBe(Muon);
        expect(fusion.getFusionResult('neutrinoE')).toBe(NeutrinoMu);
        expect(fusion.getFusionResult('quarkUp')).toBe(QuarkCharm);
    });

    test('should get correct fusion result for generation 2 particles', () => {
        expect(fusion.getFusionResult('muon')).toBe(Tau);
        expect(fusion.getFusionResult('neutrinoMu')).toBe(NeutrinoTau);
        expect(fusion.getFusionResult('quarkCharm')).toBe(QuarkTruth);
    });

    test('should fuse particles correctly', () => {
        const particles = [
            new Electron(),
            new Electron(),
            new Electron()
        ];
        mockStorage.getParticlesByType.mockReturnValue(particles);

        const result = fusion.fuseParticles('electron');

        expect(result).toBeInstanceOf(Muon);
        expect(mockStorage.removeParticle).toHaveBeenCalledTimes(3);
        expect(mockStorage.addParticle).toHaveBeenCalledTimes(1);
    });

    test('should throw error when not enough particles', () => {
        mockStorage.getParticlesByType.mockReturnValue([
            new Electron(),
            new Electron()
        ]);

        expect(() => fusion.fuseParticles('electron')).toThrow('Pas assez de particules pour la fusion');
    });

    test('should get fusion requirements', () => {
        mockStorage.getParticlesByType.mockReturnValue([
            new Electron(),
            new Electron(),
            new Electron()
        ]);

        const requirements = fusion.getFusionRequirements('electron');
        expect(requirements).toEqual({
            required: 3,
            current: 3,
            result: 'Muon'
        });
    });

    test('should get fusion requirements for different particle types', () => {
        mockStorage.getParticlesByType.mockReturnValue([
            new Electron(),
            new Electron(),
            new Electron()
        ]);

        const requirements = fusion.getFusionRequirements('electron');
        expect(requirements).toEqual({
            required: 3,
            current: 3,
            result: 'Muon'
        });

        mockStorage.getParticlesByType.mockReturnValue([
            new Muon(),
            new Muon(),
            new Muon()
        ]);

        const requirements2 = fusion.getFusionRequirements('muon');
        expect(requirements2).toEqual({
            required: 3,
            current: 3,
            result: 'Tau'
        });
    });

    test('should handle fusion of quarks correctly', () => {
        const quarks = [
            new QuarkUp(),
            new QuarkUp(),
            new QuarkUp()
        ];
        mockStorage.getParticlesByType.mockReturnValue(quarks);

        const result = fusion.fuseParticles('quarkUp');
        expect(result).toBeInstanceOf(QuarkCharm);
        expect(mockStorage.removeParticle).toHaveBeenCalledTimes(3);
        expect(mockStorage.addParticle).toHaveBeenCalledTimes(1);
    });

    test('should handle fusion of neutrinos correctly', () => {
        const neutrinos = [
            new NeutrinoE(),
            new NeutrinoE(),
            new NeutrinoE()
        ];
        mockStorage.getParticlesByType.mockReturnValue(neutrinos);

        const result = fusion.fuseParticles('neutrinoE');
        expect(result).toBeInstanceOf(NeutrinoMu);
        expect(mockStorage.removeParticle).toHaveBeenCalledTimes(3);
        expect(mockStorage.addParticle).toHaveBeenCalledTimes(1);
    });

    test('should throw error for invalid particle type', () => {
        mockStorage.getParticlesByType.mockReturnValue(undefined);
        expect(() => fusion.fuseParticles('invalidType')).toThrow('Fusion impossible pour ce type de particule');
    });
}); 