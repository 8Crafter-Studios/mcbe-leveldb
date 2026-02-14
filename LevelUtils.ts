import { appendFileSync } from "node:fs";
import NBT from "prismarine-nbt";
import BiomeData from "./__biome_data__.ts";
import type { LevelDB } from "@8crafter/leveldb-zlib";
import type { NBTSchemas } from "./nbtSchemas.ts";
import type { Range } from "./types.js";
import { toLongParts } from "./SNBTUtils.ts";

//#region Local Constants

const DEBUG = false;
const fileNameEncodeCharacterRegExp = /[/:>?\\]/g;
const fileNameCharacterFilterRegExp = /[^a-zA-Z0-9-_+,-.;=@~/:>?\\]/g;

//#endregion

//#region Local Functions

/**
 * A tuple of length 16.
 *
 * @template T The type of the elements in the tuple.
 */
type TupleOfLength16<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];

function readInt16LE(buf: Uint8Array, offset: number): number {
    const val = buf[offset]! | (buf[offset + 1]! << 8);
    return val >= 0x8000 ? val - 0x10000 : val;
}

function writeInt16LE(value: number): Buffer<ArrayBuffer> {
    const buf = Buffer.alloc(2);
    buf.writeInt16LE(value, 0);
    return buf;
}

function writeInt32LE(value: number): Buffer<ArrayBuffer> {
    const buf = Buffer.alloc(4);
    buf.writeInt32LE(value, 0);
    return buf;
}

// export function readData3dValue(rawvalue: Uint8Array | null): {
//     /**
//      * A height map in the form [x][z].
//      */
//     heightMap: TupleOfLength16<TupleOfLength16<number>>;
//     /**
//      * A biome map in the form [x][y][z].
//      */
//     biomeMap: TupleOfLength16<TupleOfLength16<TupleOfLength16<number>>>;
// } | null {
//     if (!rawvalue) {
//         return null;
//     }

//     // --- Height map (first 512 bytes -> 256 signed 16-bit ints) ---
//     const heightMap: TupleOfLength16<TupleOfLength16<number>> = Array.from(
//         { length: 16 },
//         (): TupleOfLength16<number> => Array(16).fill(0) as TupleOfLength16<number>
//     ) as TupleOfLength16<TupleOfLength16<number>>;
//     for (let i: number = 0; i < 256; i++) {
//         const val: number = readInt16LE(rawvalue, i * 2);
//         const x: number = i % 16;
//         const z: number = Math.floor(i / 16);
//         heightMap[x]![z] = val;
//     }

//     // --- Biome subchunks (remaining bytes) ---
//     const biomeBytes: Uint8Array<ArrayBuffer> = rawvalue.slice(512);
//     let b: BiomePalette[] = readChunkBiomes(biomeBytes);

//     // Validate Biome Data
//     if (b.length === 0 || b[0]!.values === null) {
//         throw new Error("Value does not contain at least one subchunk of biome data.");
//     }

//     // Enlarge list to length 24 if necessary
//     if (b.length < 24) {
//         while (b.length < 24) b.push({ values: null, palette: [] });
//     }

//     // Trim biome data
//     if (b.length > 24) {
//         if (b.slice(24).some((sub: BiomePalette): boolean => sub.values !== null)) {
//             console.warn(`Trimming biome data from ${b.length} to 24 subchunks.`);
//         }
//         b = b.slice(0, 24);
//     }

//     // --- Fill biome_map [16][24*16][16] (x,y,z order) ---
//     const biomeMap: TupleOfLength16<TupleOfLength16<TupleOfLength16<number>>> = Array.from(
//         { length: 16 },
//         (): TupleOfLength16<TupleOfLength16<number>> =>
//             Array.from({ length: 24 * 16 }, (): TupleOfLength16<number> => Array(16).fill(NaN) as TupleOfLength16<number>) as TupleOfLength16<
//                 TupleOfLength16<number>
//             >
//     ) as TupleOfLength16<TupleOfLength16<TupleOfLength16<number>>>;

//     const hasData: boolean[] = b.map((sub: BiomePalette): boolean => sub.values !== null);
//     const ii: number[] = hasData
//         .map((has: boolean, idx: number): number | null => (has ? idx + 1 : null))
//         .filter((i: number | null): i is number => i !== null);

//     for (const i of ii) {
//         const bb: BiomePalette = b[i - 1]!;
//         if (!bb.values) continue;

//         for (let u: number = 0; u < 4096; u++) {
//             const val: number = bb.palette[bb.values[u]! - 1]!; // R is 1-based
//             const x: number = u % 16;
//             const z: number = Math.floor(u / 16) % 16;
//             const y: number = Math.floor(u / 256);
//             biomeMap[x]![16 * (i - 1) + y]![z] = val;
//         }
//     }

//     // Fill missing subchunks by copying top of last data subchunk
//     const iMax: number = Math.max(...ii);
//     if (iMax < 24) {
//         const y: number = 16 * iMax - 1;
//         for (let yy: number = y + 1; yy < 24 * 16; yy++) {
//             for (let x: number = 0; x < 16; x++) {
//                 for (let z: number = 0; z < 16; z++) {
//                     biomeMap[x]![yy]![z] = biomeMap[x]![y]![z]!;
//                 }
//             }
//         }
//     }

//     return { heightMap, biomeMap };
// }
/**
 * Reads the value of the Data3D content type.
 *
 * @param rawvalue The raw value to read.
 * @returns The height map and biome map.
 */
export function readData3dValue(rawvalue: Uint8Array | null): {
    /**
     * A height map in the form [x][z].
     */
    heightMap: TupleOfLength16<TupleOfLength16<number>>;
    /**
     * A biome map as an array of 24 or more BiomePalette objects.
     */
    biomes: BiomePalette[];
} | null {
    if (!rawvalue) {
        return null;
    }

    // --- Height map (first 512 bytes -> 256 signed 16-bit ints) ---
    const heightMap: TupleOfLength16<TupleOfLength16<number>> = Array.from(
        { length: 16 },
        (): TupleOfLength16<number> => Array(16).fill(0) as TupleOfLength16<number>
    ) as TupleOfLength16<TupleOfLength16<number>>;

    for (let i: number = 0; i < 256; i++) {
        const val: number = readInt16LE(rawvalue, i * 2);
        const x: number = i % 16;
        const z: number = Math.floor(i / 16);
        heightMap[x]![z] = val;
    }

    // --- Biome subchunks (remaining bytes) ---
    const biomeBytes: Uint8Array = rawvalue.slice(512);
    let biomes: BiomePalette[] = readChunkBiomes(biomeBytes);

    // Validate Biome Data
    if (biomes.length === 0 || biomes[0]!.values === null) {
        throw new Error("Value does not contain at least one subchunk of biome data.");
    }

    // Enlarge list to length 24 if necessary
    if (biomes.length < 24) {
        while (biomes.length < 24) {
            biomes.push({ values: null, palette: [] });
        }
    }

    // Trim biome data (DISABLED (so that when increasing the height limits, it still works properly))
    // if (biomeMap.length > 24) {
    //     if (biomeMap.slice(24).some((sub: BiomePalette): boolean => sub.values !== null)) {
    //         console.warn(`Trimming biome data from ${biomeMap.length} to 24 subchunks.`);
    //     }
    //     biomeMap = biomeMap.slice(0, 24);
    // }

    return { heightMap, biomes };
}

/**
 * Writes the value of the Data3D content type.
 *
 * @param heightMap A height map in the form [x][z].
 * @param biomes A biome map as an array of 24 or more BiomePalette objects.
 * @returns The raw value to write.
 */
export function writeData3DValue(heightMap: TupleOfLength16<TupleOfLength16<number>>, biomes: BiomePalette[]): Buffer<ArrayBuffer> {
    // heightMap is 16x16, flatten to 256 shorts
    const flatHeight: number[] = heightMap.flatMap((v: TupleOfLength16<number>, i: number): number[] =>
        v.map((_v2: number, i2: number): number => heightMap[i2]![i]!)
    );

    // Write height map (512 bytes)
    const heightBufs: Buffer[] = flatHeight.map((v: number): Buffer<ArrayBuffer> => writeInt16LE(v));
    const heightBuf: Buffer<ArrayBuffer> = Buffer.concat(heightBufs);

    // Write biome data
    const biomeBuf: Buffer<ArrayBuffer> = writeChunkBiomes(biomes);

    // Combine
    return Buffer.concat([heightBuf, biomeBuf]);
}

/**
 * Reads chunk biome data from a buffer.
 *
 * @param rawValue The raw value to read.
 * @returns The biome data.
 *
 * @internal
 */
function readChunkBiomes(rawValue: Uint8Array): BiomePalette[] {
    let p: number = 0;
    const end: number = rawValue.length;
    const result: BiomePalette[] = [];

    while (p < end) {
        const { values, isPersistent, paletteSize, newOffset } = readSubchunkPaletteIds(rawValue, p, end);
        p = newOffset;

        if (values === null) {
            result.push({ values: null, palette: [] });
            continue;
        }

        if (isPersistent) {
            throw new Error("Biome palette does not have runtime ids.", { cause: result.length });
        }

        if (end - p < paletteSize * 4) {
            throw new Error("Subchunk biome palette is truncated.");
        }

        const palette: number[] = [];
        for (let i: number = 0; i < paletteSize; i++) {
            const val: number = rawValue[p]! | (rawValue[p + 1]! << 8) | (rawValue[p + 2]! << 16) | (rawValue[p + 3]! << 24);
            palette.push(val);
            p += 4;
        }

        result.push({ values, palette });
    }

    return result;
}

/**
 * Writes the chunk biome data from a BiomePalette array to a buffer.
 *
 * @param biomes The biome data to write.
 * @returns The resulting buffer.
 *
 * @internal
 */
function writeChunkBiomes(biomes: BiomePalette[]): Buffer<ArrayBuffer> {
    const buffers: Buffer<ArrayBuffer>[] = [];

    for (const bb of biomes) {
        if (!bb || bb.values === null || bb.values.length === 0) continue; // NULL case in R
        const { values, palette } = bb;

        // --- Write subchunk palette ids (bitpacked) ---
        const idsBuf: Buffer<ArrayBuffer> = writeSubchunkPaletteIds(values!, palette.length);

        // --- Write palette size ---
        const paletteSizeBuf: Buffer<ArrayBuffer> = writeInt32LE(palette.length);

        // --- Write palette values ---
        const paletteBufs: Buffer<ArrayBuffer>[] = palette.map((v: number): Buffer<ArrayBuffer> => writeInt32LE(v));

        buffers.push(idsBuf, paletteSizeBuf, ...paletteBufs);
    }

    return Buffer.concat(buffers);
}

function readSubchunkPaletteIds(
    buffer: Uint8Array,
    offset: number,
    end: number
): {
    values: number[] | null;
    isPersistent: boolean;
    paletteSize: number;
    newOffset: number;
} {
    let p = offset;

    if (end - p < 1) {
        throw new Error("Subchunk biome error: not enough data for flags.");
    }

    const flags = buffer[p++]!;
    const isPersistent = (flags & 1) === 0;
    const bitsPerBlock = flags >> 1;

    // Special case: palette copy
    if (bitsPerBlock === 127) {
        return { values: null, isPersistent, paletteSize: 0, newOffset: p };
    }

    const values = new Array(4096);

    if (bitsPerBlock > 0) {
        const blocksPerWord = 32 / bitsPerBlock;
        const wordCount = Math.floor(4095 / blocksPerWord) + 1;
        const mask = (1 << bitsPerBlock) - 1;

        // console.warn(
        //     "blocksPerWord:",
        //     blocksPerWord,
        //     "wordCount:",
        //     wordCount,
        //     "bitsPerBlock:",
        //     bitsPerBlock,
        //     "mask:",
        //     mask,
        //     "p:",
        //     p,
        //     "end:",
        //     end,
        //     "end-p:",
        //     end - p,
        //     "4*wordCount:",
        //     4 * wordCount,
        //     "flags:",
        //     flags,
        //     "isPersistent:",
        //     isPersistent,
        //     "offset:",
        //     offset
        // );

        if (end - p < 4 * wordCount) {
            throw new Error("Subchunk biome error: not enough data for block words.");
        }
        // const originalP = p;

        let u = 0;
        for (let j = 0; j < wordCount; j++) {
            let temp = buffer[p]! | (buffer[p + 1]! << 8) | (buffer[p + 2]! << 16) | (buffer[p + 3]! << 24);
            p += 4;

            for (let k = 0; k < blocksPerWord && u < 4096; k++) {
                // const x = (u >> 8) & 0xf;
                // const z = (u >> 4) & 0xf;
                // const y = u & 0xf;

                values[u] = temp & mask;
                temp >>= bitsPerBlock;
                u++;
            }
        }

        if (end - p < 4) {
            throw new Error("Subchunk biome error: missing palette size.");
        }

        const paletteSize = buffer[p]! | (buffer[p + 1]! << 8) | (buffer[p + 2]! << 16) | (buffer[p + 3]! << 24);
        p += 4;

        // UNDONE: This does not actually restore the original data.
        // Attempt to repair corrupted value data from versions <=v1.9.0 of the module.
        // if (blocksPerWord !== Math.floor(blocksPerWord) && end - originalP < 4 * (Math.floor(4095 / Math.floor(blocksPerWord)) + 1)) {
        //     for (let u = 0; u < 4096; u++) {
        //         const v = values[u]!;
        //         const repairedValue: number = Math.floor(v / 2);
        //         values[u] = repairedValue;
        //     }
        // }

        return { values, isPersistent, paletteSize, newOffset: p };
    } else {
        // bitsPerBlock == 0 -> everything is ID 1
        for (let u = 0; u < 4096; u++) {
            values[u] = 0;
        }
        return { values, isPersistent, paletteSize: 1, newOffset: p };
    }
}

