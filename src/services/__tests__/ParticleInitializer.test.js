import { ParticleInitializer } from '../ParticleInitializer';
import { ParticleStorage } from '../ParticleStorage';

jest.mock('../ParticleStorage');

describe('ParticleInitializer', () => {
    let initializer;
    let mockStorage;

    beforeEach(() => {
        mockStorage = {
            loadParticles: jest.fn(),
            addParticle: jest.fn(),
            clearParticles: jest.fn()
        };
        ParticleStorage.mockImplementation(() => mockStorage);
        initializer = new ParticleInitializer();
    });

    test('should not initialize if particles already exist', () => {
        mockStorage.loadParticles.mockReturnValue([{ id: '1' }]);
        initializer.initialize();
        expect(mockStorage.addParticle).not.toHaveBeenCalled();
    });

    test('should initialize with default particles if none exist', () => {
        mockStorage.loadParticles.mockReturnValue([]);
        initializer.initialize();
        expect(mockStorage.addParticle).toHaveBeenCalledTimes(5); // 5 particules initiales
    });

    test('should reset particles and reinitialize', () => {
        initializer.reset();
        expect(mockStorage.clearParticles).toHaveBeenCalled();
        expect(mockStorage.addParticle).toHaveBeenCalledTimes(5);
    });
}); 