const express = require('express');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const app = express();
app.use(express.json());

const PORT = 7000;
const FILE_DIR = path.join(__dirname, 'arta_PV_dir'); // Directory for file access

const ERROR_MESSAGE = "Input file not in CSV format.";

app.post('/calculate', (req, res) => {
    const { file, product } = req.body;
    let sum = 0;
    let isCSV = true;
    let productFound = false;
    const filePath = path.join(FILE_DIR, file);

    console.log(`Calculating sum for file: ${filePath} and product: ${product}`);

    const validateCSV = () => new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .on('error', (err) => {
                console.error('Error reading file:', err);
                reject({ "file": file, "error": ERROR_MESSAGE });
            })
            .pipe(csvParser())
            .on('data', (row) => {
                console.log('Row data:', row);
                if (!row.product || !row.amount || isNaN(parseInt(row.amount, 10))) {
                    console.error('Invalid CSV format:', row);
                    isCSV = false;
                }
            })
            .on('end', () => {
                if (!isCSV) {
                    reject({ "file": file, "error": ERROR_MESSAGE });
                } else {
                    resolve();
                }
            });
    });

    const calculateSum = () => new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                if (row.product === product) {
                    sum += parseInt(row.amount, 10);
                    productFound = true;
                }
            })
            .on('end', () => {
                if (!productFound) {
                    reject({ "file": file, "error": ERROR_MESSAGE });
                } else {
                    resolve(sum);
                }
            })
            .on('error', (err) => {
                console.error('Error reading file:', err);
                reject({ "file": file, "error": ERROR_MESSAGE });
            });
    });

    validateCSV()
        .then(() => calculateSum())
        .then((sum) => {
            res.json({ "file": file, "sum": sum });
        })
        .catch((error) => {
            res.status(400).json(error);
        });
});

app.listen(PORT, () => {
    console.log(`Container 2 listening on port ${PORT}`);
});
