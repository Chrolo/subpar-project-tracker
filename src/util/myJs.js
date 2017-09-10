//Adding stuff to the global prototypes is never a good idea, but fuck it


// I want a .forKeys on my objects
// Callback should be (value, key, object)=>{} this is analagous to Array.forEach
Object.prototype.forEach = function (callback){
        if(this == null){throw new TypeError('this is null or not defined');}
        Object.keys(this).forEach((key)=>{
            callback(this[key], key, this);
        });
};

//I want a version of Promise.all for objects!
Promise.props = (object)=>{
    //Get the keys
    const keys = Object.keys(object);

    return Promise.all(
        keys.map((key)=>{
            return object[key];
        })
    ).then((results)=>{
        //Map the array of results back into an object!
        let objectResult = {};
        keys.forEach((key, index)=>{
            objectResult[key] = results[index];
        });
        return objectResult;
    });
};
