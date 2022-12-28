interface Position {
    x: number,
    y: number,
}

interface Tile extends Position {

    recycler: boolean,
    inRangeOfRecycler: boolean,
    units: number,
    canBuild: boolean,
    canSpawn: boolean,
    scrapAmount: number,
    unitsComing: number
}

type CompareItem = {
    index: number,
    val: number
}
var inputs: string[] = readline().split(' ');
const width: number = parseInt(inputs[0]);
const height: number = parseInt(inputs[1]);

export const rotate = (origin: Position, rotateAnchor: Position, angle: number): Position => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = origin.x - rotateAnchor.x;
    const dy = origin.y - rotateAnchor.y;
    return {
        x: dx * cos + dy * sin + rotateAnchor.x,
        y: -dx * sin + dy * cos + rotateAnchor.y
    }
}
const removeItemInArray = <T>(current: T[], item: T): T[] => {
    return current.filter(i => i !== item);
};
const pickRandomOne = <T>(array: T[]): T | null => {
    if (!array.length) {
        return null
    }
    return array[Math.floor(Math.random() * array.length)];
};
const samePosition = (p1: Position, p2: Position): boolean => {
    return p1.x === p2.x && p1.y === p2.y;
}
const distance = (p1: Position, p2: Position): number => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
}
const average = (nums: number[]): number => {
    return nums.reduce((p, c) => p + c) / nums.length;
}
const nearest = <T extends Position>(which: Position, others: T[]): T | undefined => {
    const calcDist: CompareItem[] = others.map(
        (other, index) => ({ index, val: distance(which, other) })
    ).sort((a, b) => a.val - b.val);
    if (!calcDist.length) {
        return
    }
    return others[calcDist[0].index];
}
const further = <T extends Position>(which: Position, others: T[]): T | undefined => {
    const calcDist: CompareItem[] = others.map(
        (other, index) => ({ index, val: distance(which, other) })
    ).sort((a, b) => b.val - a.val);
    if (!calcDist.length) {
        return
    }
    return others[calcDist[0].index];
}
const inRange = <T extends Position>(which: Position, others: T[], compareFunction: (distance: number) => boolean): T[] => {
    const calcDist: { index: number, dist: number }[] = others.map(
        (other, index) => ({ index, dist: distance(which, other) })
    );
    return calcDist.filter(tile => compareFunction(tile.dist)).map(tile => others[tile.index]);
}

