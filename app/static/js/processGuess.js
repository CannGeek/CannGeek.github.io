
var solution_id = document.getElementById("solution").innerText;
console.log(solution_id);
var solution_recipe;
var solution_item;
let recipes;

function getSolutionRecipe() {
    fetch(
        "static/data/recipes.json"
    ).then(response => {
        return response.json();
    }).then(obj => {
        recipes = obj;
        console.log("recipes"+recipes);
        let rawrecipe = recipes[solution_id];    
        populateSolution(rawrecipe);
    });
        
}


function populateSolution(rawrecipe) {
    console.log(rawrecipe);
    solution_recipe = rawrecipe["input"];
    solution_item = rawrecipe["output"];
    init(solution_recipe);
    console.log(solution_item, solution_recipe);
}

/**
 * Compares 2 tables of equal dimensions.  Only considers slots equal to 
 * matchOnly, if given.
 * @param {Array} table1 
 * @param {Array} table2 
 * @param {*} matchOnly 
 * @returns {Array} matchmap, matchcount, isFullMatch
 */
function compareTables(table1, table2, matchOnly) {

    // 0 is wrong, 1 is null match, 2 is item match
    let matchmap = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    let matchcount = 0;
    let isFullMatch = true;
    for (let i = 0; i < table1.length; i++) {
        for (let j = 0; j < table1[0].length; j++) {
            // if matchOnly arg given
            if (matchOnly !== undefined) {
                // if either do not match matchOnly
                if (table1[i][j] !== matchOnly || table1[i][j] !== matchOnly) {
                    // leave matchmap entry as incorrect
                    continue;
                }
            }
            
            if (table1[i][j] === table2[i][j]) {
                if (table1[i][j] === null) {
                    // if match is air
                    matchmap[i][j] = 1;
                } else {
                    // if match is item
                    matchmap[i][j] = 2;
                    matchcount++;
                }

            }
            else {
                isFullMatch = false;
            }
        }                   
    }

    return [matchmap, matchcount, isFullMatch];
}

/**
 * Will generate every possible variant position a given recipe can be created 
 * in a crafting table.  
 * @param {Array} recipe 
 * @returns {Array} Array of all possible variants
 */
function generateVariants(recipe) {
    let height = recipe.length
    let width = recipe[0].length;
    let verticalVariants = 4 - recipe.length;
    let horizontalVariants = 4 - recipe[0].length;

    let variants = []

    for (let i = 0; i < verticalVariants; i++) {
        for (let j = 0; j < horizontalVariants; j++) {
            let currentVariant = [
                [null, null, null],
                [null, null, null],
                [null, null, null]
            ];

            for (let k = 0; k < height; k++) {
                for (let l = 0; l < width; l++) {
                    currentVariant[i+k][j+l] = recipe[k][l];
                }
            }
            variants.push(currentVariant);
        }
    }
    return variants;
}


/**
 * Compares given guess to each variant in allVariants
 * @param {*} guess 
 * @returns {Array} if matches any variants, matchmap of guess and that variant
 */
function checkAllVariants(guess) {
    let isCorrect = false
    let matchmap = null;
    
    allVariants.forEach( (variant, i)=>{
        matchData = compareTables(variant, guess);
        // matchData[2] is boolean isFullMatch
        if (matchData[2]) {
            isCorrect = true;
            matchmap = matchData[0];
        }
    });
    return [isCorrect, matchmap];
}
/**
 * Compares guess to each variant in remainingVariants and counts how many slots
 * are correct.
 * @param {*} guess 3x3 array of crafting guess
 * @returns {Array} array of all matchmaps, array of correct slot counts
 */
function checkRemainingVariants(guess) {
    
    let matchmaps = [];
    let matchcounts = []
    
    remainingVariants.forEach( (variant)=>{
        let matchData = compareTables(variant, guess);

        matchmaps.push(matchData[0]);
        matchcounts.push(matchData[1]);
    });

    return [matchmaps, matchcounts];
}

/**
 * Determines which variants in remainingVariants will stay.  Chooses variant 
 * with highest number of matches.  If multiple of these, picks one and only
 * keeps variants with matching correct slots as the chosen one.
 * @param {Array} matchmaps
 * @param {Array} matchcounts 
 * @returns 
 */
function findRemainingVariantsIndices(matchmaps, matchcounts) {
    // Get index of max value in matchcounts
    let maxMatchesIndex = matchcounts.indexOf(Math.max(...matchcounts));
    // generate mask matchmap at this index for 2's
    let correctSlots = compareTables(matchmaps[maxMatchesIndex], matchmaps[maxMatchesIndex], 2)[0];

    let remainingVariantsIndices = []

    matchmaps.forEach( (matchmap, i)=>{
        // mask to only include 2's in matchmaps
        let matchDataToCompare = compareTables(matchmap, matchmap, 2); 
        // compare masked
        let correctSlotOverlapData = compareTables(correctSlots, matchDataToCompare[0])
        
        // if correctSlotOverlapData is full match
        if (correctSlotOverlapData[2]) {
            remainingVariantsIndices.push(i);
        }
    });

    return [remainingVariantsIndices, correctSlots];
}

/**
 * Creates a table of with correct items that have been guessed filled in
 * @param {Array} guess 
 * @param {Array} correctSlots a matchmap of guess on the solution
 * @returns {Array} table with item strings filled in
 */
function generateNextGuessStartingTable(guess, correctSlots) {
    let startingTable = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
    ];

    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < guess[0].length; j++) {
            if (correctSlots[i][j] === 2) {
                startingTable[i][j] = guess[i][j];
            }
        }
    }

    return startingTable;
}

