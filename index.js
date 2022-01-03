const express = require('express');
var cors = require('cors');
const app = express();
const datacards = require('./prefs.json')
const dataprofile = require('./dataprofile.json')
const datashells = require('./datashells.json')
const datausers = require('./users.json')
const namesunits = require('./entities_names.json')
const vpnsunits = require('./entities_vpns.json')


//authorise toutes les origines de requettes
app.use(cors())

// Middleware (permet lecture body pour requête: post/put/patch)
app.use(express.json())

//Get infos des prefs tuiles (Home)
app.get('/prefs', (req,res) => {
    res.status(200).json(datacards)
})

//get info profil (EditProfile)
app.get('/dataprofile', (req,res) => {
    
    res.status(200).json(dataprofile);  
})

//get info sur shell possible pour profil (EditProfile)
app.get('/datashells', (req,res) => {
    res.status(200).json(datashells)
})

// patch lang dans prefs 
app.patch('/prefs/lang', (req,res) =>{

    let newLang = req.body.lang    

    datacards.lang = newLang

    res.status(200).json()
})

// patch activated dans prefs (bouton ON/OFF)
app.patch('/prefs/activation', (req,res) =>{

    let indexServ = req.body.indexServ    

    datacards.activated[indexServ] = !datacards.activated[indexServ]

    res.status(200).json()
})

// patch pref dans prefs (boutons étoiles)
app.patch('/prefs/pref', (req,res) =>{

    let indexServ = req.body.indexServ
    
    datacards.prefs[indexServ] = !datacards.prefs[indexServ]
    
    res.status(200).json()
})

// suprime adresse mail dans otherEmails
app.patch('/dataprofile/othermail', (req,res) =>{

    let mails = dataprofile.otherEmails
    let delMail = req.body.deleteEmail

    let indexDelMail = mails.indexOf(delMail)
    mails.splice(indexDelMail,1)

    res.status(200).json(mails)
})

// patch contactEmail dans profile 
app.patch('/dataprofile/contactemail', (req,res) =>{
    
    dataprofile.contactEmail = req.body.contactEmail

    res.status(200).json()
})

// patch shell dans profile 
app.patch('/dataprofile/shell', (req,res) =>{
    
    dataprofile.shell = req.body.shell

    res.status(200).json()
})



// MANAGE ACCOUNTS


//get noms des unités (manage accounts)
app.get('/api/entities', (req,res) => {
    res.status(200).json(namesunits)
})

// get infos entity (manage accounts)
app.get('/api/users', (req,res) => {
    const unit = req.query.entity;
    const dataunit = [];
    datausers.data.forEach(function(datauser){
        datauser.affectations.forEach(e =>{
            if (e == unit) {
                dataunit.push(datauser)
            }
        } )
    });
    res.status(200).json(dataunit);
})

// get infos user (manage accounts)
app.get('/api/users/:login', (req,res) => {
    const login = req.params.login
    const datauser = datausers.data.find(datauser => datauser.login === login)
    res.status(200).json(datauser);
})

// get recherche users (new person)
app.get('/api/search', (req,res) => {
    const search = req.query.filter;
    let answer = {"data":[]};
    datausers.data.forEach(function(userdata){
        for (const property in userdata){
            if( typeof userdata[property] === 'string' || userdata[property] instanceof String){
                let val = userdata[property].toLowerCase();
                if(val.indexOf(search) !== -1){
                    answer.data.push(userdata)
                    break;
                };
            }
        }
    });
    res.status(200).json(answer);
})

// post nouvelle personnes dans entities 
app.post('/api/secondary/:unit', (req,res) =>{

    const unity = parseInt(req.params.unit);
    const login = req.body.login
    const datauser = datausers.data.find(datauser => datauser.login === login)

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = dd + '/' + mm + '/' + yyyy;

    datauser.affectations.push(unity);

    const datasecondary = {};
    datasecondary.beginsAt = today;
    datasecondary.endsAt = "";
    datasecondary.comment = "";
    datasecondary.id = unity;
    datauser.secondaryAffectations.push(datasecondary)

    res.status(200).json(datauser)
})

