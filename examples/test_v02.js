let list = [1, 2, 3];
console.log(list);
let sq = list.map(x => x * x);
console.log(sq);
let r = (() => { const r = []; for(let i=1; i<=5; i++) r.push(i); return r; })();
console.log(r);
function addOne(x) {
return x + 1;
}
let res_v2 = addOne(10);
console.log(res_v2);
let { a, b } = { a: 100, b: 200 };
console.log(a);
console.log(b);