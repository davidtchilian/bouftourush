# TODO

## Priorité : composer les équipements au rendu

Migration implémentée et validée avant extension du catalogue. Les équipements sont composés au rendu à partir de pièces Remastered indépendantes, dans le jeu et l’inventaire.

### Problème résolu

Le pipeline précomposait le Crâ pour chaque association coiffe/cape, dans chaque direction et animation, ainsi que pour les aperçus d'inventaire. Avec `H` coiffes et `C` capes, les possibilités sont `(H + 1) × (C + 1)`, en comptant les emplacements vides. Trois coiffes et trois capes donnent 16 possibilités ; cinquante de chaque donnent 2 601, avant multiplication par les frames et les directions. Le coût est quadratique avec deux emplacements et se multiplie lorsqu'on ajoute d'autres emplacements visuels.

### Architecture cible

Conserver les atlas, mais y stocker les pièces individuelles. Composer le personnage à l'exécution à partir du corps animé et des accessoires équipés. Ajouter une coiffe ou une cape doit nécessiter uniquement ses propres ressources et métadonnées, sans générer ses associations avec le catalogue existant.

- [x] Exporter séparément le corps du Crâ, les coiffes et les capes depuis les **SWF Dofus Retro Remastered uniquement**, avec directions, frames, durées, pivots et provenance.
- [x] Extraire les points d'attache et transformations utilisés par `GAC.applyAccessory` : position, matrice de rotation/échelle, direction, frame d'accessoire et profondeur pour chaque frame du personnage.
- [x] Préserver la hiérarchie et l'ordre d'affichage source. Découper le corps et les accessoires en couches lorsque nécessaire pour rendre les parties de cape derrière/devant le corps, les bras et la tête.
- [x] Reproduire le masquage des cheveux lors du port d'une coiffe à partir des informations originales. Éviter une simple superposition de trois images à positions fixes.
- [x] Faire évoluer le manifeste typé et sa validation pour décrire les pièces, couches, attaches, règles de visibilité et correspondances d'animation. Diagnostiquer explicitement les ressources ou métadonnées manquantes.
- [x] Adapter le renderer Three.js pour assembler les quads texturés et appliquer les transformations originales à chaque frame, tout en conservant le tri du personnage par rapport aux décors.
- [x] Partager les données et règles de composition entre le personnage en jeu et son aperçu d'inventaire. Conserver rotation, qualité haute définition et réduction des animations dans l'interface.
- [x] Répercuter immédiatement l'équipement et le retrait, sans précomposer ni stocker toutes les associations dans les aperçus UI.
- [x] Garder la simulation indépendante du rendu et préserver sauvegardes, statistiques, bonus de panoplie, sac et revente des doublons.

### Migration et validation

- [x] Commencer par une tranche complète : Crâ avec une coiffe et une cape, dans toutes les directions et les états idle/course/tir/buff/réaction/mort, puis intégrer les autres pièces.
- [x] Comparer visuellement la composition aux exports actuels de référence : attaches, proportions, masquages, profondeur, changements de direction et continuité des animations.
- [x] Vérifier les équipements mixtes, les emplacements vides, l'équipement au double-clic et le retour des objets retirés dans le sac.
- [x] Comparer les aperçus d'inventaire au personnage en jeu, sur ordinateur et petit écran. Réexporter les vecteurs à la définition nécessaire ; ne pas agrandir des PNG insuffisamment définis.
- [x] Mesurer taille des atlas, temps d'import/chargement, mémoire CPU/GPU, nombre de quads/appels de dessin et fluidité avec plusieurs ennemis. Un catalogue de 50 coiffes et 50 capes doit rester exploitable sans exporter 2 601 personnages complets.
- [x] Ajouter les tests pertinents des attaches, de la sélection des frames, de la visibilité et du changement d'équipement ; exécuter build, tests existants et vérification hors connexion.
- [x] Après validation, supprimer les exports cartésiens `appearance.*` et leurs équivalents d'aperçu, régénérer les atlas utilisés et mettre à jour `docs/ASSETS.md` et `docs/ARCHITECTURE.md`.

Le volume de ressources doit alors croître essentiellement avec les pièces ajoutées et leurs animations, plutôt qu'avec toutes leurs associations. Les décors restent immobiles ; aucun visuel Classic, généré ou de substitution n'est autorisé.


### Résultat vérifié

- 24 timelines Crâ ; six coiffes/capes et l’arc indépendants ; aucune séquence cartésienne distribuée.
- Images du lot complet : 91,22 → 43,23 Mo ; 14 atlas de jeu et huit atlas de portraits séparés.
- Tests des attaches, des masques, des cheveux, des cycles et du changement d’équipement ; parcours de 2 500 associations pour un catalogue de 50/50 par références, sans export combinatoire.
- Build, validation des assets, 40 tests Vitest, sept tests Python, dix scénarios navigateur et scénario hors connexion vérifiés. Les assertions de survol ont été alignées sur le pseudo-élément original des boutons.
- Captures de l’inventaire vérifiées sur ordinateur et à 390 px de large ; rendu Three.js vérifié sur toutes les animations, y compris les frames masquées de mort.
- Sources, paramètres, mesures et limites détaillés dans `docs/ASSETS.md` ; fonctionnement décrit dans `docs/ARCHITECTURE.md`.
