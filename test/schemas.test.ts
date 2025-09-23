import { writeFileSync } from "node:fs";
import { NBTSchemas } from "../nbtSchemas.ts";
import path from "node:path";

// console.log(JSON.stringify(convertAllSchemas(nbtSchemas)));
writeFileSync(
    path.join(import.meta.dirname, "./nbtJSONSchemas.json"),
    JSON.stringify(NBTSchemas.Utils.Conversion.ToJSONSchema.convertAllSchemas(NBTSchemas.nbtSchemas), null, 4)
);
// writeFileSync(
//     path.join(import.meta.dirname, "./nbtSchemaTypeScriptInterfaces.d.ts"),
//     'import type { NBTSchemas } from "../nbtSchemas.ts";\n\n' +  Object.entries(NBTSchemas.nbtSchemas)
//         .map(([name, schema]) =>
//             NBTSchemas.Utils.Conversion.ToTypeScriptInterface.nbtSchemaToTypeScriptInterface(schema, "DataTypes_" + name, {
//                 refLookup: Object.keys(NBTSchemas.nbtSchemas).reduce((acc, key) => ({ ...acc, [key]: `DataTypes_${key}` }), {}), // This makes it map references to their interface types instead of inlining them.
//                 schemaIDToSymbolNameResolver(schemaID: string): string {
//                     return `DataTypes_${schemaID}`;
//                 },
//                 originalSymbolReference: `NBTSchemas.nbtSchemas.${name}`,
//             })
//         )
//         .join("\n\n")
// );

writeFileSync(
    path.join(import.meta.dirname, "./nbtSchemaTypeScriptInterfaces.d.ts"),
    Object.entries(NBTSchemas.nbtSchemas)
        .map(([name, schema]) =>
            NBTSchemas.Utils.Conversion.ToTypeScriptType.nbtSchemaToTypeScriptType(schema, name, {
                refLookup: Object.keys(NBTSchemas.nbtSchemas).reduce((acc, key) => ({ ...acc, [key]: `${key}` }), {}), // This makes it map references to their interface types instead of inlining them.
                schemaIDToSymbolNameResolver(schemaID: string): string {
                    return `${schemaID}`;
                },
                originalSymbolReference: `NBTSchemas.nbtSchemas.${name}`,
            })
        )
        .join("\n\n")
);
