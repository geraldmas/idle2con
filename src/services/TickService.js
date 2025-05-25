import GameState from '../models/GameState';

class TickService {
  constructor() {
    this.resources = new Map();
    this.gameState = new GameState();
    this.isRunning = false;
    this.debug = false;
    this.lastTick = Date.now();
  }

  addResource(resource) {
    this.resources.set(resource.name, resource);
  }

  getResource(name) {
    return this.resources.get(name);
  }

  getResources() {
    return Array.from(this.resources.values());
  }

  addGenerator(generator) {
    this.gameState.addGenerator(generator);
  }

  getGameState() {
    return this.gameState;
  }

  setDebug(value) {
    this.debug = value;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTick = Date.now();
      this.tick();
    }
  }

  stop() {
    this.isRunning = false;
  }

  tick() {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTime = (now - this.lastTick) / 1000; // Convertir en secondes
    this.lastTick = now;

    // Mettre à jour le Potentiel
    const potentiel = this.getResource('Potentiel');
    if (potentiel) {
      const production = this.gameState.getTotalProduction();
      const currentValue = potentiel.getValue();
      potentiel.setValue(currentValue + production * deltaTime);

      // Vérifier les paliers de puissance pour les États
      const etats = this.getResource('États');
      if (etats) {
        const potentielValue = potentiel.getValue();
        const nextPowerOfTwo = Math.pow(2, Math.floor(Math.log2(potentielValue)) + 1);
        
        if (potentielValue >= nextPowerOfTwo) {
          const currentEtats = etats.getValue();
          etats.setValue(currentEtats + 1);
        }
      }
    }

    if (this.debug) {
      console.log('Tick:', {
        deltaTime,
        potentiel: potentiel?.getValue(),
        etats: this.getResource('États')?.getValue(),
        production: this.gameState.getTotalProduction()
      });
    }

    requestAnimationFrame(() => this.tick());
  }
}

export default new TickService(); 