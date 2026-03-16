const limit = 6;
console.log(limit);
let evens = (() => { const r = []; const __start = 0; const __end = 6; const __step = 2; if (__step === 0) throw new Error("Range step cannot be zero."); if (__step > 0) { for (let i = __start; i <= __end; i += __step) r.push(i); } else { for (let i = __start; i >= __end; i += __step) r.push(i); } return r; })();
console.log(evens);
let countdown = (() => { const r = []; const __start = 3; const __end = 0; const __step = -1; if (__step === 0) throw new Error("Range step cannot be zero."); if (__step > 0) { for (let i = __start; i <= __end; i += __step) r.push(i); } else { for (let i = __start; i >= __end; i += __step) r.push(i); } return r; })();
console.log(countdown);