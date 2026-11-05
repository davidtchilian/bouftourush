# Assets préparés des prochains donjons

La préparation initiale du 5 novembre 2026 concernait uniquement les graphismes des six lignes
restantes de `TODO.md`. Les donjons, objets, statistiques, butins et sauvegardes
actifs restent définis par les cinq donjons déjà intégrés. Le catalogue de travail
est `scripts/future-dungeons-assets.json` ; il ne constitue aucune donnée de jeu.

| Famille | Panoplie canonique vérifiée | Objets | Source de disposition publique |
| --- | --- | ---: | --- |
| Chef Bwork | 19, Panoplie du Chef Bwork | 7 | `maps/9760/9760_0701291449.swf` |
| BlopMulti | 106, Panoplie Blop Multicolore Royale | 4 | Dump public Ancestra-Evolutive, `maps[11892]`, version `0712071740` |
| Craqueleur | 26, Panoplie du Craqueleur | 6 | `maps/9580/9580_0610091135.swf`, salle 11 |
| Gelax | 6, Panoplie Gelax | 6 | `maps/6831/6831_0612071702.swf`, dimension royale |
| Ancestrale | 65, Panoplie Ancestrale | 6 | `maps/8721/8721_0702080947.swf`, donjon Abraknyde |
| Meulou | 55, Panoplie du Meulou | 6 | `maps/9648/9648_0612071646.swf`, groupe Meulou |

Les 35 icônes et les 43 sprites distincts ont été vérifiés dans le client local
**Remastered 1.40.13**. Les identités viennent de `items_fr_450.swf / I.u`,
`itemsets_fr_180.swf / IS` et du dump public Ancestra-Evolutive, tables `monsters`
et `mobgroups_fix`. `maps_fr_299.swf / MA.m[9580]` confirme la sous-zone 252
(salle 11 des Craqueleurs) ; `maps_fr_1021.swf / MA.m[6831]` confirme la sous-zone 78
(Gelaxième dimension royale). Ces tables ne fournissent aucun graphisme.
Les tracés et placements proviennent des cartes publiques non chiffrées, ou d'une disposition déjà publiée en clair dans le dump public.

Le pipeline prépare les cinq gestes R/L de chaque monstre (idle, course, attaque,
impact, mort), les portraits HD des gardiens, les icônes transparentes, les vues
et timelines des coiffes/capes originales et les décors figés à leur première frame.
Les Blops Multicolores Royaux n'ont ni coiffe ni cape dans leur panoplie canonique ;
aucune pièce supplémentaire n'est inventée. Les accessoires sont des pièces
indépendantes avec leurs labels source ; leur branchement dans le Crâ interviendra
lors d'une demande ultérieure d'implémentation.

Les cartes préparées restent des graphismes : aucune navigation, collision,
apparition ou vague de combat n'est déclarée prête. Une future activation exigera
la revue par cellule de `scripts/map-navigation.json`, les tests de navigation et
l'intégration explicite des données de jeu. Le Blop Multicolore utilise les 479 cellules déjà en clair du champ `mapData` de la ligne 11892 du [dump public Ancestra-Evolutive](https://github.com/Romain-P/Ancestra-Evolutive/blob/master/sql/ancestra-evolutive-full.sql). Leur SHA-256 est `08d52d2a904453f7b4216fa9ee92789101cfedaa5dd0a8a19a163149736a8d52`. La version `0712071740`, la largeur 15 et la hauteur 17 sont vérifiées. Le SWF Dofedex `maps/11892/11892_0712071740X.swf` fournit seulement les métadonnées en clair largeur, hauteur et numéro de fond (71). Sa donnée protégée n'est pas utilisée ; aucune clé SQL n'est exploitée. Les graphismes viennent exclusivement des bibliothèques Remastered. Les tests refusent une disposition modifiée ou non conforme au format public.

## Pipeline reproductible

```sh
pnpm assets:prepare:future
pnpm assets:validate:future
```

Sources requises : `.local-assets/client-1.40.13-remastered/`, l'extraction
`.local-assets/dofedex/`, le dump public `.local-assets/ancestra.sql`, Java/JPEXS et Chromium, comme documenté dans `ASSETS.md`.
Le SHA-256 de l'archive Remastered est
`aa9bccb901feb8bc06c16464c36ffbef1a46f8db27ce497bf252b9bd8c5d42d5`.
Les vecteurs, caches et sources restent sous `.local-assets/future-dungeons-runtime/`.
Les pixels sont réexportés des vecteurs : densité 3 pour les monstres/accessoires,
2 pour les décors, 6 pour les portraits des gardiens (plafond de 1 024 pixels, adapté à leurs 230 × 164 pixels CSS), 10 pour les pièces de portrait ;
les icônes sont recadrées à 192 pixels au maximum. Les frames identiques partagent
les mêmes pixels d'atlas tout en conservant leurs durées d'origine.

