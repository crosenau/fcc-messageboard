'use strict';

const assert        = require('chai').assert;
const MongoClient   = require('mongodb').MongoClient;
const ObjectID      = require('mongodb').ObjectID;

const connectionString = process.env.DATABASE_URI;
const options          = { useNewUrlParser: true };

let _db;

async function initDb() {
    if (_db) {
        console.warn('Database connection already initialized! Returning active connection.');
        return _db;
    } else {
        try {
            const client = new MongoClient(connectionString, options);
            await client.connect();

            _db = client.db('fcc');
            return _db;
        } catch(err) {
            throw err;
        }
    
    }
}

function getDb() {
    assert.isNotNull(_db, 'DB has not been initialized. Call initDb first');
    assert.isDefined(_db, 'DB has not been initialized. Call initDb first');
    return _db;
}

module.exports = {
    getDb,
    initDb
};