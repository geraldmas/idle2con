export default class Resource {
  constructor(name, initialValue = 0) {
    this.name = name;
    this.value = initialValue;
    this.potential = 0;
    this.states = new Map();
    this.generators = 0; // Nombre de générateurs de 1er rang
    this.baseProduction = 1/16; // a = 1/16 selon la spécification
  }

  // Met à jour la valeur selon la formule p(t+dt) = p(t) + n*a*dt
  update(dt) {
    const production = this.generators * this.baseProduction * dt;
    this.value += production;
  }

  // Ajoute un état qui affecte la ressource
  addState(state) {
    this.states.set(state.id, state);
    this.recalculatePotential();
  }

  // Supprime un état
  removeState(stateId) {
    this.states.delete(stateId);
    this.recalculatePotential();
  }

  // Recalcule le potentiel en fonction des états
  recalculatePotential() {
    let basePotential = 0;
    this.states.forEach(state => {
      basePotential += state.effect;
    });
    this.potential = basePotential;
  }

  // Modifie la valeur de la ressource
  modifyValue(amount) {
    this.value += amount;
    if (this.value < 0) this.value = 0;
  }

  // Modifie le nombre de générateurs
  setGenerators(count) {
    this.generators = count;
  }

  // Obtient la valeur actuelle
  getValue() {
    return this.value;
  }

  // Obtient le potentiel actuel
  getPotential() {
    return this.generators;
  }

  // Obtient le nombre de générateurs
  getGenerators() {
    return this.generators;
  }

  setValue(value) {
    this.value = value;
  }
} 