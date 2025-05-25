import { Particle } from '../Particle';
import { Electron, NeutrinoE, QuarkUp, QuarkDown } from '../particles/Generation1Particles';
import { Muon, NeutrinoMu, QuarkCharm } from '../particles/Generation2Particles';
import { Tau, NeutrinoTau, QuarkTruth } from '../particles/Generation3Particles';

describe('Particle Base Class', () => {
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

describe('Particle Effects', () => {
    describe('DT Multiplier Effects', () => {
        test('Single electron should multiply dt by 1.03', () => {
            const electron = new Electron();
            const gameState = { dt: 1 };
            const newState = electron.applyEffect(gameState);
            expect(newState.dt).toBe(1.03);
        });

        test('Multiple electrons should multiply dt multiplicatively', () => {
            const electron1 = new Electron();
            const electron2 = new Electron();
            const electron3 = new Electron();
            
            let gameState = { dt: 1 };
            gameState = electron1.applyEffect(gameState);
            gameState = electron2.applyEffect(gameState);
            gameState = electron3.applyEffect(gameState);
            
            // (1 + 0.03)^3 = 1.092727
            expect(gameState.dt).toBeCloseTo(1.092727, 5);
        });

        test('Different generation particles should multiply dt multiplicatively', () => {
            const electron = new Electron();
            const muon = new Muon();
            const tau = new Tau();
            
            let gameState = { dt: 1 };
            gameState = electron.applyEffect(gameState);
            gameState = muon.applyEffect(gameState);
            gameState = tau.applyEffect(gameState);
            
            // (1 + 0.03) * (1 + 0.05) * (1 + 0.10) = 1.18965
            expect(gameState.dt).toBeCloseTo(1.18965, 5);
        });
    });

    describe('Generator Effects', () => {
        test('QuarkUp should multiply generator production', () => {
            const quarkUp = new QuarkUp();
            const gameState = { generator1Production: 100 };
            const newState = quarkUp.applyEffect(gameState);
            expect(newState.generator1Production).toBe(103);
        });

        test('Multiple QuarkUp should multiply generator production multiplicatively', () => {
            const quarkUp1 = new QuarkUp();
            const quarkUp2 = new QuarkUp();
            
            let gameState = { generator1Production: 100 };
            gameState = quarkUp1.applyEffect(gameState);
            gameState = quarkUp2.applyEffect(gameState);
            
            // 100 * (1 + 0.03)^2 = 106.09
            expect(gameState.generator1Production).toBeCloseTo(106.09, 2);
        });

        test('Different generation quarks should multiply generator production', () => {
            const quarkUp = new QuarkUp();
            const quarkCharm = new QuarkCharm();
            const quarkTruth = new QuarkTruth();
            
            let gameState = { generator1Production: 100 };
            gameState = quarkUp.applyEffect(gameState);
            gameState = quarkCharm.applyEffect(gameState);
            gameState = quarkTruth.applyEffect(gameState);
            
            // 100 * (1 + 0.03) * (1 + 0.05) * (1 + 0.10) = 118.965
            expect(gameState.generator1Production).toBeCloseTo(118.965, 3);
        });
    });

    describe('Cost Reduction Effects', () => {
        test('QuarkDown should reduce generator costs', () => {
            const quarkDown = new QuarkDown();
            const gameState = { generator2Cost: 100 };
            const newState = quarkDown.applyEffect(gameState);
            expect(newState.generator2Cost).toBe(97);
        });

        test('Multiple QuarkDown should multiply cost reduction', () => {
            const quarkDown1 = new QuarkDown();
            const quarkDown2 = new QuarkDown();
            
            let gameState = { generator2Cost: 100 };
            gameState = quarkDown1.applyEffect(gameState);
            gameState = quarkDown2.applyEffect(gameState);
            
            // 100 * (1 - 0.03)^2 = 94.09
            expect(gameState.generator2Cost).toBeCloseTo(94.09, 2);
        });
    });

    describe('Neutrino Effects', () => {
        test('NeutrinoE should add percentage of generators to n', () => {
            const neutrino = new NeutrinoE();
            const gameState = { n: 1, generators: { 2: 10 } };
            const newState = neutrino.applyEffect(gameState);
            // n + (generators[2] * 0.10) = 1 + (10 * 0.10) = 2
            expect(newState.n).toBe(2);
        });

        test('Multiple neutrinos should add their effects', () => {
            const neutrinoE = new NeutrinoE();
            const neutrinoMu = new NeutrinoMu();
            
            let gameState = { n: 1, generators: { 2: 10, 3: 20 } };
            gameState = neutrinoE.applyEffect(gameState);
            gameState = neutrinoMu.applyEffect(gameState);
            
            // 1 + (10 * 0.10) + (20 * 0.10) = 4
            expect(gameState.n).toBe(4);
        });
    });
}); 