// script.js

/**
 * @file script.js - Main JavaScript file for the incremental game.
 * Handles game logic, data management, UI updates, and player interactions.
 */

/**
 * @typedef {Object} Generator
 * @property {number} id - Unique identifier for the generator.
 * @property {string} name - Display name of the generator.
 * @property {number} tier - Tier of the generator, affecting its position and unlock conditions.
 * @property {Decimal} count - Number of this generator owned by the player.
 * @property {Decimal} productionPerSecond - Amount of resource or other generator produced per second by one unit.
 * @property {string} [producesResource] - Special keyword ("baseCurrency") if it produces the base game currency.
 * @property {number} [producesGeneratorId] - ID of another generator this generator produces.
 * @property {Decimal} baseCost - Initial cost of the first generator.
 * @property {Decimal} currentCost - Current cost to buy one unit of this generator.
 * @property {Decimal} costMultiplier - Factor by which the cost increases after each purchase.
 * @property {boolean} isUnlocked - Whether the player can see and buy this generator.
 * @property {string} [resourceCostName] - Name of the resource used to buy this generator (e.g., "JuLs").
 */

/**
 * @global
 * @type {Object} gameData
 * @description Main object storing the entire game state.
 * @property {Decimal} baseCurrency - The primary currency of the game (e.g., "JuLs").
 * @property {string} baseCurrencyName - The display name for the base currency.
 * @property {Array<Generator>} generators - Array of generator objects, each defining a way to produce resources or other generators.
 * @property {number} lastUpdate - Timestamp of the last game loop execution, used for calculating offline progress and time deltas.
 * @property {boolean} debugFreePurchases - Flag to enable/disable free purchases for debugging.
 * @property {number|string} currentBuyMultiplier - The currently selected multiplier for purchases (1, 10, 100, or 'MAX').
 * @property {Array<number|string>} buyMultiplierOptions - Available options for the buy multiplier.
 */
let gameData = {
    baseCurrency: new Decimal(20), // This will be our "JuLs"
    baseCurrencyName: "JuLs", // Renamed from "Objects"
    generators: [
        {
            id: 1,
            name: "JuL Harvester", // Renamed from "Object Generator"
            tier: 1, // This is the first generator the player interacts with to produce the base currency
            count: new Decimal(0), // How many the player owns
            productionPerSecond: new Decimal(1), // Produces 1 JuL per second per generator
            producesResource: "baseCurrency", // Special keyword for the base currency
            baseCost: new Decimal(10),
            currentCost: new Decimal(10),
            costMultiplier: new Decimal(1.15), // Each purchase increases cost by 15%
            isUnlocked: true // Unlocked by default
        },
        {
            id: 2,
            name: "Collector Booster", // Renamed from "Morphism Generator"
            tier: 2, // This generator produces the generator of tier 1
            count: new Decimal(0),
            productionPerSecond: new Decimal(1), // Produces 1 JuL Harvester per second per generator
            producesGeneratorId: 1, // ID of the generator it produces (JuL Harvester)
            resourceCostName: "JuLs", // What it costs to buy this generator
            baseCost: new Decimal(100), // Cost in "JuLs"
            currentCost: new Decimal(100),
            costMultiplier: new Decimal(1.20),
            isUnlocked: false, // Will be unlocked later
            unlockRequirements: [
                { type: "generatorCount", generatorId: 1, neededCount: new Decimal(5) }
            ]
        },
        {
            id: 3,
            name: "Efficiency Upgrade", // Renamed from "2-Morphism Generator"
            tier: 3,
            count: new Decimal(0),
            productionPerSecond: new Decimal(1),
            producesGeneratorId: 2, // Produces Collector Boosters
            resourceCostName: "JuLs", // Costs Base Currency
            baseCost: new Decimal(1e9), // 1 Billion JuLs
            currentCost: new Decimal(1e9),
            costMultiplier: new Decimal(1.25),
            isUnlocked: false,
            unlockRequirements: [
                { type: "generatorCount", generatorId: 2, neededCount: new Decimal(25) }
            ]
        },
        {
            id: 4,
            name: "Hyperspace Funnel", // Renamed from "Functor Generator"
            tier: 4,
            count: new Decimal(0),
            productionPerSecond: new Decimal(1),
            producesGeneratorId: 3, // Produces Efficiency Upgrades
            resourceCostName: "JuLs", // Costs Base Currency
            baseCost: new Decimal("1e15"), // 1 Quadrillion JuLs
            currentCost: new Decimal("1e15"),
            costMultiplier: new Decimal(1.30),
            isUnlocked: false,
            unlockRequirements: [
                { type: "generatorCount", generatorId: 3, neededCount: new Decimal(25) }
            ]
        }
        // Future generator tiers can be added here
    ],
    lastUpdate: Date.now(),
    debugFreePurchases: false,
    currentBuyMultiplier: 1,
    buyMultiplierOptions: [1, 10, 100, 'MAX'],
};

console.log("Game data initialized:", gameData);

/**
 * Retrieves a generator object from the gameData.generators array by its ID.
 * @param {number} id - The ID of the generator to retrieve.
 * @returns {Generator|undefined} The generator object if found, otherwise undefined.
 * @example
 * const harvester = getGeneratorById(1);
 * if (harvester) {
 *   console.log(harvester.name); // "JuL Harvester"
 * }
 */
function getGeneratorById(id) {
    return gameData.generators.find(gen => gen.id === id);
}

/**
 * Updates the game state based on production from all active generators.
 * Calculates the time elapsed since the last update and iterates through generators
 * to add their production to the respective resources or lower-tier generators.
 * This function is a core part of the game loop.
 */
