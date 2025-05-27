import { ObservationService } from '../ObservationService';
import { ParticleStorage } from '../ParticleStorage';
import Resource from '../../models/Resource'; // Assuming Resource model path
// We don't instantiate a full GameState class, but rather mock the parts ObservationService interacts with.

// Mock dependencies
jest.mock('../ParticleStorage');
jest.mock('../../models/Resource');

// Mock particles that might be generated
jest.mock('../../models/particles/Generation1Particles', () => ({
  Electron: jest.fn().mockImplementation(() => ({ name: 'Electron', generation: 1, type: 'Lepton', effect: {} })),
  // Add other G1 particles if generateRandomParticle specifically uses them by name/type
}));
jest.mock('../../models/particles/AntiParticles', () => ({
  AntiElectron: jest.fn().mockImplementation(() => ({ name: 'AntiElectron', generation: -1, type: 'AntiLepton', effect: {} })),
}));


describe("ObservationService Points d'Observation", () => {
  let mockParticleStorage;
  let mockGameState;
  let pointsObservationResource;
  let observationService;

  beforeEach(() => {
    // Reset mocks
    ParticleStorage.mockClear();
    Resource.mockClear();

    mockParticleStorage = new ParticleStorage(); // Mocked instance

    // Setup mockGameState and Points d'Observation resource
    pointsObservationResource = {
      name: "Points d'Observation",
      value: 0,
      modifyValue: jest.fn(function(amount) { // Use function to allow `this` if Resource uses it
        this.value += amount;
      }),
      getValue: jest.fn(function() {
        return this.value;
      }),
      setValue: jest.fn(function(value) { // Added setValue for explicit reset in tests
        this.value = value;
      }),
    };

    mockGameState = {
      resources: new Map([
        ["Points d'Observation", pointsObservationResource],
      ]),
      // Add other gameState properties if ObservationService directly uses them
      // e.g., antipotential for antiparticle observation
      antipotential: 100, 
    };
    
    // Instantiate ObservationService with mocked dependencies
    // The constructor for ObservationService is `constructor(particleStorage, gameState)`
    observationService = new ObservationService(mockParticleStorage, mockGameState);

    // Spy on methods that determine control flow but are not the focus of these tests
    // and provide simple mock implementations.
    jest.spyOn(observationService, 'canObserveParticle').mockReturnValue(true);
    jest.spyOn(observationService, 'canObserveAntiparticle').mockReturnValue(true);
    jest.spyOn(observationService, 'getParticleObservationCost').mockReturnValue(10);
    // generateRandomParticle is called, ensure it returns a valid particle-like object
    jest.spyOn(observationService, 'generateRandomParticle').mockImplementation((rank, isAntiparticle) => {
      if (isAntiparticle) {
        return { name: 'MockAntiParticle', getDtMultiplier: () => 1.0 };
      }
      return { name: 'MockParticle', getDtMultiplier: () => 1.0 };
    });
    // Mock addParticle on storage if it's called and matters
    jest.spyOn(mockParticleStorage, 'addParticle').mockImplementation(() => {});
  });

  // Test Case 1 is about initializing the resource in GameState.
  // This is more of an integration detail handled in App.vue.
  // We'll focus on ObservationService's behavior given the resource exists.
  it('Test Case 1 (Conceptual): Points dObservation resource should be initialized in gameState', () => {
    // This test verifies part of the setup assumed by ObservationService.
    // In App.vue, this resource is added to gameState.resources.
    // Here, we just check if our mock setup reflects that.
    const resource = mockGameState.resources.get("Points d'Observation");
    expect(resource).toBeDefined();
    expect(resource.getValue()).toBe(0);
  });

  it('Test Case 2: Gaining Points dObservation for normal particle observation', () => {
    // Initial value should be 0
    expect(pointsObservationResource.getValue()).toBe(0);

    // Observe a normal particle
    // observe(gameState, prestigeService, isAntiparticle = false, generatorRank = null, generatorCount = null)
    // prestigeService is only used for antiparticles, can be null for normal ones
    observationService.observe(mockGameState, null, false, 1, 10); 
    
    expect(pointsObservationResource.modifyValue).toHaveBeenCalledWith(1);
    expect(pointsObservationResource.getValue()).toBe(1);

    // Observe another normal particle
    observationService.observe(mockGameState, null, false, 1, 10);
    expect(pointsObservationResource.modifyValue).toHaveBeenCalledTimes(2); // Called once more
    expect(pointsObservationResource.getValue()).toBe(2);
  });

  it('Test Case 3: No Points dObservation for antiparticle observation', () => {
    pointsObservationResource.setValue(0); // Reset value for this test
    expect(pointsObservationResource.getValue()).toBe(0);
    
    const mockPrestigeService = {
        getAntiparticleCost: jest.fn().mockReturnValue(1)
        // Add other methods if observe calls them for antiparticles
    };

    // Observe an antiparticle
    observationService.observe(mockGameState, mockPrestigeService, true);
    
    // modifyValue should not have been called for Points d'Observation
    expect(pointsObservationResource.modifyValue).not.toHaveBeenCalled();
    expect(pointsObservationResource.getValue()).toBe(0);
  });
});
