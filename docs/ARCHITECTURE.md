# Architecture

`src/game/core/simulation.ts` contient la simulation autonome. Elle reçoit manifeste, profil, graine de hasard et fonction de persistance ; aucun DOM, Three.js ou React n’y entre. Les tables de classes, sorts, ennemis, donjons, objets et panoplies sont dans `src/data/`. La classe Crâ est injectée via une définition de classe ; ajouter une classe du même modèle ne demande pas de réécrire les règles de dégâts, progression ou loot.

Le pas fixe est de 1/60 s, avec rattrapage borné à 100 ms par image après une longue suspension d’onglet. Le renderer Three.js utilise une caméra orthographique et uniquement des quads texturés par les exports originaux. Les monstres, projectiles, réactions et cadavres sont issus de l’état de simulation. Les textures partagent des atlas et les régions UV sont immuables. Les ressources des entités expirées et celles d’une scène démontée sont libérées.

Les cartes exposent positions de départ, points d’apparition des ennemis, cellules de navigation et couches de décor. Ces valeurs sont écrites dans le manifeste par le compilateur à partir des champs source et de règles de préparation éditables ; aucune collision n’est inférée des pixels. A* utilise un index spatial et des connexions mises en cache. La simulation suit des segments continus et teste la traversabilité à chaque pas. Les monstres ont une séparation locale pour éviter les empilements.

Le tri de profondeur suit la cellule des pieds, comme les objets de premier plan du client. Le cadrage source 742 × 432 est conservé et masqué à ses bords. Un ResizeObserver recalcule la caméra lorsque le HUD ou la fenêtre change la taille du viewport.

React ne gère que HUD, inventaire, sélection de donjon et messages. Zustand publie un instantané à 10 Hz ; la simulation reste à 60 Hz. Les contrôles de déplacement et AZER sont attachés au viewport et à la fenêtre. Le navigateur ne crée aucune image de remplacement. Les cadres de l’interface sont composés par découpe neuf zones de la cellule d’inventaire originale, les icônes viennent des SWF d’objets.

## Pipeline local

1. `prepare-hub.py` lit la carte Astrub publique non chiffrée, décode ses cellules et exporte sols, objets et les vues Crâ.
2. `prepare-game.py` ajoute les deux arènes, sept sprites de monstres, les cast/hit/death Crâ, quatre sorts et leurs clips, vingt objets et les éléments UI. Les signatures des sources invalident les conversions mises en cache.
3. `prepare-appearance.py` délègue à `prepare-composition.py` : export séparé des couches du corps, des coiffes, capes et de l’arc. Le parcours résout les symboles SVG imbriqués et conserve matrices, ordre source, cheveux conditionnels et masques. `rasterize-appearance.ts` recadre les pièces et icônes sans dessiner de remplacement.
4. `pack-atlas.ts` assemble les PNG sans redessiner leur contenu, dans `atlases/game/` et `atlases/previews/` (option `--previews`). Il sait réextraire les régions d’anciens atlas pour les reconstruire sans leurs associations supprimées. Les frames gardent leurs durées, pivots, régions UV, vues natives et provenance. Les décors sont figés sur leur première frame.
5. `assets:import` valide le répertoire, prépare une copie intermédiaire, puis remplace le dossier public. Les liens sortants et chemins non locaux sont refusés. Le serveur Vite fournit les fichiers nouvellement importés sans dépendre de son index public, mal invalidé par les renommages NTFS.

Les archives et exports intermédiaires restent ignorés par Git. Le lot runtime PNG/atlas et manifeste de `public/assets/` est versionné à la demande explicite de l’utilisateur. Les outils ne lancent pas l’ActionScript du client et n’obtiennent aucune clé serveur.

## Hors connexion

Le build produit une liste des fichiers distribués et une révision de service worker. Après un premier chargement en production, le worker précharge le shell et tous les assets installés. Le HUD affiche « Hors connexion prêt » une fois activé. Le cache ignore les variations d’en-têtes de développement pour ces seuls fichiers statiques locaux ; aucun endpoint authentifié ou compte n’existe. Les anciennes révisions sont supprimées après activation de la nouvelle.

En développement, aucun service worker n’est installé. `pnpm build` puis `pnpm preview` permettent de tester le mode hors connexion. Le versionnement demandé du lot runtime n’établit pas de droits de redistribution ; conserver les notices de provenance et restrictions décrites dans `docs/ASSETS.md`.

## Inventaire et sélection des donjons

`InventoryPanel` présente l’équipement autour d’un aperçu Crâ à gauche du sac, avec rotation, filtres de panoplies, détails et bonus actifs/prochains. `DungeonPanel` déduit le gardien de la vague de boss définie dans les données et présente son sprite, son animation au survol et le butin associé. `AssetSprite` découpe les atlas haute définition en HTML, précharge leurs pages et anime les frames indépendamment de la simulation mise en pause. Aucun contexte WebGL supplémentaire ni dessin de substitution.

`prepare-ui-previews.py` prépare les portraits des boss depuis les vecteurs, à six fois la définition de base. `CharacterSprite` assemble les pièces du Crâ exportées à dix fois la définition native, indépendamment des pièces de jeu exportées à trois fois cette définition. Les cadres portrait et sélection viennent de `modules/core.swf`.

