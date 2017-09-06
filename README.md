# SubPar project tracker
_v0 Desu yo_

## What is it?
A service to keep track of your groups projects and where they're at.

It takes the form of a single service API, which you can use to retrieve the status of a project or update projects.
There is a separate CLI program included to an admin to add new project and API tokens

## Dependant Infrastructure:

This project requires a MySQL database to be configured, the specification for which is in `docs/database.json`. It's designed to be used with [Mysql-DB-Builder](https://github.com/Chrolo/Mysql-DB-Builder).
__note__: if the version in `docs/database.json` seems to be out of date, you can just run `npm run build:databaseDef` to generate a newer version.

## Config.json
The program will automatically attempt to load a `config.json` from the project root, which will be used for configuration of the system on startup. You can specify an alternative config file using the `-c` flag at startup. Any file that can be parsed by NodeJs that returns a javascript object will do (you can write it as a `.js` file to be evaluated at runtime and/or obtain secrets from other areas of the system)


### `mysql`
| key |default value | description |
| - | - | - |
| host |`localhost` | the hostname for the mysql instance |
| user | `subpar` | the user name for the database connection |
| password | __null__ | The password to use when connecting to the database |
| database | `subpar` | The username for the database connection to user. Needs to have `SELECT, INSERT and UPDATE` on the selected database |
| connectionLimit | `10` | a limit on the amount of connections the application should use to the server |


__Example config__
```json
{
    "mysql":{
        "user": "databaseWriteUser",
        "host": "192.168.0.1",
        "database": "aSpareDatabase"
    }
}
```

### `server`
| key |default value | description |
| - | - | - |
| port |`8080` | the port for the server to run on |


__Example config__
```json
{
    "server":{
        "port": 8080
    }
}
```
