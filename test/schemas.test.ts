import { writeFileSync } from "node:fs";
import { NBTSchemas } from "../nbtSchemas.ts";
import path from "node:path";

// console.log(JSON.stringify(convertAllSchemas(nbtSchemas)));
writeFileSync(
    path.join(import.meta.dirname, "./nbtJSONSchemas.json"),
    JSON.stringify(NBTSchemas.Utils.Conversion.ToJSONSchema.convertAllSchemas(NBTSchemas.nbtSchemas), null, 4).replaceAll(/(?<!\r)\n/g, "\r\n")
);
// writeFileSync(
//     path.join(import.meta.dirname, "./nbtSchemaTypeScriptInterfaces.d.ts"),
//     'import type { NBTSchemas } from "../nbtSchemas.ts";\n\n' +  Object.entries(NBTSchemas.nbtSchemas)
//         .map(([name, schema]) =>
//             NBTSchemas.Utils.Conversion.ToTypeScriptInterface.nbtSchemaToTypeScriptInterface(schema, "DataTypes_" + name, {
//                 schemaIDToSymbolNameResolver(schemaID: string): string {
//                     return `DataTypes_${schemaID}`;
//                 },
//                 originalSymbolReference: `NBTSchemas.nbtSchemas.${name}`,
//             })
//         )
//         .join("\n\n").replaceAll(/(?<!\r)\n/g, "\r\n")
// );

writeFileSync(
    path.join(import.meta.dirname, "./nbtSchemaTypeScriptInterfaces.d.ts"),
    Object.entries(NBTSchemas.nbtSchemas)
        .map(([name, schema]) =>
            NBTSchemas.Utils.Conversion.ToTypeScriptType.nbtSchemaToTypeScriptType(schema, name, {
                schemaIDToSymbolNameResolver(schemaID: string): string {
                    return `${schemaID}`;
                },
                originalSymbolReference: `NBTSchemas.nbtSchemas.${name}`, // This makes the generated types have a clickable link to go to the original NBT schema.
            })
        )
        .join("\n\n").replaceAll(/(?<!\r)\n/g, "\r\n")
);
