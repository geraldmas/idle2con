import { ParticleFusion } from '../ParticleFusion';
import { Electron, NeutrinoE } from '../../models/particles/Generation1Particles';
import { Muon, NeutrinoMu } from '../../models/particles/Generation2Particles';
import { Tau, NeutrinoTau } from '../../models/particles/Generation3Particles';

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
        mockStorage.getParticlesByType.mockReturnValue([
            new Electron(),
            new Electron(),
            new Electron()
        ]);

        expect(fusion.canFuseParticles('electron')).toBe(true);
        expect(fusion.canFuseParticles('muon')).toBe(false);
    });

    test('should get correct fusion result for generation 1 particles', () => {
        expect(fusion.getFusionResult('electron')).toBe(Muon);
        expect(fusion.getFusionResult('neutrinoE')).toBe(NeutrinoMu);
    });

    test('should get correct fusion result for generation 2 particles', () => {
        expect(fusion.getFusionResult('muon')).toBe(Tau);
        expect(fusion.getFusionResult('neutrinoMu')).toBe(NeutrinoTau);
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
}); 