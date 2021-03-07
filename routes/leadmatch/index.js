const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const csv = require('csvtojson');
const xlsx = require('read-excel-file/node');
const ObjectsToCsv = require('objects-to-csv');
const router = express.Router();

const { getLeads } = require('../../functions/cross-match');

const upload = multer({
    limits: {
        fileSize: 10000000  //up to 10 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(csv|xls(x)?)$/)) //uploading lead match files
            return cb(new Error('File extension does not match allowed types'));

        cb(undefined, true);
    }
});

router.get('/leadmatch', (req, res) => {
    res.send();
});

// router.post('/create-lm-instance', (req, res) => {
// });

router.post('/leadmatch', upload.array('leadmatch'), async (req, res) => {
    // console.log(req.files);
    console.log(req.body);
    const { matchBy, gaHeadersDeterminer, clientHeadersDeterminer, gaHeadersInclusion, threshold } = req.body;
    if ((req.files || []).length !== 2) {
        return res.status(400).send(
            new Error('There should only be two files uploaded.')
        );
    }

    const filePath = path.join(__dirname + '/../../files/');
    const lmPath1 = path.join(__dirname + '/../../files/' + req.files[0].originalname);
    const lmPath2 = path.join(__dirname + '/../../files/' + req.files[1].originalname);

    try {
        // check if directory exists, create folder if not
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath);
        }

        fs.writeFileSync(lmPath1, req.files[0].buffer);
        fs.writeFileSync(lmPath2, req.files[1].buffer);

        const isGA = req.files[0].originalname.includes('gadata');
        const gaPath = isGA ? lmPath1 : lmPath2;
        const clientPath = isGA ? lmPath2 : lmPath1;

        let gaJsonData;
        let clientJsonData;
        let gaFileType ;
        let clientFileType;

        if (isGA) {
            gaFileType = req.files[0].mimetype;
            clientFileType = req.files[1].mimetype;
        } else {
            gaFileType = req.files[1].mimetype;
            clientFileType = req.files[0].mimetype;
        }

        if (gaFileType.includes('spreadsheetml')) {
            gaJsonData = await xlsx(gaPath);
        } else {
            gaJsonData = await csv().fromFile(gaPath);
        }

        if (clientFileType.includes('spreadsheetml')) {
            clientJsonData = await xlsx(clientPath);
        } else {
            clientJsonData = await csv().fromFile(clientPath);
        }

        const { matchedData, unmatchedData } = getLeads(
            gaJsonData, 
            clientJsonData, 
            gaFileType, 
            clientFileType,
            matchBy,
            gaHeadersDeterminer,
            clientHeadersDeterminer,
            gaHeadersInclusion,
            threshold
        );

        const matchedCsv = new ObjectsToCsv(matchedData);
        const unmatchedCsv = new ObjectsToCsv(unmatchedData);

        const resFilePath = path.join(__dirname + '/../../results/');
        const resMatchedPath = path.join(__dirname + '/../../results/' + 'matched-data.csv');
        const resUnmatchedPath = path.join(__dirname + '/../../results/' + 'unmatched-data.csv');

        // check if directory exists, create folder if not
        if (!fs.existsSync(resFilePath)) {
            fs.mkdirSync(resFilePath);
        }

        await matchedCsv.toDisk(resMatchedPath);
        await unmatchedCsv.toDisk(resUnmatchedPath);

        res.send({
            gaJsonData,
            matchedData,
            unmatchedData,
        });
    } catch (e) {
        console.log(e);
        res.status(400).send();
    }
});

router.get('/leadmatch/download/match', (req, res) => {
    const resMatchedPath = path.join(__dirname + '/../../results/' + 'matched-data.csv');
    
    if (fs.existsSync(resMatchedPath)) {
        res.download(resMatchedPath);
    } else {
        res.status(400).send();
    }
});

module.exports = router;