function updateProduction() {
    const currentUpdateTime = Date.now();
    const timeDelta = new Decimal((currentUpdateTime - gameData.lastUpdate) / 1000); // Time delta in seconds
    // console.log(`updateProduction: timeDelta = ${timeDelta.toFixed(3)}s (lastUpdate: ${gameData.lastUpdate}, currentUpdateTime: ${currentUpdateTime})`);
    if (timeDelta.isNegative()) {
        console.warn(`updateProduction: Negative timeDelta (${timeDelta.toFixed(3)}s). This might indicate an issue with system time or lastUpdate resetting. Clamping to 0.`);
        timeDelta = new Decimal(0); // Option: clamp negative delta to prevent de-production
    }

    for (let i = gameData.generators.length - 1; i >= 0; i--) {
        const generator = gameData.generators[i];
        if (generator.count.gt(0)) {
            // console.log(`updateProduction: Processing ${generator.name} (Tier ${generator.tier}) - Count: ${formatNumber(generator.count)}, Prod/sec: ${formatNumber(generator.productionPerSecond)}`);
            let totalProduction = generator.count.mul(generator.productionPerSecond).mul(timeDelta);
            
            if (totalProduction.isNegative() && timeDelta.isNegative()) totalProduction = new Decimal(0);
            // console.log(`updateProduction: Calculated totalProduction for ${generator.name}: ${formatNumber(totalProduction)}`);

            if (totalProduction.gt(0)) {
                if (generator.producesGeneratorId) {
                    const targetGenerator = getGeneratorById(generator.producesGeneratorId);
                    if (targetGenerator) {
                        const oldCount = targetGenerator.count;
                        targetGenerator.count = targetGenerator.count.add(totalProduction);
                        // console.log(`updateProduction: ${generator.name} produced ${formatNumber(totalProduction)} of ${targetGenerator.name}. ${targetGenerator.name} count: ${formatNumber(oldCount)} -> ${formatNumber(targetGenerator.count)}`);
                    }
                } else if (generator.producesResource === "baseCurrency") {
                    const oldCurrency = gameData.baseCurrency;
                    gameData.baseCurrency = gameData.baseCurrency.add(totalProduction);
                    // console.log(`updateProduction: ${generator.name} produced ${formatNumber(totalProduction)} of ${gameData.baseCurrencyName}. ${gameData.baseCurrencyName} count: ${formatNumber(oldCurrency)} -> ${formatNumber(gameData.baseCurrency)}`);
                }
            } else if (generator.count.gt(0)) {
                // console.log(`updateProduction: ${generator.name} calculated zero or negative production (totalProduction = ${formatNumber(totalProduction)}).`);
            }
        }
    }
}

// SUFFIXES array for large number abbreviations.
// Starts with standard K, M, B, T, then uses aa, ab, ac ... az, ba, bb ...
const SUFFIXES = ['', 'K', 'M', 'B', 'T'];
const letters = 'abcdefghijklmnopqrstuvwxyz';
for (let i = 0; i < letters.length; i++) { // Loop for the first letter (a-z)
    for (let j = 0; j < letters.length; j++) { // Loop for the second letter (a-z)
        SUFFIXES.push(letters[i] + letters[j]); // Creates "aa", "ab", ..., "az", "ba", ...
    }
}
// This will generate: '', K, M, B, T, aa, ab, ..., az, ba, bb, ..., bz, ..., za, ..., zz
// Total of 5 (manual) + 26*26 (generated) = 5 + 676 = 681 suffixes.
// This setup can handle numbers up to approximately 1000^680.

const SPEED_OF_LIGHT_MPS = new Decimal(299792458); // meters per second, used for thematic calculations.

/**
 * Formats a number (Decimal or otherwise) into a human-readable string with suffixes for large numbers.
 * Handles Decimals, converts other types to Decimal, and includes specific formatting for small numbers,
 * numbers less than 1000, and large numbers requiring scientific notation or suffixes.
 * @param {Decimal|number|string} num - The number to format. If not a Decimal, it will be converted.
 * @returns {string} The formatted number string (e.g., "1.23K", "10.00", "1.23e-4", "NaN", "Error").
 * @example
 * formatNumber(new Decimal(1234)); // "1.23K"
 * formatNumber(0.00123); // "1.23e-4"
 * formatNumber(10); // "10.00"
 */
function formatNumber(num) {
    if (!(num instanceof Decimal)) {
        // Attempt to convert non-Decimal inputs, log error if conversion fails or results in NaN.
        try {
            num = new Decimal(num);
            if (num.isNaN()) {
                // console.error(`formatNumber: Input "${arguments[0]}" resulted in NaN Decimal. Returning "NaN".`);
                return "NaN";
            }
        } catch (e) {
            // console.error(`formatNumber: Failed to convert input "${arguments[0]}" to Decimal. Error: ${e}. Returning "Error".`);
            return "Error";
        }
    }

    if (num.isZero()) {
        return "0.00";
    }

    // Handle very small numbers (close to zero) with scientific notation if toFixed(2) would be 0.00
    // but only if the number is not actually zero.
    if (num.abs().lt(0.01) && !num.isZero()) {
        return num.toExponential(2); // Always use exponential for abs(num) < 0.01 and non-zero
    }
    
    // For numbers with absolute value less than 1000, use toFixed(2) without abbreviation.
    // This now applies to numbers >= 0.01 and < 1000.
    if (num.abs().lt(1000)) {
        return num.toFixed(2); // e.g., 123.45, -123.45, 0.01
    }

    let i = 0;
    const sign = num.isNegative() ? "-" : "";
    let numToFormat = num.abs(); // Work with positive number for abbreviation logic

    // Determine the correct suffix
    // Divide by 1000 until the number is < 1000
    // Keep track of how many divisions were made to select the suffix
    while (numToFormat.gte(1000) && i < SUFFIXES.length - 1) {
        numToFormat = numToFormat.div(1000);
        i++;
    }

    // After loop, numToFormat is between 1 (inclusive if loop ran) and 999.99...
    // Display with 2 decimal places and the chosen suffix
    // If numToFormat is exactly 1000 due to rounding from previous divisions, and we have more suffixes,
    // it might be better to divide once more.
    // Example: 999999.99 -> 999.9999K. If SUFFIXES[i+1] exists, it could be 1.00M.
    // The current loop condition (numToFormat.gte(1000)) handles this.
    
    return sign + numToFormat.toFixed(2) + SUFFIXES[i];
}

const SAVE_KEY = "chaoticIdleGameSave"; // Key used for storing game data in localStorage.

/**
 * Saves the current game state to localStorage.
 * Converts Decimal objects to strings for serialization.
 * Includes error handling for potential localStorage issues.
 */
function saveGame() {
    try {
        // Create a deep copy of gameData suitable for JSON.stringify
        const serializableGameData = {
            baseCurrency: gameData.baseCurrency.toString(),
            baseCurrencyName: gameData.baseCurrencyName, // Already a string
            generators: gameData.generators.map(gen => {
                const serializableGen = { ...gen }; // Copy all properties
                // Convert Decimal properties to strings
                serializableGen.count = gen.count.toString();
                serializableGen.productionPerSecond = gen.productionPerSecond.toString();
                serializableGen.baseCost = gen.baseCost.toString();
                serializableGen.currentCost = gen.currentCost.toString();
                serializableGen.costMultiplier = gen.costMultiplier.toString();
                // isUnlocked, id, name, tier etc. are already serializable
                return serializableGen;
            }),
            lastUpdate: gameData.lastUpdate, // Keep as number
            debugFreePurchases: gameData.debugFreePurchases, // Already boolean
            currentBuyMultiplier: gameData.currentBuyMultiplier, // Already number or 'MAX'
            // buyMultiplierOptions is static, no need to save typically
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(serializableGameData));
        // console.log("Game saved successfully at", new Date().toLocaleTimeString());
    } catch (error) {
        console.error("Error saving game:", error);
    }
}

