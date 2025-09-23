import { writeFileSync } from "node:fs";
import { NBTSchemas } from "../nbtSchemas.ts";
import path from "node:path";

const data = `*{{nbt|compound}}: The root tag.
**{{nbt|long|mapId}}: The Unique ID of the map.
**{{nbt|long|parentMapId}}: The Unique ID's of the parent maps.
**{{nbt|byte|dimension}}: 0 = The [[Overworld]], 1 = [[The Nether]], 2 = [[The End]], any other value = a static image with no player pin.
**{{nbt|byte|fullExplored}}: 1 if the map is full explored.
**{{nbt|byte|mapLocked}}: 1 if the map has been locked in a [[cartography table]].
**{{nbt|byte|scale}}: How zoomed in the map is, and must be a number between 0 and 4 (inclusive) that represent the level. Default 0. If this is changed in an [[anvil]] or a [[cartography table]], the Unique ID of the map changes.
**{{nbt|byte|unlimitedTracking}}: Unknown. Default 0.
**{{nbt|short|height}}: The height of the map. Is associated with the scale level.
**{{nbt|short|width}} The width of the map. Is associated with the scale level.
**{{nbt|int|xCenter}}: Center of the map according to real world by X.
**{{nbt|int|zCenter}}: Center of the map according to real world by Z.
**{{nbt|list|decorations}}: A list of optional icons to display on the map.
***{{nbt|compound}}: An individual decoration.
****{{nbt|compound|data}}
*****{{nbt|int|rot}}: The rotation of the symbol, ranging from 0 to 15. South = 0, West = 4, North = 8, East = 12.
*****{{nbt|int|type}}: The ID of the [[Map icons.png|map icon]] to display.
*****{{nbt|int|x}}: The horizontal column (x) where the decoration is located on the map (per pixel).
*****{{nbt|int|y}}: The vertical column (y) where the decoration is located on the map (per pixel).
****{{nbt|compound|key}}
*****{{nbt|int|blockX}}: The world x-position of the decoration.
*****{{nbt|int|blockY}}: The world y-position of the decoration.
*****{{nbt|int|blockZ}}: The world z-position of the decoration.
*****{{nbt|int|type}}: Unknown.
**{{nbt|byte-array|colors}}: An array of bytes that represent color values ('''65536 entries''' for a default 128×128 map).`;

writeFileSync(
    path.join(import.meta.dirname, "./nbtSchema.json"),
    JSON.stringify(NBTSchemas.Utils.Conversion.FromMinecraftWikiData.wikiNBTToNBTSchema(data), null, 4)
);

