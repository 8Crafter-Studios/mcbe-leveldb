const args: string[] = process.argv.slice(2);
const worldDir = args.find((arg: string): boolean => arg.toLowerCase().startsWith("--worlddir="))?.slice("--worlddir=".length);
const blockTypesRaw = args.find((arg: string): boolean => arg.toLowerCase().startsWith("--blocktypes="))?.slice("--blocktypes=".length);
const blockTypes = blockTypesRaw?.split(",").map((s: string): string => s.trim()) as string[];
const outFile = args.find((arg: string): boolean => arg.toLowerCase().startsWith("--outfile="))?.slice("--outfile=".length);
if (!worldDir || !blockTypes || !outFile) {
    console.error("Usage: node --experimental-transform-types findBlocksOfTypes.ts --worldDir=<worldDir> --blockTypes=<blockTypes> --outFile=<outFile>");
    process.exit(1);
}

import { LevelDB } from "@8crafter/leveldb-zlib";
import {
    chunkBlockIndexToOffset,
    entryContentTypeToFormatMap,
    getChunkKeyIndices,
    getKeysOfType,
    type DimensionLocation,
    type NBTSchemas,
    type SubChunkIndexDimensionVectorXZ,
    type Vector3,
    type VectorXZ,
} from "mcbe-leveldb/ts";
import { writeFileSync } from "node:fs";

const db = new LevelDB(`${worldDir}/db`);
await db.open();

let blockLocations: DimensionLocation[] = [];

for (const key of await getKeysOfType(db, "SubChunkPrefix")) {
    try {
        const raw: Buffer | null = await db.get(key);
        if (!raw) continue;
        const subChunkPrefix: NBTSchemas.NBTSchemaTypes.SubChunkPrefix = await entryContentTypeToFormatMap.SubChunkPrefix.parse(raw);
        const indices: SubChunkIndexDimensionVectorXZ = getChunkKeyIndices(key) as SubChunkIndexDimensionVectorXZ;
        const chunkLocation: Vector3 = { x: indices.x * 16, y: indices.subChunkIndex * 16, z: indices.z * 16 };
        // console.log(indices, "subChunkIndex" in indices ? (indices.subChunkIndex << 24) >> 24 : undefined);
        for (const layer of subChunkPrefix.value.layers.value.value) {
            if (!Object.values(layer.palette.value).some((v: NBTSchemas.NBTSchemaTypes.Block): boolean => blockTypes.includes(v.value.name.value))) continue;
            layer.block_indices.value.value
                .map((blockIndex: number, i: number): [blockIndex: number, i: number] => [blockIndex, i])
                .filter(([blockIndex]: [blockIndex: number, i: number]): boolean => blockTypes.includes(layer.palette.value[blockIndex]!.value.name.value))
                .forEach(([_blockIndex, i]: [blockIndex: number, i: number]): void => {
                    const offset: Vector3 = chunkBlockIndexToOffset(i);
                    blockLocations.push({
                        x: chunkLocation.x + offset.x,
                        y: chunkLocation.y + offset.y,
                        z: chunkLocation.z + offset.z,
                        dimension: indices.dimension,
                    });
                });
        }
    } catch (e) {
        console.error(e);
    }
}

writeFileSync(outFile, JSON.stringify(blockLocations, null, 4).replaceAll(/(?<!\r)\n/g, "\r\n"));
