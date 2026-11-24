if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            await navigator.serviceWorker.register("/assets/js/sw.js");
        } catch (error) {
            console.error("Service worker registration failed:", error);
        }
    });
}

// import dependecies for graphr
const { default: texMathParser } = await import("https://cdn.jsdelivr.net/npm/tex-math-parser@2.0.5/+esm");
const { default: mathjs } = await import("https://cdn.jsdelivr.net/npm/mathjs@15.2.0/+esm");

const MQ = MathQuill.getInterface(2);
const field = MQ.MathField(document.getElementById('mq1'), {
    autoCommands: 'pi theta sqrt sum int',
    autoOperatorNames: 'sin cos tan arcsin arccos arctan sec csc cot det ln log ln',
    handlers: {
        edit: (f) => {
            try {
                ctx.clearRect(0,0,canvas.getBoundingClientRect().width,canvas.getBoundingClientRect().height)
                setExpr(f.latex());
            } catch {}
        }
    },
});

const canvas = document.getElementById("draw");
const ctx = canvas.getContext("2d");
var scale = 40;
canvas.onwheel = zoom;

const g1col = "royalblue";
const pointcol = "white";
const axiscol = "#303e58";

function resize() {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

new ResizeObserver(resize).observe(canvas);
let f = x => NaN;

function draw() {
    const { width: w, height: h } = canvas.getBoundingClientRect();

    const cx = w / 2;
    const cy = h / 2;
    function toPixel(x,y) {
        return [cx + x * scale, cy - y * scale];
    }
    function toMathPoint(px,py) {
        return [(px - cx) / scale, (py-cy) / scale];
    }
    console.log(toMathPoint(...toPixel(2,3)));

    const xMin = (0-cx)/scale; const xMax = (w-cx)/scale;
    const step = 0.5 / scale;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = String(axiscol);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx,0);
    ctx.lineTo(cx,h);
    ctx.stroke();
    ctx.moveTo(0,cy);
    ctx.lineTo(w,cy);
    ctx.stroke();

    let penDown = false;
    ctx.strokeStyle = String(g1col);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    
    for (let x = xMin; x <= xMax; x += step) {
        const y = f(x);
        
        if (!Number.isFinite(y)) {
            penDown = false;
            continue
        }

        const [px,py] = toPixel(x,y);

        if (py < -h || py > 2*h) {
            penDown = false;
            continue
        }

        if (penDown) {
            ctx.lineTo(px,py)
        } else {
            ctx.moveTo(px,py);
            penDown = true;
        }
    }
    ctx.stroke();
}

function setExpr(latex) {
    setRel(latex);
    let compiled;
    try {
        compiled = texMathParser.parseTex(latex).compile()
    } catch {
        f = x => NaN;
        draw();
        return;
    }

    f = x => {
        try {
            const y = compiled.evaluate({x});
            return typeof y === "number" ? y : NaN;
        } catch {
            return NaN
        }
    }

    draw()
}

let g = null;
function setRel(latex) {
    const sects = latex.split("=");
    console.log(sects);
    if (!sects[1]) return;
    try {
        let gxy = [
            texMathParser.parseTex(sects[0]).compile(),
            texMathParser.parseTex(sects[1]).compile()
        ];
        g = (x,y) => {
            [x,y] = [gxy[0].evaluate({x,y}),gxy[1].evaluate({x,y})];
            return x - y;
        }
        console.log(g(0,0),g(3,0),g(5,0));
    } catch(e) {
        console.warn("Half-typed LaTeX", `Error: ${e}.`);
    }
}


function zoom(event) {
    event.preventDefault();
    scale *= Math.exp(-event.deltaY * 0.01);
    scale = Math.min(Math.max(1, scale), 350);
    document.getElementById("zoomshow").textContent = `${Math.round(scale/40*100)}%`
    draw();
}

function zoom2(amnt) {
    scale *= Math.exp(amnt * 0.01);
    scale = Math.min(Math.max(1, scale), 350);
    document.getElementById("zoomshow").textContent = `${Math.round(scale/40*100)}%`
    draw();
}

function zoomReset() {
    scale = 40;
    document.getElementById("zoomshow").textContent = `${Math.round(scale/40*100)}%`
    draw();
}

document.getElementById("zoomIn").addEventListener("click",()=>{
    zoom2(24);
});

document.getElementById("zoomOut").addEventListener("click",()=>{
    zoom2(-24);
});

document.getElementById("zoomReset").addEventListener("click",()=>{
    zoomReset();
});

draw();