import { ParticleStorage } from '../ParticleStorage';
import { Particle } from '../../models/Particle';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Particle class methods for serialization/deserialization
jest.mock('../../models/Particle', () => {
    const originalParticle = jest.requireActual('../../models/Particle').Particle;
    return {
        Particle: jest.fn().mockImplementation((name, generation, type, effect) => {
            const actualParticle = new originalParticle(name, generation, type, effect);
            actualParticle.toJSON = jest.fn().mockReturnValue({
                id: actualParticle.id, // Use actual id for removal tests
                name,
                generation,
                type,
                effect: JSON.parse(JSON.stringify(effect)), // Deep copy effect
                createdAt: actualParticle.createdAt.toISOString(),
            });
            return actualParticle;
        }),
    };
});
// Add static fromJSON mock to the Particle mock
Particle.fromJSON = jest.fn().mockImplementation(data => {
    const originalParticle = jest.requireActual('../../models/Particle').Particle;
    // Reconstruct a particle-like object, ensuring it has an id for tests
    // The actual Particle constructor might not be easily callable if its mock is too simple
    // For this test, we mainly care that fromJSON is called and returns something usable.
    const p = new originalParticle(data.name, data.generation, data.type, data.effect);
    p.id = data.id; // Ensure ID is transferred
    p.createdAt = new Date(data.createdAt);
    // Mock toJSON on these "loaded" instances too if they are further manipulated and saved by other methods.
    p.toJSON = jest.fn().mockReturnValue(JSON.parse(JSON.stringify(data)));
    return p;
});


