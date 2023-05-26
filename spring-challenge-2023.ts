enum CellType {
    EMPTY = 0,
    EGG = 1,
    CRYSTAL = 2
}

interface Cell {
    cellIndex: number
    type: CellType
    resources: number
    neighbors: number[]
    myAnts: number
    oppAnts: number
    weight: number
}

interface Beacon {
    cellId: number,
    priority: number
}

const cells: Cell[] = []

interface Path {
    dest: Cell,
    path: number[],
    length: number
}

function findShortestPath(cells: Cell[], start: number, end: number): number[] {
    const dist: { [key: number]: number } = {};
    const prev: { [key: number]: number } = {};
    cells.forEach((cell) => {
        dist[cell.cellIndex] = Infinity;
        prev[cell.cellIndex] = -1;
    });
    dist[start] = 0;
    let unvisited: number[] = [...cells.map(cell => cell.cellIndex)];
    while (unvisited.length > 0) {
        unvisited.sort((a, b) => dist[a] - dist[b]);
        let current = unvisited.shift()!;

        if (current === end) break;

        cells[current].neighbors.forEach(neighbor => {
            let alt = dist[current] + cells[neighbor].weight;
            if (alt < dist[neighbor]) {
                dist[neighbor] = alt;
                prev[neighbor] = current;
            }
        });
    }
    let path: number[] = [];
    let u = end;
    while (u !== start) {
        path.unshift(u);
        u = prev[u];
    }
    path.unshift(start);
    return path;
}


const numberOfCells: number = parseInt(readline()); // amount of hexagonal cells in this map
for (let i = 0; i < numberOfCells; i++) {
    const inputs: string[] = readline().split(' ');
    const type: number = parseInt(inputs[0]); // 0 for empty, 1 for eggs, 2 for food
    const initialResources: number = parseInt(inputs[1]); // the initial amount of eggs/crystals on this cell
    const neigh0: number = parseInt(inputs[2]); // the index of the neighbouring cell for each direction
    const neigh1: number = parseInt(inputs[3]);
    const neigh2: number = parseInt(inputs[4]);
    const neigh3: number = parseInt(inputs[5]);
    const neigh4: number = parseInt(inputs[6]);
    const neigh5: number = parseInt(inputs[7]);

    const cell: Cell = {
        cellIndex: i,
        type,
        resources: initialResources,
        neighbors: [neigh0, neigh1, neigh2, neigh3, neigh4, neigh5].filter(id => id > -1),
        myAnts: 0,
        oppAnts: 0,
        weight: 2
    }
    cells.push(cell)
}

const numberOfBases: number = parseInt(readline());
const myBases: number[] = readline().split(' ').map(n => parseInt(n))
const oppBases: number[] = readline().split(' ').map(n => parseInt(n))
let applyStrategyFirstEggs: boolean = true;
// game loop
let turn = 0;

while (true) {

    const resourcesToReach: Cell[] = [];
    for (let i = 0; i < numberOfCells; i++) {
        const inputs = readline().split(' ')
        const resources: number = parseInt(inputs[0]); // the current amount of eggs/crystals on this cell
        const myAnts: number = parseInt(inputs[1]); // the amount of your ants on this cell
        const oppAnts: number = parseInt(inputs[2]); // the amount of opponent ants on this cell

        cells[i].resources = resources
        cells[i].myAnts = myAnts
        cells[i].oppAnts = oppAnts
        cells[i].weight = 2
        if (resources > 0) {
            resourcesToReach.push(cells[i]);
        }
    }

    // WAIT | LINE <sourceIdx> <targetIdx> <strength> | BEACON <cellIdx> <strength> | MESSAGE <text>
    const actions: string[] = [];
    const beacons: Beacon[] = [];
    const reversedResourcesToReach = [...resourcesToReach].reverse()
    const targets: number[] = []
    myBases.forEach((b) => {
        let paths: Path[] = [];

        resourcesToReach.forEach(r => {
            const path = findShortestPath(cells, b, r.cellIndex);
            path.forEach(p => cells[p].weight = 1)
            paths.push({dest: r, path, length: path.length})
        })
        const reversedPaths: Path[] = []
        // test for reversed is better
        cells.forEach(c => c.weight = 2)
        reversedResourcesToReach.forEach(r => {
            const path = findShortestPath(cells, b, r.cellIndex);
            path.forEach(p => cells[p].weight = 1)
            reversedPaths.push({dest: r, path, length: path.length})
        })
        const calcPaths = paths.reduce((prev, curr) => prev + curr.length, 0);
        const calcReversedPaths = reversedPaths.reduce((prev, curr) => prev + curr.length, 0);
        if (calcPaths > calcReversedPaths) {
            paths = reversedPaths;
        }
        paths.sort((a, b) => a.length - b.length || b.dest.resources - a.dest.resources);

        let onlyEggs = paths.filter((f) => f.dest.type === CellType.EGG);

        onlyEggs = onlyEggs.slice(0, Math.ceil(onlyEggs.length / 2)).filter(f => f.length <= 5)
        if (applyStrategyFirstEggs && onlyEggs.length && turn <= 6) {
            let eggsLeft = 0;
            let antsOnEggs = 0;
            onlyEggs.forEach((pathEggs, i) => {
                if (i > (turn)) return
                eggsLeft += pathEggs.dest.resources;
                eggsLeft += pathEggs.dest.myAnts;
                pathEggs.path.forEach(p => beacons.push({cellId: p, priority: 1}))

            })
            if ((antsOnEggs * 4) > eggsLeft) {
                applyStrategyFirstEggs = false;
            }
            return;

        }
        let nearest = paths//.slice(0, Math.ceil(paths.length / myBases.length));

        const maxLength = Math.max(...nearest.map(m => m.length));
        const maxRessource = Math.max(...nearest.map(m => m.dest.resources));
        nearest.forEach(({path, dest, length}) => {
            if (targets.includes(dest.cellIndex)) return
            targets.push(dest.cellIndex)
            let moreAgressive: boolean = path.some(p => cells[p].myAnts > 0 && cells[p].oppAnts > cells[p].myAnts)
            const pathRessources: number = path.map(p => cells[p])
                .reduce((prev, curr) => prev + curr.type === CellType.EGG ? curr.resources * 2 : curr.resources, 0)
            path.forEach((p, i) => {
                beacons.push({
                    cellId: p,
                    /* priority: Math.round(
                        (((maxLength - length) / 2 ) * (1 + ((dest.resources / (dest.type === CellType.EGG ? 3 : 1)) / maxRessource))
                            * (moreAgressive ? 1.5 : 1))
                    ) */
                    priority: pathRessources
                })
            })
        })

    })

    const uniqueBeacons = beacons.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.cellId === item.cellId);
        if (existingItem) {
            if (item.priority > existingItem.priority) {
                existingItem.priority = item.priority;
            }
        } else {
            acc.push(item);
        }
        return acc;
    }, []);
    uniqueBeacons.forEach((v) => {
        actions.push(`BEACON ${v.cellId} ${v.priority}`)
    })
    if (actions.length === 0) {
        console.log('WAIT');
    } else {
        console.log(actions.join(';'))
    }
    turn++;
}