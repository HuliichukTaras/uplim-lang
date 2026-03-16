let value = 12;
let result = (() => { const __match = value; { const __scope0 = {}; if ((__scope0.n = __match, true)) { const { n } = __scope0; if (n > 10) return "large"; } } { const __scope1 = {}; if ((__scope1.n = __match, true)) { const { n } = __scope1; if (n > 0) return "positive"; } } { const __scope2 = {}; if (true) { return "other"; } } throw new Error("Match expression did not find a matching arm"); })();
console.log(result);
let point = [3, 4];
let total = (() => { const __match = point; { const __scope0 = {}; if (Array.isArray(__match) && __match.length === 2 && (__scope0.x = __match[0], true) && (__scope0.y = __match[1], true)) { const { x, y } = __scope0; return x + y; } } { const __scope1 = {}; if (true) { return 0; } } throw new Error("Match expression did not find a matching arm"); })();
console.log(total);
let person = { name: "Alice", age: 30 };
let label = (() => { const __match = person; { const __scope0 = {}; if (__match !== null && typeof __match === "object" && !Array.isArray(__match) && "name" in __match && (__scope0.name = __match["name"], true) && "age" in __match && (__scope0.age = __match["age"], true)) { const { name, age } = __scope0; return name; } } { const __scope1 = {}; if (true) { return "unknown"; } } throw new Error("Match expression did not find a matching arm"); })();
console.log(label);