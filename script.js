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
    lastUpdate: Date.now()
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

function buyGenerator(generatorId) {
    const generator = getGeneratorById(generatorId);
    if (!generator) {
        console.error(`Generator with ID ${generatorId} not found.`);
        return;
    }

    if (!generator.isUnlocked) {
        console.log(`${generator.name} is not unlocked yet.`);
        // Optionally, provide user feedback on the UI
        return;
    }

    let canAfford = false;
    let costResourceName = "";

    if (generator.tier === 1) { // Assuming Tier 1 (Object Generator) is bought with baseCurrency
        costResourceName = gameData.baseCurrencyName;
        if (gameData.baseCurrency >= generator.currentCost) {
            gameData.baseCurrency -= generator.currentCost;
            canAfford = true;
        }
    } else if (generator.resourceCostName) { // Higher tiers bought with specified resources
        costResourceName = generator.resourceCostName;
        // For now, we only have "Objects" (baseCurrency) as a spendable resource for higher tiers
        // This part needs to be more generic if generators can cost other generators directly (not planned yet)
        if (generator.resourceCostName === gameData.baseCurrencyName) {
            if (gameData.baseCurrency >= generator.currentCost) {
                gameData.baseCurrency -= generator.currentCost;
                canAfford = true;
            }
        } else {
            // Placeholder for spending other types of resources (e.g., if a generator cost N-1 generators directly)
            // const resourceGenerator = gameData.generators.find(g => g.name === generator.resourceCostName);
            // if (resourceGenerator && resourceGenerator.count >= generator.currentCost) {
            //     resourceGenerator.count -= generator.currentCost;
            //     canAfford = true;
            // }
            console.warn(`Cost resource ${generator.resourceCostName} not handled yet for purchasing ${generator.name}`);
        }
    }

    if (canAfford) {
        generator.count++;
        generator.currentCost *= generator.costMultiplier;
        console.log(`Bought 1 ${generator.name}. New count: ${generator.count}, New cost: ${generator.currentCost.toFixed(2)}`);
        
        // Basic unlocking logic: Unlock Tier 2 after buying/owning some Tier 1 generators
        if (generator.id === 1 && gameData.generators[0].count >= 5 && !getGeneratorById(2).isUnlocked) {
            const tier2 = getGeneratorById(2);
            tier2.isUnlocked = true;
            console.log(`${tier2.name} Unlocked!`);
            // Potentially show a message to the user on the UI
        }

        updateUI(); // Update UI immediately after purchase
    } else {
        console.log(`Not enough ${costResourceName} to buy ${generator.name}. Needed: ${generator.currentCost.toFixed(2)}`);
        // Optionally, provide user feedback on the UI (e.g., disable button, show message)
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
});

console.log("Event listeners adjusted for dynamic buttons using event delegation.");


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