/**
 * Loads game state from localStorage.
 * Parses the saved JSON string and restores gameData.
 * Converts string representations of Decimals back to Decimal objects.
 * Handles cases where no save data is found or data is corrupted, defaulting to a fresh state.
 * Merges saved generator data with default generator structures to accommodate game updates.
 */
function loadGame() {
    try {
        const savedDataString = localStorage.getItem(SAVE_KEY);
        if (!savedDataString) {
            console.log("No save game found. Starting with default state.");
            gameData.lastUpdate = Date.now(); // Important for fresh start
            return;
        }

        const parsedData = JSON.parse(savedDataString);
        if (!parsedData) {
            console.warn("Failed to parse saved data or save data is null/empty. Starting with default state.");
            gameData.lastUpdate = Date.now(); // Important for fresh start
            return;
        }

        // Load simple properties
        gameData.baseCurrencyName = parsedData.baseCurrencyName || gameData.baseCurrencyName;
        gameData.debugFreePurchases = typeof parsedData.debugFreePurchases === 'boolean' ? parsedData.debugFreePurchases : gameData.debugFreePurchases;
        
        // Sanitize and load currentBuyMultiplier
        if (parsedData.hasOwnProperty('currentBuyMultiplier')) {
            const loadedMultiplier = parsedData.currentBuyMultiplier;
            if (loadedMultiplier === 'MAX') {
                gameData.currentBuyMultiplier = 'MAX';
            } else {
                const numericMultiplier = parseInt(loadedMultiplier, 10);
                if (!isNaN(numericMultiplier) && [1, 10, 100].includes(numericMultiplier)) {
                    gameData.currentBuyMultiplier = numericMultiplier;
                } else {
                    // Default to 1 if loaded value is invalid or not one of the allowed numbers
                    gameData.currentBuyMultiplier = 1; 
                    console.warn(`Invalid or unsupported currentBuyMultiplier ("${loadedMultiplier}") loaded from save. Defaulting to 1.`);
                }
            }
        } else {
            // If not present in save, it will retain its default value from gameData initialization (which is 1)
            // Or, explicitly set it to default if concerned about initial gameData state:
            // gameData.currentBuyMultiplier = 1; 
        }
        // gameData.lastUpdate = parsedData.lastUpdate || Date.now(); // Will be overwritten later

        // Load Decimal properties
        gameData.baseCurrency = new Decimal(parsedData.baseCurrency || gameData.baseCurrency.toString());

        // Load generators: Merge saved data with default generator structure
        const defaultGenerators = JSON.parse(JSON.stringify(gameData.generators)); // Deep clone for template
        const loadedGenerators = [];

        defaultGenerators.forEach(defaultGen => {
            const savedGenData = parsedData.generators ? parsedData.generators.find(sg => sg.id === defaultGen.id) : null;
            
            if (savedGenData) {
                // Generator exists in save, load its data
                const mergedGen = { ...defaultGen }; // Start with default structure

                // Overwrite with saved values, converting Decimals
                mergedGen.count = new Decimal(savedGenData.count || defaultGen.count.toString());
                mergedGen.productionPerSecond = new Decimal(savedGenData.productionPerSecond || defaultGen.productionPerSecond.toString());
                mergedGen.baseCost = new Decimal(savedGenData.baseCost || defaultGen.baseCost.toString());
                mergedGen.currentCost = new Decimal(savedGenData.currentCost || defaultGen.currentCost.toString());
                mergedGen.costMultiplier = new Decimal(savedGenData.costMultiplier || defaultGen.costMultiplier.toString());
                
                // Overwrite non-Decimal properties if they exist in saved data
                mergedGen.name = savedGenData.name || defaultGen.name;
                mergedGen.tier = typeof savedGenData.tier === 'number' ? savedGenData.tier : defaultGen.tier;
                mergedGen.producesResource = savedGenData.producesResource || defaultGen.producesResource;
                mergedGen.producesGeneratorId = typeof savedGenData.producesGeneratorId === 'number' ? savedGenData.producesGeneratorId : defaultGen.producesGeneratorId;
                mergedGen.resourceCostName = savedGenData.resourceCostName || defaultGen.resourceCostName;
                mergedGen.isUnlocked = typeof savedGenData.isUnlocked === 'boolean' ? savedGenData.isUnlocked : defaultGen.isUnlocked;
                
                loadedGenerators.push(mergedGen);
            } else {
                // Generator is in default but not in save (e.g., new generator in an update)
                // Keep the default version (already part of defaultGenerators, just ensure Decimal conversion if somehow not done)
                const newGen = { ...defaultGen };
                newGen.count = new Decimal(defaultGen.count.toString());
                newGen.productionPerSecond = new Decimal(defaultGen.productionPerSecond.toString());
                newGen.baseCost = new Decimal(defaultGen.baseCost.toString());
                newGen.currentCost = new Decimal(defaultGen.currentCost.toString());
                newGen.costMultiplier = new Decimal(defaultGen.costMultiplier.toString());
                loadedGenerators.push(newGen);
            }
        });
        
        // Handle generators that might be in save but not in default (e.g. from a previous version that had more generators)
        // For this implementation, we'll stick to the default set of generators.
        // If a saved generator ID is not in defaultGenerators, it will be ignored.

        gameData.generators = loadedGenerators;
        
        // Crucially, set lastUpdate to NOW to prevent issues with offline progress calculation
        // using the timestamp from the save file.
        gameData.lastUpdate = Date.now(); 
        console.log("Game loaded successfully!");

    } catch (error) {
        console.error("Error loading game:", error, "Starting with default state.");
        // Reset to a known good state (default gameData) if loading fails catastrophically
        // This part might need to re-initialize gameData to its initial default state structure
        // For now, we'll rely on the initial gameData object and just set lastUpdate.
        gameData.lastUpdate = Date.now();
    }
}

/**
 * Checks and applies unlock conditions for generators.
 * Iterates through defined unlock logic (e.g., based on counts of other generators)
 * and sets the `isUnlocked` flag on generators if their conditions are met.
 * Logs unlocks to the console.
 */
