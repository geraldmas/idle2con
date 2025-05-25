export default class Generator {
  constructor(name, baseCost, baseProduction, growthRate = 1.2) {
    this.name = name;
    this.baseCost = baseCost;
    this.baseProduction = baseProduction;
    this.growthRate = growthRate;
    this.count = 0;
    this.unlockRequirement = null;
  }

  setUnlockRequirement(requirement) {
    this.unlockRequirement = requirement;
  }

  isUnlocked(gameState) {
    if (!this.unlockRequirement) return true;
    return this.unlockRequirement.check(gameState);
  }

  getCost() {
    return this.baseCost * Math.pow(this.growthRate, this.count);
  }

  getProduction() {
    return this.baseProduction * this.count;
  }

  canAfford(resources) {
    return resources >= this.getCost();
  }

  buy(resources) {
    if (this.canAfford(resources)) {
      this.count++;
      return true;
    }
    return false;
  }

  getPowerMilestone(milestone) {
    return Math.floor(this.count / milestone) * milestone;
  }

  getMilestoneBonus(milestone) {
    const reachedMilestone = this.getPowerMilestone(milestone);
    return reachedMilestone > 0 ? Math.pow(2, reachedMilestone / milestone) : 1;
  }
} 