import DataUriParder from 'datauri/parser.js';
import path from 'path';

const getBuffer = (file : any) => {
    const parser = new DataUriParder();

    const extName = path.extname(file.originalname).toString();

    return parser.format(extName , file.buffer);
};

export default getBuffer;