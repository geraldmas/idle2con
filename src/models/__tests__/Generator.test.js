import Generator from '../Generator';

describe('Generator', () => {
    let generators; // Utiliser un objet pour stocker les générateurs par rang
    let resources;

    beforeEach(() => {
        // Initialiser les générateurs avec leurs coûts et croissances selon la spécification
        generators = {
            1: new Generator(1, { generator: 0, states: 1 }, { generator: 1, states: 1.2 }),
            2: new Generator(2, { generator: 10, states: 10 }, { generator: 1.1, states: 1.3 }),
            3: new Generator(3, { generator: 10, states: 50 }, { generator: 1.2, states: 1.4 }),
            4: new Generator(4, { generator: 10, states: 200 }, { generator: 1.3, states: 1.5 }),
        };
        resources = { states: 0 }; // Initialiser les états à 0 pour les tests
    });

    test('Generator 1 initializes correctly', () => {
        const gen1 = generators[1];
        expect(gen1.rank).toBe(1);
        expect(gen1.baseCost).toEqual({ generator: 0, states: 1 });
        expect(gen1.growthRates).toEqual({ generator: 1, states: 1.2 });
        expect(gen1.count).toBe(0);
        expect(gen1.isUnlocked()).toBe(true);
        expect(gen1.unlockedFeatures.size).toBe(0);
    });

    test('Generator 2+ initializes correctly and is locked initially', () => {
        const gen2 = generators[2];
        expect(gen2.rank).toBe(2);
        expect(gen2.baseCost).toEqual({ generator: 10, states: 10 });
        expect(gen2.growthRates).toEqual({ generator: 1.1, states: 1.3 });
        expect(gen2.count).toBe(0);
        expect(gen2.isUnlocked()).toBe(false);
        expect(gen2.unlockedFeatures.size).toBe(0);
    });

    test('getCost calculates state cost correctly', () => {
        const gen1 = generators[1];
        expect(gen1.getCost()).toBe(1); // count = 0, cost = 1 * 1.2^0 = 1
        gen1.count = 1;
        expect(gen1.getCost()).toBe(Math.floor(1 * Math.pow(1.2, 1)));
        gen1.count = 5;
        expect(gen1.getCost()).toBe(Math.floor(1 * Math.pow(1.2, 5)));
    });

    test('getGeneratorCost calculates previous generator cost correctly', () => {
        const gen2 = generators[2];
        expect(gen2.getGeneratorCost()).toBe(10); // count = 0, cost = 10 * 1.1^0 = 10
        gen2.count = 1;
        expect(gen2.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.1, 1)));
        gen2.count = 5;
        expect(gen2.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.1, 5)));
    });

    test('canAfford checks state and previous generator costs', () => {
        const gen2 = generators[2];
        resources.states = 9;
        generators[1].count = 9;
        expect(gen2.canAfford(resources, generators)).toBe(false); // Not enough states and not enough previous generators

        resources.states = 10;
        expect(gen2.canAfford(resources, generators)).toBe(false); // Enough states but not enough previous generators

        resources.states = 9;
        generators[1].count = 10;
        expect(gen2.canAfford(resources, generators)).toBe(false); // Enough previous generators but not enough states

        resources.states = 10;
        generators[1].count = 10;
        expect(gen2.canAfford(resources, generators)).toBe(true); // Enough of both
    });

    test('purchase buys generator and deducts costs', () => {
        const gen1 = generators[1];
        resources.states = 1;
        
        expect(gen1.purchase(resources, generators)).toBe(true);
        expect(gen1.count).toBe(1);
        expect(resources.states).toBe(0);

        // Test purchase of Gen 2
        const gen2 = generators[2];
        resources.states = 10; // Base cost for states
        generators[1].count = 10; // Base cost for previous generators

        expect(gen2.purchase(resources, generators)).toBe(true);
        expect(gen2.count).toBe(1);
        expect(resources.states).toBe(0); // 10 states deducted
        expect(generators[1].count).toBe(0); // 10 gen 1 deducted
    });

    test('purchase does not buy if not affordable', () => {
        const gen1 = generators[1];
        resources.states = 0;
        
        expect(gen1.purchase(resources, generators)).toBe(false);
        expect(gen1.count).toBe(0);
        expect(resources.states).toBe(0);
    });

    test('checkUnlockCondition works correctly', () => {
        const gen2 = generators[2];
        generators[1].count = 9;
        expect(gen2.checkUnlockCondition(generators)).toBe(false);
        generators[1].count = 10;
        expect(gen2.checkUnlockCondition(generators)).toBe(true);
    });

    test('updateUnlockStatus works correctly', () => {
        const gen2 = generators[2];
        generators[1].count = 9;
        gen2.updateUnlockStatus(generators);
        expect(gen2.isUnlocked()).toBe(false);
        generators[1].count = 10;
        gen2.updateUnlockStatus(generators);
        expect(gen2.isUnlocked()).toBe(true);
    });

    test('checkFeatureUnlocks unlocks features at correct counts', () => {
        const gen2 = generators[2];
        gen2.count = 0;
        gen2.checkFeatureUnlocks();
        expect(gen2.hasFeature('observations')).toBe(false);
        gen2.count = 1;
        gen2.checkFeatureUnlocks();
        expect(gen2.hasFeature('observations')).toBe(true);

        const gen3 = generators[3];
        gen3.count = 0;
        gen3.checkFeatureUnlocks();
        expect(gen3.hasFeature('fusion')).toBe(false);
        expect(gen3.hasFeature('observations_gen2')).toBe(false);
        gen3.count = 1;
        gen3.checkFeatureUnlocks();
        expect(gen3.hasFeature('fusion')).toBe(true);
        expect(gen3.hasFeature('observations_gen2')).toBe(true);

        const gen4 = generators[4];
        gen4.count = 0;
        gen4.checkFeatureUnlocks();
        expect(gen4.hasFeature('improvements')).toBe(false);
        expect(gen4.hasFeature('observations_gen3')).toBe(false);
        gen4.count = 1;
        gen4.checkFeatureUnlocks();
        expect(gen4.hasFeature('improvements')).toBe(true);
        expect(gen4.hasFeature('observations_gen3')).toBe(true);
    });

    test('getProduction calculates production with milestone bonuses', () => {
        const gen1 = generators[1]; // Base production 1/16

        gen1.count = 0;
        expect(gen1.getProduction()).toBe(0);

        gen1.count = 1;
        expect(gen1.getProduction()).toBe(1/16);

        gen1.count = 10; // First milestone
        expect(gen1.getProduction()).toBe((10 * 1/16) * 2); // 10 * base * 2

        gen1.count = 25; // Second milestone
        expect(gen1.getProduction()).toBe((25 * 1/16) * 4); // 25 * base * 4 (bonus * 2 pour chaque palier)

        gen1.count = 50; // Third milestone
        expect(gen1.getProduction()).toBe((50 * 1/16) * 8); // 50 * base * 8

        gen1.count = 100; // Fourth milestone
        expect(gen1.getProduction()).toBe((100 * 1/16) * 16); // 100 * base * 16

        gen1.count = 200; // Fifth milestone (first of the +100 series)
        expect(gen1.getProduction()).toBe((200 * 1/16) * 32); // 200 * base * 32

        gen1.count = 1000; // Last milestone in the range
        expect(gen1.getProduction()).toBe((1000 * 1/16) * Math.pow(2, 10)); // 1000 * base * 2^10
    });
}); 