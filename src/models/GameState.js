export default class GameState {
  constructor() {
    this.generators = [];
  }

  addGenerator(generator) {
    this.generators.push(generator);
  }

  getGeneratorCount(index) {
    return this.generators[index]?.count || 0;
  }

  getTotalProduction() {
    return this.generators.reduce((total, gen) => total + gen.getProduction(), 0);
  }
} 