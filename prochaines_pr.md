# Feuille de Route des Pull Requests pour Quantum Factory

## Introduction

Ce document organise les tâches restantes (identifiées dans `suite.md`) pour le développement de "Quantum Factory" en une série de Pull Requests (PRs) séquentielles. L'objectif est de fournir un chemin logique pour l'implémentation des fonctionnalités manquantes et des corrections.

---

## PR 1: Révision Fondamentale des Mécaniques de Ressources

*   **Objectif:** Ajuster les mécaniques de base de génération et d'acquisition des ressources pour s'aligner avec la spécification.
*   **Tâches Incluses:**
    *   **T1.1:** Clarifier/Implémenter l'effet de `dt` des particules sur la formule de potentiel. Décider si cela modifie le `dt` global du `TickService` (0.1s) ou agit comme un multiplicateur dans la formule.
    *   **T1.2:** Corriger les seuils d'acquisition des "États" pour qu'ils suivent la séquence `Potentiel = 2^((k-1)/FacteurSeuil)`.
    *   **T1.3:** Implémenter la monnaie "Points d'Observation". Le sacrifice de générateurs devrait rapporter ces points.

---

## PR 2: Ajustements des Générateurs

*   **Objectif:** Aligner les coûts, la croissance et la production des générateurs (en particulier G4) avec la spécification.
*   **Tâches Incluses:**
    *   **T2.1:** Vérifier et ajuster les coûts de base et les taux de croissance (pour "États" et générateurs précédents) pour G1-G4 dans `Generator.js`. Confirmer si les valeurs du code actuel sont la référence ou si la spec doit être suivie strictement.
    *   **T2.2:** Clarifier et implémenter la production du Générateur 4 (s'il produit des G3 ou débloque seulement des fonctionnalités).

---

## PR 3: Mécaniques d'Obtention des Particules et Coûts de Sacrifice

*   **Objectif:** Implémenter les coûts spécifiés et les probabilités pour l'obtention de particules.
*   **Tâches Incluses:**
    *   **T3.1:** Implémenter le coût du sacrifice de générateurs (10 unités) et sa croissance exponentielle (base 1.1) pour l'obtention de particules (ou de Points d'Observation, selon PR1).
    *   **T3.2:** Vérifier et/ou implémenter les probabilités d'obtention des particules de Génération 1, 2 et 3 en fonction du rang du générateur sacrifié.

---

## PR 4: Implémentation des Effets des Particules (Générations 1-3)

*   **Objectif:** Intégrer les effets de jeu pour toutes les particules des Générations 1, 2 et 3.
*   **Tâches Incluses:**
    *   Assurer que les effets des Électrons, Muons, Tau sur `dt` (voir T1.1) sont correctement appliqués.
    *   **T3.3:** Implémenter l'effet des Neutrinos (ajout d'un % des générateurs de rang 2, 3, 4 à `n` dans la formule du potentiel).
    *   **T3.4:** Implémenter l'effet des Quarks Up/Charm/Truth (boost de production pour G1).
    *   **T3.5:** Implémenter l'effet des Quarks Down/Strange/Beauty (réduction des coûts pour G2-G4, distinct du `costDivider` des antiparticules).

---

## PR 5: Implémentation des Effets des Particules Bosons (Génération 4)

*   **Objectif:** Intégrer les effets de jeu pour les particules de Génération 4 (Bosons).
*   **Tâches Incluses:**
    *   **T3.6:** Implémenter l'effet du Photon (augmentation de l'exposant de `dt`, distinct de l'effet antiparticule).
    *   **T3.7:** Implémenter les effets du Boson W/Z (réduction de coût pour G4, ajout d'un G4 gratuit ; clarifier l'effet "boost prod G4" si G4 ne produit rien).
    *   **T3.8:** Implémenter l'effet du Gluon (doublement de `a`, le `baseProduction` dans la formule du potentiel).

---

## PR 6: Système d'Améliorations (Facteur d'Échelle)

*   **Objectif:** Implémenter le système d'Améliorations, en commençant par "Facteur d'échelle".
*   **Tâches Incluses:**
    *   **T4.2:** Implémenter la logique d'achat, l'effet sur `a`, le coût en "Points d'Observation" (voir T1.3), et la croissance du coût pour "Facteur d'échelle".
    *   **T4.3:** Concevoir une structure de code générique pour faciliter l'ajout de futures améliorations.
    *   **T4.1/T6.1:** Développer l'interface utilisateur pour les améliorations dans la section "Progression" de `App.vue`.

---

## PR 7: Finalisation du Système de Prestige

*   **Objectif:** Vérifier et compléter les mécaniques du système de Prestige existant.
*   **Tâches Incluses:**
    *   **T5.1:** S'assurer que les conditions de déblocage du prestige (collecte de particules Gen 1-3 ET Potentiel > 1000) sont correctement implémentées.
    *   **T5.2:** Confirmer que la logique de reset du prestige conserve bien les particules bosons (Gen 4).
    *   **T5.3:** Vérifier l'exactitude du calcul de l'"Antipotentiel" (log10 du Potentiel).
    *   **T5.4:** Vérifier les coûts d'acquisition des antiparticules et leur croissance exponentielle.

---

## PR 8: Système d'Activation/Slots de Particules (Optionnel/À Discuter)

*   **Objectif:** Si nécessaire, concevoir et implémenter un système permettant d'activer ou de désactiver les effets de certaines particules, ou de limiter le nombre d'effets actifs.
*   **Tâches Incluses:**
    *   **T3.9:** Conception de la logique et développement de l'interface utilisateur pour la gestion des slots de particules actives.
*   **Note:** La nécessité de ce PR dépendra de l'impact cumulé des effets passifs des particules. Peut être reporté ou jugé non nécessaire.

---

## PR 9: Interface Utilisateur - Système de Tutoriel

*   **Objectif:** Implémenter des notifications guidées pour aider les joueurs à découvrir les fonctionnalités du jeu.
*   **Tâches Incluses:**
    *   **T6.2:** Développement du système de tutoriel.

---

## PR 10: Interface Utilisateur - Éléments Narratifs

*   **Objectif:** Intégrer les éléments narratifs prévus dans la spécification.
*   **Tâches Incluses:**
    *   **T7.1:** Ajout des phrases énigmatiques et du journal d'observation.

---

## Conclusion

Cette feuille de route est une proposition pour structurer le développement restant. Chaque PR peut être affinée, et des tests unitaires et d'intégration devront accompagner chaque développement. La communication et la validation après chaque PR seront essentielles pour assurer que le projet progresse conformément à la vision de "Quantum Factory".
