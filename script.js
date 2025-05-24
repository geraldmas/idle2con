// script.js

// Main game data object
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
            isUnlocked: false // Will be unlocked later
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
            isUnlocked: false 
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
            isUnlocked: false
        }
        // Future generator tiers can be added here
    ],
    lastUpdate: Date.now(),
    debugFreePurchases: false,
    currentBuyMultiplier: 1,
    buyMultiplierOptions: [1, 10, 100, 'MAX'],
};

console.log("Game data initialized:", gameData);

function getGeneratorById(id) {
    return gameData.generators.find(gen => gen.id === id);
}

function updateProduction() {
    const currentUpdateTime = Date.now();
    const timeDelta = new Decimal((currentUpdateTime - gameData.lastUpdate) / 1000);
    // console.log(`updateProduction: timeDelta = ${timeDelta.toFixed(3)}s (lastUpdate: ${gameData.lastUpdate}, currentUpdateTime: ${currentUpdateTime})`);
    if (timeDelta.isNegative()) {
        console.warn(`updateProduction: Negative timeDelta (${timeDelta.toFixed(3)}s). This might indicate an issue with system time or lastUpdate resetting. Clamping to 0.`);
        // timeDelta = new Decimal(0); // Option: clamp negative delta to prevent de-production
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

// SUFFIXES array for large number abbreviations
// Starts with standard K, M, B, T, then uses aa, ab, ac ... az, ba, bb ...
const SUFFIXES = ['', 'K', 'M', 'B', 'T'];
const letters = 'abcdefghijklmnopqrstuvwxyz';
for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
        SUFFIXES.push(letters[i] + letters[j]);
    }
}
// This will generate: '', K, M, B, T, aa, ab, ..., az, ba, bb, ..., bz, ..., za, ..., zz
// Total of 5 + 26*26 = 5 + 676 = 681 suffixes, handling up to 1000^680