// delete d'un user dans entites.json
app.patch('/api/deleteuser', (req,res) => {
    const unit = parseInt(req.query.entity);
    const login = req.body.login;

    datausers.data.find(datauser => datauser.login === login).affectations.splice(datausers.data.find(datauser2 => datauser2.login === login).affectations.indexOf(unit), 1);

    if (datausers.data.find(datauser => datauser.login === login).primaryAffectation.id === unit) {
        datausers.data.find(datauser => datauser.login === login).affectations.push(111);
        datausers.data.find(datauser => datauser.login === login).primaryAffectation.id = 111;
        datausers.data.find(datauser => datauser.login === login).primaryAffectation.beginsAt = "today";
        datausers.data.find(datauser => datauser.login === login).primaryAffectation.endsAt = "never";
        datausers.data.find(datauser => datauser.login === login).primaryAffectation.comment = "la terre est bleu comme une orange";
    }else if(datausers.data.find(datauser => datauser.login === login).primaryAffectation.id !== unit){
        datausers.data.find(datauser => datauser.login === login).secondaryAffectations.splice(datausers.data.find(datauser => datauser.login === login).secondaryAffectations.find(datasecunits => datasecunits.id === unit), 1);
    }

    res.status(200).json(datausers);
})

// patch chgement statut invité -> membre
app.patch('/api/users/:unit/primary', (req,res) =>{

    const unity = parseInt(req.params.unit);
    const login = req.body.login
    const dataprimary = datausers.data.find(datauser => datauser.login === login).primaryAffectation;
    
    // je passe la première affactation ds les secondes affect et je passe l'affectation secondaire séléctinné en première.
    const idsecondary = datausers.data.find(datauser2 => datauser2.login === login).secondaryAffectations.find(dataunit1 => dataunit1.id === unity).id;
    datausers.data.find(datauser => datauser.login === login).secondaryAffectations.push(dataprimary);
    datausers.data.find(datauser => datauser.login === login).primaryAffectation.to = idsecondary;

    res.status(200).json()
})

// patch chgement statut  membre -> invité
app.patch('/api/users/:unit/secondary', (req,res) =>{

    const unity = parseInt(req.params.unit);
    const login = req.body.login
    const dataprimary = datausers.data.find(datause => datause.login === login).primaryAffectation;
    
    // je passe la première affactation ds les secondes affect et je passe l'unité 111 en première.
    datausers.data.find(datauser8 => datauser8.login === login).secondaryAffectations.push(dataprimary);
    datausers.data.find(datauser => datauser.login === login).affectations.push(111);
    datausers.data.find(datauser => datauser.login === login).primaryAffectation.id = 111;
    datausers.data.find(datauser => datauser.login === login).primaryAffectation.beginsAt = "today";
    datausers.data.find(datauser => datauser.login === login).primaryAffectation.endsAt = "never";
    datausers.data.find(datauser => datauser.login === login).primaryAffectation.comment = "la terre est bleu comme une orange";
    
    res.status(200).json()
})


// post pour envoie mail password perdu
app.post('/api/users/resetpassword', (req,res) => {
    res.status(200).json("mail envoyé")
})

// patch chgement des infos des user
app.patch('/api/chgeinfos/:login', (req,res) => {
    const IDuser = req.params.login;
    
    if (req.body.params.familyName) {

        datausers.data.find(datauser => datauser.login === IDuser).familyName = req.body.params.familyName;
    }

    if (req.body.params.givenName) {
        datausers.data.find(datauser => datauser.login === IDuser).givenName = req.body.params.givenName;
    }

    if (req.body.params.login) {
        datausers.data.find(datauser => datauser.login === IDuser).login = req.body.params.login;
    }

    if (req.body.params.contactEmail) {
        datausers.data.find(datauser => datauser.login === IDuser).contactEmail = req.body.params.contactEmail;
    }

    if (req.body.params.unit) {
        const unity = parseInt(req.body.params.unit);
        if (req.body.params.beginsAt) {
            datausers.data.find(datauser => datauser.login === IDuser).secondaryAffectations.forEach(function(affect){
                if (affect.id === unity) {
                   affect.beginsAt = req.body.params.beginsAt; 
                } 
            });
        }
        if (req.body.params.endsAt) {
            datausers.data.find(datauser => datauser.login === IDuser).secondaryAffectations.forEach(function(affect){
                if (affect.id === unity) {
                   affect.endsAt = req.body.params.endsAt; 
                } 
            });
        }
        if (req.body.params.comment) {
            datausers.data.find(datauser => datauser.login === IDuser).secondaryAffectations.forEach(function(affect){
                if (affect.id === unity) {
                   affect.comment = req.body.params.comment; 
                } 
            });
        }
    }else{
        if (req.body.params.beginsAt) {
            datausers.data.find(datauser => datauser.login === IDuser).primaryAffectation.beginsAt = req.body.params.beginsAt;
        }
        if (req.body.params.endsAt) {
            datausers.data.find(datauser => datauser.login === IDuser).primaryAffectation.endsAt = req.body.params.endsAt;
        }
        if (req.body.params.comment) {
            datausers.data.find(datauser => datauser.login === IDuser).primaryAffectation.comment = req.body.params.comment;
        }
    }

    res.status(200).json("compte modifié")
})

