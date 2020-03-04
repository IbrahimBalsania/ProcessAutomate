const winston = require("winston");
let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let dt = date+'-'+month+'-'+year
var logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: './log/Backup_'+dt+'.log' })
  ]
});
module.exports = logger;