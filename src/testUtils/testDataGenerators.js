//Helper functions
function getRandomPositiveInt(max) {
  max = max ? Math.floor(max): Number.MAX_SAFE_INTEGER;
  return Math.floor(Math.random() * (max)); //The maximum is exclusive and the minimum is inclusive
}

function getRandomDateStringOrNull(){
    const rand = Math.random();
    if(rand > 0.90){
        return null;
    } else {
        const date = new Date(1000*60*60*24*365*30 + getRandomPositiveInt(1000*60*60*24*365*30)); //date range from 2000-01-01 -> 2030-01-01
        console.log(date);
        return date.toISOString();
    }
}

function getRandomArrayOf(itemGenerator,size){
    if(!size){
        size = getRandomPositiveInt(10);    //magic number
    }
    let array = [];
    for(var i = 0; i<size; i++){
        if(typeof itemGenerator === 'function'){
            array.push(itemGenerator());
        } else {
            array.push(itemGenerator);
        }
    }
    return array;
}

const NOUN_LIST= [ 'anime', 'faggot', 'Chrolo',  'Nichijou', 'weeb', 'DameDesuYo'];
const ACTION_LIST= ['eat', 'sleep', 'rave', 'repeat', 'fight', 'headpat'];
function getRandomString(wordCount=1, type='all'){
    //I could make really random strings, but I've found this kind of generator
    //to be more fun
    let thisWordList = NOUN_LIST;
    if(type === 'action'){
        thisWordList = ACTION_LIST;
    } else if( type === 'all'){
        thisWordList = thisWordList.concat(ACTION_LIST);
    }


    let strArray = [];
    for(var i = 0; i<wordCount; i++){
        //get random word from in array:
        strArray.push(thisWordList[getRandomPositiveInt(thisWordList.length)]);
    }
    return strArray.join(' ');
}

//Data sets:

const task = {
    min: ()=>{
        return {
            "taskName": getRandomString(1,'action'),
            "staffName": getRandomString(1,'noun'),
        };
    },

    max: ()=>{
        return Object.assign(task.min(),{
            "id": getRandomPositiveInt(),
            "lastUpdated": getRandomDateStringOrNull(),
            "completed": getRandomDateStringOrNull(),
            "episodeId": getRandomPositiveInt(),
            "dependsOn": getRandomArrayOf(getRandomPositiveInt)
        });
    }
};

const episode = {
    min: ()=>{
        return {
            "episodeNumber": getRandomPositiveInt(),
        };
    },

    max: ()=>{
        const episodeNumber = getRandomPositiveInt(65);
        return Object.assign(task.min(),{
            "id": getRandomPositiveInt(),
            "projectId": getRandomPositiveInt(),
            "episodeName": `${getRandomString(4)} (ep${episodeNumber})` ,
            "episodeNumber": episodeNumber,
            "completed": getRandomDateStringOrNull(),
            "tasks": getRandomArrayOf(task.min),
            "files": [/*TODO Implement episodeFile Generator*/]
        });
    }
};

module.exports= {
    task,episode
};
