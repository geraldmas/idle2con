# Plan d'implémentation - Quantum Factory



## Phase 3 : Système de particules

### PR #7 : Collection de particules
- Création des classes de particules (Gén. 1, 2, 3)
- Système de stockage des particules
- Interface de collection
- Tests des particules

### PR #8 : Système d'observation
- Implémentation du sacrifice de générateurs
- Système de génération aléatoire de particules
- Logique de coûts d'observation
- Tests du système d'observation
- On ne peut sacrifier des générateurs de rang N que si on a au minimum un générateur de rang N+1

### PR #9 : Système de fusion
- Implémentation de la fusion de particules
- Logique de génération des bosons
- Interface de fusion
- Tests du système de fusion

## Phase 4 : Système de prestige

### PR #10 : Système de prestige de base
- Implémentation de la réinitialisation
- Conservation des particules fusionnées
- Système de déblocage des antiparticules
- Tests du prestige

### PR #11 : Système d'améliorations
- Implémentation du facteur d'échelle
- Système de points d'observation
- Interface des améliorations
- Tests des améliorations

## Phase 5 : Finalisation et polish

### PR #12 : Système de narration
- Implémentation des notifications guidées
- Système de journal d'observation
- Messages narratifs aux moments clés
- Tests de la narration

### PR #13 : Optimisation et performance
- Optimisation des calculs
- Gestion de la mémoire
- Amélioration des performances
- Tests de performance

### PR #14 : Documentation et finalisation
- Documentation technique
- Guide utilisateur
- Finalisation des tests
- Préparation au déploiement

## Notes importantes
- Chaque PR doit inclure des tests unitaires et d'intégration
- La documentation doit être mise à jour à chaque PR
- Les performances doivent être surveillées régulièrement
- L'interface utilisateur doit rester cohérente à travers toutes les PRs 

## Tâches accomplies

## Phase 1 : Structure de base et ressources fondamentales ✅

### PR #1 : Mise en place de l'architecture de base ✅
- Création de la structure MVC ✅
- Implémentation du système de sauvegarde (localStorage) ✅
- Configuration du système de build (webpack/vite) ✅
- Mise en place des tests unitaires de base ✅ 

### PR #2 : Système de ressources fondamentales ✅
- Création de la classe `Resource` pour gérer Potentiel et États ✅
- Mise en place du système de production de base (formule p(t+dt)) ✅
- Mise en place du système de ticks et de mise à jour ✅
- Tests unitaires pour les ressources ✅

### PR #3 : Interface utilisateur de base ✅
- Création du layout principal (3 sections) ✅
- Implémentation des composants de base (boutons, panneaux) ✅
- Mise en place du style scientifique ✅
- Tests d'intégration UI ✅

## Phase 2 : Système de générateurs

### PR #4 : Implémentation des générateurs de base ✅
- Création de la classe `Generator` ✅
- Implémentation du Générateur 1 avec sa logique de coût ✅
- Système de croissance exponentielle ✅
- Tests unitaires des générateurs ✅

### PR #5 : Système de progression des générateurs ✅
- Implémentation des Générateurs 2, 3 et 4 ✅
- Système de déblocage conditionnel ✅
- Logique de coûts et de croissance ✅
- Tests d'intégration des générateurs ✅

### PR #6 : Système de paliers de puissance ✅
- Implémentation des paliers (10, 100, 1000...) ✅
- Système de bonus de production ✅
- Interface de visualisation des paliers ✅
- Tests des paliers ✅