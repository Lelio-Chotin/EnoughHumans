const CHAR_TYPES = {
    adulte: { w: 75, h: 85, hp: 1100, speed: 115, damage: 30, cooldown: 600, color: 'transparent', kbForce: 20, range: 75, splash: 0, mass: 3 },
    enfant: { w: 50, h: 50, hp: 65, speed: 95, damage: 2, cooldown: 1400, color: 'transparent', kbForce: 2, range: 50, splash: 0, mass: 1 },
    chien: { w: 70, h: 60, hp: 320, speed: 155, damage: 18, cooldown: 500, color: 'transparent', kbForce: 28, range: 50, splash: 0, mass: 1.5 },
    gorille: { w: 175, h: 150, hp: 7500, speed: 85, damage: 190, cooldown: 1200, color: 'transparent', kbForce: 80, range: 100, splash: 90, mass: 12 },
    oie: { w: 175, h: 130, hp: 900, speed: 180, damage: 45, cooldown: 450, color: 'transparent', kbForce: 55, range: 80, splash: 35, mass: 2 },
    boxeur: { w: 75, h: 85, hp: 1600, speed: 140, damage: 95, cooldown: 420, color: 'transparent', kbForce: 55, range: 80, splash: 0, mass: 3.5 },
    batte: { w: 110, h: 85, hp: 1300, speed: 110, damage: 65, cooldown: 550, color: 'transparent', kbForce: 70, range: 85, splash: 20, mass: 3 },
    batman: { w: 90, h: 90, hp: 1800, speed: 145, damage: 85, cooldown: 480, color: 'transparent', kbForce: 50, range: 80, splash: 40, mass: 4 }
};


const SCENARIOS = {
    "1": {
        nom: "Seuil de Saturation",
        description: `
Sur le papier, la supériorité numérique est écrasante. Pourtant, les statistiques montrent qu’un adulte moyen possède une force physique environ 6 à 8 fois supérieure à celle d’un enfant, et surtout une bien meilleure capacité à encaisser des chocs.
Dans ce duel, les enfants compensent leur très faible puissance par leur nombre, mais leur faible portée, leurs dégâts insignifiants et leur knockback quasi nul rendent chaque attaque inefficace individuellement.
Ce scénario illustre un principe clé des conflits asymétriques : tant que la masse ne parvient pas à neutraliser la mobilité et la capacité de frappe centrale, le nombre seul ne suffit pas.
        `,
        teamA: { type: "adulte", count: 1 },
        teamB: { type: "enfant", count: 18 }
    },

    "2": {
        nom: "La Loi de la Meute",
        description: `
Les chiens compensent leur gabarit plus modeste par une vitesse élevée, un excellent ratio dégâts/cooldown et surtout une agressivité collective.
Dans la réalité comme dans cette simulation, une meute coordonnée est capable de désorienter une cible humaine en multipliant les angles d’attaque.
Ce duel met en évidence l’impact de la vitesse et de la pression constante : même sans dégâts massifs, empêcher l’adversaire de respirer est souvent plus efficace qu’un coup puissant isolé.
        `,
        teamA: { type: "adulte", count: 3 },
        teamB: { type: "chien", count: 5 }
    },

    "3": {
        nom: "Anomalie de Masse",
        description: `
Le gorille est une anomalie statistique. Sa force brute dépasse celle de plusieurs humains réunis, et sa capacité de projection transforme chaque impact en événement de zone.
Dans ce scénario, les humains ne peuvent espérer gagner que par saturation : encercler, temporiser, exploiter les temps de récupération.
Ce duel démontre une réalité biomécanique bien documentée : face à une créature disposant d’une force et d’une masse extrêmes, la coordination est plus importante que le courage individuel.
        `,
        teamA: { type: "gorille", count: 1 },
        teamB: { type: "adulte", count: 10 }
    },

    "4": {
        nom: "Avantage Mécanique",
        description: `
Une arme contondante modifie radicalement l’équilibre d’un affrontement. La batte augmente la portée, le knockback et introduit des dégâts de zone limités.
Historiquement, l’accès à une arme simple multiplie l’efficacité d’un combattant, même sans formation poussée.
Ce duel illustre l’avantage mécanique pur : à compétences égales, l’outil prolonge le corps et transforme chaque contact en menace sérieuse.
        `,
        teamA: { type: "batte", count: 1 },
        teamB: { type: "adulte", count: 4 }
    },

    "5": {
        nom: "Facteur Chaos",
        description: `
Souvent sous-estimée, l’oie combine agressivité territoriale, vitesse élevée et attaques désorganisantes.
Des études comportementales montrent que les oies provoquent souvent une réponse de panique disproportionnée chez l’humain.
Dans ce scénario, la mobilité extrême et les dégâts en zone de l’oie illustrent comment un adversaire chaotique peut briser une formation pourtant numériquement supérieure.
        `,
        teamA: { type: "oie", count: 1 },
        teamB: { type: "adulte", count: 5 }
    },

    "6": {
        nom: "Spécialisation Critique",
        description: `
Un boxeur entraîné dispose d’une puissance de frappe, d’une vitesse d’exécution et d’une précision très supérieures à un individu moyen.
Cependant, l’endurance et la technique montrent leurs limites face à des attaques simultanées.
Ce duel met en lumière une constante des sports de combat réels : la spécialisation est redoutable en duel, mais vulnérable face au surnombre non coordonné.
        `,
        teamA: { type: "boxeur", count: 1 },
        teamB: { type: "adulte", count: 5 }
    },

    "7": {
        nom: "Supériorité Tactique",
        description: `
Batman n’est pas une force brute exceptionnelle, mais une combinaison optimale de mobilité, d’équipement et de contrôle de zone.
Inspiré des principes de combat urbain et de domination psychologique, ce duel repose sur la capacité à frapper vite, fort, et à désorganiser l’adversaire.
Il illustre un principe fondamental des affrontements modernes : l’avantage technologique et tactique peut compenser un désavantage numérique significatif.
        `,
        teamA: { type: "batman", count: 1 },
        teamB: { type: "adulte", count: 6 }
    },

    "sandbox": {
        nom: "Bac à Sable",
        isSandbox: true
    }
};
