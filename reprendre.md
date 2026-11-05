# Reprise — 5 novembre 2026

## Demande et périmètre

Rendre Tofu et Scarafeuille jouables ; préparer uniquement les assets des six autres familles de TODO.md (Chef Bwork, BlopMulti, Craqueleur, Gelax, Ancestrale, Meulou). Ne pas activer ces six futurs donjons, leurs objets ni leur butin. Conserver les graphismes Remastered 1.40.13 et la progression existante.

## État

- Tofu et Scarafeuille intégrés : cartes, quatre vagues, boss, butin, panoplies et accessoires. Manifeste actif : 2 543 séquences et six cartes avec le hub.
- Les deux parcours navigateur complets ont passé avant la pause : hub, combat, victoire, récompenses, équipement, sauvegarde et rechargement. La simulation aux profils recommandés a également réussi.
- Lot futur local : `.local-assets/future-dungeons-runtime`, 806 séquences, six cartes, 35 icônes, 43 sprites sources distincts, dix accessoires et neuf aperçus de gardiens. Lot publié et validé dans `public/assets/prepared/` : 426 PNG, 19 334 entrées temporelles au lieu de 22 051 références natives.
- Le Blop Multicolore dispose de sa carte : disposition publique en clair du dump Ancestra, ligne 11892, graphismes Remastered. Aucun déchiffrement. Voir `docs/PREPARED-ASSETS.md` et `scripts/public_map_layout.py`.
- Environ 22 000 références temporelles natives ne signifient pas autant de PNG nécessaires. Les atlas dédupliquent les fichiers identiques ; l'import préparé regroupe les pauses consécutives identiques en préservant leur durée.
- L'ancien assemblage avait été interrompu (143), laissant des pages locales partielles non référencées. Le script `scripts/pack-atlas.ts` a été corrigé pour lire les PNG page par page et renouveler la page Chromium toutes les huit pages. Assemblages terminés : 298 pages jeu et 93 pages aperçu. Journaux `.local-assets/future-pack.log` et `.local-assets/future-pack-previews.log`.
- Vérifications à la reprise : 103 tests TypeScript et 17 tests Python passent. Vérification TypeScript et build de production réussis à la reprise ; second build incluant le lot préparé réussi (1 min 13 s), journal `.local-assets/resume-build-final.log`. Validation active : 2 543 séquences et six cartes. Validation préparée : 806 séquences.
- Aperçus des six cartes examinés : `.local-assets/future-maps-review.jpg`. Accessoires examinés dans leurs vues source : `.local-assets/future-accessories-review.jpg`. Icônes et gardiens avaient été examinés avant la pause.

## Suite éventuelle

Le périmètre demandé est livré. Le dernier build de production incluant le lot préparé a réussi. Les quatre tests ciblant la compaction et la séparation des futures familles ont également repassé après publication. Le serveur répond HTTP 200 sur `/login`.

Pour une future demande d’activation des six familles : définir explicitement l’équilibrage, les vagues et butins, revoir les collisions par cellule dans `scripts/map-navigation.json`, intégrer et vérifier les accessoires sur le Crâ, puis tester navigation et parcours complets. Les cartes préparées ne contiennent pas de navigation prête à jouer. Ne pas activer ces familles sans demande.

## Commandes locales

```sh
export PATH="$PWD/.local-assets/node-v20.19.0-linux-armv7l/bin:$PATH"
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
node_modules/.bin/tsx scripts/pack-atlas.ts .local-assets/future-dungeons-runtime
node_modules/.bin/tsx scripts/pack-atlas.ts .local-assets/future-dungeons-runtime --previews
node_modules/.bin/tsx scripts/import-prepared-assets.ts
node_modules/.bin/tsx scripts/validate-prepared-assets.ts
node_modules/.bin/tsx scripts/validate-assets.ts
node /home/david/.npm/_npx/9e1888088e10d03f/node_modules/pnpm/bin/pnpm.cjs build
```

Ne pas relancer tout l'export vectoriel : les PNG sont déjà rendus. Sources et caches restent locaux dans `.local-assets/`. Le dépôt était déjà très modifié avant cette tâche : ne pas annuler, ajouter ou committer globalement ses changements.

Serveur Vite conservé : PID 28738, port 5173, journal `.local-assets/dev-server.log`. Adresse locale `http://localhost:5173/` (authentification existante). Ne pas supprimer les sauvegardes ni les archives sources.

Nettoyage : après validation de la publication et comparaison des durées (tolérance flottante 1e-8 ms), les PNG de cache non référencés du dossier de travail sont supprimés. Le lot publié, les atlas locaux et les vecteurs restent conservés.
