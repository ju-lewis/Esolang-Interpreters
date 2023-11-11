
const cellContainer = document.querySelector(".cell-container");
const numCells = 30;
const fontSize = 8;
const timeOut = 1000000;
let tickSpeed = 500;
var cells = [];
var running = 0;

document.getElementById("speed").oninput = function () {
    tickSpeed = this.value;
    WP.el.style.transition = `${tickSpeed/1000}s `;
}

var WP = {
    el: document.getElementById("WP"),
    Widx: 0,
    PC: 0,
    scope: 0,

    init: function() {
        this.el.style.transition = `${tickSpeed/1000}s `;
    },

    inc: function () {
        // Increment current cell
        cells[this.Widx] += 1;
        if(cells[this.Widx] >= 256) {cells[this.Widx] = 0;}
        cellContainer.children[this.Widx].innerText = cells[this.Widx];
    },
    dec: function () {
        // Decrement current cell
        cells[this.Widx] -= 1;
        if(cells[this.Widx] < -255) {cells[this.Widx] = 0;}
        cellContainer.children[this.Widx].innerText = cells[this.Widx];
    },
    goto: function () {
        // GOTO cell pointed at by Widx
        const cellList = cellContainer.children;
        // Moves the write pointer to the desired cell
        const cellRect = cellList[this.Widx].getBoundingClientRect();
        const pos = (cellRect.right + cellRect.left) / 2;
        this.el.style.transform = `translateX(${pos-fontSize}px)`;
    },
    openLoop: function (c) {
        const dataCell = cellContainer.children[this.Widx].innerText;
        const startScope = this.scope;
        if(dataCell == 0) {
            // Jump to closing bracket
            this.PC += 1;
            while(this.PC >= 0 && (c[this.PC] != "]" || this.scope != startScope)) {
                if(c[this.PC] == "]") {this.scope -= 1;}
                if(c[this.PC] == "[") {this.scope += 1;}
                this.PC += 1;
            }
        } else {
            this.scope += 1;
        }
    },
    closeLoop: function (c) {
        const dataCell = cellContainer.children[this.Widx].innerText;
        const startScope = this.scope;
        if(dataCell != 0) {
            // Jump to opening bracket
            this.PC -= 1;
            while(this.PC >= 0 && (c[this.PC] != "[" || this.scope > startScope)) {
                if(c[this.PC] == "]") {this.scope += 1;}
                if(c[this.PC] == "[") {this.scope -= 1;}
                this.PC -= 1;
            }
        } else {
            this.scope -= 1;
        }
    },
    print: function () {
        // Print ascii value of current cell
        const output = document.getElementById("output");
        const curr = output.innerText;
        output.innerText = curr + String.fromCodePoint(cellContainer.children[this.Widx].innerText);
    },
    read: function() {
        // Read user input to current cell
        let input = prompt("Enter a number:");
        try {
            input = input.charCodeAt(0);
            console.log(input);
            if (isNaN(input)) {input = 10;}
        } catch {
            // EOF
            input = 0;
        }

        cellContainer.children[this.Widx].innerText = input;
        cells[this.Widx] = input;
    }
}

// Cell generation code
function genCells() {
    for(let i=0; i<numCells; i++) {
        // Generate cell and append to container
        const newCell = document.createElement("div");
        newCell.classList.add("cell");
        newCell.innerHTML = 0;
        cellContainer.appendChild(newCell);
        cells.push(0);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function boundsCheck(maxP, maxC, c, p) {
    // Returns 0 if out-of-bounds
    if(p < 0 || p >= maxP) {return 0;} // Check program counter
    if(c < 0 || c >= maxC) {return 0;} // Check cell pointer

    return 1;
}

async function runCode() {
    // Reset environment
    if(running) {
        running = 0;
        document.getElementById("run").innerText = "Execute";
    } else {
        running = 1;
        document.getElementById("run").innerText = "Terminate";
    }
    cells = [];
    while(cellContainer.children.length > 0) {
        cellContainer.removeChild(cellContainer.children[0]);
    }
    document.getElementById("output").innerText = "";
    genCells();
    WP.scope = 0;
    WP.Widx = 0;
    WP.PC = 0;
    WP.goto();
    await sleep(tickSpeed);

    // First get input from user
    const c = document.getElementById("code-input").value;
    const end = c.length;
    const numCells = cells.length;
    let currTick = 0;
    let commentRead = 0;

    while(boundsCheck(end, numCells, WP.Widx, WP.PC)) {
        currTick++;
        if(currTick > timeOut || !running) {break;}
        running = 1;
        commentRead = 0;
        switch (c[WP.PC]) {
            case ">":
                WP.Widx += 1;
                if(!boundsCheck(end, numCells, WP.Widx, WP.PC)) {
                    running=0; break;}
                WP.goto();
                break;
            case "<":
                WP.Widx -= 1;
                if(!boundsCheck(end, numCells, WP.Widx, WP.PC)) {
                    running=0; break;}
                WP.goto();
                break;
            case "+":
                WP.inc();
                break;
            case "-":
                WP.dec();
                break;
            case ".":
                WP.print();
                break;
            case ",":
                WP.read();
            case "[":
                WP.openLoop(c);
                break;
            case "]":
                WP.closeLoop(c);
                break;
            default:
                commentRead = 1;
                break;
        }
        // Read next instruction byte
        WP.PC += 1;
        if(!commentRead) {
            await sleep(tickSpeed);
        }
    }
    running = 0;
    document.getElementById("run").innerText = "Execute";
}

genCells();
// Ensure WP goes to the correct location when window is resized
window.addEventListener("resize", (event) => {WP.goto();});
WP.goto();
WP.init();