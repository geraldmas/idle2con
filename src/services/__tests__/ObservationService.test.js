import { ObservationService } from '../ObservationService';
// import { ParticleStorage } from '../ParticleStorage'; // No longer used by ObservationService

// jest.mock('../ParticleStorage'); // No longer needed

describe('ObservationService', () => {
    let service;
    // let mockStorage; // No longer needed

    beforeEach(() => {
        // mockStorage = { // No longer needed
        //     addParticle: jest.fn()
        // };
        // ParticleStorage.mockImplementation(() => mockStorage); // No longer needed
        service = new ObservationService();
    });

    describe('getParticleObservationCost', () => {
        test('should return base cost when observationCount is 0', () => {
            service.observationCount = 0;
            // baseCost is 10, costGrowthRate is 1.1
            // Expected: floor(10 * 1.1^0) = 10
            expect(service.getParticleObservationCost()).toBe(10);
        });

        test('should increase cost correctly with observationCount', () => {
            service.observationCount = 0;
            expect(service.getParticleObservationCost()).toBe(10); // Cost for 1st observation

            service.observationCount = 1; // After 1 observation
            // Expected: floor(10 * 1.1^1) = 11
            expect(service.getParticleObservationCost()).toBe(11); // Cost for 2nd observation

            service.observationCount = 2; // After 2 observations
            // Expected: floor(10 * 1.1^2) = floor(10 * 1.21) = 12
            expect(service.getParticleObservationCost()).toBe(12); // Cost for 3rd observation
        });
    });

    describe('canObserveParticle', () => {
        // gameState is not used by canObserveParticle in the current implementation, can pass null or {}
        test('should return true when enough generators for current observation cost', () => {
            service.observationCount = 0; // Cost will be 10
            expect(service.canObserveParticle(1, 10, {})).toBe(true);
            
            service.observationCount = 1; // Cost will be 11
            expect(service.canObserveParticle(1, 11, {})).toBe(true);
        });

        test('should return false when not enough generators for current observation cost', () => {
            service.observationCount = 0; // Cost will be 10
            expect(service.canObserveParticle(1, 9, {})).toBe(false);

            service.observationCount = 1; // Cost will be 11
            expect(service.canObserveParticle(1, 10, {})).toBe(false);
        });
    });

    describe('observe', () => {
        test('should generate and store a particle, and use correct increasing cost', () => {
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.5); // Mock for consistent particle generation

            // First observation
            service.observationCount = 0;
            // Assuming observe method itself will increment observationCount AFTER successful observation
            // For this test, we'll assume the passed generatorCount is sufficient.
            // The method signature is observe(gameState, prestigeService, isAntiparticle = false, generatorRank = null, generatorCount = null)
            // The `generatorCount` parameter is used by `canObserveParticle` if it were called inside, but it's called before.
            // The `observe` method itself doesn't re-check `canObserveParticle`.
            // The cost is determined by `this.getParticleObservationCost()` at the time of calling.
            
            // Mock necessary parts of gameState and prestigeService if they are touched by 'observe' for normal particles
            const mockGameState = {}; 
            const mockPrestigeService = {};

            let result = service.observe(mockGameState, mockPrestigeService, false, 1, 10); // Rank 1, 10 generators available
            expect(result.particle).toBeDefined();
            expect(result.cost).toBe(10); // Cost for observationCount = 0
            expect(mockStorage.addParticle).toHaveBeenCalledTimes(1);
            // Assuming observe increments its internal observationCount
            // Check service.observationCount after observe if it's responsible for incrementing it.
            // The current code in ObservationService.js: this.observationCount++; is inside observe()

            // Second observation
            // service.observationCount is now 1 due to the previous call
            result = service.observe(mockGameState, mockPrestigeService, false, 1, 11); // Rank 1, 11 generators available
            expect(result.particle).toBeDefined();
            expect(result.cost).toBe(11); // Cost for observationCount = 1
            expect(mockStorage.addParticle).toHaveBeenCalledTimes(2);

            Math.random = originalRandom;
        });
    });

    describe('generateRandomParticle', () => {
        test('should generate correct particle types based on rank', () => {
            const originalRandom = Math.random;
            Math.random = jest.fn();

            // Test rang 1 (100% génération 1)
            Math.random.mockReturnValue(0.5);
            const particle1 = service.generateRandomParticle(1);
            expect(particle1.generation).toBe(1);

            // Test rang 2 (80% génération 1, 20% génération 2)
            Math.random.mockReturnValue(0.9);
            const particle2 = service.generateRandomParticle(2);
            expect(particle2.generation).toBe(2);

            // Test rang 3 (50% génération 1, 35% génération 2, 15% génération 3)
            Math.random.mockReturnValue(0.9);
            const particle3 = service.generateRandomParticle(3);
            expect(particle3.generation).toBe(3);

            Math.random = originalRandom;
        });
    });

    describe('Antiparticle Observation', () => {
        let mockGameState;
        let mockPrestigeServiceInstance;

        beforeEach(() => {
            // ObservationService instance 'service' is created in the outer beforeEach

            mockGameState = { // A minimal gameState for these tests
                antipotential: 100,
                antiparticleObservationCount: 0,
                observationCount: 0, // Include for completeness, though not primary for these tests
                antiparticlesUnlocked: true, // Assume unlocked for these tests
            };

            // Mock the prestigeService instance and its methods
            mockPrestigeServiceInstance = {
                isAntiparticlesUnlocked: jest.fn().mockReturnValue(true),
                getAntiparticleCost: jest.fn().mockImplementation(count => {
                    // Simple mock: base 3, growth 1.1
                    return Math.floor(3 * Math.pow(1.1, count));
                })
            };
        });

        test('canObserveAntiparticle should return true if conditions met', () => {
            mockGameState.antipotential = 10;
            mockGameState.antiparticleObservationCount = 0; // Cost will be 3
            expect(service.canObserveAntiparticle(mockGameState, mockPrestigeServiceInstance)).toBe(true);
            expect(mockPrestigeServiceInstance.isAntiparticlesUnlocked).toHaveBeenCalledWith(mockGameState);
            expect(mockPrestigeServiceInstance.getAntiparticleCost).toHaveBeenCalledWith(0);
        });

        test('canObserveAntiparticle should return false if not unlocked', () => {
            mockPrestigeServiceInstance.isAntiparticlesUnlocked.mockReturnValue(false);
            mockGameState.antipotential = 10;
            expect(service.canObserveAntiparticle(mockGameState, mockPrestigeServiceInstance)).toBe(false);
        });

        test('canObserveAntiparticle should return false if not enough antipotential', () => {
            mockGameState.antipotential = 2; // Cost for count 0 is 3
            mockGameState.antiparticleObservationCount = 0;
            expect(service.canObserveAntiparticle(mockGameState, mockPrestigeServiceInstance)).toBe(false);
        });

        test('getAntiparticleObservationCost calls prestigeService correctly', () => {
            // The method in ObservationService is getAntiparticleObservationCost.
            service.getAntiparticleObservationCost(mockPrestigeServiceInstance, 0);
            expect(mockPrestigeServiceInstance.getAntiparticleCost).toHaveBeenCalledWith(0);
            
            service.getAntiparticleObservationCost(mockPrestigeServiceInstance, 3);
            expect(mockPrestigeServiceInstance.getAntiparticleCost).toHaveBeenCalledWith(3);
        });

        test('observe (antiparticle) should return antiparticle and new count, and correct cost', () => {
            mockGameState.antipotential = 100; // Sufficient for multiple observations
            mockGameState.antiparticleObservationCount = 1; // Start with a count of 1
            
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.1); // To pick first antiparticle type

            const result = service.observe(mockGameState, mockPrestigeServiceInstance, true, null, null);
            
            expect(result.isAntiparticle).toBe(true);
            expect(result.item).toBeDefined();
            // Antiparticles don't have a 'generation' property in the same way as normal particles in current models
            // expect(result.item.generation).toBeGreaterThanOrEqual(1); // This might fail or be irrelevant
            expect(result.cost).toBe(Math.floor(3 * Math.pow(1.1, 1))); // Cost for count 1 is 3
            expect(result.newAntiparticleObservationCount).toBe(mockGameState.antiparticleObservationCount + 1); // Should be 2
            expect(result.newObservationCount).toBe(mockGameState.observationCount); // Should be unchanged (0)

            Math.random = originalRandom;
        });

        test('observe (antiparticle) should throw error if cannot observe', () => {
            mockPrestigeServiceInstance.isAntiparticlesUnlocked.mockReturnValue(false);
            expect(() => {
                service.observe(mockGameState, mockPrestigeServiceInstance, true, null, null);
            }).toThrow('Conditions non remplies pour observer une antiparticule');
        });
    });
}); 