// src/__tests__/App.formula.test.js

// --- Mocking Dependencies ---
const mockTickService = {
  getDt: () => 1.0 // Default dt, can be overridden in tests
};

// Helper to create a simplified gameState for testing specific parts
const createMockGameState = (particles = [], antiparticleEffects = { generatorProductionMultiplier: 1 }) => ({
  particles: particles,
  antiparticleEffects: antiparticleEffects,
  // Add other gameState properties if needed by the functions being tested
});

// Helper to simulate gen1 object structure
const createMockGen1 = (count, milestoneBonus = 1) => ({
  rank: 1,
  count: count,
  getMilestoneBonus: () => milestoneBonus,
});

// Helper to create mock particle objects
const createMockParticle = (effects = {}) => ({
  getDtMultiplier: () => effects.dtMultiplier || 0,
  getGeneratorBonus: () => effects.generatorBonus || 0,
  getCostReduction: () => effects.costReduction || 0,
});

// --- Logic extracted or re-implemented from App.vue's setup for testing ---

// Re-implementation of dynamicFormulaText logic
const calculateDynamicFormulaText = (gen1, antiparticleEffects) => {
  let formula = `N × a`;
  if (gen1 && gen1.getMilestoneBonus() > 1) {
    formula += ` × BonusMS`;
  }
  if ((antiparticleEffects?.generatorProductionMultiplier || 1) > 1) {
    formula += ` × BonusAP`;
  }
  formula += ` × dt`; // dt is always part of the formula text display
  return formula;
};

// Re-implementation of actualCalculatedProduction logic
const calculateActualProduction = (gen1, antiparticleEffects, dt) => {
  if (!gen1) return 0;
  const baseProd = 1 / 32;
  const milestoneBonus = gen1.getMilestoneBonus();
  const antiparticleMultiplier = antiparticleEffects?.generatorProductionMultiplier || 1;
  const production = gen1.count * baseProd * milestoneBonus * antiparticleMultiplier * dt;
  // formatNumber is not tested here, only the raw calculation
  return production;
};

// Re-implementation of getTotalDtMultiplier logic
const calculateTotalDtMultiplier = (particles) => {
  return particles.reduce((total, particle) => {
    if (particle && typeof particle.getDtMultiplier === 'function') {
      return total * (1 + particle.getDtMultiplier());
    }
    return total;
  }, 1);
};

// Re-implementation of getTotalGeneratorBonus logic
const calculateTotalGeneratorBonus = (particles) => {
  return particles.reduce((total, particle) => {
    if (particle && typeof particle.getGeneratorBonus === 'function') {
      return total * (1 + particle.getGeneratorBonus());
    }
    return total;
  }, 1);
};

// Re-implementation of getTotalCostReduction logic
const calculateTotalCostReduction = (particles) => {
  return particles.reduce((total, particle) => {
    if (particle && typeof particle.getCostReduction === 'function') {
      return total * (1 - particle.getCostReduction());
    }
    return total;
  }, 1);
};

