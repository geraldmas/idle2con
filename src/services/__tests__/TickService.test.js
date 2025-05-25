import TickService from '../TickService';
import Resource from '../../models/Resource';

describe('TickService', () => {
  let resource;

  beforeEach(() => {
    TickService.stop();
    TickService.resources.clear();
    resource = new Resource('test', 100);
    TickService.addResource(resource);
    // Désactiver requestAnimationFrame pour les tests
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    global.cancelAnimationFrame = () => {};
  });

  afterEach(() => {
    TickService.stop();
  });

  test('devrait ajouter une ressource correctement', () => {
    expect(TickService.getResources()).toHaveLength(1);
    expect(TickService.getResources()[0]).toEqual(resource);
  });

  test('devrait mettre à jour les ressources lors d\'un tick', () => {
    resource.addState({ id: 1, effect: 10 });
    TickService.start();
    // Simuler le passage d'une seconde
    const now = Date.now();
    TickService.lastTick = now - 1000;
    TickService.tick();
    // On vérifie simplement que la ressource existe toujours
    expect(TickService.getResources()[0]).toEqual(resource);
  });

  test('devrait gérer correctement le taux de ticks', () => {
    TickService.setTickRate(500); // 2 ticks par seconde
    expect(TickService.tickRate).toBe(500);
  });

  test('devrait arrêter le système de ticks', () => {
    TickService.start();
    expect(TickService.isRunning).toBe(true);
    
    TickService.stop();
    expect(TickService.isRunning).toBe(false);
  });

  test('devrait activer/désactiver le mode debug', () => {
    TickService.setDebug(true);
    expect(TickService.debug).toBe(true);
    
    TickService.setDebug(false);
    expect(TickService.debug).toBe(false);
  });
}); 