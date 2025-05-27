import TickService from '../TickService';
import { Electron } from '../../models/particles/Generation1Particles';
import { Muon } from '../../models/particles/Generation2Particles';
import Resource from '../../models/Resource'; // Assuming Resource model path
import Generator from '../../models/Generator'; // Assuming Generator model path
import { ParticleStorage } from '../ParticleStorage'; // Assuming ParticleStorage path

// Mock dependencies
jest.mock('../../models/Resource');
jest.mock('../../models/Generator');
jest.mock('../ParticleStorage');

describe('TickService dt Effects on Potential Calculation', () => {
  let mockGameState;
  let mockPotentialResource;
  let mockGen1Generator;
  let mockParticleStorageInstance;

  beforeEach(() => {
    // Reset mocks for each test
    Resource.mockClear();
    Generator.mockClear();
    ParticleStorage.mockClear();

    mockPotentialResource = {
      name: 'Potentiel',
      value: 0,
      setGenerators: jest.fn(),
      getValue: jest.fn(() => mockPotentialResource.value), // Ensure getValue reflects current value
      // Add other methods if TickService calls them on Potentiel
    };

    mockGen1Generator = {
      rank: 1,
      count: 1, // Start with 1 generator for simplicity
      getMilestoneBonus: jest.fn().mockReturnValue(1), // Default no bonus
      // Add other methods if TickService calls them
    };

    mockParticleStorageInstance = {
      getParticles: jest.fn().mockReturnValue([]),
    };

    mockGameState = {
      resources: new Map([
        ['Potentiel', mockPotentialResource],
      ]),
      generators: [mockGen1Generator],
      particleStorageInstance: mockParticleStorageInstance,
      antiparticleEffects: {}, // Default no antiparticle effects
    };

    TickService.setGameState(mockGameState);
    TickService.dt = 0.1; // Set a predictable dt for tests
    TickService.isRunning = true; // Ensure tick runs
    TickService.debug = false; // Disable debug logs
  });

  // Helper to calculate expected potential based on parameters
  const calculateExpectedPotential = (genCount, baseDt, particleMultiplier, dtExponent, milestoneBonus = 1, antiparticleProdMultiplier = 1) => {
    const baseProduction = 1 / 32;
    const effectiveDt = Math.pow(baseDt * particleMultiplier, dtExponent);
    return Number((genCount * baseProduction * milestoneBonus * antiparticleProdMultiplier * effectiveDt).toFixed(10));
  };

  it('Test Case 1: No dt-affecting particles', () => {
    mockParticleStorageInstance.getParticles.mockReturnValue([]);
    const initialPotential = mockPotentialResource.value;
    
    TickService.tick();

    const expectedProduction = calculateExpectedPotential(
      mockGen1Generator.count,
      0.1, // TickService.dt
      1.0, // No particle multiplier
      1.0  // No dtExponent
    );
    expect(mockPotentialResource.value).toBe(initialPotential + expectedProduction);
  });

  it('Test Case 2: One Electron active', () => {
    const electron = new Electron(); // dtMultiplier: 1.05
    mockParticleStorageInstance.getParticles.mockReturnValue([electron]);
    const initialPotential = mockPotentialResource.value;

    TickService.tick();

    const expectedProduction = calculateExpectedPotential(
      mockGen1Generator.count,
      0.1,    // TickService.dt
      1.05,   // Electron multiplier
      1.0     // No dtExponent
    );
    expect(mockPotentialResource.value).toBe(initialPotential + expectedProduction);
  });

  it('Test Case 3: Electron and Muon active', () => {
    const electron = new Electron(); // dtMultiplier: 1.05
    const muon = new Muon();       // dtMultiplier: 1.20
    mockParticleStorageInstance.getParticles.mockReturnValue([electron, muon]);
    const initialPotential = mockPotentialResource.value;

    TickService.tick();

    const expectedProduction = calculateExpectedPotential(
      mockGen1Generator.count,
      0.1,          // TickService.dt
      1.05 * 1.20,  // Combined particle multiplier
      1.0           // No dtExponent
    );
    expect(mockPotentialResource.value).toBe(initialPotential + expectedProduction);
  });

  it('Test Case 4: Electron, Muon, and dtExponent from antiparticles', () => {
    mockGameState.antiparticleEffects = { dtExponent: 1.5 };
    TickService.setGameState(mockGameState); // Re-set gameState if modified after initial set

    const electron = new Electron(); // dtMultiplier: 1.05
    const muon = new Muon();       // dtMultiplier: 1.20
    mockParticleStorageInstance.getParticles.mockReturnValue([electron, muon]);
    const initialPotential = mockPotentialResource.value;

    TickService.tick();
    
    const expectedProduction = calculateExpectedPotential(
      mockGen1Generator.count,
      0.1,          // TickService.dt
      1.05 * 1.20,  // Combined particle multiplier
      1.5           // dtExponent from antiparticles
    );
    // Need to be careful with floating point comparisons
    expect(mockPotentialResource.value).toBeCloseTo(initialPotential + expectedProduction);
  });
});
