var destroy = function(){
    try
    {
        this.destroyOne = function(){
			return console.log("destroyOne")
		};
		this.destroyTwo = function(){
			return console.log("destroyTwo")
		};
    }
    catch(e)
    {
        console.log(e);
    }
}
module.exports = destroy;