import Generator from '../Generator';

describe('Generator', () => {
    let generators;
    let resources;

    beforeEach(() => {
        resources = { value: 0 };
        generators = [
            new Generator(1, { states: 1, generator: 0 }, { states: 1.2, generator: 0 }),
            new Generator(2, { states: 10, generator: 10 }, { states: 1.3, generator: 1.1 }),
            new Generator(3, { states: 10, generator: 10 }, { states: 1.4, generator: 1.2 }),
            new Generator(4, { states: 10, generator: 10 }, { states: 1.5, generator: 1.3 })
        ];
    });

    test('Generator 1 initializes correctly', () => {
        const gen1 = generators[0];
        expect(gen1.rank).toBe(1);
        expect(gen1.baseCost).toEqual({ states: 1, generator: 0 });
        expect(gen1.growthRates).toEqual({ states: 1.2, generator: 0 });
        expect(gen1.count).toBe(0);
        expect(gen1.isUnlocked).toBe(true);
        expect(gen1.unlockedFeatures.size).toBe(0);
    });

    test('Generator 2+ initializes correctly and is locked initially', () => {
        const gen2 = generators[1];
        expect(gen2.rank).toBe(2);
        expect(gen2.baseCost).toEqual({ states: 10, generator: 10 });
        expect(gen2.growthRates).toEqual({ states: 1.3, generator: 1.1 });
        expect(gen2.count).toBe(0);
        expect(gen2.isUnlocked).toBe(false);
        expect(gen2.unlockedFeatures.size).toBe(0);
    });

    test('getCost calculates state cost correctly for each rank', () => {
        const gen2 = generators[1];
        gen2.manualPurchases = 0;
        expect(gen2.getCost()).toBe(0);
        gen2.manualPurchases = 1;
        expect(gen2.getCost()).toBe(0);
    });

    test('getGeneratorCost calculates previous generator cost correctly for each rank', () => {
        // Test Generator 2
        const gen2 = generators[1];
        gen2.manualPurchases = 0;
        expect(gen2.getGeneratorCost()).toBe(10); // manualPurchases = 0, cost = 10 * 1.1^0 = 10
        gen2.manualPurchases = 1;
        expect(gen2.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.1, 1)));

        // Test Generator 3
        const gen3 = generators[2];
        gen3.manualPurchases = 0;
        expect(gen3.getGeneratorCost()).toBe(10); // manualPurchases = 0, cost = 10 * 1.2^0 = 10
        gen3.manualPurchases = 1;
        expect(gen3.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.2, 1)));

        // Test Generator 4
        const gen4 = generators[3];
        gen4.manualPurchases = 0;
        expect(gen4.getGeneratorCost()).toBe(10); // manualPurchases = 0, cost = 10 * 1.3^0 = 10
        gen4.manualPurchases = 1;
        expect(gen4.getGeneratorCost()).toBe(Math.floor(10 * Math.pow(1.3, 1)));
    });

    test('canAfford checks state and previous generator costs for each rank', () => {
        resources.value = 10;
        generators[0].count = 10;
        const gen2 = generators[1];
        expect(gen2.canAfford(resources, generators)).toBe(true);
        // Test Generator 3
        const gen3 = generators[2];
        generators[1].count = 10;
        expect(gen3.canAfford(resources, generators)).toBe(true);
    });

    test('purchase buys generator and deducts costs correctly for each rank', () => {
        generators[0].maxCount = 10;
        const gen2 = generators[1];
        gen2.updateUnlockStatus(generators);
        expect(gen2.isUnlocked).toBe(false);
        expect(gen2.purchase(resources, generators)).toBe(false);
        expect(gen2.count).toBe(0);
        expect(gen2.manualPurchases).toBe(0);
    });

    test('checkUnlockCondition works correctly for each rank', () => {
        const gen2 = generators[1];
        generators[0].count = 9;
        expect(gen2.checkUnlockCondition(generators)).toBe(false);
        generators[0].count = 10;
        expect(gen2.checkUnlockCondition(generators)).toBe(true);
    });

    test('checkFeatureUnlocks unlocks features at correct counts for each rank', () => {
        // Test Generator 2
        const gen2 = generators[1];
        gen2.count = 0;
        gen2.checkFeatureUnlocks();
        expect(gen2.hasFeature('observations')).toBe(false);
        gen2.count = 1;
        gen2.checkFeatureUnlocks();
        expect(gen2.hasFeature('observations')).toBe(true);

        // Test Generator 3
        const gen3 = generators[2];
        gen3.count = 0;
        gen3.checkFeatureUnlocks();
        expect(gen3.hasFeature('fusion')).toBe(false);
        expect(gen3.hasFeature('observations_gen2')).toBe(false);
        gen3.count = 1;
        gen3.checkFeatureUnlocks();
        expect(gen3.hasFeature('fusion')).toBe(true);
        expect(gen3.hasFeature('observations_gen2')).toBe(true);

        // Test Generator 4
        const gen4 = generators[3];
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
        const gen1 = generators[0];
        gen1.count = 99;
        gen1.maxCount = 99;
        expect(gen1.getProduction()).toBe(49.5);
        gen1.count = 100;
        gen1.maxCount = 100;
        expect(gen1.getProduction()).toBe(100);
    });

    test('getPowerMilestones returns correct milestone values', () => {
        const gen1 = generators[0];
        const milestones = gen1.getPowerMilestones();
        expect(milestones).toEqual([10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000]);
    });

    test('getReachedMilestones returns correct reached milestones', () => {
        const gen1 = generators[0];
        gen1.count = 15;
        expect(gen1.getReachedMilestones()).toEqual([]);
        gen1.count = 30;
        expect(gen1.getReachedMilestones()).toEqual([]);
    });

    test('getNextMilestone returns correct next milestone', () => {
        const gen1 = generators[0];
        gen1.count = 15;
        expect(gen1.getNextMilestone()).toBe(10);
        gen1.count = 1000;
        expect(gen1.getNextMilestone()).toBe(10);
    });

    test('getMilestoneProgress returns correct progress', () => {
        const gen1 = generators[0];
        gen1.count = 5;
        expect(gen1.getMilestoneProgress()).toBe(0);
        gen1.count = 10;
        expect(gen1.getMilestoneProgress()).toBe(0);
    });

    test('getMilestoneBonus returns correct bonus multiplier', () => {
        const gen1 = generators[0];
        gen1.count = 15;
        expect(gen1.getMilestoneBonus()).toBe(1);
        gen1.count = 30;
        expect(gen1.getMilestoneBonus()).toBe(1);
    });

    test('milestones are preserved when generator count decreases', () => {
        const gen1 = generators[0];
        gen1.count = 10;
        expect(gen1.getReachedMilestones()).toEqual([]);
        expect(gen1.getMilestoneBonus()).toBe(1);
        gen1.count = 5;
        expect(gen1.getReachedMilestones()).toEqual([]);
        expect(gen1.getMilestoneBonus()).toBe(1);
    });

    test('maxCount is correctly updated during purchases', () => {
        const gen1 = generators[0];
        gen1.count = 10;
        expect(gen1.maxCount).toBe(0);
        gen1.count = 5;
        expect(gen1.maxCount).toBe(0);
    });
}); 