import { Particle } from '../Particle';
import { Electron, NeutrinoE, QuarkUp, QuarkDown } from '../particles/Generation1Particles';
import { ParticleStorage } from '../../services/ParticleStorage';

describe('Particle', () => {
    test('should create a particle with correct properties', () => {
        const effect = {
            value: 0.1,
            apply: jest.fn()
        };
        const particle = new Particle('Test', 1, 'test', effect);
        
        expect(particle.name).toBe('Test');
        expect(particle.generation).toBe(1);
        expect(particle.type).toBe('test');
        expect(particle.effect).toBe(effect);
        expect(particle.id).toBeDefined();
        expect(particle.createdAt).toBeInstanceOf(Date);
    });

    test('should serialize and deserialize correctly', () => {
        const effect = {
            value: 0.1,
            apply: jest.fn()
        };
        const particle = new Particle('Test', 1, 'test', effect);
        const json = particle.toJSON();
        const reconstructed = Particle.fromJSON(json);

        expect(reconstructed.name).toBe(particle.name);
        expect(reconstructed.generation).toBe(particle.generation);
        expect(reconstructed.type).toBe(particle.type);
        expect(reconstructed.id).toBe(particle.id);
    });
});

describe('Generation 1 Particles', () => {
    test('Electron should have correct effect', () => {
        const electron = new Electron();
        const gameState = { dt: 1 };
        const newState = electron.applyEffect(gameState);
        expect(newState.dt).toBe(1.03);
    });

    test('NeutrinoE should have correct effect', () => {
        const neutrino = new NeutrinoE();
        const gameState = { n: 1, generators: { 1: 10 } };
        const newState = neutrino.applyEffect(gameState);
        expect(newState.n).toBe(2);
    });
});

describe('ParticleStorage', () => {
    let storage;
    let mockLocalStorage;

    beforeEach(() => {
        mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        global.localStorage = mockLocalStorage;
        storage = new ParticleStorage();
    });

    test('should save and load particles', () => {
        const electron = new Electron();
        storage.addParticle(electron);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
        const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(savedData[0].name).toBe('Électron');
    });

    test('should filter particles by generation', () => {
        const electron = new Electron();
        const neutrino = new NeutrinoE();
        storage.addParticle(electron);
        storage.addParticle(neutrino);

        const gen1Particles = storage.getParticlesByGeneration(1);
        expect(gen1Particles.length).toBe(2);
    });
}); 