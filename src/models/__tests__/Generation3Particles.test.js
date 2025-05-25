import { Tau, NeutrinoTau, QuarkTruth, QuarkBeauty } from '../particles/Generation3Particles';

describe('Generation 3 Particles', () => {
    test('Tau should have correct effect', () => {
        const tau = new Tau();
        const gameState = { dt: 1 };
        const newState = tau.applyEffect(gameState);
        expect(newState.dt).toBe(1.75);
    });

    test('NeutrinoTau should have correct effect', () => {
        const neutrino = new NeutrinoTau();
        const gameState = { n: 1, generators: { 4: 10 } };
        const newState = neutrino.applyEffect(gameState);
        expect(newState.n).toBe(1 + 10 * 0.1);
    });

    test('QuarkTruth should have correct effect', () => {
        const truth = new QuarkTruth();
        const gameState = { generator1Production: 100 };
        const newState = truth.applyEffect(gameState);
        expect(newState.generator1Production).toBeCloseTo(110, 5);
    });

    test('QuarkBeauty should have correct effect', () => {
        const beauty = new QuarkBeauty();
        const gameState = { generator4Cost: 1000 };
        const newState = beauty.applyEffect(gameState);
        expect(newState.generator4Cost).toBe(900);
    });

    test('All particles should have generation 3', () => {
        const tau = new Tau();
        const neutrino = new NeutrinoTau();
        const truth = new QuarkTruth();
        const beauty = new QuarkBeauty();

        expect(tau.generation).toBe(3);
        expect(neutrino.generation).toBe(3);
        expect(truth.generation).toBe(3);
        expect(beauty.generation).toBe(3);
    });
}); 