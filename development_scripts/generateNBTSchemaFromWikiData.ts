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
    JSON.stringify(NBTSchemas.Utils.Conversion.FromMinecraftWikiData.wikiNBTToNBTSchema(data), null, 4).replaceAll(/(?<!\r)\n/g, "\r\n")
);

const fullPageData = `{{exclusive|bedrock}}
This page lists NBT structures of items {{in|bedrock}}.

Item NBT is used both in the player's inventory and Ender inventory, and in chest block entities, dropped item entities, etc.
__TOC__
<div class="treeview">
== Item Stack ==
All items share this base:
* {{nbt|compound}}: The item's root tag.
** {{nbt|compound|Block}}: (May not exist) What block is placed when placing a block item.
*** {{bedrock nbt/block}}
** {{nbt|list|CanDestroy}}: (May not exist) Controls what block types this item can destroy.
*** {{nbt|string}}: A block ID.
** {{nbt|list|CanPlaceOn}}: (May not exist) Controls what block types this block may be placed on.
*** {{nbt|string}}: A block ID.
** {{nbt|byte|Count}}:  Number of items stacked in this inventory slot.
** {{nbt|short|Damage}}: The metadata value. Note that this tag does not store items' damage value.
** {{nbt|string|Name}}: The item ID.
** {{nbt|byte|Slot}}: The slot where the item is located in the container.
** {{nbt|compound|tag}}: (May not exist) Additional information about the item.
** {{nbt|byte|WasPickedUp}}: Unknown.

== General Tags ==
Items with durability store their damage value in NBT. Additionally, items can have custom display names and lore. There is also the '''RepairCost''' tag which tracks anvil usage for items, making them more costly with every use of the anvil.

* {{nbt|compound|tag}}: Parent tag.
** {{nbt|int|Damage}}: (May not exist) The damage value for this item. Defaults to 0.
** {{nbt|compound|display}}: (May not exist) Display properties.
*** {{nbt|list|Lore}}: (May not exist) List of strings to display as lore for the item.
**** {{nbt|string}}: (May not exist) A line of text for the lore of an item.
*** {{nbt|string|Name}}: (May not exist) The JSON text component to use to display the item name.
** {{nbt|byte|minecraft:item_lock}}: 1 for "lock in slot". 2 for "lock in inventory".
** {{nbt|byte|minecraft:keep_on_death}}: 1 if keeping on death.{{needs testing}}
** {{nbt|int|RepairCost}}: (May not exist) Number of experience levels to add to the base level cost when repairing, combining, or renaming this item with an [[Anvil]].
** {{nbt|byte|Unbreakable}}: 1 or 0 (true/false) - (may not exist) if this item's durability is allowed to take damage.

== Enchantment Tags ==
{{in|bedrock}}, there's only one way to store enchantment NBTs: both enchanted items and [[Enchanted Book]] share the {{nbt|list|ench}} tag.

* {{nbt|compound|tag}}: Parent tag.
** {{nbt|list|ench}}: Contains enchantments on this item.
*** {{nbt|compound}}: A single enchantment.
**** {{nbt|short|id}}: The ID of the enchantment.
**** {{nbt|short|lvl}}: The level of the enchantment, where 1 is level 1. Values are clamped between 0 and 255 when reading.

== Armor Trim ==
Additional fields when an [[armor]] is [[Smithing Template|trimmed]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|compound|Trim}}: Properties of the armor trim.
*** {{nbt|string|Material}}: The material which decides the color of armor trim.
*** {{nbt|string|Pattern}}: The pattern of armor trim.

== Book and Quills ==
Additional fields for [[book and quill]]s:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|list|pages}}: (May not exist) The list of pages in the book.
*** {{nbt|compound}}: A single page in the book.
**** {{nbt|string|photoname}}: Filename of a [[photo]] in this page if included.
**** {{nbt|string|text}}: The text in this page.

== Bucket of Aquatic Mob ==
Additional fields for [[bucket]]:
* {{nbt|compound|tag}}: Parent tag.
** {{bedrock nbt/entity}}
** {{nbt|byte|AppendCustomName}}: 1 or 0 (true/false) - true if the entity color, state, and id are used to generate the bucket item's name.
** {{nbt|string|BodyID}}: (May not exist) The translation key of entity's state. Used to generate the bucket item's name.
** {{nbt|string|ColorID}}: (May not exist) The translation key of a color. Used to generate the bucket item's name.
** {{nbt|string|Color2ID}}: (May not exist) The translation key of another color. Used to generate the bucket item's name.
** {{nbt|string|CustomName}}: (May not exist) The custom name of entity in it. Used to generate the bucket item's name.
** {{nbt|string|GroupName}}: (May not exist) Unknown. Used to generate the bucket item's name.

== Crossbow ==
Additional fields for [[crossbow]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|compound|chargedItem}}: The items this crossbow has charged.
*** {{bedrock nbt|Item Stack|item}}

== Filled Map ==
Additional fields for [[filled map]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|byte|map_display_players}}: 1 or 0 (true/false) - (may not exist) true if the map displays player markers.
** {{nbt|byte|map_is_init}}: (May not exist) Unknown.
** {{nbt|byte|map_is_scaling}}: (May not exist) Unknown.
** {{nbt|int|map_name_index}}: The index of the map's name.
** {{nbt|int|map_scale}}: (May not exist) Unknown.
** {{nbt|long|map_uuid}}: The UUID of the map used in this item.

== Firework Rocket ==
Additional fields for [[firework rocket]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|compound|Fireworks}}
*** {{nbt|list|Explosions}}: List of compounds representing each explosion this firework causes.
**** {{nbt|compound}}: A explosion effect.
***** {{bedrock nbt|Firework Explosion}}
*** {{nbt|byte|Flight}}: Indicates the flight duration of the firework (equals the amount of gunpowder used in crafting the rocket). Can be anything from -128 to 127.

== Firework Star ==
Additional fields for [[firework star]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|int|customColor}}: The color of this firework star.
** {{nbt|compound|FireworksItem}}: The explosion effect contributed by this firework star.
*** {{bedrock nbt|Firework Explosion}}

== Glow Stick ==
Additional fields for [[glow stick]]:
* {{nbt|compound}}: Parent tag.
** {{nbt|long|active_time}}: (May not exist) Unknown.

== Horse Armor ==
Additional fields for [[horse armor]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|int|customColor}}: (May not exist) The color of the leather armor.

== Lodestone Compass ==
Additional fields for [[lodestone compass]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|int|trackingHandle}}: The ID of lodestone to track.

== Potion ==
Additional fields for [[potion]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|byte|wasJustBrewed}}: 1 or 0 (true/false) - (may not exist) true if item is brewed in brewing stand.

== Shield ==
Additional fields for [[shield]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|int|Base}}: The base color of the banner on the shield. See [[Banner#Block_data]].
** {{nbt|list|Patterns}}: (May not exist) List of all patterns applied to the banner on the shield.
*** {{nbt|compound}}: An individual pattern.
**** {{nbt|int|Color}}: The base color of the pattern. See [[Banner#Block_data]].
**** {{nbt|string|Pattern}}: The pattern ID code. See [[Banner#Block_data]].

== Written Book ==
Additional fields for [[written book]]:
* {{nbt|compound|tag}}: Parent tag.
** {{nbt|string|author}}: The author of this book.
** {{nbt|int|generation}}: The copy tier of the book. 0 = Original, 1 = Copy of original, 2 = Copy of copy.
** {{nbt|list|pages}}: The list of pages in the book.
*** {{nbt|compound}}: A single page in the book.
**** {{nbt|string|photoname}}: Filename of a [[photo]] in this page if included.
**** {{nbt|string|text}}: The text in this page.
** {{nbt|string|title}}:  The title of this book.
** {{nbt|long|xuid}}: Unknown.
</div>

[[pt:Formato de nível da Edição Bedrock/Formatos de item]]
[[zh:基岩版存档格式/物品格式]]
`;

const fullPageDataCategory: NBTSchemas.Utils.Conversion.FromMinecraftWikiData.WikiNBTSchemaCategory = "item";

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
    ).replaceAll(/(?<!\r)\n/g, "\r\n")
);
