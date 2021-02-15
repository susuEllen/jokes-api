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
    console.log("about to save this joke\t" + customJoke)

    await connection.manager.save([customJoke]);
}

const deleteLastJoke = async() => {
    await connection.manager.query(`delete from joke where id = (select max(id) from joke)`);
}

module.exports = {
    initDb, saveJoke, saveCustomJoke,deleteLastJoke
}