let items = (() => { const r = []; const __start = 1; const __end = 3; const __step = 1; if (__step === 0) throw new Error("Range step cannot be zero."); if (__step > 0) { for (let i = __start; i <= __end; i += __step) r.push(i); } else { for (let i = __start; i >= __end; i += __step) r.push(i); } return r; })();
for (const item of items) {
console.log(item);
}