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
    // La logique des paliers d'état pour l'affichage est basée sur 2^(totalEarned / 10)
    if (this.name !== 'États') return;

    // Calculer le palier basé sur le nombre d'États GAGNÉS au total avec la base 2^(1/10)
    this.nextStateMilestone = Math.pow(2, this.totalEarned / 10);

     // S'assurer que le palier affiché est toujours supérieur au potentiel actuel
     // pour éviter d'afficher un palier déjà dépassé.
     // On ne veut pas que le palier affiché soit inférieur au potentiel actuel.
     // S'il l'est, on calcule le palier pour le prochain état à gagner (totalEarned + 1)
     while (currentPotential >= this.nextStateMilestone && this.nextStateMilestone !== 0) {
          this.nextStateMilestone = Math.pow(2, (this.totalEarned + 1) / 10);
          // Petite mesure pour éviter boucle infinie si le potentiel est très élevé d'un coup
          if (this.nextStateMilestone <= currentPotential && this.totalEarned < 1000) { // Ajout d'une limite raisonnable
              this.totalEarned += 1; // Avancer le totalEarned pour trouver un palier supérieur
          } else {
              break; // Le palier calculé est supérieur au potentiel ou on a atteint la limite
          }
     }

    // Gérer le cas initial où totalEarned est 0, le premier palier est Math.pow(2, 0/10) = 1.
    // Mais le premier état est gagné à 1 potentiel, donc le prochain palier affiché devrait être Math.pow(2, 1/10) après avoir gagné le premier état.
    // Initialement, avant de gagner le premier état (totalEarned = 0), le prochain palier affiché devrait être 1 (pour indiquer qu'il faut 1 potentiel pour le 1er état).
    if (this.totalEarned === 0) {
        this.nextStateMilestone = 1;
    }

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