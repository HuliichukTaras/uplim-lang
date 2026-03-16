
function reducer(current) {
return ({ ...current, ...{ visits: current.visits + 1 } });
}
let app = { __upl_struct: "AppState", message: "Hello", visits: 0 };
let next = reducer(app);
console.log(next.visits);
console.log(app.visits);