function writeSubchunkPaletteIds(values: number[], paletteSize: number): Buffer<ArrayBuffer> {
    const blockCount: number = values.length; // usually 16*16*16 = 4096
    const bitsPerBlockOriginal: number = Math.max(1, Math.ceil(Math.log2(paletteSize)));
    const bitsPerBlockDivisors: number[] = [1, 2, 4, 8, 16, 32];

    const bitsPerBlock: number = bitsPerBlockDivisors.find((d: number): boolean => d >= bitsPerBlockOriginal) ?? 32;

    // console.log(bitsPerBlock);

    const wordsPerBlock: number = Math.ceil((blockCount * bitsPerBlock) / 32);
    const words = new Uint32Array(wordsPerBlock);

    // let bitIndex: number = 0;
    // for (const v of values) {
    //     let idx: number = v >>> 0; // ensure unsigned
    //     for (let i: number = 0; i < bitsPerBlock; i++) {
    //         if (idx & (1 << i)) {
    //             const wordIndex: number = Math.floor(bitIndex / 32);
    //             const bitOffset: number = bitIndex % 32;
    //             words[wordIndex]! |= 1 << bitOffset;
    //         }
    //         bitIndex++;
    //     }
    // }
    let bitIndex = 0;
    for (let i = 0; i < values.length; i++) {
        let val = values[i]! & ((1 << bitsPerBlock) - 1); // mask to bpe bits
        const wordIndex = Math.floor(bitIndex / 32);
        const bitOffset = bitIndex % 32;
        words[wordIndex]! |= val << bitOffset;
        if (bitOffset + bitsPerBlock > 32) {
            // spill over into next word
            words[wordIndex + 1]! |= val >>> (32 - bitOffset);
        }
        bitIndex += bitsPerBlock;
    }
    // words.forEach((val, i) => {
    //     words[i] = (-val - 1) & 0xffffffff;
    // });

    // --- Write header byte ---
    const header: Buffer<ArrayBuffer> = Buffer.alloc(1);
    header.writeUInt8((bitsPerBlock << 1) | 1, 0);

    // --- Write packed data ---
    const packed: Buffer<ArrayBuffer> = Buffer.alloc(words.length * 4);
    for (let i: number = 0; i < words.length; i++) {
        packed.writeUInt32LE(words[i]!, i * 4);
    }

    return Buffer.concat([header, packed]);
}

function fakeAssertType<T>(value: unknown): asserts value is T {
    void value;
    return;
}

//#endregion

// --------------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------------

//#region Constants

/**
 * The list of Minecraft dimensions.
 */
export const dimensions = ["overworld", "nether", "the_end"] as const;

/**
 * The list of Minecraft game modes, with their indices corresponding to their numeric gamemode IDs.
 */
export const gameModes = ["survival", "creative", "adventure", , , "default", "spectator"] as const;

/**
 * The content types for LevelDB entries.
 */
export const DBEntryContentTypes = [
    // Biome Linked
    "Data3D",
    "Version",
    "Data2D",
    "Data2DLegacy",
    "SubChunkPrefix",
    "LegacyTerrain",
    "BlockEntity",
    "Entity",
    "PendingTicks",
    "LegacyBlockExtraData",
    "BiomeState",
    "FinalizedState",
    "ConversionData",
    "BorderBlocks",
    "HardcodedSpawners",
    "RandomTicks",
    "Checksums",
    "GenerationSeed",
    "GeneratedPreCavesAndCliffsBlending",
    "BlendingBiomeHeight",
    "MetaDataHash",
    "BlendingData",
    "ActorDigestVersion",
    "LegacyVersion",
    "AABBVolumes", // TO-DO: Figure out how to parse this, it seems to have data for trial chambers and trail ruins.
    // Village
    "VillageDwellers",
    "VillageInfo",
    "VillagePOI",
    "VillagePlayers",
    "VillageRaid",
    // Standalone
    "Player",
    "PlayerClient",
    "ActorPrefix",
    "ChunkLoadedRequest",
    "Digest",
    "Map",
    "Portals",
    "SchedulerWT",
    "StructureTemplate",
    "TickingArea",
    "FlatWorldLayers",
    "LegacyOverworld",
    "LegacyNether",
    "LegacyTheEnd",
    "MVillages",
    "Villages",
    "LevelSpawnWasFixed",
    "PositionTrackingDB",
    "PositionTrackingLastId",
    "Scoreboard",
    "Overworld",
    "Nether",
    "TheEnd",
    "AutonomousEntities",
    "BiomeData",
    "BiomeIdsTable",
    "MobEvents",
    "DynamicProperties",
    "LevelChunkMetaDataDictionary",
    "RealmsStoriesData",
    "LevelDat",
    // Dev Version
    "ForcedWorldCorruption",
    // Misc.
    "Unknown",
] as const;

/**
 * Maps content types to grouping labels.
 *
 * Most content types are not grouped, only a few are.
 */
export const DBEntryContentTypesGrouping = {
    // Biome Linked
    Data3D: "Data3D",
    Version: "Version",
    Data2D: "Data2D",
    Data2DLegacy: "Data2DLegacy",
    SubChunkPrefix: "SubChunkPrefix",
    LegacyTerrain: "LegacyTerrain",
    BlockEntity: "BlockEntity",
    Entity: "Entity",
    PendingTicks: "PendingTicks",
    LegacyBlockExtraData: "LegacyBlockExtraData",
    BiomeState: "BiomeState",
    FinalizedState: "FinalizedState",
    ConversionData: "ConversionData",
    BorderBlocks: "BorderBlocks",
    HardcodedSpawners: "HardcodedSpawners",
    RandomTicks: "RandomTicks",
    Checksums: "Checksums",
    GenerationSeed: "GenerationSeed",
    GeneratedPreCavesAndCliffsBlending: "GeneratedPreCavesAndCliffsBlending",
    BlendingBiomeHeight: "BlendingBiomeHeight",
    MetaDataHash: "MetaDataHash",
    BlendingData: "BlendingData",
    ActorDigestVersion: "ActorDigestVersion",
    LegacyVersion: "LegacyVersion",
    AABBVolumes: "AABBVolumes",
    // Village
    VillageDwellers: "VillageDwellers",
    VillageInfo: "VillageInfo",
    VillagePOI: "VillagePOI",
    VillagePlayers: "VillagePlayers",
    VillageRaid: "VillageRaid",
    // Standalone
    Player: "Player",
    PlayerClient: "PlayerClient",
    ActorPrefix: "ActorPrefix",
    ChunkLoadedRequest: "ChunkLoadedRequest",
    Digest: "Digest",
    Map: "Map",
    Portals: "Portals",
    SchedulerWT: "SchedulerWT",
    StructureTemplate: "StructureTemplate",
    TickingArea: "TickingArea",
    FlatWorldLayers: "FlatWorldLayers",
    LegacyOverworld: "LegacyDimension",
    LegacyNether: "LegacyDimension",
    LegacyTheEnd: "LegacyDimension",
    MVillages: "MVillages",
    Villages: "Villages",
    LevelSpawnWasFixed: "LevelSpawnWasFixed",
    PositionTrackingDB: "PositionTrackingDB",
    PositionTrackingLastId: "PositionTrackingLastId",
    Scoreboard: "Scoreboard",
    Overworld: "Dimension",
    Nether: "Dimension",
    TheEnd: "Dimension",
    AutonomousEntities: "AutonomousEntities",
    BiomeData: "BiomeData",
    BiomeIdsTable: "BiomeIdsTable",
    MobEvents: "MobEvents",
    DynamicProperties: "DynamicProperties",
    LevelChunkMetaDataDictionary: "LevelChunkMetaDataDictionary",
    RealmsStoriesData: "RealmsStoriesData",
    LevelDat: "LevelDat",
    // Dev Version
    ForcedWorldCorruption: "ForcedWorldCorruption",
    // Misc.
    Unknown: "Unknown",
} as const satisfies Record<DBEntryContentType, string>;

// TODO: Look into the supposed `idcounts` LevelDB key that was supposedly in MCPE v0.13.0.
// TODO: Add support for the LegacyPlayer content type which is based on a number stored in `cilentid.txt`.
// TODO: Look into if LegacyVillageManager (may just be another name for MVillages, key is allegedly `VillageManager`) is a real content type.

/**
 * The content type to format mapping for LevelDB entries.
 */
