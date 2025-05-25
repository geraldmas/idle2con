export default class Resource {
  constructor(name, initialValue = 0) {
    this.name = name;
    this.value = initialValue;
    this.potential = 0;
    this.states = new Map();
    this.generators = 0; // Nombre de générateurs de 1er rang
    this.baseProduction = 1/16; // a = 1/16 selon la spécification
    this.nextStateMilestone = this.name === 'États' ? 1 : null; // Prochain palier d'état, initialisé à 1 pour États
    this.totalEarned = this.name === 'États' ? initialValue : 0; // Total gagné pour cette ressource
  }

  // Met à jour la valeur selon la formule p(t+dt) = p(t) + n*a*dt
  update(dt) {
    const production = this.generators * this.baseProduction * dt;
    this.value += production;

    // Mettre à jour le prochain palier d'état pour l'affichage si la ressource est 'États'
    // La logique de gain d'état est maintenant dans TickService, mais on met à jour l'affichage ici si nécessaire.
    // Cette méthode est maintenant appelée depuis TickService avec la valeur actuelle du potentiel.
    // if (this.name === 'États') {
    //   this.updateNextStateMilestone(); // Cette ligne n'est plus pertinente ici
    // }
  }

  // Vérifie si un palier d'état est atteint et ajoute un état si c'est le cas
  checkStateMilestone() {
    if (this.name !== 'États' || this.nextStateMilestone === null) return;

    // Utiliser la valeur du potentiel (this.value) pour vérifier les paliers
    while (this.value >= this.nextStateMilestone) {
      // Ajouter un état (incrémenter la valeur de la ressource États)
      // Note : Ici on ajoute 1 à la valeur des États, qui représente le nombre d'États possédés.
      // La méthode getValue() de la ressource États renvoie ce nombre.
      this.value += 1; 
      
      // Calculer le prochain palier
      this.updateNextStateMilestone(); // Mettre à jour le prochain palier pour l'affichage
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

  // Recalcule le potentiel en fonction des états
  recalculatePotential() {
    let basePotential = 0;
    this.states.forEach(state => {
      basePotential += state.effect;
    });
    this.potential = basePotential;

     // Mettre à jour le prochain palier d'état si la ressource est 'États'
    if (this.name === 'États') {
      this.updateNextStateMilestone();
    }
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
  // Reçoit la valeur actuelle du potentiel en argument
  updateNextStateMilestone(currentPotential) {
    // La logique des paliers d'état pour l'affichage est une exponentielle de base 1.2
    // Le prochain palier affiché est 1.2^(nombre d'États GAGNÉS au total + 1)
    if (this.name !== 'États') return;

    // Calculer le palier basé sur le nombre d'États GAGNÉS au total + 1 avec la base 1.2
    this.nextStateMilestone = Math.pow(1.2, this.totalEarned + 1);

    // Assurez-vous que le palier minimum est 1 si aucun état n'est possédé initialement.
    // Cette condition n'est peut-être pas nécessaire si initialValue est 0 pour États
    // et totalEarned commence à 0.
    // if (this.totalEarned === 0 && this.nextStateMilestone < 1) {
    //     this.nextStateMilestone = 1;
    // }

     // S'assurer que le palier affiché est toujours supérieur au potentiel actuel
     // pour éviter d'afficher un palier déjà dépassé. Ceci est fait dans TickService avant d'appeler cette méthode.
     // while (currentPotential >= this.nextStateMilestone && this.nextStateMilestone !== 0) {
     //     this.nextStateMilestone = Math.pow(1.2, this.totalEarned + 1); // Recalcul basé sur totalEarned
     //     // Petite mesure pour éviter boucle infinie (voir note TickService)
     //     const previousMilestone = this.nextStateMilestone;
     //     this.nextStateMilestone = Math.pow(1.2, this.totalEarned + 1);
     //     if (this.nextStateMilestone <= previousMilestone) {
     //         break;
     //     }
     // }
     
    // Note: La logique de gain réelle des états est dans TickService.
    // Cette méthode est principalement pour mettre à jour la valeur affichée de nextStateMilestone.
  }

  // Obtient la valeur actuelle
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