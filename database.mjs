import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const dbName = 'authDB';

let client;
let db;

export async function connectDB() {
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log('✓ Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export function getDB() {
    return db;
}

export function getCollection(name) {
    return db.collection(name);
}