function checkUnlocks() {
    gameData.generators.forEach(generator => {
        if (!generator.isUnlocked && generator.unlockRequirements) {
            let allReqsMet = true;
            for (const req of generator.unlockRequirements) {
                if (req.type === "generatorCount") {
                    const sourceGenerator = getGeneratorById(req.generatorId);
                    if (!sourceGenerator || sourceGenerator.count.lt(req.neededCount)) {
                        allReqsMet = false;
                        break; 
                    }
                }
                // Future: Add checks for other requirement types here, e.g., "currencyAmount"
                // else if (req.type === "currencyAmount") { ... }
            }

            if (allReqsMet) {
                generator.isUnlocked = true;
                console.log(generator.name + " Unlocked!");
                // Optional: Trigger 'newly-unlocked' animation
                const tierElement = document.getElementById(`generator-tier-${generator.id}`);
                if (tierElement) {
                    tierElement.classList.add('newly-unlocked');
                    setTimeout(() => {
                        tierElement.classList.remove('newly-unlocked');
                    }, 700); // Duration of the animation in ms (must match CSS)
                }
            }
        }
    });
}

/**
 * Calculates resource and generator production that occurred while the game was closed.
 * Iterates through generators and calculates their total production over the given time delta.
 * Updates `gameData.baseCurrency` and generator counts accordingly.
 * @param {Decimal} timeDeltaSeconds - The time elapsed in seconds since the game was last saved/active.
 * @example
 * const offlineTime = new Decimal(3600); // 1 hour
 * calculateOfflineProduction(offlineTime);
 */
function calculateOfflineProduction(timeDeltaSeconds) {
    // console.log(`calculateOfflineProduction called with timeDeltaSeconds: ${timeDeltaSeconds.toString()}`);
    if (timeDeltaSeconds.isNegative() || timeDeltaSeconds.isZero()) return; // No production if time is zero or negative.

    // Create a snapshot of initial counts for logging or more complex calcs if needed later
    const initialCounts = { baseCurrency: gameData.baseCurrency };
    gameData.generators.forEach(gen => {
        initialCounts[gen.id] = gen.count;
    });

    for (let i = gameData.generators.length - 1; i >= 0; i--) {
        const generator = gameData.generators[i];
        if (generator.count.gt(0)) { // Only consider generators the player owns
            let totalProduction = generator.count.mul(generator.productionPerSecond).mul(timeDeltaSeconds);
            // console.log(`Offline Calc: ${generator.name} (Count: ${formatNumber(generator.count)}) would produce ${formatNumber(totalProduction)} over ${timeDeltaSeconds.toFixed(0)}s`);

            if (totalProduction.gt(0)) {
                if (generator.producesGeneratorId) {
                    const targetGenerator = getGeneratorById(generator.producesGeneratorId);
                    if (targetGenerator) {
                        // const oldTargetCount = targetGenerator.count;
                        targetGenerator.count = targetGenerator.count.add(totalProduction);
                        // console.log(`Offline: ${targetGenerator.name} count updated from ${formatNumber(oldTargetCount)} to ${formatNumber(targetGenerator.count)}`);
                    }
                } else if (generator.producesResource === "baseCurrency") {
                    // const oldCurrency = gameData.baseCurrency;
                    gameData.baseCurrency = gameData.baseCurrency.add(totalProduction);
                    // console.log(`Offline: Base currency updated from ${formatNumber(oldCurrency)} to ${formatNumber(gameData.baseCurrency)}`);
                }
            }
        }
    }
    // Log overall changes
    const currencyEarned = gameData.baseCurrency.sub(initialCounts.baseCurrency);
    if (currencyEarned.gt(0)) {
         console.log(`Base currency earned offline: ${formatNumber(currencyEarned)}`);
    }
    gameData.generators.forEach(gen => {
        const producedOffline = gen.count.sub(initialCounts[gen.id]);
        if (producedOffline.gt(0)) {
            console.log(`${gen.name} produced offline: ${formatNumber(producedOffline)}`);
        }
    });
}

/**
 * Calculates the maximum number of a specific generator that can be bought with current resources.
 * Uses a formula derived from the sum of a geometric series for cost calculation.
 * Handles various edge cases like zero cost, cost multiplier of 1, or decreasing costs.
 * @param {number} generatorId - The ID of the generator to calculate max buy for.
 * @returns {Decimal} The maximum number of units that can be bought. Returns 0 if none can be afforded or generator is locked/invalid.
 * @throws {Error} Can throw errors if Decimal operations encounter unexpected issues, though typically caught by Decimal.js.
 * @example
 * const maxHarvesters = calculateMaxBuy(1);
 * console.log(`Can buy ${maxHarvesters} JuL Harvesters.`);
 */
