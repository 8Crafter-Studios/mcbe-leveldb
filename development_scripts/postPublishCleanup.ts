import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

for (const file of [...readdirSync("./", { withFileTypes: true }), ...readdirSync("./utils", { withFileTypes: true })]) {
    if (file.isFile()) {
        const filePath: string = path.join(file.parentPath, file.name);
        if (
            (filePath.endsWith(".js") && existsSync(filePath.replace(/\.js$/, ".ts"))) ||
            (filePath.endsWith(".js.map") && existsSync(filePath.replace(/\.js\.map$/, ".ts"))) ||
            (filePath.endsWith(".d.ts") && existsSync(filePath.replace(/\.d\.ts$/, ".js")) && existsSync(filePath.replace(/\.d\.ts$/, ".ts"))) ||
            (filePath.endsWith(".d.ts.map") && existsSync(filePath.replace(/\.d\.ts\.map$/, ".ts")))
        ) {
            rmSync(filePath);
        }
    }
}
