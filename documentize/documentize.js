const {Aws} = require('../shared');
const {Documentizer} = require('../shared');
const aws = new Aws(process.env.DYNAMODB_ENDPOINT);
const doc = aws.doc;

// documentize relational tables into article documents, comment docs, and user docs
// article doc --> user id GSI, map type for article attribute includes user fields and first 10 comments
// TODO: user doc --> name and articles
// TODO: comment doc --> partition key is article id, sort key is date, gsi is user id

//handy async/await error-handling article: https://javascript.info/async-await#error-handling
convertTable('article').catch(err => console.log(err));

async function convertTable(tableName, limit = 1) {
  const firstRowSet = await doc.scan({ TableName: tableName, Limit: limit }).promise();
  convertTableRecursive(firstRowSet, tableName, limit);
}

async function convertTableRecursive(rows, tableName, limit) {
  const documentizer = new Documentizer(tableName, aws);
  for (const row of rows.Items) {
    await documentizer.convert(row);
  }

  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html#Scan.Pagination
  if (!rows.LastEvaluatedKey) return;

  const nextRowSet = await doc.scan({ TableName: tableName, Limit: limit, ExclusiveStartKey: rows.LastEvaluatedKey }).promise();
  convertTableRecursive(nextRowSet, tableName, limit);
}