function calculateMaxBuy(generatorId) {
    const generator = getGeneratorById(generatorId);
    if (!generator || !generator.isUnlocked) return new Decimal(0);

    let currentResource;
    if (generator.tier === 1 || generator.resourceCostName === gameData.baseCurrencyName) {
        currentResource = gameData.baseCurrency;
    } else {
        console.warn(`Max buy for resource ${generator.resourceCostName} not implemented yet.`);
        return new Decimal(0);
    }

    const C = new Decimal(generator.currentCost);
    const M = new Decimal(generator.costMultiplier);
    const R = new Decimal(currentResource);

    if (R.lt(C)) return new Decimal(0); // Cannot afford even one

    // Handle M = 1 case (cost does not increase)
    if (M.eq(1)) {
        if (C.lte(0)) return new Decimal(Infinity); // Free or negative cost means infinite buy with M=1
        return R.div(C).floor();
    }
    
    // Handle cases where cost might be zero or multiplier is weird, though initial checks should catch some.
    // If C is zero or negative, and M is not 1, it's tricky.
    // If C <= 0 and M > 1 (increasing cost from 0), can buy 1 for free/gain, then cost increases.
    // If C <= 0 and M < 1 (decreasing cost from 0), can buy infinite.
    // The formula approach generally assumes C > 0 and M > 0. Let's stick to that for the formula.
    // The initial R.lt(C) handles cases where C is positive and R is too low.
    // If C is zero or negative, R.lt(C) might be false, allowing purchase.
    if (C.lte(0)) { // If initial cost is zero or negative
        // If M is also <= 1 (cost stays zero/negative or decreases), infinite buy.
        // If M > 1 (cost increases from zero/negative), can effectively buy one for free/profit,
        // then subsequent costs might become positive. The formula might not be best here.
        // However, the problem asks for the formula, so we'll assume C > 0 for the main formula path.
        // For C <= 0:
        if (M.lte(1)) return new Decimal(Infinity); // Cost never increases positively
        // If C is 0 and M > 1, first is free, next costs 0*M=0, etc. This should be infinite.
        // This implies the iterative version was more robust for C=0.
        // Let's refine: if C is 0, and M > 1, it implies infinite free items.
        if (C.isZero()) return new Decimal(Infinity);
        // If C is negative, this is an edge case not typical for this formula.
        // For now, if C is negative and M > 1, it's complex. Let's return 1 as a fallback,
        // assuming you get one and then the cost might become positive.
        // This part needs careful thought if C can be negative.
        // Assuming C is generally positive for the formula.
        // The problem statement implies C, M, R are Decimals.
    }


    // Formula: k = floor(log(1 - (R * (M-1) / C) + 1) / log(M))
    // More commonly written as: k = floor(log( (R*(M-1)/C) + 1 ) / log(M)) for M > 1
    // Or derived from: R >= C * (M^k - 1) / (M - 1)  (sum of geometric series for total cost)
    // M^k - 1 <= R * (M - 1) / C
    // M^k <= (R * (M - 1) / C) + 1
    // k * log(M) <= log((R * (M - 1) / C) + 1)
    // k <= log((R * (M - 1) / C) + 1) / log(M)

    // Check if M is less than or equal to 0 (invalid multiplier for this formula)
    // or if M is 1 (already handled).
    // The formula assumes M > 0 and M != 1.
    // If M is between 0 and 1 (exclusive), costs decrease. This means player can buy more, potentially infinite if cost approaches 0.
    if (M.lte(0)) return new Decimal(0); // Invalid multiplier for growth formula context

    if (M.lt(1)) { // Cost decreases
        // If cost decreases towards zero, potentially infinite.
        // This scenario means the sum formula for increasing costs isn't directly applicable for "how many can I afford".
        // If costs decrease, you can always afford the next one if you can afford the current one, until count is exhausted or cost becomes negligible.
        // For simplicity, if M < 1 and C > 0, this is like an infinite geometric series if we were *receiving* money.
        // This implies you can keep buying as long as you have resources for the current one, and the cost keeps dropping.
        // This is effectively infinite if resources R are >= C.
        if (R.gte(C)) return new Decimal(Infinity);
        else return new Decimal(0);
    }

    // Now, M > 1, C > 0
    // Value = (R * (M - 1) / C) + 1
    const term = R.mul(M.sub(1)).div(C).add(1);

    // If term is <= 0, log is not possible. This means cannot afford any or exactly one if term is 1.
    // If term is 1 (meaning R*(M-1)/C is 0), then k <= log(1)/log(M) = 0. This means 0 items.
    // This occurs if R=0 (already handled by R.lt(C) if C > 0).
    // More likely, if R * (M-1) / C is very small (e.g. R is slightly more than C).
    // If term is positive but less than M, then log(term) < log(M), so k would be < 1.
    // Decimal.log(value, base) or use natural log: Decimal.ln(value).div(Decimal.ln(base))
    
    if (term.lte(0)) { // Should not happen if R >= C and M > 1, C > 0, because (M-1)>0, R/C >=1, so term >= M > 1.
        return new Decimal(0); // Safety for log domain.
    }
    
    // If term is less than M, and we expect M^k = term, then k < 1.
    // log_M(term)
    let count;
    try {
        // k = log_M(term)
        count = Decimal.log(term, M);
    } catch (e) {
        // Fallback for potential issues with Decimal.log if base is too close to 1 or term is problematic
        // This might happen if M is very close to 1, making log(M) very small.
        // The original iterative approach is safer in such highly sensitive cases.
        // For now, let's assume Decimal.log behaves well or try natural log.
        if (M.ln().isZero()) { // M is 1, should have been caught
            return R.div(C).floor();
        }
        if (term.ln().isNegative() && !term.isZero()) { // log of number between 0 and 1
             // This implies R*(M-1)/C + 1 is between 0 and 1.
             // (R*(M-1)/C) is between -1 and 0.
             // This should not happen if R >= C, M > 1, C > 0.
            return new Decimal(0);
        }
        try {
            count = term.ln().div(M.ln());
        } catch (e2) {
            console.error("Error calculating max buy with logs:", e2);
            // Fallback to iterative if formula fails catastrophically
            let tempCost = new Decimal(C);
            let tempResource = new Decimal(R);
            let iterativeCount = new Decimal(0);
            while (tempResource.gte(tempCost)) {
                tempResource = tempResource.sub(tempCost);
                tempCost = tempCost.mul(M);
                iterativeCount = iterativeCount.add(1);
                if (iterativeCount.gt(2500)) break; // Safety break, increased slightly
            }
            return iterativeCount;
        }
    }

    if (count.isNaN() || count.isNegative()) {
        // If result is NaN or negative, it implies an issue or 0 items.
        return new Decimal(0);
    }

    return count.floor();
}

/**
 * Handles the purchase of a specified number of generators.
 * Determines the number to buy based on the current buy multiplier (1, 10, 100, or MAX).
 * If 'MAX' is selected, it uses `calculateMaxBuy`.
 * Deducts resources, updates generator count, and increases the cost for the next purchase.
 * @param {number} generatorId - The ID of the generator to buy.
 * @example
 * buyGenerator(1); // Buys based on currentBuyMultiplier
 * gameData.currentBuyMultiplier = 'MAX';
 * buyGenerator(1); // Buys max possible
 */
