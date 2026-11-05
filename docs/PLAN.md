# État du MVP

## Fonctionnalités intégrées

1. **Provenance et import** : Dofedex complet et Remastered 1.40.13 récupérés à la demande de l’utilisateur, inventaires et empreintes consignés. Sources et dérivés ignorés par Git. Pipeline local répétable, manifeste typé, diagnostics et validation des atlas.
2. **Rendu** : Three.js orthographique, textures originales uniquement, pas fixe, resize, ressources libérées. Astrub reconstruit depuis sa variante historique non chiffrée ; Crâ animé dans huit directions, origines extraites des exports SVG. Les cartes restent immobiles, végétation comprise.
3. **Navigation** : clic droit simple et maintenu, raycast caméra/plan, A*, index spatial, segments continus, collisions, profondeur selon les pieds. Données traversables et apparitions explicites par carte.
4. **Sorts AZER** : explosive en zone, enflammée transperçante, magique à projectile et buff Tir puissant. Portées/cooldowns/coefficients éditables ; dégâts proportionnels à la Puissance, arrondi inférieur. Animations de cast, hit, mort et effets correspondants aux fichiers de sorts vérifiés.
5. **Monstres** : sept sprites authentiques, dix archétypes incluant les variantes Incarnam. Acquisition, approche, attaque, délais, séparation, réactions, mort, XP, kamas et loot pondéré.
6. **Donjons** : sélection libre, trois vagues normales puis Milimilou, Bouftou Royal accompagné du Chef de Guerre et de Bouftous, ou Mob l’Éponge et Raul Mops dans le Donjon Ensablé. Délais entre vagues, victoire, mort, abandon, retour Astrub et nouvelle tentative cohérents.
7. **Progression** : niveaux, Vie/Puissance, treize équipements de deux panoplies, huit slots, pièces distinctes, meilleur seuil de bonus, recalcul intégral. Sauvegarde versionnée localStorage, validation et diagnostic des erreurs. Aucun binaire en localStorage.
8. **Interface et hors connexion** : HUD, cooldowns, buff restant, noms/HP des monstres, dégâts et journal textuels, inventaire et tooltips composés avec de l’art original. Des atlas pour réduire le chargement ; build avec préchargement hors connexion et révision de cache.

## Validation

Les vérifications exécutées couvrent :

- Build TypeScript strict + Vite.
- Tests unitaires dégâts/Puissance, fenêtre de cast, cooldowns et buff, immobilisation pendant le cast puis reprise du déplacement, expiration, quatre vagues et boss des trois donjons, mort/retry, progression, loot pondéré, équipements, seuils de panoplie, sauvegardes corrompues/anciennes, identifiants de butin après rechargement, régions d’atlas et lecture des timelines SWF.
- Audit de simulation sur les **vraies cartes de production**, sans modifier les dégâts ou les taux de loot : victoire des trois donjons.
- Tests Chromium du diagnostic sans manifeste, du clic droit simple/maintenu, des animations, du resize et des trois parcours complets **hub → donjon → boss → récompenses → équipement → rechargement de sauvegarde**. Le hasard des tests navigateur est fixé, les taux restent ceux de production.
- Test de production : installation du cache, rechargement avec réseau coupé, puis entrée en donjon et apparition des monstres.
- Préparation complète des sources locales, import et validation du manifeste.

Voir README pour les commandes. Les parcours graphiques demandent les assets privés ; ils sont ignorés dans un clone sans installation. Aucun test de combat n’utilise de graphismes de remplacement.

## Limites explicites

- Les cartes utilisent des dispositions historiques publiques non chiffrées avec les bibliothèques Remastered 1.40.13. Ce n’est pas une revendication de restitution exacte du client 1.29 ou de sa version moderne chiffrée. Aucun accès serveur ni clé n’est contourné.
- Les sorts et monstres sont adaptés au temps réel. Les graphismes et timelines sont authentiques ; le moteur ne reproduit pas l’intégralité des actions Flash, sons, particules pilotées par script, personnalisations de couleurs et comportements originaux.
- Les objets équipés donnent leurs statistiques ; les coiffes et capes sont aussi composées dans les animations du Crâ. Aucun familier n’est proposé. Les sons ne sont pas intégrés.
- La collision issue des cellules source est filtrée et éditable. Des cas particuliers de terrain ou de décor peuvent demander des ajustements après essais humains.
- L’équilibrage et les probabilités sont provisoires, sans prétention de chiffres officiels. Aucun backend, compte, commerce, réseau de jeu ou multijoueur.
- Vite signale un bundle Three.js volumineux ; la compilation réussit. Les atlas regroupent les graphismes dans des images partagées.