export const entryContentTypeToFormatMap = {
    /**
     * The Data3D content type contains heightmap and biome data for 16x16x16 chunks of the world.
     *
     * @see {@link NBTSchemas.nbtSchemas.Data3D}
     */
    Data3D: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.Data3D.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns The parsed data.
         *
         * @throws {Error} If the value does not contain at least one subchunk of biome data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.Data3D {
            const result = readData3dValue(data);
            return {
                type: "compound",
                value: {
                    heightMap: {
                        type: "list",
                        value: {
                            type: "list",
                            value: result!.heightMap.map((row) => ({
                                type: "short",
                                value: row,
                            })),
                        },
                    },
                    biomes: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: result!.biomes.map(
                                (subchunk: BiomePalette): NBTSchemas.NBTSchemaTypes.Data3D["value"]["biomes"]["value"]["value"][number] => ({
                                    values: {
                                        type: "list",
                                        value:
                                            subchunk.values ?
                                                {
                                                    type: "int",
                                                    value: subchunk.values,
                                                }
                                            :   ({
                                                    type: "end",
                                                    value: [],
                                                } as any),
                                    },
                                    palette: {
                                        type: "list",
                                        value: {
                                            type: "int",
                                            value: subchunk.palette,
                                        },
                                    },
                                })
                            ),
                        },
                    },
                },
            };
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.Data3D): Buffer<ArrayBuffer> {
            return writeData3DValue(
                data.value.heightMap.value.value.map((row: { type: "short"; value: number[] }): number[] => row.value) as any,
                data.value.biomes.value.value.map(
                    (subchunk: NBTSchemas.NBTSchemaTypes.Data3D["value"]["biomes"]["value"]["value"][number]): BiomePalette => ({
                        palette: subchunk.palette.value.value,
                        values: !subchunk.values.value.value?.length ? null : subchunk.values.value.value,
                    })
                )
            );
        },
        // TO-DO: Add a default value for this.
    },
    /**
     * The version of a chunk.
     *
     * The current chunk version as of `v1.21.111` is `41` (`0x29`).
     *
     * Deleting think key causes the game to completely regenerate the corresponding chunk.
     */
    Version: {
        /**
         * The format type of the data.
         */
        type: "int",
        /**
         * How many bytes this integer is.
         */
        bytes: 1,
        /**
         * The endianness of the data.
         */
        format: "LE",
        /**
         * The signedness of the data.
         */
        signed: false,
        /**
         * The default value to use when initializing a new entry.
         *
         * Bytes:
         * ```json
         * [41]
         * ```
         */
        defaultValue: Buffer.from([41]),
    },
    /**
     * The Data2D content type contains heightmap and biome data for 16x128x16 chunks of the world.
     *
     * Unlike {@link entryContentTypeToFormatMap.Data3D | Data3D}, this only stores biome data for xz coordinates, so in this format all y coordinates have the same biome.
     *
     * @deprecated Only used in versions < 1.18.0.
     */
    Data2D: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.Data2D.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns The parsed data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.Data2D {
            const heightMap: TupleOfLength16<TupleOfLength16<number>> = Array.from(
                { length: 16 },
                (): TupleOfLength16<number> => Array(16).fill(0) as TupleOfLength16<number>
            ) as TupleOfLength16<TupleOfLength16<number>>;

            for (let i = 0; i < 256; i++) {
                const val: number = readInt16LE(data, i * 2);
                const x: number = i % 16;
                const z: number = Math.floor(i / 16);
                heightMap[x]![z] = val;
            }

            const biomeData: TupleOfLength16<TupleOfLength16<number>> = Array.from(
                { length: 16 },
                (): TupleOfLength16<number> => Array(16).fill(0) as TupleOfLength16<number>
            ) as TupleOfLength16<TupleOfLength16<number>>;

            for (let i = 0; i < 256; i++) {
                const val: number = data.readUInt8(512 + i);
                const x: number = i % 16;
                const z: number = Math.floor(i / 16);
                biomeData[x]![z] = val;
            }

            return {
                type: "compound",
                value: {
                    heightMap: {
                        type: "list",
                        value: {
                            type: "list",
                            value: heightMap.map((row: TupleOfLength16<number>) => ({
                                type: "short",
                                value: row,
                            })),
                        },
                    },
                    biomeData: {
                        type: "list",
                        value: {
                            type: "list",
                            value: biomeData.map((row: TupleOfLength16<number>) => ({
                                type: "byte",
                                value: row,
                            })),
                        },
                    },
                },
            };
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.Data2D): Buffer<ArrayBuffer> {
            const heightMap = data.value.heightMap.value.value;
            const biomeData = data.value.biomeData.value.value;

            const buffer: Buffer<ArrayBuffer> = Buffer.alloc(512 + 256);

            for (let z = 0; z < 16; z++) {
                for (let x: number = 0; x < 16; x++) {
                    const i: number = z * 16 + x;
                    const val: number = heightMap[x]!.value[z]!;
                    buffer.writeInt16LE(val, i * 2);
                }
            }

            for (let z = 0; z < 16; z++) {
                for (let x: number = 0; x < 16; x++) {
                    const i: number = z * 16 + x;
                    const val: number = biomeData[x]!.value[z]!;
                    buffer.writeUInt8(val, 512 + i);
                }
            }

            return buffer;
        },
    },
    /**
     * The Data2D content type contains heightmap and biome data for 16x128x16 chunks of the world.
     *
     * Unlike {@link entryContentTypeToFormatMap.Data3D | Data3D}, this only stores biome data for xz coordinates, so in this format all y coordinates have the same biome.
     *
     * Unlike both {@link entryContentTypeToFormatMap.Data3D | Data3D} and {@link entryContentTypeToFormatMap.Data2D | Data2D}, this also stores biome color data.
     *
     * @deprecated Only used in versions < 1.0.0.
     */
    Data2DLegacy: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.Data2DLegacy.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns The parsed data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.Data2DLegacy {
            const heightMap: TupleOfLength16<TupleOfLength16<number>> = Array.from(
                { length: 16 },
                (): TupleOfLength16<number> => Array(16).fill(0) as TupleOfLength16<number>
            ) as TupleOfLength16<TupleOfLength16<number>>;

            for (let i = 0; i < 256; i++) {
                const val: number = readInt16LE(data, i * 2);
                const x: number = i % 16;
                const z: number = Math.floor(i / 16);
                heightMap[x]![z] = val;
            }

            const biomeData: TupleOfLength16<TupleOfLength16<[biomeId: number, red: number, green: number, blue: number]>> = Array.from(
                { length: 16 },
                (): TupleOfLength16<[biomeId: number, red: number, green: number, blue: number]> =>
                    Array(16).fill(0) as TupleOfLength16<[biomeId: number, red: number, green: number, blue: number]>
            ) as TupleOfLength16<TupleOfLength16<[biomeId: number, red: number, green: number, blue: number]>>;

            for (let i = 0; i < 256; i++) {
                const vals: [biomeId: number, red: number, green: number, blue: number] = [
                    data.readUInt8(512 + i * 4),
                    data.readUInt8(512 + i * 4 + 1),
                    data.readUInt8(512 + i * 4 + 2),
                    data.readUInt8(512 + i * 4 + 3),
                ];
                const x: number = i % 16;
                const z: number = Math.floor(i / 16);
                biomeData[x]![z] = vals;
            }

            return {
                type: "compound",
                value: {
                    heightMap: {
                        type: "list",
                        value: {
                            type: "list",
                            value: heightMap.map((row: TupleOfLength16<number>) => ({
                                type: "short",
                                value: row,
                            })),
                        },
                    },
                    biomeData: {
                        type: "list",
                        value: {
                            type: "list",
                            value: biomeData.map((row: TupleOfLength16<[biomeId: number, red: number, green: number, blue: number]>) => ({
                                type: "list",
                                value: row.map((val: [biomeId: number, red: number, green: number, blue: number]) => ({
                                    type: "byte",
                                    value: val,
                                })),
                            })),
                        },
                    },
                },
            };
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.Data2DLegacy): Buffer<ArrayBuffer> {
            const heightMap = data.value.heightMap.value.value;
            const biomeData = data.value.biomeData.value.value;

            const buffer: Buffer<ArrayBuffer> = Buffer.alloc(512 + 1024);

            for (let z = 0; z < 16; z++) {
                for (let x: number = 0; x < 16; x++) {
                    const i: number = z * 16 + x;
                    const val: number = heightMap[x]!.value[z]!;
                    buffer.writeInt16LE(val, i * 2);
                }
            }

            for (let z = 0; z < 16; z++) {
                for (let x: number = 0; x < 16; x++) {
                    const i: number = z * 16 + x;
                    const vals: [biomeId: number, red: number, green: number, blue: number] = biomeData[x]!.value[z]!.value;
                    vals.forEach((val: number, index: number): void => void buffer.writeUInt8(val, 512 + i * 4 + index));
                }
            }

            return buffer;
        },
    },
    /**
     * The SubChunkPrefix content type contains block data for 16x16x16 subchunks of the world.
     *
     * In older versions, it may also contain sky and block light data.
     *
     * @see {@link NBTSchemas.nbtSchemas.SubChunkPrefix}
     */
    SubChunkPrefix: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.SubChunkPrefix.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns A promise that resolves with the parsed data.
         *
         * @throws {Error} If the SubChunkPrefix version is unknown.
         * @throws {Error} If the storage version is unknown.
         */
        async parse(data: Buffer): Promise<NBTSchemas.NBTSchemaTypes.SubChunkPrefix> {
            let currentOffset: number = 0;
            /**
             * The version of the SubChunkPrefix.
             *
             * Should be `0x00`/`0x02`/`0x03`/`0x04`/`0x05`/`0x06`/`0x07` (1.0.0 <= x < 1.2.13), `0x01` (beta 1.2.13.5), `0x08` (1.2.13 <= x < 1.18.0),  or `0x09` (1.18.0 <= x).
             *
             * @todo Add handling for `0x00`, `0x02`, `0x03`, `0x04`, `0x05`, `0x06`, and `0x07`.
             */
            const version: 0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 = data[currentOffset++]! as any;
            if (![0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09].includes(version)) throw new Error(`Unknown SubChunkPrefix version: ${version}`);
            if (version === 0x00 || version === 0x02 || version === 0x03 || version === 0x04 || version === 0x05 || version === 0x06 || version === 0x07) {
                const block_ids: number[] = [...data.subarray(currentOffset, currentOffset + 4096)];
                currentOffset += 4096;

                function unpackNibbleArray(byteCount: number): Range<0, 15>[] {
                    const slice = data.subarray(currentOffset, currentOffset + byteCount);
                    currentOffset += byteCount;

                    return [...slice].flatMap((n: number): number[] => [n >> 4, n & 0x0f]) as Range<0, 15>[];
                }

                const block_data: Range<0, 15>[] = unpackNibbleArray(2048);
                const sky_light: Range<0, 15>[] | undefined = data.length - currentOffset > 0 ? unpackNibbleArray(2048) : undefined;
                const block_light: Range<0, 15>[] | undefined = data.length - currentOffset > 0 ? unpackNibbleArray(2048) : undefined;
                return NBT.comp({
                    version: NBT.byte<0x00 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07>(version),
                    block_data: { type: "list", value: { type: "byte", value: block_data } },
                    block_ids: { type: "list", value: { type: "byte", value: block_ids } },
                    ...(sky_light ? { sky_light: { type: "list", value: { type: "byte", value: sky_light } } } : {}),
                    ...(block_light ? { block_light: { type: "list", value: { type: "byte", value: block_light } } } : {}),
                } as const satisfies NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v0["value"]);
            }
            const layers: NBTSchemas.NBTSchemaTypes.SubChunkPrefixLayer["value"][] = [];
            /**
             * How many blocks are in each location (ex. 2 might mean here is a waterlog layer).
             */
            let numStorageBlocks: number = version === 0x01 ? 1 : data[currentOffset++]!;
            const subChunkIndex: number | undefined = version >= 0x09 ? data[currentOffset++] : undefined;
            for (let blockIndex: number = 0; blockIndex < numStorageBlocks; blockIndex++) {
                const storageVersion: number = data[currentOffset]!;
                if (
                    !(
                        storageVersion === 1 ||
                        storageVersion === 2 ||
                        storageVersion === 3 ||
                        storageVersion === 4 ||
                        storageVersion === 5 ||
                        storageVersion === 6 ||
                        storageVersion === 8 ||
                        storageVersion === 16
                    )
                )
                    throw new Error(`Unknown storage version: ${storageVersion}`);
                currentOffset++;
                const bitsPerBlock: number = storageVersion >> 1;
                const blocksPerWord: number = Math.floor(32 / bitsPerBlock);
                const numints: number = Math.ceil(4096 / blocksPerWord);
                const blockDataOffset: number = currentOffset;
                let paletteOffset: number = blockDataOffset + 4 * numints;
                let psize: number = bitsPerBlock === 0 ? 0 : getInt32Val(data, paletteOffset);
                paletteOffset += Math.sign(bitsPerBlock) * 4;
                // const debugInfo = {
                //     version,
                //     blockIndex,
                //     storageVersion,
                //     bitsPerBlock,
                //     blocksPerWord,
                //     numints,
                //     blockDataOffset,
                //     paletteOffset,
                //     psize,
                //     // blockData,
                //     // palette,
                // };
                const palette: {
                    [paletteIndex: `${bigint}`]: NBTSchemas.NBTSchemaTypes.Block;
                } = {};
                for (let i: bigint = 0n; i < psize; i++) {
                    // console.log(debugInfo);
                    // appendFileSync("./test1.bin", JSON.stringify(debugInfo) + "\n");
                    const result = (await NBT.parse(data.subarray(paletteOffset), "little")) as unknown as {
                        parsed: NBTSchemas.NBTSchemaTypes.Block;
                        type: NBT.NBTFormat;
                        metadata: NBT.Metadata;
                    };
                    paletteOffset += result.metadata.size;
                    palette[`${i}`] = result.parsed;
                    // console.log(result);
                    // appendFileSync("./test1.bin", JSON.stringify(result));
                }
                currentOffset = paletteOffset;
                const block_indices: number[] = [];
                for (let i: number = 0; i < 4096; i++) {
                    const maskVal: number = getInt32Val(data, blockDataOffset + Math.floor(i / blocksPerWord) * 4);
                    const blockVal: number = (maskVal >> ((i % blocksPerWord) * bitsPerBlock)) & ((1 << bitsPerBlock) - 1);
                    // const blockType: DataTypes_Block | undefined = palette[`${blockVal as unknown as bigint}`];
                    // if (!blockType && blockVal !== -1) throw new ReferenceError(`Invalid block palette index ${blockVal} for block ${i}`);
                    /* const chunkOffset: Vector3 = {
                        x: (i >> 8) & 0xf,
                        y: (i >> 4) & 0xf,
                        z: (i >> 0) & 0xf,
                    }; */
                    block_indices.push(blockVal);
                }
                layers.push({
                    storageVersion: NBT.byte(storageVersion),
                    palette: NBT.comp(palette),
                    block_indices: { type: "list", value: { type: "int", value: block_indices } },
                });
            }
            if (version === 0x01) {
                return NBT.comp({
                    version: NBT.byte<0x01>(version),
                    layerCount: NBT.byte<1>(numStorageBlocks as 1),
                    layers: { type: "list", value: NBT.comp(layers as [(typeof layers)[0]]) },
                } as const satisfies NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v1["value"]);
            }
            return NBT.comp({
                version: NBT.byte<0x08 | 0x09>(version),
                layerCount: NBT.byte(numStorageBlocks),
                layers: { type: "list", value: NBT.comp(layers) },
                ...(version >= 0x09 ?
                    {
                        subChunkIndex: NBT.byte(subChunkIndex!),
                    }
                :   {}),
            } as const satisfies NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v8["value"]);
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.SubChunkPrefix): Buffer<ArrayBuffer> {
            if (![0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09].includes(data.value.version.value))
                throw new Error(`Unsupported subchunk prefix version: ${data.value.version.value}`);
            switch (data.value.version.value) {
                case 0x00:
                case 0x02:
                case 0x03:
                case 0x04:
                case 0x05:
                case 0x06:
                case 0x07: {
                    fakeAssertType<NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v0>(data);
                    function packNibbles(arr: number[]): number[] {
                        return arr.reduce(
                            (p: number[], v: number, i: number): number[] =>
                                i % 2 === 0 ? [...p, v & 0x0f] : [...p.slice(0, -1), (p.at(-1)! << 4) | (v & 0x0f)],
                            []
                        );
                    }

                    const buffer: Buffer<ArrayBuffer> = Buffer.from([data.value.version.value]);
                    return Buffer.concat([
                        buffer,
                        Buffer.from(data.value.block_ids.value.value),
                        Buffer.from(packNibbles(data.value.block_data.value.value)),
                        ...(data.value.sky_light ? [Buffer.from(packNibbles(data.value.sky_light.value.value))] : []),
                        ...(data.value.block_light ? [Buffer.from(packNibbles(data.value.block_light.value.value))] : []),
                    ]);
                }
                case 0x01:
                case 0x08:
                case 0x09: {
                    fakeAssertType<NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v1 | NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v8>(data);
                    const buffer: Buffer<ArrayBuffer> = Buffer.from([
                        data.value.version.value,
                        ...(data.value.version.value >= 0x08 ? [data.value.layerCount.value] : []),
                        ...(data.value.version.value >= 0x09 ? [(data as NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v8).value.subChunkIndex!.value] : []),
                    ]);
                    const layerBuffers: Buffer<ArrayBuffer>[] = data.value.layers.value.value.map(
                        (layer: NBTSchemas.NBTSchemaTypes.SubChunkPrefixLayer["value"]): Buffer<ArrayBuffer> => {
                            const bitsPerBlock: number = layer.storageVersion.value >> 1;
                            const blocksPerWord: number = Math.floor(32 / bitsPerBlock);
                            const numints: number = Math.ceil(4096 / blocksPerWord);
                            const bytes: number[] = [layer.storageVersion.value];
                            const blockIndicesBuffer: Buffer<ArrayBuffer> = Buffer.alloc(Math.ceil(numints * 4));
                            writeBlockIndices(blockIndicesBuffer, 0, layer.block_indices.value.value, bitsPerBlock, blocksPerWord);
                            bytes.push(...blockIndicesBuffer);
                            const paletteLengthBuffer: Buffer<ArrayBuffer> = Buffer.alloc(4);
                            setInt32Val(paletteLengthBuffer, 0, Object.keys(layer.palette.value).length);
                            bytes.push(...paletteLengthBuffer);
                            const paletteKeys: `${bigint}`[] = (Object.keys(layer.palette.value) as `${bigint}`[]).sort(
                                (a: `${bigint}`, b: `${bigint}`): number => Number(a) - Number(b)
                            );
                            for (let paletteIndex: number = 0; paletteIndex < paletteKeys.length; paletteIndex++) {
                                const block: NBTSchemas.NBTSchemaTypes.Block = layer.palette.value[paletteKeys[paletteIndex]!]!;
                                bytes.push(...NBT.writeUncompressed({ name: "", ...block }, "little"));
                            }
                            return Buffer.from(bytes);
                        }
                    );
                    return Buffer.concat([buffer, ...layerBuffers]);
                }
            }
        },
        // TO-DO: Add a default value for this.
    },
    /**
     * The LegacyTerrain content type contains block, sky light, block light, dirty columns, and grass color data for 16x16x128 chunks of the world.
     *
     * @deprecated Only used in versions < 1.0.0.
     *
     * @see {@link NBTSchemas.nbtSchemas.LegacyTerrain}
     */
    LegacyTerrain: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.LegacyTerrain.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns The parsed data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.LegacyTerrain {
            let currentOffset = 0;

            const block_ids: number[] = [...data.subarray(currentOffset, currentOffset + 32768)];
            currentOffset += 32768;

            function unpackNibbleArray(byteCount: number): Range<0, 15>[] {
                const slice = data.subarray(currentOffset, currentOffset + byteCount);
                currentOffset += byteCount;

                return [...slice].flatMap((n: number): number[] => [n >> 4, n & 0x0f]) as Range<0, 15>[];
            }

            const block_data: Range<0, 15>[] = unpackNibbleArray(16384);

            const sky_light: Range<0, 15>[] = unpackNibbleArray(16384);

            const block_light: Range<0, 15>[] = unpackNibbleArray(16384);

            const dirty_columns: number[] = [...data.subarray(currentOffset, currentOffset + 256)];
            currentOffset += 256;

            const grass_color: number[] = [...data.subarray(currentOffset, currentOffset + 1024)];
            currentOffset += 1024;

            return NBT.comp({
                block_ids: { type: "list", value: { type: "byte", value: block_ids } },
                block_data: { type: "list", value: { type: "byte", value: block_data } },
                sky_light: { type: "list", value: { type: "byte", value: sky_light } },
                block_light: { type: "list", value: { type: "byte", value: block_light } },
                dirty_columns: { type: "list", value: { type: "byte", value: dirty_columns } },
                grass_color: { type: "list", value: { type: "byte", value: grass_color } },
            } as const satisfies NBTSchemas.NBTSchemaTypes.LegacyTerrain["value"]);
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.LegacyTerrain): Buffer<ArrayBuffer> {
            function packNibbles(arr: number[]): number[] {
                return arr.reduce(
                    (p: number[], v: number, i: number): number[] => (i % 2 === 0 ? [...p, v & 0x0f] : [...p.slice(0, -1), (p.at(-1)! << 4) | (v & 0x0f)]),
                    []
                );
            }

            return Buffer.concat([
                Buffer.from(data.value.block_ids.value.value),
                Buffer.from(packNibbles(data.value.block_data.value.value)),
                Buffer.from(packNibbles(data.value.sky_light.value.value)),
                Buffer.from(packNibbles(data.value.block_light.value.value)),
                Buffer.from(data.value.dirty_columns.value.value),
                Buffer.from(data.value.grass_color.value.value),
            ]);
        },
        // TO-DO: Add a default value for this.
    },
    /**
     * A list of block entities associated with a chunk.
     *
     * @see {@link NBTSchemas.nbtSchemas.BlockEntity}
     */
    BlockEntity: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.BlockEntity.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns A promise that resolves with the parsed data.
         *
         * @throws {any} If an error occurs while parsing the data.
         */
        async parse(data: Buffer): Promise<{
            type: "compound";
            value: {
                blockEntities: {
                    type: "list";
                    value: { type: "compound"; value: NBTSchemas.NBTSchemaTypes.BlockEntity["value"][] };
                };
            };
        }> {
            const blockEntities: NBTSchemas.NBTSchemaTypes.BlockEntity["value"][] = [];
            let currentIndex: number = 0;
            while (currentIndex < data.length) {
                const result = await NBT.parse(data.subarray(currentIndex), "little");
                currentIndex += result.metadata.size;
                blockEntities.push(result.parsed.value as NBTSchemas.NBTSchemaTypes.BlockEntity["value"]);
            }
            return {
                type: "compound",
                value: {
                    blockEntities: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: blockEntities,
                        },
                    },
                },
            };
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
        serialize(data: {
            type: "compound";
            value: {
                blockEntities: {
                    type: "list";
                    value: { type: "compound"; value: NBTSchemas.NBTSchemaTypes.BlockEntity["value"][] };
                };
            };
        }): Buffer<ArrayBuffer> {
            const nbtData: Buffer[] = data.value.blockEntities.value.value.map(
                (blockEntity: NBTSchemas.NBTSchemaTypes.BlockEntity["value"]): Buffer =>
                    NBT.writeUncompressed({ name: "", type: "compound", value: blockEntity }, "little")
            );
            return Buffer.concat(nbtData);
        },
    },
    /**
     * A list of entities associated with a chunk.
     *
     * @deprecated No longer used.
     *
     * @todo Figure out what version this was deprecated in (it exists in v1.16.40 but not in 1.21.51).
     */
    Entity: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.Entity.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns A promise that resolves with the parsed data.
         *
         * @throws {any} If an error occurs while parsing the data.
         */
        async parse(data: Buffer): Promise<{
            type: "compound";
            value: {
                entities: {
                    type: "list";
                    value: { type: "compound"; value: NBTSchemas.NBTSchemaTypes.ActorPrefix["value"][] };
                };
            };
        }> {
            const entities: NBTSchemas.NBTSchemaTypes.ActorPrefix["value"][] = [];
            let currentIndex: number = 0;
            while (currentIndex < data.length) {
                const result = await NBT.parse(data.subarray(currentIndex), "little");
                currentIndex += result.metadata.size;
                entities.push(result.parsed.value as NBTSchemas.NBTSchemaTypes.ActorPrefix["value"]);
            }
            return {
                type: "compound",
                value: {
                    entities: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: entities,
                        },
                    },
                },
            };
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
        serialize(data: {
            type: "compound";
            value: {
                entities: {
                    type: "list";
                    value: { type: "compound"; value: NBTSchemas.NBTSchemaTypes.ActorPrefix["value"][] };
                };
            };
        }): Buffer<ArrayBuffer> {
            const nbtData: Buffer[] = data.value.entities.value.value.map(
                (entity: NBTSchemas.NBTSchemaTypes.ActorPrefix["value"]): Buffer =>
                    NBT.writeUncompressed({ name: "", type: "compound", value: entity }, "little")
            );
            return Buffer.concat(nbtData);
        },
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.PendingTicks}
     *
     * @todo Add a description for this.
     */
    PendingTicks: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        /**
         * The default value to use when initializing a new entry.
         *
         * @todo Add a link to the object with the default value once it is made.
         */
        get defaultValue(): Buffer<ArrayBuffer> {
            const result: Buffer<ArrayBuffer> = Buffer.from(
                NBT.writeUncompressed(
                    {
                        name: "",
                        type: "compound",
                        value: {
                            currentTick: {
                                type: "int",
                                value: 0,
                            },
                            tickList: {
                                type: "list",
                                value: {
                                    type: "compound",
                                    value: [
                                        {
                                            tileID: {
                                                type: "int",
                                                value: 0,
                                            },
                                            blockState: {
                                                type: "compound",
                                                value: {
                                                    name: {
                                                        type: "string",
                                                        value: "minecraft:air",
                                                    },
                                                    states: {
                                                        type: "compound",
                                                        value: {},
                                                    },
                                                    version: {
                                                        type: "int",
                                                        value: 0,
                                                    },
                                                },
                                            },
                                            time: {
                                                type: "long",
                                                value: toLongParts(0n),
                                            },
                                            x: {
                                                type: "int",
                                                value: 0,
                                            },
                                            y: {
                                                type: "int",
                                                value: 0,
                                            },
                                            z: {
                                                type: "int",
                                                value: 0,
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    } satisfies NBTSchemas.NBTSchemaTypes.PendingTicks & NBT.NBT,
                    "little"
                )
            );
            Object.defineProperty(this, "defaultValue", { value: result, configurable: true, enumerable: true, writable: false });
            return result;
        },
    },
    /**
     * @deprecated Only used in versions < 1.2.3.
     *
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     */
    LegacyBlockExtraData: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     */
    BiomeState: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * A value that indicates the finalization state of a chunk's data.
     *
     * Possible values:
     * - `0`: Unknown
     * - `1`: Unknown
     * - `2`: Unknown
     *
     * @todo Figure out the meanings of the values.
     */
    FinalizedState: {
        /**
         * The format type of the data.
         */
        type: "int",
        /**
         * How many bytes this integer is.
         */
        bytes: 4,
        /**
         * The endianness of the data.
         */
        format: "LE",
        /**
         * The signedness of the data.
         */
        signed: false,
        /**
         * The default value to use when initializing a new entry.
         *
         * Bytes:
         * ```json
         * [0,0,0,0]
         * ```
         */
        defaultValue: Buffer.from([0, 0, 0, 0]),
    },
    /**
     * @deprecated No longer used.
     *
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     */
    ConversionData: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     */
    BorderBlocks: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * Bounding boxes for structure spawns, such as a Nether Fortress or Pillager Outpost.
     *
     * @deprecated Replaced with {@link AABBVolumes} in either 1.21.120 or one of the 1.21.120 previews.
     *
     * @todo Figure out how to parse this.
     */
    HardcodedSpawners: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.RandomTicks}
     *
     * @todo Add a description for this.
     */
    RandomTicks: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        /**
         * The default value to use when initializing a new entry.
         *
         * @todo Add a link to the object with the default value once it is made.
         */
        get defaultValue(): Buffer<ArrayBuffer> {
            const result: Buffer<ArrayBuffer> = Buffer.from(
                NBT.writeUncompressed(
                    {
                        name: "",
                        type: "compound",
                        value: {
                            currentTick: {
                                type: "int",
                                value: 0,
                            },
                            tickList: {
                                type: "list",
                                value: {
                                    type: "compound",
                                    value: [
                                        {
                                            blockState: {
                                                type: "compound",
                                                value: {
                                                    name: {
                                                        type: "string",
                                                        value: "minecraft:air",
                                                    },
                                                    states: {
                                                        type: "compound",
                                                        value: {},
                                                    },
                                                    version: {
                                                        type: "int",
                                                        value: 0,
                                                    },
                                                },
                                            },
                                            time: {
                                                type: "long",
                                                value: toLongParts(0n),
                                            },
                                            x: {
                                                type: "int",
                                                value: 0,
                                            },
                                            y: {
                                                type: "int",
                                                value: 0,
                                            },
                                            z: {
                                                type: "int",
                                                value: 0,
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    } satisfies NBTSchemas.NBTSchemaTypes.RandomTicks & NBT.NBT,
                    "little"
                )
            );
            Object.defineProperty(this, "defaultValue", { value: result, configurable: true, enumerable: true, writable: false });
            return result;
        },
    },
    /**
     * The low segment of the 4 byte halves of the seed value used to generate the chunk.
     *
     * The low segment can also be found by reading the first 4 bytes of the seed as a little-endian signed integer when it is encoded as a little-endian 64-bit signed integer.
     *
     * @todo Check if this still exists (I have only seen it in a world from a 1.19.60.22 dev build).
     */
    GenerationSeed: {
        /**
         * The format type of the data.
         */
        type: "int",
        /**
         * How many bytes this integer is.
         */
        bytes: 4,
        /**
         * The endianness of the data.
         */
        format: "LE",
        /**
         * The signedness of the data.
         */
        signed: true,
    },
    /**
     * xxHash64 checksums of `SubChunkPrefix`, `BlockEntity`, `Entity`, and `Data2D` values.
     *
     * @deprecated Only used in versions < 1.18.0.
     *
     * @todo Figure out how to parse this.
     */
    Checksums: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @deprecated Unused.
     *
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     */
    GeneratedPreCavesAndCliffsBlending: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     */
    BlendingBiomeHeight: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * A hash which is the key in the `LevelChunkMetaDataDictionary` record
     * for the NBT metadata of this chunk. Seems like it might default to something dependent
     * on the current game or chunk version.
     *
     * @todo Figure out how to parse this.
     */
    MetaDataHash: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     */
    BlendingData: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     *
     * Seems to always be one byte with a value of `0x00`.
     */
    ActorDigestVersion: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * @deprecated Only used in versions < 1.16.100. Later versions use {@link entryContentTypeToFormatMap.Version}
     *
     * @todo Add a description for this.
     */
    LegacyVersion: {
        /**
         * The format type of the data.
         */
        type: "int",
        /**
         * How many bytes this integer is.
         */
        bytes: 1,
        /**
         * The endianness of the data.
         */
        format: "LE",
        /**
         * The signedness of the data.
         */
        signed: false,
    },
    /**
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.15.0 world.
     *
     * @todo Add a schema for this.
     * @todo Add a description for this.
     */
    MVillages: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * @deprecated It is unknown when this was removed.
     *
     * @todo Add a schema for this.
     * @todo Add a description for this.
     */
    Villages: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.VillageDwellers}
     *
     * @todo Add a description for this.
     */
    VillageDwellers: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.VillageInfo}
     *
     * @todo Add a description for this.
     */
    VillageInfo: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.VillagePOI}
     *
     * @todo Add a description for this.
     */
    VillagePOI: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.VillagePlayers}
     *
     * @todo Add a description for this.
     */
    VillagePlayers: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.VillageRaid}
     *
     * @todo Add a description for this.
     */
    VillageRaid: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * A player's data.
     *
     * @see {@link NBTSchemas.nbtSchemas.Player}
     */
    Player: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * A player's client data.
     *
     * This includes the key for the player's {@link entryContentTypeToFormatMap.Player | server data}, the player's Microsoft account ID, and the player's self-signed ID.
     *
     * @see {@link NBTSchemas.nbtSchemas.PlayerClient}
     */
    PlayerClient: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The data for an entity in the world.
     *
     * @see {@link NBTSchemas.nbtSchemas.ActorPrefix}
     */
    ActorPrefix: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * A list of entity IDs in a chunk.
     *
     * These IDs are the ones used in the entities' LevelDB keys.
     *
     * The IDs are 32-bit signed integers.
     */
    Digest: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.Digest.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns A promise that resolves with the parsed data.
         *
         * @throws {any} If an error occurs while parsing the data.
         */
        async parse(data: Buffer): Promise<NBTSchemas.NBTSchemaTypes.Digest> {
            const entityIds: [high: number, low: number][] = [];
            for (let i = 0; i < data.length; i += 8) {
                entityIds.push([data.readInt32LE(i), data.readInt32LE(i + 4)]);
            }
            return {
                type: "compound",
                value: {
                    entityIds: {
                        type: "list",
                        value: {
                            type: "long",
                            value: entityIds,
                        },
                    },
                },
            };
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         *
         * @throws {any} If an error occurs while parsing the data.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.Digest): Buffer<ArrayBuffer> {
            const rawData: Buffer<ArrayBuffer>[] = data.value.entityIds.value.value.map((entityIds: [high: number, low: number]): Buffer<ArrayBuffer> => {
                const buffer: Buffer<ArrayBuffer> = Buffer.alloc(8);
                buffer.writeInt32LE(entityIds[0], 0);
                buffer.writeInt32LE(entityIds[1], 4);
                return buffer;
            });
            return Buffer.concat(rawData);
        },
    },
    /**
     * The data for a map.
     *
     * This includes things such as location, image data, and decorations.
     *
     * @see {@link NBTSchemas.nbtSchemas.Map}
     */
    Map: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The content type of the `portals` LevelDB key, which stores portal data.
     *
     * @see {@link NBTSchemas.nbtSchemas.Portals}
     */
    Portals: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The content type of the `schedulerWT` LevelDB key, which stores wandering trader data.
     *
     * @see {@link NBTSchemas.nbtSchemas.SchedulerWT}
     */
    SchedulerWT: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * Date for a structure (the kind saved by a structure block or the [`/structure`](https://minecraft.wiki/w/Commands/structure) command).
     *
     * @see {@link NBTSchemas.nbtSchemas.StructureTemplate}
     */
    StructureTemplate: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "mcstructure",
    },
    /**
     * A ticking area, either from an entity or the [`/tickingarea`](https://minecraft.wiki/w/Commands/tickingarea) command.
     *
     * @see {@link NBTSchemas.nbtSchemas.TickingArea}
     */
    TickingArea: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * @deprecated Only used in versions < 1.5.0.
     *
     * @todo Add a description for this.
     */
    FlatWorldLayers: {
        /**
         * The format type of the data.
         */
        type: "ASCII",
    },
    /**
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.15.0 world.
     *
     * @todo Add a description for this.
     */
    LevelSpawnWasFixed: {
        /**
         * The format type of the data.
         */
        type: "UTF-8",
        /**
         * The default value to use when initializing a new entry.
         *
         * Value:
         * ```typescript
         * Buffer.from("True", "utf-8")
         * ```
         */
        defaultValue: Buffer.from("True", "utf-8"),
    },
    /**
     * Stores the location of a lodestone compass.
     *
     * @todo Add a schema for this.
     */
    PositionTrackingDB: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The last ID used for a lodestone compass.
     *
     * @todo Add a schema for this.
     */
    PositionTrackingLastId: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The scoreboard data (ex. from the [`/scoreboard`](https://minecraft.wiki/w/Commands/scoreboard) command).
     *
     * @see {@link NBTSchemas.nbtSchemas.Scoreboard}
     */
    Scoreboard: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The structure data of the Overworld dimension.
     *
     * This content type coexists with the {@link entryContentTypeToFormatMap.Overworld | Overworld} content type in some versions (such as v1.0.0.16 and v1.1.5.0).
     *
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.15.0 world.
     *
     * @see {@link NBTSchemas.nbtSchemas.LegacyOverworld}
     */
    LegacyOverworld: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The structure data of the Nether dimension.
     *
     * This content type coexists with the {@link entryContentTypeToFormatMap.Nether | Nether} content type in some versions (such as v1.0.0.16 and v1.1.5.0).
     *
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.15.0 world.
     *
     * @see {@link NBTSchemas.nbtSchemas.LegacyNether}
     */
    LegacyNether: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The structure data of the End dimension.
     *
     * This content type coexists with the {@link entryContentTypeToFormatMap.TheEnd | TheEnd} content type in some versions (such as v1.0.0.16 and v1.1.5.0).
     *
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.15.0 world.
     *
     * @see {@link NBTSchemas.nbtSchemas.LegacyTheEnd}
     */
    LegacyTheEnd: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The data of the Overworld dimension.
     *
     * @see {@link NBTSchemas.nbtSchemas.Overworld}
     */
    Overworld: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The data of the Nether dimension.
     *
     * @see {@link NBTSchemas.nbtSchemas.Nether}
     */
    Nether: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The data of the End dimension.
     *
     * @see {@link NBTSchemas.nbtSchemas.TheEnd}
     */
    TheEnd: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The content type of the `AutonomousEntities` LevelDB key, which stores a list of autonomous entities.
     *
     * @see {@link NBTSchemas.nbtSchemas.AutonomousEntities}
     *
     * @todo Add a better description for this, that includes what an autonomous entity is.
     */
    AutonomousEntities: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The content type of the `BiomeData` LevelDB key, which stores data for certain biome types.
     *
     * @see {@link NBTSchemas.nbtSchemas.BiomeData}
     */
    BiomeData: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The content type of the `BiomeIdsTable` LevelDB key, which stores the numeric ID mappings for custom biomes.
     *
     * @see {@link NBTSchemas.nbtSchemas.BiomeIdsTable}
     */
    BiomeIdsTable: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The content type of the `mobevents` LevelDB key, which stores what mob events are enabled or disabled.
     *
     * @see {@link NBTSchemas.nbtSchemas.MobEvents}
     */
    MobEvents: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        // TO-DO: Add a default value for this.
    },
    /**
     * The content type of the `level.dat` and `level.dat_old` files.
     *
     * This stores all the world settings.
     *
     * @see {@link NBTSchemas.nbtSchemas.LevelDat}
     */
    LevelDat: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.LevelDat.parse | parse} method.
         */
        resultType: "JSONNBT",
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns A promise that resolves with the parsed data.
         *
         * @throws {any} If an error occurs while parsing the data.
         */
        async parse(data: Buffer): Promise<NBTSchemas.NBTSchemaTypes.LevelDat> {
            return (await NBT.parse(data)).parsed;
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         *
         * @throws {TypeError} If {@link data} has a name property at the top level that is not of type string.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.LevelDat): Buffer<ArrayBuffer> {
            const nbtData: Buffer = NBT.writeUncompressed({ name: "", ...data }, "little");
            return Buffer.concat([Buffer.from("0A000000", "hex"), writeSpecificIntType(Buffer.alloc(4), BigInt(nbtData.length), 4, "LE", false), nbtData]);
        },
        /**
         * The default value to use when initializing a new entry.
         *
         * @todo Add a link to the object with the default level.dat value once it is made.
         */
        get defaultValue(): Buffer<ArrayBuffer> {
            // TO-DO: Add a full default level.dat value.
            const nbtData: Buffer = NBT.writeUncompressed(
                { name: "", type: "compound", value: {} } as /* @todo Remove this partial later. */ Partial<NBTSchemas.NBTSchemaTypes.LevelDat> & NBT.NBT,
                "little"
            );
            const result: Buffer<ArrayBuffer> = Buffer.concat([
                Buffer.from("0A000000", "hex"),
                writeSpecificIntType(Buffer.alloc(4), BigInt(nbtData.length), 4, "LE", false),
                nbtData,
            ]);
            Object.defineProperty(this, "defaultValue", { value: result, configurable: true, enumerable: true, writable: false });
            return result;
        },
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "dat",
    },
    /**
     * Bounding boxes for structures, including structure spawns (such as a Pillager Outpost)
     * and volumes where mobs cannot spawn through the normal biome-based means (such as
     * Trial Chambers).
     *
     * @todo Figure out how to parse this.
     */
    AABBVolumes: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * The content type of the `DynamicProperties` LevelDB key, which stores dynamic properties data for add-ons.
     *
     * @see {@link NBTSchemas.nbtSchemas.DynamicProperties}
     */
    DynamicProperties: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        /**
         * The default value to use when initializing a new entry.
         *
         * Value:
         * ```json
         * { "name": "", "type": "compound", "value": {} }
         * ```
         */
        defaultValue: NBT.writeUncompressed({ name: "", type: "compound", value: {} }, "little"),
    },
    /**
     * Stores the NBT metadata of all chunks. Maps the xxHash64 hash of NBT data
     * to that NBT data, so that each chunk need only store 8 bytes instead of the entire
     * NBT; most chunks have the same metadata.
     *
     * The first 4 bytes represent the number of entries as a 32-bit little-endian integer (it is unknown if it is signed or not).
     *
     * The first 4 bytes are followed by multiple chunks of data formatted as the 8 byte hash of the NBT data plus the NBT compound.
     *
     * ```
     * {BYTEx4}{BYTEx8}{NBTCompound}{BYTEx8}{NBTCompound}{BYTEx8}{NBTCompound}{BYTEx8}{NBTCompound}
     * ```
     */
    LevelChunkMetaDataDictionary: {
        /**
         * The format type of the data.
         */
        type: "custom",
        resultType: "JSONNBT",
        // TODO: Make an NBT schema for the `LevelChunkMetaDataDictionary` format and use it as the return type here.
        async parse(data: Buffer): Promise<NBTSchemas.NBTSchemaTypes.LevelChunkMetaDataDictionary> {
            const parsedData: NBTSchemas.NBTSchemaTypes.LevelChunkMetaDataDictionary["value"] = {};
            for (let i = 12; i < data.length; i += 8) {
                const hash = data.subarray(i - 8, i);
                // TODO: Figure out how to use parseUncompressed in this situation to make it sync while still being able to get the size offset.
                const parsed = await NBT.parse(data.subarray(i), "little");
                // parsedData.push([data.slice(i - 8, i), parsed]);
                parsedData[hash.toString("hex")] = parsed.parsed as unknown as NBTSchemas.NBTSchemaTypes.LevelChunkMetaDataDictionary["value"][string];
                i += parsed.metadata.size;
            }
            return { type: "compound", value: parsedData };
        },
        serialize(data: NBTSchemas.NBTSchemaTypes.LevelChunkMetaDataDictionary): Buffer<ArrayBuffer> {
            // TODO: Find a way to properly hash the NBT data, since the `xxhashjs` and `xxhash-wasm` modules don't match up with the hashes generated by the game.
            const entryCountBuffer: Buffer<ArrayBuffer> = Buffer.alloc(4);
            entryCountBuffer.writeUInt32LE(Object.keys(data.value).length, 0);
            const dataBuffers: Buffer[] = [entryCountBuffer];
            for (const [hashHex, value] of Object.entries(data.value)) {
                if (!/^[0-9a-f]{16}$/i.test(hashHex)) throw new TypeError(`Invalid hash: ${hashHex}`);
                const hash: Buffer<ArrayBuffer> = Buffer.from(hashHex, "hex");
                const nbtBuffer: Buffer = NBT.writeUncompressed({ name: "", ...value }, "little");
                dataBuffers.push(hash);
                dataBuffers.push(nbtBuffer);
            }
            return Buffer.concat(dataBuffers);
        },
    },
    /**
     * @todo Figure out how to parse this. (It seems that each one just has a value of 1 (`0x31`). It also seems that the data is actually based on the key, which has an id that can be used with the realms API to get the corresponding data.)
     * @todo Add a description for this.
     */
    RealmsStoriesData: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * The content type used for LevelDB keys that are used for the forced world corruption feature of the developer version of Bedrock Edition.
     *
     * These keys are normally only found when the [`/corruptworld`](https://minecraft.wiki/w/Commands/corruptworld) command is used.
     *
     * Removing these keys fixes the forced world corruption.
     */
    ForcedWorldCorruption: {
        /**
         * The format type of the data.
         */
        type: "UTF-8",
        /**
         * The default value to use when initializing a new entry.
         *
         * Value:
         * ```typescript
         * Buffer.from("true", "utf-8")
         * ```
         */
        defaultValue: Buffer.from("true", "utf-8"),
    },
    /**
     * @todo Add a schema for this.
     * @todo Add a description for this.
     */
    ChunkLoadedRequest: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        // TO-DO: Add a default value for this.
    },
    /**
     * All data that has a key that is not recognized.
     */
    Unknown: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
} as const satisfies {
    [key in DBEntryContentType]: EntryContentTypeFormatData;
};

/**
 * The format data for an entry content type.
 *
 * Use this type if you want to have support for content type formats that aren't currently is use but may be in the future.
 *
 * This is used in the {@link entryContentTypeToFormatMap} object.
 */
export type EntryContentTypeFormatData = (
    | {
          /**
           * The format type of the data.
           */
          readonly type: "JSON" | "SNBT" | "ASCII" | "binary" | "binaryPlainText" | "hex" | "UTF-8" | "unknown";
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "NBT";
          /**
           * The endianness of the data.
           *
           * If not present, `"LE"` should be assumed.
           *
           * - `"BE"`: Big Endian
           * - `"LE"`: Little Endian
           * - `"LEV"`: Little Varint
           *
           * @default "LE"
           */
          readonly format?: "BE" | "LE" | "LEV";
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "int";
          /**
           * How many bytes this integer is.
           */
          readonly bytes: number;
          /**
           * The endianness of the data.
           */
          readonly format: "BE" | "LE";
          /**
           * The signedness of the data.
           */
          readonly signed: boolean;
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "custom";
          /**
           * The format type that results from the {@link parse} method.
           */
          readonly resultType: "JSONNBT";
          /**
           * The function to parse the data.
           *
           * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
           *
           * @param data The data to parse, as a buffer.
           * @returns The parsed data.
           */
          parse(data: Buffer): NBT.Compound | Promise<NBT.Compound>;
          /**
           * The function to serialize the data.
           *
           * This result of this can be written directly to the file or LevelDB entry.
           *
           * @param data The data to serialize.
           * @returns The serialized data, as a buffer.
           */
          serialize(data: NBT.Compound): Buffer | Promise<Buffer>;
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "custom";
          /**
           * The format type that results from the {@link parse} method.
           */
          readonly resultType: "SNBT";
          /**
           * The function to parse the data.
           *
           * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
           *
           * @param data The data to parse, as a buffer.
           * @returns The parsed data.
           */
          parse(data: Buffer): string | Promise<string>;
          /**
           * The function to serialize the data.
           *
           * This result of this can be written directly to the file or LevelDB entry.
           *
           * @param data The data to serialize.
           * @returns The serialized data, as a buffer.
           */
          serialize(data: string): Buffer | Promise<Buffer>;
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "custom";
          /**
           * The format type that results from the {@link parse} method.
           */
          readonly resultType: "buffer";
          /**
           * The function to parse the data.
           *
           * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
           *
           * @param data The data to parse, as a buffer.
           * @returns The parsed data.
           */
          parse(data: Buffer): Buffer | Promise<Buffer>;
          /**
           * The function to serialize the data.
           *
           * This result of this can be written directly to the file or LevelDB entry.
           *
           * @param data The data to serialize.
           * @returns The serialized data, as a buffer.
           */
          serialize(data: Buffer): Buffer | Promise<Buffer>;
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "custom";
          /**
           * The format type that results from the {@link parse} method.
           */
          readonly resultType: "unknown";
          /**
           * The function to parse the data.
           *
           * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
           *
           * @param data The data to parse, as a buffer.
           * @returns The parsed data.
           */
          parse(data: Buffer): any | Promise<any>;
          /**
           * The function to serialize the data.
           *
           * This result of this can be written directly to the file or LevelDB entry.
           *
           * @param data The data to serialize.
           * @returns The serialized data, as a buffer.
           */
          serialize(data: any): Buffer | Promise<Buffer>;
      }
) & {
    /**
     * The raw file extension of the data.
     *
     * If not present, `"bin"` should be assumed.
     *
     * @default "bin"
     */
    readonly rawFileExtension?: string;
    /**
     * The default value to use when initializing a new entry.
     *
     * @default undefined
     */
    readonly defaultValue?: Buffer;
};

//#endregion

// --------------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------------

//#region Types

/**
 * Represents a two-directional vector.
 */
export interface Vector2 {
    /**
     * X component of this vector.
     */
    x: number;
    /**
     * Y component of this vector.
     */
    y: number;
}

/**
 * Represents a two-directional vector with X and Z components.
 */
export interface VectorXZ {
    /**
     * X component of this vector.
     */
    x: number;
    /**
     * Z component of this vector.
     */
    z: number;
}

/**
 * Represents a three-directional vector.
 */
export interface Vector3 {
    /**
     * X component of this vector.
     */
    x: number;
    /**
     * Y component of this vector.
     */
    y: number;
    /**
     * Z component of this vector.
     */
    z: number;
}

/**
 * An ID of a Minecraft dimension.
 */
export type Dimension = (typeof dimensions)[number];

/**
 * Represents a three-directional vector with an associated dimension.
 */
export interface DimensionLocation extends Vector3 {
    /**
     * Dimension that this coordinate is associated with.
     */
    dimension: Dimension;
}

/**
 * Represents a two-directional vector with an associated dimension.
 */
export interface DimensionVector2 extends Vector2 {
    /**
     * Dimension that this coordinate is associated with.
     */
    dimension: Dimension;
}

/**
 * Represents a two-directional vector with X and Z components and an associated dimension.
 */
export interface DimensionVectorXZ extends VectorXZ {
    /**
     * Dimension that this coordinate is associated with.
     */
    dimension: Dimension;
}

/**
 * Represents a two-directional vector with X and Z components and an associated dimension and a sub-chunk index.
 */
export interface SubChunkIndexDimensionVectorXZ extends DimensionVectorXZ {
    /**
     * The index of this sub-chunk.
     *
     * Should be between 0 and 15 (inclusive).
     */
    subChunkIndex: number;
}

/**
 * @todo
 */
export interface StructureSectionData extends NBT.Compound {
    /**
     * The size of the structure, as a tuple of 3 integers.
     */
    size: NBTSchemas.NBTSchemaTypes.StructureTemplate["value"]["size"];
    /**
     * The block indices.
     *
     * These are two arrays of indices in the block palette.
     *
     * The first layer is the block layer.
     *
     * The second layer is the waterlog layer, even though it is mainly used for waterlogging, other blocks can be put here to,
     * which allows for putting two blocks in the same location, or creating ghost blocks (as blocks in this layer cannot be interacted with,
     * however when the corresponding block in the block layer is broken, this block gets moved to the block layer).
     */
    block_indices: {
        type: `${NBT.TagType.List}`;
        value: {
            type: `${NBT.TagType.List}`;
            value: [
                blockLayer: {
                    type: `${NBT.TagType.Int}`;
                    value: number[];
                },
                waterlogLayer: {
                    type: `${NBT.TagType.Int}`;
                    value: number[];
                },
            ];
        };
    };
    /**
     * The block palette.
     */
    palette: {
        type: `${NBT.TagType.List}`;
        value: {
            type: `${NBT.TagType.Compound}`;
            value: NBTSchemas.NBTSchemaTypes.Block["value"][];
        };
    };
}

/**
 * Biome palette data.
 */
export interface BiomePalette {
    /**
     * The data for the individual blocks, or `null` if this sub-chunk has no biome data.
     *
     * The values of this map to the index of the biome in the palette.
     */
    values: number[] | null;
    /**
     * The palette of biomes as a list of biome numeric IDs.
     */
    palette: number[];
}

/**
 * The content type of a LevelDB entry.
 */
export type DBEntryContentType = (typeof DBEntryContentTypes)[number];

/**
 * A content type of a LevelDB chunk key entry.
 */
export type DBChunkKeyEntryContentType =
    | "Data3D"
    | "Version"
    | "Data2D"
    | "Data2DLegacy"
    | "SubChunkPrefix"
    | "LegacyTerrain"
    | "BlockEntity"
    | "Entity"
    | "PendingTicks"
    | "LegacyBlockExtraData"
    | "BiomeState"
    | "FinalizedState"
    | "ConversionData"
    | "BorderBlocks"
    | "HardcodedSpawners"
    | "RandomTicks"
    | "Checksums"
    | "GenerationSeed"
    | "GeneratedPreCavesAndCliffsBlending"
    | "BlendingBiomeHeight"
    | "MetaDataHash"
    | "BlendingData"
    | "ActorDigestVersion"
    | "LegacyVersion"
    | "AABBVolumes";

/**
 * The a grouping type of LevelDB entry content types.
 */
export type DBEntryContentTypeGroup = (typeof DBEntryContentTypesGrouping)[DBEntryContentType];

//#endregion

// --------------------------------------------------------------------------------
// Functions
// --------------------------------------------------------------------------------

//#region Functions

/**
 * Parses an integer from a buffer gives the number of bytes, endianness, signedness and offset.
 *
 * @param buffer The buffer to read from.
 * @param bytes The number of bytes to read.
 * @param format The endianness of the data.
 * @param signed The signedness of the data. Defaults to `false`.
 * @param offset The offset to read from. Defaults to `0`.
 * @returns The parsed integer.
 *
 * @throws {RangeError} If the byte length is less than 1.
 * @throws {RangeError} If the buffer does not contain enough data at the specified offset.
 */
export function parseSpecificIntType(buffer: Buffer, bytes: number, format: "BE" | "LE", signed: boolean = false, offset: number = 0): bigint {
    if (bytes < 1) {
        throw new RangeError("Byte length must be at least 1");
    }
    if (offset + bytes > buffer.length) {
        throw new RangeError("Buffer does not contain enough data at the specified offset");
    }

    let result: bigint = 0n;

    if (format === "BE") {
        for (let i: number = 0; i < bytes; i++) {
            result = (result << 8n) | BigInt(buffer[offset + i]!);
        }
    } else {
        for (let i: number = bytes - 1; i >= 0; i--) {
            result = (result << 8n) | BigInt(buffer[offset + i]!);
        }
    }

    if (signed) {
        const signBit: bigint = 1n << BigInt(bytes * 8 - 1);
        if (result & signBit) {
            result -= 1n << BigInt(bytes * 8);
        }
    }

    return result;
}

/**
 * Options for {@link writeSpecificIntType}.
 */
export interface WriteSpecificIntTypeOptions {
    /**
     * Whether to wrap the value if it is out of range.
     *
     * If `false`, an error will be thrown if the value is out of range.
     *
     * @default false
     */
    wrap?: boolean;
}

/**
 * Writes an integer to a buffer.
 *
 * @template TArrayBuffer The type of the buffer.
 * @param buffer The buffer to write to.
 * @param value The integer to write.
 * @param bytes The number of bytes to write.
 * @param format The endianness of the data.
 * @param signed The signedness of the data. Defaults to `false`.
 * @param offset The offset to write to. Defaults to `0`.
 * @param options The options to use.
 * @returns The buffer from the {@link buffer} parameter.
 *
 * @throws {RangeError} If the byte length is less than 1.
 * @throws {RangeError} If the buffer does not have enough space at the specified offset.
 * @throws {RangeError} If the value is out of range and {@link WriteSpecificIntTypeOptions.wrap | options.wrap} is `false`.
 */
export function writeSpecificIntType<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>(
    buffer: Buffer<TArrayBuffer>,
    value: bigint,
    bytes: number,
    format: "BE" | "LE",
    signed: boolean = false,
    offset: number = 0,
    options?: WriteSpecificIntTypeOptions
): Buffer<TArrayBuffer> {
    if (bytes < 1) {
        throw new RangeError("Byte length must be at least 1");
    }
    if (offset + bytes > buffer.length) {
        throw new RangeError("Buffer does not have enough space at the specified offset");
    }

    const bitSize: bigint = BigInt(bytes * 8);
    const maxUnsigned: bigint = (1n << bitSize) - 1n;
    const minSigned: bigint = -(1n << (bitSize - 1n));
    const maxSigned: bigint = (1n << (bitSize - 1n)) - 1n;

    if (signed) {
        if (value < minSigned || value > maxSigned) {
            if (options?.wrap) {
                value = (value + (1n << bitSize)) % (1n << bitSize);
            } else {
                throw new RangeError(`Signed value out of range for ${bytes} bytes`);
            }
        }
        if (value < 0n) {
            value += 1n << bitSize;
        }
    } else {
        if (value < 0n || value > maxUnsigned) {
            if (options?.wrap) {
                value = value % (1n << bitSize);
            } else {
                throw new RangeError(`Unsigned value out of range for ${bytes} bytes`);
            }
        }
    }

    for (let i: number = 0; i < bytes; i++) {
        const shift: bigint = format === "BE" ? BigInt((bytes - 1 - i) * 8) : BigInt(i * 8);
        buffer[offset + i] = Number((value >> shift) & 0xffn);
    }

    return buffer;
}

/**
 * Sanitizes a filename.
 *
 * @param filename The filename to sanitize.
 * @returns The sanitized filename.
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replaceAll(fileNameCharacterFilterRegExp, /* (substring: string): string => encodeURIComponent(substring) */ "")
        .replaceAll(fileNameEncodeCharacterRegExp, (substring: string): string => encodeURIComponent(substring));
}