function buyGenerator(generatorId) {
    const generator = getGeneratorById(generatorId);
    if (!generator) {
        console.error(`Generator with ID ${generatorId} not found.`);
        return;
    }
    if (!generator.isUnlocked) {
        console.log(`${generator.name} is not unlocked yet.`);
        return;
    }

    let numToBuyRaw;
    if (gameData.currentBuyMultiplier === 'MAX') {
        numToBuyRaw = calculateMaxBuy(generatorId);
    } else {
        numToBuyRaw = gameData.currentBuyMultiplier;
    }

    let numToBuy; // This will be our Decimal quantity

    if (numToBuyRaw instanceof Decimal) {
        numToBuy = numToBuyRaw;
    } else {
        // numToBuyRaw is a JS number (1, 10, 100) or could be something else if logic changes
        try {
            // Attempt to convert to Decimal. This handles numbers and valid string representations.
            let numericValue = Number(numToBuyRaw); // Ensure it's a number first if it might be non-numeric string
            if (isNaN(numericValue)) {
                // If currentBuyMultiplier was something unexpected (not 'MAX' and not a direct number)
                console.warn(`Invalid non-numeric value for buy multiplier: ${numToBuyRaw}. Defaulting to 1.`);
                numericValue = 1;
            }
            numToBuy = new Decimal(numericValue);
        } catch (e) {
            // Catch errors from Decimal constructor if input is truly problematic
            console.warn(`Error converting buy multiplier to Decimal: ${numToBuyRaw}. Error: ${e}. Defaulting to 1.`);
            numToBuy = new Decimal(1);
        }
    }

    if (numToBuy.isZero()) {
        // console.log("Cannot buy 0 units."); // This log can be reactivated if desired
        return;
    }
    
    // Handle cases where numToBuy (derived from 'MAX' or specific number) might be infinite
    // This is the corrected line, using numToBuy which is guaranteed to be a Decimal.
    // Check internal exponent property for Infinity, as standard .isInfinite() and Decimal.Infinity are unavailable.
    // For Decimal.js (and compatible libraries), an exponent of Infinity signifies an infinite value.
    if (numToBuy.e === Infinity) {
        if (gameData.debugFreePurchases) {
            numToBuy = new Decimal(1000); // Cap for debug free purchases if calculated max is infinite
            console.log("Debug Free Purchases ON: Max buy is infinite, capping to 1000.");
        } else {
            // Not debug mode, but calculated max is infinite (e.g., cost is 0 and M=1, or M < 1 making cost decrease)
            numToBuy = new Decimal(1000); // Cap genuinely infinite purchases too
            console.log("Max buy is infinite (e.g., free item), capping to 1000.");
        }
    }
    // The 'else' block that was here, along with the subsequent 'Additional check if numToBuy ended up non-Decimal'
    // are removed as numToBuy is now consistently a Decimal by this point, or the function would have returned if it's zero.
    // Any invalid input to new Decimal() during numToBuy initialization would be caught and defaulted.

    let totalUnitsBought = new Decimal(0);
    for (let i = new Decimal(0); i.lt(numToBuy); i = i.add(1)) {
        let currentUnitCost = generator.currentCost; // This is already a Decimal
        let canAffordThisUnit = false;
        let resourceToSpend = null;

        if (generator.tier === 1 || generator.resourceCostName === gameData.baseCurrencyName) {
            resourceToSpend = 'baseCurrency';
            if (gameData.baseCurrency.gte(currentUnitCost)) {
                canAffordThisUnit = true;
            }
        }
        // TODO: Add logic for other resource types if necessary

        if (gameData.debugFreePurchases) {
            canAffordThisUnit = true;
        }

        if (canAffordThisUnit) {
            if (!gameData.debugFreePurchases) {
                if (resourceToSpend === 'baseCurrency') {
                    gameData.baseCurrency = gameData.baseCurrency.sub(currentUnitCost);
                }
                // TODO: Subtract other resource types
            }
            generator.count = generator.count.add(1);
            generator.currentCost = generator.currentCost.mul(generator.costMultiplier);
            totalUnitsBought = totalUnitsBought.add(1);
        } else {
            if (i.isZero()) { // Only log if couldn't afford the first one
                 console.log(`Not enough resources to buy ${generator.name}. Needed: ${formatNumber(currentUnitCost)}`);
            } else {
                 console.log(`Bought ${formatNumber(totalUnitsBought)} ${generator.name}(s) before running out of resources.`);
            }
            break; // Exit loop if cannot afford
        }
    }

    if (totalUnitsBought > 0) {
        console.log(`Bought ${totalUnitsBought} ${generator.name}(s).`);
        // The unlock animation is now primarily handled by checkUnlocks.
        // The specific unlock logic tied to buying generator 1 causing tier 2 unlock
        // is now generalized in checkUnlocks.
        // We might still want a direct call to checkUnlocks here if a purchase could immediately trigger one.
        // However, checkUnlocks is already in the gameLoop, so it will be caught.
        // For immediate UI feedback on unlock due to a purchase, checkUnlocks might need to be called here.
        // Let's rely on the game loop's checkUnlocks for now to keep buyGenerator cleaner.
        
        // const generator is the one being bought/modified in buyGenerator's scope
        console.log(`buyGenerator: Finished purchase for ${generator.name}. New count: ${formatNumber(generator.count)}, New currentCost: ${formatNumber(generator.currentCost)}`);
        updateUI(); // Update UI immediately after a purchase
        // checkUnlocks(); // Optionally call here for immediate unlock feedback if not relying solely on gameLoop
    }
}

/**
 * Dynamically creates and renders HTML elements for each generator in the UI.
 * This function is called on initial page load and potentially after game updates
 * that might change the set of available generators (though currently, generators are static).
 * It populates the 'generators-section' div with tier-specific divs, titles, counts,
 * production rates, and buy buttons.
 */
function renderGeneratorElements() {
    const generatorsSection = document.getElementById('generators-section');
    if (!generatorsSection) {
        console.error("Generator section not found in HTML!");
        return;
    }

    const h2Title = generatorsSection.querySelector('h2');
    generatorsSection.innerHTML = '';
    if (h2Title) {
        generatorsSection.appendChild(h2Title);
    }

    gameData.generators.forEach(generator => {
        const tierDiv = document.createElement('div');
        tierDiv.className = 'generator-tier';
        tierDiv.id = `generator-tier-${generator.id}`;

        const title = document.createElement('h3');
        title.innerHTML = `Tier ${generator.tier}: <span class="generator-name" id="gen-name-${generator.id}">${generator.name}</span>`;
        tierDiv.appendChild(title);

        const countP = document.createElement('p');
        countP.innerHTML = `Count: <span id="gen-count-${generator.id}">${formatNumber(generator.count)}</span>`;
        tierDiv.appendChild(countP);

        const productionP = document.createElement('p');
        productionP.innerHTML = `Producing: <span id="gen-production-${generator.id}">0</span>/s <span class="produces-what" id="gen-produces-${generator.id}"></span>`;
        tierDiv.appendChild(productionP);

        if (generator.id === 1) { // Only for Tier 1 generator
            const progressBarContainer = document.createElement('div');
            progressBarContainer.className = 'progress-bar-container';
            progressBarContainer.id = `gen-progress-container-${generator.id}`;

            const progressBarFill = document.createElement('div');
            progressBarFill.className = 'progress-bar-fill';
            progressBarFill.id = `gen-progress-bar-${generator.id}`;

            progressBarContainer.appendChild(progressBarFill);
            tierDiv.appendChild(progressBarContainer); // Add it before the button
        }

        const buyButton = document.createElement('button');
        buyButton.id = `buy-gen-${generator.id}`;
        buyButton.className = 'buy-generator-button';
        buyButton.innerHTML = `Buy ${generator.name} (Cost: <span id="gen-cost-${generator.id}">0</span> <span id="gen-cost-resource-${generator.id}"></span>)`;
        tierDiv.appendChild(buyButton);

        generatorsSection.appendChild(tierDiv);
    });
    // console.log("Dynamic generator elements rendered.");
}