Suite utile : essais humains de difficulté et de collision, amélioration des effets pilotés par ActionScript , puis retours de jeu. Les étapes de gameplay du MVP sont présentes ; ces limites restent visibles et documentées.

## Migration graphique validée

Remastered 1.40.13 à la demande de l’utilisateur, mêmes identifiants et cartes ; icônes recadrées, coiffe/cape visibles, tir à l’arc original, immobilisation de cast de 0,12 s et décors fixes. Préparation et import validés : **403 séquences, 10 221 références de frames et 17 atlas**.

- `pnpm build` : réussi, cache de 40 fichiers.
- `pnpm test` : 27 tests TypeScript et 5 Python réussis.
- `pnpm test:browser` : 7 tests réussis, dont icônes transparentes recadrées, coiffes/capes des deux panoplies et combinaisons mélangées, retrait et tir, cartes figées et parcours complets des trois donjons.
- `pnpm test:simulation` : victoire dans les trois donjons avec la balance de production.
- `pnpm test:offline` : réussi, rechargement et entrée en donjon sans réseau.
- Prévisualisation du Crâ équipé et captures du jeu/inventaire inspectées.
- Sources et exports propriétaires confirmés ignorés par Git.

## Finition inventaire et boutons Retro

Inventaire réorganisé avec aperçu haute définition du Crâ équipé à gauche, rotation, emplacements autour du personnage, grille du sac, filtres par panoplie et fiche détaillée pré-sélectionnée. Les bonus affichés concernent les panoplies portées ou examinées. Sélection des donjons avec gardiens et aperçu du butin. Tous les boutons d’action partagent les états orange originaux du client ; les cellules d’inventaire gardent leurs vrais cadres.

Validation : construction TypeScript/Vite, tests unitaires, tests navigateur de l’inventaire et des donjons (aperçus, équipement, filtres, rendu mobile, boutons normal/survol, réduction des animations).

## Sac, doublons et exclusivité Remastered

Les équipements portés sont exclus de la grille et du compteur du sac, tout en restant dans le profil sauvegardé. L’équipement au double-clic et le retrait mettent immédiatement à jour les deux vues. « Vendre doublons », en bas à droite, vend les copies libres superflues dans tout le sac pour 1 à 4 kamas par objet, conserve les équipements portés et sauvegarde le gain. Deux anneaux identiques portés restent protégés.

`AGENTS.md` impose explicitement le Remastered et la qualité graphique. Les manifestes non Remastered et le client source Classic sont refusés. Les aperçus UI exigent leurs exports haute définition ; les trois gardiens disposent de leurs vecteurs Remastered convertis.

Validation : 32 tests TypeScript et 5 tests Python, build Vite/TypeScript et 8 tests navigateur réussis, dont la revente, l’aller-retour sac/équipement et les trois donjons.

Le test hors connexion passe également : rechargement sans réseau, aperçu du gardien, entrée en donjon et aperçu du personnage dans l’inventaire.

### Panoplie Bouftou Royal — 4 novembre 2026

Sept objets royaux authentiques intégrés avec leurs icônes transparentes Remastered, coiffe/cape portées et aperçus HD. Tirage indépendant à 10 % par Royal vaincu, en normal et en Extrême ; conservation du butin ordinaire. PV, Puissance et seuils de panoplie multipliés par 1,5 par rapport à Bouftou, filtre d’inventaire dédié, équipement et persistance existants conservés. Pipeline complet et ajout incrémental `--royal-only` documentés dans `ASSETS.md`. Aucun asset requis manquant pour cet ajout.

### Accélération du Royal et lance de Raul Mops — 4 novembre 2026

