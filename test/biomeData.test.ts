import { LevelDB } from "@8crafter/leveldb-zlib";

const worldDir: string = String.raw`C:\Users\ander\Downloads\NBTEditorTestingWorld1`;
import * as mcbe from "mcbe-leveldb/ts";
import { writeFileSync } from "node:fs";
let i = 0;

const db = new LevelDB(`${worldDir}/db`);
await db.open();
const keys = await mcbe.getKeysOfType(db, "Data3D");
const l = keys.length;
// for (const key of tab.cachedDBKeys.Data3D) {
//     try {
//     const data = await mcbe.entryContentTypeToFormatMap.Data3D.parse(await tab.db.get(key));
//     for (const biomeSubChunk of data.value.biomes.value.value) {
//         console.log(biomeSubChunk.values.value.value, "all value types:", [...new Set(biomeSubChunk.values.value.value)].join(", "));
//         console.log(biomeSubChunk.palette.value.value);
//     }
//     tab.db.put(key, mcbe.entryContentTypeToFormatMap.Data3D.serialize(data))
//     i++;
//     console.log(`${i}/${l}`);
//     } catch (e) {console.error(e)}
// }

const key = keys[0]!;

const data = mcbe.entryContentTypeToFormatMap.Data3D.parse((await db.get(key))!);
const dataCycled = mcbe.entryContentTypeToFormatMap.Data3D.parse(mcbe.entryContentTypeToFormatMap.Data3D.serialize(data));
const subChunks = data.value.biomes.value.value;
const subChunksCycled = dataCycled.value.biomes.value.value;
writeFileSync(`./test1_data3d_${i}.bin`, (await db.get(key))!);
writeFileSync(`./test1_data3d_${i}_cycled.bin`, mcbe.entryContentTypeToFormatMap.Data3D.serialize(data));
writeFileSync(
    `./test1_data3d_${i}_cycled_x2.bin`,
    mcbe.entryContentTypeToFormatMap.Data3D.serialize(mcbe.entryContentTypeToFormatMap.Data3D.parse(mcbe.entryContentTypeToFormatMap.Data3D.serialize(data)))
);
for (const biomeSubChunkIndex in data.value.biomes.value.value) {
    console.log("before", "all value types:", [...new Set(subChunks[biomeSubChunkIndex]!.values.value.value)].join(", "));
    console.log("after", "all value types:", [...new Set(subChunksCycled[biomeSubChunkIndex]!.values.value.value)].join(", "));
    console.log("before", "palette", subChunks[biomeSubChunkIndex]!.palette.value.value);
    console.log("after", "palette", subChunksCycled[biomeSubChunkIndex]!.palette.value.value);
    // console.log(biomeSubChunk.palette.value.value);
}
i++;
