// entity is a class that maps to a database table
const EntitySchema = require("typeorm").EntitySchema; // import {EntitySchema} from "typeorm";
const Joke = require("../model/Joke"); // import {Joke} from "../model/Joke";

module.exports = new EntitySchema({
    name: "Joke",
    target: Joke,
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        content: {
            type: "varchar"
        },
        img_url: {
            type: "varchar",
            nullable: true
        },
        created_at: {
            type: "timestamp",
            nullable: true
        },
    }
});