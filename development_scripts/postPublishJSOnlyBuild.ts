import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const packageJSON: typeof import("../package.json") = JSON.parse(readFileSync("../package.json").toString());

if (packageJSON.version.includes("-jsonly")) {
    execSync(`npm version v${packageJSON.version.replace("-jsonly", "")} --no-git-tag-version`);
    writeFileSync(
        "../package.json",
        readFileSync("../package.json")
            .toString()
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
    );
    writeFileSync(
        "../.npmignore",
        readFileSync("../.npmignore")
            .toString()
            .replace(
                `*.ts
!*.d.ts`,
                `# *.ts
# !*.d.ts`
            )
    );
}
