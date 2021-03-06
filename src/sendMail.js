var nodemailer = require('nodemailer');

var mailInit = function(config){
	var config = config;
	this.transporter = nodemailer.createTransport({
	  service: 'gmail',
	  auth: {
		user: config.mailConfig.from,
		pass: config.mailConfig.pass
	  }
	});
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let dt = date+'-'+month+'-'+year

	this.mailOptions = {
	  from: config.mailConfig.from,
	  to: config.mailConfig.to,
	  subject: 'System Backup Summary : '+dt,
	  text: 'Hi, \nPlease find attached summary of backup taken on '+dt+'. \nNOTE : This mail is autogenerated please do not reply.',
	  attachments: [
				{
					path: './log/Backup_'+dt+'.log'
				}
			]
	};
	return {transporter,mailOptions};
}

// transporter.sendMail(mailOptions, function(error, info){
  // if (error) {
    // return console.log(error);
  // } else {
    // return console.log('Email sent: ' + info.response);
  // }
// });

module.exports = mailInit;