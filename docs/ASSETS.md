# Assets locaux — état du 2 novembre 2026

Source visuelle choisie à la demande de l’utilisateur : **Dofus Retro Remastered 1.40.13**. Elle remplace la cible initiale 1.29.1 pour cette version du projet ; ce n’est pas une affirmation d’identité exacte avec les graphismes 1.29. Le Remastered remplace le Classic précédemment installé, en conservant les identifiants des personnages, monstres, sorts, objets et décors.

Projet gratuit non commercial, non affilié à Ankama. **Aucune autorisation de redistribution des graphismes n’est établie.** À la demande explicite de l’utilisateur, les PNG, atlas et le manifeste prêts pour le jeu sont désormais versionnés dans `public/assets/`. Les archives, textes décompilés, outils et exports intermédiaires restent locaux et ignorés par Git. Cette décision de stockage ne constitue pas une autorisation des ayants droit. Aucun client n’a été lancé, aucune connexion de compte effectuée, aucune clé de carte récupérée ou contournée.

## Sources effectivement récupérées

| Source | Archive locale | Volume / empreinte SHA-256 |
| --- | --- | --- |
| [Dofedex au commit ec4c08459f73f058294c34baa6baa739f9373753](https://github.com/dofera/dofedex/tree/ec4c08459f73f058294c34baa6baa739f9373753) | `.local-assets/dofedex-master.zip` | 86 364 entrées, 3 152 672 207 octets décompressés ; `35659da292e6bb4dc7762bf204c0527348976202fbb85935400d2fbbdc2523ff` |
| [Client Classic 1.40.13](https://github.com/dofera/dofedex/releases/download/1.40.13/dofus-1.40.13-classic.zip) | `.local-assets/dofus-1.40.13-classic.zip` | 239 372 174 octets ZIP ; `178ca90d276d10dd9c6bd1d8b4ba17f9804da04fc80c52dad4876fa53ce81fcd` |
| [Client Remastered 1.40.13](https://github.com/dofera/dofedex/releases/download/1.40.13/dofus-1.40.13-remastered.zip) | `.local-assets/dofus-1.40.13-remastered.zip` | 474 901 966 octets ZIP ; `aa9bccb901feb8bc06c16464c36ffbef1a46f8db27ce497bf252b9bd8c5d42d5` |
| [JPEXS FFDec 26.4.0](https://github.com/jindrapetrik/jpexs-decompiler/releases/tag/version26.4.0) | `.local-assets/tools/ffdec/ffdec.jar` | Outil local de lecture/export SWF, Java 11 utilisé |

Le premier client Classic reste extrait dans `.local-assets/client-1.40.13-classic/` : 20 271 fichiers, dont 20 230 SWF, 9 537 fichiers de carte et 5 948 fichiers dans `clips/items/`. Le catalogue inspecte 1 154 SWF de sprites.

Le client Remastered est extrait dans `.local-assets/client-1.40.13-remastered/` (20 453 entrées ZIP). Les 34 fichiers sources utilisés auparavant existent aux mêmes chemins : 20 diffèrent et 14 sont identiques, dont certaines icônes. Le relevé local `.local-assets/remastered-audit.json` conserve leurs empreintes comparées.

Le dépôt Dofedex complet est extrait dans `/home/david/.cache/bouftourush/ec4c08459f73f058294c34baa6baa739f9373753/dofedex-master/`, accessible par le lien `.local-assets/dofedex`. Le système de fichiers Linux évite la lenteur de 86 000 créations sur NTFS. Les inventaires et empreintes complets restent dans `.local-assets/dofedex-provenance.json`, `.local-assets/client-1.40.13-catalog.json` et `.local-assets/gfx-ui-catalog.json`.

Les fichiers de langue Dofedex ont leurs propres versions de tables, sans certifier une synchronisation exacte avec le client 1.40.13. Les sources ActionScript du loader servent de référence de format ; elles ne sont pas exécutées.

## Registre des graphismes intégrés

Les chemins ci-dessous sont ceux réellement vérifiés sur disque. Le manifeste du jeu associe chaque identifiant sémantique aux frames, régions d’atlas, pivots, échelles, offsets, durées et provenance : `.local-assets/game-runtime/manifest.json`, puis `public/assets/manifest.json` après import.

| Besoin / identifiant | Source originale | Conversion et intégration |
| --- | --- | --- |
| Crâ / `cra.idle.*`, `cra.run.*` | `clips/sprites/90.swf` | Cinq vues natives S/R/F/L/B et miroirs conformes au loader ; huit directions intégrées |
| Crâ cast/buff/hit/death | `clips/sprites/90.swf`, symboles `anim0R/L`, `anim10R/L`, `hitR/L`, `dieR/L` | Tir à l’arc `anim10R/L`, incantation du buff `anim0R/L`, hit/death ; timelines intégrées |
| Bouftou / `mob.1566.*` | `clips/sprites/1566.swf` | Idle, run, attack, hit, death, vues R/L |
| Bouftons / `mob.1570.*`, `mob.1571.*` | `clips/sprites/1570.swf`, `1571.swf` | Mêmes cinq états ; variantes jeunes d’Incarnam définies comme archétypes séparés |
| Chef / `mob.1573.*` | `clips/sprites/1573.swf` | Cinq états intégrés |
| Royal / `mob.1574.*` | `clips/sprites/1574.swf` | Cinq états intégrés ; boss Bouftou |
| Milimilou / `mob.1581.*` | `clips/sprites/1581.swf` | Cinq états intégrés ; `monsters_fr_1160.swf` : `M[1001]`, nom Milimilou, `g:1581`. Le XML le nomme « Milou » ; ne pas confondre avec Milimulou `1107.swf` |
| Chafer Prépubère / `mob.1014.*` | `clips/sprites/1014.swf` | Cinq états ; identité d’Incarnam confirmée dans la table monstres |
| Crabe / `mob.1009.*` | `clips/sprites/1009.swf` | Cinq états ; monstre du Donjon Ensablé |
| Étoile de la Mer d’Asse / `mob.1474.*` | `clips/sprites/1474.swf` | Cinq états ; monstre du Donjon Ensablé |
| Pichons / `mob.1483.*` à `mob.1488.*` | `clips/sprites/1483.swf`…`1488.swf` | Idle, course, attaque, hit, death ; `1483` sans `anim2`, attaque via `anim0` |
| Raul Mops / `mob.1481.*` | `clips/sprites/1481.swf` | Cinq états ; garde du boss Ensablé |
| Mob l’Éponge / `mob.1546.*` | `clips/sprites/1546.swf` | Boss du Donjon Ensablé ; absence de symboles `run`, repli sur `walk` |
| Magique / `spell.magic.*` | `clips/spells/902.swf`, `move`, `shoot` | Projectile et impact animés |
| Enflammée / `spell.flaming.*` | `clips/spells/909.swf`, sprites internes 22 et 41 | Ligne de lancement et impact animés, placement/direction par le moteur |
| Puissant / `spell.power.cast` | `clips/spells/904.swf`, sprite interne 14 | Effet de buff original, sprite 14 vérifié dans le Remastered ; déplacement repris après l’incantation |
| Explosive / `spell.explosive.*` | `clips/spells/910.swf`, `move`, `shoot` | Projectile et explosion animés |
| Cadres/boutons/slots / `ui.window`, `ui.button`, `ui.slot` | `modules/core.swf`, `UI_InventoryGridBackground`, character ID 1226 | Cellule originale 32 × 32, composée en neuf zones ; aucune couleur de remplacement dessinée |
| Vie / `ui.heart` | `modules/core.swf`, `Heart`, character ID 872, première pose | Icône originale du HUD ; Vie/cooldowns/durée du buff en texte |

Les correspondances sort → animation sont confirmées dans les lignes des sorts 161/165/166/179 du [fichier de données Ancestra-Evolutive](https://github.com/Romain-P/Ancestra-Evolutive/blob/master/sql/ancestra-evolutive-full.sql), table `sorts`, champ `sprite` : respectivement 902/909/904/910. Cette source sert à la correspondance d’identifiants ; **les graphismes restent ceux du client Dofedex**. Le dump téléchargé reste privé sous `.local-assets/ancestra.sql` et n’est pas exécuté.

L’identité du boss Incarnam est corroborée par les données locales Milimilou et le [guide du donjon pour Dofus 1.29](https://guidedofus.com/donjon-dincarnam/). Les groupes et statistiques du fangame restent des adaptations, sans prétention canonique.

### Cartes, sols et décors

| Carte | Donnée publique non chiffrée utilisée | État |
| --- | --- | --- |
| Astrub zaap 7411 | Dofedex `maps/7411/7411_0612131401.swf` | 89 couches, 293 cellules de navigation, départ devant le zaap |
| Incarnam 10360 | Dofedex `maps/10360/10360_0703281543.swf` | Arène de 162 couches, 148 cellules de navigation et huit points d’apparition |
| Bouftou 2073 | Dofedex `maps/2073/2073_0505170920.swf` | Arène de 288 couches, 202 cellules de navigation et huit points d’apparition |
| Ensablé 10155 | Dofedex `maps/10155/10155_0701221531.swf` | Arène de 153 couches, 186 cellules de navigation et huit points d’apparition ; variante `X` chiffrée non utilisée |

Les bibliothèques de dessin viennent de `clips/gfx/g1.swf`, `g2.swf`, `o1.swf`…`o12.swf`, selon l’identifiant de chaque cellule. Le fond Astrub est le symbole `71` de `g1.swf` (character ID 513) ; ce fond seul n’est pas la carte. Les objets, flips et rotations isométriques sont reconstruits depuis les données. Tous les décors restent figés sur leur première frame, végétation comprise, à la demande de l’utilisateur. Le tri respecte les couches sol/objet1/objet2 et la cellule des pieds.

Les tables `maps_fr_366.swf` et `hints_fr_1166.swf` associent Astrub 7411 à `[4,-19]`, Cité d’Astrub, et au zaap. La table des donjons `dungeons_fr_1170.swf` associe les salles 2073…2077 et 2079…2084 au donjon Bouftou. L’entrée Incarnam 10359 est identifiée par les hints. Le gameplay utilise une salle comme arène de vagues par donjon, sans reproduire le parcours des salles originales.

Les variantes récentes suffixées `X`, dont `data/maps/7411_0711291819X.swf`, contiennent des données chiffrées. **Elles ne sont pas déchiffrées par le projet.** Les dispositions historiques sont distinctes de ces cartes récentes et ne sont pas présentées comme une reproduction exacte.

### Objets et panoplies

Identités et liens `t`/`g` vérifiés dans `lang/fr/items/items_fr_450.swf`. Les statistiques et drops du fangame sont définis séparément dans `src/data/items.ts` et `src/data/monsters.ts`.

| Objet / identifiant | Source d’icône | État |
| --- | --- | --- |
| 2411 Coiffe du Bouftou | `clips/items/16/41.swf` | Icône, slot, stats, panoplie intégrés |
| 2414 Cape Bouffante | `clips/items/17/44.swf` | Idem |
| 2416 Marteau du Bouftou | `clips/items/7/23.swf` | Idem |
| 2419 Anneau de Bouze le Clerc | `clips/items/9/44.swf` | Idem, deux slots d’anneau |
| 2422 Boufbottes | `clips/items/11/26.swf` | Idem |
| 2425 Amulette du Bouftou | `clips/items/1/48.swf` | Idem |
| 2428 Ceinture du Bouftou | `clips/items/10/29.swf` | Idem |
| 2473 Cape de l’Aventurier | `clips/items/17/48.swf` | Icône, slot, stats, panoplie intégrés |
| 2474 Chapeau de l’Aventurier | `clips/items/16/44.swf` | Idem |
| 2475 Anneau de l’Aventurier | `clips/items/9/48.swf` | Idem |
| 2476 Bottes de l’Aventurier | `clips/items/11/32.swf` | Idem |
| 2477 Ceinture de l’aventurier | `clips/items/10/33.swf` | Idem |
| 2478 Amulette de l’Aventurier | `clips/items/1/52.swf` | Idem |
| 8253 Amulette en Mousse | `clips/items/1/106.swf` | Icône, slot, stats, panoplie Ensablé intégrés |
| 8254 Anneau en Mousse | `clips/items/9/112.swf` | Idem, deux slots d’anneau |
| 8255 Pelle en Mousse | `clips/items/8/44.swf` | Idem |
| 8256 Bottes en Mousse | `clips/items/11/84.swf` | Idem |
| 8257 Ceinture en Mousse | `clips/items/10/102.swf` | Idem |
| 8258 Cape en Mousse | `clips/items/17/109.swf` | Icône et panoplie Ensablé ; portée via `a2.swf#17_109` |
| 8259 Coiffe en Mousse | `clips/items/16/143.swf` | Icône et panoplie Ensablé ; portée via `a1.swf#16_143` |

Le bouclier 7077 de la panoplie n’est pas proposé, faute d’emplacement bouclier. Les huit emplacements visibles sont coiffe, cape, amulette, deux anneaux, ceinture, bottes et arme. Les coiffes et capes sont visibles sur Crâ : `a1.swf#16_41`, `16_44`, `16_143` et `a2.swf#17_44`, `17_48`, `17_109` dans `clips/sprites/accessories/`. Les matrices et profondeurs des clips `GAC.applyAccessory` servent à la composition, avec vues directionnelles et cycles de course de cape. Le tir utilise l’arc original `a4.swf#2_1` ; la table d’objets associe les arcs à `an:10`. Les icônes sont recadrées sur le dessin original avec fond transparent, au lieu d’afficher la scène Flash entière. Le slot familier n’est pas proposé. Les icônes des quatre sorts sont intégrées depuis `clips/spells/icons/up/{161,165,166,179}.swf` dans cette même archive Remastered. La précédente recherche omettait le sous-dossier `up` ; il ne s’agissait pas de ressources absentes.

## Préparation et validation reproductibles

Prérequis : Node/pnpm, Python 3.11+ (3.12 utilisé), Java 11+, JPEXS 26.4.0 et Chromium Playwright. Aucune bibliothèque Python externe.

Arborescence attendue :

```text
.local-assets/
  client-1.40.13-remastered/       # clips/, modules/, data/ à ce niveau
  dofedex/                    # maps/, lang/, loader/ à ce niveau, dossier ou lien local
  tools/ffdec/ffdec.jar
```

Sur un nouveau clone, fournir localement des sources dont vous êtes autorisé à faire cet usage, puis extraire aux chemins ci-dessus. Le dépôt Dofedex peut être réacquis avec les liens des sources ou le ZIP du commit : `https://codeload.github.com/dofera/dofedex/zip/ec4c08459f73f058294c34baa6baa739f9373753`. L’empreinte du ZIP du commit peut différer de celle du ZIP master même si son contenu correspond ; vérifier le commentaire de commit et les fichiers.

```sh
pnpm install
pnpm exec playwright install chromium
pnpm assets:prepare:game
pnpm assets:import .local-assets/game-runtime
pnpm assets:validate
pnpm dev
```

La préparation complète exporte les séquences de jeu, pièces d’équipement indépendantes et aperçus UI, puis les assemble dans des atlas 2048 × 2048. Le manifeste installé indique le nombre exact de séquences, de frames et les pages utilisées. Les icônes d’objets et éléments UI restent en PNG individuels. La composition conserve les graphismes originaux ; les bordures d’atlas sont dupliquées pour éviter les fuites UV.

Les étapes sont `prepare-hub.py`, `prepare-game.py`, `prepare-appearance.py` (entrée de `prepare-composition.py`), `rasterize-appearance.ts`, `prepare-ui-previews.py`, `rasterize-appearance.ts --previews`, puis `pack-atlas.ts` pour le jeu et avec `--previews` pour les portraits. Les pivots sont extraits des transformations SVG originales ; les arrêts littéraux `stop()` sont pris en compte pour éviter les queues vides. Les vues natives et leurs miroirs sont conservés, sans inventer des directions inexistantes. Les caches de conversion sont invalidés par les empreintes des fichiers et les paramètres d’export. Le cache de rasterisation vérifie les empreintes des SVG et des PNG produits ; il ne considère pas les icônes brutes recopiées par le préparateur comme déjà recadrées.

L’import valide d’abord les sources, prépare un dossier intermédiaire et ne copie que les fichiers référencés dans le manifeste. `.local-assets/` reste ignoré. Le lot converti de `public/assets/` est versionné à la demande explicite de l’utilisateur pour faciliter les nouvelles installations ; ses mentions de provenance et restrictions de redistribution restent inchangées. Aucun binaire n’est enregistré en localStorage.

### Inspection et exports de recherche

Ces commandes restent disponibles indépendamment du préparateur de jeu :

```sh
pnpm assets:inspect .local-assets/dofus-1.40.13-remastered.zip --output .local-assets/client-1.40.13-catalog.json
pnpm assets:export .local-assets/client-1.40.13-remastered --client-version 1.40.13-remastered
```

Le premier lot de recherche, `.local-assets/exports-1.40.13/`, contient 46 séquences et 605 PNG avec pivots non résolus. Ce manifeste de recherche n’est pas le manifeste de jeu. `assets:prepare` reste disponible pour préparer seulement le hub de base ; l’importer remplace le jeu complet par ce jalon limité.

### Contrat du manifeste

`src/game/assets/manifest.ts` décrit les frames, durées, pivot normalisé depuis le coin supérieur gauche, taille en unités monde, offset, bouclage, flip, et provenance source/version/fichier/conversion/conditions d’usage. Une frame d’atlas contient `region: [x, y, largeur, hauteur, largeurPage, hauteurPage]` en pixels. Sans région, le PNG entier est utilisé.

Les cartes contiennent bornes de cadrage, spawn joueur, couches ordonnées, cellules de navigation et spawns ennemis. Les coordonnées Y montent dans le monde ; les données de carte d’origine sont converties depuis leur axe Y descendant. Les bornes visuelles seules ne sont pas une collision.

La classification des objets et les décisions de navigation sont décrites dans `scripts/map-navigation.json`, puis appliquées aux préparateurs d’Astrub et des donjons avant le choix des spawns. Le lot runtime versionné contient les mêmes corrections. `assets:validate` vérifie aussi cette navigation avec Python 3 : objets connus, décisions par cellule, empreinte du placement, obstacles bloquants et exclusions de bord. Les graphismes, leur disposition et leurs provenances restent inchangés. Voir [la revue des collisions](NAVIGATION.md) pour les critères et les résultats par carte.

Le contrat minimal exige Astrub et idle/run Crâ dans huit directions. Avec `gameplayReady: true`, les cartes, monstres, sorts, icônes et éléments UI de ce MVP sont également obligatoires. Le validateur vérifie schéma, régions, chemins relatifs, fichiers locaux, signature PNG et provenance déclarée ; il ne certifie ni droits ni authenticité artistique.

## Limites visuelles restantes

Le moteur joue les graphismes et timelines convertis, sans émulation complète d’ActionScript. Les particules aléatoires pilotées par code, sons et personnalisations de couleurs ne sont pas reproduits intégralement. Les cartes restent des reconstructions historiques avec bibliothèques Remastered 1.40.13. Aucun graphisme de remplacement, art généré, emoji ou forme procédurale visible n’est utilisé pour masquer ces limites.

## Aperçus des nouvelles interfaces

- `ui.portrait` : `modules/core.swf#LookSelectorBackground` (1109), cadre original des portraits.
- `ui.selection` : `modules/core.swf#UI_InventoryGridHighlight` (1224), sélection originale de grille.
- `preview.cra.idle.*` et `preview.appearance.*.cra.idle.*` : mêmes vecteurs du Crâ et accessoires, rasterisés à six fois la définition de base, en huit directions.
- `preview.mob.1574.{idle,attack}.R` et `preview.mob.1581.{idle,attack}.R` : vecteurs originaux du Bouftou Royal et du Milimilou, mêmes animations que le jeu.

`prepare-ui-previews.py`, puis `rasterize-appearance.ts --previews`, préparent les séquences de portraits. Le script `assets:prepare:game` inclut ces étapes. Les aperçus utilisent des découpes CSS des atlas originaux, sans dessin de remplacement ni second contexte WebGL. Les pages nécessaires sont préchargées avant l’animation, qui respecte la réduction des animations du navigateur. Les textures des aperçus ne sont pas chargées par le moteur de jeu.

## Boutons orange Retro

Les boutons d’action utilisent `modules/core.swf#ButtonNormalUp` (31), `ButtonNormalDown` (27) pour le survol/appui. Identifiants : `ui.button`, `ui.button.hover`, `ui.button.down`. `compose-ui-buttons.ts` repositionne les trois parties originales gauche/milieu/droite, puis rasterise à six fois la définition de base pour une découpe CSS en trois zones. Aucun dégradé ou bouton de substitution n’est dessiné. Les cellules du sac et d’équipement conservent leurs vrais cadres d’inventaire ; les filtres, actions, entrées de donjon et fermetures utilisent le skin orange.

## Exclusivité Remastered et qualité obligatoire

Le manifeste refuse désormais toute provenance déclarée autre que `1.40.13-remastered`, avec un diagnostic explicite. Le lot actuellement installé a été contrôlé : chaque ressource déclare cette édition. Cela ne dispense pas de vérifier l’archive et les chemins d’origine : une déclaration de version seule ne certifie pas l’authenticité. Le Classic conservé pour l’historique n’est jamais un recours d’import.

Les aperçus UI exigent leurs propres exports haute définition `preview.*` ; ils ne reviennent plus silencieusement au petit sprite de jeu agrandi. Les gardiens sont déterminés depuis les données des monstres, y compris Mob l’Éponge, et leurs vecteurs Remastered sont exportés à six fois la définition de base. Un aperçu manquant produit un diagnostic et exige une nouvelle préparation.

Le préparateur vérifie aussi l’empreinte du sprite Crâ du client source contre celle de l’archive Remastered 1.40.13 vérifiée. Un client Classic complet est refusé avant l’export ; cette ancre ne remplace pas le contrôle de provenance de chaque fichier et de l’archive.

## Installation depuis Git

Le lot préparé (`public/assets/manifest.json`, PNG et atlas) est inclus dans le dépôt à la demande explicite de l’utilisateur. Après `git clone`, `pnpm install` puis `pnpm dev` suffisent pour jouer. La reconstruction depuis les SWF est facultative ; archives clients, Dofedex extrait, JPEXS et caches de conversion restent locaux. Cette inclusion dans Git n’établit aucun droit de redistribution des graphismes.

## Migration vers les pièces indépendantes (novembre 2026)

Les sources restent exclusivement celles de l’archive Remastered vérifiée en tête de ce document : `clips/sprites/90.swf`, `clips/sprites/accessories/a1.swf#16_41`, `#16_44`, `#16_143`, `a2.swf#17_44`, `#17_48`, `#17_109` et `a4.swf#2_1`. Aucune archive Classic n’est une entrée de cette migration.

`prepare-composition.py` exporte les vues et cycles des accessoires individuellement. Le corps est découpé en portions consécutives de l’arbre d’affichage, séparées aux attaches et aux changements de visibilité des cheveux. Les SVG de ces portions sont dédupliqués par empreinte ; leurs durées sont portées par la timeline du corps. Les matrices natives viennent des clips identifiés par les scripts `GAC.applyAccessory`, avec leur label directionnel, et sont cumulées dans la hiérarchie originale. L’ordre des couches constitue leur profondeur relative.

Les paramètres de rasterisation sont une densité 3 pour le jeu et 10 pour les pièces du portrait, toujours depuis les vecteurs. Le cadrage transparent conserve un pixel natif de marge, le pivot natif et la taille en unités du monde. Les accessoires conservent leurs cycles imbriqués. Les masques de disparition sont exportés depuis les chemins de découpe originaux ; aucun masque dessiné à la main n’est ajouté. JPEXS omet certaines références aux clips vides : pour l’effet `90.swf#284`, l’import vérifie directement que la frame d’arrêt 13 est vide avant d’accepter l’absence de dessin.

Le manifeste contient `composition.actors`, `composition.accessories` et les images `piece.body.*`, `piece.accessory.*`, `piece.mask.*`, avec leurs équivalents HD nécessaires `preview.piece.*`. Les références cartésiennes `appearance.*` et `preview.appearance.*` sont supprimées du lot publié. Les anciens SVG composés restent uniquement dans `.local-assets/` pour les comparaisons.

Pour régénérer seulement cette migration sur un export de jeu existant :

```sh
python3 scripts/prepare-appearance.py
node --import tsx scripts/rasterize-appearance.ts
python3 scripts/prepare-ui-previews.py
node --import tsx scripts/rasterize-appearance.ts --previews
pnpm assets:compare
node --import tsx scripts/pack-atlas.ts .local-assets/game-runtime
node --import tsx scripts/pack-atlas.ts .local-assets/game-runtime --previews
pnpm assets:import .local-assets/game-runtime
pnpm assets:validate
```

Le cache de scripts Crâ est vérifié par SHA-256 et réexporté automatiquement si absent ou périmé. Le pipeline complet reste `pnpm assets:prepare:game`. Les restrictions de redistribution et notices initiales s’appliquent à toutes ces pièces.

### Mesures de la migration

Mesures locales de novembre 2026, sur le même lot de cartes et monstres ; Mo désigne ici 1 000 000 octets. Les nombres de séquences ne représentent pas la taille des images : le découpage ajoute des références de petites pièces, mais retire les images répétées des associations.

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Images PNG compressées, toutes ressources | 91,22 Mo | 43,23 Mo |
| Mémoire RGBA théorique de toutes les images | 791,14 Mo | 371,71 Mo |
| Frames référencées | 21 814 | 12 869 |
| Séquences cartésiennes `appearance.*` et `preview.appearance.*` | 480 | 0 |
| Fichiers PNG | 76 | 51 |

Le lot final contient 2 295 séquences/pièces, 24 timelines du Crâ, six équipements visuels et un arc. Il utilise 14 atlas de jeu et huit atlas de portraits de 2048 × 2048. Dans un combat avec trois ennemis, Three.js charge 13 textures d’atlas, soit environ 218,10 Mo RGBA théoriques sans mipmaps ; les atlas de portrait restent hors du moteur 3D. Le Crâ utilise cinq quads dans la pose mesurée, au plus neuf couches source selon la frame et l’équipement. La scène mesurée totalise 296 quads/appels de dessin, décors compris.

Avec Chromium headless, en exécution isolée : chargement local jusqu’au menu en 0,96 s, heap JS de 41,07 Mo, intervalle médian et 95e percentile des frames à 16,7 ms sur 120 frames. Ces chiffres décrivent cet environnement de test et son cache système ; ils ne garantissent pas le débit d’un téléphone ou d’un autre GPU. Un premier relevé avec plusieurs tests navigateur simultanés était plus lent et n’est pas utilisé comme mesure isolée.

L’import validé du répertoire préparé prend 8,00 s ; la reconstruction des atlas prend 11,75 s pour le jeu et 5,97 s pour les portraits. La dernière rasterisation avec cache déjà alimenté prend 74,78 s, avec un maximum RSS mesuré de 187 552 Ko pour le processus ; ce n’est pas une mesure d’export complet à froid ni de mémoire cumulée de tous les processus Chromium.

Le test de croissance résout les 2 500 associations de 50 coiffes et 50 capes via 100 entrées indépendantes sans générer d’images supplémentaires. Ce test réutilise les pièces vérifiées : il vérifie l’architecture et ne prétend pas intégrer 100 équipements originaux distincts. Pour de nouvelles pièces réelles, taille et chargement croissent avec leurs seules vues/cycles.

Les comparaisons locales vérifient les poses initiales, intermédiaires et finales, ainsi que les frames portant un masque de mort, sur les associations disponibles. Les rapports détaillés et captures restent dans `.local-assets/composition-validation/` ; les captures d’inventaire ordinateur/petit écran et de mort Three.js sont également privées. La tolérance de comparaison est de 3 % de différence normalisée des couleurs prémultipliées et de l’alpha, pour tenir compte de l’anticrénelage des pièces rasterisées séparément. La normalisation a un plancher de 256 pixels opaques au zoom de comparaison ×3 : les derniers résidus subpixel de disparition gardent ainsi une tolérance absolue inférieure à huit pixels RGBA équivalents, plutôt qu’un pourcentage instable sur une silhouette presque vide.


Validation finale : 1 056 comparaisons, écart normalisé moyen de 0,589 % et maximum de 1,671 %, sous le seuil de 3 %. Le résidu ayant initialement un pourcentage brut élevé en fin de mort couvre moins de 0,02 pixel opaque équivalent ; son erreur absolue est de 0,011 pixel équivalent. Les poses visibles et les frames masquées passent également dans le renderer Three.js, sans erreur shader. Les vérifications couvrent 40 tests Vitest, sept tests Python, dix scénarios navigateur (dont les trois donjons) et un scénario hors connexion. Les captures de portrait ordinateur et 390 × 844 ont été examinées visuellement.


## Icônes des sorts AZER

Les sources sont acquises dans l’archive Remastered SHA-256 `aa9bccb901feb8bc06c16464c36ffbef1a46f8db27ce497bf252b9bd8c5d42d5` déjà référencée ci-dessus. `prepare-spell-icons.py` compare chaque fichier local à son entrée ZIP avant export ; aucune ressource Classic n’est utilisée. Les identifiants et noms sont confirmés par les entrées `S[161]`, `S[165]`, `S[166]` et `S[179]`, champ `i.up`, de la table locale `spells_fr_1166.swf`.

| Sort | Chemin original dans le client Remastered | SHA-256 du SWF | Identifiant runtime |
| --- | --- | --- | --- |
| Flèche explosive | `clips/spells/icons/up/179.swf` | `0e71bc46c0213f183af1776661cc7563c40cfdbef8f47d817ba9d0d755c99895` | `ui.spell.explosive` |
| Flèche enflammée | `clips/spells/icons/up/165.swf` | `08ea62f087080c3d681c31780ac5ab5d920d4e11e5357821e2453d8a17f2d643` | `ui.spell.flaming` |
| Flèche magique | `clips/spells/icons/up/161.swf` | `89e5d5c5205d87834788fc837af6ff682eef64c1208defab62aa2d0fb34ad570` | `ui.spell.magic` |
| Tir puissant | `clips/spells/icons/up/166.swf` | `35d400ebd7765bc6406069a4857ffc4d83828fa4e9ccbe041cd541dcdbd4a946` | `ui.spell.power` |

JPEXS exporte la première frame en SVG ; `rasterize-appearance.ts --spell-icons` recadre au dessin et rasterise les vecteurs jusqu’à 192 px par côté. Les couleurs natives et le fond beige du dessin sont conservés. Les quatre PNG individuels sont sous `public/assets/textures/ui-spell-*/000.png`, sans intermédiaire SWF publié. Le fond de disponibilité est le skin orange `ButtonNormalUp` original ; le fond de recharge est `UI_InventoryGridBackground`, avec texte blanc/noir et temps restant. Les icônes ne sont ni recolorées ni remplacées par un dessin de substitution.

Régénération : `pnpm assets:spells`, puis `pnpm assets:import .local-assets/game-runtime` et `pnpm assets:validate`. Ces étapes figurent aussi dans `assets:prepare:game`. Le manifeste exige les quatre icônes lorsque le jeu est déclaré prêt. Les restrictions de redistribution restent celles documentées au début de ce fichier.


### Habillage d’interface moderne — 2 novembre 2026

Sur demande explicite du joueur, les couleurs, fonds, cadres et boutons de l’interface sont maintenant définis en CSS. Cela remplace la contrainte antérieure d’assembler exclusivement les éléments de skin Retro pour l’interface. Les anciens exports `ui.window`, `ui.button`, `ui.slot`, `ui.portrait`, `ui.selection` et variantes de boutons sont conservés dans le manifeste pour compatibilité et régénération, mais ne sont plus appliqués comme habillage dans React. Les icônes de sorts, cœur, objets et aperçus animés restent issus du lot Remastered documenté ci-dessus. Aucun fichier graphique tiers nouveau n’a été importé. Les règles de provenance et de redistribution des illustrations restent inchangées.

Le favicon utilise directement `textures/item-2411/000.png` (Coiffe du Bouftou), déjà déclaré dans le manifeste comme `item.2411`, sans réexport ni copie. Source Remastered : `clips/items/16/41.swf#timeline`.