Bouftou Royal : vitesse ×2 pendant une seconde, premier départ après cinq secondes de vie puis répétition toutes les cinq secondes, sans cumul ni déplacement à travers les obstacles. Raul Mops : lancer préparé avec le geste Remastered original, projectile de lance authentique, trajectoire esquivable et dégâts à l’impact ; mêlée conservée. Paramètres en données, timers suspendus en pause et nettoyage aux changements de phase. Exports locaux reproductibles et validation du manifeste étendus pour les trois nouvelles séquences.

### Donjons Tofu et Scarafeuille Noir — 5 novembre 2026

Les paliers 4 et 5 utilisent les cartes historiques 9529 et 9782 reconstruites
avec les graphismes Remastered. Trois vagues puis Batofu ou Scarabosse Doré,
butin des panoplies, modes Normal/Extrême et sauvegardes sont intégrés aux systèmes
existants. Les sept objets Tofu et quatre objets Scarafeuille Noir apportent Vie,
Puissance, vitesse et réduction de recharge, avec seuils de panoplie distincts.
Les quatre accessoires portés suivent les matrices GAC et acceptent les mélanges
avec les panoplies précédentes. Les filtres d'inventaire incluent les deux ajouts.

La préparation incrémentale `assets:prepare:tofu-scara` réutilise les sources
vérifiées, exporte les timelines et les aperçus HD, puis assemble les atlas.
Le cadrage vectoriel mesure chaque frame isolément pour éviter les collisions
d'identifiants SVG JPEXS entre frames. Les sources et intermédiaires restent locaux.
Les contrôles de navigation, de composition, de récompense Extrême et le pilote
`test:simulation` couvrent désormais les cinq donjons.


## Livraison Tofu / Scarafeuille et préparation future — 5 novembre 2026

Tofu et Scarafeuille sont jouables avec leurs quatre vagues, boss, récompenses et équipements. Les deux parcours navigateur complets ont réussi ; leurs profils recommandés réussissent également en simulation. À la reprise : 103 tests TypeScript, 17 tests Python, validation du manifeste actif (2 543 séquences et six cartes) et build de production réussis.

Les six familles restantes de TODO.md disposent d’un lot séparé validé dans `public/assets/prepared/` : 806 séquences, six cartes, 35 icônes, 43 sprites sources, dix accessoires et neuf gardiens ; 426 PNG. Les données de combat, objets, butins et sauvegardes actifs ne les intègrent pas. Les cartes préparées exigent toujours leur revue de navigation avant toute future activation. Sources et limites détaillées dans `PREPARED-ASSETS.md`.


## Chef Bwork et Blop Multi — 5 novembre 2026

Intégration des deux donjons aux paliers 6 et 7, trois vagues puis boss,
Normal/Extrême, loot, panoplies, filtres d’inventaire et sauvegarde v1 étendue.
Navigation revue sur les cartes publiques 9760 et 11892 ; graphismes exclusifs
Remastered du lot préparé, accessoires Bwork composés sur le Crâ.
Les quatre autres familles du TODO restent préparées et inactives.


## Compte et progression serveur — 5 novembre 2026

Remplacement du fichier de compte local obligatoire par SQLite côté serveur.
Configuration initiale unique dans le navigateur, sessions persistantes, page
Mon compte, modification du nom et du mot de passe, révocation des sessions.
Progression sauvegardée et chargée via une API authentifiée avec contrôle de
révision. Migration initiale de la sauvegarde locale puis serveur comme référence.
Voir `docs/AUTH.md` pour les routes, le stockage et les limites.


### Connexion uniquement

La création de compte depuis le navigateur est retirée. Les routes de création
renvoient 404 et le serveur exige un compte déjà provisionné. Le compte `fredi`
est configuré dans la base privée ; aucun mot de passe en clair n’est versionné.
La commande administrative `account:provision` conserve la progression.

## Coiffe du dev — 5 novembre 2026

Objet administratif à apparence Champion Remastered 8069 : icône et cinq vues
originales, bonus +10 000 Vie/Puissance, +150 % déplacement et −90 % recharge.
Plafonds spéciaux liés à l’équipement, aucun drop, attribution idempotente au
compte `fredi` sans remise à zéro ni équipement automatique.
Les recommandations de panoplies ont été retirées de l’affichage des donjons,
sans test de cette modification à la demande du joueur.
