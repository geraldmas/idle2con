// script.js

// Main game data object
let gameData = {
    baseCurrency: 20, // This will be our "Objects"
    baseCurrencyName: "Objects",
    generators: [
        {
            id: 1,
            name: "Object Generator",
            tier: 1, // This is the first generator the player interacts with to produce the base currency
            count: 0, // How many the player owns
            productionPerSecond: 1, // Produces 1 Object per second per generator
            producesResource: "baseCurrency", // Special keyword for the base currency
            baseCost: 10,
            currentCost: 10,
            costMultiplier: 1.15, // Each purchase increases cost by 15%
            isUnlocked: true // Unlocked by default
        },
        {
            id: 2,
            name: "Morphism Generator",
            tier: 2, // This generator produces the generator of tier 1
            count: 0,
            productionPerSecond: 1, // Produces 1 Object Generator per second per generator
            producesGeneratorId: 1, // ID of the generator it produces (Object Generator)
            resourceCostName: "Objects", // What it costs to buy this generator
            baseCost: 100, // Cost in "Objects"
            currentCost: 100,
            costMultiplier: 1.20,
            isUnlocked: false // Will be unlocked later, e.g., after owning some Object Generators
        },
        // Future generator tiers can be added here
        // For example, a Tier 3 "2-Morphism Generator" would produce "Morphism Generators" (id: 2)
    ],
    lastUpdate: Date.now(),
    debugFreePurchases: false, 
    currentBuyMultiplier: 1,
    buyMultiplierOptions: [1, 10, 100, 'MAX'],
};

// We can add functions to interact with this data later.
// For now, just setting up the structure.

console.log("Game data initialized:", gameData);

// (Existing gameData structure from previous step should be above this)

function getGeneratorById(id) {
    return gameData.generators.find(gen => gen.id === id);
}

function updateProduction() {
    let now = Date.now();
    let timeDelta = (now - gameData.lastUpdate) / 1000; // Time delta in seconds

    // Iterate generators in reverse order of tier for correct production cascade
    // (Tier N produces Tier N-1, so process Tier N's production first)
    for (let i = gameData.generators.length - 1; i >= 0; i--) {
        const generator = gameData.generators[i];
        if (generator.count > 0) {
            let totalProduction = generator.count * generator.productionPerSecond * timeDelta;

            if (generator.producesGeneratorId) {
                const targetGenerator = getGeneratorById(generator.producesGeneratorId);
                if (targetGenerator) {
                    targetGenerator.count += totalProduction;
                    // console.log(`${generator.name} produced ${totalProduction} of ${targetGenerator.name}`);
                }
            } else if (generator.producesResource === "baseCurrency") {
                gameData.baseCurrency += totalProduction;
                // console.log(`${generator.name} produced ${totalProduction} of ${gameData.baseCurrencyName}`);
            }
        }
    }
}

// (Existing gameData, getGeneratorById, updateProduction, gameLoop, and setInterval should be above this)