/**
 * Sanitizes a display key.
 *
 * @param key The key to sanitize.
 * @returns The sanitized key.
 */
export function sanitizeDisplayKey(key: string): string {
    return key.replaceAll(/[^a-zA-Z0-9-_+,-.;=@~/:>?\\]/g, (substring: string): string => encodeURIComponent(substring) /* "" */);
}

/**
 * Converts a chunk block index to an offset from the minimum corner of the chunk.
 *
 * @param index The chunk block index.
 * @returns The offset from the minimum corner of the chunk.
 */
export function chunkBlockIndexToOffset(index: number): Vector3 {
    return {
        x: (index >> 8) & 0xf,
        y: (index >> 0) & 0xf,
        z: (index >> 4) & 0xf,
    };
}

/**
 * Converts an offset from the minimum corner of the chunk to a chunk block index.
 *
 * @param offset The offset from the minimum corner of the chunk.
 * @returns The chunk block index.
 */
export function offsetToChunkBlockIndex(offset: Vector3): number {
    return ((offset.x & 0xf) << 8) | (offset.y & 0xf) | ((offset.z & 0xf) << 4);
}

/**
 * Reads a 32-bit integer value from a Buffer at the given offset (little-endian).
 *
 * @param data The Buffer to read from.
 * @param offset The offset to read from.
 * @returns The 32-bit integer value.
 */