Les boutons d’action utilisent les skins orange `ButtonNormalUp` et `ButtonNormalDown`. `compose-ui-buttons.ts` assemble leurs trois parties originales ; CSS les étire horizontalement en gardant les extrémités arrondies. Les filtres et détails de l’inventaire partagent ces états. Les emplacements vides du sac sont composés avec les véritables cellules d’inventaire.

## Composition des équipements au rendu

`manifest.composition` décrit 24 timelines du Crâ, avec les durées source et une liste ordonnée de couches par frame. Une couche référence soit un morceau du corps, soit un emplacement `hat`/`cape`/`bow` avec son label directionnel GAC. Chaque attache contient la matrice affine Flash `[a,b,c,d,tx,ty]` cumulée à travers ses parents et l’identifiant du clip source. Les ressources des accessoires sont indexées par objet et vue ; aucune association coiffe/cape n’est exportée.

`composeActor` est partagé par Three.js et `CharacterSprite`. La sélection des accessoires imbriqués suit le numéro de frame du corps, comme les exports de référence. Le port d’une coiffe cache uniquement les couches nommées `Cheveux` par la source. Les autres parties, dont la mèche, gardent leur visibilité source. Les transformations et l’ordre autour des bras, de la tête et du corps ne sont pas remplacés par trois positions fixes.

Three.js convertit les matrices Flash (y descendant) vers le monde (y ascendant), applique le miroir directionnel au personnage entier et place ses quads dans un intervalle de profondeur réservé à la cellule des pieds. Le masque de disparition de mort reste une ressource issue du SWF : `compositionMask.ts` l’applique aux accessoires dans le repère du corps ; les couches du corps conservent leurs masques SVG à la conversion. Les frames entièrement vides de fin de mort restent vides. Un nouveau type de filtre, masque imbriqué ou transformation non pris en charge arrête explicitement l’import.

Le portrait utilise les mêmes données, avec les pièces `preview.piece.*`, leurs pivots, matrices et règles de visibilité. Le cadrage est calculé sur l’ensemble de la timeline et reste stable entre frames. Les pages HD sont préchargées et le mouvement réduit fige la première frame. L’équipement et son retrait changent les références au rendu suivant ; sauvegarde, statistiques, bonus, sac et revente restent dans la simulation existante.

La taille du catalogue croît avec la somme des ressources des pièces. Ajouter une coiffe n’ajoute ni corps, ni cape, ni portrait complet. Un test parcourt 2 500 associations d’un catalogue de 50 coiffes et 50 capes sans ajouter de ressource. Les diagnostics vérifient les couches, labels directionnels, masques, pièces HD et matrices manquants.

`pnpm assets:compare` compare localement les compositions aux anciens SVG conservés dans le cache privé. `pnpm assets:measure` mesure le chargement, les frames, les appels de dessin et la mémoire JS avec le serveur de développement sur le port 4173. Les statistiques GPU de Three.js sont exposées dans `canvas.dataset.renderStats`. Les chiffres de validation sont consignés dans `docs/ASSETS.md`.

## Remise à zéro locale explicitement demandée

En développement uniquement, `applyDevelopmentReset` consulte une requête privée dans `.local-assets/profile-reset.json`, via le serveur du jeu sur le port 5173. Un identifiant unique est mémorisé dans le navigateur après remplacement du profil par `newProfile()` ; les chargements suivants conservent les nouveaux progrès. Le navigateur accuse réception dans `.local-assets/profile-reset-applied.json`. Ces fichiers restent ignorés, aucun reset n’est actif sans requête locale, et le mécanisme est exclu du build de production et des serveurs de test sur d’autres ports.


## Interface moderne et cadrage intégral (2 novembre 2026)

À la demande explicite du joueur, l’interface abandonne les fonds kaki et boutons Retro au profit d’un habillage CSS sombre (ardoise, texte clair, accents sauge et ambre). Cette exception concerne l’interface ; les illustrations, icônes et graphismes du monde conservent leur source Remastered 1.40.13. Les survols, sélections, états désactivés, focus clavier et préférences de mouvement réduit sont pris en charge.

Le document réserve deux zones en flex : viewport du monde et barre de sorts. La barre du haut a été supprimée à la demande du joueur ; les menus et le suivi des vagues sont regroupés en bas. La barre du bas ne recouvre jamais la carte. `fitMapView` adapte la caméra orthographique au ratio du viewport : sa hauteur contient à la fois la hauteur des limites de carte, `cameraHeight` et la hauteur nécessaire pour voir toute sa largeur. Le cadrage n’applique ni zoom de remplissage ni découpe pour éviter les marges. Sur mobile en portrait, les marges sont nécessaires pour préserver toute la carte. Les menus et l’aide peuvent recouvrir la scène temporairement.

Les tests de caméra vérifient les quatre limites avec plusieurs ratios ; le smoke test HUD vérifie aussi que le canvas reste du haut de l’écran jusqu’à la barre du bas sur ordinateur et petit écran.
