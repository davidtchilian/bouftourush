# Authentification obligatoire

La demande d’authentification remplace le fonctionnement sans serveur et hors connexion initial. Le compte `fredi` a été provisionné sur cette machine. Son mot de passe n’est présent ni dans le code client ni dans Git.

## Exécution

`pnpm dev` lance le serveur protégé sur le port 5173. `pnpm build` puis `pnpm start -- --port 4173` servent la version compilée avec la même protection. `pnpm preview` applique également cette protection. Ne jamais exposer `dist/`, `public/` ou le serveur Vite derrière une route qui contourne ce contrôle. Pour un accès Internet, placer le serveur derrière HTTPS et définir `AUTH_SECURE_COOKIE=true` lorsque TLS est terminé par un reverse proxy. Ne pas publier le serveur de développement sur Internet.

Le serveur lit `.local-auth/account.json`, ou le chemin absolu indiqué dans `AUTH_ACCOUNT_FILE`. Ce fichier privé contient `{ "username": "…", "salt": "…", "hash": "…" }` : sel aléatoire de 16 octets en hexadécimal, dérivation scrypt de 64 octets en hexadécimal, paramètres N=32768, r=8, p=1. Les primitives utilisées sont documentées dans [Node.js Crypto](https://nodejs.org/api/crypto.html). Le dossier est ignoré par Git, avec permissions locales 0700 et fichier 0600 lors du provisionnement. Pour installer la même instance ailleurs, transférer ce fichier par un canal privé et préserver ses permissions. Son absence ou un format invalide fait échouer le démarrage ; aucun compte ni mot de passe par défaut n’est créé.

Aucune API d’inscription ou de création de compte n’existe. Les routes de connexion et de déconnexion exigent POST et une origine correspondant au serveur. Le mot de passe est comparé côté serveur ; l’échec n’indique pas si l’identifiant existe. Limitation à dix tentatives par adresse sur quinze minutes et quatre vérifications simultanées ; les en-têtes de proxy ne permettent pas de choisir l’adresse de limitation.

Les sessions opaques aléatoires sont conservées en mémoire côté serveur, avec expiration absolue après huit heures. Le cookie utilise HttpOnly et SameSite=Strict ; Secure est actif en HTTPS direct ou via `AUTH_SECURE_COOKIE=true`. Déconnexion et redémarrage du serveur invalident les sessions. Le navigateur vérifie la session toutes les quinze secondes et au retour du focus, et ferme le jeu si le serveur devient inaccessible. L’événement de perte du réseau arrête immédiatement le rendu et la simulation. La progression reste dans le localStorage existant de cet appareil ; elle n’est pas déplacée vers une base de données.

## Accès et cache

Seules la page de connexion, les opérations d’authentification et le script de retrait de l’ancien service worker sont accessibles sans session. Les requêtes directes vers les assets, sources et autres routes sont refusées. Les fichiers privés sont aussi interdits aux joueurs connectés. Les réponses ne doivent pas être mises en cache par un proxy.

La nouvelle version ne génère plus de manifeste hors connexion et n’installe plus de service worker. `/sw.js` remplace l’ancien worker par un script supprimant les caches `bouftourush-offline-*`, désinscrivant le worker et redirigeant ses onglets vers la connexion. Un navigateur possédant déjà l’ancienne version hors connexion doit contacter le serveur et recevoir cette mise à jour pour que son ancien cache soit supprimé : les copies déjà téléchargées ne peuvent pas être révoquées à distance tant que cet appareil reste hors ligne.

## Vérifications

`pnpm test` couvre accès anonyme, absence d’inscription, identifiants invalides, origine externe, limites de tentatives, cookies forgés, accès authentifié, secrets, expiration et déconnexion. `pnpm test:browser` utilise un compte de test aléatoire dans `.local-auth/browser-test.json`, sur un serveur isolé port 4173 ; les tests ne modifient pas le compte `fredi`. `pnpm test:offline` vérifie désormais que la version compilée ne démarre pas sans réseau. Les tests navigateur nécessitent Node.js 22+ et Chromium Playwright installé.
