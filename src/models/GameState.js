import { reactive } from 'vue';

export default class GameState {
  constructor() {
    this.generators = reactive([]);
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
} 