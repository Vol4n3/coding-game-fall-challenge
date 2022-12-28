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

    // build
    if (capturableTiles.length > 60 && turn < (width + height) / 4 && turn % 3 === 2) {
        const choose = [...myBuildCandidates.map((c) => {
            const asides = inRange(c, [...neuTiles, ...myTilesWithoutBuild], (d) => d === 1);
            return { ...c, scrapAmount: c.scrapAmount + asides.reduce((prev, curr) => prev + curr.scrapAmount, 0) }
        })].sort((a, b) => b.scrapAmount - a.scrapAmount).at(0);
        if (choose) {
            actionBuild(choose);
            mySpawnCandidates = removeItemInArray(mySpawnCandidates, choose);
        }

    }
    myBuildCandidates.forEach(candidate => {

        const nearestUnitWillInvade = inRange(candidate, oppUnits, (d) => d <= 1);
        if (nearestUnitWillInvade.length) {
            if (myMatter > 20 && nearestUnitWillInvade.reduce((prev, curr) => prev + curr.units, 0) === 1) {
                actionSpawn(1, candidate);

            } else {
                // check if is util top protect
                const isNecessary = inRange(candidate, myTilesWithoutBuild, (d) => d <= 1);
                if (isNecessary.length > 1) {
                    actionBuild(candidate);
                    mySpawnCandidates = removeItemInArray(mySpawnCandidates, candidate);
                }
            }
        }
    })
    // spawn
    const spawner = () => {
        const myTilesInDanger = mySpawnCandidates.filter((tile) => inRange(tile, oppUnits, (d) => d <= 1).length > 0)
        myTilesInDanger.forEach(tile => {
            const nearestOpp = inRange(tile, oppUnits, (d) => d <= 1).reduce((p, c) => p + c.units, 0);
            if (nearestOpp < 1) {
                return
            }
            const count = Math.floor(myMatter / 10);


                actionSpawn(
                    nearestOpp + 1 > count ? count : nearestOpp + 1, tile
                )

        })
        const myTilesPotentialInDanger = mySpawnCandidates.filter((tile) => inRange(tile, oppTilesWithoutBuild, (d) => d <= 2).length > 0)

        myTilesPotentialInDanger.forEach(tile => {
            const nearestOpp = nearest(tile, oppTilesWithoutBuild);
            if (!nearestOpp) {
                return
            }
            const distanceTravel = canTravel(tile, nearestOpp, moveableTiles);
            if (distanceTravel > 0 && distanceTravel <= 2) {
                actionSpawn(
                        nearestOpp.units + Math.floor(myMatter / 10), tile
                    )
            }
        })
        const nearestOppUnit = nearest(startingMyTile, oppUnits);
        if (nearestOppUnit) {
            const nearestMyUnit = nearest(nearestOppUnit, myUnits);
            if (nearestMyUnit) {
                if (canTravel(nearestMyUnit, nearestOppUnit, moveableTiles)) {
                    actionSpawn(Math.floor(myMatter / 10), nearestMyUnit);
                }

            }
        }



        const randomEnd = pickRandomOne(mySpawnCandidates);
        if (randomEnd) {
            actionSpawn(1, randomEnd);
        }
        const randomUnit = pickRandomOne(myUnits);
        if (randomUnit) {
            actionSpawn(1, randomUnit);
        }
    }
    spawner();

    // move units to their nearest tile
    let tempNeuTile = [...neuTiles,...oppTilesWithoutBuild];
    myUnits.forEach(unit => {
        // search for neutre tile
        if(turn>width/3){
            const inRangeNeuTile = inRange(unit, tempNeuTile, (d) => d <= 1);
            if (inRangeNeuTile.length) {

                const n = further(avoidPoint, inRangeNeuTile);
                if (n) {
                    tempNeuTile = removeItemInArray(tempNeuTile, n);
                    actionMove(Math.ceil(unit.units / 2), unit, n);
                }
            }
        }


        // attack
        const inRangeOppTile = inRange(unit, oppTilesWithoutBuild, (d) => d <= 1);
        if (inRangeOppTile.length) {
            inRangeOppTile.forEach(oppTile => {

                actionMove(oppTile.units + Math.floor(oppMatter / 10) + 1, unit, oppTile);
            })
            return
        }
        //renfort
        const inRangeMyUnits = inRange(unit, myUnits, (d) => d === 1);
        if (inRangeMyUnits.length) {
            let find = false;
            inRangeMyUnits.forEach(canRenfort => {
                const oppWillAttack = inRange(canRenfort, oppUnits, (d) => d === 1);
                if (oppWillAttack.length) {
                    find = true;
                    actionMove(
                            unit.units, unit, canRenfort
                        )
                    ;
                }
            })
            if (find) return;
        }
        const nearestOppTile = nearest(unit, oppTilesWithoutBuild);
        if (nearestOppTile) {

            if (canTravel(unit, nearestOppTile, moveableTiles)) {

                actionMove(
                        unit.units, unit, nearestOppTile
                    )
                ;
                return
            }

        }
        const nearestTile = nearest(unit, capturableTiles);
        if (!nearestTile) {
            return
        }

        actionMove(
                unit.units, unit, nearestTile
            )
        ;

    })
    actionMessage(messageToShow);

    if (!actions.length) {
        console.log('WAIT');
        continue;
    }
    console.log(actions.join(';'));
    turn++;
}
