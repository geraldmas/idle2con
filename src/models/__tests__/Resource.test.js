import Resource from '../Resource';

describe('Resource', () => {
  let resource;

  beforeEach(() => {
    resource = new Resource('test', 100);
  });

  test('devrait initialiser correctement une ressource', () => {
    expect(resource.name).toBe('test');
    expect(resource.getValue()).toBe(100);
    expect(resource.getPotential()).toBe(0);
  });

  test('devrait mettre à jour la valeur selon le potentiel', () => {
    resource.addState({ id: 1, effect: 10 });
    resource.update(1); // 1 seconde
    expect(resource.getValue()).toBe(110);
  });

  test('devrait gérer correctement les états', () => {
    const state1 = { id: 1, effect: 5 };
    const state2 = { id: 2, effect: 3 };

    resource.addState(state1);
    expect(resource.getPotential()).toBe(5);

    resource.addState(state2);
    expect(resource.getPotential()).toBe(8);

    resource.removeState(1);
    expect(resource.getPotential()).toBe(3);
  });

  test('devrait empêcher les valeurs négatives', () => {
    resource.modifyValue(-150);
    expect(resource.getValue()).toBe(0);
  });
}); 