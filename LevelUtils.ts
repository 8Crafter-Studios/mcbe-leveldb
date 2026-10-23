import NBT from "prismarine-nbt";
import BiomeData from "./__biome_data__.ts";
import type { LevelDB } from "@8crafter/leveldb-zlib";
import type { NBTSchemas } from "./nbtSchemas.ts";
import type { LooseAutocomplete, Range } from "./types.js";
import { toLong, toLongParts } from "./SNBTUtils.ts";
import { __NBT_LE_binary_string_encoding_proto_defs__ } from "./__nbt_le_bin_str_proto_defs__.ts";
import protodef from "protodef";
import { decode, encode } from "iconv-lite";
import type { TupleOf } from "type-fest";

// FIXME (Important): Check all the areas that assume the length to be stored as a single byte, and make sure that they don't actually use the same length storage method as the POI data, also see if strings actually use that method too.

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
    const buf: Buffer<ArrayBuffer> = Buffer.alloc(2);
    buf.writeInt16LE(value, 0);
    return buf;
}

function writeInt32LE(value: number): Buffer<ArrayBuffer> {
    const buf: Buffer<ArrayBuffer> = Buffer.alloc(4);
    buf.writeInt32LE(value, 0);
    return buf;
}

function writeUInt32LE(value: number): Buffer<ArrayBuffer> {
    const buf: Buffer<ArrayBuffer> = Buffer.alloc(4);
    buf.writeUInt32LE(value, 0);
    return buf;
}

/**
 * The result of the {@link readLittleVarint} function.
 */
interface ReadLittleVarintResult {
    /**
     * The numeric value of the varint.
     */
    value: number;
    /**
     * The new offset in the buffer after the varint.
     */
    offset: number;
}

/**
 * Reads a little-endian varint from a buffer.
 *
 * @param buf The buffer or to read from.
 * @param offset The offset to start reading from.
 * @returns The varint value and the new offset.
 */
function readLittleVarint(buf: Uint8Array, offset: number): ReadLittleVarintResult {
    let value = 0;
    let i = 0;
    do {
        const byte: number = buf[offset + i]!;
        if ((byte & 0b10000000) !== 0) {
            value |= (byte & 0b01111111) << (7 * i++);
            continue;
        } else {
            value |= byte << (7 * i++);
            break;
        }
    } while (offset + i < buf.length);
    return {
        value,
        offset: offset + i,
    };
}

/**
 * Writes a little-endian varint and returns the bytes.
 *
 * @param value The value to write.
 * @returns The bytes.
 */
function writeLittleVarint(value: number): number[] {
    const bytes: number[] = [];
    do {
        let byte = value & 0b01111111;
        value >>>= 7;

        if (value !== 0) {
            byte |= 0b10000000;
        }

        bytes.push(byte);
    } while (value !== 0);
    return bytes;
}

/**
 * The result of the {@link readVarString} function.
 */
interface ReadVarStringResult {
    /**
     * The string value of the VarString.
     */
    value: string;
    /**
     * The new offset in the buffer after the string.
     */
    offset: number;
}

/**
 * Reads a string that uses a varint to store its length from a buffer.
 *
 * @param buf The buffer to read from.
 * @param offset The offset to start reading from.
 * @param encoding The encoding to use. Defaults to `"utf8"`.
 * @returns The string and the new offset.
 *
 * @throws {Error} If the string is incomplete.
 */
function readVarString(buf: Buffer<ArrayBufferLike>, offset: number, encoding: BufferEncoding = "utf8"): ReadVarStringResult {
    const { value, offset: newOffset } = readLittleVarint(buf, offset);
    if (buf.length < newOffset + value) {
        throw new Error(
            `Incomplete VarString data at offset ${newOffset}: Expected ${value} bytes, got ${buf.length - newOffset} bytes; Extracted string: ${JSON.stringify(buf.toString(encoding, newOffset, newOffset + value))}`
        );
    }
    return {
        value: buf.toString(encoding, newOffset, newOffset + value),
        offset: newOffset + value,
    };
}

/**
 * Writes a string that uses a varint to store its length.
 *
 * @param value The string to write.
 * @param encoding The encoding to use. Defaults to `"utf8"`.
 * @returns The buffer.
 */
