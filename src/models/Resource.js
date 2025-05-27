export default class Resource {
  constructor(name, initialValue = 0) {
    this.name = name;
    this.value = initialValue;
    this.potential = 0;
    this.states = new Map();
    this.generators = 0; // Nombre de générateurs de 1er rang
    this.baseProduction = 1/32; // a = 1/32 selon la spécification (diminué)
    this.nextStateMilestone = this.name === 'États' ? 1 : null; // Prochain palier d'état, initialisé à 1 pour États
    this.totalEarned = this.name === 'États' ? initialValue : 0; // Total gagné pour cette ressource
  }

  // Met à jour la valeur selon la formule p(t+dt) = p(t) + n*a*dt
  // Prend maintenant en compte les effets des antiparticules
  update(dt, antiparticleEffects) {
    // The core logic for "Potentiel" production is handled in TickService.
    // The core logic for "États" accumulation (checkStateMilestone) and 
    // next milestone update (updateNextStateMilestone) is also handled in TickService
    // after Potentiel has been updated for the tick.
    // Therefore, this method might become empty or be removed in a later step if no other
    // resource type uses it. For now, it will be empty.
  }

  // Vérifie si un palier d'état est atteint et ajoute un état si c'est le cas
  // Prend maintenant en argument la valeur actuelle du potentiel
  checkStateMilestone(currentPotential) {
    if (this.name !== 'États' || this.nextStateMilestone === null) return;

    // Limiter le nombre d'états ajoutés par tick pour éviter les boucles infinies
    const maxStatesPerTick = 100;
    let statesAdded = 0;

    while (currentPotential >= this.nextStateMilestone && statesAdded < maxStatesPerTick) {
        this.value += 1;
        this.totalEarned += 1;
        statesAdded++;
    }
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

  // Modifie la valeur de la ressource
  modifyValue(amount) {
    this.value += amount;
    if (this.value < 0) this.value = 0;
  }

  // Modifie le nombre de générateurs
  setGenerators(count) {
    this.generators = count;
     // Mettre à jour le prochain palier d'état si la ressource est 'Potentiel'
    if (this.name === 'Potentiel') {
      this.updateNextStateMilestone(); // S'assure que le palier est mis à jour si le nombre de générateurs change
    }
  }

  // Calcule et met à jour le prochain palier d'état à atteindre pour l'affichage
  // Reçoit la valeur actuelle du potentiel et les effets des antiparticules en argument
  // S'assure que le prochain palier est basé sur totalEarned et les effets d'antiparticules
  updateNextStateMilestone(currentPotential, antiparticleEffects) {
    if (this.name !== 'États') return;

    const stateThresholdBase = antiparticleEffects?.stateThresholdBase || 10;
    
    // Calculer le prochain palier de manière plus sûre
    let nextMilestone = Math.pow(2, this.totalEarned / stateThresholdBase);
    
    // Si le potentiel actuel est déjà supérieur au palier calculé
    if (currentPotential >= nextMilestone) {
        // Calculer directement le prochain palier valide
        const nextTotalEarned = Math.ceil(Math.log2(currentPotential) * stateThresholdBase);
        nextMilestone = Math.pow(2, nextTotalEarned / stateThresholdBase);
    }
    
    this.nextStateMilestone = nextMilestone;
    
    // Gérer le cas initial
    if (this.totalEarned === 0) {
        this.nextStateMilestone = 1;
    }
  }

  // Obtient la valeur actuelle (nombre d'États possédés pour la ressource États)
  getValue() {
    return this.value;
  }

  // Obtient le potentiel actuel (basé sur le nombre de générateurs de rang 1)
   getPotential() {
    return this.generators;
  }

  // Obtient le nombre de générateurs
  getGenerators() {
    return this.generators;
  }

  // Obtient le taux de production par tick
  getProductionRate() {
      return this.generators * this.baseProduction;
  }

  setValue(value) {
    this.value = value;
  }
} 