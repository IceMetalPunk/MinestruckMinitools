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

export const getBlocksAndCounts = (nbt, palette, ignoredBlocks = ['Air', 'Cave Air', 'Void Air']) => {
    const blockCounts = {};
    const blockList = nbt.blocks.map(entry => {
        const blockName = getCleanResourceLocation(palette[entry.state].name);
        if (!ignoredBlocks.includes(blockName)) {
            blockCounts[blockName] = (blockCounts[blockName] || 0) + 1;
        }
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
    try {
        const palette = getPalette(resultValue);
        const blocksAndCounts = getBlocksAndCounts(resultValue, palette);
        const entitiesAndCounts = getEntititesAndCounts(resultValue);
        return Object.assign({}, {palette}, {size: resultValue.size}, blocksAndCounts, entitiesAndCounts);
    } catch (er) {
        throw 'File is an NBT file, but not one that represents a Minecraft structure.';
    }
};