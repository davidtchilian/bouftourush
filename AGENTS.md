# AGENTS.md — Dofus Retro Real-Time Dungeon Fangame

## Mission
Build a playable, browser-based, isometric real-time dungeon crawler inspired by Diablo, using **Dofus Retro Remastered 1.40.13 visual assets**. This is a free, non-commercial fan project intended for the community, not affiliated with or endorsed by Ankama. No monetization, ads, paid content, or account integrations.

**Important:** Non-commercial status does not grant permission to redistribute copyrighted assets. Keep third-party asset provenance, licensing, and redistribution restrictions explicit. Do not bypass authentication, DRM, or access controls. Keep client archives and raw extraction/conversion sources local. At the user’s explicit request, the prepared runtime files in `public/assets/` are versioned so a clone can run without copying them manually. This instruction changes the repository storage workflow; it does not establish redistribution rights or permission from the copyright owner. Document asset provenance and the source setup. Never claim authorization from Ankama.

## Évolution de l’interface — demande explicite du 2 novembre 2026
- Le joueur demande une refonte visuelle moderne : nouvelles couleurs, contrastes, fonds, cadres et boutons en CSS. Cette décision remplace les restrictions ci-dessous sur les graphismes de l’interface et les boutons orange originaux. Les icônes, illustrations, personnages, objets et cartes restent exclusivement Remastered 1.40.13 ; aucun art de remplacement.
- L’habillage utilise une palette sombre, des actions contrastées et des états interactifs accessibles. Les anciens exports d’interface restent conservés dans le lot historique, sans être utilisés comme fonds de la nouvelle interface.
- La carte complète doit être cadrée dans l’espace disponible au-dessus de la barre de sorts, sans zoom, découpe ni recouvrement par cette barre. Sur écran étroit, conserver la carte entière avec des marges si nécessaire.

## PRIORITÉ ABSOLUE — REMASTERED UNIQUEMENT ET QUALITÉ VISUELLE
- **Tous les graphismes visibles doivent provenir exclusivement de Dofus Retro Remastered 1.40.13.** Cela couvre cartes, décors, personnages, accessoires, monstres, sorts, icônes et interface, sans exception implicite.
- **Interdiction d’importer, copier, charger ou utiliser un asset Classic/1.29 comme remplacement**, même temporaire. Un fichier identique entre éditions doit tout de même être acquis dans l’archive Remastered et conserver cette provenance vérifiée. Les anciennes archives servent uniquement à l’historique privé et ne sont jamais une entrée de production.
- **La qualité visuelle est un critère de livraison.** Exporter les vecteurs originaux à une définition adaptée à la taille affichée et au facteur de pixels de l’écran. Un petit PNG agrandi et flou ne constitue pas un aperçu haute définition ; réexporter le vecteur au lieu de simplement l’agrandir.
- Les aperçus de personnages équipés et de boss doivent rester nets, avec transparence propre, cadrage cohérent, pivots justes et animations complètes. Vérifier visuellement les captures d’inventaire, de donjons et de jeu à leurs tailles réelles, sur ordinateur et petit écran.
- Préserver les couleurs, proportions, directions et détails du Remastered. Pas d’art généré, d’icône générique, de fond de substitution ni de mélange de versions pour masquer un asset manquant ou une mauvaise conversion.
- Si une ressource Remastered de qualité suffisante manque, **signaler précisément ce manque et préparer son import** ; ne jamais revenir silencieusement au Classic ni déclarer le résultat terminé avec un visuel inadéquat.
- Documenter source/version/chemin d’origine, empreinte de l’archive et paramètres d’export dans `docs/ASSETS.md`. La validation du manifeste doit refuser les versions visuelles non Remastered. Les anciennes données publiques de placement des cartes peuvent rester utilisées comme données de disposition ; **leurs graphismes doivent tous être Remastered**.

