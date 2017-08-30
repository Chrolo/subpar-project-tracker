const ProjectsRouter = require('express').Router();
const {getListOfProjects, getFullProjectInfoByName} = require('../data/sql/projects.js');
const {getEpisodeByNumberForProject} = require('../data/sql/episodes.js');

function ProjectsRouterFactory(mysqlConnectionPool){

    function getConnection(){
        return new Promise((resolve, reject)=>{
            mysqlConnectionPool.getConnection((err, connection)=>{
                if(err){
                    console.error('[ConnectionPoolError] Failed to get connection from pool:\n', err);
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }

    ProjectsRouter.get('/',(req,res,next)=>{
        //Return a list of projects on the database:
        getConnection().then((connection) => {
                return getListOfProjects(connection).then((result)=>{
                    connection.release();
                    res.send(result);
                }).catch((err)=>{
                    connection.release();
                    return Promise.reject(err);
                });
        })
        .catch((err)=>{
            console.error('[Error] Error when retrieving list of projects', err);
            res.status(500).send();
        });
    });

    ProjectsRouter.get('/:projectName', (req, res)=>{
        console.log('Saw project request with params:', req.params);
        getConnection().then((connection)=>{
            return getFullProjectInfoByName(connection, req.params.projectName).then((result)=>{
                res.send(result);
            }).catch((err)=>{
                connection.release();
                return Promise.reject(err);
            });
        })
        .catch((err)=>{
            console.error(`[Error] Error when retrieving project ${req.params.projectName}`, err);
            res.status(500).send();
        });
    });

    ProjectsRouter.get('/:projectName/:episodeNumber',(req,res,next)=>{
        //TODO: retrieve and send episode information
        console.log('[ProjectsRouter] saw request to', req.url, ' with params', req.params);
        res.status(501).send('Sorry, I haven\'t got around to this yet');
    })

    ProjectsRouter.patch('/:projectName/:episodeNumber/:taskName',(req, res)=>{
        getConnection().then((connection)=>{

            return getEpisodeByNumberForProject(connection, req.params.projectName).then((result)=>{
                res.send(result);
            }).catch((err)=>{
                connection.release();
                return Promise.reject(err);
            });
        })
        .catch((err)=>{
            console.error(`[Error] Error when patching on ${req.url}\n`, err);
            res.status(500).send();
        });
        res.status(501).send('Sorry, I haven\'t got around to this yet');
    });

    return ProjectsRouter;
}

module.exports = ProjectsRouterFactory;
