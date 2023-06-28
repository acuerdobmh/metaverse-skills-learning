const got = require('got');
const crypto = require("crypto");

const url = 'https://api-devel.auracognitive.com/llm-api/v1/generate';
const id = crypto.randomBytes(16).toString("hex");
console.log(id);
let output = "";

const options = {
    json: {
        sesid: id,
        preset: "movistar-mei",
        query: 'Quick Start',
    },
    headers: {
        'X-Api-Key': 'fa4c0998-fe2e-11ed-afb7-13611b8f8dc1'
    },
};

getOutputText(options)
    .then(outputText => {
        console.log('Output:', output.output);
    })
    .catch(err => {
        console.log('Errores: ', err.message);
    });

async function getOutputText(options) {
    await got.post(url, options)
        .then(res => {
            console.log('Status Code:', res.statusCode);
            output = JSON.parse(res.body);
        })
        .catch(err => {
            console.log('Errores: ', err.message);
        });
}

