import { SaveService } from '../SaveService';
import Resource from '../../models/Resource';
import Generator from '../../models/Generator';
import TickService from '../TickService';
import { PrestigeService } from '../PrestigeService';
import { markRaw } from 'vue';
import { Particle } from '../../models/Particle'; // Needed for Particle.fromJSON

// Mock PrestigeService as it's a dependency for TickService logic that calculates antiparticleEffects
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

describe('SaveService', () => {
    let saveService;

    beforeEach(() => {
        localStorage.clear();
        saveService = new SaveService();
        // Reset TickService state
        TickService.stop();
        TickService.setGameState(null); // Clear previous game state from TickService
        // Reset PrestigeService mock
        PrestigeService.calculateAntiparticleEffects.mockClear();
        PrestigeService.calculateAntiparticleEffects.mockReturnValue({
            dtExponent: 1,
            stateThresholdBase: 10,
            generatorProductionMultiplier: 1,
            costDivider: 1
        });
    });

    afterEach(() => {
        localStorage.clear();
        TickService.stop();
    });

    test('should save and load game state correctly', () => {
        let gameState = {
            resources: new Map([['Potentiel', new Resource('Potentiel', 100)]]),
            generators: [new Generator(1, {}, {})],
            particles: [],
            prestigeLevel: 1,
            prestigeMultiplier: 1.5,
            antiparticlesUnlocked: true,
            supersymmetricParticlesUnlocked: false
        };
        gameState.generators[0].count = 5;
        gameState.generators[0].maxCount = 5;
        gameState.generators[0].manualPurchases = 2;


        saveService.saveGame(gameState);
        const loadedState = saveService.loadGame();

        expect(loadedState).not.toBeNull();
        expect(loadedState.resources.length).toBe(1);
        expect(loadedState.resources[0].name).toBe('Potentiel');
        expect(loadedState.resources[0].value).toBe(100);
        expect(loadedState.generators.length).toBe(1);
        expect(loadedState.generators[0].rank).toBe(1);
        expect(loadedState.generators[0].count).toBe(5);
        expect(loadedState.generators[0].maxCount).toBe(5);
        expect(loadedState.generators[0].manualPurchases).toBe(2);
        expect(loadedState.prestigeLevel).toBe(1);
        expect(loadedState.prestigeMultiplier).toBe(1.5);
        expect(loadedState.antiparticlesUnlocked).toBe(true);
        expect(loadedState.supersymmetricParticlesUnlocked).toBe(false);
    });

    test('should clear save data', () => {
        let gameState = { resources: new Map([['Test', new Resource('Test', 10)]]), generators: [], particles: [] };
        saveService.saveGame(gameState);
        saveService.clearSave();
        const loadedState = saveService.loadGame();
        expect(loadedState).toBeNull();
    });

    test('Potentiel should update correctly after loading a game with active Gen1 generators', () => {
        // 1. Setup initial gameState
        let initialGameState = {
            resources: new Map(),
            generators: [],
            particles: [],
            antiparticles: [],
            antipotential: 0,
            prestigeLevel: 0,
            prestigeMultiplier: 1,
            antiparticlesUnlocked: false,
            supersymmetricParticlesUnlocked: false,
        };

        const initialPotentiel = new Resource('Potentiel', 10); // Start with some Potentiel
        const initialGen1 = new Generator(1, {}, {});
        initialGen1.name = 'Gen1';
        initialGen1.count = 2; // 2 Gen1 generators
        initialGen1.maxCount = 2;
        initialGen1.manualPurchases = 1; // Example value
        initialPotentiel.setGenerators(initialGen1.count);
        
        initialGameState.resources.set('Potentiel', initialPotentiel);
        initialGameState.generators.push(initialGen1);

        // Set initial observation counts for testing persistence
        initialGameState.observationCount = 5;
        initialGameState.antiparticleObservationCount = 2;

        // 2. Save this initial state
        saveService.saveGame(initialGameState);
        const initialPotentielValue = initialGameState.resources.get('Potentiel').getValue();

        // 3. Simulate App.vue's loading process
        const savedRawData = saveService.loadGame();
        expect(savedRawData).not.toBeNull();

        // Reconstruct gameState from savedRawData (simplified App.vue logic)
        let loadedGameState = {
            resources: new Map(),
            generators: [],
            particles: (savedRawData.particles || []).map(pData => Particle.fromJSON(pData)),
            antipotential: savedRawData.antipotential || 0,
            prestigeLevel: savedRawData.prestigeLevel || 0,
            prestigeMultiplier: savedRawData.prestigeMultiplier || 1,
            antiparticlesUnlocked: savedRawData.antiparticlesUnlocked || false,
            supersymmetricParticlesUnlocked: savedRawData.supersymmetricParticlesUnlocked || false,
            // antiparticleEffects will be set by TickService
            observationCount: savedRawData.observationCount || 0, // Ensure these are part of reconstruction if needed by other logic
            antiparticleObservationCount: savedRawData.antiparticleObservationCount || 0
        };

        savedRawData.resources.forEach(resourceData => {
            const resource = markRaw(new Resource(resourceData.name, resourceData.value));
            resource.totalEarned = resourceData.totalEarned || 0;
            resource.nextStateMilestone = resourceData.nextStateMilestone !== undefined ? resourceData.nextStateMilestone : (resourceData.name === 'États' ? 1 : null);
            if (resourceData.generators !== undefined) {
                resource.generators = resourceData.generators;
            }
            loadedGameState.resources.set(resource.name, resource);
        });

        savedRawData.generators.forEach(generatorData => {
            const generator = markRaw(new Generator(generatorData.rank, {}, {})); 
            generator.count = generatorData.count;
            generator.maxCount = generatorData.maxCount || 0;
            generator.manualPurchases = generatorData.manualPurchases || 0;
            generator.reachedMilestones = generatorData.reachedMilestones || [];
            generator.name = `Generator ${generatorData.rank}`; 
            loadedGameState.generators.push(generator);
        });
        
        // Apply the fix: Ensure Gen1 exists and Potentiel resource is linked (as in App.vue)
        let gen1Instance = loadedGameState.generators.find(gen => gen.rank === 1);
        if (!gen1Instance) {
            const defaultGen1 = markRaw(new Generator(1, {}, {}));
            defaultGen1.name = 'Générateur Quantique I';
            defaultGen1.count = 1; 
            loadedGameState.generators.push(defaultGen1);
            loadedGameState.generators.sort((a, b) => a.rank - b.rank);
            gen1Instance = defaultGen1;
        }
        const potentielResourceAfterLoad = loadedGameState.resources.get('Potentiel');
        if (potentielResourceAfterLoad && gen1Instance) {
            potentielResourceAfterLoad.setGenerators(gen1Instance.count);
        } else if (potentielResourceAfterLoad) {
            potentielResourceAfterLoad.setGenerators(0);
        }
        
        expect(gen1Instance.count).toBe(2); // Ensure loaded Gen1 count is what was saved
        expect(potentielResourceAfterLoad.generators).toBe(2); // 'n' for Potentiel

        // Assert that observation counts were loaded correctly
        expect(loadedGameState.observationCount).toBe(5);
        expect(loadedGameState.antiparticleObservationCount).toBe(2);

        // 4. Initialize TickService with the loaded state
        TickService.stop(); 
        TickService.setGameState(loadedGameState);
        loadedGameState.antiparticleEffects = PrestigeService.calculateAntiparticleEffects(loadedGameState); // Calculate initial effects
        // TickService.start(); // Not starting for manual tick calls

        // 5. Run a few ticks
        const tickCount = 5;
        for (let i = 0; i < tickCount; i++) {
            TickService.tick();
        }
        // TickService.stop(); // Already stopped or not started

        const finalPotentielValue = loadedGameState.resources.get('Potentiel').getValue();
        // Gen1 count = 2, baseProd = 1/32, milestoneBonus (maxCount=2, so no milestone <10) = 1
        // antiparticleMultiplier = 1 (default mock)
        // totalParticleDtMultiplier = 1 (no particles)
        // antiparticleDtExponent = 1 (default mock)
        // effectiveDt = 0.1 (TickService.dt)
        // Production per tick = 2 * (1/32) * 1 * 1 * 0.1 = 0.00625
        // Total production = 0.00625 * 5 = 0.03125
        const expectedFinalValue = initialPotentielValue + (0.00625 * tickCount);
        
        expect(finalPotentielValue).toBeGreaterThan(initialPotentielValue);
        expect(finalPotentielValue).toBeCloseTo(expectedFinalValue);
    });
});
