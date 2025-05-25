import { Muon, NeutrinoMu, QuarkCharm, QuarkStrange } from '../particles/Generation2Particles';

describe('Generation 2 Particles', () => {
    test('Muon should have correct effect', () => {
        const muon = new Muon();
        const gameState = { dt: 1 };
        const newState = muon.applyEffect(gameState);
        expect(newState.dt).toBe(1.05);
    });

    test('NeutrinoMu should have correct effect', () => {
        const neutrino = new NeutrinoMu();
        const gameState = { n: 1, generators: { 3: 10 } };
        const newState = neutrino.applyEffect(gameState);
        expect(newState.n).toBe(1 + 10 * 0.1);
    });

    test('QuarkCharm should have correct effect', () => {
        const charm = new QuarkCharm();
        const gameState = { generator1Production: 100 };
        const newState = charm.applyEffect(gameState);
        expect(newState.generator1Production).toBe(105);
    });

    test('QuarkStrange should have correct effect', () => {
        const strange = new QuarkStrange();
        const gameState = { generator3Cost: 1000 };
        const newState = strange.applyEffect(gameState);
        expect(newState.generator3Cost).toBe(950);
    });

    test('All particles should have generation 2', () => {
        const muon = new Muon();
        const neutrino = new NeutrinoMu();
        const charm = new QuarkCharm();
        const strange = new QuarkStrange();

        expect(muon.generation).toBe(2);
        expect(neutrino.generation).toBe(2);
        expect(charm.generation).toBe(2);
        expect(strange.generation).toBe(2);
    });
}); 