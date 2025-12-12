import { execSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const packageJSON: typeof import("../package.json") = JSON.parse(readFileSync(path.join(import.meta.dirname, "../package.json")).toString());

if (packageJSON.version.includes("-jsonly")) {
    execSync(`npm version v${packageJSON.version.replace("-jsonly", "")} --no-git-tag-version`);
    writeFileSync(
        path.join(import.meta.dirname, "../package.json"),
        readFileSync(path.join(import.meta.dirname, "../package.json"))
            .toString()
            // CRLF
            .replace(
                `"exports": {\r
        ".": {\r
            "types": "./index.d.ts",\r
            "default": "./index.js"\r
        }\r
    }`,
                `"exports": {\r
        ".": {\r
            "types": "./index.d.ts",\r
            "default": "./index.js"\r
        },\r
        "./ts": {\r
            "types": "./index.ts",\r
            "default": "./index.ts"\r
        }\r
    }`
            )
            // LF
            .replace(
                `"exports": {
        ".": {
            "types": "./index.d.ts",
            "default": "./index.js"
        }
    }`,
                `"exports": {
        ".": {
            "types": "./index.d.ts",
            "default": "./index.js"
        },
        "./ts": {
            "types": "./index.ts",
            "default": "./index.ts"
        }
    }`
            )
            .replace(`"main": "index.js",`, `"main": "index.ts",`)
    );
    writeFileSync(
        path.join(import.meta.dirname, "../.npmignore"),
        readFileSync(path.join(import.meta.dirname, "../.npmignore"))
            .toString()
            .replace(`\n*.ts`, `\n# *.ts`)
            .replace(`\n!*.d.ts`, `\n# !*.d.ts`)
    );
}