function writeVarString(value: string, encoding: BufferEncoding = "utf8"): Buffer<ArrayBuffer> {
    const strBuffer: Buffer<ArrayBuffer> = Buffer.from(value, encoding);
    return Buffer.concat([Buffer.from(writeLittleVarint(strBuffer.byteLength)), strBuffer]);
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
    // REVIEW: Maybe this should be removed.
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
        if (!bb || bb.values === null /* || bb.values.length === 0 */) continue; // NULL case in R
        const { values, palette } = bb;

        // --- Write subchunk palette ids (bitpacked) ---
        const idsBuf: Buffer<ArrayBuffer> = writeSubchunkPaletteIds(values!, palette.length);

        // --- Don't write palette length if the palette is empty ---
        if (!palette.length) {
            buffers.push(idsBuf);
            continue;
        }

        if (palette.length === 1 && palette[0] !== undefined && idsBuf.length === 1 && (idsBuf[0] === 0 || idsBuf[0] === 1)) {
            buffers.push(idsBuf, writeInt32LE(palette[0]!));
            continue;
        }

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
        const blocksPerWord = Math.floor(32 / bitsPerBlock);
        const wordCount = Math.ceil(4096 / blocksPerWord);
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
    if (paletteSize === 1) return Buffer.from([1]);

    const blockCount: number = values.length; // usually 16*16*16 = 4096
    const bitsPerBlockOriginal: number = Math.max(1, Math.ceil(Math.log2(paletteSize)));
    const bitsPerBlockDivisors: number[] = [1, 2, 3, 4, 5, 6, 8, 16];

    const bitsPerBlock: number = paletteSize === 0 ? 127 : (bitsPerBlockDivisors.find((d: number): boolean => d >= bitsPerBlockOriginal) ?? 16);

    // console.log(bitsPerBlock);

    // const wordsPerBlock: number = paletteSize === 0 ? 0 : Math.ceil(blockCount / Math.floor(32 / bitsPerBlock));
    // const words = new Uint32Array(wordsPerBlock);

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
    // let bitIndex = 0;
    // for (let i = 0; i < values.length; i++) {
    //     let val = values[i]! & ((1 << bitsPerBlock) - 1); // mask to bpe bits
    //     const wordIndex = Math.floor(bitIndex / 32);
    //     const bitOffset = bitIndex % 32;
    //     words[wordIndex]! |= val << bitOffset;
    //     if (bitOffset + bitsPerBlock > 32) {
    //         // spill over into next word
    //         words[wordIndex + 1]! |= val >>> (32 - bitOffset);
    //     }
    //     bitIndex += bitsPerBlock;
    // }

    const blocksPerWord = Math.floor(32 / bitsPerBlock);
    const wordCount = Math.ceil(blockCount / blocksPerWord);
    const mask = (1 << bitsPerBlock) - 1;

    const words = new Uint32Array(wordCount);

    let u = 0;
    for (let j = 0; j < wordCount; j++) {
        let temp = 0;

        for (let k = 0; k < blocksPerWord && u < blockCount; k++) {
            const val = values[u]! & mask;
            temp |= val << (k * bitsPerBlock);
            u++;
        }

        words[j] = temp >>> 0; // ensure unsigned
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

/**
 * This is to allow linking of deeply nested properties from JSDoc.
 *
 * @internal
 */
declare namespace __JSDocTypeAliases {
    /**
     * This links to `NBTSchemas.NBTSchemaTypes.ActorPrefix["value"]["internalComponents"]["value"]["EntityStorageKeyComponent"]["value"]`.
     */
    export type EntityStorageKeyComponentValue =
        NBTSchemas.NBTSchemaTypes.ActorPrefix["value"]["internalComponents"]["value"]["EntityStorageKeyComponent"]["value"];
    /**
     * This links to `NBTSchemas.NBTSchemaTypes.Digest["value"]`.
     */
    export type DigestValue = NBTSchemas.NBTSchemaTypes.Digest["value"];
}

/**
 * Parses the storage key of an {@link entryContentTypeToFormatMap.ActorPrefix | ActorPrefix}.
 *
 * The storage key is stored as a binary-encoded string in the {@link __JSDocTypeAliases.EntityStorageKeyComponentValue.StorageKey | internalComponents.EntityStorageKeyComponent.StorageKey} property.
 *
 * The value returned from this function is the ID that is used in the ActorPrefix's LevelDB key and in the {@link __JSDocTypeAliases.DigestValue.entityIds | entity IDs list} of {@link entryContentTypeToFormatMap.Digest | Digest} LevelDB entries.
 *
 * @param data The storage key.
 * @returns The ID.
 */
export function parseActorPrefixStorageKey(data: Buffer | string): bigint {
    if (typeof data === "string") data = Buffer.from(data, "binary");
    return toLong([data.readInt32LE(0), data.readInt32LE(4)]);
}

/**
 * Parses the storage key of an {@link entryContentTypeToFormatMap.ActorPrefix | ActorPrefix} into high and low parts.
 *
 * The storage key is stored as a binary-encoded string in the {@link __JSDocTypeAliases.EntityStorageKeyComponentValue.StorageKey | internalComponents.EntityStorageKeyComponent.StorageKey} property.
 *
 * The value returned from this function is the ID that is used in the ActorPrefix's LevelDB key and in the {@link __JSDocTypeAliases.DigestValue.entityIds | entity IDs list} of {@link entryContentTypeToFormatMap.Digest | Digest} LevelDB entries.
 *
 * @param data The storage key.
 * @returns The ID.
 */
export function parseActorPrefixStorageKeyToParts(data: Buffer | string): [high: number, low: number] {
    if (typeof data === "string") data = Buffer.from(data, "binary");
    return [data.readInt32LE(0), data.readInt32LE(4)];
}

/**
 * Serializes the storage key ID of an {@link entryContentTypeToFormatMap.ActorPrefix | ActorPrefix} into a raw binary-encoded storage key string.
 *
 * The storage key is stored as a binary-encoded string in the {@link __JSDocTypeAliases.EntityStorageKeyComponentValue.StorageKey | internalComponents.EntityStorageKeyComponent.StorageKey} property.
 *
 * The value passed to this function is the ID that is used in the ActorPrefix's LevelDB key and in the {@link __JSDocTypeAliases.DigestValue.entityIds | entity IDs list} of {@link entryContentTypeToFormatMap.Digest | Digest} LevelDB entries.
 *
 * @param data The ID.
 * @returns The storage key.
 */
export function serializeActorPrefixStorageKey(data: bigint | [high: number, low: number]): Buffer<ArrayBuffer> {
    if (typeof data === "bigint") data = toLongParts(data);
    const buffer: Buffer<ArrayBuffer> = Buffer.alloc(8);
    buffer.writeInt32LE(data[0], 0);
    buffer.writeInt32LE(data[1], 4);
    return buffer;
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
 * The list of Minecraft China Edition dimensions.
 */
export const dimensionsMCCE = [
    "overworld",
    "nether",
    "the_end",
    "dm3",
    "dm4",
    "dm5",
    "dm6",
    "dm7",
    "dm8",
    "dm9",
    "dm10",
    "dm11",
    "dm12",
    "dm13",
    "dm14",
    "dm15",
    "dm16",
    "dm17",
    "dm18",
    "dm19",
    "dm20",
] as const;

/**
 * The list of Minecraft game modes, with their indices corresponding to their numeric gamemode IDs.
 */
export const gameModes = ["survival", "creative", "adventure", , , "default", "spectator"] as const;

/**
 * The list of Minecraft game modes, with their indices corresponding to their numeric gamemode IDs.
 */
export const generatorTypes = ["old", "infinite", "flat", , , "void"] as const;

/**
 * The content types for LevelDB entries.
 */
export const MCDBEntryContentTypes = [
    // Chunk Linked
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
    "VersionEnchant", // China Edition exclusive.
    "VersionMarkInsert", // China Edition exclusive.
    "LegacyVersion",
    "AABBVolumes",
    "JigsawStructureBlueprint",
    "Digest",
    // Village
    "VillageDwellers",
    "VillageInfo",
    "VillagePOI",
    "VillagePlayers",
    "VillageRaid",
    // Standalone
    "Player",
    "PlayerClient",
    "LegacyConsolePlayer",
    "ActorPrefix",
    "ChunkLoadedRequest",
    "Map",
    "Portals",
    "SchedulerWT",
    "StructureTemplate",
    "TickingArea",
    "FlatWorldLayers",
    "LegacyOverworldStructures",
    "LegacyNetherStructures",
    "LegacyTheEndStructures",
    "MVillages",
    "Villages",
    "LevelSpawnWasFixed",
    "PositionTrackingDB",
    "PositionTrackingLastId",
    "Scoreboard",
    "Overworld",
    "Nether",
    "TheEnd",
    "MCChinaDevDimension",
    "CustomDimension",
    "AutonomousEntities",
    "BiomeData",
    "BiomeIdsTable",
    "DimensionNameIdTable",
    "MobEvents",
    "DynamicProperties",
    "LevelChunkMetaDataDictionary",
    "RealmsStoriesData",
    "WorldClocks",
    "POITypes",
    "POIRegionRegistry",
    "POIRegion",
    // Dev Version
    "ForcedWorldCorruption",
    // China Edition
    "SSTCommandLog",
    "SSTHashRegistry",
    "NeteaseData",
    "NeteaseScriptGid",
    // Misc.
    // TEMP: This below two content types need to go right after VersionMarkInsert once they are no longer placeholders.
    "unknown0x70", // China Edition exclusive. // TEMP: Placeholder.
    "unknown0x71", // China Edition exclusive. // TEMP: Placeholder.
    "Unknown",
] as const satisfies MCEntryContentType[];

/**
 * The content types for files.
 */
export const MCFileEntryContentTypes = [
    "LevelDat",
    "PlayerDat",
    "LANPlayerDat",
    "EntitiesDat",
    "ChunksDat",
    "ImportedChunksDat",
    "Unknown",
] as const satisfies MCEntryContentType[];

/**
 * The content types for LevelDB entries and files.
 */
export const MCEntryContentTypes = [
    // Chunk Linked
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
    "VersionEnchant", // China Edition exclusive.
    "VersionMarkInsert", // China Edition exclusive.
    "LegacyVersion",
    "AABBVolumes",
    "JigsawStructureBlueprint",
    "Digest",
    // Village
    "VillageDwellers",
    "VillageInfo",
    "VillagePOI",
    "VillagePlayers",
    "VillageRaid",
    // Standalone
    "Player",
    "PlayerClient",
    "LegacyConsolePlayer",
    "ActorPrefix",
    "ChunkLoadedRequest",
    "Map",
    "Portals",
    "SchedulerWT",
    "StructureTemplate",
    "TickingArea",
    "FlatWorldLayers",
    "LegacyOverworldStructures",
    "LegacyNetherStructures",
    "LegacyTheEndStructures",
    "MVillages",
    "Villages",
    "LevelSpawnWasFixed",
    "PositionTrackingDB",
    "PositionTrackingLastId",
    "Scoreboard",
    "Overworld",
    "Nether",
    "TheEnd",
    "MCChinaDevDimension",
    "CustomDimension",
    "AutonomousEntities",
    "BiomeData",
    "BiomeIdsTable",
    "DimensionNameIdTable",
    "MobEvents",
    "DynamicProperties",
    "LevelChunkMetaDataDictionary",
    "RealmsStoriesData",
    "WorldClocks",
    "POITypes",
    "POIRegionRegistry",
    "POIRegion",
    // Dev Version
    "ForcedWorldCorruption",
    // China Edition
    "SSTCommandLog",
    "SSTHashRegistry",
    "NeteaseData",
    "NeteaseScriptGid",
    // Files
    "LevelDat",
    "PlayerDat",
    "LANPlayerDat",
    "EntitiesDat",
    "ChunksDat",
    "ImportedChunksDat",
    // Misc.
    // TEMP: This below two content types need to go right after VersionMarkInsert once they are no longer placeholders.
    "unknown0x70", // China Edition exclusive. // TEMP: Placeholder.
    "unknown0x71", // China Edition exclusive. // TEMP: Placeholder.
    "Unknown",
] as const;

// export const worldFileContentTypes // TODO

// export const allWorldContentTypes // TODO

/**
 * The content types for LevelDB entries that are associated with a specific chunk and use a single byte after the dimension and chunk XZ coordinates in the LevelDB key to denote their content type.
 */
export const MCDBChunkKeyEntryContentTypes = [
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
    "VersionEnchant",
    "VersionMarkInsert",
    "unknown0x70",
    "unknown0x71",
    "LegacyVersion",
    "AABBVolumes",
    "JigsawStructureBlueprint",
] as const satisfies MCDBEntryContentType[];

/**
 * The list of content types that serve a completely unknown purpose and their name is a placeholder.
 */
export const placeholderContentTypes = ["unknown0x70", "unknown0x71"] as const satisfies MCEntryContentType[];

/**
 * The list of content types that are exclusive to Minecraft China Edition.
 */
export const chinaEditionExclusiveContentTypes = ["VersionEnchant", "VersionMarkInsert", "unknown0x70", "unknown0x71"] as const satisfies MCEntryContentType[];

/**
 * The content types for LevelDB entries that are associated with a specific chunk, includes both the content types from {@link MCDBChunkKeyEntryContentTypes} and other keys that are tied to a specific chunk but use a different key format.
 */
export const MCDBChunkLinkedContentTypes = [
    // Single Appended Byte Format
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
    "VersionEnchant",
    "VersionMarkInsert",
    "unknown0x70",
    "unknown0x71",
    "LegacyVersion",
    "AABBVolumes",
    "JigsawStructureBlueprint",
    // Other Key Format
    "Digest",
] as const satisfies [...typeof MCDBChunkKeyEntryContentTypes, ...Exclude<MCDBEntryContentType, MCDBChunkKeyEntryContentType>[]];

/**
 * Maps content types to grouping labels.
 *
 * Most content types are not grouped, only a few are.
 */
export const MCEntryContentTypesGrouping = (function __cloneJSDoc<
    T extends { [contentType in keyof typeof entryContentTypeToFormatMap]: string },
    // This copies the JSDoc from entryContentTypeToFormatMap to MCEntryContentTypesGrouping.
>(data: T): { [contentType in keyof typeof entryContentTypeToFormatMap]: T[contentType] } {
    return data;
})({
    // Chunk Linked
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
    VersionEnchant: "VersionEnchant",
    VersionMarkInsert: "VersionMarkInsert",
    unknown0x70: "UnknownChunkKeyPlaceholder",
    unknown0x71: "UnknownChunkKeyPlaceholder",
    LegacyVersion: "LegacyVersion",
    AABBVolumes: "AABBVolumes",
    JigsawStructureBlueprint: "JigsawStructureBlueprint",
    Digest: "Digest",
    // Village
    VillageDwellers: "VillageDwellers",
    VillageInfo: "VillageInfo",
    VillagePOI: "VillagePOI",
    VillagePlayers: "VillagePlayers",
    VillageRaid: "VillageRaid",
    // Standalone
    Player: "Player",
    PlayerClient: "PlayerClient",
    LegacyConsolePlayer: "LegacyConsolePlayer",
    ActorPrefix: "ActorPrefix",
    ChunkLoadedRequest: "ChunkLoadedRequest",
    Map: "Map",
    Portals: "Portals",
    SchedulerWT: "SchedulerWT",
    StructureTemplate: "StructureTemplate",
    TickingArea: "TickingArea",
    FlatWorldLayers: "FlatWorldLayers",
    LegacyOverworldStructures: "LegacyDimensionStructures",
    LegacyNetherStructures: "LegacyDimensionStructures",
    LegacyTheEndStructures: "LegacyDimensionStructures",
    MVillages: "MVillages",
    Villages: "Villages",
    LevelSpawnWasFixed: "LevelSpawnWasFixed",
    PositionTrackingDB: "PositionTracking",
    PositionTrackingLastId: "PositionTracking",
    Scoreboard: "Scoreboard",
    Overworld: "Dimension",
    Nether: "Dimension",
    TheEnd: "Dimension",
    MCChinaDevDimension: "Dimension",
    CustomDimension: "Dimension",
    AutonomousEntities: "AutonomousEntities",
    BiomeData: "BiomeData",
    BiomeIdsTable: "IdsTable",
    DimensionNameIdTable: "IdsTable",
    MobEvents: "MobEvents",
    DynamicProperties: "DynamicProperties",
    LevelChunkMetaDataDictionary: "LevelChunkMetaDataDictionary",
    RealmsStoriesData: "RealmsStoriesData",
    WorldClocks: "WorldClocks",
    POITypes: "POI",
    POIRegionRegistry: "POI",
    POIRegion: "POI",
    // Dev Version
    ForcedWorldCorruption: "ForcedWorldCorruption",
    // China Edition
    SSTCommandLog: "SerializedStringTables",
    SSTHashRegistry: "SerializedStringTables",
    NeteaseData: "Netease",
    NeteaseScriptGid: "Netease",
    // Files
    LevelDat: "LevelDat",
    PlayerDat: "PlayerDat",
    LANPlayerDat: "PlayerDat",
    EntitiesDat: "EntitiesDat",
    ChunksDat: "ChunksDat",
    ImportedChunksDat: "ImportedChunksDat",
    // Misc.
    Unknown: "Unknown",
} as const satisfies { [contentType in keyof typeof entryContentTypeToFormatMap]: string });

// TODO: Look into the supposed `idcounts` LevelDB key that was supposedly in MCPE v0.13.0.
// TODO: Add support for the LegacyPlayer content type which is based on a number stored in `cilentid.txt`.
// TODO: Look into if LegacyVillageManager (may just be another name for MVillages, key is allegedly `VillageManager`) is a real content type.

/**
 * Maps the chunk versions from the {@link entryContentTypeToFormatMap.LegacyVersion} content type to details of what version they correspond to.
 */
export const chunkLegacyVersionDetailsMap = {
    /**
     * v0.9.0
     */
    [0 /* 0x00 */]: "v0.9.0",
    /**
     * v0.9.2
     */
    [1 /* 0x01 */]: "v0.9.2",
    /**
     * v0.9.5
     */
    [2 /* 0x02 */]: "v0.9.5",
    /**
     * v0.17.0.1
     */
    [3 /* 0x03 */]: "v0.17.0.1",
    /**
     * v1.1.0
     */
    [4 /* 0x04 */]: "v1.1.0",
    /**
     * Converted from console to v1.1.0
     */
    [5 /* 0x05 */]: "Converted from console to v1.1.0",
    /**
     * v1.2.0.2
     */
    [6 /* 0x06 */]: "v1.2.0.2",
    /**
     * v1.2.0
     */
    [7 /* 0x07 */]: "v1.2.0",
    /**
     * v1.2.13
     */
    [8 /* 0x08 */]: "v1.2.13",
    /**
     * v1.8.0
     */
    [9 /* 0x09 */]: "v1.8.0",
    /**
     * v1.9.0
     */
    [10 /* 0x0A */]: "v1.9.0",
    /**
     * v1.11.0.1
     */
    [11 /* 0x0B */]: "v1.11.0.1",
    /**
     * v1.11.0.3
     */
    [12 /* 0x0C */]: "v1.11.0.3",
    /**
     * v1.11.0.4
     */
    [13 /* 0x0D */]: "v1.11.0.4",
    /**
     * v1.11.1
     */
    [14 /* 0x0E */]: "v1.11.1",
    /**
     * v1.12.0.4
     */
    [15 /* 0x0F */]: "v1.12.0.4",
    /**
     * v1.14.0
     */
    [16 /* 0x10 */]: "v1.14.0",
    /**
     * v1.15.0
     */
    [17 /* 0x11 */]: "v1.15.0",
    /**
     * v1.16.0.51
     */
    [18 /* 0x12 */]: "v1.16.0.51",
    /**
     * v1.16.0
     */
    [19 /* 0x13 */]: "v1.16.0",
} as const;

/**
 * Maps the chunk versions from the {@link entryContentTypeToFormatMap.Version} content type to details of what version they correspond to.
 */
export const chunkVersionDetailsMap = {
    /**
     * v1.16.100.52
     */
    [20 /* 0x14 */]: "v1.16.100.52",
    /**
     * v1.16.100.57
     */
    [21 /* 0x15 */]: "v1.16.100.57",
    /**
     * v1.16.210
     */
    [22 /* 0x16 */]: "v1.16.210",
    /**
     * v1.16.220.50 (+Caves & Cliffs Experimental Toggle)
     */
    [23 /* 0x17 */]: "v1.16.220.50 (+Caves & Cliffs Experimental Toggle)",
    /**
     * v1.16.220.50 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     */
    [24 /* 0x18 */]: "v1.16.220.50 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)",
    /**
     * v1.16.230.50 (+Caves & Cliffs Experimental Toggle)
     */
    [25 /* 0x19 */]: "v1.16.230.50 (+Caves & Cliffs Experimental Toggle)",
    /**
     * v1.16.230.50 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     */
    [26 /* 0x1A */]: "v1.16.230.50 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)",
    /**
     * v1.17.30.23 (+Caves & Cliffs Experimental Toggle)
     */
    [27 /* 0x1B */]: "v1.17.30.23 (+Caves & Cliffs Experimental Toggle)",
    /**
     * v1.17.30.23 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     */
    [28 /* 0x1C */]: "v1.17.30.23 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)",
    /**
     * v1.17.30.25 (+Caves & Cliffs Experimental Toggle)
     */
    [29 /* 0x1D */]: "v1.17.30.25 (+Caves & Cliffs Experimental Toggle)",
    /**
     * v1.17.30.25 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     */
    [30 /* 0x1E */]: "v1.17.30.25 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)",
    /**
     * v1.17.40.20 (+Caves & Cliffs Experimental Toggle)
     */
    [31 /* 0x1F */]: "v1.17.40.20 (+Caves & Cliffs Experimental Toggle)",
    /**
     * v1.17.40.20 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     */
    [32 /* 0x20 */]: "v1.17.40.20 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)",
    /**
     * v1.18.0.20
     */
    [33 /* 0x21 */]: "v1.18.0.20",
    /**
     * v1.18.0.20 (internal/developer builds)
     */
    [34 /* 0x22 */]: "v1.18.0.20 (internal/developer builds)",
    /**
     * v1.18.0.22
     */
    [35 /* 0x23 */]: "v1.18.0.22",
    /**
     * v1.18.0.22 (internal/developer builds)
     */
    [36 /* 0x24 */]: "v1.18.0.22 (internal/developer builds)",
    /**
     * v1.18.0.24
     */
    [37 /* 0x25 */]: "v1.18.0.24",
    /**
     * v1.18.0.24 (internal/developer builds)
     */
    [38 /* 0x26 */]: "v1.18.0.24 (internal/developer builds)",
    /**
     * v1.18.0.25
     */
    [39 /* 0x27 */]: "v1.18.0.25",
    /**
     * v1.18.30 after upgrading entities to independent storage
     */
    [40 /* 0x28 */]: "v1.18.30 after upgrading entities to independent storage",
    /**
     * v1.21.40
     */
    [41 /* 0x29 */]: "v1.21.40",
    /**
     * v1.21.120
     */
    [42 /* 0x2A */]: "v1.21.120",
} as const;

/**
 * Maps the `level.dat` `StorageVersion`s to the Minecraft version ranges that used them.
 *
 * For completely unknown version ranges, the value will be `"?"`.
 *
 * If either the start or end of the range is unknown, that value in the tuple will be `"?"`.
 *
 * If there is no end of the range yet (as in it is the latest known version), the end value of the tuple will be `"N/A"`.
 *
 * The start and end values of the tuple are tuples of `[major, minor, patch, build]`, each value in that tuple will be either a number, or `"?"` if that value is unknown.
 *
 * For versions where the preview/beta build number is larger than the release build number, the build value will be a tuple of `[preview, release]`.
 *
 * The start of the range is inclusive, the end of the range is exclusive.
 */
export const levelDatStorageVersionToMCVersionRangeMap = {
    /**
     * Used prior to Pocket Edition v0.2.0 Alpha, this was the only storage version where the data of `level.dat` was in a binary format rather than NBT.
     *
     * Worlds with this storage version used `level.dat`, `player.dat`, and `chunks.dat` to store the world data.
     */
    [1 /* 0x01 */]: ["N/A", [0, 2, 0, 0]],
    // TODO: Document each of these storage versions and their differences/changes.
    /**
     * This was the first storage version to store `level.dat` in NBT format rather than a binary format.
     *
     * Worlds with this storage version used `level.dat`, `entities.dat`, and `chunks.dat` to store the world data.
     *
     * This storage version moved the player data from `player.dat` into `level.dat`, and it is now stored in NBT format rather than a binary format.
     */
    [2 /* 0x02 */]: [
        [0, 2, 0, 0],
        [0, 3, 0, 0],
    ],
    // TODO: Figure out what 0.9.0 build this changed in.
    // I think this may be where the `players/<PlayerID>.dat` files were added.
    [3 /* 0x03 */]: [
        [0, 3, 0, 0],
        [0, 9, 0, "?"],
    ],
    // TODO: Figure out what 1.0.0 build this changed in.
    /**
     * This was the first storage version to use a LevelDB.
     */
    [4 /* 0x04 */]: [
        [0, 9, 0, "?"],
        [1, 0, 0, "?"],
    ],
    [5 /* 0x05 */]: [
        [1, 0, 0, "?"],
        [1, 2, 0, 11],
    ],
    // TODO: Figure out what 1.2.13 beta this changed in.
    [6 /* 0x06 */]: [
        [1, 2, 0, 11],
        [1, 2, 13, "?"],
    ],
    [7 /* 0x07 */]: [
        [1, 2, 13, "?"],
        [1, 2, 20, 2],
    ], // Earliest known version: 1.2.13.54
    [8 /* 0x08 */]: [
        [1, 2, 20, 2],
        [1, 18, 20, 21],
    ],
    [9 /* 0x09 */]: [
        [1, 18, 20, 21],
        [1, 19, 40, [20, 2]],
    ],
    [10 /* 0x0A */]: [[1, 19, 40, [20, 2]], "N/A"],
} as const satisfies LevelDatStorageVersionToMCVersionRangeMapType;

/**
 * The type for the {@link levelDatStorageVersionToMCVersionRangeMap} object.
 *
 * Use this type if you want to have handling for valid data structures for the object that aren't in use yet.
 */
export type LevelDatStorageVersionToMCVersionRangeMapType = Record<
    Range<1, 11>,
    | [
          start:
              | [major: number | "?", minor: number | "?", patch: number | "?", build: number | [previewOrBeta: number | "?", release: number | "?"] | "?"]
              | "?"
              | "N/A",
          end:
              | [major: number | "?", minor: number | "?", patch: number | "?", build: number | [previewOrBeta: number | "?", release: number | "?"] | "?"]
              | "?"
              | "N/A",
      ]
    | "?"
>;

/**
 * This is like {@link NBT.protoLE | protoLE} from the `prismarine-nbt` module, except strings are parsed with a binary encoding instead of UTF-8.
 */
export const protoLEBinaryStringEncoding: CompiledProtoDef = ((): CompiledProtoDef => {
    const compiler = new protodef.Compiler.ProtoDefCompiler();
    (compiler as ProtodefCompiler & { addTypesToCompile(types: unknown): void }).addTypesToCompile(__NBT_LE_binary_string_encoding_proto_defs__);
    NBT.addTypesToCompiler("little", compiler as unknown as typeof protodef.Compiler);
    return compiler.compileProtoDefSync();
})();

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
                        values: !subchunk.values.value.value ? null : subchunk.values.value.value,
                    })
                )
            );
        },
        // TO-DO: Add a default value for this.
    },
    /**
     * The version of a chunk.
     *
     * Deleting this key causes the game to completely regenerate the corresponding chunk.
     *
     * Possible values:
     * - `20`: v1.16.100.52
     * - `21`: v1.16.100.57
     * - `22`: v1.16.210
     * - `23`: v1.16.220.50 (+Caves & Cliffs Experimental Toggle)
     * - `24`: v1.16.220.50 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     * - `25`: v1.16.230.50 (+Caves & Cliffs Experimental Toggle)
     * - `26`: v1.16.230.50 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     * - `27`: v1.17.30.23 (+Caves & Cliffs Experimental Toggle)
     * - `28`: v1.17.30.23 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     * - `29`: v1.17.30.25 (+Caves & Cliffs Experimental Toggle)
     * - `30`: v1.17.30.25 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     * - `31`: v1.17.40.20 (+Caves & Cliffs Experimental Toggle)
     * - `32`: v1.17.40.20 (+Caves & Cliffs Experimental Toggle) (internal/developer builds)
     * - `33`: v1.18.0.20
     * - `34`: v1.18.0.20 (internal/developer builds)
     * - `35`: v1.18.0.22
     * - `36`: v1.18.0.22 (internal/developer builds)
     * - `37`: v1.18.0.24
     * - `38`: v1.18.0.24 (internal/developer builds)
     * - `39`: v1.18.0.25
     * - `40`: v1.18.30 after upgrading entities to independent storage
     * - `41`: v1.21.40
     * - `42`: v1.21.120
     *
     * @see {@link chunkVersionDetailsMap}
     *
     * @since v1.16.100
     */
    Version: {
        // https://github.com/reedacartwright/rbedrock/blob/c9040e803c4172a19507bc8f1278802ad0e6170a/R/chunk_version.R
        // https://github.com/robofinch/Prismarine-Anchor/blob/6ce90fa2a27c5d81e6cc1cc376e91c757a80e321/crates/bedrock/bedrock-entries/src/enum_types/chunk_version.rs#L24
        // https://github.com/reedacartwright/rbedrock/blob/c9040e803c4172a19507bc8f1278802ad0e6170a/man/ChunkVersion.Rd
        // Value list: https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L98
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
     * Only used in versions < 1.18.0, and for worlds using the Old world type or using an older base game version.
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
            const formatVersion: NBTSchemas.NBTSchemaTypes.Data2D["value"]["version"]["value"] | -1 =
                data.length === 768 ? 1
                : data.length === 1024 ? 2
                : -1;
            if (formatVersion === -1) throw new Error(`Unknown Data2D format, expected 768 or 1024 bytes, got ${data.length} bytes`);

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

            switch (formatVersion) {
                case 1:
                    for (let i = 0; i < 256; i++) {
                        const val: number = data.readUInt8(512 + i);
                        const x: number = i % 16;
                        const z: number = Math.floor(i / 16);
                        biomeData[x]![z] = val;
                    }
                    return {
                        type: "compound",
                        value: {
                            version: {
                                type: "byte",
                                value: formatVersion,
                            },
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
                case 2:
                    for (let i = 0; i < 256; i++) {
                        const val: number = data.readUInt16LE(512 + i * 2);
                        const x: number = i % 16;
                        const z: number = Math.floor(i / 16);
                        biomeData[x]![z] = val;
                    }
                    return {
                        type: "compound",
                        value: {
                            version: {
                                type: "byte",
                                value: formatVersion,
                            },
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
                                        type: "short",
                                        value: row,
                                    })),
                                },
                            },
                        },
                    };
                default:
                    throw new Error(`Missing parser for Data2D format: ${formatVersion}`);
            }
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
            const formatVersion = data.value.version.value;
            const heightMap = data.value.heightMap.value.value;
            const biomeData = data.value.biomeData.value.value;

            switch (formatVersion) {
                case 1: {
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
                            buffer.writeUInt8(val & 0xff, 512 + i);
                        }
                    }

                    return buffer;
                }
                case 2: {
                    const buffer: Buffer<ArrayBuffer> = Buffer.alloc(512 + 512);

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
                            buffer.writeUInt16LE(val & 0xffff, 512 + i * 2);
                        }
                    }

                    return buffer;
                }
                default:
                    throw new TypeError(`Unknown Data2D format: ${formatVersion}`);
            }
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
                    vals.forEach((val: number, index: number): void => void buffer.writeUInt8(val & 0xff, 512 + i * 4 + index));
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
        // TODO: Make this synchronous.
        // TODO: Remove the storageVersion property from the schema and data and make it be automatically determined.
        // IDEA: Add support for network palettes, maybe in a different content type. I think the network palettes may be parsed the same way as the Data3D content type's subchunk palette IDs.
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
                // 0 means a runtime palette of copmosite tag values; 1 means a network palette of numeric runtime ids (used in network packets)
                const isRuntimePalette: boolean = (storageVersion & 1) === 0;
                const bitsPerBlock: number = storageVersion >> 1;
                // console.log(blockIndex, storageVersion, isRuntimePalette, bitsPerBlock);
                if (
                    !(
                        (
                            bitsPerBlock === 0 ||
                            bitsPerBlock === 1 ||
                            bitsPerBlock === 2 ||
                            bitsPerBlock === 3 ||
                            bitsPerBlock === 4 ||
                            bitsPerBlock === 5 ||
                            bitsPerBlock === 6 ||
                            bitsPerBlock === 8 ||
                            bitsPerBlock === 16 ||
                            bitsPerBlock === 127
                        )
                        // TEST: Figure out if bitsPerBlock === 127 is actually valid for SubChunkPrefix or not.
                    )
                ) {
                    throw new Error(`Unknown storage version: ${storageVersion}`);
                }
                fakeAssertType<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 16 | 17 | 32 | 33>(storageVersion);
                currentOffset++;
                if (bitsPerBlock === 127) {
                    // REVIEW: Maybe this should have an empty block_indices array.
                    layers.push({
                        palette: NBT.comp({}),
                        block_indices: { type: "list", value: { type: "int", value: new Array<number>(4096).fill(0) } },
                    });
                    continue;
                }
                if (bitsPerBlock === 0) {
                    if (isRuntimePalette) {
                        // Runtime palette
                        const paletteEntry = (await NBT.parse(data.subarray(currentOffset), "little")) as unknown as {
                            parsed: NBTSchemas.NBTSchemaTypes.Block;
                            type: NBT.NBTFormat;
                            metadata: NBT.Metadata;
                        };

                        layers.push({
                            palette: NBT.comp({
                                "0": paletteEntry.parsed,
                            }),
                            block_indices: { type: "list", value: { type: "int", value: new Array<number>(4096).fill(0) } },
                        });
                        currentOffset += paletteEntry.metadata.size;
                        continue;
                    } else {
                        // Network palette
                        throw new Error("Network palettes are not yet supported for the SubChunkPrefix parser.");
                        // NOTE: The below code is actually fully functional.
                        // const value: number = data.readUInt32LE(currentOffset);

                        // layers.push({
                        //     palette: NBT.comp({
                        //         "0": { type: "int", value },
                        //     }),
                        //     block_indices: { type: "list", value: { type: "int", value: new Array<number>(4096).fill(0) } },
                        // });
                        // currentOffset += 4;
                        // continue;
                    }
                }
                const blocksPerWord: number = Math.floor(32 / bitsPerBlock);
                const numints: number = Math.ceil(4096 / blocksPerWord);
                const blockDataOffset: number = currentOffset;
                let paletteOffset: number = blockDataOffset + 4 * numints;
                let psize: number = getInt32Val(data, paletteOffset);
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
                if (isRuntimePalette) {
                    // Runtime palette
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
                    if (bitsPerBlock > 0) {
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
                    } else {
                        block_indices.fill(0);
                    }
                    layers.push({
                        palette: NBT.comp(palette),
                        block_indices: { type: "list", value: { type: "int", value: block_indices } },
                    });
                } else {
                    // Network palette
                    throw new Error("Network palettes are not yet supported for the SubChunkPrefix parser.");
                    // NOTE: The below code is actually fully functional.
                    // const palette: {
                    //     [paletteIndex: `${bigint}`]: { type: "int"; value: number };
                    // } = {};
                    // for (let i: bigint = 0n; i < psize; i++) {
                    //     // console.log(debugInfo);
                    //     // appendFileSync("./test1.bin", JSON.stringify(debugInfo) + "\n");
                    //     const result: number = data.readUInt32LE(paletteOffset);
                    //     paletteOffset += 4;
                    //     palette[`${i}`] = { type: "int", value: result };
                    //     // console.log(result);
                    //     // appendFileSync("./test1.bin", JSON.stringify(result));
                    // }
                    // currentOffset = paletteOffset;
                    // const block_indices: number[] = [];
                    // if (bitsPerBlock > 0) {
                    //     for (let i: number = 0; i < 4096; i++) {
                    //         const maskVal: number = getInt32Val(data, blockDataOffset + Math.floor(i / blocksPerWord) * 4);
                    //         const blockVal: number = (maskVal >> ((i % blocksPerWord) * bitsPerBlock)) & ((1 << bitsPerBlock) - 1);
                    //         // const blockType: DataTypes_Block | undefined = palette[`${blockVal as unknown as bigint}`];
                    //         // if (!blockType && blockVal !== -1) throw new ReferenceError(`Invalid block palette index ${blockVal} for block ${i}`);
                    //         /* const chunkOffset: Vector3 = {
                    //     x: (i >> 8) & 0xf,
                    //     y: (i >> 4) & 0xf,
                    //     z: (i >> 0) & 0xf,
                    // }; */
                    //         block_indices.push(blockVal);
                    //     }
                    // } else {
                    //     block_indices.fill(0);
                    // }
                    // layers.push({
                    //     storageVersion: NBT.byte(storageVersion),
                    //     palette: NBT.comp(palette),
                    //     block_indices: { type: "list", value: { type: "int", value: block_indices } },
                    // });
                }
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
                layers: { type: "list", value: NBT.comp(layers as NBTSchemas.NBTSchemaTypes.SubChunkPrefix_v8["value"]["layers"]["value"]["value"]) },
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
                            // 0 means a runtime palette of copmosite tag values; 1 means a network palette of numeric runtime ids (used in network packets)
                            const isRuntimePalette: boolean = true; /* layer.isRuntimePalette.value === 1 */ /* (layer.storageVersion.value & 1) === 0 */
                            if (!isRuntimePalette) {
                                throw new Error("Network palettes are not yet supported for the SubChunkPrefix serializer.");
                            }
                            // const bitsPerBlock: number = layer.storageVersion.value >> 1;
                            // const blocksPerWord: number = Math.floor(32 / bitsPerBlock);
                            // const numints: number = Math.ceil(4096 / blocksPerWord);
                            // const bytes: number[] = [layer.storageVersion.value];
                            const paletteKeys: `${bigint}`[] = (Object.keys(layer.palette.value) as `${bigint}`[]).sort(
                                (a: `${bigint}`, b: `${bigint}`): number => Number(a) - Number(b)
                            );
                            const bitsPerBlockOriginal: number = Math.max(1, Math.ceil(Math.log2(paletteKeys.length)));
                            const bitsPerBlockDivisors: number[] = [1, 2, 3, 4, 5, 6, 8, 16];

                            const blockCount: number = layer.block_indices.value.value.length;
                            const bitsPerBlock: number =
                                paletteKeys.length === 0 ? 127
                                : paletteKeys.length === 1 ? 0
                                : (bitsPerBlockDivisors.find((d: number): boolean => d >= bitsPerBlockOriginal) ?? 16);
                            if (bitsPerBlock === 127) return Buffer.from([(0x7f << 1) | +!isRuntimePalette]);
                            const buffers: (Uint8Array | Buffer)[] = [Uint8Array.from([(bitsPerBlock << 1) | +!isRuntimePalette])];
                            if (bitsPerBlock > 0) {
                                const blocksPerWord: number = Math.floor(32 / bitsPerBlock);
                                const wordCount: number = Math.ceil(blockCount / blocksPerWord);
                                const blockIndicesBuffer: Buffer<ArrayBuffer> = Buffer.alloc(Math.ceil(wordCount * 4));
                                writeBlockIndices(blockIndicesBuffer, 0, layer.block_indices.value.value, bitsPerBlock, blocksPerWord);
                                const paletteLengthBuffer: Buffer<ArrayBuffer> = Buffer.alloc(4);
                                setInt32Val(paletteLengthBuffer, 0, Object.keys(layer.palette.value).length);
                                buffers.push(blockIndicesBuffer, paletteLengthBuffer);
                            }
                            if (isRuntimePalette) {
                                // Runtime palette
                                for (let paletteIndex: number = 0; paletteIndex < paletteKeys.length; paletteIndex++) {
                                    const block: NBTSchemas.NBTSchemaTypes.Block = layer.palette.value[paletteKeys[paletteIndex]!]!;
                                    buffers.push(NBT.writeUncompressed({ name: "", ...block }, "little"));
                                }
                            } else {
                                // Network palette
                                const paletteBuffer: Buffer<ArrayBuffer> = Buffer.alloc(paletteKeys.length * 4);
                                for (let paletteIndex: number = 0; paletteIndex < paletteKeys.length; paletteIndex++) {
                                    const value: number = layer.palette.value[paletteKeys[paletteIndex]!]!
                                        .value as unknown as number; /* TEMP: This as statement can be removed when the types for network palettes are added. */
                                    setInt32Val(paletteBuffer, paletteIndex * 4, value);
                                }
                                buffers.push(paletteBuffer);
                            }
                            return Buffer.concat(buffers);
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

            const height_map: number[] = [...data.subarray(currentOffset, currentOffset + 256)];
            currentOffset += 256;

            const grass_color: number[] = [...data.subarray(currentOffset, currentOffset + 1024)];
            currentOffset += 1024;

            return NBT.comp({
                block_ids: { type: "list", value: { type: "byte", value: block_ids } },
                block_data: { type: "list", value: { type: "byte", value: block_data } },
                sky_light: { type: "list", value: { type: "byte", value: sky_light } },
                block_light: { type: "list", value: { type: "byte", value: block_light } },
                height_map: { type: "list", value: { type: "byte", value: height_map } },
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
                Buffer.from(data.value.height_map.value.value),
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
         * @throws {unknown} If an error occurs while parsing the data.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        async parse(data: Buffer): Promise<{
            type: "compound";
            value: {
                entities: {
                    type: "list";
                    value: { type: "compound"; value: NBTSchemas.NBTSchemaTypes.Entity_Entity["value"][] };
                };
            };
        }> {
            const entities: NBTSchemas.NBTSchemaTypes.Entity_Entity["value"][] = [];
            let currentIndex: number = 0;
            while (currentIndex < data.length) {
                const result = await NBT.parse(data.subarray(currentIndex), "little");
                currentIndex += result.metadata.size;
                entities.push(result.parsed.value as NBTSchemas.NBTSchemaTypes.Entity_Entity["value"]);
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
                    value: { type: "compound"; value: NBTSchemas.NBTSchemaTypes.Entity_Entity["value"][] };
                };
            };
        }): Buffer<ArrayBuffer> {
            const nbtData: Buffer[] = data.value.entities.value.value.map(
                (entity: NBTSchemas.NBTSchemaTypes.Entity_Entity["value"]): Buffer =>
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
     * This stores the secondary block layer. This is used for snowlogging, the snow layers are stored in the primary block layer, while the block that is being snowlogged is stored here.
     *
     * @deprecated Only used in versions < 1.2.13.
     *
     * @see {@link NBTSchemas.nbtSchemas.LegacyBlockExtraData}
     */
    LegacyBlockExtraData: {
        // https://github.com/yechentide/core-bedrock/blob/77d815439da14b3d0b7d0335b80deb1860aee42a/Analysis/chunk-0x34-legacy-block-extra-data.md
        // https://github.com/robofinch/Prismarine-Anchor/blob/main/crates/bedrock/leveldb-entries/src/entries/legacy_extra_block_data.rs
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L331
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.LegacyBlockExtraData.parse | parse} method.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.LegacyBlockExtraData {
            const entries: NBTSchemas.NBTSchemaTypes.LegacyBlockExtraData["value"]["BlockExtraData"]["value"]["value"] = [];
            let i: number = 0;
            while (i < data.length) {
                const y: number = data[i++]!;
                const xy: number = data[i++]!;
                if (data[i++] !== 0) throw new Error("Unexpected non-zero value in third byte of BlockExtraData key");
                if (data[i++] !== 0) throw new Error("Unexpected non-zero value in fourth byte of BlockExtraData key");
                const id: number = data[i++]!;
                const dataValue: number = data[i++]!;
                entries.push({
                    pos: {
                        type: "compound",
                        value: {
                            x: {
                                type: "byte",
                                // REVIEW: Make sure the x and z aren't swapped.
                                value: (xy >> 4) as Range<0, 16>,
                            },
                            y: {
                                type: "byte",
                                value: y as Range<0, 256>,
                            },
                            z: {
                                type: "byte",
                                value: (xy & 0x0f) as Range<0, 16>,
                            },
                        },
                    },
                    id: {
                        type: "byte",
                        value: id,
                    },
                    data: {
                        type: "byte",
                        value: dataValue,
                    },
                });
            }
            return {
                type: "compound",
                value: {
                    BlockExtraData: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: entries,
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
        serialize(data: NBTSchemas.NBTSchemaTypes.LegacyBlockExtraData): Buffer<ArrayBuffer> {
            const buf: Buffer<ArrayBuffer> = Buffer.alloc(4 + data.value.BlockExtraData.value.value.length * 6);
            buf.writeUInt32LE(data.value.BlockExtraData.value.value.length, 0);
            let i = 0;
            for (const entry of data.value.BlockExtraData.value.value) {
                buf[i] = entry.pos.value.y.value & 0xff;
                let xz = 0;
                xz |= (entry.pos.value.x.value & 0x0f) << 4;
                xz |= entry.pos.value.z.value & 0x0f;
                buf[i + 1] = xz;
                buf[i + 4] = entry.id.value & 0xff;
                buf[i + 5] = entry.data.value & 0xff;
                i += 6;
            }
            return buf;
        },
    },
    /**
     * @todo Figure out what this is used for.
     * @todo Add a description for this.
     *
     * @see {@link NBTSchemas.nbtSchemas.BiomeState}
     *
     * @description
     * https://github.com/robofinch/Prismarine-Anchor/blob/6ce90fa2a27c5d81e6cc1cc376e91c757a80e321/crates/bedrock/leveldb-entries/src/entries/biome_state.rs#L103C1-L109C41
     *
     * The above source says the following:
     *
     * > These state values seem to have something to do with snow accumulation level.
     * Maybe the maximum level that snow can accumulate to naturally.
     *
     * > TODO: determine this
     *
     * > Also, note that these could be backed by HashMaps,
     *
     * > but the order of real game data is inconsistent, and have very, very few values.
     *
     * > This makes things easier for testing to be able to round-trip,
     * and is probably more performant, too.
     */
    BiomeState: {
        // https://github.com/yechentide/core-bedrock/blob/77d815439da14b3d0b7d0335b80deb1860aee42a/Analysis/chunk-0x35-biome-state.md
        //
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L344C5-L344C15
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.BiomeState.parse | parse} method.
         */
        resultType: "JSONNBT",
        // TODO: Figure out what each of the state values mean.
        /**
         * The function to parse the data.
         *
         * The {@link data} parameter should be the buffer read directly from the file or LevelDB entry.
         *
         * @param data The data to parse, as a buffer.
         * @returns The parsed data.
         *
         * @throws {RangeError} If the buffer is empty.
         * @throws {RangeError} If the number of BiomeState entries does is less than the number indicated in buffer.
         * @throws {RangeError} If one of the BiomeState entries does not contain enough bytes.
         * @throws {TypeError} If the BiomeState format is unknown.
         */
        // OPTIMIZE: This parse method can be optimized.
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.BiomeState {
            if (data.length < 1) throw new RangeError("BiomeState Buffer must be at least 1 byte long");
            let biomeStateFormat: 1 | 2;
            let count: number;
            formatDetection: {
                count = data[0]!;
                if (data.length === 1 + count * 2) {
                    biomeStateFormat = 1;
                    break formatDetection;
                }
                if (data.length < 2) throw new TypeError("Unknown BiomeState format");
                count = data[0]! | (data[1]! << 8);
                if (data.length === 2 + count * 3) {
                    biomeStateFormat = 2;
                    break formatDetection;
                }
                throw new TypeError("Unknown BiomeState format");
            }
            switch (biomeStateFormat) {
                case 1: {
                    const entries: { biome_id: number; state: number }[] = [];
                    for (let i = 0; i < count; i++) {
                        const entryData: Buffer = data.subarray(1 + i * 2, 3 + i * 2);
                        if (entryData.length !== 2) throw new RangeError("BiomeState entry data must be 2 bytes long");
                        const [biome_id, state] = entryData as Buffer & [number, number];
                        entries.push({ biome_id, state });
                    }
                    return {
                        type: "compound",
                        value: {
                            format: {
                                type: "byte",
                                value: biomeStateFormat,
                            },
                            entries: {
                                type: "list",
                                value: {
                                    type: "compound",
                                    value: entries.map((entry) => ({
                                        biome_id: {
                                            type: "byte",
                                            value: entry.biome_id as Extract<
                                                NBTSchemas.NBTSchemaTypes.BiomeState["value"],
                                                { format: { value: 1 } }
                                            >["entries"]["value"]["value"][number]["biome_id"]["value"],
                                        },
                                        state: { type: "byte", value: entry.state },
                                    })),
                                },
                            },
                        },
                    };
                }
                case 2: {
                    const entries: { biome_id: number; state: number }[] = [];
                    for (let i = 0; i < count; i++) {
                        const entryData: Buffer = data.subarray(2 + i * 3, 5 + i * 3);
                        if (entryData.length !== 3) throw new RangeError("BiomeState entry data must be 3 bytes long");
                        const biome_id: number = entryData.readUInt16LE(0);
                        const state: number = entryData[2]!;
                        entries.push({ biome_id, state });
                    }
                    return {
                        type: "compound",
                        value: {
                            format: {
                                type: "byte",
                                value: biomeStateFormat,
                            },
                            entries: {
                                type: "list",
                                value: {
                                    type: "compound",
                                    value: entries.map(
                                        (entry: {
                                            biome_id: number;
                                            state: number;
                                        }): { biome_id: { type: "short"; value: number }; state: { type: "byte"; value: number } } => ({
                                            biome_id: { type: "short", value: entry.biome_id },
                                            state: { type: "byte", value: entry.state },
                                        })
                                    ),
                                },
                            },
                        },
                    };
                }
            }
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         *
         * @throws {TypeError} If one of the BiomeState entries are undefined.
         * @throws {TypeError} If the BiomeState format is unknown.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.BiomeState): Buffer<ArrayBuffer> {
            const entries: typeof data.value.entries.value.value = data.value.entries.value.value;
            const count: number = entries.length;
            switch (data.value.format.value) {
                case 1: {
                    const serializedData: Buffer<ArrayBuffer> = Buffer.alloc(1 + count * 2);
                    serializedData.writeUInt8(count, 0);
                    for (let i = 0; i < count; i++) {
                        const entry: (typeof entries)[number] | undefined = entries[i];
                        if (!entry) throw new TypeError(`BiomeState entry is undefined at index ${i}`);
                        const offset: number = 1 + i * 2;
                        serializedData[offset] = entry.biome_id.value;
                        serializedData[offset + 1] = entry.state.value;
                    }
                    return serializedData;
                }
                case 2: {
                    const serializedData: Buffer<ArrayBuffer> = Buffer.alloc(2 + count * 3);
                    serializedData.writeUInt16LE(count, 0);
                    for (let i = 0; i < count; i++) {
                        const entry: (typeof data.value.entries.value.value)[number] | undefined = entries[i];
                        if (!entry) throw new TypeError(`BiomeState entry is undefined at index ${i}`);
                        const offset: number = 2 + i * 3;
                        serializedData[offset] = entry.biome_id.value & 0xff;
                        serializedData[offset + 1] = entry.biome_id.value >>> 8;
                        serializedData[offset + 2] = entry.state.value;
                    }
                    return serializedData;
                }
                default:
                    throw new TypeError(`Unknown BiomeState format: ${(data.value.format as { type: "byte"; value: number }).value}`);
            }
        },
    },
    /**
     * A value that indicates the finalization state of a chunk's data.
     *
     * Possible values:
     * - `0`: NeedsInstaticking - Chunk needs to be ticked
     * - `1`: NeedsPopulation - Chunk needs to be populated with mobs
     * - `2`: Done - Chunk generation is fully complete
     */
    FinalizedState: {
        // https://github.com/reedacartwright/rbedrock/blob/c9040e803c4172a19507bc8f1278802ad0e6170a/R/finalized_state.R#L4
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
     *
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L382
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L1445
     */
    ConversionData: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * The border block data for the chunk.
     *
     * @todo Add a better description for this.
     */
    BorderBlocks: {
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext?plain=1#L397
        // https://github.com/robofinch/Prismarine-Anchor/blob/main/crates/bedrock/leveldb-entries/src/entries/border_blocks.rs
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.BorderBlocks.parse | parse} method.
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
         * @throws {RangeError} If the buffer is empty.
         * @throws {RangeError} If the length of the buffer is not equal to the expected length based on the first byte.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.BorderBlocks {
            if (data.length < 1) throw new RangeError("BorderBlocks buffer must be at least 1 byte long");

            // FIXME: // REVIEW: This may actually need to be a varint.
            const count: number = data[0]!;

            if (data.length !== 1 + count) throw new RangeError(`BorderBlocks length mismatch, expected ${1 + count}, got ${data.length}`);

            const blocks: {
                x: { type: "byte"; value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 };
                z: { type: "byte"; value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 };
            }[] = new Array(count);

            for (let i = 0; i < count; i++) {
                const encoded: number = data[1 + i]!;
                const x: number = encoded >>> 4;
                const z: number = encoded & 0x0f;

                blocks[i] = {
                    x: { type: "byte", value: x as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 },
                    z: { type: "byte", value: z as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 },
                };
            }

            return {
                type: "compound",
                value: {
                    BorderBlocks: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: blocks,
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
         * @throws {TypeError} If one of the BorderBlocks entries are undefined.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.BorderBlocks): Buffer<ArrayBuffer> {
            const blocks: typeof data.value.BorderBlocks.value.value = data.value.BorderBlocks.value.value;
            const count: number = blocks.length;

            const serializedData: Buffer<ArrayBuffer> = Buffer.alloc(1 + count);

            // FIXME: // REVIEW: This may actually need to be a varint.
            serializedData[0] = count;

            for (let i = 0; i < count; i++) {
                const entry: (typeof blocks)[number] | undefined = blocks[i];
                if (!entry) throw new TypeError(`BorderBlocks entry is undefined at index ${i}`);

                const x: number = entry.x.value;
                const z: number = entry.z.value;

                serializedData[1 + i] = (x << 4) | (z & 0x0f);
            }

            return serializedData;
        },
    },
    /**
     * Bounding boxes for structure spawns, such as a Nether Fortress or Pillager Outpost.
     *
     * @deprecated Replaced with {@link entryContentTypeToFormatMap.AABBVolumes | AABBVolumes} in either 1.21.10 or one of the 1.21.10 previews.
     */
    HardcodedSpawners: {
        // https://github.com/reedacartwright/rbedrock/blob/c9040e803c4172a19507bc8f1278802ad0e6170a/man/HardcodedSpawnArea.Rd#L4
        // https://github.com/reedacartwright/rbedrock/blob/c9040e803c4172a19507bc8f1278802ad0e6170a/R/legacy-hsa.R#L44
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L405C5-L405C22
        //
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L1481
        // One of the sources seem to indicate this was removed in 1.21.10.
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.HardcodedSpawners.parse | parse} method.
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
         * @throws {RangeError} If the buffer is less than 4 bytes.
         * @throws {RangeError} If the length of the buffer is not equal to the expected length based on the first four bytes.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.HardcodedSpawners {
            if (data.length < 4) throw new RangeError("HardcodedSpawners buffer must be at least 4 bytes long");

            const count: number = data.readUInt32LE(0);

            if (data.length !== 4 + count * 25) throw new RangeError(`HardcodedSpawners length mismatch, expected ${4 + count * 25}, got ${data.length}`);

            const entries: NBTSchemas.NBTSchemaTypes.HardcodedSpawners["value"]["HardcodedSpawningAreas"]["value"]["value"] = new Array(count);

            let offset = 4;
            for (let i = 0; i < count; i++, offset += 25) {
                entries[i] = {
                    AABBMinX: { type: "int", value: data.readInt32LE(offset) },
                    AABBMinY: { type: "int", value: data.readInt32LE(offset + 4) },
                    AABBMinZ: { type: "int", value: data.readInt32LE(offset + 8) },
                    AABBMaxX: { type: "int", value: data.readInt32LE(offset + 12) },
                    AABBMaxY: { type: "int", value: data.readInt32LE(offset + 16) },
                    AABBMaxZ: { type: "int", value: data.readInt32LE(offset + 20) },
                    Type: { type: "byte", value: data[offset + 24]! as (typeof entries)[number]["Type"]["value"] },
                };
            }

            return {
                type: "compound",
                value: {
                    HardcodedSpawningAreas: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: entries,
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
         * @throws {TypeError} If one of the HardcodedSpawners entries are undefined.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.HardcodedSpawners): Buffer<ArrayBuffer> {
            const count: number = data.value.HardcodedSpawningAreas.value.value.length;
            const serializedData: Buffer<ArrayBuffer> = Buffer.alloc(4 + count * 25);

            serializedData.writeUInt32LE(count, 0);

            const entries: NBTSchemas.NBTSchemaTypes.HardcodedSpawners["value"]["HardcodedSpawningAreas"]["value"]["value"] =
                data.value.HardcodedSpawningAreas.value.value;

            let offset = 4;
            for (let i = 0; i < count; i++, offset += 25) {
                const entry: (typeof entries)[number] | undefined = entries[i];
                if (!entry) throw new TypeError(`HardcodedSpawners entry is undefined at index ${i}`);

                serializedData.writeInt32LE(entry.AABBMinX.value, offset);
                serializedData.writeInt32LE(entry.AABBMinY.value, offset + 4);
                serializedData.writeInt32LE(entry.AABBMinZ.value, offset + 8);
                serializedData.writeInt32LE(entry.AABBMaxX.value, offset + 12);
                serializedData.writeInt32LE(entry.AABBMaxY.value, offset + 16);
                serializedData.writeInt32LE(entry.AABBMaxZ.value, offset + 20);
                serializedData[offset + 24] = entry.Type.value;
            }

            return serializedData;
        },
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
     * UNDOCUMENTED.
     *
     * Possible values:
     * - `0`: False
     * - `1`: True
     *
     * @todo Try to get a world with this to see how it works.
     * @todo Add a description for this.
     *
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext?plain=1#L481
     *
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L1470
     * One of the sources seem to indicate this was added in 1.17.30.25. (Verify this, then add the \@since tag.)
     */
    GeneratedPreCavesAndCliffsBlending: {
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
         * [0]
         * ```
         */
        defaultValue: Buffer.from([0]),
    },
    /**
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     *
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L1471
     * One of the sources seem to indicate this was added in 1.17.30.25.
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
     * This is an unsigned 64-bit hex value (16 digits, 8 bytes).
     */
    MetaDataHash: {
        /**
         * The format type of the data.
         */
        type: "hex",
        /**
         * The default value to use when initializing a new entry.
         *
         * Bytes:
         * ```json
         * [0, 0, 0, 0, 0, 0, 0, 0]
         * ```
         */
        defaultValue: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
        /**
         * The minimum length of the data in bytes (if the hex data is a string of hexadecimal characters, two characters is one byte).
         */
        minLength: 8,
        /**
         * The maximum length of the data in bytes (if the hex data is a string of hexadecimal characters, two characters is one byte).
         */
        maxLength: 8,
    },
    /**
     * @todo Figure out how to parse this.
     * @todo Add a description for this.
     *
     * @see https://github.com/robofinch/Prismarine-Anchor/blob/main/crates/bedrock/leveldb-entries/src/entries/blending_data.rs#L10
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L526
     *
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L1475
     * One of the sources seem to indicate this was added in 1.17.30.
     */
    BlendingData: {
        /**
         * The format type of the data.
         */
        type: "unknown",
    },
    /**
     * The version of the actor digest data.
     *
     * Current known versions:
     * - `0`: 1.18.30 Format
     */
    ActorDigestVersion: {
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L526
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
         * [0]
         * ```
         */
        defaultValue: Buffer.from([0]),
    },
    /**
     * The version of a chunk for versions < 1.16.100.
     *
     * Deleting this key causes the game to completely regenerate the corresponding chunk.
     *
     * Possible values:
     * - `0`: v0.9.0
     * - `1`: v0.9.2
     * - `2`: v0.9.5
     * - `3`: v0.17.0.1
     * - `4`: v1.1.0
     * - `5`: Converted from console to v1.1.0
     * - `6`: v1.2.0.2
     * - `7`: v1.2.0
     * - `8`: v1.2.13
     * - `9`: v1.8.0
     * - `10`: v1.9.0
     * - `11`: v1.11.0.1
     * - `12`: v1.11.0.3
     * - `13`: v1.11.0.4
     * - `14`: v1.11.1
     * - `15`: v1.12.0.4
     * - `16`: v1.14.0
     * - `17`: v1.15.0
     * - `18`: v1.16.0.51
     * - `19`: v1.16.0
     *
     * @see {@link chunkLegacyVersionDetailsMap}
     *
     * @deprecated Only used in versions < 1.16.100. Later versions use {@link entryContentTypeToFormatMap.Version | Version}
     */
    LegacyVersion: {
        // https://github.com/reedacartwright/rbedrock/blob/c9040e803c4172a19507bc8f1278802ad0e6170a/R/legacy-chunk_version.R
        // https://github.com/robofinch/Prismarine-Anchor/blob/6ce90fa2a27c5d81e6cc1cc376e91c757a80e321/crates/bedrock/bedrock-entries/src/enum_types/chunk_version.rs
        // https://github.com/reedacartwright/rbedrock/blob/c9040e803c4172a19507bc8f1278802ad0e6170a/man/LegacyChunkVersion.Rd
        // Value list: https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L98
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L602
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
     * @since 0.12.0 < x <= 0.15.0
     *
     * @todo Add a schema for this.
     * @todo Add a description for this.
     * @todo Figure out what version this was added and removed in.
     */
    MVillages: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The data of all of the villages in the world.
     *
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.12.0.1 world.
     *
     * @see {@link NBTSchemas.nbtSchemas.Villages}
     *
     * @since 0.9.0 <= x <= 0.12.0
     *
     * @todo Add a description for this.
     * @todo Figure out what version this was added and removed in.
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
     * The data of a player from Legacy Console Edition.
     *
     * @todo Add a schema for this.
     */
    LegacyConsolePlayer: {
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
    // IDEA: Maybe make an exported parser and serializer NBT function that just supports strings with both UTF-8 and binary encodings, like with the parser and serializer for the ActorPrefix content type.
    ActorPrefix: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.ActorPrefix.parse | parse} method.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.ActorPrefix & Pick<NBT.NBT, "name"> {
            function decodeMaybeUtf8(binaryString: string): string {
                const decoded: string = Buffer.from(binaryString, "binary").toString("utf8");
                return decoded.includes("\uFFFD") ? binaryString : decoded;
            }
            function isStorageKeyPath(path: readonly string[]): boolean {
                return (
                    path.length >= 5 &&
                    path[path.length - 5] === "internalComponents" &&
                    path[path.length - 4] === "EntityStorageKeyComponent" &&
                    path[path.length - 3] === "StorageKey"
                );
            }
            function convertParsedStrings<T extends NBT.Tags[NBT.TagType] | { type: "end"; value: [] } | string | number | undefined>(
                tag: T,
                path: readonly string[] = []
            ): T {
                if (!tag || typeof tag !== "object") return tag;

                if (tag.type === "string" && !isStorageKeyPath(path)) {
                    tag.value = decodeMaybeUtf8(tag.value);
                    return tag;
                }

                if (tag.type === "compound") {
                    const obj = tag.value;
                    for (const key in obj) {
                        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                        obj[key] = convertParsedStrings(obj[key], [...path, key]);
                    }
                    return tag;
                }

                if (tag.type === "list") {
                    const arr = tag.value.value;
                    for (let i = 0; i < arr.length; i++) {
                        arr[i] = convertParsedStrings({ type: tag.value.type, value: arr[i]! } as NBT.Tags[NBT.TagType], [...path, String(i)]).value;
                    }
                    return tag;
                }

                return tag;
            }

            protoLEBinaryStringEncoding.setVariable("noArraySizeCheck", undefined);

            const parsedData: ExtendedResults = protoLEBinaryStringEncoding.parsePacketBuffer("nbt", data, 0);
            convertParsedStrings(parsedData.data);

            return parsedData.data as NBTSchemas.NBTSchemaTypes.ActorPrefix & Pick<NBT.NBT, "name">;
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         *
         * @throws {unknown} If an error occurs while parsing the data.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.ActorPrefix & Partial<Pick<NBT.NBT, "name">>): Buffer<ArrayBuffer> {
            // function encodeUtf8AsBinary(utf8String: string): string {
            //     return Buffer.from(utf8String, "utf8").toString("binary");
            // }
            function encodeMaybeUtf8(str: string): string {
                const decoded: string = Buffer.from(str, "binary").toString("utf8");
                if (decoded.includes("\uFFFD")) return str;

                return Buffer.from(str, "utf8").toString("binary");
            }

            function isStorageKeyPath(path: string[]): boolean {
                return (
                    path.length >= 5 &&
                    path[path.length - 5] === "internalComponents" &&
                    path[path.length - 4] === "EntityStorageKeyComponent" &&
                    path[path.length - 3] === "StorageKey"
                );
            }
            function convertSerializedStrings<T extends NBT.Tags[NBT.TagType] | { type: "end"; value: [] } | string | number | undefined>(
                tag: T,
                path: string[] = []
            ): T {
                if (!tag || typeof tag !== "object") return tag;

                if (tag.type === "string" && !isStorageKeyPath(path)) {
                    tag.value = encodeMaybeUtf8(tag.value);
                    return tag;
                }

                if (tag.type === "compound") {
                    const obj = tag.value;
                    for (const key in obj) {
                        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                        obj[key] = convertSerializedStrings(obj[key], [...path, key]);
                    }
                    return tag;
                }

                if (tag.type === "list") {
                    const arr = tag.value.value;
                    for (let i = 0; i < arr.length; i++) {
                        arr[i] = convertSerializedStrings({ type: tag.value.type, value: arr[i]! } as NBT.Tags[NBT.TagType], [...path, String(i)]).value;
                    }
                    return tag;
                }

                return tag;
            }
            // cloneNBT is actually 5x faster that JSON.parse(JSON.stringify(obj)) and 10x faster than structuredClone(obj).
            // function deepClone<T>(obj: T): T {
            //     // In case an older environment that doesn't support structuredClone is being used.
            //     if (typeof structuredClone === "undefined") return JSON.parse(JSON.stringify(obj)) as T;
            //     return structuredClone(obj);
            // }
            function cloneNBT<T>(node: T, isTag = true): T {
                if (node === null || typeof node !== "object") return node;

                if (isTag) {
                    const { type, value } = node as unknown as NBT.Tags[NBT.TagType];

                    if (type === "list") {
                        const elemType = value.type;
                        const arr = value.value;

                        const clonedArr = arr.map((elem) => {
                            if (elemType === "compound" || elemType === "list") return cloneNBT(elem, false);
                            return elem;
                        });

                        return {
                            type: "list",
                            value: {
                                type: elemType,
                                value: clonedArr,
                            },
                        } as T;
                    }

                    return {
                        ...("name" in node && { name: node.name }),
                        type,
                        value: cloneNBT(value, false),
                    } as T;
                }

                if (Array.isArray(node)) {
                    return node.map((elem: unknown): unknown => cloneNBT(elem, false)) as T;
                }

                const out: T = {} as T;
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    out[key] = cloneNBT(node[key], false);
                }
                return out;
            }

            const reencodedData: NBTSchemas.NBTSchemaTypes.ActorPrefix & Partial<Pick<NBT.NBT, "name">> = cloneNBT(data);
            reencodedData.name ??= "";
            convertSerializedStrings(reencodedData);

            const serializedData: Buffer = protoLEBinaryStringEncoding.createPacketBuffer("nbt", reencodedData);
            return Buffer.from(serializedData);
        },
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
         * @throws {unknown} If an error occurs while parsing the data.
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
         * @throws {unknown} If an error occurs while parsing the data.
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
        /**
         * The default value to use when initializing a new entry.
         *
         * @todo Add a link to the object with the default level.dat value once it is made.
         */
        get defaultValue(): Buffer<ArrayBuffer> {
            const nbtData: Buffer = NBT.writeUncompressed(
                {
                    type: "compound",
                    name: "",
                    value: {
                        colors: {
                            type: "byteArray",
                            value: new Array<number>(65536).fill(0),
                        },
                        decorations: {
                            type: "list",
                            value: {
                                type: "end" as NBT.TagType.Compound,
                                value: [],
                            },
                        },
                        dimension: {
                            type: "byte",
                            value: 0,
                        },
                        fullyExplored: {
                            type: "byte",
                            value: 0,
                        },
                        height: {
                            type: "short",
                            value: 128,
                        },
                        mapId: {
                            type: "long",
                            value: [0, 0],
                        },
                        mapLocked: {
                            type: "byte",
                            value: 0,
                        },
                        parentMapId: {
                            type: "long",
                            value: [0, 0],
                        },
                        scale: {
                            type: "byte",
                            value: 0,
                        },
                        unlimitedTracking: {
                            type: "byte",
                            value: 0,
                        },
                        width: {
                            type: "short",
                            value: 128,
                        },
                        xCenter: {
                            type: "int",
                            value: 0,
                        },
                        zCenter: {
                            type: "int",
                            value: 0,
                        },
                    },
                } satisfies NBTSchemas.NBTSchemaTypes.Map & Pick<NBT.NBT, "name">,
                "little"
            );
            const result: Buffer<ArrayBuffer> = Buffer.concat([nbtData]);
            Object.defineProperty(this, "defaultValue", { value: result, configurable: true, enumerable: true, writable: false });
            return result;
        },
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
     * The data for a structure (the kind saved by a structure block or the [`/structure`](https://minecraft.wiki/w/Commands/structure) command).
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
     * @todo Add a schema for this.
     * @todo Add a default value for this.
     *
     * @see https://github.com/robofinch/Prismarine-Anchor/blob/main/crates/bedrock/leveldb-entries/src/entries/flat_world_layers.rs
     */
    FlatWorldLayers: {
        /**
         * The format type of the data.
         */
        type: "JSON",
    },
    /**
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.15.0 world.
     *
     * @todo Add a description for this.
     *
     * @see https://github.com/robofinch/Prismarine-Anchor/blob/main/crates/bedrock/leveldb-entries/src/entries/level_spawn_was_fixed.rs
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
     * @see {@link NBTSchemas.nbtSchemas.PositionTrackingDB}
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
     * @see {@link NBTSchemas.nbtSchemas.PositionTrackingLastId}
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
     * This may have fields corresponding to Nether or The End structure types instead if the generator type is set to 3 (Nether) or 4 (The End) respectively.
     *
     * This content type coexists with the {@link entryContentTypeToFormatMap.Overworld | Overworld} content type in some versions (such as v1.0.0.16 and v1.1.5.0).
     *
     * @deprecated It is unknown when this was removed, it was found in a Windows 10 Edition Beta v0.15.0 world.
     *
     * @see {@link NBTSchemas.nbtSchemas.LegacyOverworldStructures}
     */
    LegacyOverworldStructures: {
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
     * @see {@link NBTSchemas.nbtSchemas.LegacyNetherStructures}
     */
    LegacyNetherStructures: {
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
     * @see {@link NBTSchemas.nbtSchemas.LegacyTheEndStructures}
     */
    LegacyTheEndStructures: {
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
     * The data of the a Minecraft China Edition development dimension (dm3-dm20).
     *
     * @see {@link NBTSchemas.nbtSchemas.Overworld}
     *
     * @platform Minecraft China Edition
     */
    MCChinaDevDimension: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The data of a custom dimension.
     *
     * @see {@link NBTSchemas.nbtSchemas.CustomDimension}
     */
    CustomDimension: {
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
    // TODO: See how this worked when the `Creation of Custom Biomes` experimental toggle still existed, and as it was being developed.
    BiomeIdsTable: {
        /**
         * The format type of the data.
         */
        type: "NBT",
    },
    /**
     * The content type of the `DimensionNameIdTable` LevelDB key, which stores the numeric ID mappings for custom biomes.
     *
     * @see {@link NBTSchemas.nbtSchemas.DimensionNameIdTable}
     */
    DimensionNameIdTable: {
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
     * The content type of the `WorldClocks` LevelDB key, which serves an unknown purpose.
     *
     * @see {@link NBTSchemas.nbtSchemas.WorldClocks}
     *
     * @since 1.26.10 (maybe 1.26.0)
     *
     * @todo Figure out that this is used for.
     * @todo Figure out what preview and full release this was actually added in.
     */
    WorldClocks: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        /**
         * The default value to use when initializing a new entry.
         *
         * Value:
         * ```json
         * {
         *     type: "compound",
         *     name: "",
         *     value: {
         *         clocks: {
         *             type: "list",
         *             value: {
         *                 type: "end",
         *                 value: [],
         *             },
         *         },
         *     },
         * }
         * ```
         */
        defaultValue: NBT.writeUncompressed(
            {
                type: "compound",
                name: "",
                value: {
                    clocks: {
                        type: "list",
                        value: {
                            type: "end" as NBT.TagType.Compound,
                            value: [],
                        },
                    },
                },
            } satisfies NBTSchemas.NBTSchemaTypes.WorldClocks & Pick<NBT.NBT, "name">,
            "little"
        ),
    },
    /**
     * The content type of the `poi_types` LevelDB key, which stores a map of numeric POI types to their namespaced IDs.
     *
     * @see {@link NBTSchemas.nbtSchemas.POITypes}
     *
     * @since ? (This was found in a 1.26.51.1 world, but it might have been added in 1.21.130)
     *
     * @todo Figure out what preview and full release this was actually added in.
     */
    POITypes: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.POITypes.parse | parse} method.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.POITypes {
            if (data.length < 1) {
                throw new Error("POITypes buffer must be at least 1 byte long");
            }
            const types: NBTSchemas.NBTSchemaTypes.POITypes["value"]["POITypes"]["value"]["value"] = [];
            let i = 0;
            /**
             * Applies the new offset from reading a VarString or varint to the {@link i | current offset} and returns the value of the VarString or varint.
             *
             * @param result The result of the {@link readVarString} or {@link readLittleVarint} function.
             * @returns The string value of the VarString or varint.
             */
            function applyVarVal<T extends ReadVarStringResult | ReadLittleVarintResult>(result: T): T["value"] {
                i = result.offset;
                return result.value;
            }
            const typeCount: number = applyVarVal(readLittleVarint(data, i));
            void typeCount;
            while (i < data.length) {
                const type: number = data.readUInt16LE(i);
                i += 2;
                const id: string = applyVarVal(readVarString(data, i, "utf8"));
                types.push({
                    type: { type: "short", value: type },
                    id: { type: "string", value: id },
                });
            }
            return {
                type: "compound",
                value: {
                    POITypes: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: types,
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
        serialize(data: NBTSchemas.NBTSchemaTypes.POITypes): Buffer<ArrayBuffer> {
            const types: Buffer<ArrayBuffer>[] = [];
            for (const type of data.value.POITypes.value.value) {
                const buf: Buffer<ArrayBuffer> = Buffer.alloc(2);
                buf.writeUInt16LE(type.type.value & 0xffff, 0);
                types.push(Buffer.concat([buf, writeVarString(type.id.value, "utf8")]));
            }
            types.unshift(Buffer.from(writeLittleVarint(types.length)));
            return Buffer.concat(types);
        },
    },
    /**
     * A registry of all POI regions in a dimension.
     *
     * @see {@link NBTSchemas.nbtSchemas.POIRegionRegistry}
     *
     * @since ? (This was found in a 1.26.51.1 world, but it might have been added in 1.21.130)
     *
     * @todo Figure out what preview and full release this was actually added in.
     */
    POIRegionRegistry: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.POIRegionRegistry.parse | parse} method.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.POIRegionRegistry {
            if (data.length < 1) {
                throw new Error("POIRegionRegistry buffer must be at least 1 byte long");
            }
            const regions: NBTSchemas.NBTSchemaTypes.POIRegionRegistry["value"]["POIRegionRegistry"]["value"]["value"] = [];
            let i = 0;
            /**
             * Applies the new offset from reading a VarString or varint to the {@link i | current offset} and returns the value of the VarString or varint.
             *
             * @param result The result of the {@link readVarString} or {@link readLittleVarint} function.
             * @returns The string value of the VarString or varint.
             */
            function applyVarVal<T extends ReadVarStringResult | ReadLittleVarintResult>(result: T): T["value"] {
                i = result.offset;
                return result.value;
            }
            const regionCount: number = applyVarVal(readLittleVarint(data, i));
            void regionCount;
            while (i < data.length) {
                const key: string = applyVarVal(readVarString(data, i, "utf8"));
                const x: number = data.readInt32LE(i);
                i += 4;
                const z: number = data.readInt32LE(i);
                i += 4;
                regions.push({
                    key: { type: "string", value: key },
                    pos: {
                        type: "list",
                        value: {
                            type: "int",
                            value: [x, z],
                        },
                    },
                });
            }
            return {
                type: "compound",
                value: {
                    POIRegionRegistry: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: regions,
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
        serialize(data: NBTSchemas.NBTSchemaTypes.POIRegionRegistry): Buffer<ArrayBuffer> {
            const regions: Buffer<ArrayBuffer>[] = [];
            for (const type of data.value.POIRegionRegistry.value.value) {
                const buf: Buffer<ArrayBuffer> = Buffer.alloc(8);
                buf.writeInt32LE(type.pos.value.value[0], 0);
                buf.writeInt32LE(type.pos.value.value[1], 4);
                regions.push(Buffer.concat([writeVarString(type.key.value, "utf8"), buf]));
            }
            regions.unshift(Buffer.from(writeLittleVarint(regions.length)));
            return Buffer.concat(regions);
        },
    },
    /**
     * The POI data of a 512x512 region of the world.
     *
     * @see {@link NBTSchemas.nbtSchemas.POIRegion}
     *
     * @since ? (This was found in a 1.26.51.1 world, but it might have been added in 1.21.130)
     *
     * @todo Figure out what preview and full release this was actually added in.
     * @temp When this bug is fixed add support for the new key format: https://mojira.dev/MCPE-242992
     */
    POIRegion: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.POIRegion.parse | parse} method.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.POIRegion {
            if (data.length < 1) {
                throw new Error("POIRegion buffer must be at least 1 byte long");
            }
            const entries: NBTSchemas.NBTSchemaTypes.POIRegion["value"]["POIRegion"]["value"]["value"] = [];
            let i = 0;
            /**
             * Applies the new offset from reading a VarString or varint to the {@link i | current offset} and returns the value of the VarString or varint.
             *
             * @param result The result of the {@link readVarString} or {@link readLittleVarint} function.
             * @returns The string value of the VarString or varint.
             */
            function applyVarVal<T extends ReadVarStringResult | ReadLittleVarintResult>(result: T): T["value"] {
                i = result.offset;
                return result.value;
            }
            const entryCount: number = applyVarVal(readLittleVarint(data, i));
            void entryCount;
            while (i < data.length) {
                const rawKey: number = data.readUInt32LE(i);
                i += 4;
                if ((0b11111000_00000000_00000000_00000000 & rawKey) !== 0) {
                    throw new TypeError(`Unknown POIRegion entry key format: 0x${rawKey.toString(16)} (0b${rawKey.toString(2)})`);
                }
                const z = (0b00000111_11111100_00000000_00000000 & rawKey) >> 18;
                const y = (0b00000000_00000011_11111110_00000000 & rawKey) >> 9;
                const x = 0b00000000_00000000_00000001_11111111 & rawKey;
                const type = data.readUInt16LE(i);
                i += 2;
                const tickets = data[i++]!;
                entries.push({
                    type: { type: "short", value: type },
                    tickets: { type: "byte", value: tickets },
                    pos: {
                        type: "list",
                        value: {
                            type: "short",
                            value: [x, y, z],
                        },
                    },
                });
            }
            return {
                type: "compound",
                value: {
                    POIRegion: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: entries,
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
        serialize(data: NBTSchemas.NBTSchemaTypes.POIRegion): Buffer<ArrayBuffer> {
            const buf: Buffer<ArrayBuffer> = Buffer.alloc(7 * data.value.POIRegion.value.value.length);
            let i = 0;
            for (const type of data.value.POIRegion.value.value) {
                let rawKey = 0;
                rawKey |= (type.pos.value.value[2] & 0b1_11111111) << 18; // z
                rawKey |= (type.pos.value.value[1] & 0b1_11111111) << 9; // y
                rawKey |= type.pos.value.value[0] & 0b1_11111111; // x
                buf.writeUInt32LE(rawKey, i);
                i += 4;
                buf.writeUInt16LE(type.type.value & 0xffff, i);
                i += 2;
                buf.writeUInt8(type.tickets.value & 0xff, i++);
            }
            return Buffer.concat([Buffer.from(writeLittleVarint(data.value.POIRegion.value.value.length)), buf]);
        },
    },
    /**
     * Bounding boxes for structures, including structure spawns (such as a Pillager Outpost)
     * and volumes where mobs cannot spawn through the normal biome-based means (such as
     * Trial Chambers).
     *
     * @see {@link NBTSchemas.nbtSchemas.AABBVolumes}
     *
     * @since 1.21.20 (or some 1.21.20 preview)
     */
    AABBVolumes: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.AABBVolumes.parse | parse} method.
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
         * @throws {RangeError} If the buffer is less than 4 bytes.
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.AABBVolumes {
            if (data.length < 4) throw new RangeError("AABBVolumes buffer must be at least 4 bytes long");

            const version: number = data.readUInt32LE(0);

            if (version !== 1) throw new Error(`Unsupported AABBVolumes version: ${version}`);

            let offset = 4;

            const structureTypeCount: number = data.readUInt32LE(offset);
            const structureTypes: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["StructureTypes"]["value"]["value"] = new Array(structureTypeCount);
            offset += 4;

            for (let i = 0; i < structureTypeCount; i++) {
                const structureTypeLength: number = data.readUInt16LE(offset + 4);
                const structureType: string = data.toString("utf-8", offset + 6, offset + 6 + structureTypeLength);
                structureTypes[i] = {
                    Id: { type: "int", value: data.readUInt32LE(offset) },
                    Type: { type: "string", value: structureType as (typeof structureTypes)[number]["Type"]["value"] },
                };
                offset += 6 + structureTypeLength;
            }

            const chunkBoundingBoxCount: number = data.readUInt32LE(offset);
            const chunkBoundingBoxes: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["ChunkBoundingBoxes"]["value"]["value"] = new Array(chunkBoundingBoxCount);
            offset += 4;

            for (let i = 0; i < chunkBoundingBoxCount; i++, offset += 28) {
                chunkBoundingBoxes[i] = {
                    Id: { type: "int", value: data.readInt32LE(offset) },
                    AABBMinX: { type: "int", value: data.readInt32LE(offset + 4) },
                    AABBMinY: { type: "int", value: data.readInt32LE(offset + 8) },
                    AABBMinZ: { type: "int", value: data.readInt32LE(offset + 12) },
                    AABBMaxX: { type: "int", value: data.readInt32LE(offset + 16) },
                    AABBMaxY: { type: "int", value: data.readInt32LE(offset + 20) },
                    AABBMaxZ: { type: "int", value: data.readInt32LE(offset + 24) },
                };
            }

            const dynamicSpawnAreaCount: number = data.readUInt32LE(offset);
            const dynamicSpawnAreas: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["DynamicSpawnAreas"]["value"]["value"] = new Array(dynamicSpawnAreaCount);
            offset += 4;

            for (let i = 0; i < dynamicSpawnAreaCount; i++, offset += 12) {
                dynamicSpawnAreas[i] = {
                    BoundingBoxId: { type: "int", value: data.readUInt32LE(offset) },
                    StructureId: { type: "int", value: data.readUInt32LE(offset + 4) },
                    FullBoundingBox: { type: "int", value: data.readUInt32LE(offset + 8) as 0 | 1 },
                };
            }

            const staticSpawnAreaCount: number = data.readUInt32LE(offset);
            const staticSpawnAreas: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["StaticSpawnAreas"]["value"]["value"] = new Array(staticSpawnAreaCount);
            offset += 4;

            for (let i = 0; i < staticSpawnAreaCount; i++, offset += 16) {
                staticSpawnAreas[i] = {
                    BoundingBoxId: { type: "int", value: data.readUInt32LE(offset) },
                    StructureId: { type: "int", value: data.readUInt32LE(offset + 4) },
                    HeightDifference: { type: "int", value: data.readInt32LE(offset + 8) },
                    FullBoundingBox: { type: "int", value: data.readUInt32LE(offset + 12) as 0 | 1 },
                };
            }

            return {
                type: "compound",
                value: {
                    version: { type: "int", value: version },
                    StructureTypes: { type: "list", value: { type: "compound", value: structureTypes } },
                    ChunkBoundingBoxes: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: chunkBoundingBoxes,
                        },
                    },
                    DynamicSpawnAreas: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: dynamicSpawnAreas,
                        },
                    },
                    StaticSpawnAreas: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: staticSpawnAreas,
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
         * @throws {TypeError} If one of the StructureTypes entries are undefined.
         * @throws {TypeError} If one of the ChunkBoundingBoxes entries are undefined.
         * @throws {TypeError} If one of the DynamicSpawnAreas entries are undefined.
         * @throws {TypeError} If one of the StaticSpawnAreas entries are undefined.
         * @throws {unknown} If an error occurs while serializing the data.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.AABBVolumes): Buffer<ArrayBuffer> {
            const structureTypeCount: number = data.value.StructureTypes.value.value.length;
            const chunkBoundingBoxCount: number = data.value.ChunkBoundingBoxes.value.value.length;
            const dynamicSpawnAreaCount: number = data.value.DynamicSpawnAreas.value.value.length;
            const staticSpawnAreaCount: number = data.value.StaticSpawnAreas.value.value.length;
            const serializedData: Buffer<ArrayBuffer> = Buffer.alloc(
                20 +
                    structureTypeCount * 6 +
                    data.value.StructureTypes.value.value.reduce(
                        (a: number, b: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["StructureTypes"]["value"]["value"][number]): number =>
                            a + b.Type.value.length,
                        0
                    ) +
                    chunkBoundingBoxCount * 28 +
                    dynamicSpawnAreaCount * 12 +
                    staticSpawnAreaCount * 16
            );

            serializedData.writeUInt32LE(data.value.version.value >>> 0, 0);

            const structureTypes: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["StructureTypes"]["value"]["value"] = data.value.StructureTypes.value.value;

            let offset = 4;

            serializedData.writeUInt32LE(structureTypeCount, offset);
            offset += 4;

            for (let i = 0; i < structureTypeCount; i++) {
                const entry: (typeof structureTypes)[number] | undefined = structureTypes[i];
                if (entry === undefined) throw new TypeError(`StructureTypes entry is undefined at index ${i}`);

                const value: string = entry.Type.value;
                serializedData.writeUInt32LE(entry.Id.value >>> 0, offset);
                const stringByteLength: number = serializedData.write(value, offset + 6, "utf-8");
                serializedData.writeUInt16LE(stringByteLength, offset + 4);
                offset += 6 + stringByteLength;
            }

            const chunkBoundingBoxes: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["ChunkBoundingBoxes"]["value"]["value"] =
                data.value.ChunkBoundingBoxes.value.value;

            serializedData.writeUInt32LE(chunkBoundingBoxCount, offset);
            offset += 4;

            for (let i = 0; i < chunkBoundingBoxCount; i++, offset += 28) {
                const entry: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["ChunkBoundingBoxes"]["value"]["value"][number] | undefined = chunkBoundingBoxes[i];
                if (!entry) throw new TypeError(`ChunkBoundingBoxes entry is undefined at index ${i}`);

                serializedData.writeUInt32LE(entry.Id.value >>> 0, offset);
                serializedData.writeInt32LE(entry.AABBMinX.value, offset + 4);
                serializedData.writeInt32LE(entry.AABBMinY.value, offset + 8);
                serializedData.writeInt32LE(entry.AABBMinZ.value, offset + 12);
                serializedData.writeInt32LE(entry.AABBMaxX.value, offset + 16);
                serializedData.writeInt32LE(entry.AABBMaxY.value, offset + 20);
                serializedData.writeInt32LE(entry.AABBMaxZ.value, offset + 24);
            }

            const dynamicSpawnAreas: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["DynamicSpawnAreas"]["value"]["value"] =
                data.value.DynamicSpawnAreas.value.value;

            serializedData.writeUInt32LE(dynamicSpawnAreaCount, offset);
            offset += 4;

            for (let i = 0; i < dynamicSpawnAreaCount; i++, offset += 12) {
                const entry: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["DynamicSpawnAreas"]["value"]["value"][number] | undefined = dynamicSpawnAreas[i];
                if (!entry) throw new TypeError(`DynamicSpawnAreas entry is undefined at index ${i}`);

                serializedData.writeUInt32LE(entry.BoundingBoxId.value >>> 0, offset);
                serializedData.writeUInt32LE(entry.StructureId.value >>> 0, offset + 4);
                serializedData.writeUInt32LE(entry.FullBoundingBox.value >>> 0, offset + 8);
            }

            const staticSpawnAreas: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["StaticSpawnAreas"]["value"]["value"] =
                data.value.StaticSpawnAreas.value.value;

            serializedData.writeUInt32LE(staticSpawnAreaCount, offset);
            offset += 4;

            for (let i = 0; i < staticSpawnAreaCount; i++, offset += 16) {
                const entry: NBTSchemas.NBTSchemaTypes.AABBVolumes["value"]["StaticSpawnAreas"]["value"]["value"][number] | undefined = staticSpawnAreas[i];
                if (!entry) throw new TypeError(`StaticSpawnAreas entry is undefined at index ${i}`);

                serializedData.writeUInt32LE(entry.BoundingBoxId.value >>> 0, offset);
                serializedData.writeUInt32LE(entry.StructureId.value >>> 0, offset + 4);
                serializedData.writeInt32LE(entry.HeightDifference.value, offset + 8);
                serializedData.writeUInt32LE(entry.FullBoundingBox.value >>> 0, offset + 12);
            }

            return serializedData;
        },
    },
    /**
     * @see {@link NBTSchemas.nbtSchemas.JigsawStructureBlueprint}
     *
     * @since ? (This was found in a 1.26.51.1 world, but it might have been added in 1.21.50)
     *
     * @todo Add a description for this.
     * @todo Figure out what preview and full release this was actually added in.
     */
    JigsawStructureBlueprint: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.JigawStructureBlueprint.parse | parse} method.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.JigsawStructureBlueprint {
            if (data.length < 38) {
                throw new Error("JigsawStructureBlueprint buffer must be at least 38 bytes long");
            }
            const pos: [x: number, y: number, z: number] = [data.readInt32LE(0), data.readInt32LE(4), data.readInt32LE(8)];
            const minBounds: [x: number, y: number, z: number] = [data.readInt32LE(12), data.readInt32LE(16), data.readInt32LE(20)];
            const maxBounds: [x: number, y: number, z: number] = [data.readInt32LE(24), data.readInt32LE(28), data.readInt32LE(32)];
            let i = 36;
            /**
             * Applies the new offset from reading a VarString or varint to the {@link i | current offset} and returns the value of the VarString or varint.
             *
             * @param result The result of the {@link readVarString} or {@link readLittleVarint} function.
             * @returns The string value of the VarString or varint.
             */
            function applyVarVal<T extends ReadVarStringResult | ReadLittleVarintResult>(result: T): T["value"] {
                i = result.offset;
                return result.value;
            }
            const structure: string = applyVarVal(readVarString(data, i));

            const sections: NBTSchemas.NBTSchemaTypes.JigsawStructureBlueprint["value"]["sections"]["value"]["value"] = [];
            const sectionCount: number = applyVarVal(readLittleVarint(data, i));
            void sectionCount;
            while (i < data.length) {
                const elementID: string = applyVarVal(readVarString(data, i));
                const groundOffset: number = data.readInt32LE(i);
                i += 4;
                const boundingBoxMin: [x: number, y: number, z: number] = [data.readInt32LE(i), data.readInt32LE(i + 4), data.readInt32LE(i + 8)];
                i += 12;
                const boundingBoxMax: [x: number, y: number, z: number] = [data.readInt32LE(i), data.readInt32LE(i + 4), data.readInt32LE(i + 8)];
                i += 12;
                const position: [x: number, y: number, z: number] = [data.readInt32LE(i), data.readInt32LE(i + 4), data.readInt32LE(i + 8)];
                i += 12;
                const rotation: string = applyVarVal(readVarString(data, i));
                const junctions: (typeof sections)[number]["junctions"]["value"]["value"] = [];
                const junctionCount: number = applyVarVal(readLittleVarint(data, i));
                for (let j = 0; j < junctionCount; j++) {
                    const sourceX: number = data.readInt32LE(i);
                    i += 4;
                    const sourceGroundY: number = data.readInt32LE(i);
                    i += 4;
                    const sourceZ: number = data.readInt32LE(i);
                    i += 4;
                    const deltaY: number = data.readInt32LE(i);
                    i += 4;
                    const destProjection: string = applyVarVal(readVarString(data, i));
                    junctions.push({
                        sourceX: { type: "int", value: sourceX },
                        sourceGroundY: { type: "int", value: sourceGroundY },
                        sourceZ: { type: "int", value: sourceZ },
                        deltaY: { type: "int", value: deltaY },
                        destProjection: { type: "string", value: destProjection },
                    });
                }
                sections.push({
                    elementID: { type: "string", value: elementID },
                    groundOffset: { type: "int", value: groundOffset },
                    boundingBox: {
                        type: "compound",
                        value: {
                            min: {
                                type: "list",
                                value: {
                                    type: "int",
                                    value: boundingBoxMin,
                                },
                            },
                            max: {
                                type: "list",
                                value: {
                                    type: "int",
                                    value: boundingBoxMax,
                                },
                            },
                        },
                    },
                    position: {
                        type: "list",
                        value: {
                            type: "int",
                            value: position,
                        },
                    },
                    rotation: { type: "string", value: rotation },
                    junctions: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: junctions,
                        },
                    },
                });
            }
            return {
                type: "compound",
                value: {
                    pos: {
                        type: "list",
                        value: {
                            type: "int",
                            value: pos,
                        },
                    },
                    minBounds: {
                        type: "list",
                        value: {
                            type: "int",
                            value: minBounds,
                        },
                    },
                    maxBounds: {
                        type: "list",
                        value: {
                            type: "int",
                            value: maxBounds,
                        },
                    },
                    structure: { type: "string", value: structure },
                    sections: {
                        type: "list",
                        value: {
                            type: "compound",
                            value: sections,
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
        serialize(data: NBTSchemas.NBTSchemaTypes.JigsawStructureBlueprint): Buffer<ArrayBuffer> {
            const locMetaBuf: Buffer<ArrayBuffer> = Buffer.alloc(36);
            locMetaBuf.writeUInt32LE(data.value.pos.value.value[0], 0); // x
            locMetaBuf.writeUInt32LE(data.value.pos.value.value[1], 4); // y
            locMetaBuf.writeUInt32LE(data.value.pos.value.value[2], 8); // z
            locMetaBuf.writeUInt32LE(data.value.minBounds.value.value[0], 12); // x
            locMetaBuf.writeUInt32LE(data.value.minBounds.value.value[1], 16); // y
            locMetaBuf.writeUInt32LE(data.value.minBounds.value.value[2], 20); // z
            locMetaBuf.writeUInt32LE(data.value.maxBounds.value.value[0], 24); // x
            locMetaBuf.writeUInt32LE(data.value.maxBounds.value.value[1], 28); // y
            locMetaBuf.writeUInt32LE(data.value.maxBounds.value.value[2], 32); // z

            const structureBuf: Buffer<ArrayBuffer> = writeVarString(data.value.structure.value);

            const sections: Buffer<ArrayBuffer>[] = [];
            for (const type of data.value.sections.value.value) {
                const elementIDBuf: Buffer<ArrayBuffer> = writeVarString(type.elementID.value);

                const sectionLocMetaBuf: Buffer<ArrayBuffer> = Buffer.alloc(40);
                sectionLocMetaBuf.writeInt32LE(type.groundOffset.value, 0);
                sectionLocMetaBuf.writeInt32LE(type.boundingBox.value.min.value.value[0], 4);
                sectionLocMetaBuf.writeInt32LE(type.boundingBox.value.min.value.value[1], 8);
                sectionLocMetaBuf.writeInt32LE(type.boundingBox.value.min.value.value[2], 12);
                sectionLocMetaBuf.writeInt32LE(type.boundingBox.value.max.value.value[0], 16);
                sectionLocMetaBuf.writeInt32LE(type.boundingBox.value.max.value.value[1], 20);
                sectionLocMetaBuf.writeInt32LE(type.boundingBox.value.max.value.value[2], 24);
                sectionLocMetaBuf.writeInt32LE(type.position.value.value[0], 28);
                sectionLocMetaBuf.writeInt32LE(type.position.value.value[1], 32);
                sectionLocMetaBuf.writeInt32LE(type.position.value.value[2], 36);

                const rotationBuf: Buffer<ArrayBuffer> = writeVarString(type.rotation.value);

                const junctions: Buffer<ArrayBuffer>[] = [];
                for (const junction of type.junctions.value.value) {
                    const junctionLocMetaBuf: Buffer<ArrayBuffer> = Buffer.alloc(16);
                    junctionLocMetaBuf.writeInt32LE(junction.sourceX.value, 0);
                    junctionLocMetaBuf.writeInt32LE(junction.sourceGroundY.value, 4);
                    junctionLocMetaBuf.writeInt32LE(junction.sourceZ.value, 8);
                    junctionLocMetaBuf.writeInt32LE(junction.deltaY.value, 12);
                    const destProjectionBuf: Buffer<ArrayBuffer> = writeVarString(junction.destProjection.value);

                    junctions.push(Buffer.concat([junctionLocMetaBuf, destProjectionBuf]));
                }

                junctions.unshift(elementIDBuf, sectionLocMetaBuf, rotationBuf, Buffer.from(writeLittleVarint(junctions.length)));
                sections.push(Buffer.concat(junctions));
            }

            sections.unshift(locMetaBuf, structureBuf, Buffer.from(writeLittleVarint(sections.length)));
            return Buffer.concat(sections);
        },
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
     *
     * @see {@link NBTSchemas.nbtSchemas.LevelChunkMetaDataDictionary}
     */
    LevelChunkMetaDataDictionary: {
        // https://github.com/MiemieMethod/bedrock-docs/blob/8cd37dacbd064f5fb2a4953548739a258b31dd21/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L501
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.LevelChunkMetaDataDictionary.parse | parse} method.
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
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         */
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
     *
     * @since 0.12.0 < x < ?
     *
     * @todo Figure out what version added support for forced world corruption.
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
     * @todo Add a description for this.
     *
     * @see {@link NBTSchemas.nbtSchemas.ChunkLoadedRequest}
     *
     * @see https://github.com/MiemieMethod/bedrock-docs/blob/main/.knowledge/wiki%E6%91%98%E5%BD%95/%E4%B8%AD%E6%96%87Minecraft%20Wiki/%E5%9F%BA%E5%B2%A9%E7%89%88LevelDB%E6%A0%BC%E5%BC%8F.wikitext#L1175
     */
    ChunkLoadedRequest: {
        /**
         * The format type of the data.
         */
        type: "NBT",
        // TO-DO: Add a default value for this.
    },
    /**
     * A world with this LevelDB key has not been found yet, if you have a world with it please send it to 8Crafter so that he can add a parser and serializer for it.
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Add a description for this.
     * @todo Figure out how to parse this.
     */
    VersionEnchant: {
        type: "unknown",
    },
    /**
     * A world with this LevelDB key has not been found yet, if you have a world with it please send it to 8Crafter so that he can add a parser and serializer for it.
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Add a description for this.
     * @todo Figure out how to parse this.
     */
    VersionMarkInsert: {
        type: "unknown",
    },
    /**
     * It is unknown what this chunk key type is.
     *
     * The observed value is `0x0005`.
     *
     * Observed in a Minecraft China Edition 1.21.0 dev build.
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Add a description for this.
     * @todo Figure out how to parse this.
     */
    unknown0x70: {
        type: "unknown",
    },
    /**
     * It is unknown what this chunk key type is.
     *
     * The observed value is `0x00`.
     *
     * Observed in a Minecraft China Edition 1.21.0 dev build.
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Add a description for this.
     * @todo Figure out how to parse this.
     */
    unknown0x71: {
        type: "unknown",
    },
    /**
     * The content type of the `neteaseData` LevelDB key, which stores NetEase-specific settings.
     *
     * @see {@link NBTSchemas.nbtSchemas.NeteaseData}
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Add a description for this.
     * @todo Add a default value for this.
     */
    NeteaseData: {
        type: "NBT",
    },
    /**
     * The content type of the `scriptGid` LevelDB key, which stores ?.
     *
     * @see {@link NBTSchemas.nbtSchemas.NeteaseScriptGid}
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Add a description for this.
     * @todo Add a default value for this.
     */
    NeteaseScriptGid: {
        type: "NBT",
    },
    /**
     * The content type of the `SST_SALOG` LevelDB key, which stores command execution logs.
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Figure out how to parse this.
     */
    SSTCommandLog: {
        type: "unknown",
    },
    /**
     * The content type of the following LevelDB keys:
     * - `SST_NAME` - -- TODO: Add a description for this key.
     * - `SST_WORD` - -- TODO: Add a description for this key.
     * - `SST_WORD_` (possibly) - I haven't managed to find a world with this key yet to verify this.
     * - `SST_SIGH` - Appears to store hashes of sign text input history.
     *
     * @platform Minecraft China Edition
     *
     * @todo Figure out what this is used for.
     * @todo Add a better description for this.
     * @todo Figure out how to parse this.
     */
    SSTHashRegistry: {
        type: "unknown",
    },
    /**
     * The content type of the `level.dat`, `level.dat_old`, and `level.dat_new` files.
     *
     * This stores all the world settings.
     *
     * `level.dat_new` only exists while saving `level.dat`.
     * The game writes to `level.dat_new`, deletes `level.dat_old`,
     * renames `level.dat` to `level.dat_old`,
     * and renames `level.dat_new` to `level.dat`.
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
         * @throws {unknown} If an error occurs while parsing the data.
         */
        async parse(data: Buffer): Promise<NBTSchemas.NBTSchemaTypes.LevelDat> {
            const storageVersion: number = data.readUInt32LE(0);
            if (storageVersion === 1) {
                return {
                    type: "compound",
                    value: {
                        StorageVersion: {
                            type: "int",
                            value: 1,
                        },
                        LegacySeed: {
                            type: "int",
                            value: data.readInt32BE(8),
                        },
                        SpawnX: {
                            type: "int",
                            value: data.readInt32BE(12),
                        },
                        SpawnY: {
                            type: "int",
                            value: data.readInt32BE(16),
                        },
                        SpawnZ: {
                            type: "int",
                            value: data.readInt32BE(20),
                        },
                        // REVIEW: The first 4 bytes of this may be the world absolute time (as in in-game time), and this may not be SizeOnDisk at all.
                        SizeOnDisk: {
                            type: "long",
                            value: toLongParts(data.readBigUInt64BE(24)),
                        },
                        LegacyLastPlayed: {
                            type: "int",
                            value: data.readUInt32BE(32),
                        },
                        LevelName: {
                            type: "string",
                            value: decode(data.subarray(38, 38 + data.readUInt16BE(36)), "cp437"),
                        },
                    },
                };
            }
            const parsedData = (await NBT.parse(data)) as { parsed: NBT.NBT & NBTSchemas.NBTSchemaTypes.LevelDat; type: NBT.NBTFormat; metadata: NBT.Metadata };
            if (!parsedData.parsed.value.StorageVersion) {
                if (parsedData.metadata.size === data.length - 8) parsedData.parsed.value.StorageVersion = { type: "int", value: storageVersion };
                else parsedData.parsed.value.StorageVersion = { type: "int", value: 0x0a };
            }
            return parsedData.parsed;
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
            if (data.value.StorageVersion?.value === 1) {
                const buf: Buffer<ArrayBuffer> = Buffer.alloc(38);
                buf.writeUInt32LE(1, 0);
                buf.writeInt32BE(data.value.LegacySeed?.value ?? 0, 8);
                buf.writeInt32BE(data.value.SpawnX?.value ?? 0, 12);
                buf.writeInt32BE(data.value.SpawnY?.value ?? 0, 16);
                buf.writeInt32BE(data.value.SpawnZ?.value ?? 0, 20);
                // Write a signed bigint because toLong returns a signed bigint.
                buf.writeBigInt64BE(toLong(data.value.SizeOnDisk?.value ?? [0, 0]), 24);
                buf.writeUInt32BE((data.value.LegacyLastPlayed?.value ?? 0) & 0xffffffff, 32);
                if (!data.value.LevelName) {
                    buf.writeUInt32LE(buf.length, 4);
                    return buf;
                }
                const levelNameBuf: Buffer = encode(data.value.LevelName.value, "cp437");
                buf.writeUInt16BE(levelNameBuf.length, 36);
                buf.writeUInt32LE(buf.length + levelNameBuf.length, 4);
                return Buffer.concat([buf, levelNameBuf]);
            }
            const nbtData: Buffer = NBT.writeUncompressed({ name: "", ...data }, "little");
            return Buffer.concat([
                writeUInt32LE(typeof data.value.StorageVersion?.value === "number" ? data.value.StorageVersion.value : 10),
                writeUInt32LE(nbtData.length),
                nbtData,
            ]);
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
            const result: Buffer<ArrayBuffer> = Buffer.concat([Buffer.from("0A000000", "hex"), writeUInt32LE(nbtData.length), nbtData]);
            Object.defineProperty(this, "defaultValue", { value: result, configurable: true, enumerable: true, writable: false });
            return result;
        },
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "dat",
    },
    /**
     * The content type of the `player.dat` file.
     *
     * This stores the data of the local player (host).
     *
     * @deprecated Only used in versions < 0.2.0.
     *
     * @since 0.1.0
     *
     * @todo Add a description for this.
     * @todo Add a default value for this.
     */
    PlayerDat: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.PlayerDat.parse | parse} method.
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
         * @throws {TypeError} If `StorageVersion` in the header of the data is not `1`.
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.PlayerDat {
            const storageVersion: number = data.readUInt32LE(0);
            if (storageVersion === 1) {
                return {
                    type: "compound",
                    value: {
                        StorageVersion: {
                            type: "int",
                            value: 1,
                        },
                        Pos: {
                            type: "list",
                            value: {
                                type: "float",
                                value: [data.readFloatLE(8), data.readFloatLE(12), data.readFloatLE(16)],
                            },
                        },
                        Motion: {
                            type: "list",
                            value: {
                                type: "float",
                                value: [data.readFloatLE(20), data.readFloatLE(24), data.readFloatLE(28)],
                            },
                        },
                        Rotation: {
                            type: "list",
                            value: {
                                type: "float",
                                value: [data.readFloatLE(36), data.readFloatLE(32)],
                            },
                        },
                        // TEST: See if the falldistance in 0.2.0 is about the same as here.
                        // This is very likely FallDistance.
                        // https://github.com/nbcraft-org/mcped/blob/e4eddc3a1df169d8d59d53a00bf3452669ca6b9e/source/world/level/storage/LevelData.cpp#L65
                        FallDistance: {
                            type: "float",
                            value: data.readFloatLE(40),
                        },
                        Fire: {
                            type: "short",
                            value: data.readInt16LE(44),
                        },
                        Air: {
                            type: "short",
                            value: data.readInt16LE(46),
                        },
                        // TEST: Set this to a custom value and upgrade the world to a newer version and see where that value appears to figure out what it is.
                        // Maybe this is score? See if it resets when loading the world again.
                        // Maybe it is spawn point, see if it is the same across world loads, and it if only changes when creating the world.
                        // This actually seems like the first byte or bit is probably OnGround, based on this: https://github.com/nbcraft-org/mcped/blob/e4eddc3a1df169d8d59d53a00bf3452669ca6b9e/source/world/level/storage/LevelData.cpp#L68
                        OnGround: {
                            type: "byte",
                            value: data[48]! as 0 | 1,
                        },
                        UnknownField1: {
                            type: "short", // It is unknown the data type of this.
                            value: data.readInt16LE(49),
                        },
                        UnknownField2: {
                            type: "byte", // It is unknown the data type of this.
                            value: data[51]!,
                        },
                        Hotbar: {
                            type: "list",
                            value: {
                                type: "compound",
                                value: new Array<void>(9).fill(void 0).map(
                                    (
                                        _v: void,
                                        i: number
                                    ): {
                                        ItemID: {
                                            type: "short";
                                            value: number;
                                        };
                                        UnknownField1: {
                                            type: "short";
                                            value: number;
                                        };
                                    } /* TEMP */ => ({
                                        ItemID: {
                                            type: "short",
                                            value: data.readInt16LE(52 + i * 4),
                                        },
                                        // TEST: Set this to a custom value and upgrade the world to a newer version and see where that value appears to figure out what it is.
                                        // This might be the data value or item count of the item.
                                        UnknownField1: {
                                            type: "short",
                                            value: data.readInt16LE(54 + i * 4),
                                        },
                                    })
                                ) as TupleOf<
                                    9,
                                    {
                                        ItemID: {
                                            type: "short";
                                            value: number;
                                        };
                                        UnknownField1: {
                                            type: "short";
                                            value: number;
                                        };
                                    } /* TEMP */
                                >,
                            },
                        },
                    },
                };
            }
            throw new TypeError(`Unknown PlayerDat StorageVersion: ${storageVersion}`);
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         *
         * @throws {TypeError} If `StorageVersion` field is not 1.
         * @throws {unknown} If an error occurs while serializing the data.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.PlayerDat): Buffer<ArrayBuffer> {
            if (data.value.StorageVersion?.value === 1) {
                const buf: Buffer<ArrayBuffer> = Buffer.alloc(88);
                buf.writeUInt32LE(1, 0);
                buf.writeUInt32LE(80, 4);
                buf.writeFloatLE(data.value.Pos.value.value[0], 8);
                buf.writeFloatLE(data.value.Pos.value.value[1], 12);
                buf.writeFloatLE(data.value.Pos.value.value[2], 16);
                buf.writeFloatLE(data.value.Motion.value.value[0], 20);
                buf.writeFloatLE(data.value.Motion.value.value[1], 24);
                buf.writeFloatLE(data.value.Motion.value.value[2], 28);
                buf.writeFloatLE(data.value.Rotation.value.value[1], 32);
                buf.writeFloatLE(data.value.Rotation.value.value[0], 36);
                buf.writeFloatLE(data.value.FallDistance.value, 40);
                buf.writeInt16LE(data.value.Fire.value, 44);
                buf.writeInt16LE(data.value.Air.value, 46);
                buf.writeUInt8(data.value.OnGround.value, 48);
                buf.writeInt16LE(data.value.UnknownField1.value, 49);
                buf.writeUInt8(data.value.UnknownField2.value, 51);
                for (let i = 0; i < 9; i++) {
                    buf.writeInt16LE(data.value.Hotbar.value.value[i]!.ItemID.value, 52 + i * 4);
                    buf.writeInt16LE(data.value.Hotbar.value.value[i]!.UnknownField1.value, 54 + i * 4);
                }
                return buf;
            }
            throw new TypeError(`Unknown PlayerDat StorageVersion: ${data.value.StorageVersion?.value}`);
        },
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "dat",
    },
    /**
     * The content type of the `players/${numericID}.dat` files.
     *
     * This stores the data of a player who is not the local player (host).
     *
     * @deprecated Only used in versions < 0.9.0.
     *
     * @since 0.2.0 < x <= 0.7.2
     *
     * @todo Figure out what version this was added in. It has been observed in a 0.7.2 world, it does not exist in 0.2.0.
     * @todo Add a description for this.
     * @todo Add a default value for this.
     */
    LANPlayerDat: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.LANPlayerDat.parse | parse} method.
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
         * @throws {TypeError} If `StorageVersion` in the header of the data is not `1`.
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): Pick<NBT.NBT, "name"> & NBTSchemas.NBTSchemaTypes.LANPlayerDat {
            if (data[0] !== 0x50) throw new TypeError(`Expected byte 0 of LANPlayerDat data to be 0x50 but got ${data[0]} instead.`);
            if (data[1] !== 0x4c) throw new TypeError(`Expected byte 1 of LANPlayerDat data to be 0x4C but got ${data[0]} instead.`);
            if (data[2] !== 0x52) throw new TypeError(`Expected byte 2 of LANPlayerDat data to be 0x52 but got ${data[0]} instead.`);
            if (data[3] !== 0x00) throw new TypeError(`Expected byte 3 of LANPlayerDat data to be 0x00 but got ${data[0]} instead.`);
            const storageVersion: number = data.readUInt32LE(4);
            const dataLength: number = data.readUInt32LE(8);
            if (storageVersion === 1) {
                const parsedData = NBT.parseUncompressed(data.subarray(12, 12 + dataLength), "little") as Pick<NBT.NBT, "name"> &
                    NBTSchemas.NBTSchemaTypes.LANPlayerDat;
                parsedData.value.StorageVersion = { type: "int", value: 1 };
                return parsedData;
            }
            throw new TypeError(`Unknown LANPlayerDat StorageVersion: ${storageVersion}`);
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         *
         * @throws {TypeError} If the `StorageVersion` field is not 1.
         * @throws {unknown} If an error occurs while serializing the data.
         */
        serialize(data: Partial<Pick<NBT.NBT, "name">> & NBTSchemas.NBTSchemaTypes.LANPlayerDat): Buffer<ArrayBuffer> {
            if (data.value.StorageVersion?.value === 1) {
                const headerBuf: Buffer<ArrayBuffer> = Buffer.alloc(12);
                headerBuf.writeUInt32BE(0x504c5200, 0);
                headerBuf.writeUInt32LE(1, 4);
                const processedData: NBT.NBT = { name: data.name ?? "", type: "compound", value: { ...data.value } };
                delete processedData.value.StorageVersion;
                const serializedData: Buffer = NBT.writeUncompressed(processedData, "little");
                headerBuf.writeUInt32LE(serializedData.length, 8);
                return Buffer.concat([headerBuf, serializedData]);
            }
            throw new TypeError(`Unknown LANPlayerDat StorageVersion: ${data.value.StorageVersion?.value}`);
        },
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "dat",
    },
    /**
     * The content type of the `entities.dat` file.
     *
     * This stores entity and tile entity data.
     *
     * @deprecated Only used in versions < 0.9.0.
     *
     * @since 0.2.0
     *
     * @todo Add a description for this.
     * @todo Add a schema for this.
     * @todo Add a default value for this.
     */
    EntitiesDat: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.EntitiesDat.parse | parse} method.
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
         * @throws {TypeError} If the header of the data does not start with `0x454E5400`.
         * @throws {TypeError} If `StorageVersion` in the header of the data is not `1`.
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): Pick<NBT.NBT, "name"> & {
            type: "compound";
            value: {
                StorageVersion: {
                    type: "int";
                    value: 1;
                };
            };
        } /* TEMP */ {
            if (data[0] !== 0x45) throw new TypeError(`Expected byte 0 of EntitiesDat data to be 0x45 but got ${data[0]} instead.`);
            if (data[1] !== 0x4e) throw new TypeError(`Expected byte 1 of EntitiesDat data to be 0x4E but got ${data[0]} instead.`);
            if (data[2] !== 0x54) throw new TypeError(`Expected byte 2 of EntitiesDat data to be 0x54 but got ${data[0]} instead.`);
            if (data[3] !== 0x00) throw new TypeError(`Expected byte 3 of EntitiesDat data to be 0x00 but got ${data[0]} instead.`);
            const storageVersion: number = data.readUInt32LE(4);
            const dataLength: number = data.readUInt32LE(8);
            if (storageVersion === 1) {
                const parsedData = NBT.parseUncompressed(
                    data.subarray(12, 12 + dataLength),
                    "little"
                ); /* TEMP: Add an as statement here once the schema is added. */
                parsedData.value.StorageVersion = { type: "int", value: 1 };
                return parsedData as Pick<NBT.NBT, "name"> & {
                    type: "compound";
                    value: { StorageVersion: { type: "int"; value: 1 } };
                } /* TEMP */;
            }
            throw new TypeError(`Unknown EntitiesDat StorageVersion: ${storageVersion}`);
        },
        /**
         * The function to serialize the data.
         *
         * This result of this can be written directly to the file or LevelDB entry.
         *
         * @param data The data to serialize.
         * @returns The serialized data, as a buffer.
         *
         * @throws {TypeError} If `StorageVersion` field is not 1.
         * @throws {unknown} If an error occurs while serializing the data.
         */
        // TEMP: `StorageVersion` in the throws tag should be a link once the schema is added.
        serialize(
            data: Partial<Pick<NBT.NBT, "name">> &
                NBT.Compound & {
                    StorageVersion: {
                        type: "int";
                        value: 1;
                    };
                } /* TEMP */
        ): Buffer<ArrayBuffer> {
            if ((data.value.StorageVersion?.value ?? 1) === 1) {
                const headerBuf: Buffer<ArrayBuffer> = Buffer.alloc(12);
                headerBuf.writeUInt32BE(0x454e5400, 0);
                headerBuf.writeUInt32LE(1, 4);
                const processedData: NBT.NBT = { name: data.name ?? "", type: "compound", value: { ...data.value } };
                delete processedData.value.StorageVersion;
                const serializedData: Buffer = NBT.writeUncompressed(processedData, "little");
                headerBuf.writeUInt32LE(serializedData.length, 8);
                return Buffer.concat([headerBuf, serializedData]);
            }
            throw new TypeError(`Unknown EntitiesDat StorageVersion: ${data.value.StorageVersion?.value}`);
        },
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "dat",
    },
    /**
     * The content type of the `chunks.dat` file.
     *
     * @deprecated Only used in versions < 0.9.0.
     *
     * @since 0.1.0
     *
     * @todo Add a description for this.
     * @todo Add a default value for this.
     */
    ChunksDat: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.ChunksDat.parse | parse} method.
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
         * @throws {Error} If the data is less than 4096 bytes.
         * @throws {Error} If a chunk pointer points beyond the length of the data.
         * @throws {Error} If a chunk's data is truncated.
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.ChunksDat {
            if (data.length < 4096) {
                throw new Error(`Expected ChunksDat data to be at least 4096 bytes, but got ${data.length} bytes instead.`);
            }

            function unpackNibbleArray(buf: Buffer): Range<0, 16>[] {
                const out: Range<0, 16>[] = new Array(buf.length * 2);
                let offset = 0;
                for (let i = 0; i < buf.length; i++) {
                    const byte: number = buf[i]!;
                    out[offset++] = (byte & 0x0f) as Range<0, 16>;
                    out[offset++] = (byte >> 4) as Range<0, 16>;
                }
                return out;
            }

            const chunks: NBTSchemas.NBTSchemaTypes.ChunksDat["value"]["chunks"]["value"]["value"] = new Array<void>(32)
                .fill(void 0)
                .map((_: void): NBTSchemas.NBTSchemaTypes.ChunksDat["value"]["chunks"]["value"]["value"][number] => ({
                    type: "compound",
                    value: new Array<NBTSchemas.NBTSchemaTypes.ChunksDat["value"]["chunks"]["value"]["value"][number]["value"][number]>(32),
                }));

            let offset = 0;

            for (let z = 0; z < 32; z++) {
                for (let x = 0; x < 32; x++) {
                    const sectorCount: number = data[offset]!;
                    const preSectorCount = data[offset + 1]! | (data[offset + 2]! << 8) | (data[offset + 3]! << 16);

                    offset += 4;

                    if (sectorCount === 0 || preSectorCount === 0) {
                        // Empty chunk
                        chunks[x]!.value[z] = {
                            block_ids: { type: "list", value: { type: "byte", value: [] } },
                            block_data: { type: "list", value: { type: "byte", value: [] } },
                            sky_light: { type: "list", value: { type: "byte", value: [] } },
                            block_light: { type: "list", value: { type: "byte", value: [] } },
                            update_map: { type: "list", value: { type: "byte", value: [] } },
                            extra_data: { type: "list", value: { type: "byte", value: [] } },
                        };
                        continue;
                    }

                    const chunkOffset = preSectorCount * 4096;

                    if (chunkOffset + 4 > data.length)
                        throw new Error(`Chunk at (${x},${z}) points outside file; Expected ${chunkOffset + 4} bytes, got ${data.length} bytes.`);

                    const length: number = data.readUInt32LE(chunkOffset);

                    if (chunkOffset + length > data.length)
                        throw new Error(`Chunk at (${x},${z}) truncated; Expected ${length} bytes, got ${data.length - chunkOffset} bytes.`);

                    const buf: Buffer = data.subarray(chunkOffset, chunkOffset + length);

                    const blocksEnd = 4 + 32768;
                    const metadataEnd = blocksEnd + 16384;
                    const skylightEnd = metadataEnd + 16384;
                    const blocklightEnd = skylightEnd + 16384;
                    const updateMapEnd = blocklightEnd + 256;

                    const blocks: number[] = length >= blocksEnd ? [...buf.subarray(4, blocksEnd)] : [];

                    const metadataPacked: Buffer = length >= metadataEnd ? buf.subarray(blocksEnd, metadataEnd) : Buffer.alloc(0);

                    const skylightPacked: Buffer = length >= skylightEnd ? buf.subarray(metadataEnd, skylightEnd) : Buffer.alloc(0);

                    const blocklightPacked: Buffer = length >= blocklightEnd ? buf.subarray(skylightEnd, blocklightEnd) : Buffer.alloc(0);

                    const updateMap: number[] = length >= updateMapEnd ? [...buf.subarray(blocklightEnd, updateMapEnd)] : [];

                    const extra: number[] = length > updateMapEnd ? [...buf.subarray(updateMapEnd, length)] : [];

                    chunks[x]!.value[z] = {
                        block_ids: { type: "list", value: { type: "byte", value: blocks } },
                        block_data: { type: "list", value: { type: "byte", value: unpackNibbleArray(metadataPacked) } },
                        sky_light: { type: "list", value: { type: "byte", value: unpackNibbleArray(skylightPacked) } },
                        block_light: { type: "list", value: { type: "byte", value: unpackNibbleArray(blocklightPacked) } },
                        update_map: { type: "list", value: { type: "byte", value: updateMap } },
                        extra_data: { type: "list", value: { type: "byte", value: extra } },
                    };
                }
            }

            return {
                type: "compound",
                value: {
                    chunks: {
                        type: "list",
                        value: {
                            type: "list",
                            value: chunks,
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
         * @throws {unknown} If an error occurs while serializing the data.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.ChunksDat): Buffer<ArrayBuffer> {
            function packNibbleArray(arr: Range<0, 16>[]): Buffer<ArrayBuffer> {
                const out: Buffer<ArrayBuffer> = Buffer.alloc(arr.length / 2);
                let o = 0;
                for (let i = 0; i < arr.length; i += 2) {
                    out[o++] = (arr[i]! & 0x0f) | ((arr[i + 1]! & 0x0f) << 4);
                }
                return out;
            }

            const columns = data.value.chunks.value.value;

            const indexBuf: Buffer<ArrayBuffer> = Buffer.alloc(4096);
            const chunkBuffers: Buffer<ArrayBuffer>[] = [];

            let sectorOffset = 1;
            let indexPos = 0;

            for (const column of columns) {
                for (const chunk of column.value) {
                    const v = chunk;

                    const blockIds: Buffer<ArrayBuffer> = Buffer.from(v.block_ids.value.value);
                    const blockDataPacked: Buffer<ArrayBuffer> = packNibbleArray(v.block_data.value.value);
                    const skyLightPacked: Buffer<ArrayBuffer> = packNibbleArray(v.sky_light.value.value);
                    const blockLightPacked: Buffer<ArrayBuffer> = packNibbleArray(v.block_light.value.value);
                    const updateMap: Buffer<ArrayBuffer> = Buffer.from(v.update_map.value.value);
                    const extra: Buffer<ArrayBuffer> = Buffer.from(v.extra_data.value.value);

                    const length =
                        4 + blockIds.length + blockDataPacked.length + skyLightPacked.length + blockLightPacked.length + updateMap.length + extra.length;

                    if (length === 4) {
                        // Empty chunk
                        indexBuf[indexPos] = 0;
                        indexBuf[indexPos + 1] = 0;
                        indexBuf[indexPos + 2] = 0;
                        indexBuf[indexPos + 3] = 0;
                        indexPos += 4;
                        continue;
                    }

                    const sectorCount: number = Math.ceil(length / 4096);
                    const preSectorCount: number = sectorOffset;

                    const buf: Buffer<ArrayBuffer> = Buffer.alloc(sectorCount * 4096);
                    buf.writeUInt32LE(length, 0);

                    let o = 4;
                    blockIds.copy(buf, o);
                    o += blockIds.length;
                    blockDataPacked.copy(buf, o);
                    o += blockDataPacked.length;
                    skyLightPacked.copy(buf, o);
                    o += skyLightPacked.length;
                    blockLightPacked.copy(buf, o);
                    o += blockLightPacked.length;
                    updateMap.copy(buf, o);
                    o += updateMap.length;
                    extra.copy(buf, o);

                    indexBuf[indexPos] = sectorCount;
                    indexBuf[indexPos + 1] = preSectorCount & 0xff;
                    indexBuf[indexPos + 2] = (preSectorCount >> 8) & 0xff;
                    indexBuf[indexPos + 3] = (preSectorCount >> 16) & 0xff;

                    indexPos += 4;
                    sectorOffset += sectorCount;

                    chunkBuffers.push(buf);
                }
            }

            return Buffer.concat([indexBuf, ...chunkBuffers]);
        },
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "dat",
    },
    /**
     * The content type of the `importedchunks.dat` file.
     *
     * This stores the import states for the chunks in `chunks.dat`.
     *
     * These import states store whether the chunks has been imported into the LevelDB from `chunks.dat`.
     *
     * @since 0.9.0?
     *
     * @todo Figure out what version this was added in. It has been observed in a corrupted 0.7.2 world that seems to have been partially updated to a slightly newer version that has a LevelDB, maybe 0.9.0 or later. It has also been observed in a 0.1.2 world that was upgraded to 1.26.51.
     */
    ImportedChunksDat: {
        /**
         * The format type of the data.
         */
        type: "custom",
        /**
         * The format type that results from the {@link entryContentTypeToFormatMap.ImportedChunksDat.parse | parse} method.
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
         * @throws {Error} If the data is not 256 bytes.
         * @throws {unknown} If an error occurs while parsing the data.
         */
        parse(data: Buffer): NBTSchemas.NBTSchemaTypes.ImportedChunksDat {
            if (data.length !== 256) {
                throw new Error(`Expected ImportedChunksDat data to be 256 bytes, but got ${data.length} bytes instead.`);
            }
            // REVIEW: See if importedchunks.dat is larger than 16x16 if a world with an area with actual chunk data larger than 16x16 chunks is upgraded.
            const columns: NBTSchemas.NBTSchemaTypes.ImportedChunksDat["value"]["ImportState"]["value"]["value"] = new Array<void>(16)
                .fill(void 0)
                .map((_: void): NBTSchemas.NBTSchemaTypes.ImportedChunksDat["value"]["ImportState"]["value"]["value"][number] => ({
                    type: "byte",
                    value: new Array<0 | 1>(16),
                }));
            let offset = 0;
            for (let z = 0; z < 16; z++) {
                for (let x = 0; x < 16; x++) {
                    columns[x]!.value[z] = data[offset++]! as 0 | 1;
                }
            }
            return {
                type: "compound",
                value: {
                    ImportState: {
                        type: "list",
                        value: {
                            type: "list",
                            value: columns,
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
         * @throws {unknown} If an error occurs while serializing the data.
         */
        serialize(data: NBTSchemas.NBTSchemaTypes.ImportedChunksDat): Buffer<ArrayBuffer> {
            const buf: Buffer<ArrayBuffer> = Buffer.alloc(256);
            let offset = 0;
            for (let z = 0; z < 16; z++) {
                for (let x = 0; x < 16; x++) {
                    buf[offset++] = data.value.ImportState.value.value[x]!.value[z]!;
                }
            }
            return buf;
        },
        /**
         * The default value to use when initializing a new entry.
         *
         * Bytes:
         * ```json
         * [0, ...] // (256 bytes, every byte is 0)
         * ```
         */
        get defaultValue(): Buffer<ArrayBuffer> {
            const result: Buffer<ArrayBuffer> = Buffer.alloc(256);
            Object.defineProperty(this, "defaultValue", { value: result, configurable: true, enumerable: true, writable: false });
            return result;
        },
        /**
         * The raw file extension of the data.
         */
        rawFileExtension: "dat",
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
    [key in MCEntryContentType]: EntryContentTypeFormatData;
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
          readonly type: "SNBT" | "unknown";
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "JSONC";
          /**
           * Whether trailing commas are allowed.
           *
           * If not present, `false` should be assumed.
           *
           * @default false
           */
          readonly allowTrailingCommas?: boolean;
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "JSON";
          /**
           * Whether comments are allowed.
           *
           * If not present, `false` should be assumed.
           *
           * @default false
           */
          readonly allowComments?: boolean;
          /**
           * Whether trailing commas are allowed.
           *
           * If not present, `false` should be assumed.
           *
           * @default false
           */
          readonly allowTrailingCommas?: boolean;
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "ASCII" | "binary" | "binaryPlainText" | "UTF-8";
          /**
           * The minimum length of the data.
           *
           * If not present, `0` should be assumed.
           *
           * @default 0
           */
          readonly minLength?: number;
          /**
           * The maximum length of the data.
           *
           * If not present, `Infinity` should be assumed.
           *
           * @default Infinity
           */
          readonly maxLength?: number;
          // IDEA: Add a validation function.
      }
    | {
          /**
           * The format type of the data.
           */
          readonly type: "hex";
          /**
           * The minimum length of the data in bytes (if the hex data is a string of hexadecimal characters, two characters is one byte).
           *
           * If not present, `0` should be assumed.
           *
           * @default 0
           */
          readonly minLength?: number;
          /**
           * The maximum length of the data in bytes (if the hex data is a string of hexadecimal characters, two characters is one byte).
           *
           * If not present, `Infinity` should be assumed.
           *
           * @default Infinity
           */
          readonly maxLength?: number;
          // IDEA: Add a validation function.
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

/**
 * Utilities related to the `chunks.dat` file.
 *
 * @see {@link entryContentTypeToFormatMap.ChunksDat}
 */
export namespace ChunksDatUtils {
    /**
     * Reads a chunk from `chunks.dat`.
     *
     * @see {@link entryContentTypeToFormatMap.ChunksDat}
     *
     * @param data The buffer of the `chunks.dat` file.
     * @param chunk The chunk coordinates.
     * @returns The parsed chunk data.
     *
     * @throws {Error} If the data is less than 4096 bytes.
     * @throws {Error} If a chunk pointer points beyond the length of the data.
     * @throws {Error} If a chunk's data is truncated.
     * @throws {unknown} If an error occurs while parsing the data.
     */
    export function readChunksDatChunk(data: Buffer, chunk: VectorXZ): NBTSchemas.NBTSchemaTypes.ChunksDatChunk {
        if (data.length < 4096) {
            throw new Error(`Expected ChunksDat data to be at least 4096 bytes, but got ${data.length} bytes instead.`);
        }

        function getOffsetInChunkIndexSector(x: number, z: number): number {
            return ((z << 5) + x) << 2;
        }
        function unpackNibbleArray(buf: Buffer): Range<0, 16>[] {
            const out: Range<0, 16>[] = new Array(buf.length * 2);
            let offset = 0;
            for (let i = 0; i < buf.length; i++) {
                const byte: number = buf[i]!;
                out[offset++] = (byte & 0x0f) as Range<0, 16>;
                out[offset++] = (byte >> 4) as Range<0, 16>;
            }
            return out;
        }

        const offset: number = getOffsetInChunkIndexSector(chunk.x, chunk.z);
        const sectorCount: number = data[offset]!;
        const preSectorCount = data[offset + 1]! | (data[offset + 2]! << 8) | (data[offset + 3]! << 16);

        if (sectorCount === 0 || preSectorCount === 0) {
            // Empty chunk
            return {
                type: "compound",
                value: {
                    block_ids: { type: "list", value: { type: "byte", value: [] } },
                    block_data: { type: "list", value: { type: "byte", value: [] } },
                    sky_light: { type: "list", value: { type: "byte", value: [] } },
                    block_light: { type: "list", value: { type: "byte", value: [] } },
                    update_map: { type: "list", value: { type: "byte", value: [] } },
                    extra_data: { type: "list", value: { type: "byte", value: [] } },
                },
            };
        }

        const chunkOffset = preSectorCount * 4096;

        if (chunkOffset + 4 > data.length)
            throw new Error(`Chunk at (${chunk.x},${chunk.z}) points outside file; Expected ${chunkOffset + 4} bytes, got ${data.length} bytes.`);

        const length: number = data.readUInt32LE(chunkOffset);

        if (chunkOffset + length > data.length)
            throw new Error(`Chunk at (${chunk.x},${chunk.z}) truncated; Expected ${length} bytes, got ${data.length - chunkOffset} bytes.`);

        const buf: Buffer = data.subarray(chunkOffset, chunkOffset + length);

        const blocksEnd = 4 + 32768;
        const metadataEnd = blocksEnd + 16384;
        const skylightEnd = metadataEnd + 16384;
        const blocklightEnd = skylightEnd + 16384;
        const updateMapEnd = blocklightEnd + 256;

        const blocks: number[] = length >= blocksEnd ? [...buf.subarray(4, blocksEnd)] : [];

        const metadataPacked: Buffer = length >= metadataEnd ? buf.subarray(blocksEnd, metadataEnd) : Buffer.alloc(0);

        const skylightPacked: Buffer = length >= skylightEnd ? buf.subarray(metadataEnd, skylightEnd) : Buffer.alloc(0);

        const blocklightPacked: Buffer = length >= blocklightEnd ? buf.subarray(skylightEnd, blocklightEnd) : Buffer.alloc(0);

        const updateMap: number[] = length >= updateMapEnd ? [...buf.subarray(blocklightEnd, updateMapEnd)] : [];

        const extra: number[] = length > updateMapEnd ? [...buf.subarray(updateMapEnd, length)] : [];

        return {
            type: "compound",
            value: {
                block_ids: { type: "list", value: { type: "byte", value: blocks } },
                block_data: { type: "list", value: { type: "byte", value: unpackNibbleArray(metadataPacked) } },
                sky_light: { type: "list", value: { type: "byte", value: unpackNibbleArray(skylightPacked) } },
                block_light: { type: "list", value: { type: "byte", value: unpackNibbleArray(blocklightPacked) } },
                update_map: { type: "list", value: { type: "byte", value: updateMap } },
                extra_data: { type: "list", value: { type: "byte", value: extra } },
            },
        };
    }

    /**
     * Writes a chunk in `chunks.dat`.
     *
     * This method does not modifiy the original buffer.
     *
     * @see {@link entryContentTypeToFormatMap.ChunksDat}
     *
     * @param data The original `chunks.dat` buffer.
     * @param chunkData The chunk data to write.
     * @param chunk The chunk coordinates.
     * @returns A copy of the original buffer with the chunk data written.
     *
     * @throws {Error} If the original data buffer is less than 4096 bytes.
     * @throws {unknown} If an error occurs while serializing the data.
     */
    export function writeChunksDatChunk(data: Buffer, chunkData: NBTSchemas.NBTSchemaTypes.ChunksDatChunk, chunk: VectorXZ): Buffer<ArrayBuffer> {
        if (data.length < 4096) {
            throw new Error(`Expected ChunksDat data to be at least 4096 bytes, but got ${data.length} bytes instead.`);
        }

        function getOffsetInChunkIndexSector(x: number, z: number): number {
            return ((z << 5) + x) << 2;
        }
        function packNibbleArray(arr: Range<0, 16>[]): Buffer<ArrayBuffer> {
            const out: Buffer<ArrayBuffer> = Buffer.alloc(arr.length / 2);
            let o = 0;
            for (let i = 0; i < arr.length; i += 2) {
                out[o++] = (arr[i]! & 0x0f) | ((arr[i + 1]! & 0x0f) << 4);
            }
            return out;
        }

        const chunkIndexSectorOffset: number = getOffsetInChunkIndexSector(chunk.x, chunk.z);
        let newPreSectorCount = 0;
        const origSectorCount: number = data[chunkIndexSectorOffset]!;
        const origPreSectorCount = data[chunkIndexSectorOffset + 1]! | (data[chunkIndexSectorOffset + 2]! << 8) | (data[chunkIndexSectorOffset + 3]! << 16);
        preSectorCountGetter: if (origSectorCount === 0 || origPreSectorCount === 0) {
            let offset = 0;

            for (let z = 0; z < 32; z++) {
                for (let x = 0; x < 32; x++) {
                    if (x === chunk.x && z === chunk.z) break preSectorCountGetter;
                    const sectorCount: number = data[offset]!;
                    const preSectorCount = data[offset + 1]! | (data[offset + 2]! << 8) | (data[offset + 3]! << 16);
                    offset += 4;
                    if (sectorCount === 0 || preSectorCount === 0) continue;
                    if (preSectorCount + sectorCount > newPreSectorCount) newPreSectorCount = preSectorCount + sectorCount;
                }
            }
        } else newPreSectorCount = origPreSectorCount;

        let preChunkIndexSectorBuf: Buffer = data.subarray(0, chunkIndexSectorOffset);
        let chunkIndexSectorEntryBuf: Buffer<ArrayBuffer> = Buffer.alloc(4);
        let postChunkIndexSectorBuf: Buffer = data.subarray(chunkIndexSectorOffset + 4, 4096);

        let preDataBufs: Buffer[];
        let postDataBufs: Buffer[];

        if (origPreSectorCount && origPreSectorCount !== newPreSectorCount) {
            if (origPreSectorCount > newPreSectorCount) {
                preDataBufs = [data.subarray(4096, newPreSectorCount * 4096)];
                postDataBufs = [
                    data.subarray(newPreSectorCount * 4096, origPreSectorCount * 4096),
                    data.subarray((origPreSectorCount + origSectorCount) * 4096),
                ];
            } else {
                preDataBufs = [
                    data.subarray(0, origPreSectorCount * 4096),
                    data.subarray((origPreSectorCount + origSectorCount) * 4096, newPreSectorCount * 4096),
                ];
                postDataBufs = [data.subarray(newPreSectorCount * 4096)];
            }
        } else if (origSectorCount && origPreSectorCount) {
            preDataBufs = [data.subarray(4096, origPreSectorCount * 4096)];
            postDataBufs = [data.subarray((origPreSectorCount + origSectorCount) * 4096)];
        } else {
            preDataBufs = [data.subarray(4096, newPreSectorCount * 4096)];
            postDataBufs = [data.subarray(newPreSectorCount * 4096)];
        }

        const blockIds: Buffer<ArrayBuffer> = Buffer.from(chunkData.value.block_ids.value.value);
        const blockDataPacked: Buffer<ArrayBuffer> = packNibbleArray(chunkData.value.block_data.value.value);
        const skyLightPacked: Buffer<ArrayBuffer> = packNibbleArray(chunkData.value.sky_light.value.value);
        const blockLightPacked: Buffer<ArrayBuffer> = packNibbleArray(chunkData.value.block_light.value.value);
        const updateMap: Buffer<ArrayBuffer> = Buffer.from(chunkData.value.update_map.value.value);
        const extra: Buffer<ArrayBuffer> = Buffer.from(chunkData.value.extra_data.value.value);

        const length = 4 + blockIds.length + blockDataPacked.length + skyLightPacked.length + blockLightPacked.length + updateMap.length + extra.length;

        if (length === 4) {
            return Buffer.concat([preChunkIndexSectorBuf, chunkIndexSectorEntryBuf, postChunkIndexSectorBuf, ...preDataBufs, ...postDataBufs]);
        }

        const sectorCount: number = Math.ceil(length / 4096);

        const dataBuf: Buffer<ArrayBuffer> = Buffer.alloc(sectorCount * 4096);
        dataBuf.writeUInt32LE(length, 0);

        let o = 4;
        blockIds.copy(dataBuf, o);
        o += blockIds.length;
        blockDataPacked.copy(dataBuf, o);
        o += blockDataPacked.length;
        skyLightPacked.copy(dataBuf, o);
        o += skyLightPacked.length;
        blockLightPacked.copy(dataBuf, o);
        o += blockLightPacked.length;
        updateMap.copy(dataBuf, o);
        o += updateMap.length;
        extra.copy(dataBuf, o);

        chunkIndexSectorEntryBuf[0] = sectorCount;
        chunkIndexSectorEntryBuf[1] = newPreSectorCount & 0xff;
        chunkIndexSectorEntryBuf[2] = (newPreSectorCount >> 8) & 0xff;
        chunkIndexSectorEntryBuf[3] = (newPreSectorCount >> 16) & 0xff;

        return Buffer.concat([preChunkIndexSectorBuf, chunkIndexSectorEntryBuf, postChunkIndexSectorBuf, ...preDataBufs, dataBuf, ...postDataBufs]);
    }

    /**
     * Reads a chunk's raw data from `chunks.dat`.
     *
     * @see {@link entryContentTypeToFormatMap.ChunksDat}
     *
     * @param data The buffer of the `chunks.dat` file.
     * @param chunk The chunk coordinates.
     * @returns The raw chunk data.
     *
     * @throws {Error} If the data is less than 4096 bytes.
     * @throws {Error} If a chunk pointer points beyond the length of the data.
     * @throws {unknown} If an error occurs while parsing the data.
     */
    export function readRawChunksDatChunk(data: Buffer, chunk: VectorXZ): Buffer<ArrayBuffer> {
        if (data.length < 4096) {
            throw new Error(`Expected ChunksDat data to be at least 4096 bytes, but got ${data.length} bytes instead.`);
        }

        function getOffsetInChunkIndexSector(x: number, z: number): number {
            return ((z << 5) + x) << 2;
        }

        const offset: number = getOffsetInChunkIndexSector(chunk.x, chunk.z);
        const sectorCount: number = data[offset]!;
        const preSectorCount = data[offset + 1]! | (data[offset + 2]! << 8) | (data[offset + 3]! << 16);

        if (sectorCount === 0 || preSectorCount === 0) {
            // Empty chunk
            return Buffer.alloc(0);
        }

        const chunkOffset = preSectorCount * 4096;

        if (chunkOffset + 4 > data.length)
            throw new Error(`Chunk at (${chunk.x},${chunk.z}) points outside file; Expected ${chunkOffset + 4} bytes, got ${data.length} bytes.`);

        return Buffer.from(data.subarray(chunkOffset, chunkOffset + sectorCount * 4096));
    }

    /**
     * Extracts a reference to a chunk's raw data from `chunks.dat`.
     *
     * This is the same as {@link readRawChunksDatChunk} except that the returned buffer references the same memory as the input data buffer.
     *
     * @see {@link entryContentTypeToFormatMap.ChunksDat}
     *
     * @param data The buffer of the `chunks.dat` file.
     * @param chunk The chunk coordinates.
     * @returns The raw chunk data reference.
     *
     * @throws {Error} If the data is less than 4096 bytes.
     * @throws {Error} If a chunk pointer points beyond the length of the data.
     * @throws {unknown} If an error occurs while parsing the data.
     */
    export function extractRawChunksDatChunk<BufferType extends ArrayBufferLike>(data: Buffer<BufferType>, chunk: VectorXZ): Buffer<BufferType> {
        if (data.length < 4096) {
            throw new Error(`Expected ChunksDat data to be at least 4096 bytes, but got ${data.length} bytes instead.`);
        }

        function getOffsetInChunkIndexSector(x: number, z: number): number {
            return ((z << 5) + x) << 2;
        }

        const offset: number = getOffsetInChunkIndexSector(chunk.x, chunk.z);
        const sectorCount: number = data[offset]!;
        const preSectorCount = data[offset + 1]! | (data[offset + 2]! << 8) | (data[offset + 3]! << 16);

        if (sectorCount === 0 || preSectorCount === 0) {
            // Empty chunk
            return data.subarray(0, 0);
        }

        const chunkOffset = preSectorCount * 4096;

        if (chunkOffset + 4 > data.length)
            throw new Error(`Chunk at (${chunk.x},${chunk.z}) points outside file; Expected ${chunkOffset + 4} bytes, got ${data.length} bytes.`);

        return data.subarray(chunkOffset, chunkOffset + sectorCount * 4096);
    }

    /**
     * Writes a chunk's raw data to `chunks.dat`.
     *
     * This method does not modifiy the original buffer.
     *
     * @see {@link entryContentTypeToFormatMap.ChunksDat}
     *
     * @param data The original `chunks.dat` buffer.
     * @param chunkData The chunk data to write.
     * @param chunk The chunk coordinates.
     * @returns A copy of the original buffer with the chunk data written.
     *
     * @throws {Error} If the original data buffer is less than 4096 bytes.
     * @throws {unknown} If an error occurs while serializing the data.
     */
    export function writeRawChunksDatChunk(data: Buffer, chunkData: Buffer, chunk: VectorXZ): Buffer<ArrayBuffer> {
        if (data.length < 4096) {
            throw new Error(`Expected ChunksDat data to be at least 4096 bytes, but got ${data.length} bytes instead.`);
        }

        function getOffsetInChunkIndexSector(x: number, z: number): number {
            return ((z << 5) + x) << 2;
        }
        function packNibbleArray(arr: Range<0, 16>[]): Buffer<ArrayBuffer> {
            const out: Buffer<ArrayBuffer> = Buffer.alloc(arr.length / 2);
            let o = 0;
            for (let i = 0; i < arr.length; i += 2) {
                out[o++] = (arr[i]! & 0x0f) | ((arr[i + 1]! & 0x0f) << 4);
            }
            return out;
        }

        const chunkIndexSectorOffset: number = getOffsetInChunkIndexSector(chunk.x, chunk.z);
        let newPreSectorCount = 0;
        const origSectorCount: number = data[chunkIndexSectorOffset]!;
        const origPreSectorCount = data[chunkIndexSectorOffset + 1]! | (data[chunkIndexSectorOffset + 2]! << 8) | (data[chunkIndexSectorOffset + 3]! << 16);
        preSectorCountGetter: if (origSectorCount === 0 || origPreSectorCount === 0) {
            let offset = 0;

            for (let z = 0; z < 32; z++) {
                for (let x = 0; x < 32; x++) {
                    if (x === chunk.x && z === chunk.z) break preSectorCountGetter;
                    const sectorCount: number = data[offset]!;
                    const preSectorCount = data[offset + 1]! | (data[offset + 2]! << 8) | (data[offset + 3]! << 16);
                    offset += 4;
                    if (sectorCount === 0 || preSectorCount === 0) continue;
                    if (preSectorCount + sectorCount > newPreSectorCount) newPreSectorCount = preSectorCount + sectorCount;
                }
            }
        } else newPreSectorCount = origPreSectorCount;

        let preChunkIndexSectorBuf: Buffer = data.subarray(0, chunkIndexSectorOffset);
        let chunkIndexSectorEntryBuf: Buffer<ArrayBuffer> = Buffer.alloc(4);
        let postChunkIndexSectorBuf: Buffer = data.subarray(chunkIndexSectorOffset + 4, 4096);

        let preDataBufs: Buffer[];
        let postDataBufs: Buffer[];

        if (origPreSectorCount && origPreSectorCount !== newPreSectorCount) {
            if (origPreSectorCount > newPreSectorCount) {
                preDataBufs = [data.subarray(4096, newPreSectorCount * 4096)];
                postDataBufs = [
                    data.subarray(newPreSectorCount * 4096, origPreSectorCount * 4096),
                    data.subarray((origPreSectorCount + origSectorCount) * 4096),
                ];
            } else {
                preDataBufs = [
                    data.subarray(0, origPreSectorCount * 4096),
                    data.subarray((origPreSectorCount + origSectorCount) * 4096, newPreSectorCount * 4096),
                ];
                postDataBufs = [data.subarray(newPreSectorCount * 4096)];
            }
        } else if (origSectorCount && origPreSectorCount) {
            preDataBufs = [data.subarray(4096, origPreSectorCount * 4096)];
            postDataBufs = [data.subarray((origPreSectorCount + origSectorCount) * 4096)];
        } else {
            preDataBufs = [data.subarray(4096, newPreSectorCount * 4096)];
            postDataBufs = [data.subarray(newPreSectorCount * 4096)];
        }

        if (chunkData.length === 0) {
            return Buffer.concat([preChunkIndexSectorBuf, chunkIndexSectorEntryBuf, postChunkIndexSectorBuf, ...preDataBufs, ...postDataBufs]);
        }

        const sectorCount: number = Math.ceil(chunkData.length / 4096);

        chunkIndexSectorEntryBuf[0] = sectorCount;
        chunkIndexSectorEntryBuf[1] = newPreSectorCount & 0xff;
        chunkIndexSectorEntryBuf[2] = (newPreSectorCount >> 8) & 0xff;
        chunkIndexSectorEntryBuf[3] = (newPreSectorCount >> 16) & 0xff;

        return Buffer.concat([preChunkIndexSectorBuf, chunkIndexSectorEntryBuf, postChunkIndexSectorBuf, ...preDataBufs, chunkData, ...postDataBufs]);
    }

    /**
     * Parses the raw data of a `chunks.dat` chunk.
     *
     * @param data The raw chunk data.
     * @returns The parsed chunk data.
     */
    export function parseRawChunksDatChunk(data: Buffer): NBTSchemas.NBTSchemaTypes.ChunksDatChunk {
        function unpackNibbleArray(buf: Buffer): Range<0, 16>[] {
            const out: Range<0, 16>[] = new Array(buf.length * 2);
            let offset = 0;
            for (let i = 0; i < buf.length; i++) {
                const byte: number = buf[i]!;
                out[offset++] = (byte & 0x0f) as Range<0, 16>;
                out[offset++] = (byte >> 4) as Range<0, 16>;
            }
            return out;
        }

        if (data.length === 0) {
            // Empty chunk
            return {
                type: "compound",
                value: {
                    block_ids: { type: "list", value: { type: "byte", value: [] } },
                    block_data: { type: "list", value: { type: "byte", value: [] } },
                    sky_light: { type: "list", value: { type: "byte", value: [] } },
                    block_light: { type: "list", value: { type: "byte", value: [] } },
                    update_map: { type: "list", value: { type: "byte", value: [] } },
                    extra_data: { type: "list", value: { type: "byte", value: [] } },
                },
            };
        }

        const length: number = data.readUInt32LE(0);

        if (length > data.length) throw new Error(`Raw chunks.dat chunk truncated; Expected ${length} bytes, got ${data.length} bytes.`);

        const blocksEnd = 4 + 32768;
        const metadataEnd = blocksEnd + 16384;
        const skylightEnd = metadataEnd + 16384;
        const blocklightEnd = skylightEnd + 16384;
        const updateMapEnd = blocklightEnd + 256;

        const blocks: number[] = length >= blocksEnd ? [...data.subarray(4, blocksEnd)] : [];

        const metadataPacked: Buffer = length >= metadataEnd ? data.subarray(blocksEnd, metadataEnd) : Buffer.alloc(0);

        const skylightPacked: Buffer = length >= skylightEnd ? data.subarray(metadataEnd, skylightEnd) : Buffer.alloc(0);

        const blocklightPacked: Buffer = length >= blocklightEnd ? data.subarray(skylightEnd, blocklightEnd) : Buffer.alloc(0);

        const updateMap: number[] = length >= updateMapEnd ? [...data.subarray(blocklightEnd, updateMapEnd)] : [];

        const extra: number[] = length > updateMapEnd ? [...data.subarray(updateMapEnd, length)] : [];

        return {
            type: "compound",
            value: {
                block_ids: { type: "list", value: { type: "byte", value: blocks } },
                block_data: { type: "list", value: { type: "byte", value: unpackNibbleArray(metadataPacked) } },
                sky_light: { type: "list", value: { type: "byte", value: unpackNibbleArray(skylightPacked) } },
                block_light: { type: "list", value: { type: "byte", value: unpackNibbleArray(blocklightPacked) } },
                update_map: { type: "list", value: { type: "byte", value: updateMap } },
                extra_data: { type: "list", value: { type: "byte", value: extra } },
            },
        };
    }

    /**
     * Converts a parsed chunk from `chunks.dat` to its raw binary data.
     *
     * @param chunkData The chunk data to convert.
     * @returns The raw chunk data.
     */
    export function chunksDatChunkToRaw(chunkData: NBTSchemas.NBTSchemaTypes.ChunksDatChunk): Buffer<ArrayBuffer> {
        function packNibbleArray(arr: Range<0, 16>[]): Buffer<ArrayBuffer> {
            const out: Buffer<ArrayBuffer> = Buffer.alloc(arr.length / 2);
            let o = 0;
            for (let i = 0; i < arr.length; i += 2) {
                out[o++] = (arr[i]! & 0x0f) | ((arr[i + 1]! & 0x0f) << 4);
            }
            return out;
        }

        const blockIds: Buffer<ArrayBuffer> = Buffer.from(chunkData.value.block_ids.value.value);
        const blockDataPacked: Buffer<ArrayBuffer> = packNibbleArray(chunkData.value.block_data.value.value);
        const skyLightPacked: Buffer<ArrayBuffer> = packNibbleArray(chunkData.value.sky_light.value.value);
        const blockLightPacked: Buffer<ArrayBuffer> = packNibbleArray(chunkData.value.block_light.value.value);
        const updateMap: Buffer<ArrayBuffer> = Buffer.from(chunkData.value.update_map.value.value);
        const extra: Buffer<ArrayBuffer> = Buffer.from(chunkData.value.extra_data.value.value);

        const length = 4 + blockIds.length + blockDataPacked.length + skyLightPacked.length + blockLightPacked.length + updateMap.length + extra.length;

        if (length === 4) {
            return Buffer.alloc(0);
        }

        const sectorCount: number = Math.ceil(length / 4096);

        const dataBuf: Buffer<ArrayBuffer> = Buffer.alloc(sectorCount * 4096);
        dataBuf.writeUInt32LE(length, 0);

        let o = 4;
        blockIds.copy(dataBuf, o);
        o += blockIds.length;
        blockDataPacked.copy(dataBuf, o);
        o += blockDataPacked.length;
        skyLightPacked.copy(dataBuf, o);
        o += skyLightPacked.length;
        blockLightPacked.copy(dataBuf, o);
        o += blockLightPacked.length;
        updateMap.copy(dataBuf, o);
        o += updateMap.length;
        extra.copy(dataBuf, o);

        return dataBuf;
    }
}

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
 * An ID of a Minecraft China Edition dimension.
 */
export type DimensionMCCE = (typeof dimensionsMCCE)[number];

/**
 * Represents a three-directional vector with an associated dimension.
 */
export interface DimensionLocation extends Vector3 {
    /**
     * Dimension that this coordinate is associated with.
     *
     * For vanila dimensions, this is the string ID of the dimension without the `minecraft:` prefix.
     *
     * For custom dimensions, this is the numeric ID of the dimension.
     *
     * For Minecraft China Edition exclusive dimensions, this is the numeric ID of the dimension.
     */
    dimension: Dimension | number;
}

/**
 * Represents a two-directional vector with an associated dimension.
 */
export interface DimensionVector2 extends Vector2 {
    /**
     * Dimension that this coordinate is associated with.
     *
     * For vanila dimensions, this is the string ID of the dimension without the `minecraft:` prefix.
     *
     * For custom dimensions, this is the numeric ID of the dimension.
     *
     * For Minecraft China Edition exclusive dimensions, this is the numeric ID of the dimension.
     */
    dimension: Dimension | number;
}

/**
 * Represents a two-directional vector with X and Z components and an associated dimension.
 */
export interface DimensionVectorXZ extends VectorXZ {
    /**
     * Dimension that this coordinate is associated with.
     *
     * For vanila dimensions, this is the string ID of the dimension without the `minecraft:` prefix.
     *
     * For custom dimensions, this is the numeric ID of the dimension.
     *
     * For Minecraft China Edition exclusive dimensions, this is the numeric ID of the dimension.
     */
    dimension: Dimension | number;
}

/**
 * Represents a two-directional vector with X and Z components and an associated dimension and a subchunk index.
 */
export interface SubChunkIndexDimensionVectorXZ extends DimensionVectorXZ {
    /**
     * The index of this subchunk.
     *
     * Should be between 0 and 15 (inclusive).
     */
    subChunkIndex: number;
}

/**
 * Represents a two-directional vector with X and Z components and an associated dimension and a structure type.
 *
 * This is used for the {@link entryContentTypeToFormatMap.JigsawStructureBlueprint | JigsawStructureBlueprint} content type.
 */
export interface StructureTypeDimensionVectorXZ extends DimensionVectorXZ {
    /**
     * The type of the structure.
     *
     * This is an unsigned 64-bit integer.
     */
    structureType: bigint;
}

/**
 * Represents a two-directional vector with X and Z components and an associated dimension and a structure type.
 *
 * This is used for the {@link entryContentTypeToFormatMap.VersionEnchant | VersionEnchant} and {@link entryContentTypeToFormatMap.VersionMarkInsert | VersionMarkInsert} content types.
 */
export interface DimensionVersionDimensionVectorXZ extends DimensionVectorXZ {
    /**
     * The dimension version.
     *
     * This is between 1 and 999 (inclusive).
     */
    dimensionVersion: number;
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
     * The data for the individual blocks, `null` if this subchunk has no biome data and should not be written, or an empty array if this subchunk has no biome data and should be written.
     *
     * The values of this map to the index of the biome in the palette.
     */
    values: number[] | null;
    /**
     * The palette of biomes as a list of biome numeric IDs, or an empty array if this subchunk has no biome data.
     */
    palette: number[];
}

/**
 * The content type of a LevelDB entry.
 */
export type MCDBEntryContentType = (typeof MCDBEntryContentTypes)[number];

/**
 * The content type of a file.
 */
export type MCFileEntryContentType = (typeof MCFileEntryContentTypes)[number];

/**
 * The content type of a LevelDB entry or file.
 */
export type MCEntryContentType = (typeof MCEntryContentTypes)[number];

/**
 * A content type of a LevelDB chunk key entry (entries that use the key format of appending a byte representing the content type to the end of the key).
 */
export type MCDBChunkKeyEntryContentType = (typeof MCDBChunkKeyEntryContentTypes)[number];

/**
 * A content type of a LevelDB entry that is associated with a specific chunk.
 *
 * This includes the content types from {@link MCDBChunkKeyEntryContentType} as well as other content types that use different key formats but are still tied to a specific chunk.
 */
export type MCDBChunkLinkedContentType = (typeof MCDBChunkLinkedContentTypes)[number];

/**
 * The a grouping type of LevelDB entry content types.
 */
export type MCEntryContentTypeGroup = (typeof MCEntryContentTypesGrouping)[MCEntryContentType];

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
 * Converts a subchunk block index to an offset from the minimum corner of the subchunk.
 *
 * This indexes in XZY order.
 *
 * @param index The subchunk block index.
 * @returns The offset from the minimum corner of the subchunk.
 */
export function chunkBlockIndexToOffset(index: number): Vector3 {
    return {
        x: (index >> 8) & 0xf,
        y: (index >> 0) & 0xf,
        z: (index >> 4) & 0xf,
    };
}

/**
 * Converts an offset from the minimum corner of the subchunk to a subchunk block index.
 *
 * This indexes in XZY order.
 *
 * @param offset The offset from the minimum corner of the subchunk.
 * @returns The subchunk block index.
 */
export function offsetToChunkBlockIndex(offset: Vector3): number {
    return ((offset.x & 0xf) << 8) | (offset.y & 0xf) | ((offset.z & 0xf) << 4);
}

/**
 * Converts a chunk block index of a 128 block tall chunk to an offset from the minimum corner of the chunk.
 *
 * This indexes in XZY order.
 *
 * @param index The chunk block index.
 * @returns The offset from the minimum corner of the chunk.
 */
export function chunkBlock128IndexToOffset(index: number): Vector3 {
    return {
        x: (index >> 11) & 0xf,
        y: (index >> 0) & 0x7f,
        z: (index >> 7) & 0xf,
    };
}

/**
 * Converts an offset from the minimum corner of the 128 block tall chunk to a chunk block index.
 *
 * This indexes in XZY order.
 *
 * @param offset The offset from the minimum corner of the chunk.
 * @returns The chunk block index.
 */
export function offsetToChunkBlock128Index(offset: Vector3): number {
    return ((offset.x & 0xf) << 11) | (offset.y & 0x7f) | ((offset.z & 0xf) << 7);
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
 * Converts the dimension of a dimension vector to a numeric ID.
 *
 * @param dimension The dimension to convert.
 * @returns The numeric ID of the dimension.
 */
export function dimensionVectorDimensionToInt(dimension: Dimension | number): number {
    if (typeof dimension === "string") {
        const indexMCBE: number = dimensions.indexOf(dimension);
        if (indexMCBE !== -1) return indexMCBE;
        const indexMCCE: number = dimensionsMCCE.indexOf(dimension);
        return indexMCCE;
    }
    return dimension;
}

/**
 * Converts the dimension of a dimension vector to a ID.
 *
 * Vanilla dimensions will not include a namespace.
 *
 * @param dimension The dimension to convert.
 * @param db The LevelDB to use.
 * @returns The ID of the dimension.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 * @throws {ReferenceError} If the dimension is not found in the DimensionNameIdTable.
 */
export async function dimensionVectorDimensionToId(dimension: Dimension | number, db: LevelDB): Promise<LooseAutocomplete<Dimension>> {
    if (typeof dimension === "string") return dimension;
    const rawDimensionNameIdTable: Buffer | null = await db.get("DimensionNameIdTable");
    if (rawDimensionNameIdTable === null) throw new ReferenceError("DimensionNameIdTable not found.");
    const dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name"> = NBT.parseUncompressed(
        rawDimensionNameIdTable,
        "little"
    ) as NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name">;
    const dimensionNamespacedId: string | undefined = Object.entries(dimensionNameIdTable.value.entries.value).find(
        ([_namespacedId, numericId]) => numericId.value === dimension
    )?.[0];
    if (dimensionNamespacedId === undefined) throw new ReferenceError(`Dimension ${dimension} not found in DimensionNameIdTable.`);
    return dimensionNamespacedId;
}

/**
 * Converts the dimension of a dimension vector to a ID synchronously.
 *
 * Vanilla dimensions will not include a namespace.
 *
 * @param dimension The dimension to convert.
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @returns The ID of the dimension.
 *
 * @throws {ReferenceError} If the dimension is not found in the DimensionNameIdTable.
 */
export function dimensionVectorDimensionToIdSync(
    dimension: Dimension | number,
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable
): LooseAutocomplete<Dimension> {
    if (typeof dimension === "string") return dimension;
    const dimensionNamespacedId: string | undefined = Object.entries(dimensionNameIdTable.value.entries.value).find(
        ([_namespacedId, numericId]) => numericId.value === dimension
    )?.[0];
    if (dimensionNamespacedId === undefined) throw new ReferenceError(`Dimension ${dimension} not found in DimensionNameIdTable.`);
    return dimensionNamespacedId;
}

/**
 * Converts the ID of a dimension of a dimension vector.
 *
 * Vanilla dimensions do not require a namespace.
 *
 * NOTE: Minecraft China Edition exclusive numeric dimensions (dimensions dm3-dm20) are returned as their numeric ID rather than a string.
 *
 * @param dimension The dimension to convert. Case-sensitive.
 * @param db The LevelDB to use.
 * @returns The ID of the dimension.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 * @throws {ReferenceError} If the dimension is not found in the DimensionNameIdTable.
 */
export async function dimensionIdToDimensionVectorDimension(dimension: LooseAutocomplete<Dimension>, db: LevelDB): Promise<Dimension | number> {
    if (dimensions.includes(dimension.replace(/^minecraft:/, "") as Dimension)) return dimension.replace(/^minecraft:/, "") as Dimension;
    if (dimensionsMCCE.includes(dimension.replace(/^minecraft:/, "") as DimensionMCCE))
        return dimensionsMCCE.indexOf(dimension.replace(/^minecraft:/, "") as DimensionMCCE);
    const rawDimensionNameIdTable: Buffer | null = await db.get("DimensionNameIdTable");
    if (rawDimensionNameIdTable === null) throw new ReferenceError("DimensionNameIdTable not found.");
    const dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name"> = NBT.parseUncompressed(
        rawDimensionNameIdTable,
        "little"
    ) as NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name">;
    const dimensionNumericId: number | undefined = Object.entries(dimensionNameIdTable.value.entries.value).find(
        ([namespacedId, _numericId]) => namespacedId === dimension
    )?.[1].value;
    if (dimensionNumericId === undefined) throw new ReferenceError(`Dimension ${dimension} not found in DimensionNameIdTable.`);
    return dimensionNumericId;
}

/**
 * Converts the ID of a dimension of a dimension vector synchronously.
 *
 * Vanilla dimensions do not require a namespace.
 *
 * NOTE: Minecraft China Edition exclusive numeric dimensions (dimensions 3-20) are returned as their numeric ID rather than a string.
 *
 * @param dimension The dimension to convert. Case-sensitive.
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @returns The ID of the dimension.
 *
 * @throws {ReferenceError} If the dimension is not found in the DimensionNameIdTable.
 */
export function dimensionIdToDimensionVectorDimensionSync(
    dimension: LooseAutocomplete<Dimension>,
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable
): Dimension | number {
    if (dimensions.includes(dimension.replace(/^minecraft:/, "") as Dimension)) return dimension.replace(/^minecraft:/, "") as Dimension;
    if (dimensionsMCCE.includes(dimension.replace(/^minecraft:/, "") as DimensionMCCE))
        return dimensionsMCCE.indexOf(dimension.replace(/^minecraft:/, "") as DimensionMCCE);
    const dimensionNumericId: number | undefined = Object.entries(dimensionNameIdTable.value.entries.value).find(
        ([namespacedId, _numericId]) => namespacedId === dimension
    )?.[1].value;
    if (dimensionNumericId === undefined) throw new ReferenceError(`Dimension ${dimension} not found in DimensionNameIdTable.`);
    return dimensionNumericId;
}

/**
 * Converts a dimension's numeric ID to a dimension vector dimension.
 *
 * NOTE: Minecraft China Edition exclusive numeric dimensions (dimensions 3-20) are returned as their numeric ID rather than a string.
 *
 * @param dimension The numeric ID of the dimension.
 * @returns The dimension vector dimension.
 */
export function intToDimensionVectorDimension(dimension: number): Dimension | number {
    return dimensions[dimension] ?? dimension;
}

/**
 * Gets the dimension types from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension types.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionTypes(
    db: LevelDB,
    options: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions: true;
    }
): Promise<Record<Dimension | DimensionMCCE | `${string}:${string}`, number>>;
/**
 * Gets the dimension types from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension types.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionTypes(
    db: LevelDB,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: false;
    }
): Promise<Record<Dimension | `${string}:${string}`, number>>;
/**
 * Gets the dimension types from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension types.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionTypes(
    db: LevelDB,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): Promise<Record<Dimension | `${string}:${string}`, number> | Record<Dimension | DimensionMCCE | `${string}:${string}`, number>>;
/**
 * Gets the dimension types from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension types.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionTypes(
    db: LevelDB,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): Promise<Record<Dimension | `${string}:${string}`, number> | Record<Dimension | DimensionMCCE | `${string}:${string}`, number>> {
    const rawDimensionNameIdTable: Buffer | null = await db.get("DimensionNameIdTable");
    if (rawDimensionNameIdTable === null) throw new ReferenceError("DimensionNameIdTable not found.");
    const dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name"> = NBT.parseUncompressed(
        rawDimensionNameIdTable,
        "little"
    ) as NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name">;
    return getDimensionTypesSync(dimensionNameIdTable, options);
}

/**
 * Gets the dimension types from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension types.
 */
export function getDimensionTypesSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         */
        includeMCCEDimensions: true;
    }
): Record<Dimension | DimensionMCCE | `${string}:${string}`, number>;
/**
 * Gets the dimension types from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension types.
 */
export function getDimensionTypesSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: false;
    }
): Record<Dimension | `${string}:${string}`, number>;
/**
 * Gets the dimension types from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension types.
 */
export function getDimensionTypesSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): Record<Dimension | `${string}:${string}`, number> | Record<Dimension | DimensionMCCE | `${string}:${string}`, number>;
/**
 * Gets the dimension types from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension types.
 */
export function getDimensionTypesSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): Record<Dimension | `${string}:${string}`, number> | Record<Dimension | DimensionMCCE | `${string}:${string}`, number> {
    return {
        ...(options?.includeMCCEDimensions ?
            Object.fromEntries(
                dimensionsMCCE
                    .map((dimension: DimensionMCCE, i: number) => (!dimensions.includes(dimension as never) ? [dimension, i] : null))
                    .filter((dimension): dimension is [DimensionMCCE, number] => dimension !== null)
            )
        :   undefined),
        ...(Object.fromEntries(dimensions.map((dimension: Dimension, i: number) => [dimension, i])) as Record<Dimension, number>),
        ...(Object.fromEntries(
            Object.entries(dimensionNameIdTable.value.entries.value).map(([namespacedId, numericId]) => [namespacedId, numericId.value])
        ) as Record<`${string}:${string}` | Dimension, number>),
    };
}

/**
 * Gets the dimension IDs from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionIds(
    db: LevelDB,
    options: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions: true;
    }
): Promise<(Dimension | DimensionMCCE | `${string}:${string}`)[]>;
/**
 * Gets the dimension IDs from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionIds(
    db: LevelDB,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: false;
    }
): Promise<(Dimension | `${string}:${string}`)[]>;
/**
 * Gets the dimension IDs from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionIds(
    db: LevelDB,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): Promise<(Dimension | `${string}:${string}`)[] | (Dimension | DimensionMCCE | `${string}:${string}`)[]>;
/**
 * Gets the dimension IDs from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionIds(
    db: LevelDB,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): Promise<(Dimension | `${string}:${string}`)[] | (Dimension | DimensionMCCE | `${string}:${string}`)[]> {
    const rawDimensionNameIdTable: Buffer | null = await db.get("DimensionNameIdTable");
    if (rawDimensionNameIdTable === null) throw new ReferenceError("DimensionNameIdTable not found.");
    const dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name"> = NBT.parseUncompressed(
        rawDimensionNameIdTable,
        "little"
    ) as NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name">;
    return getDimensionIdsSync(dimensionNameIdTable, options);
}

/**
 * Gets the dimension IDs from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 */
export function getDimensionIdsSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions: true;
    }
): (Dimension | DimensionMCCE | `${string}:${string}`)[];
/**
 * Gets the dimension IDs from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 */
export function getDimensionIdsSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: false;
    }
): (Dimension | `${string}:${string}`)[];
/**
 * Gets the dimension IDs from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 */
export function getDimensionIdsSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): (Dimension | `${string}:${string}`)[] | (Dimension | DimensionMCCE | `${string}:${string}`)[];
/**
 * Gets the dimension IDs from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension IDs.
 */
export function getDimensionIdsSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): (Dimension | `${string}:${string}`)[] | (Dimension | DimensionMCCE | `${string}:${string}`)[] {
    return [
        ...new Set([
            ...dimensions,
            ...(options?.includeMCCEDimensions ? dimensionsMCCE : []),
            ...(Object.keys(dimensionNameIdTable.value.entries.value) as `${string}:${string}`[]),
        ]),
    ];
}

/**
 * Gets the dimension numeric IDs from the DimensionNameIdTable.
 *
 * @param db The LevelDB to use.
 * @param options The options to use.
 * @returns The dimension numeric IDs.
 *
 * @throws {ReferenceError} If the DimensionNameIdTable is not found.
 */
export async function getDimensionNumericIds(
    db: LevelDB,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): Promise<number[]> {
    const rawDimensionNameIdTable: Buffer | null = await db.get("DimensionNameIdTable");
    if (rawDimensionNameIdTable === null) throw new ReferenceError("DimensionNameIdTable not found.");
    const dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name"> = NBT.parseUncompressed(
        rawDimensionNameIdTable,
        "little"
    ) as NBTSchemas.NBTSchemaTypes.DimensionNameIdTable & Pick<NBT.NBT, "name">;
    return getDimensionNumericIdsSync(dimensionNameIdTable, options);
}

