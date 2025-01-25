export const Attractors = [
  { name: "Clifford", fn: Clifford, numParams: 4 },
  { name: "De Jong", fn: DeJong, numParams: 4 },
  { name: "Svensson", fn: Svensson, numParams: 4 },
  { name: "Bedhead", fn: Bedhead, numParams: 2 },
  { name: "Fractal Dream", fn: FractalDream, numParams: 4 },
  { name: "Hopalong 1", fn: Hopalong1, numParams: 3 },
  { name: "Hopalong 2", fn: Hopalong2, numParams: 3 },
]


function Clifford(x, y, a, b, c, d) {
  return [
    Math.sin(a * y) + c * Math.cos(a * x),
    Math.sin(b * x) + d * Math.cos(b * y)
  ]
}

function DeJong(x, y, a, b, c, d) {
  return [
    Math.sin(a * y) - Math.cos(b * x),
    Math.sin(c * x) - Math.cos(d * y)
  ]
}

function Svensson(x, y, a, b, c, d) {
  return [
    d * Math.sin(a * x) - Math.sin(b * y),
    c * Math.cos(a * x) + Math.cos(b * y)
  ]
}

function Bedhead(x, y, a, b) {
  return [
    Math.sin(x * y / b) * y + Math.cos(a * x - y),
    x + Math.sin(y) / b
  ]
}

function FractalDream(x, y, a, b, c, d) {
  return [
    Math.sin((y + 0.1) * b) + c * Math.sin((x + 0.1) * b),
    Math.sin((x + 0.1) * a) + d * Math.sin((y + 0.1) * a)
  ]
}

function Hopalong1(x, y, a, b, c) {
  return [
    y - Math.sqrt(Math.abs(b * x - c)) * Math.sign(x),
    a - x
  ]
}

function Hopalong2(x, y, a, b, c) {
  return [
    y - 1.0 - Math.sqrt(Math.abs(b * x - 1.0 - c)) * Math.sign(x - 1.0),
    a - x - 1.0
  ]
}