// --- Tests ---
describe('App.vue Formula and Effect Calculations', () => {
  describe('dynamicFormulaText', () => {
    it('should show base formula when no bonuses are active', () => {
      const gen1 = createMockGen1(10, 1); // Milestone bonus is 1
      const antiparticleEffects = { generatorProductionMultiplier: 1 };
      expect(calculateDynamicFormulaText(gen1, antiparticleEffects)).toBe('N × a × dt');
    });

    it('should include BonusMS when milestone bonus is active', () => {
      const gen1 = createMockGen1(10, 2); // Milestone bonus > 1
      const antiparticleEffects = { generatorProductionMultiplier: 1 };
      expect(calculateDynamicFormulaText(gen1, antiparticleEffects)).toBe('N × a × BonusMS × dt');
    });

    it('should include BonusAP when antiparticle multiplier is active', () => {
      const gen1 = createMockGen1(10, 1);
      const antiparticleEffects = { generatorProductionMultiplier: 1.5 }; // AP bonus > 1
      expect(calculateDynamicFormulaText(gen1, antiparticleEffects)).toBe('N × a × BonusAP × dt');
    });

    it('should include both BonusMS and BonusAP when both are active', () => {
      const gen1 = createMockGen1(10, 2);
      const antiparticleEffects = { generatorProductionMultiplier: 1.5 };
      expect(calculateDynamicFormulaText(gen1, antiparticleEffects)).toBe('N × a × BonusMS × BonusAP × dt');
    });

    it('should handle null gen1 gracefully', () => {
        const antiparticleEffects = { generatorProductionMultiplier: 1 };
        expect(calculateDynamicFormulaText(null, antiparticleEffects)).toBe('N × a × dt');
    });

    it('should handle null antiparticleEffects gracefully', () => {
        const gen1 = createMockGen1(10, 1);
        expect(calculateDynamicFormulaText(gen1, null)).toBe('N × a × dt');
    });
  });

  describe('actualCalculatedProduction', () => {
    const baseProd = 1 / 32;

    it('should calculate production correctly with no bonuses', () => {
      const gen1 = createMockGen1(10, 1); // count = 10, bonus = 1
      const antiparticleEffects = { generatorProductionMultiplier: 1 };
      const dt = 1;
      const expected = 10 * baseProd * 1 * 1 * dt;
      expect(calculateActualProduction(gen1, antiparticleEffects, dt)).toBeCloseTo(expected);
    });

    it('should calculate production with milestone bonus', () => {
      const gen1 = createMockGen1(10, 2); // bonus = 2
      const antiparticleEffects = { generatorProductionMultiplier: 1 };
      const dt = 1;
      const expected = 10 * baseProd * 2 * 1 * dt;
      expect(calculateActualProduction(gen1, antiparticleEffects, dt)).toBeCloseTo(expected);
    });

    it('should calculate production with antiparticle multiplier', () => {
      const gen1 = createMockGen1(10, 1);
      const antiparticleEffects = { generatorProductionMultiplier: 1.5 }; // AP mult = 1.5
      const dt = 1;
      const expected = 10 * baseProd * 1 * 1.5 * dt;
      expect(calculateActualProduction(gen1, antiparticleEffects, dt)).toBeCloseTo(expected);
    });

    it('should calculate production with both bonuses and different dt', () => {
      const gen1 = createMockGen1(20, 2.5); // count = 20, bonus = 2.5
      const antiparticleEffects = { generatorProductionMultiplier: 1.25 }; // AP mult = 1.25
      const dt = 0.5;
      const expected = 20 * baseProd * 2.5 * 1.25 * dt;
      expect(calculateActualProduction(gen1, antiparticleEffects, dt)).toBeCloseTo(expected);
    });

    it('should return 0 if gen1 is null', () => {
        const antiparticleEffects = { generatorProductionMultiplier: 1 };
        const dt = 1;
        expect(calculateActualProduction(null, antiparticleEffects, dt)).toBe(0);
    });
  });

  describe('getTotalDtMultiplier', () => {
    it('should return 1 if no particles', () => {
      expect(calculateTotalDtMultiplier([])).toBe(1);
    });

    it('should calculate correctly with one DT particle', () => {
      const particles = [createMockParticle({ dtMultiplier: 0.1 })]; // +10%
      expect(calculateTotalDtMultiplier(particles)).toBeCloseTo(1.1);
    });

    it('should calculate correctly with multiple DT particles', () => {
      const particles = [
        createMockParticle({ dtMultiplier: 0.1 }), // +10%
        createMockParticle({ dtMultiplier: 0.05 }) // +5%
      ];
      // (1 + 0.1) * (1 + 0.05) = 1.1 * 1.05 = 1.155
      expect(calculateTotalDtMultiplier(particles)).toBeCloseTo(1.155);
    });

    it('should ignore particles without DT effect', () => {
      const particles = [
        createMockParticle({ dtMultiplier: 0.1 }),
        createMockParticle({ generatorBonus: 0.2 })
      ];
      expect(calculateTotalDtMultiplier(particles)).toBeCloseTo(1.1);
    });
  });

  describe('getTotalGeneratorBonus', () => {
    it('should return 1 if no particles', () => {
      expect(calculateTotalGeneratorBonus([])).toBe(1);
    });

    it('should calculate correctly with one generator bonus particle', () => {
      const particles = [createMockParticle({ generatorBonus: 0.25 })]; // +25%
      expect(calculateTotalGeneratorBonus(particles)).toBeCloseTo(1.25);
    });

    it('should calculate correctly with multiple generator bonus particles', () => {
      const particles = [
        createMockParticle({ generatorBonus: 0.2 }),  // +20%
        createMockParticle({ generatorBonus: 0.1 })   // +10%
      ];
      // (1 + 0.2) * (1 + 0.1) = 1.2 * 1.1 = 1.32
      expect(calculateTotalGeneratorBonus(particles)).toBeCloseTo(1.32);
    });

    it('should ignore particles without generator bonus effect', () => {
      const particles = [
        createMockParticle({ generatorBonus: 0.2 }),
        createMockParticle({ dtMultiplier: 0.1 })
      ];
      expect(calculateTotalGeneratorBonus(particles)).toBeCloseTo(1.2);
    });
  });

  describe('getTotalCostReduction', () => {
    it('should return 1 if no particles', () => {
      expect(calculateTotalCostReduction([])).toBe(1);
    });

    it('should calculate correctly with one cost reduction particle', () => {
      const particles = [createMockParticle({ costReduction: 0.1 })]; // 10% reduction
      // Expected: 1 * (1 - 0.1) = 0.9
      expect(calculateTotalCostReduction(particles)).toBeCloseTo(0.9);
    });

    it('should calculate correctly with multiple cost reduction particles', () => {
      const particles = [
        createMockParticle({ costReduction: 0.1 }),  // 10%
        createMockParticle({ costReduction: 0.2 })   // 20%
      ];
      // Expected: 1 * (1 - 0.1) * (1 - 0.2) = 0.9 * 0.8 = 0.72
      expect(calculateTotalCostReduction(particles)).toBeCloseTo(0.72);
    });

    it('should ignore particles without cost reduction effect', () => {
      const particles = [
        createMockParticle({ costReduction: 0.1 }),
        createMockParticle({ generatorBonus: 0.2 })
      ];
      expect(calculateTotalCostReduction(particles)).toBeCloseTo(0.9);
    });

    it('should handle zero cost reduction correctly', () => {
        const particles = [createMockParticle({ costReduction: 0.0 })];
        expect(calculateTotalCostReduction(particles)).toBe(1);
    });
  });
});
