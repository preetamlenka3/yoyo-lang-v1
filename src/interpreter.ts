import type { Expr, Program, Statement } from "./parser.js";

class Env {
  values = new Map<string, any>();
  constructor(public parent?: Env) {}
  get(n: string): any {
    if (this.values.has(n)) return this.values.get(n);
    if (this.parent) return this.parent.get(n);
    throw new Error(`'${n}' variable nahi mila.`);
  }
  set(n: string, v: any) {
    if (this.values.has(n) || !this.parent) { this.values.set(n, v); return; }
    try { this.parent.get(n); this.parent.set(n, v); } catch { this.values.set(n, v); }
  }
}
class ReturnSignal { constructor(public value: any) {} }
class BreakSignal {}
class ContinueSignal {}

export class Interpreter {
  async run(p: Program) {
    const e = new Env();
    e.values.set("roast", (x: any) => `🔥 ${x} — kya bakchodi hai.`);
    e.values.set("flex", (x: any) => { console.log(`😎 ${x}`); return null; });
    await this.execBlock(p.body, e);
  }
  private async execBlock(b: Statement[], e: Env) { for (const s of b) await this.exec(s, e); }
  private async exec(s: Statement, e: Env): Promise<void> {
    switch (s.kind) {
      case "var": e.values.set(s.name, await this.evaluate(s.expr, e)); return;
      case "assign": e.set(s.name, await this.evaluate(s.expr, e)); return;
      case "print": console.log(await this.evaluate(s.expr, e)); return;
      case "expr": await this.evaluate(s.expr, e); return;
      case "if": if (await this.evaluate(s.test, e)) await this.execBlock(s.then, e); else await this.execBlock(s.elseBody, e); return;
      case "while":
        while (await this.evaluate(s.test, e)) {
          try { await this.execBlock(s.body, e); }
          catch (x) { if (x instanceof BreakSignal) break; if (x instanceof ContinueSignal) continue; throw x; }
        }
        return;
      case "function": e.values.set(s.name, { params: s.params, body: s.body, closure: e }); return;
      case "return": throw new ReturnSignal(s.expr ? await this.evaluate(s.expr, e) : null);
      case "break": throw new BreakSignal();
      case "continue": throw new ContinueSignal();
    }
  }
  private async evaluate(e: Expr, env: Env): Promise<any> {
    switch (e.kind) {
      case "literal": return e.value;
      case "variable": return env.get(e.name);
      case "unary": { const v = await this.evaluate(e.expr, env); return e.op === "!" ? !v : -v; }
      case "binary": {
        const l = await this.evaluate(e.left, env), r = await this.evaluate(e.right, env);
        switch (e.op) {
          case "+": return l + r; case "-": return l - r; case "*": return l * r; case "/": return l / r; case "%": return l % r;
          case "==": return l === r; case "!=": return l !== r; case ">": return l > r; case ">=": return l >= r; case "<": return l < r; case "<=": return l <= r;
          case "&&": return l && r; case "||": return l || r;
          default: throw new Error(`Operator '${e.op}' invalid hai.`);
        }
      }
      case "call": {
        const call = e;
        const fn = env.get(call.name);
        const values: any[] = [];
        for (const arg of call.args) values.push(await this.evaluate(arg, env));
        if (typeof fn === "function") return await fn(...values);
        if (fn?.body) {
          const local = new Env(fn.closure);
          fn.params.forEach((p: string, i: number) => local.values.set(p, values[i]));
          try { await this.execBlock(fn.body, local); }
          catch (x) { if (x instanceof ReturnSignal) return x.value; throw x; }
          return null;
        }
        throw new Error(`'${call.name}' function nahi hai. Kya scene hai?`);
      }
    }
  }
}