export function getInt32Val(data: Buffer, offset: number): number {
    let retval: number = 0;
    // need to switch this to union based like the others.
    for (let i: number = 0; i < 4; i++) {
        // if I don't do the static cast, the top bit will be sign extended.
        retval |= data[offset + i]! << (i * 8);
    }
    return retval;
}

/**
 * Writes a 32-bit integer value into a Buffer at the given offset (little-endian).
 *
 * @param buffer The Buffer to write into.
 * @param offset The offset to write into.
 * @param value The 32-bit integer value to write.
 */
export function setInt32Val(buffer: Buffer, offset: number, value: number): void {
    for (let i: number = 0; i < 4; i++) {
        buffer[offset + i] = (value >> (i * 8)) & 0xff;
    }
}

/**
 * Splits a range into smaller ranges of a given size.
 *
 * @param param0 The range to split.
 * @param size The size of each range.
 * @returns The split ranges.
 */
export function splitRange([min, max]: [min: number, max: number], size: number): [from: number, to: number][] {
    const result: [from: number, to: number][] = [];
    let start: number = min;

    while (start <= max) {
        const end: number = Math.min(start + size - 1, max);
        result.push([start, end]);
        start = end + 1;
    }

    return result;
}

/**
 * Packs block indices into the buffer using the same scheme as the read loop.
 *
 * @param buffer The buffer to write into.
 * @param blockDataOffset The offset where block data begins in the buffer.
 * @param block_indices The list of block indices to pack.
 * @param bitsPerBlock The number of bits used per block.
 * @param blocksPerWord How many blocks fit inside one 32-bit integer.
 */
