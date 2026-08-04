/**
 * The Cell: structure and functions.
 * Aligned to NCERT Class 8 chapter 8.
 */

export const cell = {
  slug: "cell",
  title: "The Cell",
  subtitle: "The unit every living thing is built from",
  subject: "Biology",
  gradeBand: "Class 8",
  description:
    "An elephant and a bacterium have almost nothing in common except this: both are made of cells. This course looks at how the cell was found, what sits inside one, and why plant cells and animal cells differ in exactly three important ways.",

  lessons: [
    /* ------------------------------------------------------------------ 1 */
    {
      slug: "discovering-the-cell",
      title: "A slice of cork, and a new word",
      summary:
        "Nobody suspected cells existed until someone pointed a homemade microscope at a piece of bark.",
      readingMinutes: 4,
      video: { title: "From cork to cell theory", durationS: 92 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "In 1665 Robert Hooke cut a wafer of cork thin enough to see through, put it under a microscope he had built himself, and found it was not solid at all. It was a honeycomb of tiny empty compartments, row upon row. They reminded him of the small bare rooms that monks lived in, called cells, and the name stuck.",
        },
        {
          kind: "callout",
          content:
            "Hooke was looking at dead cork. What he saw were the empty cell walls left behind, not living cells. Living cells were first seen a few years later by Antonie van Leeuwenhoek.",
        },
        { kind: "heading", content: "The discoveries that followed" },
        {
          kind: "list",
          content: [
            "Antonie van Leeuwenhoek, in 1674, was the first to see free living cells, including bacteria, in pond water.",
            "Robert Brown, in 1831, identified the nucleus.",
            "Jan Purkinje, in 1839, gave the name protoplasm to the living material inside a cell.",
            "Matthias Schleiden and Theodor Schwann proposed that all plants and all animals are made of cells.",
            "Rudolf Virchow, in 1855, added the crucial last piece: new cells arise only from cells that already exist.",
          ],
        },
        { kind: "heading", content: "Cell theory" },
        {
          kind: "paragraph",
          content:
            "Put those together and you have cell theory, which says three things. Every living organism is made of one or more cells. The cell is the basic unit of structure and function in living things. And every cell comes from a pre-existing cell. That last point is what ruled out the old idea that life could simply appear in decaying matter.",
        },
        {
          kind: "paragraph",
          content:
            "Organisms made of a single cell are unicellular, such as Amoeba, Paramecium and bacteria. In them one cell performs every function of life on its own. Organisms made of many cells are multicellular, and there the cells specialise: nerve cells carry signals, muscle cells contract, root hair cells absorb water. Division of labour is the whole advantage of being multicellular.",
        },
      ],
      questions: [
        {
          kind: "mcq",
          prompt: "What was Robert Hooke actually looking at when he coined the word cell?",
          explanation:
            "He examined a thin slice of cork, which is dead bark tissue. The compartments he saw were empty cell walls, not living cells.",
          options: [
            ["Empty cell walls in a slice of dead cork", true],
            ["Living bacteria from pond water", false],
            ["Onion peel cells with visible nuclei", false],
            ["Blood cells from his own finger", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Who established that new cells arise only from existing cells?",
          explanation:
            "Rudolf Virchow, in 1855. Schleiden and Schwann had proposed that organisms are made of cells, but did not settle where new cells come from.",
          options: [
            ["Rudolf Virchow", true],
            ["Robert Hooke", false],
            ["Matthias Schleiden", false],
            ["Antonie van Leeuwenhoek", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every statement that forms part of cell theory.",
          explanation:
            "Cell theory has three parts: all organisms are made of cells, the cell is the basic unit of structure and function, and all cells come from pre-existing cells. Cells being visible without a microscope is not part of it and is not true for most cells.",
          options: [
            ["All living organisms are made of one or more cells", true],
            ["The cell is the basic unit of structure and function", true],
            ["All cells arise from pre-existing cells", true],
            ["All cells are large enough to see without a microscope", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "What is the main advantage of being multicellular?",
          explanation:
            "Cells can specialise, so different groups of cells take on different jobs. This division of labour lets the organism do things no single cell could manage alone.",
          options: [
            ["Cells can specialise, giving a division of labour", true],
            ["Each cell becomes able to survive on its own", false],
            ["The organism no longer needs a nucleus", false],
            ["Cells stop needing energy", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Which of these is a unicellular organism?",
          explanation:
            "Amoeba is a single cell that carries out every life function by itself. Onions, earthworms and mango trees are all multicellular.",
          options: [
            ["Amoeba", true],
            ["Earthworm", false],
            ["Onion", false],
            ["Mango tree", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 2 */
    {
      slug: "inside-the-cell",
      title: "Inside the cell",
      summary:
        "A cell is not a bag of fluid. It is a workshop with separate rooms, each doing one job.",
      readingMinutes: 6,
      video: { title: "A tour of the organelles", durationS: 124 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Every cell has at least three things: a boundary, a filling, and a control centre. Beyond those, a eukaryotic cell contains a set of specialised structures called organelles, each with a job specific enough that damage to one has predictable consequences.",
        },
        {
          kind: "figure",
          content: "animal-cell",
          caption: "Fig 2.1  An animal cell in section, with the organelles labelled.",
        },
        { kind: "heading", content: "The boundary and the filling" },
        {
          kind: "list",
          content: [
            "The plasma membrane encloses the cell and controls what enters and leaves. It is selectively permeable, letting some substances through and holding others back. It is present in every cell without exception.",
            "The cytoplasm is the jelly like material between the membrane and the nucleus. Most of the everyday chemical reactions of the cell happen here, and the organelles sit suspended in it.",
          ],
        },
        { kind: "heading", content: "The control centre" },
        {
          kind: "paragraph",
          content:
            "The nucleus is usually the largest structure in the cell and is separated from the cytoplasm by a nuclear membrane with pores in it. Inside sit the chromosomes, thread like structures that carry genes, and a dense body called the nucleolus. The nucleus directs the cell's activities and holds the instructions that are passed on when the cell divides.",
        },
        {
          kind: "callout",
          content:
            "Bacteria have no nuclear membrane. Their genetic material lies loose in the cytoplasm, and cells like that are called prokaryotic. Cells with a proper membrane bound nucleus are eukaryotic.",
        },
        { kind: "heading", content: "The working organelles" },
        {
          kind: "list",
          content: [
            "Mitochondria release energy from food and store it in a usable form, which is why they are described as the powerhouse of the cell. Muscle cells are packed with them.",
            "Ribosomes are the sites where proteins are assembled.",
            "The endoplasmic reticulum is a network of tubes that transports material through the cell. Rough endoplasmic reticulum carries ribosomes on its surface, and smooth does not.",
            "The Golgi apparatus packages and dispatches substances made elsewhere in the cell.",
            "Lysosomes contain digestive chemicals and break down worn out parts and foreign material.",
            "Vacuoles are fluid filled sacs used for storage. In animal cells they are small and numerous.",
          ],
        },
      ],
      questions: [
        {
          kind: "mcq",
          prompt: "Which organelle is described as the powerhouse of the cell?",
          explanation:
            "Mitochondria release energy from food and store it in a form the cell can use, so cells that need a lot of energy contain many of them.",
          options: [
            ["Mitochondria", true],
            ["Ribosomes", false],
            ["Golgi apparatus", false],
            ["Lysosomes", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "What does it mean to say the plasma membrane is selectively permeable?",
          explanation:
            "It allows some substances to pass through while holding others back, which is how the cell controls its own internal composition.",
          options: [
            ["It lets some substances pass and blocks others", true],
            ["It lets everything pass freely", false],
            ["It blocks everything completely", false],
            ["It only allows water to leave, never to enter", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every structure found inside the nucleus.",
          explanation:
            "The nucleus contains chromosomes, which carry the genes, and the nucleolus. Mitochondria and ribosomes sit in the cytoplasm, not inside the nucleus.",
          options: [
            ["Chromosomes", true],
            ["Nucleolus", true],
            ["Mitochondria", false],
            ["Golgi apparatus", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "A cell has no nuclear membrane and its genetic material lies loose in the cytoplasm. What is it called?",
          explanation:
            "That is a prokaryotic cell. Bacteria are the common example. Cells with a membrane bound nucleus are eukaryotic.",
          options: [
            ["Prokaryotic", true],
            ["Eukaryotic", false],
            ["Multicellular", false],
            ["Unicellular", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Which organelle assembles proteins?",
          explanation:
            "Ribosomes are the sites of protein synthesis. Some float in the cytoplasm and others sit on the rough endoplasmic reticulum.",
          options: [
            ["Ribosomes", true],
            ["Lysosomes", false],
            ["Vacuoles", false],
            ["Plastids", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 3 */
    {
      slug: "plant-and-animal-cells",
      title: "Three differences that change everything",
      summary:
        "Plant cells and animal cells share most of their machinery. The three things plants have extra explain why a tree can stand up and feed itself.",
      readingMinutes: 5,
      video: { title: "Side by side: plant and animal", durationS: 106 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Nearly everything in the last lesson is common to both. The membrane, cytoplasm, nucleus, mitochondria, ribosomes, endoplasmic reticulum and Golgi apparatus all appear in plant and animal cells alike. The differences come down to three structures.",
        },
        {
          kind: "figure",
          content: "plant-cell",
          caption:
            "Fig 3.1  A plant cell. Compare it with figure 2.1: the wall, the chloroplasts and the single large vacuole are the additions.",
        },
        { kind: "heading", content: "One: the cell wall" },
        {
          kind: "paragraph",
          content:
            "Outside the plasma membrane, a plant cell has a rigid wall made of cellulose. It gives the cell a fixed shape and lets it withstand pressure from the water inside without bursting. That rigidity, repeated across millions of cells, is what allows a plant to stand upright without a skeleton. Animal cells have no wall, which is why they are usually rounded and flexible.",
        },
        { kind: "heading", content: "Two: plastids" },
        {
          kind: "paragraph",
          content:
            "Plant cells contain plastids. The green ones, chloroplasts, hold the pigment chlorophyll and are where photosynthesis happens. This is the reason a plant can make its own food while an animal must go and find some. Not every plant cell has chloroplasts: root cells receive no light and generally do not.",
        },
        { kind: "heading", content: "Three: the vacuole" },
        {
          kind: "paragraph",
          content:
            "An animal cell has several small vacuoles. A mature plant cell usually has one very large central vacuole, sometimes taking up most of the volume. Filled with cell sap, it pushes outwards against the wall and keeps the cell firm. When a plant loses water those vacuoles shrink, the push disappears, and the plant wilts.",
        },
        {
          kind: "callout",
          content:
            "A useful memory aid: wall, chloroplast, big vacuole. If a diagram shows any of the three, it is a plant cell.",
        },
      ],
      questions: [
        {
          kind: "multi",
          prompt: "Select every structure present in a plant cell but absent from an animal cell.",
          explanation:
            "The cell wall, plastids including chloroplasts, and a single large central vacuole are the three plant specific features. Mitochondria are present in both.",
          options: [
            ["Cell wall", true],
            ["Chloroplast", true],
            ["A single large central vacuole", true],
            ["Mitochondria", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "What is the plant cell wall made of?",
          explanation:
            "Cellulose. It sits outside the plasma membrane and gives the cell a rigid, fixed shape.",
          options: [
            ["Cellulose", true],
            ["Protein", false],
            ["Chlorophyll", false],
            ["Fat", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Why does a plant wilt when it does not get enough water?",
          explanation:
            "The large central vacuoles lose water and shrink. Without their outward push against the cell walls the cells go limp, and the plant droops.",
          options: [
            ["The vacuoles shrink and stop pushing against the cell walls", true],
            ["The cell walls dissolve", false],
            ["The chloroplasts stop making food immediately", false],
            ["The nucleus stops working", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Why do root cells usually lack chloroplasts?",
          explanation:
            "Chloroplasts carry out photosynthesis, which needs light. Roots are underground and receive none, so chloroplasts there would be useless.",
          options: [
            ["They are underground and receive no light", true],
            ["They are too small to hold chloroplasts", false],
            ["They do not need energy at all", false],
            ["They have cell walls instead", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "An animal cell placed in pure water can burst, but a plant cell in the same water does not. Why?",
          explanation:
            "The rigid cellulose wall of the plant cell resists the outward pressure as water enters. An animal cell has only its flexible membrane, which can be stretched until it tears.",
          options: [
            ["The rigid cell wall resists the pressure of the water entering", true],
            ["Plant cells do not absorb water", false],
            ["The chloroplasts absorb the excess water", false],
            ["Plant cells have no plasma membrane", false],
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ 4 */
    {
      slug: "size-shape-number",
      title: "How big is a cell",
      summary:
        "Cells range from a fraction of a micrometre to something you can hold in your hand, and shape follows function every time.",
      readingMinutes: 5,
      video: { title: "Scale, from bacterium to ostrich egg", durationS: 98 },
      blocks: [
        {
          kind: "paragraph",
          content:
            "Most cells are far too small to see. The usual unit is the micrometre, written as one millionth of a metre. A human red blood cell is about 7 micrometres across, which means roughly 140 of them laid in a line would span a single millimetre.",
        },
        {
          kind: "figure",
          content: "cell-scale",
          caption:
            "Fig 4.1  Cell sizes on a logarithmic scale. Each step to the right is ten times larger than the last.",
        },
        { kind: "heading", content: "The extremes" },
        {
          kind: "list",
          content: [
            "The smallest known cells are bacteria of the genus Mycoplasma, at around 0.3 micrometres.",
            "A typical bacterium is 1 to 10 micrometres.",
            "A human red blood cell is about 7 micrometres, and a human egg cell about 100 micrometres, which is just at the limit of unaided vision.",
            "The largest single cell is the yolk of an ostrich egg, around 15 centimetres.",
            "Some nerve cells are only micrometres wide but run for a metre or more in length.",
          ],
        },
        {
          kind: "callout",
          content:
            "Size has nothing to do with the size of the organism. An elephant's cells are not bigger than a mouse's cells. The elephant simply has far more of them.",
        },
        { kind: "heading", content: "Shape follows function" },
        {
          kind: "paragraph",
          content:
            "A nerve cell is long and branched because its job is to carry a signal a long way and connect to many neighbours. A red blood cell is a flattened disc pinched in at the centre, which gives it more surface for its volume and lets it fold through narrow capillaries. A root hair cell pushes out a long thin projection to reach more soil water. Amoeba has no fixed shape at all, which is exactly how it moves and engulfs food.",
        },
        {
          kind: "paragraph",
          content:
            "There is also a limit on how big a single cell can usefully get. As a cell grows, its volume increases faster than its surface area, so at some point the membrane can no longer bring in enough material to serve the interior. Dividing solves the problem, and that is one reason organisms grow by making more cells rather than bigger ones.",
        },
      ],
      questions: [
        {
          kind: "numeric",
          prompt:
            "A human red blood cell is about 7 micrometres across. Approximately how many would fit in a line across 1 millimetre? Give your answer to the nearest whole number.",
          answer: 143,
          tolerance: 3,
          unit: "cells",
          explanation:
            "One millimetre is 1000 micrometres. Dividing 1000 by 7 gives about 143 cells.",
        },
        {
          kind: "mcq",
          prompt: "Which is the largest single cell?",
          explanation:
            "The yolk of an ostrich egg, at around 15 centimetres, is the largest known single cell.",
          options: [
            ["The yolk of an ostrich egg", true],
            ["A human nerve cell", false],
            ["A human egg cell", false],
            ["A Mycoplasma bacterium", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "An elephant is far bigger than a mouse. How do their cells compare in size?",
          explanation:
            "They are broadly the same size. Larger organisms have more cells, not bigger ones.",
          options: [
            ["They are roughly the same size, but the elephant has far more of them", true],
            ["Elephant cells are much larger", false],
            ["Elephant cells are much smaller but more active", false],
            ["Elephants have one very large cell per organ", false],
          ],
        },
        {
          kind: "mcq",
          prompt: "Why is there an upper limit on how large a single cell can usefully be?",
          explanation:
            "Volume grows faster than surface area. Past a certain size the membrane cannot exchange enough material to supply the interior, so dividing becomes necessary.",
          options: [
            ["Volume grows faster than surface area, so the membrane cannot supply the interior", true],
            ["The nucleus would run out of chromosomes", false],
            ["Large cells cannot contain mitochondria", false],
            ["Gravity would crush the cell wall", false],
          ],
        },
        {
          kind: "multi",
          prompt: "Select every cell whose shape is clearly matched to its job.",
          explanation:
            "All four are genuine examples of form following function: nerve cells carry signals over distance, red blood cells squeeze through capillaries, root hair cells reach more water, and Amoeba changes shape to move and feed.",
          options: [
            ["A long branched nerve cell that carries signals over distance", true],
            ["A flattened red blood cell that folds through narrow capillaries", true],
            ["A root hair cell with a long projection reaching into soil", true],
            ["An Amoeba that changes shape to move and engulf food", true],
          ],
        },
      ],
    },
  ],
};
