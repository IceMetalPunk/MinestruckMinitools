import dotenv from 'dotenv';
dotenv.config();
import {readStructure} from './structure_parser.js';
import fileUpload from 'express-fileupload';
import express from 'express';
const server = express();
server.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
    })
);
server.use(express.static('public'));
const PORT = process.env.PORT || 3000;

// (async () => {
//     try {
//         const result = await readStructure('test.nbt');
//         console.log(result);
//     } catch(er) {
//         console.error(er);
//     }
// })();

server.post('/analyze', async (req,res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            error: true,
            code: 'No file selected.'
        });
      }
    
      try {
        const file = req.files.structure;
        const result = await readStructure(file.data);
        return res.status(200).json(result);
      } catch (er) {
        return res.status(452).json({
            error: true,
            code: er.toString()
        });
      }
});

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});