export function writeBlockIndices(buffer: Buffer, blockDataOffset: number, block_indices: number[], bitsPerBlock: number, blocksPerWord: number): void {
    const wordCount: number = Math.ceil(block_indices.length / blocksPerWord);

    for (let wordIndex: number = 0; wordIndex < wordCount; wordIndex++) {
        let maskVal: number = 0;

        for (let j: number = 0; j < blocksPerWord; j++) {
            const blockIndex: number = wordIndex * blocksPerWord + j;
            if (blockIndex >= block_indices.length) break;

            const blockVal: number = block_indices[blockIndex]!;
            const shiftAmount: number = j * bitsPerBlock;
            maskVal |= blockVal /*  & ((1 << bitsPerBlock) - 1) */ << shiftAmount;
        }

        setInt32Val(buffer, blockDataOffset + wordIndex * 4, maskVal);
    }
}

/**
 * Gets the chunk indices from a LevelDB key.
 *
 * The key must be a [chunk key](https://minecraft.wiki/w/Bedrock_Edition_level_format#Chunk_key_format).
 *
 * @param key The key to get the chunk indices for, as a Buffer.
 * @returns The chunk indices.
 */
export function getChunkKeyIndices(key: Buffer): SubChunkIndexDimensionVectorXZ | DimensionVectorXZ {
    return {
        x: getInt32Val(key, 0),
        z: getInt32Val(key, 4),
        dimension: [13, 14].includes(key.length) ? (dimensions[getInt32Val(key, 8)] ?? "overworld") : "overworld",
        ...([10, 14].includes(key.length) ? { subChunkIndex: (key.at(-1)! << 24) >> 24 } : undefined),
    };
}

/**
 * Generates a raw chunk key from chunk indices.
 *
 * @param indices The chunk indices.
 * @param chunkKeyType The chunk key type.
 * @returns The raw chunk key.
 */
export function generateChunkKeyFromIndices(
    indices: SubChunkIndexDimensionVectorXZ | DimensionVectorXZ,
    chunkKeyType: DBChunkKeyEntryContentType
): Buffer<ArrayBuffer> {
    const buffer: Buffer<ArrayBuffer> = Buffer.alloc(
        (indices.dimension === "overworld" ? 9 : 13) + +("subChunkIndex" in indices && indices.subChunkIndex !== undefined)
    );
    setInt32Val(buffer, 0, indices.x);
    setInt32Val(buffer, 4, indices.z);
    if (indices.dimension !== "overworld") setInt32Val(buffer, 8, dimensions.indexOf(indices.dimension) ?? 0);
    buffer[8 + +(indices.dimension !== "overworld") * 4] = getIntFromChunkKeyType(chunkKeyType);
    if ("subChunkIndex" in indices && indices.subChunkIndex !== undefined) buffer[9 + +(indices.dimension !== "overworld") * 4] = indices.subChunkIndex;
    return buffer;
}

/**
 * Converts a chunk key type to the integer value that represents it.
 *
 * @param chunkKeyType The chunk key type.
 * @returns The integer value.
 */
function getIntFromChunkKeyType(chunkKeyType: DBChunkKeyEntryContentType): number {
    switch (chunkKeyType) {
        case "Data3D":
            return 0x2b;
        case "Version":
            return 0x2c;
        case "Data2D":
            return 0x2d;
        case "Data2DLegacy":
            return 0x2e;
        case "SubChunkPrefix":
            return 0x2f;
        case "LegacyTerrain":
            return 0x30;
        case "BlockEntity":
            return 0x31;
        case "Entity":
            return 0x32;
        case "PendingTicks":
            return 0x33;
        case "LegacyBlockExtraData":
            return 0x34;
        case "BiomeState":
            return 0x35;
        case "FinalizedState":
            return 0x36;
        case "ConversionData":
            return 0x37;
        case "BorderBlocks":
            return 0x38;
        case "HardcodedSpawners":
            return 0x39;
        case "RandomTicks":
            return 0x3a;
        case "Checksums":
            return 0x3b;
        case "GenerationSeed":
            return 0x3c;
        case "GeneratedPreCavesAndCliffsBlending":
            return 0x3d;
        case "BlendingBiomeHeight":
            return 0x3e;
        case "MetaDataHash":
            return 0x3f;
        case "BlendingData":
            return 0x40;
        case "ActorDigestVersion":
            return 0x41;
        case "LegacyVersion":
            return 0x76;
        case "AABBVolumes":
            return 0x77;
    }
}

/**
 * Gets a human-readable version of a LevelDB key.
 *
 * @param key The key to get the display name for, as a Buffer.
 * @returns A human-readable version of the key.
 */
export function getKeyDisplayName(key: Buffer): string {
    const contentType: DBEntryContentType = getContentTypeFromDBKey(key);
    switch (contentType) {
        case "Data3D":
        case "Version":
        case "Data2D":
        case "Data2DLegacy":
        case "SubChunkPrefix":
        case "LegacyTerrain":
        case "BlockEntity":
        case "Entity":
        case "PendingTicks":
        case "LegacyBlockExtraData":
        case "BiomeState":
        case "FinalizedState":
        case "ConversionData":
        case "BorderBlocks":
        case "HardcodedSpawners":
        case "RandomTicks":
        case "Checksums":
        case "GenerationSeed":
        case "GeneratedPreCavesAndCliffsBlending":
        case "BlendingBiomeHeight":
        case "MetaDataHash":
        case "BlendingData":
        case "ActorDigestVersion":
        case "LegacyVersion":
        case "AABBVolumes": {
            const indices: SubChunkIndexDimensionVectorXZ | DimensionVectorXZ = getChunkKeyIndices(key);
            return `${indices.dimension}_${indices.x}_${indices.z}${
                "subChunkIndex" in indices && indices.subChunkIndex !== undefined ? `_${indices.subChunkIndex}` : ""
            }_${contentType}`;
        }
        case "Digest": {
            const indices: DimensionVectorXZ = getChunkKeyIndices(key.subarray(4));
            return `digp_${indices.dimension}_${indices.x}_${indices.z}`;
        }
        case "ActorPrefix": {
            return `actorprefix_${getInt32Val(key, key.length - 8)}_${getInt32Val(key, key.length - 4)}`;
        }
        case "AutonomousEntities":
        case "BiomeData":
        case "BiomeIdsTable":
        case "ChunkLoadedRequest":
        case "Overworld":
        case "Nether":
        case "TheEnd":
        case "DynamicProperties":
        case "FlatWorldLayers":
        case "ForcedWorldCorruption":
        case "LegacyOverworld":
        case "LegacyNether":
        case "LegacyTheEnd":
        case "LevelChunkMetaDataDictionary":
        case "LevelDat":
        case "LevelSpawnWasFixed":
        case "PositionTrackingDB":
        case "PositionTrackingLastId":
        case "Map":
        case "MobEvents":
        case "MVillages":
        case "Player":
        case "PlayerClient":
        case "Portals":
        case "RealmsStoriesData":
        case "SchedulerWT":
        case "Scoreboard":
        case "StructureTemplate":
        case "TickingArea":
        case "VillageDwellers":
        case "VillageInfo":
        case "VillagePOI":
        case "VillagePlayers":
        case "VillageRaid":
        case "Villages":
        case "Unknown":
        default:
            return key.toString("binary");
    }
}

/**
 * Gets the content type of a LevelDB key.
 *
 * @param key The key to get the content type for, as a Buffer.
 * @returns The content type of the key.
 */
export function getContentTypeFromDBKey(key: Buffer): DBEntryContentType {
    if ([9, 10, 13, 14].includes(key.length)) {
        switch (key.at([10, 14].includes(key.length) ? -2 : -1)) {
            case 0x2b:
                return "Data3D";
            case 0x2c:
                return "Version";
            case 0x2d:
                return "Data2D";
            case 0x2e:
                return "Data2DLegacy";
            case 0x2f:
                return "SubChunkPrefix";
            case 0x30:
                return "LegacyTerrain";
            case 0x31:
                return "BlockEntity";
            case 0x32:
                return "Entity";
            case 0x33:
                return "PendingTicks";
            case 0x34:
                return "LegacyBlockExtraData";
            case 0x35:
                return "BiomeState";
            case 0x36:
                return "FinalizedState";
            case 0x37:
                return "ConversionData";
            case 0x38:
                return "BorderBlocks";
            case 0x39:
                return "HardcodedSpawners";
            case 0x3a:
                return "RandomTicks";
            case 0x3b:
                return "Checksums";
            case 0x3c:
                return "GenerationSeed";
            case 0x3d:
                return "GeneratedPreCavesAndCliffsBlending";
            case 0x3e:
                return "BlendingBiomeHeight";
            case 0x3f:
                return "MetaDataHash";
            case 0x40:
                return "BlendingData";
            case 0x41:
                return "ActorDigestVersion";
            case 0x76:
                return "LegacyVersion";
            case 0x77:
                return "AABBVolumes";
        }
    }
    const stringKey: string = key.toString();
    switch (stringKey) {
        case "~local_player":
            return "Player";
        case "game_flatworldlayers":
            return "FlatWorldLayers";
        case "Overworld":
            return "Overworld";
        case "Nether":
            return "Nether";
        case "TheEnd":
            return "TheEnd";
        case "mobevents":
            return "MobEvents";
        case "BiomeData":
            return "BiomeData";
        case "BiomeIdsTable":
            return "BiomeIdsTable";
        case "AutonomousEntities":
            return "AutonomousEntities";
        case "PositionTrackDB-LastId":
            return "PositionTrackingLastId";
        case "scoreboard":
            return "Scoreboard";
        case "schedulerWT":
            return "SchedulerWT";
        case "portals":
            return "Portals";
        case "DynamicProperties":
            return "DynamicProperties";
        case "LevelChunkMetaDataDictionary":
            return "LevelChunkMetaDataDictionary";
        case "SST_SALOG":
        case "SST_WORD":
        case "SST_WORD_":
        case "DedicatedServerForcedCorruption":
            return "ForcedWorldCorruption";
        case "dimension0":
            return "LegacyOverworld";
        case "dimension1":
            return "LegacyNether";
        case "dimension2":
            return "LegacyTheEnd";
        case "mVillages":
            return "MVillages";
        case "villages":
            return "Villages";
        case "LevelSpawnWasFixed":
            return "LevelSpawnWasFixed";
    }
    switch (true) {
        case stringKey.startsWith("PosTrackDB-0x"):
            return "PositionTrackingDB";
        case stringKey.startsWith("actorprefix"):
            return "ActorPrefix";
        case stringKey.startsWith("structuretemplate"):
            return "StructureTemplate";
        case stringKey.startsWith("tickingarea"):
            return "TickingArea";
        case stringKey.startsWith("portals"):
            return "Portals";
        case stringKey.startsWith("map_"):
            return "Map";
        case stringKey.startsWith("player_server_"):
            return "Player";
        case stringKey.startsWith("player_"):
            return "PlayerClient";
        case stringKey.startsWith("digp"):
            return "Digest";
        case /^chunk_loaded_request_(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr])_\d+$/.test(stringKey):
            return "ChunkLoadedRequest";
        case stringKey.startsWith("RealmsStoriesData_"):
            return "RealmsStoriesData";
        case /^VILLAGE_(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr])_[0-9a-f\\-]+_POI$/.test(stringKey):
            return "VillagePOI";
        case /^VILLAGE_(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr])_[0-9a-f\\-]+_INFO$/.test(stringKey):
            return "VillageInfo";
        case /^VILLAGE_(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr])_[0-9a-f\\-]+_DWELLERS$/.test(stringKey):
            return "VillageDwellers";
        case /^VILLAGE_(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr])_[0-9a-f\\-]+_PLAYERS$/.test(stringKey):
            return "VillagePlayers";
        case /^VILLAGE_(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr])_[0-9a-f\\-]+_RAID$/.test(stringKey):
            return "VillageRaid";
    }
    return "Unknown";
}

/**
 * Gets the biome type from its ID.
 *
 * Only works with vanilla biomes.
 *
 * @param id The ID of the biome.
 * @returns The biome type.
 */
export function getBiomeTypeFromID(id: number): keyof (typeof BiomeData)["int_map"] | undefined {
    return (Object.keys(BiomeData.int_map) as (keyof (typeof BiomeData)["int_map"])[]).find(
        (key: keyof (typeof BiomeData)["int_map"]): boolean => BiomeData.int_map[key] === id
    );
}

/**
 * Gets the biome ID from its type.
 *
 * Only works with vanilla biomes.
 *
 * @param type The type of the biome.
 * @returns The biome ID.
 */
export function getBiomeIDFromType(type: keyof (typeof BiomeData)["int_map"]): number | undefined {
    return BiomeData.int_map[type];
}

//#endregion

// --------------------------------------------------------------------------------
// Classes
// --------------------------------------------------------------------------------

//#region Classes

/**
 * @todo
 */
export class Structure {
    /**
     * @todo
     */
    public target?:
        | {
              /**
               * The type of the target structure data.
               */
              type: "LevelDBEntry";
              /**
               * The LevelDB containing the target structure data.
               */
              db: LevelDB;
              /**
               * The key of the target structure data in the LevelDB.
               */
              key: Buffer;
          }
        | {
              /**
               * The type of the target structure data.
               */
              type: "File";
              /**
               * The absolute path to the target structure data.
               */
              path: string;
          }
        | undefined;
    /**
     * @todo
     */
    public constructor(options: { target?: Structure["target"] }) {
        this.target = options.target;
    }
    /**
     * @todo
     */
    public fillBlocks(from: Vector3, to: Vector3, block: NBTSchemas.NBTSchemaTypes.Block): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public saveChanges(): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public delete(): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public expand(min: Vector3, max: Vector3): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public shrink(min: Vector3, max: Vector3): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public move(min: Vector3, max: Vector3): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public scale(scale: Vector3 | number): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public rotate(angle: 0 | 90 | 180 | 270, axis: "x" | "y" | "z" = "y"): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public mirror(axis: "x" | "y" | "z"): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public clear(): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public clearSectionData(from: Vector3, to: Vector3): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public getSectionData(from: Vector3, to: Vector3): StructureSectionData {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public replaceSectionData(offset: Vector3, data: StructureSectionData, options: StructureReplaceSectionDataOptions = {}): any {
        throw new Error("Method not implemented.");
    }
    /**
     * @todo
     */
    public exportPrismarineNBT(): NBTSchemas.NBTSchemaTypes.StructureTemplate {
        throw new Error("Method not implemented.");
    }
}

/**
 * Options for {@link Structure.replaceSectionData}.
 */
export interface StructureReplaceSectionDataOptions {
    /**
     * Whether to automatically expand the structure to fit the data if necessary, instead of cropping it.
     *
     * @default false
     */
    autoExpand?: boolean;
}

//#endregion