function formatNumber(num) {
    if (!(num instanceof Decimal)) {
        // Attempt to convert non-Decimal inputs, log error if conversion fails or results in NaN
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
        // Check if toFixed(2) would result in "0.00" or "-0.00"
        if (num.toFixed(2) === "0.00" || num.toFixed(2) === "-0.00") {
            return num.toExponential(2); // e.g., 1.23e-4
        }
    }
    
    // For numbers with absolute value less than 1000, use toFixed(2) without abbreviation.
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

const SAVE_KEY = "chaoticIdleGameSave";

function saveGame() {
    try {
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
        gameData.currentBuyMultiplier = parsedData.currentBuyMultiplier || gameData.currentBuyMultiplier;
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

function checkUnlocks() {
    // Unlock Tier 2 Generator (Morphism Generator)
    const tier2Gen = getGeneratorById(2);
    if (tier2Gen && !tier2Gen.isUnlocked) {
        const tier1Gen = getGeneratorById(1);
        if (tier1Gen && tier1Gen.count.gte(5)) { // Condition: 5 JuL Harvesters
            tier2Gen.isUnlocked = true;
            console.log(tier2Gen.name + " Unlocked!");
        }
    }

    // Unlock Tier 3 Generator (Efficiency Upgrade)
    const tier3Gen = getGeneratorById(3);
    if (tier3Gen && !tier3Gen.isUnlocked) {
        const tier2GenForUnlock = getGeneratorById(2); 
        if (tier2GenForUnlock && tier2GenForUnlock.count.gte(25)) { // Condition: 25 Collector Boosters
            tier3Gen.isUnlocked = true;
            console.log(tier3Gen.name + " Unlocked!");
        }
    }

    // Unlock Tier 4 Generator (Hyperspace Funnel)
    const tier4Gen = getGeneratorById(4);
    if (tier4Gen && !tier4Gen.isUnlocked) {
        const tier3GenForUnlock = getGeneratorById(3); 
        if (tier3GenForUnlock && tier3GenForUnlock.count.gte(25)) { // Condition: 25 Efficiency Upgrades
            tier4Gen.isUnlocked = true;
            console.log(tier4Gen.name + " Unlocked!");
        }
    }
    // Future unlock conditions can be added here
}

function calculateOfflineProduction(timeDeltaSeconds) {
    // console.log(`calculateOfflineProduction called with timeDeltaSeconds: ${timeDeltaSeconds.toString()}`);
    if (timeDeltaSeconds.isNegative() || timeDeltaSeconds.isZero()) return;

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

    if (generator.costMultiplier.eq(1)) {
        if (generator.currentCost.lte(0)) return new Decimal(Infinity); // Effectively infinite if free
        return currentResource.div(generator.currentCost).floor();
    }

    if (generator.currentCost.lte(0) || generator.costMultiplier.lte(0)) {
        if (generator.currentCost.eq(0)) return new Decimal(Infinity);
        return new Decimal(0);
    }
    
    // Geometric series sum for cost: C * (1 - M^k) / (1 - M) <= R
    // (1 - M^k) / (1 - M) <= R/C
    // 1 - M^k <= (R/C) * (1 - M)
    // M^k >= 1 - (R/C) * (1 - M)
    // k * log(M) >= log(1 - (R/C) * (1 - M))
    // k >= log(1 - (R/C) * (1 - M)) / log(M)
    // If 1 - M is negative (M > 1), then (R/C) * (1 - M) is negative.
    // 1 - (negative value) is positive. So log is fine.
    // log(M) is positive if M > 1.

    const C = generator.currentCost;
    const M = generator.costMultiplier;
    const R = currentResource;

    if (R.lt(C)) return new Decimal(0); // Cannot afford even one

    // Simplified iterative approach for now, can be optimized with formula later if performance issues arise.
    let tempCost = new Decimal(generator.currentCost);
    let tempResource = new Decimal(currentResource);
    let count = new Decimal(0);
    while (tempResource.gte(tempCost)) {
        tempResource = tempResource.sub(tempCost);
        tempCost = tempCost.mul(M);
        count = count.add(1);
        if (count.gt(2000)) break; // Safety break
    }
    return count;
}


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

    let numToBuy;
    if (gameData.currentBuyMultiplier === 'MAX') {
        numToBuy = calculateMaxBuy(generatorId);
    } else {
        numToBuy = new Decimal(gameData.currentBuyMultiplier);
    }

    if (numToBuy.isZero()) {
        console.log("Cannot buy 0 units.");
        return;
    }
    
    if (numToBuy.isInfinite() && generator.currentCost.isZero() && gameData.debugFreePurchases) {
        numToBuy = new Decimal(1000);
        console.log("Buying a large batch of free generators in debug mode.");
    } else if (numToBuy.isInfinite()) {
        console.log("Cannot determine a finite max buy amount for free items, limiting to 1000.");
        numToBuy = new Decimal(1000);
    }


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
        if (generator.id === 1 && gameData.generators[0].count >= 5 && !getGeneratorById(2).isUnlocked) {
            const tier2 = getGeneratorById(2);
            if(tier2) {
                tier2.isUnlocked = true; 
                console.log(`${tier2.name} Unlocked!`);
                const tier2Element = document.getElementById('generator-tier-2');
                if (tier2Element) {
                    tier2Element.classList.add('newly-unlocked');
                    setTimeout(() => {
                        tier2Element.classList.remove('newly-unlocked');
                    }, 700); // Duration of the animation in ms
                }
            }
        }
        // const generator is the one being bought/modified in buyGenerator's scope
        console.log(`buyGenerator: Finished purchase for ${generator.name}. New count: ${formatNumber(generator.count)}, New currentCost: ${formatNumber(generator.currentCost)}`);
        updateUI();
    }
}


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

function updateUI() {
    // console.log(`updateUI called. gameData.baseCurrency = ${formatNumber(gameData.baseCurrency)}`);
    /* gameData.generators.forEach(gen => {
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
    const speedElement = document.getElementById('ship-speed-vc');
    const SCALING_FACTOR_JULS_TO_RAPIDITY = 1000;
    let currentRapidity = gameData.baseCurrency.div(SCALING_FACTOR_JULS_TO_RAPIDITY);

    if (rapidityElement) {
        rapidityElement.textContent = formatNumber(currentRapidity);
    } else {
        console.error("updateUI: current-rapidity element NOT FOUND");
    }

    if (speedElement) {
        let numericRapidity;
        try {
            numericRapidity = currentRapidity.toNumber(); // Convert Decimal rapidity to standard number for Math.tanh()
        } catch (e) { // Handles cases where currentRapidity is too large to convert to number
            numericRapidity = Infinity; // Math.tanh(Infinity) is 1
        }

        let vcRatio = Math.tanh(numericRapidity); // v/c = tanh(φ)
        let vcPercentage = new Decimal(vcRatio).mul(100);

        // If vcRatio is extremely close to 1 (e.g. numericRapidity was Infinity or very large),
        // vcPercentage might be like 99.9999... Decimal.toFixed(2) will handle rounding.
        // Ensure that for vcRatio = 1, it shows 100.00%
        if (vcRatio === 1) {
             vcPercentage = new Decimal(100);
        }


        speedElement.textContent = formatNumber(vcPercentage); // Display as percentage
    } else {
        console.error("updateUI: ship-speed-vc element NOT FOUND");
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
                // New logic:
                let progressPercent = 0;
                // Ensure generator and its currentCost are valid before calculation
                if (generator && typeof generator.currentCost === 'number') {
                    if (generator.currentCost > 0) {
                        progressPercent = (gameData.baseCurrency / generator.currentCost) * 100;
                    } else { 
                        // Cost is 0 or less, implies it's free or an edge case
                        // If player has non-negative currency, consider it 100% affordable
                        progressPercent = (gameData.baseCurrency >= 0) ? 100 : 0;
                    }
                }
                // Clamp progressPercent between 0 and 100
                progressPercent = Math.min(Math.max(progressPercent, 0), 100);
                progressBarFill.style.width = progressPercent + '%';
            }
        }
    });
}

// Game Loop
function gameLoop() {
    // console.log("gameLoop called"); // Log at the start of gameLoop
    let now = Date.now();
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
    // gameData.lastUpdate should be from the loaded game data or from a fresh start via loadGame()
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
        //     timeDeltaOfflineInSeconds = maxOfflineTimeSeconds;
        // }
        console.log(`Calculating offline progress for ${timeDeltaOfflineInSeconds.toFixed(0)} seconds.`);
        calculateOfflineProduction(timeDeltaOfflineInSeconds);
        checkUnlocks(); // Check if any new generators were unlocked due to offline production
        console.log("Offline progress calculation complete.");
    }
    
    gameData.lastUpdate = now; // Set lastUpdate to current time AFTER offline calculations and BEFORE game loop starts
    
    updateUI(); // Update UI with the potentially loaded and offline-progressed data

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
