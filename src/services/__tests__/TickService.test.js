import TickService from '../TickService';
import Resource from '../../models/Resource';
import Generator from '../../models/Generator';
import { Electron } from '../../models/particles/Generation1Particles'; // For testing particle dt effect
import { PrestigeService } from '../PrestigeService'; // To spy on calculateAntiparticleEffects

// Mock PrestigeService and its static method
jest.mock('../PrestigeService', () => ({
    PrestigeService: {
        calculateAntiparticleEffects: jest.fn().mockReturnValue({
            dtExponent: 1,
            stateThresholdBase: 10,
            generatorProductionMultiplier: 1,
            costDivider: 1
        })
    }
}));

describe('TickService', () => {
    let mockGameState;

    beforeEach(() => {
        // Reset TickService state if necessary (though it's a singleton, be careful with shared state across tests)
        TickService.stop(); // Stop any existing interval
        TickService.setDebug(false);
        // TickService.dt is 0.1

        // Create a fresh mockGameState for each test
        const potentiel = new Resource('Potentiel', 0);
        const etats = new Resource('États', 0);
        const gen1 = new Generator(1, {}, {}); // Base costs/growths are internal to methods now
        gen1.name = 'Gen1'; // For debug logs if any
        gen1.count = 1; // Start with 1 Gen1 for Potentiel production
        potentiel.setGenerators(gen1.count);


        mockGameState = {
            resources: new Map([
                ['Potentiel', potentiel],
                ['États', etats]
            ]),
            generators: [gen1],
            particles: [],
            antiparticles: [], // For calculateAntiparticleEffects
            antiparticleEffects: {} // Will be populated by TickService
        };
        
        TickService.setGameState(mockGameState);

        // Clear mock calls for PrestigeService static method
        PrestigeService.calculateAntiparticleEffects.mockClear();
        // Reset to default mock implementation for each test
        PrestigeService.calculateAntiparticleEffects.mockReturnValue({ 
            dtExponent: 1, 
            stateThresholdBase: 10, 
            generatorProductionMultiplier: 1, 
            costDivider: 1 
        });
    });

    afterEach(() => {
        TickService.stop();
    });

    test('should correctly calculate antiparticleEffects via PrestigeService', () => {
        TickService.tick();
        expect(PrestigeService.calculateAntiparticleEffects).toHaveBeenCalledWith(mockGameState);
        expect(mockGameState.antiparticleEffects).toBeDefined();
    });

    test('should calculate Potentiel production correctly (no particle/antiparticle effects)', () => {
        const gen1 = mockGameState.generators[0];
        gen1.count = 1;
        mockGameState.resources.get('Potentiel').setGenerators(gen1.count);
        
        TickService.tick(); // dt = 0.1

        const potentiel = mockGameState.resources.get('Potentiel');
        // Expected: count * baseProd * milestoneBonus * antiparticleMulti * effectiveDt
        // Gen1 count = 1, baseProd = 1/32, milestoneBonus (maxCount=1) = 1
        // antiparticleMulti = 1 (default mock)
        // totalParticleDtMultiplier = 1 (no particles)
        // antiparticleDtExponent = 1 (default mock)
        // baseDtForCalc = 0.1 * 1 = 0.1
        // effectiveDt = Math.pow(0.1, 1) = 0.1
        // Production = 1 * (1/32) * 1 * 1 * 0.1 = 0.003125
        expect(potentiel.getValue()).toBeCloseTo(0.003125);
    });

    test('should apply particle dtMultiplier to Potentiel production', () => {
        const gen1 = mockGameState.generators[0];
        gen1.count = 1;
        mockGameState.resources.get('Potentiel').setGenerators(gen1.count);
        
        const electron = new Electron(); // dtMultiplier = 0.05
        mockGameState.particles.push(electron);

        TickService.tick();

        const potentiel = mockGameState.resources.get('Potentiel');
        // totalParticleDtMultiplier = 1 * (1 + 0.05) = 1.05
        // baseDtForCalc = 0.1 * 1.05 = 0.105
        // effectiveDt = Math.pow(0.105, 1) = 0.105
        // Production = 1 * (1/32) * 1 * 1 * 0.105 = 0.00328125
        expect(potentiel.getValue()).toBeCloseTo(0.00328125);
    });

    test('should apply antiparticle dtExponent to Potentiel production', () => {
        PrestigeService.calculateAntiparticleEffects.mockReturnValue({ 
            dtExponent: 2, // Custom exponent
            stateThresholdBase: 10, 
            generatorProductionMultiplier: 1, 
            costDivider: 1 
        });

        const gen1 = mockGameState.generators[0];
        gen1.count = 1;
        mockGameState.resources.get('Potentiel').setGenerators(gen1.count);

        TickService.tick();

        const potentiel = mockGameState.resources.get('Potentiel');
        // totalParticleDtMultiplier = 1
        // baseDtForCalc = 0.1 * 1 = 0.1
        // effectiveDt = Math.pow(0.1, 2) = 0.01
        // Production = 1 * (1/32) * 1 * 1 * 0.01 = 0.0003125
        expect(potentiel.getValue()).toBeCloseTo(0.0003125);
    });
    
    test('should apply antiparticle generatorProductionMultiplier to Potentiel production', () => {
        PrestigeService.calculateAntiparticleEffects.mockReturnValue({ 
            dtExponent: 1, 
            stateThresholdBase: 10, 
            generatorProductionMultiplier: 2, // Custom multiplier
            costDivider: 1 
        });

        const gen1 = mockGameState.generators[0];
        gen1.count = 1;
        mockGameState.resources.get('Potentiel').setGenerators(gen1.count);
        
        TickService.tick();

        const potentiel = mockGameState.resources.get('Potentiel');
        // effectiveDt = 0.1
        // Production = 1 * (1/32) * 1 * 2 * 0.1 = 0.00625
        expect(potentiel.getValue()).toBeCloseTo(0.00625);
    });

    test('should pass baseDtForCalc (with particle multipliers) to resource.update for États', () => {
        const electron = new Electron(); // dtMultiplier = 0.05
        mockGameState.particles.push(electron);
        
        const etatsResource = mockGameState.resources.get('États');
        jest.spyOn(etatsResource, 'update'); // Spy on the update method of the specific instance

        TickService.tick();

        // totalParticleDtMultiplier = 1.05
        // baseDtForCalc = 0.1 * 1.05 = 0.105
        // antiparticleEffects = default mock
        expect(etatsResource.update).toHaveBeenCalledWith(0.105, mockGameState.antiparticleEffects);
        
        etatsResource.update.mockRestore();
    });

    test('should not have higher-tier generators producing lower-tier ones', () => {
        const gen1 = mockGameState.generators[0];
        const initialGen1Count = 10;
        gen1.count = initialGen1Count;

        const gen2 = new Generator(2, {}, {});
        gen2.name = 'Gen2';
        gen2.count = 5; // Gen2 has 5 units
        mockGameState.generators.push(gen2);

        TickService.tick();
        
        // Gen1 count should only change due to its own mechanics, not from Gen2 production
        // Since there are no direct Gen1 mechanics changing its own count in a single tick here,
        // and Gen2 production of Gen1 is removed, its count should remain the same.
        expect(gen1.count).toBe(initialGen1Count);
    });
    
    test('should update generator unlock status', () => {
        const gen1 = mockGameState.generators[0];
        gen1.count = 9;
        const gen2 = new Generator(2, {}, {});
        gen2.name = 'Gen2';
        gen2.isUnlocked = false; // Starts locked
        mockGameState.generators.push(gen2);

        jest.spyOn(gen2, 'updateUnlockStatus');
        
        TickService.tick();
        expect(gen2.updateUnlockStatus).toHaveBeenCalledWith(mockGameState.generators);
        expect(gen2.isUnlocked).toBe(false); // Gen1 count is 9

        gen1.count = 10; // Now enough to unlock Gen2
        TickService.tick();
        expect(gen2.isUnlocked).toBe(true);
        
        gen2.updateUnlockStatus.mockRestore();
    });

});
