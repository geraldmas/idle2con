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

    describe('getObservationCost', () => {
        test('should return base cost for rank 1', () => {
            expect(service.getObservationCost(1)).toBe(10);
        });

        test('should increase cost exponentially with rank', () => {
            expect(service.getObservationCost(2)).toBe(20);
            expect(service.getObservationCost(3)).toBe(40);
        });
    });

    describe('canObserve', () => {
        test('should return true when enough generators', () => {
            expect(service.canObserve(1, 10)).toBe(true);
            expect(service.canObserve(2, 20)).toBe(true);
        });

        test('should return false when not enough generators', () => {
            expect(service.canObserve(1, 9)).toBe(false);
            expect(service.canObserve(2, 19)).toBe(false);
        });
    });

    describe('observe', () => {
        test('should throw error when not enough generators', () => {
            expect(() => service.observe(1)).toThrow('Pas assez de générateurs');
        });

        test('should generate and store a particle when successful', () => {
            // Mock Math.random pour tester les différentes générations
            const originalRandom = Math.random;
            Math.random = jest.fn();

            // Test pour génération 1
            Math.random.mockReturnValue(0.5);
            const result1 = service.observe(1);
            expect(result1.particle).toBeDefined();
            expect(result1.cost).toBe(10);
            expect(mockStorage.addParticle).toHaveBeenCalled();

            // Test pour génération 2
            Math.random.mockReturnValue(0.9); // 20% chance de génération 2
            const result2 = service.observe(2);
            expect(result2.particle).toBeDefined();
            expect(result2.cost).toBe(20);

            // Test pour génération 3
            Math.random.mockReturnValue(0.9); // 15% chance de génération 3
            const result3 = service.observe(3);
            expect(result3.particle).toBeDefined();
            expect(result3.cost).toBe(40);

            // Restaurer Math.random
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