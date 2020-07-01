const typeorm = require("typeorm");
const Joke = require("./model/Joke");

let connection;

const initDb = async () => {
    connection = await typeorm.createConnection();
    return
}

const saveJoke = async () => {
    const joke1 = new Joke(0, "somejoke");
    await connection.manager.save([joke1]);
}

const saveCustomJoke = async (inputText) => {
    const customJoke = new Joke(1, inputText);
    await connection.manager.save([customJoke]);
}

module.exports = {
    initDb, saveJoke, saveCustomJoke
}