function formatNumber(num) {
    // Basic number formatting, can be expanded later for large numbers (e.g., scientific notation)
    if (num < 1000) return num.toFixed(2); // Show 2 decimal places for smaller numbers
    // Add more sophisticated formatting here later if needed (e.g., K, M, B for thousands, millions, billions)
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// (All existing JS code from previous steps should be above this)

function calculateMaxBuy(generatorId) {
    const generator = getGeneratorById(generatorId);
    if (!generator || !generator.isUnlocked) return 0;

    let currentResource;
    if (generator.tier === 1 || generator.resourceCostName === gameData.baseCurrencyName) {
        currentResource = gameData.baseCurrency;
    } else {
        // Placeholder for other resource types if they are introduced
        // const resourceGen = gameData.generators.find(g => g.name === generator.resourceCostName);
        // currentResource = resourceGen ? resourceGen.count : 0;
        console.warn(`Max buy for resource ${generator.resourceCostName} not implemented yet.`);
        return 0;
    }

    if (generator.costMultiplier === 1) { // Simple case: linear cost increase (or no increase per unit)
        if (generator.currentCost <= 0) return Infinity; // Avoid division by zero if free
        return Math.floor(currentResource / generator.currentCost);
    }

    // Cost increases geometrically: C, C*M, C*M^2, ... C*M^(n-1)
    // Sum of costs for n items: S = C * (M^n - 1) / (M - 1)
    // We need to find max n such that S <= currentResource
    // M^n <= (currentResource * (M - 1) / C) + 1
    // n * log(M) <= log((currentResource * (M - 1) / C) + 1)
    // n <= log((currentResource * (M - 1) / C) + 1) / log(M)
    
    let numCanBuy = 0;
    if (generator.currentCost <= 0 || generator.costMultiplier <= 0) { // Avoid issues with non-positive costs/multipliers
         if (generator.currentCost === 0) return Infinity; // Can buy infinite if they are free
         return 0; // Cannot buy if cost is negative and multiplier is not helping
    }

    // If cost is very low or resources very high, direct formula might have precision issues or overflow.
    // Iterative approach is safer for game logic and handles integer counts correctly.
    let tempCost = generator.currentCost;
    let tempResource = currentResource;
    let count = 0;
    while (tempResource >= tempCost) {
        tempResource -= tempCost;
        tempCost *= generator.costMultiplier;
        count++;
        if (count > 2000) break; // Safety break for extreme scenarios to prevent freezing browser
    }
    numCanBuy = count;
    return numCanBuy;
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

    let numToBuy = 0;
    if (gameData.currentBuyMultiplier === 'MAX') {
        numToBuy = calculateMaxBuy(generatorId);
    } else {
        numToBuy = gameData.currentBuyMultiplier;
    }

    if (numToBuy === 0) {
        console.log("Cannot buy 0 units.");
        return;
    }
    if (numToBuy === Infinity && generator.currentCost === 0 && gameData.debugFreePurchases) {
         // Handle buying a large number of free items in debug mode
         numToBuy = 1000; // Buy a large batch, e.g. 1000
         console.log("Buying a large batch of free generators in debug mode.");
    } else if (numToBuy === Infinity) {
        console.log("Cannot determine a finite max buy amount for free items, limiting to 1000.");
        numToBuy = 1000; // Or handle as an error / smaller amount
    }


    let totalUnitsBought = 0;
    let totalCostPaid = 0; // For potential summary, not strictly needed by current logic

    for (let i = 0; i < numToBuy; i++) {
        let currentUnitCost = generator.currentCost;
        let canAffordThisUnit = false;
        let resourceToSpend = null;

        if (generator.tier === 1 || generator.resourceCostName === gameData.baseCurrencyName) {
            resourceToSpend = 'baseCurrency';
            if (gameData.baseCurrency >= currentUnitCost) {
                canAffordThisUnit = true;
            }
        } // Add other resource checks here if needed

        if (gameData.debugFreePurchases) {
            canAffordThisUnit = true;
        }

        if (canAffordThisUnit) {
            if (!gameData.debugFreePurchases) {
                if (resourceToSpend === 'baseCurrency') {
                    gameData.baseCurrency -= currentUnitCost;
                }
                // Deduct other resources if needed
            }
            totalCostPaid += gameData.debugFreePurchases ? 0 : currentUnitCost;
            generator.count++;
            generator.currentCost *= generator.costMultiplier; // Escalate cost for the *next* unit
            totalUnitsBought++;
        } else {
            // Not enough resources for this unit in the batch
            if (i === 0) { // Failed to buy even the first unit
                 console.log(`Not enough resources to buy ${generator.name}. Needed: ${currentUnitCost.toFixed(2)}`);
            } else {
                 console.log(`Bought ${totalUnitsBought} ${generator.name}(s) before running out of resources.`);
            }
            break; // Stop trying to buy more in this batch
        }
    }

    if (totalUnitsBought > 0) {
        console.log(`Bought ${totalUnitsBought} ${generator.name}(s).`);
        // Basic unlocking logic (keep as is or adapt if needed)
        if (generator.id === 1 && gameData.generators[0].count >= 5 && !getGeneratorById(2).isUnlocked) {
            const tier2 = getGeneratorById(2);
            if(tier2) tier2.isUnlocked = true; // Check if tier2 exists
            console.log(`${getGeneratorById(2)?.name} Unlocked!`);
        }
        updateUI();
    }
}

// (Existing gameData, helper functions, game loop etc. should be above this)

function renderGeneratorElements() {
    const generatorsSection = document.getElementById('generators-section');
    if (!generatorsSection) {
        console.error("Generator section not found in HTML!");
        return;
    }
    
    // Preserve the H2 title, clear everything else
    const h2Title = generatorsSection.querySelector('h2');
    generatorsSection.innerHTML = ''; // Clear all content
    if (h2Title) {
        generatorsSection.appendChild(h2Title); // Re-add H2 if it existed
    }

    gameData.generators.forEach(generator => {
        // Create the main container for the generator tier
        const tierDiv = document.createElement('div');
        tierDiv.className = 'generator-tier';
        tierDiv.id = `generator-tier-${generator.id}`; // Unique ID for the tier container

        // Generator Name (Title)
        const title = document.createElement('h3');
        title.innerHTML = `Tier ${generator.tier}: <span class="generator-name" id="gen-name-${generator.id}">${generator.name}</span>`;
        tierDiv.appendChild(title);

        // Count Display
        const countP = document.createElement('p');
        countP.innerHTML = `Count: <span id="gen-count-${generator.id}">${formatNumber(generator.count)}</span>`;
        tierDiv.appendChild(countP);

        // Production Display
        const productionP = document.createElement('p');
        productionP.innerHTML = `Producing: <span id="gen-production-${generator.id}">0</span>/s <span class="produces-what" id="gen-produces-${generator.id}"></span>`;
        tierDiv.appendChild(productionP);

        // Buy Button
        const buyButton = document.createElement('button');
        buyButton.id = `buy-gen-${generator.id}`;
        buyButton.className = 'buy-generator-button'; // Add a common class for event delegation
        // Initial button text will be set by updateUI
        buyButton.innerHTML = `Buy ${generator.name} (Cost: <span id="gen-cost-${generator.id}">0</span> <span id="gen-cost-resource-${generator.id}"></span>)`;
        tierDiv.appendChild(buyButton);
        
        generatorsSection.appendChild(tierDiv);
    });
    console.log("Dynamic generator elements rendered.");
}

// (Existing gameData, renderGeneratorElements, updateUI, etc. should be above this)

// The buyGenerator function itself should remain as is, as it takes an ID.

// Modify the DOMContentLoaded event listener:
document.addEventListener('DOMContentLoaded', () => {
    // Remove the old, direct event listener attachments and the temporary cloning fix.
    // These lines should be deleted:
    // const oldBuyTier1Button = document.getElementById('buy-tier-1');
    // if (oldBuyTier1Button) { ... }
    // const oldBuyTier2Button = document.getElementById('buy-tier-2');
    // if (oldBuyTier2Button) { ... }

    renderGeneratorElements(); // Create the generator HTML structure
    updateUI(); // Initial UI update

    // Add event delegation for buy buttons
    const generatorsSection = document.getElementById('generators-section');
    if (generatorsSection) {
        generatorsSection.addEventListener('click', (event) => {
            // Check if the clicked element or its parent is a buy button
            const buyButton = event.target.closest('.buy-generator-button');
            
            if (buyButton && buyButton.id) {
                // Extract generator ID from button ID (e.g., "buy-gen-1" -> "1")
                const parts = buyButton.id.split('-'); // ["buy", "gen", "1"]
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

    // Add Event Listener for the Toggle Button
    const toggleFreePurchasesButton = document.getElementById('toggle-free-purchases');
    if (toggleFreePurchasesButton) {
        toggleFreePurchasesButton.addEventListener('click', () => {
            gameData.debugFreePurchases = !gameData.debugFreePurchases;
            toggleFreePurchasesButton.textContent = `Free Purchases: ${gameData.debugFreePurchases ? 'ON' : 'OFF'}`;
            toggleFreePurchasesButton.style.backgroundColor = gameData.debugFreePurchases ? 'var(--color-secondary-accent)' : '#aaa'; // Example style change
            toggleFreePurchasesButton.style.color = gameData.debugFreePurchases ? 'white' : 'black';

            console.log(`Debug Free Purchases: ${gameData.debugFreePurchases}`);
        });
        // Initialize button style based on initial debug state
        toggleFreePurchasesButton.style.backgroundColor = gameData.debugFreePurchases ? 'var(--color-secondary-accent)' : '#aaa';
        toggleFreePurchasesButton.style.color = gameData.debugFreePurchases ? 'white' : 'black';
    }

    // Add Event Listeners for Multiplier Buttons
    const multiplierButtons = document.querySelectorAll('.multiplier-button');
    multiplierButtons.forEach(button => {
        button.addEventListener('click', () => {
            const multiplierValue = button.dataset.multiplier;
            if (multiplierValue === 'MAX') {
                gameData.currentBuyMultiplier = 'MAX';
            } else {
                gameData.currentBuyMultiplier = parseInt(multiplierValue, 10);
            }

            // Update active class on buttons
            multiplierButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            console.log(`Current Buy Multiplier set to: ${gameData.currentBuyMultiplier}`);
            updateUI(); // Update UI to reflect any changes if needed (e.g. if costs displayed were per batch)
        });
    });
});

console.log("Event listeners updated for multipliers, debug toggle, and dynamic buttons.");


// (Existing gameData, renderGeneratorElements, etc. should be above this)

// Ensure formatNumber and getGeneratorById are defined before updateUI
// (They should be from previous script versions)

function updateUI() {
    // Update Base Currency
    const baseCurrencyElement = document.getElementById('base-currency-count');
    if (baseCurrencyElement) {
        baseCurrencyElement.textContent = formatNumber(gameData.baseCurrency);
    }

    // Update Generators
    gameData.generators.forEach(generator => {
        const tierElement = document.getElementById(`generator-tier-${generator.id}`); // Used for .locked class
        if (!tierElement) {
            // This might happen if a generator is added to gameData but not yet rendered.
            // Or if called before renderGeneratorElements completes (unlikely with current setup).
            // console.warn(`UI element for generator tier ID ${generator.id} not found.`);
            return; // Skip this generator if its main container isn't found
        }

        const countElement = document.getElementById(`gen-count-${generator.id}`);
        const productionElement = document.getElementById(`gen-production-${generator.id}`);
        const producesWhatElement = document.getElementById(`gen-produces-${generator.id}`); // For the "produces what" text
        const buyButton = document.getElementById(`buy-gen-${generator.id}`);
        const costElement = document.getElementById(`gen-cost-${generator.id}`); // Span inside the button for cost number
        const costResourceElement = document.getElementById(`gen-cost-resource-${generator.id}`); // Span for cost resource name

        if (countElement) countElement.textContent = formatNumber(generator.count);
        
        if (productionElement && producesWhatElement) {
            let productionText = "";
            let producesWhatText = "";
            if (generator.producesResource === "baseCurrency") {
                productionText = formatNumber(generator.count * generator.productionPerSecond);
                producesWhatText = gameData.baseCurrencyName;
            } else if (generator.producesGeneratorId) {
                const targetGen = getGeneratorById(generator.producesGeneratorId);
                if (targetGen) {
                    productionText = formatNumber(generator.count * generator.productionPerSecond);
                    producesWhatText = targetGen.name + "s"; // Pluralize
                }
            }
            productionElement.textContent = productionText;
            producesWhatElement.textContent = producesWhatText;
        }

        let costResourceName = ""; // Declare here to use in button innerHTML update
        if (generator.tier === 1) { 
             costResourceName = gameData.baseCurrencyName;
        } else if (generator.resourceCostName) { 
             costResourceName = generator.resourceCostName;
        }

        if (costElement && costResourceElement) {
            costElement.textContent = formatNumber(generator.currentCost);
            costResourceElement.textContent = costResourceName;
        }
        
        // Handle unlocking and button state
        if (buyButton) {
            if (!generator.isUnlocked) {
                buyButton.disabled = true;
                tierElement.classList.add('locked');
                buyButton.textContent = "Locked"; // Simpler text for locked button
            } else {
                buyButton.disabled = false;
                tierElement.classList.remove('locked');
                // Restore button text to include dynamic cost and resource name
                // Ensure these spans exist from renderGeneratorElements
                const costSpanId = `gen-cost-${generator.id}`;
                const resourceSpanId = `gen-cost-resource-${generator.id}`;
                buyButton.innerHTML = `Buy ${generator.name} (Cost: <span id="${costSpanId}">${formatNumber(generator.currentCost)}</span> <span id="${resourceSpanId}">${costResourceName || gameData.baseCurrencyName}</span>)`;
            }
        }
    });
}

// Ensure the gameLoop calls the refactored updateUI
// (The gameLoop function definition itself might not need to change if it already calls updateUI())
// And ensure updateUI is called once after renderGeneratorElements in DOMContentLoaded
// (This should already be the case from the previous step)

console.log("updateUI function refactored for dynamic element IDs.");