describe('ParticleStorage', () => {
    let particleStorage;
    const testParticle1Data = { name: 'Electron', generation: 1, type: 'electron', effect: { value: 0.05 } };
    const testParticle2Data = { name: 'Muon', generation: 2, type: 'muon', effect: { value: 0.20 } };
    const testParticle3DataGen1 = { name: 'NeutrinoE', generation: 1, type: 'neutrinoE', effect: { value: 0.1 } };


    beforeEach(() => {
        localStorageMock.clear();
        // Reset mocks on Particle and Particle.fromJSON before each test
        Particle.mockClear();
        Particle.fromJSON.mockClear();
        // Particle instances' toJSON mocks are set at instance creation by the Particle mock constructor
        
        particleStorage = new ParticleStorage(); // Will call loadParticles -> localStorage.getItem
    });

    test('constructor should load particles from localStorage if present', () => {
        const mockParticles = [testParticle1Data];
        localStorageMock.setItem(particleStorage.storageKey, JSON.stringify(mockParticles));
        Particle.fromJSON.mockImplementationOnce(data => ({...data, id: 'p1'})); // mock fromJSON for this specific call

        const newStorage = new ParticleStorage();
        expect(localStorageMock.getItem).toHaveBeenCalledWith(particleStorage.storageKey);
        expect(Particle.fromJSON).toHaveBeenCalledWith(testParticle1Data);
        expect(newStorage.getParticles().length).toBe(1);
    });

    test('constructor should initialize with empty array if no data in localStorage', () => {
        expect(particleStorage.getParticles()).toEqual([]);
        expect(localStorageMock.getItem).toHaveBeenCalledWith(particleStorage.storageKey);
    });

    test('addParticle should add a particle and save to localStorage', () => {
        const p1 = new Particle(testParticle1Data.name, testParticle1Data.generation, testParticle1Data.type, testParticle1Data.effect);
        particleStorage.addParticle(p1);
        
        expect(particleStorage.getParticles().length).toBe(1);
        expect(particleStorage.getParticles()[0]).toBe(p1);
        expect(p1.toJSON).toHaveBeenCalled();
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            particleStorage.storageKey,
            JSON.stringify([p1.toJSON()])
        );
    });

    test('removeParticle should remove a particle by id and save', () => {
        const p1 = new Particle(testParticle1Data.name, testParticle1Data.generation, testParticle1Data.type, testParticle1Data.effect);
        const p1Id = p1.id; // Get the actual generated ID
        const p2 = new Particle(testParticle2Data.name, testParticle2Data.generation, testParticle2Data.type, testParticle2Data.effect);
        
        particleStorage.addParticle(p1);
        particleStorage.addParticle(p2);
        expect(particleStorage.getParticles().length).toBe(2);

        particleStorage.removeParticle(p1Id);
        expect(particleStorage.getParticles().length).toBe(1);
        expect(particleStorage.getParticles()[0].name).toBe(testParticle2Data.name); // p2 should remain
        expect(localStorageMock.setItem).toHaveBeenCalledTimes(3); // initial load (empty), add p1, add p2, remove p1
    });

    test('clearParticles should remove all particles and save', () => {
        const p1 = new Particle(testParticle1Data.name, testParticle1Data.generation, testParticle1Data.type, testParticle1Data.effect);
        particleStorage.addParticle(p1);
        
        particleStorage.clearParticles();
        expect(particleStorage.getParticles().length).toBe(0);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(particleStorage.storageKey, JSON.stringify([]));
    });
    
    test('clear method should be an alias for clearParticles', () => {
        const p1 = new Particle(testParticle1Data.name, testParticle1Data.generation, testParticle1Data.type, testParticle1Data.effect);
        particleStorage.addParticle(p1);
        particleStorage.clear();
        expect(particleStorage.getParticles().length).toBe(0);
    });

    test('getParticlesByGeneration should filter correctly', () => {
        particleStorage.addParticle(new Particle(testParticle1Data.name, 1, 'e', {}));
        particleStorage.addParticle(new Particle(testParticle2Data.name, 2, 'm', {}));
        particleStorage.addParticle(new Particle(testParticle3DataGen1.name, 1, 'ne', {}));
        
        const gen1Particles = particleStorage.getParticlesByGeneration(1);
        expect(gen1Particles.length).toBe(2);
        expect(gen1Particles.every(p => p.generation === 1)).toBe(true);
    });

    test('getParticlesByType should filter correctly', () => {
        particleStorage.addParticle(new Particle(testParticle1Data.name, 1, 'electron', {}));
        particleStorage.addParticle(new Particle(testParticle2Data.name, 2, 'muon', {}));
        particleStorage.addParticle(new Particle(testParticle3DataGen1.name, 1, 'electron', {}));

        const electronParticles = particleStorage.getParticlesByType('electron');
        expect(electronParticles.length).toBe(2);
        expect(electronParticles.every(p => p.type === 'electron')).toBe(true);
    });

    test('getBosons should filter for generation 4 particles', () => {
        particleStorage.addParticle(new Particle('Photon', 4, 'boson_gamma', {}));
        particleStorage.addParticle(new Particle('Electron', 1, 'lepton_e', {}));
        
        const bosons = particleStorage.getBosons();
        expect(bosons.length).toBe(1);
        expect(bosons[0].generation).toBe(4);
    });
    
    test('hasParticleOfGeneration should return true if particles of generation exist', () => {
        particleStorage.addParticle(new Particle(testParticle1Data.name, 1, 'e', {}));
        expect(particleStorage.hasParticleOfGeneration(1)).toBe(true);
        expect(particleStorage.hasParticleOfGeneration(2)).toBe(false);
    });

    test('particles getter should load from storage if cache is null', () => {
        particleStorage._particles = null; // Invalidate cache
        localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([testParticle1Data]));
        Particle.fromJSON.mockImplementationOnce(data => ({...data, id: 'p1'}));

        const particles = particleStorage.particles; // Access via getter
        expect(localStorageMock.getItem).toHaveBeenCalledWith(particleStorage.storageKey);
        expect(Particle.fromJSON).toHaveBeenCalledWith(testParticle1Data);
        expect(particles.length).toBe(1);
    });

    test('particles setter should save particles', () => {
        const p1 = new Particle(testParticle1Data.name, 1, 'e', {});
        particleStorage.particles = [p1]; // Access via setter
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            particleStorage.storageKey,
            JSON.stringify([p1.toJSON()])
        );
        expect(particleStorage._particles[0]).toBe(p1);
    });

});
