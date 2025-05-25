import { Electron, NeutrinoE, QuarkUp, QuarkDown } from '../particles/Generation1Particles';

describe('Generation 1 Particles', () => {
    test('Electron should have correct properties and effect', () => {
        const electron = new Electron();
        expect(electron.name).toBe('Électron');
        expect(electron.generation).toBe(1);
        expect(electron.type).toBe('electron');
        expect(electron.effect.dtMultiplier).toBe(0.05); // Verify the dtMultiplier directly
        
        const gameState = { dt: 1.0 };
        const newState = electron.applyEffect(gameState);
        expect(newState.dt).toBe(1.05); // Test the applyEffect method
    });

    test('NeutrinoE should have correct properties', () => {
        const neutrinoE = new NeutrinoE();
        expect(neutrinoE.name).toBe('Neutrino électronique');
        expect(neutrinoE.generation).toBe(1);
        expect(neutrinoE.type).toBe('neutrinoE');
        // Add more specific effect tests if necessary
    });

    test('QuarkUp should have correct properties', () => {
        const quarkUp = new QuarkUp();
        expect(quarkUp.name).toBe('Quark Up');
        expect(quarkUp.generation).toBe(1);
        expect(quarkUp.type).toBe('quarkUp');
        // Add more specific effect tests if necessary
    });

    test('QuarkDown should have correct properties', () => {
        const quarkDown = new QuarkDown();
        expect(quarkDown.name).toBe('Quark Down');
        expect(quarkDown.generation).toBe(1);
        expect(quarkDown.type).toBe('quarkDown');
        // Add more specific effect tests if necessary
    });
});
