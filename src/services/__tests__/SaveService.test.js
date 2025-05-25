import SaveService from '../SaveService';

describe('SaveService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('devrait sauvegarder et charger correctement l\'état du jeu', () => {
    const gameState = { resources: 100, generators: [] };
    
    SaveService.saveGame(gameState);
    const loadedState = SaveService.loadGame();
    
    expect(loadedState).toEqual(gameState);
  });

  test('devrait retourner null si aucune sauvegarde n\'existe', () => {
    const loadedState = SaveService.loadGame();
    expect(loadedState).toBeNull();
  });

  test('devrait effacer la sauvegarde correctement', () => {
    const gameState = { resources: 100 };
    SaveService.saveGame(gameState);
    SaveService.clearSave();
    
    const loadedState = SaveService.loadGame();
    expect(loadedState).toBeNull();
  });
}); 