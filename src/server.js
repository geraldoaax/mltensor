const sql = require("mssql");
const tf = require("@tensorflow/tfjs-node");
const path = require("path");
require("dotenv").config();

// console.log(process.env); // remove this after you've confirmed it is working

const config = {
  server: process.env.SERVER,
  database: process.env.DATABASE,
  user: process.env.DATABASE_USER,
  password: process.env.PASSWORD,
  port: 1433,
  options: {
    encrypt: true,
    trustedConnection: true,
    trustServerCertificate: true,
    connectTimeout: 30000000,
    requestTimeout: 30000000,
  },
  dialectOptions: {
    options: { requestTimeout: 30000000 },
  },
};

const modelPath = path.join(__dirname, "model");

const loadModel = async () => {
  const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
  return model;
};

const predict = (model, data) => {
  const predictions = model.predict(tf.tensor(data)).arraySync();
  return predictions;
};

sql
  .connect(config)
  .then(async () => {
    console.log("Connected to SQL Server database");
    const request = new sql.Request();

    request.input("interval", sql.VarChar, "M6");
    // request.input("param2", sql.Int, 123);
    request.execute("prQDataCicloDetalhadoBI", (err, result) => {
      if (err) {
        console.error(err);
      } else {
        const data = result.recordset.map((row) => [
          row.feature1,
          row.feature2,
          row.feature3,
        ]);
        loadModel()
          .then((model) => {
            const predictions = predict(model, data);
            console.log(predictions);
          })
          .catch((err) => {
            console.error(err);
          });
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });
