import Generator from '../Generator';

describe('Generator', () => {
    let generators;
    let resources;

    beforeEach(() => {
        resources = { value: 0 };
        generators = {
            1: new Generator(1, { states: 1, generator: 0 }, { states: 1.2, generator: 0 }),
            2: new Generator(2, { states: 10, generator: 10 }, { states: 1.3, generator: 1.1 }),
            3: new Generator(3, { states: 10, generator: 10 }, { states: 1.4, generator: 1.2 }),
            4: new Generator(4, { states: 10, generator: 10 }, { states: 1.5, generator: 1.3 })
        };
    });

    test('Generator 1 initializes correctly', () => {
        const gen1 = generators[1];
        expect(gen1.rank).toBe(1);
        expect(gen1.baseCost).toEqual({ states: 1, generator: 0 });
        expect(gen1.growthRates).toEqual({ states: 1.2, generator: 0 });
        expect(gen1.count).toBe(0);
        expect(gen1.isUnlocked()).toBe(true);
        expect(gen1.unlockedFeatures.size).toBe(0);
    });

    test('Generator 2+ initializes correctly and is locked initially', () => {
        const gen2 = generators[2];
        expect(gen2.rank).toBe(2);
        expect(gen2.baseCost).toEqual({ states: 10, generator: 10 });
        expect(gen2.growthRates).toEqual({ states: 1.3, generator: 1.1 });
        expect(gen2.count).toBe(0);
        expect(gen2.isUnlocked()).toBe(false);
        expect(gen2.unlockedFeatures.size).toBe(0);
    });

    test('getCost calculates state cost correctly for each rank', () => {
        // Test Generator 1
        const gen1 = generators[1];
        expect(gen1.getCost()).toBe(1); // count = 0, cost = 1 * 1.2^0 = 1
        gen1.count = 1;
        expect(gen1.getCost()).toBe(Math.floor(1 * Math.pow(1.2, 1)));

        // Test Generator 2
        const gen2 = generators[2];
        expect(gen2.getCost()).toBe(10); // count = 0, cost = 10 * 1.3^0 = 10
        gen2.count = 1;
        expect(gen2.getCost()).toBe(Math.floor(10 * Math.pow(1.3, 1)));

        // Test Generator 3
        const gen3 = generators[3];
        expect(gen3.getCost()).toBe(10); // count = 0, cost = 10 * 1.4^0 = 10
        gen3.count = 1;
        expect(gen3.getCost()).toBe(Math.floor(10 * Math.pow(1.4, 1)));

        // Test Generator 4
        const gen4 = generators[4];
        expect(gen4.getCost()).toBe(10); // count = 0, cost = 10 * 1.5^0 = 10
        gen4.count = 1;
        expect(gen4.getCost()).toBe(Math.floor(10 * Math.pow(1.5, 1)));
    });

    test('getGeneratorCost calculates previous generator cost correctly for each rank', () => {
        // Test Generator 2
        const gen2 = generators[2];
        expect(gen2.getGeneratorCost()).toBe(10); // count = 0, cost = 10 * 1.1^0 = 10
        gen2.count = 1;
        expect(gen2.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.1, 1)));

        // Test Generator 3
        const gen3 = generators[3];
        expect(gen3.getGeneratorCost()).toBe(10); // count = 0, cost = 10 * 1.2^0 = 10
        gen3.count = 1;
        expect(gen3.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.2, 1)));

        // Test Generator 4
        const gen4 = generators[4];
        expect(gen4.getGeneratorCost()).toBe(10); // count = 0, cost = 10 * 1.3^0 = 10
        gen4.count = 1;
        expect(gen4.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.3, 1)));
    });

    test('canAfford checks state and previous generator costs for each rank', () => {
        // Test Generator 2
        const gen2 = generators[2];
        resources.value = 9;
        generators[1].count = 9;
        expect(gen2.canAfford(resources, generators)).toBe(false);

        resources.value = 10;
        expect(gen2.canAfford(resources, generators)).toBe(false);

        resources.value = 9;
        generators[1].count = 10;
        expect(gen2.canAfford(resources, generators)).toBe(false);

        resources.value = 10;
        generators[1].count = 10;
        expect(gen2.canAfford(resources, generators)).toBe(true);

        // Test Generator 3
        const gen3 = generators[3];
        resources.value = 10;
        generators[2].count = 9;
        expect(gen3.canAfford(resources, generators)).toBe(false);

        resources.value = 10;
        generators[2].count = 10;
        expect(gen3.canAfford(resources, generators)).toBe(true);

        // Test Generator 4
        const gen4 = generators[4];
        resources.value = 10;
        generators[3].count = 9;
        expect(gen4.canAfford(resources, generators)).toBe(false);

        resources.value = 10;
        generators[3].count = 10;
        expect(gen4.canAfford(resources, generators)).toBe(true);
    });

    test('purchase buys generator and deducts costs correctly for each rank', () => {
        // Test Generator 1
        const gen1 = generators[1];
        resources.value = 1;
        expect(gen1.purchase(resources, generators)).toBe(true);
        expect(gen1.count).toBe(1);
        expect(resources.value).toBe(0);

        // Test Generator 2
        const gen2 = generators[2];
        resources.value = 10;
        generators[1].count = 10;
        expect(gen2.purchase(resources, generators)).toBe(true);
        expect(gen2.count).toBe(1);
        expect(resources.value).toBe(0);
        expect(generators[1].count).toBe(0);

        // Test Generator 3
        const gen3 = generators[3];
        resources.value = 10;
        generators[2].count = 10;
        expect(gen3.purchase(resources, generators)).toBe(true);
        expect(gen3.count).toBe(1);
        expect(resources.value).toBe(0);
        expect(generators[2].count).toBe(0);

        // Test Generator 4
        const gen4 = generators[4];
        resources.value = 10;
        generators[3].count = 10;
        expect(gen4.purchase(resources, generators)).toBe(true);
        expect(gen4.count).toBe(1);
        expect(resources.value).toBe(0);
        expect(generators[3].count).toBe(0);
    });

    test('checkUnlockCondition works correctly for each rank', () => {
        // Test Generator 2
        const gen2 = generators[2];
        generators[1].count = 9;
        expect(gen2.checkUnlockCondition(generators)).toBe(false);
        generators[1].count = 10;
        expect(gen2.checkUnlockCondition(generators)).toBe(true);

        // Test Generator 3
        const gen3 = generators[3];
        generators[2].count = 9;
        expect(gen3.checkUnlockCondition(generators)).toBe(false);
        generators[2].count = 10;
        expect(gen3.checkUnlockCondition(generators)).toBe(true);

        // Test Generator 4
        const gen4 = generators[4];
        generators[3].count = 9;
        expect(gen4.checkUnlockCondition(generators)).toBe(false);
        generators[3].count = 10;
        expect(gen4.checkUnlockCondition(generators)).toBe(true);
    });

    test('checkFeatureUnlocks unlocks features at correct counts for each rank', () => {
        // Test Generator 2
        const gen2 = generators[2];
        gen2.count = 0;
        gen2.checkFeatureUnlocks();
        expect(gen2.hasFeature('observations')).toBe(false);
        gen2.count = 1;
        gen2.checkFeatureUnlocks();
        expect(gen2.hasFeature('observations')).toBe(true);

        // Test Generator 3
        const gen3 = generators[3];
        gen3.count = 0;
        gen3.checkFeatureUnlocks();
        expect(gen3.hasFeature('fusion')).toBe(false);
        expect(gen3.hasFeature('observations_gen2')).toBe(false);
        gen3.count = 1;
        gen3.checkFeatureUnlocks();
        expect(gen3.hasFeature('fusion')).toBe(true);
        expect(gen3.hasFeature('observations_gen2')).toBe(true);

        // Test Generator 4
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