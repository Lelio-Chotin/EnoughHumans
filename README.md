# Enough Humans™  

> À un moment donné, les chiffres l’emportent, non ?

**Enough Humans™** est une simulation visuelle et interactive qui explore une question simple :  
*la supériorité numérique suffit-elle toujours à gagner ?*

À travers différents scénarios (et un mode bac à sable), le projet met en scène des affrontements où le nombre, le type d’unités et les règles physiques influencent l’issue du combat.

---

## Le projet

- Simulation 2D en temps réel
- Moteur maison en JavaScript (sans framework)
- Résultats non déterministes
- Aucun backend, tout se passe côté client

Le projet est une **expérience visuelle** qui sert une légère **réflexion** sur le chaos et les avantages de masses.

---

## Fonctionnalités

- **Scénarios prédéfinis**  
  Chaque duel applique une règle différente (saturation, meute, chaos, avantage mécanique, etc.)

- **Mode Bac à Sable**  
  Choisis les types d’unités et leurs quantités pour observer les résultats par toi-même.

- **Contrôle du temps**  
  Vitesse de simulation ajustable (x1, x2, x4).

- **Zoom & navigation**  
  Zoom dynamique et déplacement de la scène.

- **Statistiques en direct**  
  Compteurs d’unités restantes et temps de simulation.

- **Effets visuels**  
  Knockback, particules, ondes de choc et animations SVG.

---

## Démo en ligne

**https://leliochotin.fr/simu**

---

## Stack technique

- **HTML / CSS** — structure et rendu
- **JavaScript (vanilla)** — moteur de simulation
- **SVG animés** — entités et effets visuels
- **Aucune dépendance externe**

---

## Installation locale

Cloner le dépôt :
   ```bash
   git clone https://github.com/Lelio-Chotin/EnoughHumans.git
```
---

## Structure du projet (simplifiée)
 ```
EnoughHumans/
├── index.html
├── style.css
├── app.js
├── combats.js
├── carouselHomeMade.js
├── sprites/
│   └── ...
```

---

### Auteur

Lelio Chotin
**https://leliochotin.fr**
