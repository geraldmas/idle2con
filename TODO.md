# TODO: Chaotic Idle Game Development Roadmap

This document outlines future development tasks and ideas for the chaotic idle game.

## 0. Instructions cahier des charges

*   **Gestion de la rapidité + monnaie**
    *   [ ] La rapidité doit être beaucoup plus difficile à obtenir. 
    *   [ ] Première couche de prestige lorsque le vaisseau atteint la vitesse de la lumière, similaire aux infinis dans exponential idle 
    *   [ ] Réfléchir aux mécaniques de prestige. La première couche est plutôt une introduction, celle-ci est celle où le vrai jeu commence. 

## I. Core Gameplay Enhancements

*   **BigNumber Implementation:**
    *   [x] Integrate a robust BigNumber library (e.g., `break_infinity.js`, `decimal.js`) to handle very large numbers that will inevitably arise in an idle game. This is crucial for long-term playability.
    *   [x] Refactor existing calculations (`baseCurrency`, generator `count`, `cost`, `production`) to use the chosen BigNumber library.
*   **Saving and Loading:**
    *   [x] Implement game state saving to LocalStorage.
    *   [x] Implement loading game state from LocalStorage on page load.
    *   [ ] Consider adding manual save/export and import options (e.g., as a text string).
*   **More Generator Tiers:**
    *   [~] Design and implement additional generator tiers (Tiers 1-4 implemented).
    *   [ ] Ensure the "N produces N-1" mechanic scales appropriately.
    *   [ ] Balance costs and production rates for new tiers.
    *   [x] Tier 1-4 names and roles to be updated for new theme.
*   **Unlock Mechanics Refinement:**
    *   [~] Implement more diverse unlock conditions for new generators or features (e.g., reaching a certain amount of a specific resource, owning X of multiple generator types, total time played).
    *   [x] Implement more diverse unlock conditions for new generators or features (e.g., reaching a certain amount of a specific resource, owning X of multiple generator types, total time played).
    *   [ ] Provide clear UI feedback for locked elements, showing unlock requirements.
    *   [x] Unlock conditions for Tiers 2, 3, and 4 implemented. (Assuming Tier 4 unlock was done)
*   **Offline Progress:**
    *   [x] Calculate progress made while the game was closed (based on `lastUpdate` timestamp).
    *   [x] Present offline gains to the player upon reloading the game.

## II. Speed of Light Theme Integration

*   [x] Define core thematic elements: JuLs (energy, 1 JuL = 10^-9 units of Rapidity φ), Ship Speed (v/c and raw v).
*   [x] Ensure Tier 1 ("JuL Harvester") directly produces JuLs. (Worker confirmed it was already correct, so task is complete).
*   [x] Display raw ship speed (v) in m/s.
*   [x] Rename existing generators and resources to fit the new theme.
*   [x] Implement Rapidity calculation and display.
*   [ ] Future: Explore mechanics related to relativistic effects (time dilation, length contraction) as potential prestige layers or boosts.
*   [ ] Future: Consider if specific ship components or research could unlock new abilities or improve efficiency, tying into the speed of light theme.

## III. UI/UX Improvements

*   **Dynamic Generator Display:**
    *   [x] Modify `script.js` to dynamically create HTML elements for generators from the `gameData.generators` array instead of having them hardcoded in `index.html`. This makes adding new tiers much easier.
*   **Number Formatting:**
    *   [x] Improve `formatNumber()` to use standard abbreviations for large numbers (K, M, B, T, aa, ab, etc.) or scientific notation.
*   **Notifications/Feedback:**
    *   [ ] Add a dedicated notification area for events like unlocking new tiers, affording new upgrades, or "not enough resources."
*   **Cost Indicators:**
    *   [ ] Visually indicate if a player can afford a purchase (e.g., button color changes).
*   **Detailed Stats Panel:**
    *   [ ] Create a more comprehensive statistics panel showing total production rates, counts of everything, time played, prestige currency, etc.
*   **Mobile Responsiveness:**
    *   [ ] Continuously test and refine responsiveness, especially as new UI elements are added. Ensure absurd elements don't break mobile layouts.

## IV. "Chaos" Element & Absurdity

*   **Chaotic Events (Optional):**
    *   [ ] Introduce random (but perhaps seeded/predictable for fairness) events that temporarily alter game rules or production rates (e.g., "A rogue anomaly just doubled your JuL production for 30 seconds!", "A paradigm shift has made Morphisms 10x cheaper!").
*   **Absurd Upgrades:**
    *   [ ] Design upgrades with humorous or nonsensical descriptions that still provide tangible benefits.
*   **Visual Absurdity:**
    *   [ ] Lean into the "absurd and grandiose" design. Are there more non-functional but visually entertaining elements to add? (Ensure they don't hinder performance too much).

## V. Code Quality & Refactoring

*   **Modularity:**
    *   [ ] Continue to separate concerns in JavaScript (e.g., UI update logic, game state logic, utility functions). Consider splitting into multiple JS files if `script.js` becomes too large.
*   **Comments and Documentation:**
    *   [x] Keep code well-commented, especially for complex logic or thematic tie-ins.
*   **Performance:**
    *   [ ] Profile performance as the game grows, especially the game loop and UI updates, to ensure it remains smooth.
*   **Specific Refactorings Completed:**
    *   [x] Refactor `calculateMaxBuy` to use a formula-based approach for performance.
    *   [x] Refactor `checkUnlocks` to be data-driven via `gameData.generators` for improved maintainability.
    *   [x] Handle negative `timeDelta` in `updateProduction` to prevent resource loss.
    *   [x] Standardize `formatNumber` behavior for small numbers (use exponential notation consistently).

This list is a starting point and will evolve as the game develops. Prioritize based on what feels most impactful for the next stage of development!

## VI. Idées secondaires à valider, non-urgent

This section lists ideas and potential improvements that are not critical but could be considered for future development cycles after discussion and validation.

*   **Save Data Migration/Compatibility:**
    *   [ ] Investigate strategies for handling saved game data from older versions if generator structures change significantly or if generators are removed. Currently, extra saved generators are ignored on load, and missing ones are added with defaults.
*   **Code Modularity (Further Steps):**
    *   [ ] Evaluate splitting `script.js` into multiple, more focused files (e.g., `game-logic.js`, `ui-updates.js`, `save-load.js`, `constants.js`) as complexity grows. This is a continuation of the existing modularity goal.
*   **Performance Monitoring of `calculateMaxBuy`:**
    *   [ ] The formula-based `calculateMaxBuy` includes a fallback to an iterative method in "catastrophic cases." Monitor if this fallback is triggered frequently, as it might indicate edge cases where the formula struggles or precision issues with very large/small numbers in the logarithmic calculation.
*   **Advanced Offline Progress Simulation:**
    *   [ ] For games with very complex interactions or production boosts that activate/deactivate, the current offline progress calculation (simple multiplication) might become inaccurate over very long periods. Consider if a more iterative or simulation-based offline calculation would be beneficial later.
*   **UI Feedback for Max Buy:**
    *   [ ] When 'MAX' buy is used, especially with the formula, it might not be immediately obvious to the player *why* a certain number was bought if they can't afford more (e.g., due to rapidly increasing costs). Consider if more feedback is needed (e.g., "Afforded X, next one costs Y").
*   **Refining `debugFreePurchases` Cap:**
    *   [ ] The `buyGenerator` function caps purchases at 1000 when `debugFreePurchases` is on and calculated amount is infinite. Evaluate if this cap is always appropriate or if it should be configurable/higher for debugging certain scenarios.