Le lot PNG final possède un manifeste séparé avec `preparedOnly: true` dans
`public/assets/prepared/`. Le manifeste actif ne le référence pas et le chargeur du
jeu ne l'ouvre pas. Une régénération du lot actif préserve ce dossier indépendant.
La validation refuse les versions non Remastered, les séquences absentes et les
chemins sortant du lot. Les tests vérifient que ces objets et donjons restent absents
des données et du manifeste actifs.

Le versionnement des PNG préparés suit la demande du joueur. Aucun droit de
redistribution ni accord d'Ankama n'est établi ; toutes les réserves de `ASSETS.md`
s'appliquent également à ce lot. Aucune archive client, donnée brute SWF ou cache
intermédiaire n'est publié.

Les pauses consécutives qui affichent exactement les mêmes pixels sont regroupées dans le manifeste publié, avec leur durée cumulée. Le lot de travail conserve les références natives pour la reprise des exports. Les atlas réutilisent les images identiques ; `timelineSummary` donne les nombres de références natives, d'entrées publiées, de régions et de fichiers PNG. Aucun changement de pose ni aucune durée d'animation n'est supprimé.

## Lot livré le 5 novembre 2026

Le lot séparé contient **806 séquences, six cartes, 35 icônes, 43 sprites sources distincts, dix accessoires et neuf gardiens**. Les 22 051 références temporelles natives deviennent 19 334 entrées publiées, pour 18 394 régions d’image et **426 PNG** (298 pages d’atlas de jeu, 93 pages d’aperçus et 35 icônes). Les durées totales des 806 séquences ont été comparées entre le lot natif et le lot publié. Le regroupement économise 2 717 entrées sans retirer de pose différente.

Les aperçus des six cartes et les vues source des dix accessoires ont été examinés, en complément des icônes et gardiens. Cette vérification graphique ne remplace pas la future revue de navigation ni la validation des accessoires attachés au Crâ lors de leur intégration.

L’assemblage lit les PNG page par page et renouvelle la page Chromium toutes les huit pages pour limiter la mémoire. Après validation du lot publié, les PNG de travail devenus non référencés sont supprimés pour libérer le disque ; les sources Remastered, vecteurs, métadonnées et atlas restent locaux et permettent de régénérer les exports.


## Activation Chef Bwork / Blop Multi — 5 novembre 2026

Ces deux familles sont désormais jouables. Les quatre autres restent préparées.
Le catalogue historique garde `preparedOnly: true` et ses cartes sans navigation :
les décisions revues, cellules accessibles, spawn et huit points d’apparition par
carte sont dans `scripts/map-navigation.json`. Leurs dispositions publiques SQL
ont été décodées puis comparées cellule par cellule aux placements préparés :
414 couches pour Bwork et 278 pour Blop, identiques. Aucune donnée protégée n’a été utilisée.
Les graphismes sont toujours les exports Remastered déjà préparés.

`pnpm assets:activate:bwork-blop` active les deux familles dans `public/assets/`.
Le script est répétable, valide la composition du Crâ et la navigation avant
publication du manifeste ; il référence les PNG existants sans les dupliquer.
Pour régénérer un lot actif depuis les vecteurs : préparer et importer le lot futur,
puis lancer `pnpm assets:prepare:game`, `pnpm assets:import .local-assets/game-runtime`
et `pnpm assets:validate`. La préparation du jeu appelle l’activation avant de
composer les fonds fixes. Sur un lot local sans dossier préparé, l’activateur copie
celui de `public/assets/prepared/`. Il accepte aussi un chemin de lot en argument.
Conserver le dossier préparé dans tout déploiement : ses atlas sont maintenant
nécessaires aux deux donjons actifs.

Bworks : 157 cellules accessibles, trois décors de premier plan rétablis et quatre
exclusions de bord. Blop : 248 cellules, 25 décors rétablis et 15 exclusions.
Les poteaux, murs, barrières, puits, socles et stalagmites au sol bloquent ; les
feuilles, herbes, petits débris, outils posés et stalactites suspendues restent
traversables sur le terrain accessible. Les positions des objets sont protégées
par empreinte, et la validation contrôle aussi la liste exacte des cellules revues.

Bworkette garde les Bworks ; le Blop Multicolore Royal est accompagné des quatre
Blops Royaux. Les attaques utilisent l’IA de mêlée existante : aucune capacité
spéciale canonique supplémentaire n’est revendiquée. Chaque famille donne sa
panoplie à poids égaux, avec 3 % / 2,5 % par monstre ordinaire et 40 % par boss.
En Extrême, les règles existantes (effectifs ×5, PV ×1,5, panoplie complète à la
victoire) s’appliquent. Les statistiques sont provisoires, propres au fangame,
dans `src/data/bworkBlop.ts` et `src/data/monsters.ts`.
Le Chef Bwork favorise la Vie ; Blop favorise la Puissance et la récupération.
Les sept objets Bwork incluent la vraie coiffe 6813 et la cape 6811, branchées
sur les matrices d’attache existantes ; les quatre objets Blop n’inventent
aucune coiffe ni cape. La sauvegarde v1 accepte les nouveaux objets et donjons,
sans réinitialiser les profils existants.