/**
 * Gets the dimension numeric IDs from the DimensionNameIdTable synchronously.
 *
 * @param dimensionNameIdTable The DimensionNameIdTable to use.
 * @param options The options to use.
 * @returns The dimension numeric IDs.
 */
export function getDimensionNumericIdsSync(
    dimensionNameIdTable: NBTSchemas.NBTSchemaTypes.DimensionNameIdTable,
    options?: {
        /**
         * Whether to include Minecraft China Edition exclusive dimensions.
         *
         * @default false
         */
        includeMCCEDimensions?: boolean;
    }
): number[] {
    return [
        ...new Set([
            ...dimensions.map((_dimension: Dimension, i: number): number => i),
            ...(options?.includeMCCEDimensions ? dimensionsMCCE.map((_dimension: DimensionMCCE, i: number): number => i) : []),
            ...Object.values(dimensionNameIdTable.value.entries.value).map((numericId: NBT.Int): number => numericId.value),
        ]),
    ];
}

/**
 * Gets the chunk indices from a LevelDB key.
 *
 * The key must be a [chunk key](https://minecraft.wiki/w/Bedrock_Edition_level_format#Chunk_key_format) or one of the following content types:
 * - {@link entryContentTypeToFormatMap.Digest | Digest}
 *
 * @param key The key to get the chunk indices for, as a Buffer.
 * @returns The chunk indices.
 */
