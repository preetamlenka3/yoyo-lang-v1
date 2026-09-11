#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
if(process.argv.includes("--version")||process.argv.includes("-v")){console.log("YOYO Language v1.0.1");process.exit(0)}
const file=process.argv[2];
if(!file){console.log(`\n🎤 YOYO Language v1.0.1\n\nUsage:\n  yoyo <file.yoyo>\n  yoyo --version\n`);process.exit(0)}
try{const {tokenize}=await import("../dist/lexer.js");const {parse}=await import("../dist/parser.js");const {Interpreter}=await import("../dist/interpreter.js");const source=fs.readFileSync(file,"utf8");await new Interpreter().run(parse(tokenize(source)))}catch(error){console.error("\n💀 YOYO SCENE ERROR");console.error(error instanceof Error?error.message:String(error));process.exitCode=1}