## Accepted project decisions
- The user explicitly selected **Dofus Retro Remastered 1.40.13**, replacing the earlier Classic 1.40.13 source and initial 1.29 target. Use the Remastered archive referenced by Dofedex; preserve the existing semantic IDs, monster/item identities and map layouts when replacing visuals. Some files are byte-identical between editions; report that honestly.
- The installed local source is `.local-assets/client-1.40.13-remastered/`; the old Classic archive is private history only and must never be imported into production. Record archive hashes and exact source paths in `docs/ASSETS.md`.
- All map artwork is **static**, including vegetation, props and map backgrounds. Export and render the first frame of map assets. Characters, equipped accessories and combat effects remain animated. This overrides any earlier preference to animate map decoration.
- Keep the existing historical, publicly readable map layouts; reconstruct them with Remastered graphics libraries. Do not substitute an unrelated map or decrypt protected map data.
- All action buttons use the original orange Dofus Retro button artwork, including hover/pressed/disabled feedback. Assemble the original left/middle/right parts; never draw replacement gradients in CSS. Preserve authentic inventory cell frames for item/equipment slots.
- Equipped items appear only in their equipment slots and character preview, **never in the bag grid or its item count**. Equipping removes an instance from the visible bag; unequipping returns it. Keep item ownership and equipment references consistent in the saved profile.
- Inventory has an orange **« Vendre doublons »** action at its bottom right. Sell only spare, unequipped copies throughout the entire bag, ignoring the visual filter; retain one free copy when the item is not worn, and preserve all worn instances (including two identical equipped rings). Low configurable resale prices are 1–4 kamas per item. Show the sale value, disable the action when no duplicates remain, save immediately, and prevent repeated payouts. This specific resale action is authorized; it does not add a shop or trading system.
- Inventory UI shows an enlarged, rotatable preview of the equipped Crâ to the left of the bag, with equipment slots around it. Dungeon selection shows each actual boss sprite, with its animation on hover/focus and a loot preview. Compose authentic UI frames and render enlarged previews from the original vectors at sufficient resolution; respect reduced-motion preferences.
- Preserve and fix the existing playable game when making changes; do not reset progression or remove working mechanics during asset migrations.

## Tech stack
- **Three.js** for rendering, with an **orthographic camera** and textured planes/sprites in an isometric 2D world. No React Three Fiber unless a demonstrated need arises.
- **TypeScript (strict)**, **Vite**, **pnpm**.
- **React** only for menus, inventory, equipment, dungeon selection, HUD, and other UI state; **Zustand** for application state. Keep the game simulation independent of React rendering.
- **Vitest** for deterministic combat/progression/loot tests; **Playwright** for browser smoke tests.
- MVP is **single-player, client-side, offline-capable after assets are installed**. No backend, login, multiplayer, database, or networking required.
- Use an HTML overlay for interface layout but **only Dofus Retro Remastered 1.40.13 assets for visible graphics**. CSS may position, clip, scale, and compose supplied artwork; do not create replacement artwork with CSS, canvas drawing, SVG, procedural meshes, emojis, or icon libraries. Text may be rendered as text. Three.js textured quads are allowed; untextured visible geometry is not.
- Keep modules small, typed, documented where non-obvious, and data-driven. Do not introduce unnecessary dependencies.

## Core game design
### World and navigation
- Initial scene: **Astrub zaap map** using actual Dofus Retro Remastered map artwork. This is the hub.
- From the hub, the player can select and enter a dungeon via a Dofus-style menu. **No keys, entry costs, or dungeon prerequisites.**
- Initial dungeons: **Incarnam** and **Bouftou**. Each dungeon consists of successive combat waves in a Dofus-style map/arena, culminating in a boss wave. No turn-based mechanics or tactical grid movement.
- Incarnam: **3 normal waves, then a boss wave**. Choose the boss and supporting monsters from actual Dofus 1.x Incarnam content after checking the available data/assets; do not invent a canon boss.
- Bouftou: configurable normal waves, then **Bouftou Royal**, accompanied by **Chef de Guerre Bouftou** and other Bouftous. Start with 3 normal waves by default, configurable.
- Start a new wave after the previous wave is fully defeated, with a short configurable delay. Show wave progress. Dungeon completes when the boss wave is cleared. Allow returning to Astrub on completion or death; specify and implement a consistent death/retry rule.
- Spawn positions, obstacles, collision boundaries, camera framing, and traversable areas must be authored as data for each map. Do not assume that the visual image itself defines collision geometry.