/**
 * Updates all dynamic parts of the User Interface (UI) with current game data.
 * This includes displaying the base currency count, generator counts, production rates,
 * costs, and status (locked/unlocked). It also updates thematic elements like
 * rapidity and ship speed. Called frequently by the game loop.
 */
function updateUI() {
    // console.log(`updateUI called. gameData.baseCurrency = ${formatNumber(gameData.baseCurrency)}`);
    /* gameData.generators.forEach(gen => { // Example of past debug logging
        if(gen) {
             // console.log(`updateUI: Generator ID ${gen.id} (${gen.name}) count = ${formatNumber(gen.count)}`);
        } else {
             // console.log("updateUI: encountered undefined generator in gameData.generators");
        }
    });*/

    const baseCurrencyElement = document.getElementById('base-currency-count');
    // console.log('updateUI: Attempting to update base-currency-count.');
    if (baseCurrencyElement) {
        const valueToSet = formatNumber(gameData.baseCurrency);
        // console.log(`updateUI: baseCurrencyElement found. Value to set for base currency: "${valueToSet}"`);
        baseCurrencyElement.textContent = valueToSet;
    } else {
        console.error('updateUI: base-currency-count element NOT FOUND');
    }

    // Calculate and Display Rapidity & Ship Speed
    const rapidityElement = document.getElementById('current-rapidity');
    // Rapidity (φ): 1 JuL = 10^-9 units of Rapidity.
    // This is a thematic calculation based on the game's lore/concept.
    let currentRapidity = gameData.baseCurrency.div(new Decimal("1e9"));

    if (rapidityElement) {
        rapidityElement.textContent = formatNumber(currentRapidity);
    } else {
        console.error("updateUI: current-rapidity element NOT FOUND");
    }

    // --- Define numericRapidity and vcRatio here for ship speed calculations ---
    // numericRapidity is the JavaScript number representation of currentRapidity (a Decimal).
    // vcRatio is the velocity as a fraction of the speed of light (v/c), calculated using Math.tanh (hyperbolic tangent),
    // a common formula in special relativity relating rapidity (φ) to v/c: v/c = tanh(φ).
    let numericRapidity;
    try {
        numericRapidity = currentRapidity.toNumber(); // Convert Decimal to number for Math.tanh
    } catch (e) {
        // If currentRapidity is too large to convert to a JS number, it's effectively infinite for tanh.
        numericRapidity = Infinity; 
    }
    let vcRatio = Math.tanh(numericRapidity); // Calculate v/c ratio once. tanh(Infinity) = 1.

    // --- Calculate and Display Ship Speed (v/c %) ---
    const speedElement = document.getElementById('ship-speed-vc');
    if (speedElement) {
        let vcPercentage = new Decimal(vcRatio).mul(100);
        if (vcRatio === 1) { // Ensure 100% is exact if tanh is exactly 1
            vcPercentage = new Decimal(100);
        }
        speedElement.textContent = formatNumber(vcPercentage);
    } else {
        console.error("updateUI: ship-speed-vc element NOT FOUND");
    }

    // --- Calculate and Display Raw Ship Speed (v) ---
    const rawSpeedElement = document.getElementById('ship-speed-raw');
    if (rawSpeedElement) {
        let vcRatioDecimal = new Decimal(vcRatio); // vcRatio is now in scope
        let rawSpeed = SPEED_OF_LIGHT_MPS.mul(vcRatioDecimal);
        rawSpeedElement.textContent = formatNumber(rawSpeed); 
    } else {
        console.error("updateUI: ship-speed-raw element NOT FOUND");
    }


    gameData.generators.forEach(generator => {
        const tierElement = document.getElementById(`generator-tier-${generator.id}`);
        if (!tierElement) {
            return;
        }

        const countElement = document.getElementById(`gen-count-${generator.id}`);
        // console.log(`updateUI: Attempting to update gen-count-${generator.id}.`);
        if (countElement) {
            const valueToSet = formatNumber(generator.count);
            // console.log(`updateUI: gen-count-${generator.id} found. Value to set for generator ${generator.id}: "${valueToSet}"`);
            countElement.textContent = valueToSet;
        } else {
            console.error(`updateUI: gen-count-${generator.id} element NOT FOUND`);
        }

        const productionElement = document.getElementById(`gen-production-${generator.id}`);
        const producesWhatElement = document.getElementById(`gen-produces-${generator.id}`);
        const buyButton = document.getElementById(`buy-gen-${generator.id}`);
        const costElement = document.getElementById(`gen-cost-${generator.id}`);
        const costResourceElement = document.getElementById(`gen-cost-resource-${generator.id}`);

        if (productionElement && producesWhatElement) {
            let productionText = "";
            let producesWhatText = "";
            if (generator.producesResource === "baseCurrency") {
                productionText = formatNumber(generator.count.mul(generator.productionPerSecond));
                producesWhatText = gameData.baseCurrencyName;
            } else if (generator.producesGeneratorId) {
                const targetGen = getGeneratorById(generator.producesGeneratorId);
                if (targetGen) {
                    productionText = formatNumber(generator.count.mul(generator.productionPerSecond));
                    producesWhatText = targetGen.name + "s";
                }
            }
            productionElement.textContent = productionText;
            producesWhatElement.textContent = producesWhatText;
        }

        let costResourceName = "";
        if (generator.tier === 1) {
             costResourceName = gameData.baseCurrencyName;
        } else if (generator.resourceCostName) {
             costResourceName = generator.resourceCostName;
        }

        if (costElement && costResourceElement) {
            costElement.textContent = formatNumber(generator.currentCost);
            costResourceElement.textContent = costResourceName;
        }

        if (buyButton) {
            if (!generator.isUnlocked) {
                buyButton.disabled = true;
                tierElement.classList.add('locked');
                buyButton.textContent = "Locked";
            } else {
                buyButton.disabled = false;
                tierElement.classList.remove('locked');
                const costSpanId = `gen-cost-${generator.id}`;
                const resourceSpanId = `gen-cost-resource-${generator.id}`;
                buyButton.innerHTML = `Buy ${generator.name} (Cost: <span id="${costSpanId}">${formatNumber(generator.currentCost)}</span> <span id="${resourceSpanId}">${costResourceName || gameData.baseCurrencyName}</span>)`;
            }
        }

        if (generator.id === 1) { // Only for Tier 1 generator
            const progressBarFill = document.getElementById(`gen-progress-bar-${generator.id}`);
            if (progressBarFill) {
                let progressPercent;
                // Ensure generator.currentCost is a Decimal
                if (generator.currentCost instanceof Decimal) {
                    if (generator.currentCost.isZero() || generator.currentCost.isNegative()) {
                        progressPercent = gameData.baseCurrency.isPositive() ? new Decimal(100) : new Decimal(0);
                    } else {
                        progressPercent = gameData.baseCurrency.div(generator.currentCost).mul(100);
                    }

                    if (progressPercent.gt(100)) progressPercent = new Decimal(100);
                    if (progressPercent.lt(0)) progressPercent = new Decimal(0);

                    progressBarFill.style.width = progressPercent.toNumber() + '%';
                } else {
                    // Fallback or error logging if currentCost is not a Decimal
                    console.warn(`Generator ${generator.id} currentCost is not a Decimal. Type: ${typeof generator.currentCost}`);
                    progressBarFill.style.width = '0%'; // Default to 0%
                }
            }
        }
    });
}

