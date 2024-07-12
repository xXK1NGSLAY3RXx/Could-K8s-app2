const express = require('express');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const app = express();
app.use(express.json());

const PORT = 7000;
const FILE_DIR = '/arta_PV_dir'; // Directory for file access

const ERROR_MESSAGE = "Input file not in CSV format.";

app.post('/calculate', (req, res) => {
    const { file, product } = req.body;
    let sum = 0;
    let isCSV = true;
    let productFound = false;
    const filePath = path.join(FILE_DIR, file);

    console.log(`Calculating sum for file: ${filePath} and product: ${product}`);

    const cleanRow = (row) => {
        return Object.keys(row).reduce((cleaned, key) => {
            const trimmedKey = key.trim();
            cleaned[trimmedKey] = row[key].trim();
            return cleaned;
        }, {});
    };

    const validateCSV = () => new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .on('error', (err) => {
                console.error('Error reading file:', err);
                reject({ "file": file, "error": ERROR_MESSAGE });
            })
            .pipe(csvParser())
            .on('data', (row) => {
                console.log('Row data before trimming:', row);
                const cleanedRow = cleanRow(row);
                console.log('Row data after trimming:', cleanedRow);
                if (!cleanedRow.product || !cleanedRow.amount || isNaN(parseInt(cleanedRow.amount, 10))) {
                    console.error('Invalid CSV format:', cleanedRow);
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
                const cleanedRow = cleanRow(row);
                if (cleanedRow.product === product) {
                    sum += parseInt(cleanedRow.amount, 10);
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
            console.error('Error calculating sum:', error);
            res.status(400).json(error);
        });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