export function getChunkKeyIndices(
    key: Buffer
): DimensionVersionDimensionVectorXZ | StructureTypeDimensionVectorXZ | SubChunkIndexDimensionVectorXZ | DimensionVectorXZ {
    // Digest
    if ([12, 16].includes(key.length) && key[0] === 0x64 && key[1] === 0x69 && key[2] === 0x67 && key[3] === 0x70) {
        return {
            x: getInt32Val(key, 4),
            z: getInt32Val(key, 8),
            dimension: key.length === 16 ? intToDimensionVectorDimension(getInt32Val(key, 12)) : "overworld",
        };
    }
    // JigsawStructureBlueprint
    if (key.length === 21 && key[12] === 0x78) {
        return {
            x: getInt32Val(key, 0),
            z: getInt32Val(key, 4),
            dimension: intToDimensionVectorDimension(getInt32Val(key, 8)),
            structureType: key.readBigUInt64LE(13),
        };
    }
    // VersionEnchant - Overworld
    if ([10, 11].includes(key.length) && key[8] === 0x6e) {
        return {
            x: getInt32Val(key, 0),
            z: getInt32Val(key, 4),
            dimension: "overworld",
            dimensionVersion: readLittleVarint(key, 10).value,
        };
    }
    // VersionEnchant - Other Dimensions
    if ([14, 15].includes(key.length) && key[12] === 0x6e) {
        return {
            x: getInt32Val(key, 0),
            z: getInt32Val(key, 4),
            dimension: intToDimensionVectorDimension(getInt32Val(key, 8)),
            dimensionVersion: readLittleVarint(key, 14).value,
        };
    }
    // VersionMarkInsert - Overworld
    if (key.length === 11 && key[8] === 0x6f) {
        return {
            x: getInt32Val(key, 0),
            z: getInt32Val(key, 4),
            dimension: "overworld",
            dimensionVersion: readLittleVarint(key, 10).value - 10000,
        };
    }
    // VersionMarkInsert - Other Dimensions
    if (key.length === 15 && key[12] === 0x6f) {
        return {
            x: getInt32Val(key, 0),
            z: getInt32Val(key, 4),
            dimension: intToDimensionVectorDimension(getInt32Val(key, 8)),
            dimensionVersion: readLittleVarint(key, 14).value - 10000,
        };
    }
    return {
        x: getInt32Val(key, 0),
        z: getInt32Val(key, 4),
        dimension: [13, 14].includes(key.length) ? intToDimensionVectorDimension(getInt32Val(key, 8)) : "overworld",
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
    indices: DimensionVersionDimensionVectorXZ | StructureTypeDimensionVectorXZ | SubChunkIndexDimensionVectorXZ | DimensionVectorXZ,
    chunkKeyType: MCDBChunkLinkedContentType
): Buffer<ArrayBuffer> {
    if (typeof indices.dimension === "string") {
        if (dimensions.indexOf(indices.dimension) === -1 && dimensionsMCCE.indexOf(indices.dimension) === -1) {
            throw new TypeError(`Invalid dimension: ${indices.dimension}. For custom dimensions please provide the numeric ID instead.`);
        }
        indices = { ...indices }; // Prevents mutating the original object.
        indices.dimension = dimensionVectorDimensionToInt(indices.dimension);
    }

    if (chunkKeyType === "Digest") {
        const buffer: Buffer<ArrayBuffer> = Buffer.alloc(indices.dimension === 0 ? 12 : 16);
        buffer[0] = 0x64; // d
        buffer[1] = 0x69; // i
        buffer[2] = 0x67; // g
        buffer[3] = 0x70; // p
        setInt32Val(buffer, 4, indices.x);
        setInt32Val(buffer, 8, indices.z);
        if (indices.dimension !== 0) setInt32Val(buffer, 8, indices.dimension);
        return buffer;
    }

    if (chunkKeyType === "JigsawStructureBlueprint") {
        const buffer: Buffer<ArrayBuffer> = Buffer.alloc(21);
        setInt32Val(buffer, 0, indices.x);
        setInt32Val(buffer, 4, indices.z);
        setInt32Val(buffer, 8, indices.dimension);
        buffer[12] = getIntFromChunkKeyType(chunkKeyType);
        if ("structureType" in indices && indices.structureType !== undefined) buffer.writeBigUInt64LE(indices.structureType, 13);
        return buffer;
    }

    if (chunkKeyType === "VersionEnchant") {
        const buffer: Buffer<ArrayBuffer> = Buffer.alloc(indices.dimension === 0 ? 9 : 13);
        setInt32Val(buffer, 0, indices.x);
        setInt32Val(buffer, 4, indices.z);
        if (indices.dimension !== 0) setInt32Val(buffer, 8, indices.dimension);
        buffer[8 + +(indices.dimension !== 0) * 4] = getIntFromChunkKeyType(chunkKeyType);
        if ("dimensionVersion" in indices && indices.dimensionVersion !== undefined) {
            return Buffer.concat([buffer, Buffer.from(writeLittleVarint(indices.dimensionVersion))]);
        }
        return buffer;
    }

    if (chunkKeyType === "VersionMarkInsert") {
        const buffer: Buffer<ArrayBuffer> = Buffer.alloc(indices.dimension === 0 ? 9 : 13);
        setInt32Val(buffer, 0, indices.x);
        setInt32Val(buffer, 4, indices.z);
        if (indices.dimension !== 0) setInt32Val(buffer, 8, indices.dimension);
        buffer[8 + +(indices.dimension !== 0) * 4] = getIntFromChunkKeyType(chunkKeyType);
        if ("dimensionVersion" in indices && indices.dimensionVersion !== undefined) {
            return Buffer.concat([buffer, Buffer.from(writeLittleVarint(indices.dimensionVersion + 10000))]);
        }
        return buffer;
    }

    const buffer: Buffer<ArrayBuffer> = Buffer.alloc((indices.dimension === 0 ? 9 : 13) + +("subChunkIndex" in indices && indices.subChunkIndex !== undefined));
    setInt32Val(buffer, 0, indices.x);
    setInt32Val(buffer, 4, indices.z);
    if (indices.dimension !== 0) {
        setInt32Val(buffer, 8, indices.dimension);
    }
    buffer[8 + +(indices.dimension !== 0) * 4] = getIntFromChunkKeyType(chunkKeyType);
    if ("subChunkIndex" in indices && indices.subChunkIndex !== undefined) buffer[9 + +(indices.dimension !== 0) * 4] = indices.subChunkIndex;
    return buffer;
}

/**
 * Converts a chunk key type to the integer value that represents it.
 *
 * @param chunkKeyType The chunk key type.
 * @returns The integer value.
 */
function getIntFromChunkKeyType(chunkKeyType: MCDBChunkKeyEntryContentType): number {
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
        case "VersionEnchant":
            return 0x6e;
        case "VersionMarkInsert":
            return 0x6f;
        case "unknown0x70":
            return 0x70;
        case "unknown0x71":
            return 0x71;
        case "LegacyVersion":
            return 0x76;
        case "AABBVolumes":
            return 0x77;
        case "JigsawStructureBlueprint":
            return 0x78;
    }
}

