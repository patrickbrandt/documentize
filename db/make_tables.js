const aws = require('aws-sdk');
const fs = require('fs');

aws.config.update({
    accessKeyId: process.env.ACCESS_KEY || 'Temp',
    secretAccessKey: process.env.SECRET_KEY || 'Temp',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://192.168.99.100:8000',
    region: process.env.AWS_REGION || 'us-east-1'
});

const schemaDirectory = process.env.SCHEMA_LOCATION || './tables/';
const sampleDataDirectory = process.env.DATA_LOCATION || './data/';
const dynamodb = new aws.DynamoDB();
const doc = new aws.DynamoDB.DocumentClient();

fs.readdir(schemaDirectory, (err, items) => {
    if (err) {
        console.log(err);
    } else {
        items.map(makeTable);
    }
});

function makeTable(item){
    const table = item.split('.')[0];
    console.log('making table ' + table);
    deleteTable(table)
        .then(createTable)
        .then(loadData)
        .catch(function(err) { console.log(err.stack); });
}

function deleteTable(tableName) {
    return new Promise((resolve, reject) => {
        dynamodb.deleteTable({ TableName: tableName }, (err, data) => {
            if (err && err.code === 'ResourceNotFoundException') {
                console.log('WARN: can\'t delete ' + tableName + ' table because it does not exist');
            } else if (err) {
                return reject(err);
            }

            dynamodb.waitFor('tableNotExists', { TableName: tableName }, (err, data) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(tableName);
                }
            });
        });
    });
}

function createTable(tableName) {
    return new Promise((resolve, reject) => {
        let params;
        try {
            params = require(schemaDirectory + tableName + '.json');
        } catch (err) {
            return reject(err);
        }

        dynamodb.createTable(params, (err, data) => {
            if (err) {
                return reject(err);
            }

            dynamodb.waitFor('tableExists', { TableName: tableName }, (err, data) => {
                if (err) {
                    return reject(err);
                } else {
                    console.log('table created: ' + tableName);
                    return resolve(tableName);
                }
            });
        });
    });
}

function loadData(tableName) {
    let items;
    try {
        console.log(`loading data for ${tableName}`);
        items = JSON.parse(fs.readFileSync(sampleDataDirectory + tableName + '.json'));
    } catch (err) {
        console.log(err);
        return;
    }

    const requestItem = {};
    requestItem[tableName] = [];
    let requests = [];

    items.forEach((current, index) => {
        requestItem[tableName].push({
            PutRequest: {
                Item: current
            }
        });

        if (index % 25 === 0) {
            let copy = Object.assign({}, requestItem);
            copy[tableName] = requestItem[tableName].slice();
            requests.push(copy);
            requestItem[tableName] = [];
        }
    });

    if (requestItem[tableName].length > 0) {
        requests.push(requestItem);
    }

    requests.map((request) => {
        doc.batchWrite({ RequestItems: request }, (err, data) => {
            if (err) {
                console.log('error in batch write for ' + tableName + ': ' + err);
            } else {
                console.log('items saved for ' + tableName);
            }
        });
    });

}