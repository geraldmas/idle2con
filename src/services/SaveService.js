class SaveService {
  constructor() {
    this.SAVE_KEY = 'quantum_factory_save';
  }

  saveGame(gameState) {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(gameState));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  loadGame() {
    try {
      const savedState = localStorage.getItem(this.SAVE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la sauvegarde:', error);
      return false;
    }
  }
}

export default new SaveService(); 