/**
 * Gets a human-readable version of a LevelDB key.
 *
 * @param key The key to get the display name for, as a Buffer.
 * @returns A human-readable version of the key.
 */
export function getKeyDisplayName(key: Buffer): string {
    const contentType: MCDBEntryContentType = getContentTypeFromDBKey(key);
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
        case "VersionEnchant":
        case "VersionMarkInsert":
        case "unknown0x70":
        case "unknown0x71":
        case "LegacyVersion":
        case "AABBVolumes":
        case "JigsawStructureBlueprint": {
            const indices: StructureTypeDimensionVectorXZ | SubChunkIndexDimensionVectorXZ | DimensionVectorXZ = getChunkKeyIndices(key);
            return `${indices.dimension}_${indices.x}_${indices.z}${
                "subChunkIndex" in indices && indices.subChunkIndex !== undefined ? `_${indices.subChunkIndex}` : ""
            }${"structureType" in indices && indices.structureType !== undefined ? `_${indices.structureType}` : ""}${"dimensionVersion" in indices && indices.dimensionVersion !== undefined ? `_${indices.dimensionVersion}` : ""}_${contentType}`;
        }
        case "Digest": {
            const indices: DimensionVectorXZ = getChunkKeyIndices(key);
            return `digp_${indices.dimension}_${indices.x}_${indices.z}`;
        }
        case "ActorPrefix": {
            return `actorprefix_${getInt32Val(key, key.length - 8)}_${getInt32Val(key, key.length - 4)}`;
        }
        case "AutonomousEntities":
        case "BiomeData":
        case "BiomeIdsTable":
        case "ChunkLoadedRequest":
        case "DimensionNameIdTable":
        case "Overworld":
        case "Nether":
        case "TheEnd":
        case "CustomDimension":
        case "DynamicProperties":
        case "FlatWorldLayers":
        case "ForcedWorldCorruption":
        case "LegacyOverworldStructures":
        case "LegacyNetherStructures":
        case "LegacyTheEndStructures":
        case "LevelChunkMetaDataDictionary":
        case "LevelSpawnWasFixed":
        case "PositionTrackingDB":
        case "PositionTrackingLastId":
        case "Map":
        case "MobEvents":
        case "MVillages":
        case "Player":
        case "PlayerClient":
        case "LegacyConsolePlayer":
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
        case "WorldClocks":
        case "POITypes":
        case "POIRegionRegistry":
        case "POIRegion":
        case "SSTCommandLog":
        case "SSTHashRegistry":
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
export function getContentTypeFromDBKey(key: Buffer): MCDBEntryContentType {
    if ([9, 10, 11, 13, 14, 15].includes(key.length)) {
        if ([9, 13].includes(key.length)) {
            switch (key.at(-1)) {
                case 0x2b:
                    return "Data3D";
                case 0x2c:
                    return "Version";
                case 0x2d:
                    return "Data2D";
                case 0x2e:
                    return "Data2DLegacy";
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
                case 0x70:
                    return "unknown0x70";
                case 0x71:
                    return "unknown0x71";
                case 0x76:
                    return "LegacyVersion";
                case 0x77:
                    return "AABBVolumes";
            }
        } else if ([10, 14].includes(key.length)) {
            switch (key.at(-2)) {
                case 0x2f:
                    return "SubChunkPrefix";
                case 0x6e:
                    if (key.length === 10) break; // This is handled later to avoid false detections.
                    try {
                        const dimensionVersion: number = readLittleVarint(key.subarray(-1), 0).value;
                        if (dimensionVersion < 1 || dimensionVersion > 127) break;
                        return "VersionEnchant";
                    } catch {}
                    break;
            }
        } else if ([11, 15].includes(key.length)) {
            switch (key.at(-3)) {
                case 0x6e:
                    try {
                        const dimensionVersion: number = readLittleVarint(key.subarray(-2), 0).value;
                        if (dimensionVersion < 128 || dimensionVersion > 999) break;
                        return "VersionEnchant";
                    } catch {}
                    break;
                case 0x6f:
                    try {
                        const dimensionVersion: number = readLittleVarint(key.subarray(-2), 0).value;
                        if (dimensionVersion < 10001 || dimensionVersion > 10999) break;
                        return "VersionMarkInsert";
                    } catch {}
                    break;
            }
        }
    }
    const stringKey: string = key.toString();
    switch (stringKey) {
        case "~local_player":
        case "~local_player.Editor":
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
        case "DimensionNameIdTable":
            return "DimensionNameIdTable";
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
        case "WorldClocks":
            return "WorldClocks";
        case "poi_types":
            return "POITypes";
        case "SST_SALOG":
            return "SSTCommandLog";
        case "SST_NAME":
        case "SST_SIGH":
        case "SST_WORD":
        case "SST_WORD_":
            return "SSTHashRegistry";
        case "DedicatedServerForcedCorruption":
            return "ForcedWorldCorruption";
        case "dimension0":
            return "LegacyOverworldStructures";
        case "dimension1":
            return "LegacyNetherStructures";
        case "dimension2":
            return "LegacyTheEndStructures";
        case "mVillages":
            return "MVillages";
        case "villages":
            return "Villages";
        case "LevelSpawnWasFixed":
            return "LevelSpawnWasFixed";
        case "neteaseData":
            return "NeteaseData";
        case "scriptGid":
            return "NeteaseScriptGid";
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "10":
        case "11":
        case "12":
        case "13":
        case "14":
        case "15":
        case "16":
        case "17":
        case "18":
        case "19":
        case "20":
            return "MCChinaDevDimension";
    }
    // REVIEW: Maybe there should also be handling for the SST_ prefix, instead of only manual handling of each specific SST_ key.
    switch (true) {
        case stringKey.startsWith("PosTrackDB-0x"):
            return "PositionTrackingDB";
        case stringKey.startsWith("actorprefix"):
            return "ActorPrefix";
        case stringKey.startsWith("structuretemplate_"):
            return "StructureTemplate";
        case stringKey.startsWith("tickingarea"):
            return "TickingArea";
        case stringKey.startsWith("portals"):
            return "Portals";
        case stringKey.startsWith("map_"):
            return "Map";
        case stringKey.startsWith("player_server_"):
            return "Player";
        // FIXME: This does not work properly on really old worlds, where there was no PlayerClient content type, and the Player content type was prefixed with player_ instead of player_server_. The older Player keys also used UUIDv3, just like the newer PlayerClient keys. But I'm pretty sure the game does upgrade all Player keys to the new key format when udpating, so maybe if there are PlayerClient keys but no Player keys, then they are PlayerClient keys, or it could just check the contents, or the version in the level.dat.
        case stringKey.startsWith("player_"):
            return "PlayerClient";
        case stringKey.startsWith("legacy_console_player_"):
            return "LegacyConsolePlayer";
        case stringKey.startsWith("digp") && (stringKey.length === 12 || stringKey.length === 16):
            return "Digest";
        // REVIEW: The dimension may not be present in this key in older versions (if it was present in those older version), like with the village-related keys.
        case /^chunk_loaded_request_(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr]|[3-9]|1[0-9]|20|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])_\d+$/.test(
            stringKey
        ):
            return "ChunkLoadedRequest";
        case stringKey.startsWith("RealmsStoriesData_"):
            return "RealmsStoriesData";
        case /^VILLAGE_(?:(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr]|[3-9]|1[0-9]|20|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])_)?[0-9a-f\\-]+_POI$/.test(
            stringKey
        ):
            return "VillagePOI";
        case /^VILLAGE_(?:(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr]|[3-9]|1[0-9]|20|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])_)?[0-9a-f\\-]+_INFO$/.test(
            stringKey
        ):
            return "VillageInfo";
        case /^VILLAGE_(?:(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr]|[3-9]|1[0-9]|20|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])_)?[0-9a-f\\-]+_DWELLERS$/.test(
            stringKey
        ):
            return "VillageDwellers";
        case /^VILLAGE_(?:(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr]|[3-9]|1[0-9]|20|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])_)?[0-9a-f\\-]+_PLAYERS$/.test(
            stringKey
        ):
            return "VillagePlayers";
        case /^VILLAGE_(?:(?:[Oo][Vv][Ee][Rr][Ww][Oo][Rr][Ll][Dd]|[Tt][Hh][Ee]_[Ee][Nn][Dd]|[Nn][Ee][Tt][Hh][Ee][Rr]|[3-9]|1[0-9]|20|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])_)?[0-9a-f\\-]+_RAID$/.test(
            stringKey
        ):
            return "VillageRaid";
        // REVIEW: Figure out if the number can be negative, I think it may actually be the dimension.
        case /^poi\.\d+\.regions$/.test(stringKey):
            return "POIRegionRegistry";
        case /^poi\.\d+\.regions\.-?\d+\.-?\d+$/.test(stringKey):
            return "POIRegion";
    }
    // TODO: Make this more strict.
    if (key.length === 21) {
        switch (key[12]) {
            case 0x78:
                if (key.readUInt32LE(8) > 65535) break; // Invalid dimension numeric ID.
                return "JigsawStructureBlueprint";
        }
    } else if (key.length === 10) {
        switch (key[9]) {
            case 0x6e:
                if (stringKey.startsWith("dimension")) break;
                try {
                    const dimensionVersion: number = readLittleVarint(key.subarray(-1), 0).value;
                    if (dimensionVersion < 1 || dimensionVersion > 127) break;
                    return "VersionEnchant";
                } catch {}
                break;
        }
    }
    // IDEA: Maybe add a way to make this based on the data in the key or the actual custom dimension IDs mapping.
    if (
        /^[\u0001-\u0008\u000b-\u000c\u000e-\u001f\u0021-\u0039\u003b-\uffff]+:[\u0001-\u0008\u000b-\u000c\u000e-\u001f\u0021-\u0039\u003b-\uffff]+$/.test(
            stringKey
        )
    ) {
        return "CustomDimension";
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
