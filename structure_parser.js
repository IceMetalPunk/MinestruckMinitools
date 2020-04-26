import nbt from 'nbt';
import fsMain from 'fs';
const fs = fsMain.promises;

export const getCleanResourceLocation = resLoc => {
    const pieces = resLoc.split(':');
    pieces.shift();
    return pieces.join(':').replace(/(?:^|_)(.)/g, (match, letter) => ` ${letter.toUpperCase()}`).trim();
};

const getValue = nbt => {
    if (typeof nbt === 'object') {
        if ('type' in nbt && 'value' in nbt) {
            return getValue(nbt.value);
        }
        for (const key in nbt) {
            nbt[key] = getValue(nbt[key]);
        }
    }
    return nbt;
};

export const getPalette = nbt => {
    return nbt.palette.map(entry => {
        const properties = entry.Properties;
        const result = {name: entry.Name};
        if (properties) {
            result.state = properties;
        }
        return result;
    });
};

const removeIgnoredBlocks = (nbt, blocksAndCounts, ignoredBlocks = {'Air': 'minecraft:air', 'Cave Air': 'minecraft:cave_air', 'Void Air': 'minecraft:void_air'}) => {
    Object.entries(blocksAndCounts.blockCounts).forEach(entry => {
        if (entry[0] in ignoredBlocks) {
            nbt.size[3] -= entry[1];
            delete blocksAndCounts.blockCounts[entry[0]];
        }
    });
    const resLocations = Object.values(ignoredBlocks);
    blocksAndCounts.blockList = blocksAndCounts.blockList.filter(block => {
        return !resLocations.includes(block.state.name);
    });
}

export const getBlocksAndCounts = (nbt, palette) => {
    const blockCounts = {};
    const blockList = nbt.blocks.map(entry => {
        const blockName = getCleanResourceLocation(palette[entry.state].name);
        blockCounts[blockName] = (blockCounts[blockName] || 0) + 1;
        return {
            pos: entry.pos,
            state: palette[entry.state]
        };
    });
    return {blockList, blockCounts};
};

const parseNbtPromise = data => {
    return new Promise((res, rej) => {
        nbt.parse(data, (err, result) => {
            if (err) {
                return rej(err);
            }
            res(result);
        });
    });
};

export const getEntititesAndCounts = nbt => {
    const entityCounts = {};
    const entityList = nbt.entities.map(entry => {
        let tags = entry.nbt;
        const entityId = getCleanResourceLocation(tags.id);
        entityCounts[entityId] = (entityCounts[entityId] || 0) + 1;
        return {
            nbt: tags,
            pos: entry.pos,
            type: entityId
        };
    });
    return {entityList, entityCounts};
};

export const readStructure = async file => {
    let data;
    if (typeof file === 'string') {
        data = await fs.readFile(file);
    } else {
        data = file;
    }
    let result;
    try {
        result = await parseNbtPromise(data);
    } catch (er) {
        throw 'File is either not an NBT file or is corrupt.';
    }
    const resultValue = getValue(result.value);
    resultValue.size.push(resultValue.size[0] * resultValue.size[1] * resultValue.size[2]);
    try {
        const palette = getPalette(resultValue);
        const blocksAndCounts = getBlocksAndCounts(resultValue, palette);
        const entitiesAndCounts = getEntititesAndCounts(resultValue);
        removeIgnoredBlocks(resultValue, blocksAndCounts);
        return Object.assign({}, {palette}, {size: resultValue.size}, blocksAndCounts, entitiesAndCounts);
    } catch (er) {
        throw 'File is an NBT file, but not one that represents a Minecraft structure.';
    }
};