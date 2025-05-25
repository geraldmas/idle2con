import Generator from '../Generator';

describe('Generator', () => {
    let generators;
    let resources;

    beforeEach(() => {
        resources = { value: 0 };
        generators = [
            new Generator(1, { states: 1, generator: 0 }, { states: 1.05, generator: 0 }), 
            new Generator(2, { states: 10, generator: 10 }, { states: 1.1, generator: 1.1 }),
            new Generator(3, { states: 50, generator: 10 }, { states: 1.15, generator: 1.2 }), 
            new Generator(4, { states: 200, generator: 10 }, { states: 1.2, generator: 1.3 })
        ];
    });

    test('Generator 1 initializes correctly', () => {
        const gen1 = generators[0];
        expect(gen1.rank).toBe(1);
        expect(gen1.baseCost).toEqual({ states: 1, generator: 0 }); // Base cost passed to constructor
        expect(gen1.growthRates).toEqual({ states: 1.05, generator: 0 }); // Growth rates passed to constructor
        expect(gen1.count).toBe(0);
        expect(gen1.isUnlocked).toBe(true);
        expect(gen1.unlockedFeatures.size).toBe(0);
    });

    test('Generator 2+ initializes correctly and is locked initially', () => {
        const gen2 = generators[1];
        expect(gen2.rank).toBe(2);
        expect(gen2.baseCost).toEqual({ states: 10, generator: 10 }); // Base cost passed to constructor
        expect(gen2.growthRates).toEqual({ states: 1.1, generator: 1.1 }); // Growth rates passed to constructor
        expect(gen2.count).toBe(0);
        expect(gen2.isUnlocked).toBe(false);
        expect(gen2.unlockedFeatures.size).toBe(0);
    });

    test('getCost calculates state cost correctly for each rank and manualPurchases', () => {
        const mockGameState = { antiparticleEffects: { costDivider: 1 } };
        
        const gen1 = generators[0]; // Rank 1, Growth 1.05, Base 1 (from getCost internal logic)
        gen1.manualPurchases = 0;
        expect(gen1.getCost(mockGameState)).toBe(1); // 1 * 1.05^0
        gen1.manualPurchases = 1;
        expect(gen1.getCost(mockGameState)).toBe(Math.floor(1 * 1.05)); // floor(1.05) = 1
        gen1.manualPurchases = 2;
        expect(gen1.getCost(mockGameState)).toBe(Math.floor(1 * 1.05 * 1.05)); // floor(1.1025) = 1

        const gen2 = generators[1]; // Rank 2, Growth 1.1, Base 10 (from getCost internal logic)
        gen2.manualPurchases = 0;
        expect(gen2.getCost(mockGameState)).toBe(10); // 10 * 1.1^0
        gen2.manualPurchases = 1;
        expect(gen2.getCost(mockGameState)).toBe(Math.floor(10 * 1.1)); // floor(11) = 11
        gen2.manualPurchases = 2;
        expect(gen2.getCost(mockGameState)).toBe(Math.floor(10 * 1.1 * 1.1)); // floor(12.1) = 12

        const gen3 = generators[2]; // Rank 3, Growth 1.15, Base 50 (from getCost internal logic)
        gen3.manualPurchases = 0;
        expect(gen3.getCost(mockGameState)).toBe(50); // 50 * 1.15^0
        gen3.manualPurchases = 1;
        expect(gen3.getCost(mockGameState)).toBe(Math.floor(50 * 1.15)); // floor(57.5) = 57
        gen3.manualPurchases = 2;
        expect(gen3.getCost(mockGameState)).toBe(Math.floor(50 * 1.15 * 1.15)); // floor(66.125) = 66

        const gen4 = generators[3]; // Rank 4, Growth 1.2, Base 200 (from getCost internal logic)
        gen4.manualPurchases = 0;
        expect(gen4.getCost(mockGameState)).toBe(200); // 200 * 1.2^0
        gen4.manualPurchases = 1;
        expect(gen4.getCost(mockGameState)).toBe(Math.floor(200 * 1.2)); // floor(240) = 240
        gen4.manualPurchases = 2;
        expect(gen4.getCost(mockGameState)).toBe(Math.floor(200 * 1.2 * 1.2)); // floor(288) = 288
        
        // Test with costDivider
        const mockGameStateDivided = { antiparticleEffects: { costDivider: 2 } };
        gen2.manualPurchases = 1; // Cost is 11
        expect(gen2.getCost(mockGameStateDivided)).toBe(Math.floor(11 / 2)); // floor(5.5) = 5
    });

    test('getGeneratorCost calculates previous generator cost correctly', () => {
        const mockGameState = { antiparticleEffects: { costDivider: 1 } };
        const gen2 = generators[1]; // Growth 1.1, BaseCost.generator = 10
        gen2.manualPurchases = 0;
        expect(gen2.getGeneratorCost(mockGameState)).toBe(10);
        gen2.manualPurchases = 1;
        expect(gen2.getGeneratorCost(mockGameState)).toBe(Math.floor(10 * 1.1)); // 11

        // Test with costDivider
        const mockGameStateDivided = { antiparticleEffects: { costDivider: 2 } };
        expect(gen2.getGeneratorCost(mockGameStateDivided)).toBe(Math.floor(11 / 2)); // 5
    });

    test('canAfford checks state and previous generator costs', () => {
        const mockGameState = { antiparticleEffects: { costDivider: 1 } };
        resources.value = 100; // Sufficient states
        generators[0].count = 100; // Sufficient Gen1 for Gen2 cost
        
        const gen2 = generators[1]; // Cost: 10 states, 10 Gen1 (manualPurchases=0)
        gen2.manualPurchases = 0;
        expect(gen2.canAfford(resources, generators, mockGameState)).toBe(true);

        resources.value = 5; // Insufficient states
        expect(gen2.canAfford(resources, generators, mockGameState)).toBe(false);
        resources.value = 100; // Sufficient states

        generators[0].count = 5; // Insufficient Gen1
        expect(gen2.canAfford(resources, generators, mockGameState)).toBe(false);
    });

    test('purchase buys generator and deducts costs correctly', () => {
        const mockGameState = { antiparticleEffects: { costDivider: 1 } };
        const gen1 = generators[0];
        gen1.count = 10; // Gen1 has 10
        
        const gen2 = generators[1];
        gen2.isUnlocked = true; // Manually unlock for test
        gen2.manualPurchases = 0;

        resources.value = 20; // Enough states (cost 10)
        // Gen2 costs 10 Gen1
        
        expect(gen2.purchase(resources, generators, mockGameState)).toBe(true);
        expect(gen2.count).toBe(1);
        expect(gen2.manualPurchases).toBe(1);
        expect(resources.value).toBe(10); // 20 - 10 state cost
        expect(gen1.count).toBe(0); // 10 - 10 gen1 cost
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
        const mockGameState = { antiparticleEffects: { generatorProductionMultiplier: 1 } };
        const gen1 = generators[0];
        gen1.count = 99;
        gen1.maxCount = 99; // Milestones for 99 (10,30,90): bonus = 2^3 = 8
        // Expected: 99 * (1/32) * 8 = 24.75
        expect(gen1.getProduction(mockGameState)).toBeCloseTo(24.75);

        gen1.count = 100;
        gen1.maxCount = 100; // Milestones for 100 (10,30,90): bonus = 2^3 = 8
        // Expected: 100 * (1/32) * 8 = 25
        expect(gen1.getProduction(mockGameState)).toBeCloseTo(25);

        // Test with generatorProductionMultiplier
        const mockGameStateMultiplied = { antiparticleEffects: { generatorProductionMultiplier: 2 } };
        expect(gen1.getProduction(mockGameStateMultiplied)).toBeCloseTo(50);
    });

    test('getPowerMilestones returns correct milestone values', () => {
        const gen1 = generators[0];
        const milestones = gen1.getPowerMilestones();
        // Paliers : 10, 10*3=30, 30*3=90, 90*3=270, ...
        expect(milestones).toEqual([10, 30, 90, 270, 810, 2430, 7290, 21870, 65610, 196830]);
    });

    test('getReachedMilestones returns correct reached milestones', () => {
        const gen1 = generators[0];
        gen1.maxCount = 15; // maxCount used now
        expect(gen1.getReachedMilestones()).toEqual([10]);
        gen1.maxCount = 30;
        expect(gen1.getReachedMilestones()).toEqual([10, 30]);
    });

    test('getNextMilestone returns correct next milestone', () => {
        const gen1 = generators[0];
        gen1.maxCount = 15; // maxCount used now
        expect(gen1.getNextMilestone()).toBe(30);
        gen1.maxCount = 90;
        expect(gen1.getNextMilestone()).toBe(270);
    });

    test('getMilestoneProgress returns correct progress', () => {
        const gen1 = generators[0];
        gen1.maxCount = 5; // Use maxCount
        expect(gen1.getNextMilestone()).toBe(10);
        expect(gen1.getMilestoneProgress()).toBe(0.5); 
        gen1.maxCount = 10;
        expect(gen1.getNextMilestone()).toBe(30); // Next is 30 after 10
        expect(gen1.getMilestoneProgress()).toBeCloseTo(10/30); 
    });

    test('getMilestoneBonus returns correct bonus multiplier', () => {
        const gen1 = generators[0];
        gen1.maxCount = 15; // maxCount used now
        expect(gen1.getMilestoneBonus()).toBe(2); // Reached 10 (1 milestone) -> 2^1
        gen1.maxCount = 30;
        expect(gen1.getMilestoneBonus()).toBe(4); // Reached 10, 30 (2 milestones) -> 2^2
    });

    test('milestones are preserved when generator count decreases, based on maxCount', () => {
        const gen1 = generators[0];
        gen1.maxCount = 30; // Set maxCount
        gen1.count = 30;    // Current count
        expect(gen1.getReachedMilestones()).toEqual([10, 30]);
        expect(gen1.getMilestoneBonus()).toBe(4);
        
        gen1.count = 5; // Current count decreases, but maxCount remains 30
        expect(gen1.getReachedMilestones()).toEqual([10, 30]); // Still based on maxCount
        expect(gen1.getMilestoneBonus()).toBe(4);      // Still based on maxCount
    });

    test('maxCount is correctly updated when count increases', () => {
        const gen1 = generators[0];
        gen1.count = 5; // sets _count.value, and calls setter for count
        expect(gen1.maxCount).toBe(5); 
        gen1.count = 10;
        expect(gen1.maxCount).toBe(10);
        gen1.count = 7; // decrease count
        expect(gen1.maxCount).toBe(10); // maxCount should not decrease
    });
}); 