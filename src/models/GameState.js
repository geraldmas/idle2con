import { reactive } from 'vue';

export default class GameState {
  constructor() {
    this.generators = reactive([]);
    this.resources = reactive(new Map());
  }

  addGenerator(generator) {
    this.generators.push(reactive(generator));
  }

  getGenerator(rank) {
    return this.generators.find(gen => gen.rank === rank);
  }

  getGeneratorCount(index) {
    return this.generators[index]?.count || 0;
  }

  getTotalProduction() {
    return this.generators.reduce((total, gen) => total + gen.getProduction(), 0);
  }

  reset() {
    // Réinitialiser les générateurs
    this.generators.forEach(gen => {
      gen.count = 0;
    });

    // Réinitialiser les ressources
    this.resources.forEach(resource => {
      resource.value = 0;
      resource.totalEarned = 0;
      if (resource.name === 'États') {
        resource.nextStateMilestone = 1;
      }
    });
  }
} 