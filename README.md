# SubPar project tracker
_v0 Desu yo_

## What is it?
A service to keep track of your groups projects and where they're at.

It takes the form of a single service API, which you can use to retrieve the status of a project or update projects.
There is a separate CLI program included to an admin to add new project and API tokens

## The API

The API that this spins up is documented in `/docs/api.swagger.json`. It's an OpenAPI v3 spec. You can use [the online API editor/viewer](https://editor.swagger.io/) to help read it if you'd like.

## Dependant Infrastructure:

This project requires a MySQL database to be configured, the specification for which is in `docs/database.json`. It's designed to be used with [Mysql-DB-Builder](https://github.com/Chrolo/Mysql-DB-Builder).
__note__: if the version in `docs/database.json` seems to be out of date, you can just run `npm run build:databaseDef` to generate a newer version.

## CLI
The CLI is there to help manage the system for someone with terminal access to the machine this system.
__It is assumed that such a person has admin rights to this app__, because with that kind of access they could just change the code of the app to make it do what they want.

### running the CLI
The CLI can be run with `node src/cli/`. From there you should be able to use `help` to find out all you need.

### What can be done?
- Add new api tokens
- Revoke old api tokens
- Add new staff members.


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
| port | `8080` | the port for the server to run on |
| hostname | `undefined` | hostname to listen on. If left undefined, listens on the `undefined IP` (all IPs the machine responds to) as noted in [the node documentation](https://nodejs.org/api/http.html#http_server_listen_port_hostname_backlog_callback) |


__Example config__
```json
{
    "server":{
        "port": 8080,
        "hostname": "example.com"
    }
}
```

### `logger`
| key |default value | description |
| - | - | - |
| level | `info` | The log level. Available levels (in order from least to most verbose) are `"error", "warn",  "info", "debug", "silly"` |


__Example config__
```json
{
    "logger":{
        "level": "debug"
    }
}
```


## Permissions
The following permissions can be set against any API token created:

| permission | description | values |
| - | - | - |
| dataViewLevel | the ability to receive data from the API | `basic`, `staff` or `admin` |
| taskUpdate | the ability to update tasks. | `false`, `assigned`, `all` |
| projectDetailUpdate | the ability to change the details of a project. Includes ability to add new episode records | `false`, `assigned`, `all` |
| projectCreation | the ability to create a new project | `true`, `false` |
| apiTokenCreate | the ability to create new API tokens. | `true`, `false` |
| apiTokenRevoke | the ability to revoke API tokens (this is meant for admins) | `true`, `false` |