let turn: number = 0;
let tilesCapturableCount =  0;
const defaultTile: Tile = {
    canBuild: false,
    canSpawn: false,
    inRangeOfRecycler: false,
    recycler: false,
    scrapAmount: 0,
    units: 0,
    x: 0,
    y: 0,
    unitsComing: 0
}
let startingOppTile: Tile = defaultTile;
let startingMyTile: Tile = defaultTile;
let avoidPoint = { x: 0, y: 0 }
let messageToShow = "GG & HF !";
const getPositionInGrid = <T extends Position>(x: number, y: number, grid: T[]): T | undefined => {
    return grid.find(tile => tile.x === x && tile.y === y);
}
const canTravel = <T extends Position>(from: Position, dest: Position, grid: T[], maxDistance: number = 50, visited: Position[] = [], distance: number = 0): number => {
    if (distance > maxDistance) return 0;
    const directions = [
        getPositionInGrid(from.x + 1, from.y, grid), // right
        getPositionInGrid(from.x - 1, from.y, grid), // left
        getPositionInGrid(from.x, from.y + 1, grid), // top
        getPositionInGrid(from.x, from.y - 1, grid) //bottom
    ]
    const find = directions.some(tile => tile && samePosition(tile, dest));
    if (find) return distance;
    if (visited.some(buff => samePosition(buff, from))) return 0;
    visited.push(from);
    const calculs: number[] = directions.map(tile => tile ? canTravel(tile, dest, grid, maxDistance, visited, distance + 1) : 0);
    return Math.max(...calculs);
}
const tileWillBeGrass = (tile: Tile): boolean => {
    return tile.inRangeOfRecycler && tile.scrapAmount <= 1;
}
// game loop
while (true) {

    var inputs: string[] = readline().split(' ');
    const myMatter: number = parseInt(inputs[0]);

    let myMatterLeft: number = myMatter;
    const spawnUnitsLeft = (): number => {
        return Math.floor(myMatterLeft / 10);
    }
    const buildRecyclerLeft = (): number => {
        return Math.floor(myMatterLeft / 5);
    }
    const buyUnits = (n: number): void => {
        const amount = myMatterLeft - 10 * n
        myMatterLeft = amount < 0 ? 0 : amount;
    }
    const buyRecycler = (n: number): void => {
        const amount = myMatterLeft - 5 * n
        myMatterLeft = amount < 0 ? 0 : amount;
    }
    const oppMatter: number = parseInt(inputs[1]);
    const oppCanSpawnAmount = Math.floor(oppMatter / 10);
    const myTiles: Tile[] = [];
    const oppTiles: Tile[] = [];
    let neuTiles: Tile[] = [];
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            var inputs: string[] = readline().split(' ');
            const scrapAmount: number = parseInt(inputs[0]);
            const owner: number = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
            const units: number = parseInt(inputs[2]);
            const recycler: number = parseInt(inputs[3]);
            const canBuild: number = parseInt(inputs[4]);
            const canSpawn: number = parseInt(inputs[5]);
            const inRangeOfRecycler: number = parseInt(inputs[6]);
            const tile: Tile = {
                x: j,
                y: i,
                recycler: recycler > 0,
                inRangeOfRecycler: inRangeOfRecycler > 0,
                units,
                canBuild: canBuild > 0,
                canSpawn: canSpawn > 0,
                scrapAmount,
                unitsComing: 0
            };
            if (scrapAmount < 1) { //be or will be grass
                continue;
            }
            if (owner === 1) {
                myTiles.push(tile);
                continue;
            }
            if (owner === 0) {
                oppTiles.push(tile);
                continue;
            }
            if (owner === -1 && !tileWillBeGrass(tile)) {
                neuTiles.push(tile);
            }
        }
    }
    let myUnits = myTiles.filter(tile => tile.units > 0);

    if (turn === 0) {
        startingMyTile = myTiles.filter(tile => tile.units === 0).at(0);
        tilesCapturableCount = neuTiles.length;
    }
    const oppUnits = oppTiles.filter(tile => tile.units > 0);
    if (turn === 0) {
        startingOppTile = oppTiles.filter(tile => tile.units === 0).at(0);
        avoidPoint = {
            x: startingMyTile.x > width / 2 ? startingMyTile.x + 2 : startingMyTile.x - 2,
            y: startingMyTile.y > height / 2 ? startingMyTile.y + 1 : startingMyTile.y - 1
        }
    }

    myUnits = myUnits.sort((a, b) => distance(b, startingOppTile) - distance(a, startingOppTile));
    const oppTilesWithoutBuild = oppTiles.filter(tile => !tile.recycler && !tileWillBeGrass(tile));
    let myTilesWithoutBuild = myTiles.filter(tile => !tile.recycler && !tileWillBeGrass(tile));
    let mySpawnCandidates = myTiles.filter(tile => tile.canSpawn && !tileWillBeGrass(tile))
        .sort((a, b) => distance(a, startingOppTile) - distance(b, startingOppTile));;
    let myBuildCandidates = myTiles.filter(tile => tile.canBuild && !tileWillBeGrass(tile) && tile.units === 0);
    const capturableTiles = [...neuTiles, ...oppTilesWithoutBuild];
    const moveableTiles = [...capturableTiles, ...myTilesWithoutBuild];
    const actions: string[] = [];

    const actionMove = (
        amount: number,
        from: Position,
        to: Position
    ) => {
        if (amount <= 0) {
            return
        }
        actions.push(`MOVE ${amount} ${from.x} ${from.y} ${to.x} ${to.y}`);
    }

    const actionBuild = (p: Position) => {
        if (buildRecyclerLeft() <= 0) {
            return
        }
        buyRecycler(1);
        actions.push(`BUILD ${p.x} ${p.y}`);
    }

    const actionSpawn = (amount: number, p: Position) => {
        if (spawnUnitsLeft() <= 0 || amount <= 0) {
            return
        }
        const minimum = Math.min(amount, spawnUnitsLeft());
        buyUnits(minimum);
        actions.push(`SPAWN ${minimum} ${p.x} ${p.y}`);
    }

    const actionMessage = (text: string) => {
        actions.push(`MESSAGE ${text}`);
    }
    // defense build
    myBuildCandidates.forEach((tile) => {
        const oppUnitsInRange = inRange(tile, oppUnits, (d) => d === 1);
        const needsForDef = oppUnitsInRange.reduce((p, c) => p + c.units, 0);
        if (needsForDef === 1 && spawnUnitsLeft() >= 1) {
            actionSpawn(2, tile);
        } else if (needsForDef >= 1) {
            actionBuild(tile);
        }
    })
    // defense spawn
    mySpawnCandidates.forEach((tile) => {
        const oppUnitsInRange = inRange(tile, oppTilesWithoutBuild, (d) => d === 1);
        if (!oppUnitsInRange.length) {
            return
        }
        const needsForDef = oppUnitsInRange.reduce((p, c) => p + c.units, 0);
        const spawning = Math.min(spawnUnitsLeft(), needsForDef + 1 - tile.units);
        actionSpawn(spawning, tile);
        tile.unitsComing += spawning;


    })

    let visitedNeuTile = neuTiles;
    myUnits.forEach(unit => { // move and attacks

        // priority 1 :  attack oppUnit
        const oppUnitsInRange = inRange(unit, oppTilesWithoutBuild, (d) => d === 1)
            .sort((a, b) => a.units - b.units);
        const needsForDef = oppUnitsInRange.reduce((p, c) => p + c.units, 0);
        const target = further(avoidPoint, oppUnitsInRange.filter(tile => !tileWillBeGrass(tile)));

        if (target) {
            if (unit.units >= target.units) { // attack because we win till
                actionMove(target.units, unit, target);
                unit.units -= target.units;
            }
            if ((unit.unitsComing + unit.units) <= needsForDef) { // move because we loose tile
                const smallest = oppUnitsInRange[0];
                if (smallest) {
                    actionMove(unit.units, unit, smallest);
                    return
                }
            }
        }


        // priority 3 :  traveling to nearest opp
        if (unit.units < 1) {
            return;
        }
        const shorter = oppUnits.map((oppUnit, index) => ({
            index, value: canTravel(unit, oppUnit, moveableTiles, 2)
        }))
            .filter(dist => dist.value > 0)
            .sort((a, b) => a.value - b.value)[0];
        if (shorter) {
            const nearOppUnitReachable = oppUnits[shorter.index];
            if (nearOppUnitReachable) {
                actionMove(unit.units, unit, nearOppUnitReachable);
                return
            }
        }

        // priority 2 :  takeNeuTile
        const tilesInRange = inRange(unit, visitedNeuTile, (d) => d === 1);
        const selectedTile = further(avoidPoint, tilesInRange);
        if (selectedTile) {
            actionMove(1, unit, selectedTile);
            visitedNeuTile = removeItemInArray(visitedNeuTile, selectedTile);
            unit.units--;
        }




        const move = nearest(unit, oppUnits);
        if (move) {
            actionMove(unit.units, unit, move);
        }

    });

    // build recycler for boost production
    if (tilesCapturableCount > 70 && turn < (width + height) / 8 && turn % 3 === 1 && buildRecyclerLeft() > 0) {
        const choose = [...myBuildCandidates.map((c) => {
            const asides = inRange(c, [...neuTiles, ...myTilesWithoutBuild], (d) => d === 1);
            return { ...c, scrapAmount: c.scrapAmount + asides.reduce((prev, curr) => prev + curr.scrapAmount, 0) }
        })].sort((a, b) => b.scrapAmount - a.scrapAmount).at(0);
        if (choose) {
            actionBuild(choose);
        }
    }
    (() => {
        if (spawnUnitsLeft() < 1) {
            return;
        }
        let spawnTemp = mySpawnCandidates.filter(tile =>!tile.units &&inRange(tile, capturableTiles, (d) => d === 1).length > 0);

        for (let i = 0; i < spawnUnitsLeft() + 1; i++) {
            const selected = further(avoidPoint, spawnTemp);
            if (selected) {
                actionSpawn(1, selected)
                spawnTemp = removeItemInArray(spawnTemp, selected);
            }
        }

    })()

    actionMessage(messageToShow);

    if (!actions.length) {
        console.log('WAIT');
        continue;
    }
    console.log(actions.join(';'));
    turn++;
}