// post pour déplacer membre
app.post('/api/moveuser', (req,res) =>{
    const unity = parseInt(req.body.unit);
    const login = req.body.login
    const dataprimary = datausers.data.find(datauser => datauser.login === login).primaryAffectation;

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    today = dd + '/' + mm + '/' + yyyy;
    
    // j'efface le "to" de la primary affectation, je passe la première affactation ds les secondes affect et je créé une nouvelle primary affectation avec la date d'aujourd'hui.
    if (dataprimary.to != undefined) {
        delete dataprimary.to;
    }
    datausers.data.find(datauser => datauser.login === login).secondaryAffectations.push(dataprimary);
    const newprimary = {};
    newprimary.beginsAt = today;
    newprimary.endsAt = "";
    newprimary.comment = "";
    newprimary.id = unity;
    datausers.data.find(datauser => datauser.login === login).primaryAffectation = newprimary;
    datausers.data.find(datauser => datauser.login === login).affectations.push(unity);

    res.status(200).json()
})

// patch pour valider demande déplacement
app.patch('/api/validatependinguser', (req,res) => {
    const login = req.body.login;
    const unit = datausers.data.find(datauser => datauser.login === login).primaryAffectation.to;
    let primary = datausers.data.find(datauser => datauser.login === login).primaryAffectation;
    let secondary = datausers.data.find(datauser => datauser.login === login).secondaryAffectations.find(dataaffect => dataaffect.id === unit);

    delete primary.to;

    datausers.data.find(datauser => datauser.login === login).secondaryAffectations.push(primary);
    datausers.data.find(datauser => datauser.login === login).primaryAffectation = secondary;

    delete datausers.data.find(datauser => datauser.login === login).secondaryAffectations.find(dataaffect => dataaffect.id === unit);

    res.status(200).json("demande validé")
})

// patch pour révoquer demande déplacement
app.patch('/api/revokependinguser', (req,res) => {
    const login = req.body.login;

    delete datausers.data.find(datauser => datauser.login === login).primaryAffectation.to;

    res.status(200).json("demande révoqué")
})


// post validation token
app.post('/api/validtoken', (req,res) =>{
    res.status(200).json(dataprofile)
})

// put nouveau password
app.put('/api/validpassword', (req,res) =>{
    res.status(200).json("password changé")
})







// VPN d'unité et de compte


// get vpns unité
app.get('/api/entities/vpn/:unit', (req,res) =>{
    const unit = parseInt(req.params.unit);

    res.status(200).json(vpnsunits[unit]);
})

// patch vpns unité
app.patch('/api/entities/vpn/:unit', (req,res) =>{
    const unit = parseInt(req.params.unit);
    const vpns = req.body.vpns;

    vpnsunits[unit] = [];
    vpnsunits[unit] = vpns;

    res.status(200).json("vpns mis à jours");
})

// patch vpns user
app.patch('/api/users/vpn/:user', (req,res) =>{
    const login = req.params.user;
    const vpns = req.body.vpns;

    datausers.data.find(datauser => datauser.login === login).vpn = [];
    datausers.data.find(datauser => datauser.login === login).vpn = vpns;
    

    res.status(200).json("vpns mis à jours");
})





// "nodemon" pour lancer serveur
app.listen(3000, () => {
    console.log('Serveur à l\'écoute')
  });