// Game Loop
/**
 * The main game loop, executed at a set interval (e.g., 10 times per second).
 * Responsible for:
 * 1. Updating production of resources and generators (`updateProduction`).
 * 2. Checking for and applying any new unlocks (`checkUnlocks`).
 * 3. Refreshing the UI with the latest game state (`updateUI`).
 * 4. Updating `gameData.lastUpdate` to the current time.
 */
function gameLoop() {
    // console.log("gameLoop called"); // Log at the start of gameLoop
    let now = Date.now(); // Current timestamp
    updateProduction();
    checkUnlocks(); // Check for unlocks after production updates counts
    try {
        updateUI();
    } catch (error) {
        console.error("ERROR during updateUI() execution: ", error);
    }
    gameData.lastUpdate = now;
}

// Ensure the interval is correctly set up.
let gameLoopInterval; // Define gameLoopInterval in a scope accessible for clearing

document.addEventListener('DOMContentLoaded', () => {
    loadGame(); // Load game data first - this sets gameData.lastUpdate from save or to Date.now() if no save
    renderGeneratorElements(); // Render elements based on loaded/default data

    // --- Offline Progress Calculation ---
    const now = Date.now();
    // gameData.lastUpdate should be from the loaded game data or from a fresh start via loadGame().
    // This calculates the duration the game was inactive.
    let timeDeltaOfflineInSeconds = new Decimal(now - gameData.lastUpdate).div(1000);

    if (timeDeltaOfflineInSeconds.lt(1) || timeDeltaOfflineInSeconds.isNegative()) {
        // If negative, it implies system time changed or an issue with saved lastUpdate.
        // Treat as no significant offline time.
        console.log("Offline time less than 1 second or negative, no significant progress to calculate.");
    } else {
        // Optional: Cap offline time
        // const maxOfflineTimeSeconds = new Decimal(7 * 24 * 60 * 60); // 1 week
        // if (timeDeltaOfflineInSeconds.gt(maxOfflineTimeSeconds)) {
        //     console.warn(`Offline time was ${timeDeltaOfflineInSeconds.toFixed(0)}s, capped to ${maxOfflineTimeSeconds.toFixed(0)}s.`);
        //     timeDeltaOfflineInSeconds = maxOfflineTimeSeconds; // Example of capping max offline time.
        // }
        console.log(`Calculating offline progress for ${timeDeltaOfflineInSeconds.toFixed(0)} seconds.`);
        calculateOfflineProduction(timeDeltaOfflineInSeconds);
        checkUnlocks(); // Check if any new generators were unlocked due to offline production.
        console.log("Offline progress calculation complete.");
    }
    
    gameData.lastUpdate = now; // Set lastUpdate to current time AFTER offline calculations and BEFORE game loop starts.
    
    updateUI(); // Update UI with the potentially loaded and offline-progressed data.

    // Setup game loop
    if (typeof gameLoopInterval !== 'undefined') { // Clear any existing interval (e.g. from HMR)
        clearInterval(gameLoopInterval);
    }
    gameLoopInterval = setInterval(gameLoop, 100); // Run game loop 10 times per second

    // Setup autosave
    setInterval(saveGame, 15000); // Save every 15 seconds
    console.log("Autosave interval (15s) set up.");

    const generatorsSection = document.getElementById('generators-section');
    if (generatorsSection) {
        generatorsSection.addEventListener('click', (event) => {
            const buyButton = event.target.closest('.buy-generator-button');
            if (buyButton && buyButton.id) {
                const parts = buyButton.id.split('-');
                if (parts.length === 3 && parts[0] === 'buy' && parts[1] === 'gen') {
                    const generatorId = parseInt(parts[2], 10);
                    if (!isNaN(generatorId)) {
                        buyGenerator(generatorId);
                    } else {
                        console.error("Could not parse generator ID from button:", buyButton.id);
                    }
                }
            }
        });
    } else {
        console.error("Cannot attach delegated event listener: generators-section not found.");
    }

    const toggleFreePurchasesButton = document.getElementById('toggle-free-purchases');
    if (toggleFreePurchasesButton) {
        toggleFreePurchasesButton.addEventListener('click', () => {
            gameData.debugFreePurchases = !gameData.debugFreePurchases;
            toggleFreePurchasesButton.textContent = `Free Purchases: ${gameData.debugFreePurchases ? 'ON' : 'OFF'}`;
            toggleFreePurchasesButton.style.backgroundColor = gameData.debugFreePurchases ? 'var(--color-secondary-accent)' : '#aaa';
            toggleFreePurchasesButton.style.color = gameData.debugFreePurchases ? 'white' : 'black';
            console.log(`Debug Free Purchases: ${gameData.debugFreePurchases}`);
        });
        toggleFreePurchasesButton.style.backgroundColor = gameData.debugFreePurchases ? 'var(--color-secondary-accent)' : '#aaa';
        toggleFreePurchasesButton.style.color = gameData.debugFreePurchases ? 'white' : 'black';
    }

    const multiplierButtons = document.querySelectorAll('.multiplier-button');
    multiplierButtons.forEach(button => {
        button.addEventListener('click', () => {
            const multiplierValue = button.dataset.multiplier;
            if (multiplierValue === 'MAX') {
                gameData.currentBuyMultiplier = 'MAX';
            } else {
                gameData.currentBuyMultiplier = parseInt(multiplierValue, 10); // Keep as number for 'MAX' logic
            }
            multiplierButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            console.log(`Current Buy Multiplier set to: ${gameData.currentBuyMultiplier}`);
            updateUI();
        });
    });
});

// console.log("Event listeners updated for multipliers, debug toggle, and dynamic buttons.");
// console.log("gameLoop function updated with logging and try-catch for updateUI.");
// The console log for updateUI refactoring is implicitly covered by the new logging.
// console.log("updateUI function refactored for dynamic element IDs."); // This can be removed or kept.
