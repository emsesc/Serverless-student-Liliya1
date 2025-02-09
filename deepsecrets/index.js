
const querystring = require('querystring');
const CosmosClient = require("@azure/cosmos").CosmosClient;

const config = {
    endpoint: process.env.ENDPOINT || 'https://student1.documents.azure.com:443/',
    key: process.env.KEY || 'XSdB7wNkKFeiC4S2etAABCPzcotnSOsPQrAEkD2IJLBP0zoA0PPfIljExJhrY7zuFPzrES2uaTjAfsHwLQNgzQ==',
    databaseId: "SecretStorer",
    containerId: "secrets",
    partitionKey: { kind: "Hash", paths: ["/secrets"] }
};

async function create(client, databaseId, containerId) {
    const partitionKey = config.partitionKey;

    /**
     * Create the database if it does not exist
     */
    const { database } = await client.databases.createIfNotExists({
        id: databaseId
    });
    console.log(`Created database:\n${database.id}\n`);

    /**
     * Create the container if it does not exist
     */
    const { container } = await client
        .database(databaseId)
        .containers.createIfNotExists(
            { id: containerId, partitionKey },
            { offerThroughput: 400 }
        );

    console.log(`Created container:\n${container.id}\n`);
}
async function createDocument(newItem) {
    const { endpoint, key, databaseId, containerId } = config;

    const client = new CosmosClient({ endpoint, key });

    const database = client.database(databaseId);
    const container = database.container(containerId);

    // Make sure Tasks database is already setup. If not, create it.
    await create(client, databaseId, containerId);
    const querySpec = {
        query: "SELECT * from c"
    };


    // read all items in the Items container
    const { resources: items } = await container.items
        .query(querySpec)
        .fetchAll();
    const { resource: createdItem } = await container.items.create(newItem);

    return items
}

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const queryObject = querystring.parse(req.body);
    let newMessage = {
        "message": queryObject.Body
    }

    let items = await createDocument(newMessage);

    var random_value = Math.floor(items.length * Math.random());

    const responseMessage = `Thanks 😊! Stored your secret "${queryObject.Body}". 😯 Someone confessed that: ${JSON.stringify(items[random_value].message)}`

    context.res = {
        body: responseMessage
    };

}