const fullPageData = `{{exclusive|bedrock}}
This page lists some additional NBT structures {{in|bedrock}}.

__TOC__
<div class="treeview">
== Abilities ==
NBT structure of players' ability info:
* {{nbt|compound}}: Parent tag.
** {{nbt|compound|abilities}}: The player's ability setting.
*** {{nbt|byte|attackmobs}}: 1 or 0 (true/false) - true if the player can attack mobs.
*** {{nbt|byte|attackplayers}}: 1 or 0 (true/false) - true if the player can attack other players.
*** {{nbt|byte|build}}: 1 or 0 (true/false) - true if the player can place blocks.
*** {{nbt|byte|doorsandswitches}}: 1 or 0 (true/false) - true if the player is able to interact with redstone components.
*** {{nbt|byte|flying}}: 1 or 0 (true/false) - true if the player is currently flying.
*** {{nbt|float|flySpeed}}: The flying speed, always 0.05.
*** {{nbt|byte|instabuild}}: 1 or 0 (true/false) - true if the player can instantly destroy blocks.
*** {{nbt|byte|invulnerable}}: 1 or 0 (true/false) - true if the player is immune to all damage and harmful effects.
*** {{nbt|byte|lightning}}: 1 or 0 (true/false) - true if the player was struck by lightning.
*** {{nbt|byte|mayfly}}: 1 or 0 (true/false) - true if the player can fly.
*** {{nbt|byte|mine}}: 1 or 0 (true/false) - true if the player can destroy blocks.
*** {{nbt|byte|mute}}: 1 or 0 (true/false) - true if the player messages cannot be seen by other players.
*** {{nbt|byte|noclip}}: 1 or 0 (true/false) - true if the player can phase through blocks.
*** {{nbt|byte|op}}: 1 or 0 (true/false) - true if the player has operator commands.
*** {{nbt|byte|opencontainers}}: 1 or 0 (true/false) - true if the player is able to open containers.
*** {{nbt|int|permissionsLevel}}: What permissions a player will default to, when joining a world.
*** {{nbt|int|playerPermissionsLevel}}: What permissions a player has.
*** {{nbt|byte|teleport}}: 1 or 0 (true/false) - true if the player is allowed to teleport.
*** {{nbt|float|walkSpeed}}: The walking speed, always 0.1.
*** {{nbt|byte|worldbuilder}}: 1 or 0 (true/false) - true if the player is a world builder.

== Attribute ==
NBT structure of an [[attribute]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|float|Base}}: The base value of this Attribute.
** {{nbt|float|Current}}: Unknown.
** {{nbt|float|DefaultMax}}: Unknown.
** {{nbt|float|DefaultMin}}: Unknown.
** {{nbt|float|Max}}: Unknown.
** {{nbt|float|Min}}: Unknown.
** {{nbt|list|Modifiers}}: (May not exist) List of [[Attribute#Modifiers|Modifiers]].
*** {{nbt|compound}}: An individual Modifier.
**** {{bedrock nbt|Attribute Modifier}}
** {{nbt|string|Name}}: The name of this Attribute.
** {{nbt|list|TemporalBuffs}}: (May not exist) Unknown.
*** {{nbt|float|Amount}}: Unknown.
*** {{nbt|int|Duration}}: Unknown.
*** {{nbt|int|LifeTime}}: Unknown.
*** {{nbt|int|Type}}: Unknown.

== Attributes ==
NBT structure for [[mob]]s:
* {{nbt|compound}}: Parent tag.
** {{nbt|list}}: List of [[attribute]]s.
*** {{nbt|compound}}:An attribute.
**** {{bedrock nbt|Attribute}}

== Attribute Modifier ==
NBT structure of an attribute [[modifier]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|float|Amount}}: The amount by which this Modifier modifies the Base value in calculations.
** {{nbt|string|Name}}: The Modifier's name.
** {{nbt|int|Operand}}: Unknown.
** {{nbt|int|Operation}}: Defines the operation this Modifier executes on the Attribute's Base value. 0: Increment X by Amount, 1: Increment Y by X * Amount, 2: Y = Y * (1 + Amount) (equivalent to Increment Y by Y * Amount).{{needs testing}}
** {{nbt|long|UUIDLeast}}: This modifier's UUID Least.
** {{nbt|long|UUIDMost}}: This modifier's UUID Most.

== AutonomousEntities ==
The autonomous entities data:
* {{nbt|compound}}: The autonomous entities root tag.
** {{nbt|list|AutonomousEntityList}}: Unknown.

== BiomeData ==
The [[biome]] data:
* {{nbt|compound}}: The biome data root tag.
** {{nbt|list|list}}: A list of compound tags representing biomes.
*** {{nbt|compound}}: A biome.
**** {{nbt|byte|id}}: The numerical [[Biome|biome ID]].
**** {{nbt|float|snowAccumulation}}: The biome's snow accumulation. Eg. <code>0.125</code>.

== Block ==
NBT structure of a [[block]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|string|name}}: The namespaced ID of this block.
** {{nbt|compound|states}}: List of block states of this block.
*** {{nbt||<''state_name''>}}: A block state and its value with corresponding data type.
** {{nbt|int|version}}: The data version.

== Command Block ==
NBT structure of [[command block]] and [[minecart with command block]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|string|Command}}: The command entered into the command block.
** {{nbt|string|CustomName}}: The custom name or hover text of this command block.
** {{nbt|byte|ExecuteOnFirstTick}}: 1 or 0 (true/false) - true if it executes on the first tick once saved or activated.
** {{nbt|long|LastExecution}}: Stores the time when a command block was last executed.
** {{nbt|string|LastOutput}}: The translation key of the output's last line generated by the command block. Still stored even if the [[gamerule]] commandBlockOutput is false. Appears in the command GUI.
** {{nbt|list|LastOutputParams}}: The params for the output's translation key.
*** {{nbt|string}}: A param.
** {{nbt|int|SuccessCount}}: Represents the strength of the analog signal output by redstone comparators attached to this command block.
** {{nbt|int|TickDelay}}: The delay between each execution.
** {{nbt|byte|TrackOutput}}: 1 or 0 (true/false) - true if the <code>LastOutput</code> is stored. Can be toggled in the GUI by clicking a button near the "Previous Output" textbox.
** {{nbt|int|Version}}: The data version.

== Firework Explosion ==
NBT structure of [[firework]] and [[firework star]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|byte-array|FireworkColor}}: Array of byte values corresponding to the primary colors of this firework's explosion.
** {{nbt|byte-array|FireworkFade}}: Array of byte values corresponding to the fading colors of this firework's explosion.
** {{nbt|byte|FireworkFlicker}}: 1 or 0 (true/false) - true if this explosion has the twinkle effect (glowstone dust).
** {{nbt|byte|FireworkTrail}}: 1 or 0 (true/false) - true if this explosion has the trail effect (diamond).
** {{nbt|byte|FireworkType}}: The shape of this firework's explosion. 0 = Small Ball, 1 = Large Ball, 2 = Star-shaped, 3 = Creeper-shaped, and 4 = Burst.{{needs testing}}

== Limbo entities ==
The limbo entities data:
* {{nbt|compound}}: The limbo entities root tag.
** {{nbt|compound|data}}: A compound with a list of limbo entities.
*** {{nbt|list|LimboEntities}}: Unknown.

== Mob Effect ==
NBT structure of a [[status effect]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|byte|Ambient}}: 1 or 0 (true/false) - true if this effect is provided by a beacon and therefore should be less intrusive on screen.
** {{nbt|byte|Amplifier}}: The potion effect level. 0 is level 1.
** {{nbt|byte|DisplayOnScreenTextureAnimation}}: Unknown.
** {{nbt|int|Duration}}: The number of ticks before the effect wears off.
** {{nbt|int|DurationEasy}}: Duration for Easy mode.
** {{nbt|int|DurationHard}}: Duration for Hard mode.
** {{nbt|int|DurationNormal}}: Duration for Normal mode.
** {{nbt|compound|FactorCalculationData}}
*** {{nbt|int|change_timestamp}}
*** {{nbt|float|factor_current}}
*** {{nbt|float|factor_previous}}
*** {{nbt|float|factor_start}}
*** {{nbt|float|factor_target}}
*** {{nbt|byte|had_applied}}
*** {{nbt|byte|had_last_tick}}
*** {{nbt|int|padding_duration}}
** {{nbt|byte|Id}}: The numerical effect ID.
** {{nbt|byte|ShowParticles}}: 1 or 0 (true/false) - true if particles are shown.

== Mob Events ==
NBT structure of [[Commands/mobevent|mob event]]s:
* {{nbt|compound}}: The mob events root tag.
** {{nbt|byte|events_enabled}}: 1 or 0 (true/false) - true if the mob events can occur.
** {{nbt|byte|minecraft:ender_dragon_event}}: 1 or 0 (true/false) - true if the [[ender dragon]] can spawn.
** {{nbt|byte|minecraft:pillager_patrols_event}}: 1 or 0 (true/false) - true if the [[illager patrol]] can spawn.
** {{nbt|byte|minecraft:wandering_trader_event}}: 1 or 0 (true/false) - true if the [[wandering trader]] can spawn.

== Monster Spawner ==
NBT structure of a [[monster spawner]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|short|Delay}}: Ticks until next spawn. If 0, it spawns immediately when a player enters its range.
** {{nbt|float|DisplayEntityHeight}}: The height of entity model that displayed in the block.
** {{nbt|float|DisplayEntityScale}}: The scale of entity model that displayed in the block.
** {{nbt|float|DisplayEntityWidth}}: The width of entity model that displayed in the block.
** {{nbt|string|EntityIdentifier}}: The id of the entity to be summoned.{{more info}}
** {{nbt|short|MaxNearbyEntities}}: The maximum number of nearby (within a box of <code>SpawnRange</code>*2+1 × <code>SpawnRange</code>*2+1 × 8 centered around the spawner block{{needs testing}}) entities whose IDs match this spawner's entity ID.
** {{nbt|short|MaxSpawnDelay}}: The maximum random delay for the next spawn delay.
** {{nbt|short|MinSpawnDelay}}: The minimum random delay for the next spawn delay.
** {{nbt|short|RequiredPlayerRange}}: Overrides the block radius of the sphere of activation by players for this spawner.
** {{nbt|short|SpawnCount}}: How many mobs to attempt to spawn each time.
** {{nbt|compound|SpawnData}}: (May not exist) Contains tags to copy to the next spawned entity(s) after spawning.
*** {{nbt|compound|Properties}}: Unknown.
*** {{nbt|string|TypeId}}: The entity's namespaced ID.
*** {{nbt|int|Weight}}: Unknown.
** {{nbt|list|SpawnPotentials}}: (May not exist) List of possible entities to spawn.
*** {{nbt|compound}}: A potential future spawn.
**** {{nbt|compound|Properties}}: Unknown.
**** {{nbt|string|TypeId}}: The entity's namespaced ID.
**** {{nbt|int|Weight}}: The chance that this spawn gets picked in comparison to other spawn weights. Must be positive and at least 1.
** {{nbt|short|SpawnRange}}: The radius around which the spawner attempts to place mobs randomly. The spawn area is square, includes the block the spawner is in, and is centered around the spawner's x,z coordinates - not the spawner itself.{{needs testing}} Default value is 4.

== Players ==
The players data:
* {{nbt|compound}}: A player root tag.
** {{nbt|string|MsaId}}
** {{nbt|string|SelfSignedId}}
** {{nbt|string|ServerId}}

== Portals ==
The portals data:
* {{nbt|compound}}: The portals root tag.
** {{nbt|compound|data}}
*** {{nbt|list|PortalRecords}}
**** {{nbt|compound}}
***** {{nbt|int|DimId}}
***** {{nbt|byte|Span}}
***** {{nbt|int|TpX}}
***** {{nbt|int|TpY}}
***** {{nbt|int|TpZ}}
***** {{nbt|byte|Xa}}
***** {{nbt|byte|Za}}

== SchedulerWT ==
The schedulerWT data:
* {{nbt|compound}}: The schedulerWT root tag.
** {{nbt|int|daysSinceLastWTSpawn}}
** {{nbt|byte|isSpawningWT}}
** {{nbt|long|nextWTSpawnCheckTick}}

== Scoreboard ==
NBT structure of [[scoreboard]]s:
* {{nbt|compound}}: The scoreboard data root tag.
** {{nbt|list|Criteria}}
** {{nbt|list|DisplayObjectives}}: A  list of compound tags representing specific displayed objectives.
*** {{nbt|compound}}: A displayed objective.
**** {{nbt|string|Name}}: The '''display slot''' of this objective.
**** {{nbt|string|ObjectiveName}}: The internal '''name''' of the objective displayed.
**** {{nbt|byte|SortOrder}}: The '''sort order''' of the objective displayed. 0 = <code>ascending</code>, 1 = <code>descending</code>. If not specified, or the '''display slot''' is <code>belowname</code>, 1 by default.
** {{nbt|list|Entries}}: A list of compound tags representing individual entities.
*** {{nbt|compound}}: An entity.
**** {{nbt|byte|IdentityType}}: The identity type of this entity. 1 = Players, 2 = Others.
**** {{nbt|long|EntityId}}: Optional. The entity's Unique ID.
**** {{nbt|long|PlayerId}}: Optional. The player's Unique ID.
**** {{nbt|long|ScoreboardId}}: The numerical ID given to this entity on the scoreboard system, starting from 1.
** {{nbt|list|Objectives}}: A list of compound tags representing objectives.
*** {{nbt|compound}}: An objective.
**** {{nbt|string|Criteria}}: The '''criterion''' of this objective, currently, always <code>dummy</code>.
**** {{nbt|string|DisplayName}}: The '''display name''' of this objective.
**** {{nbt|string|Name}}: The internal '''name''' of this objective.
**** {{nbt|list|Scores}}: A list of compound tags representing scores tracked on this objective.
***** {{nbt|compound}}: A tracked entity with a score.
****** {{nbt|int|Score}}: The score this entity has on this objective.
****** {{nbt|long|ScoreboardId}}: The numerical ID given to this entity on the scoreboard system.
*** {{nbt|long|LastUniqueID}}: The numerical ID given to the last entity added on the scoreboard system.

== Structuretemplate_<''name''> ==
The structure template data:
* {{nbt|compound}}: The structure template root tag.
** {{nbt|int|format_version}}
** {{nbt|list|size}}
*** {{nbt|int}}
*** {{nbt|int}}
*** {{nbt|int}}
** {{nbt|compound|structure}}
*** {{nbt|list|block_indices}}
**** {{nbt|list}}
***** {{nbt|int}}
*** {{nbt|list|entities}}
**** {{nbt|compound}}
***** {{bedrock nbt|Entity|entity}}
***** Tags unique to this entity type.
*** {{nbt|compound|palette}}
**** {{nbt|compound|default}}
***** {{nbt|list|block_palette}}
****** {{nbt|compound}}
******* {{bedrock nbt|Block|others}}
***** {{nbt|compound|block_position_data}}
****** {{nbt|compound|<''num''>}}
******* {{nbt|compound|block_entity_data}}
******** {{bedrock nbt|Block Entity|block}}
******** Tags unique to this block entity.
******* {{nbt|list|tick_queue_data}}: (May not exist)
******** {{nbt|compound}}
********* {{nbt|int|tick_delay}}
** {{nbt|list|structure_world_origin}}
*** {{nbt|int}}
*** {{nbt|int}}
*** {{nbt|int}}

== Tickingarea ==
The {{cmd|tickingarea}} data:
* {{nbt|compound}}: The tickingarea root tag.
** {{nbt|int|Dimension}}
** {{nbt|byte|IsCircle}}
** {{nbt|int|MaxX}}
** {{nbt|int|MaxZ}}
** {{nbt|int|MinX}}
** {{nbt|int|MinZ}}
** {{nbt|string|Name}}
** {{nbt|byte|Preload}}

== VILLAGE_[0-9a-f\\-]+_DWELLERS ==
The village dwellers data:
* {{nbt|compound}}: The village dwellers root tag.
** {{nbt|list|Dwellers}}
*** {{nbt|compound}}
**** {{nbt|list|actors}}
***** {{nbt|compound}}
****** {{nbt|long|ID}}
****** {{nbt|list|last_saved_pos}}
******* {{nbt|int}}
******* {{nbt|int}}
******* {{nbt|int}}
****** {{nbt|long|TS}}

== VILLAGE_[0-9a-f\\-]+_INFO ==
The village info data:
* {{nbt|compound}}: The village info root tag.
** {{nbt|long|BDTime}}
** {{nbt|long|GDTime}}
** {{nbt|byte|Initialized}}
** {{nbt|long|MTick}}
** {{nbt|long|PDTick}}
** {{nbt|int|RX0}}
** {{nbt|int|RX1}}
** {{nbt|int|RY0}}
** {{nbt|int|RY1}}
** {{nbt|int|RZ0}}
** {{nbt|int|RZ1}}
** {{nbt|long|Tick}}
** {{nbt|byte|Version}}
** {{nbt|int|X0}}
** {{nbt|int|X1}}
** {{nbt|int|Y0}}
** {{nbt|int|Y1}}
** {{nbt|int|Z0}}
** {{nbt|int|Z1}}

== VILLAGE_[0-9a-f\\-]+_PLAYERS ==
The village players data:
* {{nbt|compound}}: The village players root tag.
** {{nbt|list|Players}}

== VILLAGE_[0-9a-f\\-]+_POI ==
The village POIs data:
* {{nbt|compound}}: The village POIs root tag.
** {{nbt|list|POI}}
*** {{nbt|compound}}
**** {{nbt|list|instances}}
***** {{nbt|compound}}
****** {{nbt|long|Capacity}}
****** {{nbt|string|InitEvent}}
****** {{nbt|string|Name}}
****** {{nbt|long|OwnerCount}}
****** {{nbt|float|Radius}}
****** {{nbt|byte|Skip}}
****** {{nbt|string|SoundEvent}}
****** {{nbt|int|Type}}
****** {{nbt|byte|UseAABB}}
****** {{nbt|long|Weight}}
****** {{nbt|int|X}}
****** {{nbt|int|Y}}
****** {{nbt|int|Z}}
**** {{nbt|long|VillagerID}}
</div>

[[pt:Formato de nível da Edição Bedrock/Outros formatos de dados]]
[[zh:基岩版存档格式/其他数据格式]]
`;

const fullPageDataCategory: NBTSchemas.Utils.Conversion.FromMinecraftWikiData.WikiNBTSchemaCategory = "others";

writeFileSync(
    path.join(import.meta.dirname, "./nbtSchemas.json"),
    JSON.stringify(
        Object.fromEntries(
            NBTSchemas.Utils.Conversion.FromMinecraftWikiData.extractNBTSchemasFromFullWikiNBTPageData(fullPageData, {
                category: fullPageDataCategory,
                generateIDs: true,
            })
                .map(
                    (
                        schema: NBTSchemas.NBTSchema | NBTSchemas.NBTSchemaFragment
                    ): [key: string, value: NBTSchemas.NBTSchema | NBTSchemas.NBTSchemaFragment] => [schema.id, schema]
                )
                // .filter((entry): boolean => !(entry[0] in NBTSchemas.nbtSchemas))
        ),
        null,
        4
    )
);