/**
 * Adds orange slots to a given table.  Requires all correctSlots to already be
 * filled in.
 * @param {Array} guess 
 * @param {Array} correctSlots 
 */
function addOrangeSlots(guess, correctSlots) {
    n_items = {}
    // first pass initiliases all item dict entries to 0
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (guess[i][j] === null) {

            } else if (n_items[guess[i][j]] === undefined) {
                n_items[guess[i][j]] = 0
            }
        }
    }

    // Second pass counts how many of each item are correct
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (correctSlots[i][j] === 2) {
                n_items[guess[i][j]]++;
            }
        }
    }


    // finds how many of each item are left to be identified
    n_unidentified_items = {...solution_n_items};
    Object.keys(solution_n_items).forEach((e,i)=>{
        if (n_unidentified_items[e] !== undefined) {
            n_unidentified_items[e] = solution_n_items[e] - n_items[e]
        }
    });
    console.log(solution_n_items)
    console.log(n_unidentified_items)

    // final pass marks (at most n) orange slots for each item in n_unidentified_items
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (correctSlots[i][j] === 2) {

            } else if (n_unidentified_items[guess[i][j]] > 0) {
                correctSlots[i][j] = 3;
                n_unidentified_items[guess[i][j]]--;
            }
        }
    }
}

/**
 * Takes guess table, checks against all variants.  If not a full match to any,
 * it checks the remainingVariants.  Trims remainingVariants based on 
 * correctSlots identified.
 * @param {Array} guess 
 * @returns {Array} isGuessTheSolution, matchmap of guess to remainingVariants
 */
function processGuess(guess) {
    guessCount++;
    console.log("GUESS #"+guessCount)

    // Checks guess against ALL variants.
    // May be able to replace this later when the crafting decision tree is implemented
    let allVariantsData = checkAllVariants(guess);
    let isFullMatch = allVariantsData[0];
    let matchmap = allVariantsData[1];

    if (isFullMatch) {
        return [true, compareTables(guess,guess)[0]];
    }

    // if it isn't a fullmatch to any variant

    // Generates matchmaps and matchcounts for guess compared to all remainingVariants
    let remainingMatchData = checkRemainingVariants(guess);
    // Generates list of indices to keep in remainingVariants, and a matchmap for the matches shared by all variants indices and the guess
    let remainingVariantsData = findRemainingVariantsIndices(remainingMatchData[0], remainingMatchData[1]);
    let remainingVariantsIndices = remainingVariantsData[0]; // indices to keep in remainingVariants
    let correctSlots = remainingVariantsData[1]; // matches shared by all variants indices and the guess 


    // Recreate remainingVariants based on the given indices
    let cleanedVariants = []
    remainingVariantsIndices.forEach((variantIndex)=>{
        cleanedVariants.push(remainingVariants[variantIndex]);
    });
    remainingVariants = cleanedVariants;

    // this may unnecessary, depends how we want game to function
    startingTable = generateNextGuessStartingTable(guess, correctSlots);
    
    addOrangeSlots(guess, correctSlots);

    return [false, correctSlots];
}

function init(solution) {
    for (let i = 0; i < solution.length; i++) {
        for (let j = 0; j < solution[0].length; j++) {
            if (solution[i][j] === null) {

            } else if (solution_n_items[solution[i][j]] === undefined) {
                solution_n_items[solution[i][j]] = 1
            } else {
                solution_n_items[solution[i][j]]++;
            }
        }
    }

    console.log(solution_n_items);

    allVariants = allVariants.concat(generateVariants(solution));
    remainingVariants = remainingVariants.concat(generateVariants(solution));
    // Account for horizontal reflection
    for (let i = 0; i < solution.length; i ++){
        solution[i].reverse();
    }
    allVariants = allVariants.concat(generateVariants(solution));
    remainingVariants = remainingVariants.concat(generateVariants(solution));
}




/* Recipes must be in format
[
    ["minecraft:planks","minecraft:planks"],
    [null,"minecraft:stick"],
    [null,"minecraft:stick"]
]
 */
let solution_n_items = {};
let remainingVariants = [];
let allVariants = [];
let guessCount = -1; // this is just for console output

//randomly select a recipe to be the solution for today

//TODO implement difficulties and recipe selection changes based on difficulty, also implement solution changing every 24 hours rather than every time the server is loaded
// init(solution_recipe);



/*Used for manual testing.  Can remove when hooked up to GUI * /
let recipe = [
    ["minecraft:planks","minecraft:planks"],
    [null,"minecraft:stick"],
    [null,"minecraft:stick"]
];
let recipe2 = [
    ["minecraft:coal"],
    ["minecraft:stick"]
]

let guesses = [
    [
        [null, null, null],
        [null, "minecraft:stick", null],
        [null, "minecraft:stick", null]
    ],
    [
        [null, "minecraft:planks", null],
        [null, "minecraft:stick", null],
        [null, "minecraft:stick", null]
    ],
    [
        ["minecraft:planks", "minecraft:planks", null],
        ["minecraft:planks", "minecraft:stick", null],
        [null, "minecraft:stick", null]
    ],
    [
        ["minecraft:planks", "minecraft:planks", null],
        [null, "minecraft:stick", null],
        [null, "minecraft:stick", null]
    ]
]

init(recipe);

console.log(processGuess(guesses[0]))
console.log(processGuess(guesses[1]))
console.log(processGuess(guesses[2]))
console.log(processGuess(guesses[3]))
//*/



