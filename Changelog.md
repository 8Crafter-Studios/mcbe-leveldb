<!-- -   Added the `EntitiesDat` NBT schema. -->
<!-- -   Added the `LegacyConsolePlayer` NBT schema. -->

# v1.25.0

## Additions

-   Added the `generatorTypes` constant.

## Changes

-   Miscellaneous minor type and documentation changes.

## Fixes

-   Fixes to the `Generator` field of the `LevelDat` NBT schema.

# v1.24.0

## Critical Fixes

-   Fixed a bug where the `generateChunkKeyFromIndices` function could mutate the `dimension` property of the object passed to the `indices` parameter and replace the string dimension ID with its numeric counterpart.
-   Fixed a bug where strings with a value of `"true"` or `"false"` were not quoted when being converted to SNBT, causing them to turn into bytes when parsed back into Prismarine-NBT ([#11](https://github.com/8Crafter-Studios/mcbe-leveldb/issues/11)).

## Breaking Changes

-   The `DBEntryContentType` type has been split into `MCEntryContentType`, `MCDBEntryContentType`, and `MCFileEntryContentType`.
-   The `DBEntryContentTypes` constant has been split into `MCEntryContentTypes`, `MCDBEntryContentTypes`, and `MCFileEntryContentTypes`.
-   The `DBChunkKeyEntryContentTypes` constant has been renamed to `MCDBChunkKeyEntryContentTypes`.
-   The `DBChunkLinkedContentTypes` constant has been renamed to `MCDBChunkLinkedContentTypes`.
-   The `DBEntryContentTypesGrouping` constant has been renamed to `MCEntryContentTypesGrouping`.

## Additions

-   The `LevelDat` parser/serializer now supports `StorageVersion` `1`, which was used in MCPE Alpha versions prior to 0.2.0.
-   Added the `JigsawStructureBlueprint` content type.
-   Added the `JigsawStructureBlueprint` NBT schema.
-   Added the `POITypes` content type.
-   Added the `POITypes` NBT schema.
-   Added the `POIRegionRegistry` content type.
-   Added the `POIRegionRegistry` NBT schema.
-   Added the `POIRegion` content type.
-   Added the `POIRegion` NBT schema.
-   Added the `PlayerDat` content type.
-   Added the `PlayerDat` NBT schema.
-   Added the `LANPlayerDat` content type.
-   Added the `LANPlayerDat` NBT schema.
-   Added the `EntitiesDat` content type.
-   Added the `ChunksDat` content type.
-   Added the `ChunksDat` NBT schema.
-   Added the `ChunksDatChunk` NBT schema.
-   Added the `ImportedChunksDat` content type.
-   Added the `ImportedChunksDat` NBT schema.
-   Added the `LegacyConsolePlayer` content type.
-   Added a custom serializer and parser for the `LegacyBlockExtraData` content type.
-   Added the `LegacyBlockExtraData` NBT schema.
-   Added the `FileBasedStorageItemStack` NBT schema.
-   Added the `FileBasedStoragePlayerData` NBT schema.
-   Added the `VersionEnchant` content type (MCCE exclusive).
-   Added the `VersionMarkInsert` content type (MCCE exclusive).
-   Added the `unknown0x70` placeholder content type (MCCE exclusive).
-   Added the `unknown0x71` placeholder content type (MCCE exclusive).
-   Added the `SSTCommandLog` content type (MCCE exclusive).
-   Added the `SSTHashRegistry` content type (MCCE exclusive).
-   Added the `MCChinaDevDimension` content type (MCCE exclusive).
-   Added the `MCChinaDevDimension` NBT schema (MCCE exclusive).
-   Added the `NeteaseData` content type (MCCE exclusive).
-   Added the `NeteaseData` NBT schema (MCCE exclusive).
-   Added the `NeteaseScriptGid` content type (MCCE exclusive).
-   Added the `NeteaseScriptGid` NBT schema (MCCE exclusive).
-   The custom serializer and parser for the `LevelDat` content type now can writes the version from the `StorageVersion` field into the header instead of always `10` ([#2](https://github.com/8Crafter-Studios/mcbe-leveldb/issues/2)).
-   Added the `ChunksDatUtils` namespace, which has utility functions for working with `chunks.dat`.
-   Added the following constants:
    -   `dimensionsMCCE`
    -   `placeholderContentTypes`
    -   `chinaEditionExclusiveContentTypes`
    -   `levelDatStorageVersionToMCVersionRangeMap`
-   Added the following functions:
    -   `chunkBlock128IndexToOffset`
    -   `offsetToChunkBlock128Index`
-   Added the following types:
    -   `DimensionMCCE`
    -   `LevelDatStorageVersionToMCVersionRangeMapType`
    -   `StructureTypeDimensionVectorXZ`
    -   `DimensionVersionDimensionVectorXZ`
-   The following functions now support Minecraft China Edition dev dimensions (dm3-dm20):
    -   `dimensionVectorDimensionToInt`
    -   `dimensionIdToDimensionVectorDimension`
    -   `dimensionIdToDimensionVectorDimensionSync`
    -   `getDimensionTypes`
    -   `getDimensionTypesSync`
    -   `getDimensionIds`
    -   `getDimensionIdsSync`
    -   `getDimensionNumericIds`
    -   `getDimensionNumericIdsSync`
-   Added protections to many custom serializers to overflow out of bounds integers and unsign signed integers that are supposed to be unsigned.
-   Added JSDoc documentation to 125 properties that were missing it.
-   Added the `data.DragonFightVersion` field to the `TheEnd` NBT schema.
-   Added the following properties to the `LevelDat` NBT schema:
    -   `LegacySeed`
    -   `SizeOnDisk`
    -   `LegacyLastPlayed`
    -   `Player`
-   Added the following properties to the `PlayerClient` NBT schema:
    -   `PlatformOnlineId`
    -   `PlatformOfflineId`
    -   `NeteaseUUID`
-   Added the version ranges for the format versions of the `Data2D` NBT schema.
-   The `getContentTypeFromDBKey` function can now detect the following content types when they are located in custom dimensions or Minecraft China Edition dev dimensions (dm3-dm20):
    -   `ChunkLoadedRequest`
    -   `VillagePOI`
    -   `VillageInfo`
    -   `VillageDwellers`
    -   `VillagePlayers`
    -   `VillageRaid`
-   Added support for `format_version` `2` to the `StructureTemplate` NBT schema ([#10](https://github.com/8Crafter-Studios/mcbe-leveldb/issues/10)).
-   The types in the `NBTSchemas.NBTSchemaTypes` namespace now have JSDoc on the inner `value` property of lists that has the documentation for every item in the list.
-   The types in the `NBTSchemas.NBTSchemaTypes` namespace now can have labels on items in tuple types in lists.
-   The types in the `NBTSchemas.NBTSchemaTypes` namespace now show longs in the JSDoc in both the bigint and tuple forms.
-   Added the `JSONC` type to `EntryContentTypeFormatData`.
-   Added the `allowComments` and `allowTrailingCommas` properties the `JSON` type of `EntryContentTypeFormatData`.
-   Added autocomplete and validation for vanilla biome IDs in the `Data2DLegacy` NBT schema.
-   Added autocomplete and validation for vanilla biome IDs in the `Data2D` NBT schema.
-   The 1 layer in the `SubChunkPrefix_v1` NBT schema is now documented as the block layer.
-   The first 2 possible layers in the `SubChunkPrefix_v8` NBT schema are now documented as the block layer and snowlog layer, and additional layers are documented as such.

## Changes

-   Major fixes and improvements to the `Map` NBT schema.
-   The NBT schemas now use some properties from Draft 2019-09.
-   Updated the `BiomeData` from `v1.26.30` to `v1.26.50` (the update has zero actual changes as all the changes were already manually added in before).

## Fixes

-   Fixed a bug where the custom parser and serializer for the `Entity` content type had the type defined to use the `ActorPrefix` NBT schema instead of the `Entity_Entity` NBT schema.
-   Fixed a bug where the format type of the `FlatWorldLayers` content type was `ASCII` instead of `JSON`.
-   The `StorageVersion` property of the `LevelDat` NBT schema is now marked as required.
-   Fixed a bug where the `SST_SALOG`, `SST_WORD`, and `SST_WORD_` LevelDB keys were detected as the `ForcedWorldCorruption` content type.
-   The 5th item of the `lastOpenedWithVersion` field of the `LevelDat` NBT schema is now marked as optional.
-   The `XBLBroadcastIntent` field of the `LevelDat` NBT schema is now able to be a `byte` or `int`, rather than just an `int`.
-   The `tickList[number].tileID` field of the `PendingTicks` NBT schema is now able to be a `byte` or `int`, rather than just an `int`.
-   The `version` field of the `PositionTrackingLastId` and `PositionTrackingDB` NBT schemas now has a const value of `1`.
-   Fixed a bug where the following properties of the `Abilities` NBT subschema were marked as required:
    -   `attackmobs`
    -   `attackplayers`
    -   `build`
    -   `doorsandswitches`
    -   `flySpeed`
    -   `lightning`
    -   `mine`
    -   `mute`
    -   `noclip`
    -   `op`
    -   `opencontainers`
    -   `permissionsLevel`
    -   `playerPermissionsLevel`
    -   `teleport`
    -   `walkSpeed`
    -   `worldbuilder`
-   The `WasPickedUp` property of the `Item_ItemStackBase` NBT schema is now marked as optional.
-   The `MsaId` and `SelfSignedId` fields of the `PlayerClient` NBT schema are now marked as optional.
-   The `SpawnDimension` field of the `Entity_Player` NBT schema is now marked as optional.
-   Fixed a bug where the snowlog layer was called a waterlog layer in many places in the NBT schemas.
-   Fixed many typos.
-   Fixed some issues with JSON schema title/description resolution when refs are involved ([#5](https://github.com/8Crafter-Studios/mcbe-leveldb/issues/5)).
-   Explicitly defined the minmum and maximum number of items of many lists in the NBT schemas, which fixes an issue where lists could allow now specifying all the required items or adding additional items.
-   The NBT schema to JSON schema converter no longer defaults the `items` field of lists to `{}` if it is not defined on the NBT schema.
-   The NBT schema to JSON schema converter now correctly copies these fields to the inner `value` of lists rather than the outer one:
    -   `minItems`
    -   `maxItems`
    -   `errorMessage`
    -   `format`
    -   `pattern`
    -   `patternErrorMessage`
    -   `uniqueItems`
-   Fixed a bug where the JSDoc of the types in the `NBTSchemas.NBTSchemaTypes` namespace would show tuples as a union of their entry value types instead.
-   Miscellaneous fixes to the NBT schema to JSON schema converter.
-   Miscellaneous fixed to the NBT schema to TypeScript converter (and as a result, the types in the `NBTSchemas.NBTSchemaTypes` namespace).
-   Miscellaneous NBT schema fixes.

## Performance Improvements

-   Minor optimizations the `LevelDat` serializer.

# v1.23.0

## Additions

-   The `~local_player.Editor` LevelDB key is now detected as the `Player` content type.
-   Added the `DayCycleStopTime` property to the `LevelDat` NBT schema.

## Fixes

-   Fixed a bug where a the following optional properties of the `Entity_Player` NBT schema were incorrectly marked as required:
    -   `AgentID`
    -   `LeftShoulderRiderID`
    -   `RideID`
    -   `RightShoulderRiderID`

# v1.22.2

## Changes

-   The `internalComponents.EntityStorageKeyComponent` field of the `ActorPrefixOrEntity` NBT schema is now optional.

# v1.22.1

## Additions

-   Added handling for unresolved names from the required properties list of NBT schemas to the NBT schema to TypeScript type converter, to ensure that it is required, even if the actual definition for the property is in `oneOf`, `anyOf`, `allOf`, a reference, etc.

## Fixes

-   Fixed a invalid internal TypeScript type that was causing errors.

# v1.22.0

## Additions

-   Added enums to many boolean NBT schema properties.
-   Added the `Entity_Entity` NBT schema, which is like the `ActorPrefix` NBT schema, but it is for entries in the `Entity` content type, which doesn't have the `internalComponents` field.
-   Added the `ActorPrefixOrEntity` NBT schema, which is like the `ActorPrefix` NBT schema, except the `internalComponents` field is optional.
-   Added the `Entity_Villager` NBT schema.
-   Added the `Entity_ZombieVillager_V2` NBT schema. NOTE: Currently the `Entity_ZombieVillager` and `Entity_ZombieVillager_V2` are the same, and they are both incomplete
-   Added the `BlockEntityVersion` field to the `BlockEntity` NBT schema.
-   Added an enum to the `Motif` field of the `Entity_Painting` NBT schema.

## Changes

-   All entity NBT schemas now extend the `ActorPrefixOrEntity` NBT schema rather than the `ActorPrefix` NBT schema.
-   The `isMovable` field of the `BlockEntity` NBT schema is now optional.
-   The `LootTable` and `LootTableSeed` fields of the `Component_Inventory` NBT schema are now optional.
-   The `HasResupplied` field of the `Entity_Villager_V2` NBT schema is now optional.
-   The `Entity_MinecartWithCommandBlock` NBT schema now also extends the `Component_Inventory` and `CommandBlock` NBT schemas.
-   The `Entity_Villager_V2` NBT schema now also extends the `Entity_Villagers`, `Component_Dweller`, `Component_Economy_trade_table`, and `Component_Inventory` NBT schemas.

## Fixes

-   Fixed an issue with the `LegacyTerrain` NBT schema where the required property names referenced the old `dirty_columns` property instead of `height_map`.
-   When `enum`, `const`, and `examples` properties `items` properties (or entries in that property) of NBT schemas a translated to JSON schemas by the NBT schema to JSON schema converter, it now converts the values to the values of value properties.
-   Fixed some issues with handling of tuple type `items` properties of NBT schemas by the NBT schema to JSON schema converter.
-   Fixed the descriptions of many NBT schemas and fields.
-   Removed an unnecessary console log from the internal `parseList` function.
-   Fixed an issue where `parseSNBTCompoundString`, `extractSNBT`, and `snbtToPrismarine` functions would add extra useless `"name": ""` properties to many NBT compounds.

# v1.21.0

## Critical Fixes

-   Fixed many issues where the parser and serializer for the `SubChunkPrefix` content type did not work properly in certain situations.

## Breaking Changes

-   The `SubChunkPrefixLayer` NBT schema and the `layers` field of the `SubChunkPrefix` parser/serializer no longer include a `storageVersion` field.

## Additions

-   Added a default value for the `Map` content type.

# v1.20.1

## Critical Fixes

-   Fixed an issue where the serializer for the `ActorPrefix` content type would always throw an error because the `name` property of the input object was not copied over to the reencoded object.

# v1.20.0

## Critical Fixes

-   Added a custom serializer and parser for the `ActorPrefix` content type as it contains a property with a binary-encoded string value, and the regular NBT parser parses and serializes as UTF-8, so it could end up corrupting that property, and that property is very critical and changing it changes the LevelDB key the game writes the entity to, resulting in the entity no longer being loaded in the world.
-   Fixed a bug where the `getKeyDisplayName` function did not work properly for the `Digest` content type, it would incorrectly always return the Overworld as the dimension.

## Additions

-   The `getChunkKeyIndices` function now supports `Digest` keys.
-   The `generateChunkKeyFromIndices` function now supports `Digest` keys.
-   Added the following functions:
    -   `parseActorPrefixStorageKey`
    -   `parseActorPrefixStorageKeyToParts`
    -   `serializeActorPrefixStorageKey`
-   Added the following constants:
    -   `DBChunkLinkedContentTypes`
    -   `chunkLegacyVersionDetailsMap`
    -   `chunkVersionDetailsMap`
    -   `protoLEBinaryStringEncoding`
-   Added the following types:
    -   `DBChunkLinkedContentType`
-   Documented the following properties of the `ActorPrefix` NBT schema:
    -   `internalComponents`
    -   `internalComponents.EntityStorageKeyComponent`
    -   `internalComponents.EntityStorageKeyComponent.StorageKey`
-   The package now has the [`protodef`](https://www.npmjs.com/package/protodef) package as a dependency (this package was already required by `prismarine-nbt`).

## Fixes

-   Overloaded a misconfigured type for the `parseAs` function in the [`prismarine-nbt`](https://www.npmjs.com/package/prismarine-nbt) package to fix several errors.

## Performance Improvements

-   Optimizations to the `getChunkKeyIndices` function.
-   Optimizations to the `generateChunkKeyFromIndices` function.

# v1.19.0

## Critical Fixes

-   Fixed a bug where the parser for the `Data3D` content type did not work when there were subchunks with storage types of `3`, `5`, or `6`.
-   Fixed a bug where the serializer for the `Data3D` content type could not write storage types of `3`, `5`, or `6`, and instead rounded them up to the nearest storage type it supported, which may or may not have caused crashes in some Minecraft worlds.
-   Fixed a bug where `getContentTypeFromDBKey` wouldn't be able to determine the content type for the following content types in some older worlds where the dimension was not part of the key:
    -   `VillagePOI`
    -   `VillageInfo`
    -   `VillageDwellers`
    -   `VillagePlayers`
    -   `VillageRaid`

## Additions

-   Added the `DBChunkKeyEntryContentTypes` constant.
-   Added the `DBChunkKeyEntryContentType` type.

## Fixes

-   Fixed some misinformation that said that `Data2D` format version 2 was used in `v1.18.0+`, when it was actually added some time later than that.

# v1.18.0

## Breaking Changes

-   The `dirty_columns` field of the `LegacyTerrain` NBT schema and parser/serializer has been renamed to `height_map`.
-   The `Data2D` NBT schema and parser/serializer now includes a `version` field.

## Additions

-   Added the `Item_ItemStackBase` NBT schema, which is equivalent to the old `Item_ItemStack` NBT schema.
-   The `Item_ItemStack` NBT schema now references the `Item_GeneralTags` and `Item_EnchantmentTags` NBT schemas.
-   Added the `Item_GeneralTags` NBT schema.
-   Added the `Item_EnchantmentTags` NBT schema, which includes autocomplete and validation for enchantment IDs.
-   The NBT schema to TypeScript interface converter now supports `anyOf`.
-   Added support for the newer `Data2D` format version used in `v1.18.0+` which uses 16-bit little-endian integers for biome IDs instead of 8-bit integers.
-   The package now has the [`type-fest`](https://www.npmjs.com/package/type-fest) package as a dependency.

## Changes

-   Updated the `BiomeData` from `v1.21.110` to `v1.26.30` (also manually added definitions for the dappled forest, since that is not in `v1.26.30` and there is no newer definitions file available).
-   The NBT schema to TypeScript interface converter now wraps generated `oneOf` types in the `ExclusifyUnion` generic type from the [`type-fest`](https://www.npmjs.com/package/type-fest) package, this makes the typings more accurate.
-   The `Data2D` content type is no longer marked as deprecated as it is actually still written by the game for worlds using the Old world type or an older base game version.

## Fixes

-   Fixed a bug where many properties of NBT schemas that were items did not have a reference to the `Item_ItemStack` NBT schema.
-   Many fixes for the NBT schema to JSON schema converter.

# v1.17.0

## Additions

-   Added support for the "Bedrock World Editor - Player Name Saver" behavior pack for getting player's names from their UUIDs from the dynamic properties.

## Changes

-   The `playerUUIDToNameDynamicPropertyParsers` constant is now exported.

## Fixes

-   Fixed a bug where the TypeScript type version of the `LevelDat` NBT schema was missing many of the properties added in v1.16.0.
-   Fixed a bug where the following fields of the `PlayerClient` NBT schema were marked as optional:
    -   `MsaId`
    -   `SelfSignedId`
    -   `ServerId`

# v1.16.0

## Additions

-   Added a custom serializer and parser for the `BiomeState` content type.
-   Added the `BiomeState` NBT schema.
-   Added a custom serializer and parser for the `BorderBlocks` content type.
-   Added the `BorderBlocks` NBT schema.
-   Added a custom serializer and parser for the `HardcodedSpawners` content type.
-   Added the `HardcodedSpawners` NBT schema.
-   Added a custom serializer and parser for the `AABBVolumes` content type.
-   Added the `AABBVolumes` NBT schema.
-   Added the format type for the following content types:
    -   `GeneratedPreCavesAndCliffsBlending`
    -   `MetaDataHash`
    -   `ActorDigestVersion`
-   Added default values for the following content types:
    -   `GeneratedPreCavesAndCliffsBlending`
    -   `MetaDataHash`
    -   `ActorDigestVersion`
-   Documented the possible values for the following content types:
    -   `Version`
    -   `LegacyVersion`
    -   `FinalizedState`
    -   `GeneratedPreCavesAndCliffsBlending`
    -   `ActorDigestVersion`
-   Added/Updated documentation for several content types.
-   Added enum descriptions to the `version` fields of the versioned `SubChunkPrefix` NBT schemas.
-   Added the following properties to the `experiments` property of the `LevelDat` NBT schema:
    -   `data_driven_items`
    -   `data_driven_vanilla_blocks_and_items`
    -   `experimental_molang_features`
    -   `next_major_update`
    -   `vanilla_experiments`
-   Added the following properties to the `LevelDat` NBT schema:
    -   `allowAnonymousBlockDropsInEditorWorlds`
    -   `cheatsEnabled`
    -   `daylightCycle`
    -   `PlayerHasDied`
    -   `permissionsLevel`
    -   `playerPermissionsLevel`
    -   `playerssleepingpercentage`
    -   `playerwaypoints`
    -   `serverEditorConnectionPolicy`
    -   `WorldVersion`

## Fixes

-   Fixed a typo where the `doentitydrops` property of the `LevelDat` NBT schema was incorrectly named `doentitiydrops`.
-   Many fixes for the NBT schema to JSON schema converter.
-   Fixes for the NBT schema to TypeScript interface converter.

# v1.15.0

## Additions

-   Added autocomplete and validation for vanilla biome IDs in the `Data3D` NBT schema.

## Changes

-   The `Utils.Conversion.ToJSONSchema.ConvertOptions.resolveSchemaRefName` function is now exported.

## Fixes

-   Many fixes for the NBT schema to JSON schema converter.

# v1.14.2

## Critical Fixes

-   Fixed a bug where the serializer for the `Data3D` content type deleted all empty subchunks, resulting in subchunks that were supposed to have empty subchunks in between them all being moved to the bottom of the world without any empty gaps in between them, and also resulting in chunks with larger subchunk counts having their subchunk counts culled. This fix is backwards compatible, older versions of the module can read the serialized data as it is in the same format as Minecraft puts it.

## Fixes

-   Removed an unused `node:fs` `appendFileSync` import from `LevelUtils.ts` (the module now correctly no longer imports any built-in Node.js modules (for compatibility reasons)).

# v1.14.1

## Fixes

-   Fixed an invalid import.

# v1.14.0

## Additions

-   Added custom dimension support for chunk keys, and the `getChunkKeyIndices` and `generateChunkKeyFromIndices` functions.
-   Added the following functions:
    -   `dimensionVectorDimensionToInt`
    -   `dimensionVectorDimensionToId`
    -   `dimensionVectorDimensionToIdSync`
    -   `dimensionIdToDimensionVectorDimension`
    -   `dimensionIdToDimensionVectorDimensionSync`
    -   `intToDimensionVectorDimension`
    -   `getDimensionTypes`
    -   `getDimensionTypesSync`
    -   `getDimensionIds`
    -   `getDimensionIdsSync`
    -   `getDimensionNumericIds`
    -   `getDimensionNumericIdsSync`

## Changes

-   The `dimension` field of dimension vectors is now a union of `Dimension` and `number` instead of just `Dimension`.

## Fixes

-   Fixed a bug where the `entries` field of the `DimensionNameIdTable` NBT schema was marked as optional.

# v1.13.1

## Fixes

-   Fixed a bug where the mapping in the `getContentTypeFromDBKey` function for the `DimensionNameIdTable` content type was missing.

# v1.13.0

## Additions

-   Added the `DimensionNameIdTable` content type.
-   Added the `DimensionNameIdTable` NBT schema.
-   Added the `CustomDimension` content type.
-   Added the `CustomDimension` NBT schema.
-   Added in the rest of the `WorldClocks` NBT schema.
-   Added examples to the `BiomeOverride` field of the `LevelDat` NBT schema.

## Changes

-   The `DBEntryContentTypesGrouping` for the `BiomeIdTable` content type as been changed to `IdTable` to group it with the `DimensionNameIdTable` content type.
-   The boolean properties of the `abilities` field of the `Abilities` NBT schema now have enums.

# v1.12.0

## Additions

-   Added the `WorldClocks` content type.
-   Added the `WorldClocks` NBT schema.

# v1.11.0

## Additions

-   Added a generator variant of the `getKeysOfTypes` function: `getKeysOfTypesG`.

# v1.10.2

## Fixes

-   Fixed many markdown links in the NBT schemas that had spaces instead of underscores.

# v1.10.1

## Additions

-   Added the `y_2026_drop_1` property to the `experiments` property of the `LevelDat` NBT schema.

# v1.10.0

## Breaking Changes

-   The `Dimension` content type and corresponding NBT schema have been split up into three new content types and NBT schemas:
    -   `Overworld`
    -   `Nether`
    -   `TheEnd`
-   The `LegacyDimension` content type has been split up into three new content types:
    -   `LegacyOverworld`
    -   `LegacyNether`
    -   `LegacyTheEnd`
-   All NBT schemas have been updated to have descriptions specified on the `markdownDescription` property instead of the `description` property.
-   All NBT schemas have been updated to have enum descriptions specified on the `markdownEnumDescriptions` property instead of the `enumDescriptions` property.

## Additions

-   Added a custom serializer and parser for the `LegacyTerrain` content type.
-   Added the `LegacyTerrain` NBT schema.
-   Added a custom serializer and parser for the `Data2D` content type.
-   Added the `Data2D` NBT schema.
-   Added a custom serializer and parser for the `Data2DLegacy` content type.
-   Added the `Data2DLegacy` NBT schema.
-   Added support for `SubChunkPrefix` versions `0x00`, `0x01`, `0x02`, `0x03`, `0x04`, `0x05`, `0x06`, and `0x07`.
-   Split the `SubChunkPrefix` NBT schema into three versioned schemas, the `SubChunkPrefix` NBT schema now is a union of the three versioned schemas:
    -   `SubChunkPrefix_v0` (versions 0, 2, 3, 4, 5, 6, and 7)
    -   `SubChunkPrefix_v1` (version 1)
    -   `SubChunkPrefix_v8` (versions 8 and 9, the same as the previous `SubChunkPrefix` NBT schema)
-   Added the `LegacyOverworld` NBT schema.
-   Added the `LegacyNether` NBT schema.
-   Added the `LegacyTheEnd` NBT schema.
-   Added the `PositionTrackingLastId` NBT schema.
-   Added the `PositionTrackingDB` NBT schema.
-   Added examples for the `InventoryVersion` property of the `LevelDat` NBT schema.
-   Added the `DBEntryContentTypesGrouping` constant.
-   Added the `DBEntryContentTypeGroup` type.
-   Added the `tileID` property to the `PendingTicks` NBT schema.
-   Added default values for the following content types:
    -   `PendingTicks`
    -   `RandomTicks`
-   Added an enum to the `storageVersion` property of the `SubChunkPrefixLayer` NBT schema.
-   Added min and max item count values to several properties of various NBT schemas.
-   Added the `package.json` file to the `package.json` file's `exports` field.

## Fixes

-   The `currentTick` property of the `PendingTicks` NBT schema is now marked as optional as in older versions it doesn't exist.
-   The `time`, `x`, `y`, and `z` properties of the `PendingTicks` and `RandomTicks` NBT schemas are now marked as required.
-   The `blockState` property of the `RandomTicks` NBT schema is now marked as required.
-   Fixed over 100 markdown links in the NBT schemas that were missing a `https://minecraft.wiki/w/` prefix.

# v1.9.1

## Critical Fixes

-   Fixed an issue where the Data3D serializer could corrupt the data by serializing it with a number of bits per block that 32 was not divisible by (also made the parser able to parse those corrupted subchunks, though the referenced palette indices in the values arrays will likely be incorrect for those corrupted subchunks).

## Additions

-   Added the optional `name` property to the `GenericPrismarineJSONNBTSchema` JSON schema.
-   Made many types `exactOptionalPropertyTypes` friendly.

# v1.9.0

## Additions

-   Added the `LevelChunkMetaDataDictionary` NBT schema.
-   Added the `Digest` NBT schema.

## Changes

-   Changed the custom data structure of the `Digest` content type.

## Fixes

-   `prettyPrintSNBT` no longer inserts newlines when the `indent` option is set to `0`.

# v1.8.0

## Critical Fixes

-   Fixed a bug that has been around since the first version of this module where `MetaDataHash` keys were detected as `BlendingBiomeHeight` keys, `GeneratedPreCavesAndCliffsBlending` keys were detected as `MetaDataHash` keys, and `BlendingBiomeHeight` keys were detected as `GeneratedPreCavesAndCliffsBlending` keys.

## Additions

-   Added a custom serializer and parser for the `LevelChunkMetaDataDictionary` content type.
-   Added the `BiomeIdsTable` content type.
-   Added the `BiomeIdsTable` NBT schema.
-   Added the `VillageRaid` content type.
-   Added the `VillageRaid` NBT schema.
-   Added the `PositionTrackingDB` content type.
-   Added the `PositionTrackingLastId` content type.
-   Added the `GenerationSeed` content type.
-   Added the `LegacyDimension` content type.
-   Added the `MVillages` content type.
-   Added the `Villages` content type.
-   Added the `LevelSpawnWasFixed` content type.
-   Added a default value to the following properties of the following NBT schemas:
    -   `Map`
        -   `unlimitedTracking`
        -   `scale`
    -   `Scoreboard`
        -   `DisplayObjectives[number].SortOrder`
    -   `LevelDat`
        -   `functioncommandlimit`
        -   `maxcommandchainlength`
        -   `prid`
    -   `ActorPrefix`
        -   `Color`
        -   `Color2`
        -   `MarkVariant`
        -   `OwnerNew`
        -   `SkinID`
        -   `Strength`
        -   `StrengthMax`
        -   `Variant`
    -   `Entity_ItemEntity`
        -   `OwnerID`
    -   `Block_Piston`
        -   `NewState`
-   Added enums to the following non-boolean properties of the following NBT schemas (added enums on boolean properties are not being listed in the changelog):
    -   `Scoreboard`
        -   `DisplayObjectives[number].SortOrder`
        -   `Objectives[number].Criteria`
-   Added enums to many boolean NBT schema properties.
-   Added descriptions and titles to many NBT schema properties.
-   Added the `verticalFlySpeed` property to the `abilities` property of the `LevelDat` NBT schema.
-   Added the `isRandomSeedAllowed` property to the `LevelDat` NBT schema.
-   Added the `projectilescanbreakblocks` property to the `LevelDat` NBT schema.
-   Added the `showrecipemessages` property to the `LevelDat` NBT schema.
-   Added the `tntexplosiondropdecay` property to the `LevelDat` NBT schema.
-   Documented the `InventoryVersion` property of the `LevelDat` NBT schema.
-   Added more information to the documentation of the `texturePacksRequired` property of the `LevelDat` NBT schema.

## Changes

-   Documentation refactor to replace `Unknown.` in documentation entries of NBT schemas with one of:
    -   `UNKNOWN.`: If the schema for that tag is incomplete or completely empty as it is unknown what properties it has.
    -   `UNDOCUMENTED.`: If the tag with that description has not been documented yet or it is unknown what it does.
-   Updated the `BiomeData` from `v1.21.80` to `v1.21.110` (the update has zero actual changes).
-   Many properties of the `VillageDwellers`, `VillageInfo`, `VillagePOI`, and `VillagePlayers` NBT schemas are now marked as required.

## Fixes

-   Fixed a bug where the `list[number].id` property of the `BiomeData` NBT schema was of type `byte` instead of `short`.
-   Fixed an incorrect TypeScript type version of the `Scoreboard` NBT schema.
-   Fixed a bug where empty object types in the TypeScript type versions of NBT schemas were generated as `{}` instead of `object`.
-   Fixed a bug where a few optional properties of the `VibrationListener` property of the `Entity_Allay` NBT schema were incorrectly marked as required.
-   Fixed an incorrect NBT schema for the `decorations[number].key` property of the `Map` NBT schema.
-   Removed a `minimum` value from the list items of the `structure_world_origin` property of the `StructureTemplate` NBT schema that should not have been there.
-   Fixed the descriptions of the list items of the `structure_world_origin` property of the `StructureTemplate` NBT schema.
-   Fixed an incorrect NBT schema for the `structure.palette.default.block_position_data` property of the `StructureTemplate` NBT schema.
-   Fixed incorrect NBT schemas for following properties of the `LevelDat` NBT schema:
    -   `editorWorldType`
    -   `eduOffer`
    -   `functioncommandlimit`
    -   `spawnradius`
-   Fixed a bug where the `LevelDat` NBT schema had the `limitedWorldDepth` property incorrectly capitalized as `LimitedWorldDepth`.
-   Fixed a bug where the `LevelDat` NBT schema had the `limitedWorldWidth` property incorrectly capitalized as `LimitedWorldWidth`.
-   Fixed an incorrectly structured default value for the `LevelName` property of the `LevelDat` NBT schema.
-   Fixed incorrect documentation for the `NetworkVersion` property of the `LevelDat` NBT schema.
-   Fixed a bug where a the following optional properties of the `ActorPrefix` NBT schema were incorrectly marked as required:
    -   `CustomNameVisible`
    -   `Fire`
    -   `Persistent`
-   Minor whitespace fixes with some instances of the following in the documentation:
    -   `*needs testing*`
    -   `*info needed*`

# v1.7.3

## Fixes

-   Fixed a bug where the `LevelDat` NBT schema had the `isSingleUseWorld` property incorrectly capitalized as `IsSingleUseWorld`.

# v1.7.2

## Fixes

-   Fixed an incorrect `Entries` field in the NBT schema for the `Scoreboard` content type.

# v1.7.1

## Fixes

-   Fixed an incorrect NBT schema for the `Scoreboard` content type.

# v1.7.0

## Additions

-   Added a custom serializer and parser for the `Digest` content type.

# v1.6.0

## Additions

-   Added the `ChunkLoadedRequest` content type.
-   Added the `ChunkLoadedRequest` NBT schema.

## Fixes

-   Fixed a bug where the enum descriptions of the NBT schemas and NBT schema types for boolean byte values had `1` mapped to `false` and `0` mapped to `true`.
-   Fixed a bug where the following properties were missing from the type version of the NBT schema for `LevelDat`:
    -   `editorWorldType`
    -   `HasUncompleteWorldFileOnDisk`

# v1.5.7/v1.5.10

## Critical Fixes

-   Overloaded several misconfigured types in the [`prismarine-nbt`](https://www.npmjs.com/package/prismarine-nbt) package to fix several errors.

# v1.5.6

## Changes

-   Updated the `LevelDat` NBT schema to include the following properties:
    -   `editorWorldType`
    -   `HasUncompleteWorldFileOnDisk`
    -   `locatorbar`

# v1.5.4

## Critical Fixes

-   Fixed a bug where the custom parser for the `LevelDat` content type returned an empty compound instead of the expected NBT data.

# v1.5.3

## Fixes

-   Fixed a bug where the format type of the `HardcodedSpawners` content type was `NBT` instead of `unknown`.
-   Fixed a bug where the `type` property of a few of the content types was undocumented.

## Development Changes

-   JSON files generated by the test scripts now use the `CRLF` line ending instead of the `LF` line ending.

# v1.5.2

## Additions

-   Added two new NBT schemas:
    -   `PendingTicks`
    -   `RandomTicks`

# v1.5.1

## Fixes

-   Reverted the following content types back to use the regular NBT format type instead of a custom parser and serializer due to them actually being a single NBT compound and not a list of them (contrary to what the Minecraft Wiki says):
    -   `PendingTicks`
    -   `RandomTicks`

# v1.5.0

## Additions

-   Added custom serializers and parsers for the following content types:
    -   `BlockEntity`
    -   `Entity`
    -   `PendingTicks`
    -   `RandomTicks`

## Changes

-   Marked the following content types as deprecated:
    -   `FlatWorldLayers`
    -   `Entity`

# v1.4.0

## Critical fixes

-   Fixed a bug where if the object passed into the `indices` parameter of the `generateChunkKeyFromIndices` function had a `subChunkIndex` property with a value of `undefined`, then the function would return the chunk key with the subchunk index set to `0` instead of not including the subchunk index in the key, which would result in incorrect chunk keys.

## Additions

-   Added the format type for the following content types:
    -   `ForcedWorldCorruption`
-   Added default values for the following content types:
    -   `Version`
    -   `FinalizedState`
    -   `LevelDat`
    -   `DynamicProperties`
    -   `ForcedWorldCorruption`
-   Added the `rawFileExtension` property to the following content types:
    -   `StructureTemplate`
    -   `LevelDat`
-   Added a custom serializer and parser for the `LevelDat` content type as it was actually not just pure NBT, as there was 8 bytes of important extra data before the NBT data.
-   Added/Updated documentation for several content types.
-   Added the `DynamicProperties` NBT schema.

## Changes

-   Changed the return type of the `serialize` method for the `Data3D` and `SubChunkPrefix` content types from `Buffer<ArrayBufferLike>` to `Buffer<ArrayBuffer>`.
-   Changed many types to use the more explicit `Buffer<ArrayBuffer>` type instead of `Buffer` (i.e. `Buffer<ArrayBufferLike>`).
-   The properties of the `EntryContentTypeFormatData` type are now read-only.

## Fixes

-   Fixed a bug where the `getChunkKeyIndices` function returned an object containing a `subChunkIndex` property with a value of `undefined` when the key had no subchunk index, instead of not including that property at all.

## Performance Improvements

-   Performance improvements to the `getKeysOfTypes` function when passing buffers to it (it now only gets the content type of each key once instead of twice).

# v1.3.4

## Critical Fixes

-   Fixed a bug where the SNBT stringifier did not escape control characters (`\x00-\x1F`), characters in the `\uD800-\uDFFF` range, or characters `\u2028` or `\u2029`.

# v1.3.3

## Fixes

-   Fixed a bug where the `getKeyDisplayName` function did not include the subchunk index in the display name if it was 0.

# v1.3.2

## Critical Fixes

-   Fixed the parser and serializer for the `Data3D` content type.

# v1.3.1

## Fixes

-   Fixed the `StructureTemplate` NBT schema.

# v1.3.0

## Additions

-   Added the `generateChunkKeyFromIndices` function.
-   Added the `getIntFromChunkKeyType` function.
-   Added the `DBChunkKeyEntryContentType` type.

# v1.2.4

## Fixes

-   The `getChunkKeyIndices` function now correctly converts the subchunk index to a signed integer instead of an unsigned integer.

# v1.2.3

## Fixes

-   Fixed the `chunkBlockIndexToOffset` and `offsetToChunkBlockIndex` mixing up the Y and Z axes.

# v1.2.2

## Changes

-   Updated the `TickingArea` NBT schema.

# v1.2.1

## Additions

-   Documented a lot more of the module.

## Fixes

-   Fixed the `Entity` NBT schemas and the `world_policies` property of the `LevelDat` NBT schema.

# v1.2.0

## Changes

-   Replaced the [`leveldb-zlib`](https://www.npmjs.com/package/leveldb-zlib) package with the [`@8crafter/leveldb-zlib`](https://www.npmjs.com/package/@8crafter/leveldb-zlib) package.

# v1.1.0

## Additions

-   Added a Changelog file.
-   Added two new NBT schemas:
    -   `SubChunkPrefix`
    -   `SubChunkPrefixLayer`
-   Added some more NBT schema aliases.

## Fixes

-   Fixed many bugs where the NBT schema to TypeScript type converter, and used it to fix some major issues with the types in the `NBTSchemas.NBTSchemaTypes` namespace.

## Development Changes

-   Updated the list of unwanted VSCode extension recommendations.

# v1.0.1

## Additions

-   Added a README file.

# v1.0.0

-   Initial Release
