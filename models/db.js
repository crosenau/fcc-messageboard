'use strict';

const assert        = require('chai').assert;
const MongoClient   = require('mongodb').MongoClient;
const ObjectID      = require('mongodb').ObjectID;

const connectionString = process.env.DATABASE_URI;
const options          = { useNewUrlParser: true };

let _db;

function initDb() {
    return new Promise((resolve, reject) => {
        if (_db) {
            console.warn('Database connection already initialized! Returning active connection.');
            resolve(_db);
        } else {
            const client = new MongoClient(connectionString, options);
            
            client.connect()
                .then(() => {
                    console.log('Successfully connected to Database');
                    _db = client.db('fcc');
                    resolve(_db);
                })
                .catch(err => reject(err));
        }
    });
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