### Collisions des cartes — demande explicite du joueur
- Revoir chaque nouvelle carte et chaque modification de décor : les éléments décoratifs (herbes, fleurs sans tronc, feuilles, ombres, petits débris, petits accessoires au sol et effets de lumière) doivent être traversables. La présence d'un objet de premier plan (`object2`) ne suffit jamais à justifier une collision.
- Les obstacles physiques (troncs, statues sur socle, tombes, poteaux, barrières, murs, bâtiments et stalagmites au sol) restent bloquants à leur emprise au sol. Ne pas transformer les frondaisons, ombres, silhouettes hautes ou stalactites suspendues au plafond en obstacles au sol.
- Préserver les limites du terrain : un décor traversable ne doit pas ouvrir l'accès à l'eau, au vide, à l'intérieur d'un bâtiment ou à un élément extérieur à l'arène.
- Maintenir la classification des objets et les décisions par cellule (identifiant, asset, position, exclusions de bord) dans `scripts/map-navigation.json`. Appliquer les règles dans les préparateurs d'Astrub et des donjons, et mettre à jour le manifeste runtime versionné. Un nouvel objet ou déplacement de décor non revu doit faire échouer la validation plutôt que recevoir une collision implicite.
- Joueur, monstres, pathfinding et projectiles utilisent les mêmes données de navigation. Pour chaque carte revue, vérifier l'accès depuis le spawn aux décors traversables, l'impossibilité de traverser les obstacles et la préservation des limites ; examiner les décors Remastered et leur placement. Exécuter les tests de navigation et `assets:validate`. Les vues de diagnostic restent réservées au développement.

### Player and controls
- **Only playable class: Crâ**. Architecture must allow future classes without rewriting combat.
- **Right mouse click**: move toward the clicked ground position until arrival. **Holding the right button continuously updates the destination to the cursor position**; moving the cursor changes direction without another click. Releasing the button keeps the last destination. Suppress the context menu inside the viewport, cancel held input on pointer cancellation/window blur, and use camera raycasting against the ground plane.
- **AZER** keys map to four abilities, in this exact order:
  - **A — Flèche explosive**: area-of-effect damage at targeted location / enemy.
  - **Z — Flèche enflammée**: directional or targeted fire projectile/line attack.
  - **E — Flèche magique**: straightforward ranged projectile attack.
  - **R — Tir puissant**: temporary self-buff increasing outgoing damage for several seconds.
- These are **real-time adaptations**, not claims of exact Dofus 1.29 spell balance. Keep range, cooldown, projectile speed, damage coefficient, area radius, buff magnitude, and buff duration in editable balance data. Pick sensible MVP defaults and document them.
- Define a coherent targeting scheme: mouse cursor position at cast time, with enemy hit detection and an optional hovered target. Pressing a spell key casts toward cursor; self-buff casts immediately. Show cooldowns and active buff duration using existing Dofus-style UI assets.
- Implement casting/attack animations, projectile/effect animations, hit feedback, cooldowns, movement, and death. **A successful cast immobilizes the player for 0.1–0.2 seconds (current balance: 0.12 s)**. Keep the destination and accept destination changes while locked, including held right click; resume movement after the lock, without charging the locked time as movement. Movement may resume while the remaining compatible cast animation plays. Keep this duration editable in balance data.
- **A/Z/E must show the Crâ drawing and firing a real bow**, using the original `anim10R/L` animations and the original bow accessory; do not leave the generic `anim0` incantation on these three arrow spells. Play the full visual gesture within the configured animation window and restart it on each successful cast. R uses a separate self-buff/incantation gesture. These are real-time adaptations, not claims of exact original spell choreography.
- Movement uses frame-rate-independent delta time, stable collision, pathfinding or obstacle avoidance where necessary, and a consistent player/world depth sorting policy.

### Enemies and combat
- Each enemy has a data-defined archetype, sprite/animation mapping, HP, movement speed, detection range, attack range, damage, attack interval, XP, kamas, and loot table.
- Implement basic enemy AI: acquire player, approach, attack within range, obey cooldowns, react to damage, die, and drop rewards. Avoid stacking all enemies at exactly the same coordinates.
- Use a deterministic, testable damage calculation. **1 Puissance = +1% damage**: `finalDamage = baseDamage * spellMultiplier * (1 + totalPower / 100)`, then apply any explicit buff and resistance modifiers. Define rounding consistently. Do not silently make Puissance an additive flat-damage bonus.
- The MVP can start with no elemental resistance system, but leave a clean extension point for it.
- Bosses have higher XP and kamas rewards than ordinary enemies. Boss HP/damage and wave composition must be configurable.

### Experience, currency, equipment
- Every enemy kill awards **XP and kamas**. Bosses award more.
- Leveling increases **maximum HP** and **base Puissance**. Keep XP curve and per-level increases in balance configuration; decide and document whether level-up restores HP (default: increase current HP by the gained max HP).
- Every monster has a configurable chance to drop an item associated with its family/archetype. Do not claim exact original Dofus drop rates. Use explicit weighted loot tables; include a guaranteed or high-probability drop in a developer test configuration only, not production balance.
- Items give stats; equipment slots and item categories should mirror Dofus where feasible (e.g. hat, cape, amulet, ring slots, belt, boots, weapon, pet if assets exist). Implement only slots supported by actual assets and record gaps.
- Items may belong to sets. Equipping 2/3/etc. pieces grants data-defined **set bonuses**. Recompute final stats from base progression + individual item bonuses + set bonuses + temporary buffs; avoid accumulating bonuses on repeated equip/unequip.
- Inventory supports opening/closing, item icons, tooltips with stats, equip/unequip, stack rules where relevant, and visible equipped slots, all with authentic Dofus Retro art. **Crop item icons to the original drawing with a transparent background**; do not shrink the entire Flash stage into the inventory cell. No trading, crafting, or shops in MVP.
- **Equipped hats and capes must visibly appear on the Crâ in game**, update immediately on equip/unequip, and follow all supported directions, run/cast/hit/death animations and mixed sets. Use original accessory symbols and the source `GAC.applyAccessory` attachment matrices, depths and directional labels. Do not use inventory icons as worn sprites, invent attachment positions or flatten animated capes. Current items: hats 2411/2474 and capes 2414/2473; validate every supported combination.
- Save/load player level, XP, kamas, inventory, equipment, and relevant progression in versioned `localStorage`. Handle corrupted/old saves safely. Do not save copyrighted binary assets in localStorage.

## Assets — non-negotiable
- **Primary asset source: Dofedex**: https://github.com/dofera/dofedex — use its actual Remastered 1.40.13 archive reference and document the exact version, files and hashes used. Do not assume Dofedex provides ready-to-use PNGs.
- Source of truth for visuals: **authentic Dofus Retro Remastered 1.40.13 assets only**, including Astrub zaap and dungeon maps, floor/props, Crâ, Bouftou family, Incarnam monsters, spell animations, item icons, equipment visuals, and UI frames/buttons.
- Characters, accessories and spell animations must retain their timelines; **map decorations are deliberately frozen**, as specified above.
- Original SWF/vector/animated assets may require conversion to transparent PNG frame sequences, sprite atlases, or equivalent browser-compatible formats. Build or adapt an **automated, repeatable local asset import pipeline** with per-frame duration, animation labels, directional variants, anchor/pivot points, scale, offsets, and metadata. Do not flatten animated sprites to a single static image.
- Keep a manifest mapping semantic IDs (`cra.run.south`, `bouftou.attack.west`, `spell.explosive.impact`, etc.) to concrete asset paths, animation frames, pivots, durations, and provenance. Validate missing assets and surface actionable diagnostics.
- Preserve the original Dofus 1.x art style and perspective. No generated art, substitute sprites, CSS-drawn placeholders, vector mockups, emoji, generic stock art, or arbitrary color rectangles in the playable UI. **If a required asset is unavailable, report the blocker clearly and leave the feature explicitly incomplete rather than silently fabricating visuals.** Invisible collision and debug overlays may be used only in developer/debug mode, not as shipped graphics.
- Map rendering should respect Dofus map layers, occlusion, object placement, and correct character depth ordering. Map geometry and vegetation must remain still; do not advance decorative timelines in the render loop. Prefer reconstructing maps from source assets/data to using screenshots when feasible.
- Maintain `docs/ASSETS.md` listing each required asset, source/version, original file path, conversion output, integration status, and usage/redistribution caveats.
- Keep `.local-assets/`, source archives, raw SWF, tools, caches and intermediate exports ignored. **Version the prepared runtime PNG/atlas files and manifest in `public/assets/` at the user’s explicit request.** Provide `assets:import` and `assets:validate` to regenerate and check them. Preserve all copyright/provenance notices; do not infer redistribution rights from the user’s request.

