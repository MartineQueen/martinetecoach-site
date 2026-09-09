# Martine te coach — martinetecoach.fr

Site statique (HTML/CSS/JS vanilla) pour le coaching stratégique de Marine ("Martine te coach"). Pas de framework, pas de build : on édite directement `index.html`, `entreprises.html`, `contact.html`, `mentions-legales.html`, `404.html`, `styles.css`, `script.js`.

## Contexte business

Marine (contact : martine@lesmartines.app) est aussi fondatrice de [Les Martines](https://www.lesmartines.app), un réseau social d'entraide entre femmes (+40 000 followers organique, 4,8/5 sur 400+ avis). Ce site sert son activité de coaching stratégique en parallèle : fondatrices early-stage (page `index.html`) et entreprises/incubateurs (page `entreprises.html`).

## Voix et ton (important, ne pas dévier sans validation de Marine)

- Ton direct, cash, jamais corporate. Beaucoup de gras stratégique (`<strong>`).
- Public visé au féminin explicite ("meufs"), écriture inclusive avec point médian (`·es`, `·euses`) partout, y compris dans le JSON-LD.
- Mot interdit : **"accompagnement"/"accompagner"** → toujours dire **"coaching"/"coacher"**.
- Jamais de métaphores corporelles bizarres ("dans les veines", "dans les mains") ni de métaphores filées non maîtrisées (ex : train) — Marine les retoque systématiquement.
- Ne jamais inventer de chiffres, résultats ou citations clients : tout doit être vérifiable ou vérifié directement auprès de Marine.

## Design system (`styles.css`)

Variables CSS clés : `--violet-dark`, `--violet-primary` (#6066d8), `--violet-lilas`, `--violet-lilas-light` (#ececff), `--lime` (#dbff73), `--coral`, `--cream` (#fffbf9), `--peach` (#ffeee2), `--white`, `--radius-card` (20px), `--radius-lg`, `--radius-sm`.

Pattern de carte standard : `border-radius: var(--radius-card); box-shadow: 0 16px 32px -12px rgba(46,48,107,0.08), 0 2px 8px rgba(0,0,0,0.04);` + hover `translateY(-8px)` et ombre violette plus marquée.

Animations au scroll : attributs `data-reveal` / `data-reveal-stagger` (GSAP + ScrollTrigger, chargés en CDN dans le `<script>` de fin de page). Le JS `script.js` gère aussi le menu mobile, le cookie banner, le tracking, et le form contact en AJAX.

## Tracking / Analytics

- **GA4** (`G-YCLN8DN1E5`) : chargé uniquement après consentement cookie (fonction `loadGoogleAnalytics()` dans `script.js`), conforme RGPD.
- **Cloudflare Web Analytics** : cookieless, actif sans condition sur les 5 pages (`<script ... beacon.min.js ...>` en fin de `<body>`).
- **Événement custom `click_book_call`** : se déclenche sur tout clic vers un lien Calendly (délégation d'événement dans `script.js`), envoyé à GA4 seulement si le consentement est donné.
- **Liens UTM de campagne** : voir `../tracking-liens-campagne.md` (dans le dossier parent) pour les liens trackés par post/canal (`utm_campaign=sept2026`).

## Déploiement

- **Actuellement en ligne via Netlify** (drag-and-drop du dossier). Toute modif doit être re-déployée manuellement par Marine sur Netlify pour être visible en prod.
- **Migration en cours vers GitHub Pages** : repo `https://github.com/MartineQueen/martinetecoach-site.git`, branche `main`, Pages activé (Source = branche main, racine), domaine custom `martinetecoach.fr` déjà configuré via le fichier `CNAME`.
- **Bloqué jusqu'à ~1er novembre 2026** : le domaine `martinetecoach.fr` (o2switch, "domaine seul", pas de cPanel) est sous verrou ICANN de 60 jours post-enregistrement, impossible de changer les nameservers avant. Le plan une fois débloqué : délégation des nameservers vers Cloudflare (voir la doc o2switch officielle sur le sujet), IPs GitHub Pages à utiliser en A records si besoin : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- Il y a des changements non commités dans le repo git local (`entreprises.html`, `index.html`, `script.js`, `styles.css`) — à committer avant de continuer.

## Campagne marketing en cours

4 semaines, 0€ de budget, organique (LinkedIn + Instagram + groupes WhatsApp entrepreneurs). Détails complets dans le dossier parent :
- `../campagne-visibilite-4-semaines.md` — brief complet
- `../posts-linkedin-4-semaines.md` — 8 posts LinkedIn + message WhatsApp
- `../tracking-liens-campagne.md` — liens UTM par post/canal
- `../prompt-nouvelle-conversation-campagne.md` — contexte condensé de la campagne

## Autres docs de référence (dossier parent, hors repo)

Offres, brief Figma initial, déroulé accompagnement 3 mois, template Notion client — tous en `.md`/`.docx` à la racine de `Business perso`, utiles pour rester cohérent sur les offres et le positionnement.
