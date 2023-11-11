const codeBox = document.getElementById("code");
const stackEl = document.getElementById("stack");
const display = document.querySelector(".output");
const rows = codeBox.rows;
const cols = codeBox.cols;

let running = false;

const timeOut = 10000;
const tickSpeed = 1;

let P = {
    row: 0,
    col: 0,

    dir: 0,  // 0:>  1:^  2:<  3:v
    sMode: false,
};

let stack = [];

function processCode(code) {
    // Process the code to pad unfilled cells with " " to serialise characters
    let output = "";
    let currLen = 0;
    for(let i=0; i<rows * cols; i++) {
        const char = code[i];
        // Pad newlines
        if(char == '\n') {
            output += " ".repeat(cols - currLen);
            currLen = 0;
        } else if (char == undefined) {
            output += " ";
        } else {
            output += char;
            currLen++;
        }
    }
    return output;
}

function push(val) {

    stack.push(val)

    const newVal = document.createElement("div");
    newVal.classList.add("stack-val");
    newVal.innerText = val;
    // Append if stack length is 0
    if(stack.length == 1) {
        stackEl.appendChild(newVal);
    } else {
        stackEl.insertBefore(newVal, stackEl.children[0]);
    }
}

function pop() {

    const val = stack.pop();

    const c = stackEl.children;
    try {
    stackEl.removeChild(c[0]);
    } catch {

    }
    return val;
}

function updatePos() {
    switch (P.dir) {
    case 0:
        P.col += 1;
        break;
    case 1:
        P.row -= 1;
        break;
    case 2:
        P.col -= 1;
        break;
    case 3:
        P.row += 1;
        break;
    default:
        break;
    }
}

function readCell(initCode) {
    // Linearise current position
    const code = initCode
    const currPos = P.col + P.row * cols;
    let a, b, c;

    // Read character at position
    const char = code[currPos];

    const boxOffset = codeBox.getBoundingClientRect();
    const highlight = document.querySelector(".highlight");
    const computedStyle = window.getComputedStyle(codeBox);
    const lineHeight = computedStyle.getPropertyValue('line-height');
    highlight.style.left = `calc(${P.col * 0.55}em + ${boxOffset.left + 3}px)`;
    highlight.style.top = `calc(${P.row * 1.2}em + ${boxOffset.top + 3}px)`;


    if(P.sMode && char != "\"") {push(char.charCodeAt(0));}
    else {

        switch (char) {
            case "@":
                // Terminate program
                running = false;
                return;
                break;
            case ">":
                P.dir = 0;
                break;
            case "^":
                P.dir = 1;
                break;
            case "<":
                P.dir = 2;
                break;
            case "v":
                P.dir = 3;
                break;
            case "$":
                // Pop from stack and discard
                pop();
                break;
            
            // ARITHMETIC OPERATIONS
            case "+":
                // Pop and add 2 top values
                a = pop();
                b = pop();
                push(a+b);
                break;
            case "-":
                a = pop();
                b = pop();
                push(b-a);
                break;
            case "*":
                a = pop();
                b = pop();
                push(a*b);
                break;
            case "/":
                a = pop();
                b = pop();
                push(Math.floor(b/a));
                break;
            case "%":
                a = pop();
                b = pop();
                push(b%a);
                break;

            // LOGICAL OPERATIONS
            case "!":
                push(!pop());
                break;
            case "`":
                a = pop();
                b = pop();
                push(b>a);
                break;
            case "_":
                a = pop();
                if(a == 0) {
                    P.dir = 0;
                } else {P.dir = 2;}
                break;
            case "|":
                a = pop();
                if(a == 0) {
                    P.dir = 3;
                } else {
                    P.dir = 1;
                }
                break;
            // ========================== STACK OPERATIONS ===========================
            case ":":
                // Duplicate the top value
                a = stack[stack.length-1];
                push(a);
                break;
            case "\\":
                a = pop();
                b = pop();
                push(a);
                push(b);
                break;
            // ========================= MEMORY =========================================
            case "p":
                // Check not in string mode
                a = pop();
                b = pop();
                c = pop();

                // store ASCII value `c` at position (b, a)
                initCode[a + b * cols] = c;

                break;
            case "g":
                a = pop();
                b = pop();

                // push ASCII value at position (b, a)
                push(initCode[a + b * cols]);
                break;
            // ========================== OTHER =========================================
            case "?":
                P.dir = Math.round(Math.random() * 3);
                break;
            case "\"":
                // Toggle string mode
                P.sMode = !P.sMode;
                break;
            case ".":
                // Print integer
                a = pop();
                b = display.innerText;
                display.innerText = b + a;

                break;
            case ",":
                // Print ASCII
                a = String.fromCharCode(pop());
                b = display.innerText;
                display.innerText = b + a;

                break;
            case "#":
                // Skip next cell
                updatePos();
                break;
            case "&":
                a = prompt("Enter a number:");
                push(parseInt(a));
                break;
            case "~":
                a = prompt("Enter a character:");
                push(a.charCodeAt(0));
                break;
            default:
                // Check if a number was read and push to stack
                if(char != ' ' && !isNaN(char)){
                    push(parseInt(char));
                } else if (char != ' ') {
                    // This catches all undefined ASCII characters
                    if(P.sMode) {push(char.charCodeAt(0));}
                }
                break;
        }
    }
    // Finally update position for next frame
    updatePos();

    // Handle wrap-arounds
    if(P.col >= cols || P.col < 0) {P.col = cols - P.col;}
    if(P.row >= rows || P.row < 0) {P.row = rows - P.row;}
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCode() {


    // Clear current stack contents
    stack = [];
    while(stackEl.children.length > 0) {stackEl.removeChild(stackEl.children[0]);}
    display.innerText = "";

    // Reset pointer
    P.row = 0;
    P.col = 0;
    P.dir = 0;
    P.sMode = 0;

    const initCode = processCode(codeBox.value);
    let tick = 0;
    if(!running) {
        running = true;
        while(tick < timeOut) {
            // Break if cancelled
            if(!running) {return;}
            await sleep(tickSpeed);
            readCell(initCode);
            tick++;
        }
    } else {
        running = false;
    }
}