## Suggested project structure
```text
src/
  app/                 # bootstrapping, React UI, Zustand stores
  game/
    core/              # fixed-step loop, events, coordinates, camera
    rendering/         # Three.js sprites, atlases, animation, depth sorting
    input/             # mouse and AZER keyboard mapping
    movement/          # movement, collision, pathfinding
    combat/            # abilities, projectiles, hits, damage, buffs
    ai/                # enemy state machines
    progression/       # XP, levels, kamas, loot, inventory, equipment, sets
    dungeons/          # wave director, spawns, completion, boss encounters
    assets/            # runtime loader and typed manifests
    save/              # versioned persistence
  data/                # class, spell, monster, dungeon, item, set, balance data
  ui/                  # HUD, hub, inventory, equipment, dungeon selection
scripts/               # import/convert/validate user-provided assets
public/                # non-proprietary files only by default
docs/                  # setup, assets, architecture, decisions
```

## Implementation order — follow this order
1. Inspect repository and Dofedex source/archive structure. Write `docs/ASSETS.md` and `docs/PLAN.md`, explicitly distinguishing **confirmed available assets** from missing ones. Establish the legal/provenance-safe local asset import procedure.
2. Bootstrap Vite/Three.js/TypeScript, camera, resize behavior, game loop, asset manifest/loader, and validation. Render the real static Astrub zaap map and the real animated Remastered Crâ before expanding gameplay.
3. Implement single and held right-click world movement, direction-based run/idle animation, collisions, camera and sprite depth sorting.
4. Implement four AZER abilities with actual corresponding spell effects, bow shooting for A/Z/E, the short movement lock, combat system, cooldowns and Crâ animation state machine.
5. Integrate actual Bouftou/Incarnam monsters with animation and AI; implement damage, death, XP, kamas and loot.
6. Implement dungeon selection, Incarnam waves/boss, Bouftou waves/Bouftou Royal boss, completion/retry.
7. Implement inventory with correctly cropped icons, item stats, equipment including visible worn hats/capes, set bonuses, leveling, persistence and UI using original art.
8. Polish feedback/performance, verify tests, document gaps and remaining assets.

## Definition of done for MVP
- `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test` work; `pnpm assets:import` and `pnpm assets:validate` have documented inputs.
- With locally supplied licensed/authorized assets installed, browser starts on actual Astrub zaap, shows animated Crâ, right-click movement, and dungeon selection.
- Incarnam has 3 normal waves plus boss wave; Bouftou ends with Bouftou Royal, Chef de Guerre Bouftou and other Bouftous.
- AZER casts the four defined spells, with correct targeting, bow shooting visuals for A/Z/E, a configurable 0.12 s movement lock, cooldowns, damage and temporary Tir puissant buff. Holding right click resumes cursor-following after the lock.
- Monsters move, attack, take damage, die, and award XP/kamas/loot; level-ups raise max HP and Puissance.
- Inventory icons visibly fill their cells with the cropped original artwork; equipment, item stats, set bonuses and save/load work. Equipping/unequipping hats and capes updates the character appearance, including mixed sets and every supported animation.
- Installed visuals come from the Remastered 1.40.13 archive with documented provenance; all map decorations remain static.
- No fake Dofus art or untextured placeholder graphics appear in normal gameplay. If a necessary asset is missing, the project reports exactly what is missing; do not label that feature complete.
- Unit tests cover damage/Puissance, casting movement lock and destination resumption, cooldown/buff expiration, XP level-up, weighted loot, equipment recomputation, set thresholds, and wave/boss completion. Browser smoke tests cover hub → dungeon → combat → rewards → inventory, item icon transparency/framing, worn hat/cape changes and static map assets.
- No client archives, raw SWF or conversion caches are committed. Only the prepared `public/assets/` runtime lot is versioned under the explicit storage instruction above; copyright and redistribution caveats remain documented.

## Working rules for Codex
- **Implement code, not only plans or pseudocode.** Iterate toward a playable vertical slice; keep it runnable at every milestone.
- Before changing code, inspect existing files and conventions. Prefer minimal, coherent changes. Run relevant tests/build after each major milestone and fix failures.
- Never fabricate asset filenames, source URLs, monster identities, or claims of asset availability. Verify files on disk and record findings. If external downloads are unavailable, make the pipeline work with user-supplied files and state exactly what must be provided.
- Do not swap in an unrelated art pack or generated images to hide missing Dofus assets.
- Make gameplay tuning data-driven; clearly label provisional balance numbers. Avoid hardcoding progression or dungeon waves in UI components.
- Use French player-facing text and documentation; source identifiers and code may be English.
- Report at each milestone: what works, commands to run, actual assets integrated, assets still missing, tests run, and next actionable step.
