import { ObservationService } from '../ObservationService';
import { ParticleStorage } from '../ParticleStorage';

jest.mock('../ParticleStorage');

describe('ObservationService', () => {
    let service;
    let mockStorage;

    beforeEach(() => {
        mockStorage = {
            addParticle: jest.fn()
        };
        ParticleStorage.mockImplementation(() => mockStorage);
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
}); 