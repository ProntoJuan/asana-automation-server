import { JsonDB, Config } from 'node-json-db'

let dbJson

function configJsonDB () {
  dbJson = new JsonDB(new Config('myDataBase', true, true, '/'))
}

export { configJsonDB, dbJson }
