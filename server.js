// HAY QUE CONFIGURAR EL VPS PARA QUE REDIRIJA EL TRÁFICO AL PUERTO 8080
// HAY QUE HACER COMMITS AL REPO EN BITBUCKET
// Crear servicio de Confirmación de emails
// Guardar password en cookie

var express = require('express'), app = express.createServer();
var gravatar = require('gravatar');
var mongoose = require('mongoose');
var mp = require('mixpanel');
var md5 = require('MD5');
var conect = 0;
var port = 8080;

var mixpanel = new mp.Client('KEY DE MIXPANEL');

//Ceating Mongoose Conections and definitions
mongoose.connect('mongodb://localhost/lost');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// Defining Check Mail Function

function checkMail(mail) {
  if (/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(mail)){
   return true;
  } else {
   return false;
  }
}

//---------------------------------------------------------------------------------------------------------------------

//MONGOOSE SCHEMAS

var RegisterSchema = new Schema({
	username: {type: String, lowercase: true},
	email: {type: String, lowercase: true},
	password: {type: String, lowercase: true},
	id: ObjectId
});

mongoose.model('Register', RegisterSchema);
var Register = mongoose.model('Register');


var CordSchema = new Schema({
	username: {type: String, lowercase: true},
	lat: {type: Number, lowercase: true},
	lon: {type: Number, lowercase: true}
});

mongoose.model('Cord', CordSchema);
var Cord = mongoose.model('Cord');


/*

Create Schema
Then Model
Each time you call you'll have to create a new Class();
And then class.something = data
To save use class.save(function(err){
	....
	if(err){throw err;}
});

 */

//---------------------------------------------------------------------------------------------------------------------

// App Settings

app.configure(function(){
	app.use(express.static(__dirname + '/static'));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
	app.set('view options', {
		layout: true
	});
});

app.configure('development', function (){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.set('views', __dirname+'/views');
app.set('views');

//---------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------
/*

	EEEEEE  XX    XX  PPPPPPP  RRRRRRR   EEEEEEE   SSSSSS   SSSSSS
	EE       XX  XX   PP   PPP RR    RR  EE       SS       SS
	EE        XXXX    PP   PP  RR    R   EE        SSSSSS   SSSSSS
	EEEE      XXXX    PPPPPP   RRRRRR    EEEEE         SS       SS
	EE       XX  XX   PP       RR   RR   EE           SS       SS
	EEEEEE  XX    XX  PP       RR    RR  EEEEEEE  SSSSS    SSSSS


 */



app.get('/', function (req, res){
	res.render('index.jade');
});

app.post('/add', function (req, res){
	Register.findOne({username: req.body.username}, function (err, doc){
		if(err){
			throw err;
		}
		if(doc.password == md5(req.body.password)){
			console.log("User: " + req.body.username + " is logged");
			Cord.findOne({username: req.body.username}, function (err, doc){
				if(doc.username){
					Cord.update({username: req.body.username}, {lat: req.body.lat, lon: req.body.lon}, function (err){
						if(err){
							throw err;
						}
						mixpanel.track('Replaced cords', {username: req.body.username, lat: req.body.lat, lon: req.body.lon});
					});
				} else{
					var cord = new Cord();
					cord.username = req.body.username;
					cord.lat = req.body.lat;
					cord.lon = req.body.lon;
					cord.save(function (err){
						if(err){
							throw err;
						}
					});

					mixpanel.track('New cords', {username: req.body.username, lat: req.body.lat, lon: req.body.lon});
				}
			});
		} else{
			res.send("not allowed");
		}
	});
});

app.get('/user', function (req, res){
	res.render('user.jade');
});
app.post('/user', function (req, res){
	var username = req.body.user;
	console.log('User request: ' + username);
	res.redirect('/map/' + username);
});

app.get('/map/:username', function (req, res){
	var username = req.params.username;
	console.log('Requesting '+ username);

	Register.findOne({username: username}, function (err, doc){
		if (err){
			throw err;
		}
		if(doc){

			Cord.findOne({username: req.params.username}, function (err, data){
				if(err){
					throw err;
				} else {
					if(data){
						var lat = data['lat'];
						var lon = data['lon'];
						var url = gravatar.url(doc['email'], {s: '200', r: 'pg', d: '404'});
						res.render('map.jade', {name: username, url: url, lat: data['lat'], lon: data['lon']});
					}
					else{
						res.send('User have not sent any data.');
					}
				}
			});
		}
		else {
			res.send('Error!');
		}
	});
});

// mongod run --config /usr/local/etc/mongod.conf

app.get('/cords', function (req, res){
	var cord = new Cord();
	cord.username = "alexdev_";
	cord.lat = 40.40811873443511;
	cord.lon = -3.8852012157440186;
	cord.save(function (err){
		if(err){					
			throw err;
		}
	});

	res.send("Sent");
});


app.get('/register', function (req, res){
	res.render('register.jade');
});

app.post('/register', function (req, res){

	console.log('Registering: ' + req.body.username);

	Register.findOne({username: req.body.username}, function (err, doc){
		if(doc){
			res.send('Username not avaliable');
		} else {

			var register = new Register();
			register.username = req.body.username;
			register.password = md5(req.body.password);
			register.email = req.body.email;
			var mail = checkMail(req.body.email);
			if(mail === true){
				register.save(function (err){
					if(err){
						throw err;
					}
					mixpanel.track('Registered user', {username: req.body.username, email: req.body.email, hash: md5(req.body.password)});
				});
				
				res.send('Registered');
			} else{
				res.send('Invalid Email');
			}
		}
	});
});

app.listen(port, function (){
	console.log('Up and Running on port:' + port);
	mixpanel.track('Server Up and Running', {port: port});
});

//---------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------
