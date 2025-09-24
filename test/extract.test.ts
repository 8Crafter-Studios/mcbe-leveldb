import { LevelDB } from "@8crafter/leveldb-zlib";
import { appendFileSync, cpSync, existsSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import NBT from "prismarine-nbt";
import { prettyPrintSNBT, prismarineToSNBT } from "../SNBTUtils.ts";
import { argv } from "node:process";
import {
    DBEntryContentTypes,
    entryContentTypeToFormatMap,
    getContentTypeFromDBKey,
    getKeyDisplayName,
    sanitizeDisplayKey,
    sanitizeFilename,
    type DBEntryContentType,
} from "../LevelUtils.ts";

const worldDir = "../testWorld";
const originalWorldDir = "../testWorld_unmodified";
const outDir = "../results";
// const worldDir = "../testWorld_1.16.40_test";
// const originalWorldDir = "../testWorld_1.16.40_test";
// const outDir = "../results_1.16.40_test";
const parsedDir = "parsed";
const unparseableDir = "unparseable";
const rawDir = "raw";
const keysDir = "keys";
const prismarineNBTDir = "prismarine-nbt";
const snbtDir = "snbt";

const DEBUG = true;

const dryRun: boolean = argv.includes("--dry-run");

const typesToExtract: DBEntryContentType[] | undefined = argv
    .find((arg: string): boolean => arg.startsWith("--types="))
    ?.slice(8)
    .split(",") as DBEntryContentType[] | undefined;

if (!dryRun) {
    if ((worldDir as string) !== (originalWorldDir as string)) {
        const actualWorldDir: string = realpathSync(worldDir);
        const actualOriginalWorldDir: string = realpathSync(originalWorldDir);
        rmSync(actualWorldDir, { recursive: true, force: true });
        cpSync(actualOriginalWorldDir, actualWorldDir, { recursive: true, force: true });
    }

    rmSync(outDir, { recursive: true, force: true });

    mkdirSync(`${outDir}/${parsedDir}`, { recursive: true });
    mkdirSync(`${outDir}/${unparseableDir}`, { recursive: true });
    mkdirSync(`${outDir}/${rawDir}`, { recursive: true });
    mkdirSync(`${outDir}/${keysDir}`, { recursive: true });
    mkdirSync(`${outDir}/${prismarineNBTDir}`, { recursive: true });
    mkdirSync(`${outDir}/${snbtDir}`, { recursive: true });
}

// Create a database
const db = new LevelDB(`${worldDir}/db` /* , { valueEncoding: "buffer" } */);
await db.open();

// function convertPrismarineNBTToSNBT(nbtData: NBT.NBT): string {
//     return JSON.stringify(nbtData, (key, value: NBT.Tags[NBT.TagType]) => {
//         if (typeof value === "object" && value !== null && !Array.isArray(value)) {
//             const type = value.type;
//             if (!("type" in value) || !("value" in value)) return value as any;
//             switch (type as typeof type | "end") {
//                 case NBT.TagType.List:
//                     switch (value.value.type as typeof value.value.type | "end") {
//                         case "end":
//                             return value as any;
//                     }
//                     console.log("NBTLISTTYPE:", value.value.type, JSON.stringify(value.value));
//                     console.log("NBTTAGTYPE:", type, JSON.stringify(value));
//                     break;
//                 case "end":
//                 default:
//                     console.log("NBTTAGTYPE:", type, JSON.stringify(value));
//             }
//             return value as any;
//         }
//         return value as any;
//     });
// }

if (!dryRun) {
    for (const contentType of DBEntryContentTypes) {
        mkdirSync(`${outDir}/${parsedDir}/${contentType}`, { recursive: true });
        mkdirSync(`${outDir}/${unparseableDir}/${contentType}`, { recursive: true });
        mkdirSync(`${outDir}/${rawDir}/${contentType}`, { recursive: true });
        mkdirSync(`${outDir}/${keysDir}/${contentType}`, { recursive: true });
        mkdirSync(`${outDir}/${prismarineNBTDir}/${contentType}`, { recursive: true });
        mkdirSync(`${outDir}/${snbtDir}/${contentType}`, { recursive: true });
    }
}

writeFileSync("../test1.bin", "");
writeFileSync("../test2.txt", "");

const foundOfContentTypes: Record<DBEntryContentType, number> = Object.fromEntries(DBEntryContentTypes.map((contentType) => [contentType, 0])) as any;

const otherAABBVolumesTypeKeys: string[] = [];

globalThis.ia = 0;
declare global {
    namespace globalThis {
        var ia: 0;
    }
}
const dbKeys: [stringKey: string, bufferKey: string][] = [];
/* try {
console.log((await db.get("server_26303fce-945f-4599-89c0-ae0bfb83b200")));
} catch (e) {
    console.log(5);
    console.error(e, e.stack);
} */
for await (let [rawKey, value] of db.getIterator(
    /* <Buffer, Buffer> */ { /* valueEncoding: "buffer", keyEncoding: "buffer" */ keyAsBuffer: true, valueAsBuffer: true, keys: true, values: true }
) as unknown as Iterable<[Buffer, Buffer]>) {
    dbKeys.push([
        rawKey.toString(),
        rawKey
            .toJSON()
            .data.map((v: number): string => v.toString(16).toUpperCase().padStart(2, "0"))
            .join(" "),
    ]);
    ia++;
    const key: string = rawKey.toString("binary");
    const displayKey: string = getKeyDisplayName(rawKey);
    // console.log(typeof key, value[Symbol.toStringTag]);
    console.log(/* rawKey,  */ sanitizeDisplayKey(displayKey).padEnd(40), displayKey.padEnd(40), ia);
    // console.log(i);
    const filename: string = sanitizeFilename(displayKey);
    const contentType: DBEntryContentType | undefined = getContentTypeFromDBKey(rawKey);
    const format =
        contentType && contentType in entryContentTypeToFormatMap
            ? entryContentTypeToFormatMap[contentType as keyof typeof entryContentTypeToFormatMap]
            : undefined;
    const subFolder = contentType;

    if (dryRun) continue;

    foundOfContentTypes[contentType]++;

    if (typesToExtract && !typesToExtract.includes(contentType)) continue;

    if (contentType === "AABBVolumes") {
        if (!value.toString("binary").includes("trial_chambers") && !value.toString("binary").includes("trail_ruins")) {
            otherAABBVolumesTypeKeys.push(filename);
        }
    }

    switch (true) {
        case format === undefined: {
            const output: string = key + "\n\n" + value.toString();
            if (existsSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`)) {
                writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename} (${ia}).bin`, output);
            } else {
                writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`, output);
            }
            break;
        }
        case format!.type === "NBT":
            try {
                const data = await NBT.parse(value);
                // console.log(data);
                const output: string = JSON.stringify({ key: key, ...data }, null, 4);
                if (existsSync(`${outDir}/${parsedDir}/${subFolder}/${filename}.json`)) {
                    writeFileSync(`${outDir}/${parsedDir}/${subFolder}/${filename} (${ia}).json`, output);
                } else {
                    writeFileSync(`${outDir}/${parsedDir}/${subFolder}/${filename}.json`, output);
                }
                const prismarineNBTOutput: string = JSON.stringify(data.parsed, null, 4);
                if (existsSync(`${outDir}/${prismarineNBTDir}/${subFolder}/${filename}.json`)) {
                    writeFileSync(`${outDir}/${prismarineNBTDir}/${subFolder}/${filename} (${ia}).json`, prismarineNBTOutput);
                } else {
                    writeFileSync(`${outDir}/${prismarineNBTDir}/${subFolder}/${filename}.json`, prismarineNBTOutput);
                }
                const snbtOutput: string = prettyPrintSNBT(prismarineToSNBT(data.parsed), { inlineArrays: false, indent: 4 });
                if (existsSync(`${outDir}/${snbtDir}/${subFolder}/${filename}.snbt`)) {
                    writeFileSync(`${outDir}/${snbtDir}/${subFolder}/${filename} (${ia}).snbt`, snbtOutput);
                } else {
                    writeFileSync(`${outDir}/${snbtDir}/${subFolder}/${filename}.snbt`, snbtOutput);
                }
            } catch (e) {
                console.error(e);
                const output: Buffer = value;
                if (existsSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`)) {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename} (${ia}).bin`, output);
                } else {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`, output);
                }
            }
            break;
        // case format.type === "JSON":
        //     if (existsSync(`${outDir}/${parsedDir}/${subFolder}/${filename}.json`)) {
        //         writeFileSync(`${outDir}/${parsedDir}/${subFolder}/${filename} (${i}).json`, value.toString());
        //     } else {
        //         writeFileSync(`${outDir}/${parsedDir}/${subFolder}/${filename}.json`, value.toString());
        //     }
        //     break;
        // }
        case format!.type === "int": {
            try {
                const output: string = BigInt("0x" + value.slice(0, format.bytes).toString("hex")).toString(10);

                if (existsSync(`${outDir}/${rawDir}/${subFolder}/${filename}.json`)) {
                    writeFileSync(`${outDir}/${rawDir}/${subFolder}/${filename} (${ia}).json`, output);
                } else {
                    writeFileSync(`${outDir}/${rawDir}/${subFolder}/${filename}.json`, output);
                }
            } catch (e) {
                console.error(`Format: ${JSON.stringify(format)}; Content Type: ${contentType};`, e);
                const output: Buffer = value;
                if (existsSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`)) {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename} (${ia}).bin`, output);
                } else {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`, output);
                }
            }
            break;
        }
        case format!.type === "ASCII": {
            try {
                const output: string = value.toString("ascii");

                if (existsSync(`${outDir}/${rawDir}/${subFolder}/${filename}.bin`)) {
                    writeFileSync(`${outDir}/${rawDir}/${subFolder}/${filename} (${ia}).bin`, output);
                } else {
                    writeFileSync(`${outDir}/${rawDir}/${subFolder}/${filename}.bin`, output);
                }
            } catch (e) {
                console.error(`Format: ${JSON.stringify(format)}; Content Type: ${contentType};`, e);
                const output: Buffer = value;
                if (existsSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`)) {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename} (${ia}).bin`, output);
                } else {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`, output);
                }
            }
            break;
        }
        case format!.type === "custom": {
            try {
                // DEBUG && appendFileSync("../test1.bin", "\n\n");
                // DEBUG && appendFileSync("../test1.bin", key);
                // DEBUG && appendFileSync("../test1.bin", "\n");
                // DEBUG && appendFileSync("../test1.bin", ia.toString());
                // DEBUG && appendFileSync("../test1.bin", "\n");
                switch (format.resultType) {
                    case "JSONNBT": {
                        const output = await format.parse(value);

                        if (existsSync(`${outDir}/${parsedDir}/${subFolder}/${filename}.json`)) {
                            writeFileSync(`${outDir}/${parsedDir}/${subFolder}/${filename} (${ia}).json`, JSON.stringify({ key, ...output }));
                        } else {
                            writeFileSync(`${outDir}/${parsedDir}/${subFolder}/${filename}.json`, JSON.stringify({ key, ...output }));
                        }
                        const prismarineNBTOutput: string = JSON.stringify(output, null, 4);
                        if (existsSync(`${outDir}/${prismarineNBTDir}/${subFolder}/${filename}.json`)) {
                            writeFileSync(`${outDir}/${prismarineNBTDir}/${subFolder}/${filename} (${ia}).json`, prismarineNBTOutput);
                        } else {
                            writeFileSync(`${outDir}/${prismarineNBTDir}/${subFolder}/${filename}.json`, prismarineNBTOutput);
                        }
                        const snbtOutput: string = prettyPrintSNBT(prismarineToSNBT(output), { inlineArrays: false, indent: 4 });
                        if (existsSync(`${outDir}/${snbtDir}/${subFolder}/${filename}.snbt`)) {
                            writeFileSync(`${outDir}/${snbtDir}/${subFolder}/${filename} (${ia}).snbt`, snbtOutput);
                        } else {
                            writeFileSync(`${outDir}/${snbtDir}/${subFolder}/${filename}.snbt`, snbtOutput);
                        }
                        if (existsSync(`${outDir}/${snbtDir}/${subFolder}/${filename}.bin`)) {
                            writeFileSync(`${outDir}/${snbtDir}/${subFolder}/${filename} (${ia}).bin`, format.serialize(output as any));
                        } else {
                            writeFileSync(`${outDir}/${snbtDir}/${subFolder}/${filename}.bin`, format.serialize(output as any));
                        }
                        if (existsSync(`${outDir}/${snbtDir}/${subFolder}/${filename}.snbt2`)) {
                            writeFileSync(
                                `${outDir}/${snbtDir}/${subFolder}/${filename} (${ia}).snbt2`,
                                prettyPrintSNBT(prismarineToSNBT(await format.parse(format.serialize(output as any))), { inlineArrays: false, indent: 4 })
                            );
                        } else {
                            writeFileSync(
                                `${outDir}/${snbtDir}/${subFolder}/${filename}.snbt2`,
                                prettyPrintSNBT(prismarineToSNBT(await format.parse(format.serialize(output as any))), { inlineArrays: false, indent: 4 })
                            );
                        }

                        break;
                    }
                    default:
                        throw new TypeError(`Unsupported custom parser result type: ${format.resultType}`);
                }
            } catch (e) {
                console.error(`Format: ${JSON.stringify(format)}; Content Type: ${contentType};`, e);
                const output: Buffer = value;
                if (existsSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`)) {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename} (${ia}).bin`, output);
                } else {
                    writeFileSync(`${outDir}/${unparseableDir}/${subFolder}/${filename}.bin`, output);
                }
            }
            break;
        }
    }
    if (existsSync(`${outDir}/${rawDir}/${subFolder}/${filename}.${format?.type === "NBT" ? "nbt" : "bin"}`)) {
        writeFileSync(`${outDir}/${rawDir}/${subFolder}/${filename} (${ia}).${format?.type === "NBT" ? "nbt" : "bin"}`, /* key + "\n\n" +  */ value);
    } else {
        writeFileSync(`${outDir}/${rawDir}/${subFolder}/${filename}.${format?.type === "NBT" ? "nbt" : "bin"}`, /* key + "\n\n" +  */ value);
    }
    if (existsSync(`${outDir}/${keysDir}/${subFolder}/${filename}.txt`)) {
        writeFileSync(`${outDir}/${keysDir}/${subFolder}/${filename} (${ia}).txt`, key);
    } else {
        writeFileSync(`${outDir}/${keysDir}/${subFolder}/${filename}.txt`, key);
    }
}
writeFileSync(`${outDir}/keys.json`, JSON.stringify(dbKeys, null, 4));
writeFileSync(`${outDir}/foundOfContentTypes.json`, JSON.stringify(foundOfContentTypes, null, 4));

console.log(foundOfContentTypes);

console.log(otherAABBVolumesTypeKeys);
