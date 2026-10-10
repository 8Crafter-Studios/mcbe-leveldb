import { readFileSync, writeFileSync } from "node:fs";
import { NBTSchemas } from "../nbtSchemas.ts";
import path from "node:path";
import { execSync } from "node:child_process";

let nbtSchemasTSContents: string = readFileSync(path.join(import.meta.dirname, "../nbtSchemas.ts"), "utf-8");

const schemaTypesNamespaceStartString: string = `
    export namespace NBTSchemaTypes {
        // NBT schema TypeScript types start.
`.replaceAll(/(?<!\r)\n/g, "\r\n");
const schemaTypesNamespaceEndString: string = `
        // NBT schema TypeScript types end.
    }
}`.replaceAll(/(?<!\r)\n/g, "\r\n");

{
    const schemaTypesNameSpaceStartPosition: number = nbtSchemasTSContents.indexOf(schemaTypesNamespaceStartString) + schemaTypesNamespaceStartString.length;
    const schemaTypesNameSpaceEndPosition: number = nbtSchemasTSContents.indexOf(schemaTypesNamespaceEndString, schemaTypesNameSpaceStartPosition);

    nbtSchemasTSContents =
        nbtSchemasTSContents.slice(0, schemaTypesNameSpaceStartPosition) +
        Object.entries(NBTSchemas.nbtSchemas)
            .map(([name, schema]) =>
                NBTSchemas.Utils.Conversion.ToTypeScriptType.nbtSchemaToTypeScriptType(schema, name, {
                    schemaIDToSymbolNameResolver(schemaID: string): string {
                        return `${schemaID}`;
                    },
                    originalSymbolReference: `NBTSchemas.nbtSchemas.${name}`, // This makes the generated types have a clickable link to go to the original NBT schema.
                })
            )
            .join("\n\n")
            .replaceAll(/(?<!\r)\n/g, "\r\n") +
        nbtSchemasTSContents.slice(schemaTypesNameSpaceEndPosition);
}

writeFileSync(path.join(import.meta.dirname, "../nbtSchemas.ts"), nbtSchemasTSContents);

execSync("prettier -w ../nbtSchemas.ts", { cwd: import.meta.dirname, stdio: "inherit" });
