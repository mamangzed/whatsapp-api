const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  MessageType, 
  MessageOptions, 
  Mimetype
} = require("@adiwajshing/baileys");
const logger = require("pino")({ level: "silent" });
const { Boom } = require("@hapi/boom");
require('dotenv').config()
const API_KEY = process.env.API_KEY;
const WEBHOOK = process.env.WEBHOOK;
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const chalk = require('chalk');
const moment = require('moment');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());



async function run() {
  const { state, saveCreds } = await useMultiFileAuthState("dasda");
  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger,
  });

  //   connection
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (
        new Boom(lastDisconnect.error).output?.statusCode ===
        DisconnectReason.loggedOut
      ) {
        client.logout();
        console.log("Logged out...");
      } else {
        run();
      }
    } else {
      console.log( "[ " +chalk.cyan(moment().format("YYYY-MM-DD HH:mm:ss")) + " ] " + chalk.green("BOT Running..."));
    }
  });

  client.ev.on("messages.upsert",async (msg) => {

    let pesan = msg?.messages[0]?.message?.extendedTextMessage?.text ?? msg?.messages[0]?.message?.conversation;
    let from = await msg.messages[0].key.remoteJid;
    
    let body = {
      from: from,
      message: pesan
    }
    let fromor = msg.messages[0].key.fromMe ? 'TO' : 'FROM';

    console.log("[ " +chalk.cyan(moment().format("YYYY-MM-DD HH:mm:ss")) + " ] " + chalk.yellow(`${fromor} : `) + chalk.bgGreen(from) + chalk.redBright(" MESSAGE: ") + chalk.bgMagenta(pesan))
    if(msg.messages[0].key.fromMe === false){
      fetch(WEBHOOK, {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(res => {
        if(res.status == 200){
          console.log("[ " +chalk.cyan(moment().format("YYYY-MM-DD HH:mm:ss")) + " ] " + chalk.green('Sukses kirim webhook'))
        }else{
          console.log("[ " +chalk.cyan(moment().format("YYYY-MM-DD HH:mm:ss")) + " ] " + chalk.redBright('Gagal kirim webhook'));
        }
      }) 
    }

  })
  //   save creds
  client.ev.on("creds.update", saveCreds);

    app.post('/message/:tipe', async (req, res) => {
      if(req.headers.apikey != API_KEY){
        res.status(401);
        res.json({
          status: false,
          message: 'Api key salah'
        })
      }else if(req.xhr){
        res.status(405);
        res.json({
          status: false,
          message: 'Permintaan ditolak'
        })
        
      }else{
        switch(req.params.tipe){
          case 'text':
            if(Array.isArray(req.body.text)){
              for(const data of req.body.text){
                try{
                  await client.sendMessage(`${data['phone']}@s.whatsapp.net`, { 
                    text: req.body.text 
                  })
                  res.json({
                    status: true,
                    detail:{
                      phone: data['phone'],
                      text: data['text'],
                    },
                    message: `Pesan Berhasil dikirimkan`
                  });
                }catch(e){
                    res.status(401);
                    res.json({
                      status: false,
                      message: "Gagal mengirimkan pesan"
                    })
                }

              }
            }else{
              try{
                await client.sendMessage(`${req.body.phone}@s.whatsapp.net`, { 
                  text: req.body.text 
                })
                res.json({
                  status: true,
                  detail:{
                    phone: req.body.phone,
                    text: req.body.text,
                  },
                  message: `Pesan Berhasil dikirimkan`
                });
              }catch(e){
                  res.status(401);
                  res.json({
                    status: false,
                    message: "Gagal mengirimkan pesan"
                  })
              }
            }
          break;
          case'button':
          try{
            await client.sendMessage(`${req.body.phone}@s.whatsapp.net`,req.body.button);
            res.json({
              status: true,
              detail:{
                phone: req.body.phone,
                text: req.body.button.text,
              },
              message: `Pesan Berhasil dikirimkan`
            });
          }catch(e){
            res.status(401);
            res.json({
              status: false,
              message: "Gagal mengirimkan pesan"
            })
          }
          break;
          case'template':
          try{
            await client.sendMessage(`${req.body.phone}@s.whatsapp.net`,req.body.template);
            res.json({
              status: true,
              detail:{
                phone: req.body.phone,
                text: req.body.template.text,
              },
              message: `Pesan Berhasil dikirimkan`
            });          
          }catch(e){
            res.status(401);
            res.json({
              status: false,
              message: "Gagal mengirimkan pesan"
            })
          }
          break;
          case'location':
          try{
            await client.sendMessage(`${req.body.phone}@s.whatsapp.net`,req.body.location);
            res.json({
              status: true,
              message: `Pesan Berhasil dikirimkan`
            });  
          }catch(e){
            res.status(401);
            res.json({
              status: false,
              detail:{
                phone: req.body.phone,
                text: req.body.location.text,
              },
              message: "Gagal mengirimkan pesan"
            })
          }
          break;
          // case'list':
          // const msg = {
          //     "text": req.body.text,
          //     "footer": req.body.footer,
          //     "title": req.body.title,
          //     "buttonText": req.body.buttonText,
          //   }
          //   Object.assign(msg, req.body.lists);
          //   await client.sendMessage(`${req.body.phone}@s.whatsapp.net`,msg);
          // // res.json({
          // //   status: true,
          // //   detail:{
          // //     phone: req.body.phone,
          // //     text: req.body.text,
          // //   },
          // //   message: `Pesan Berhasil dikirimkan`
          // // });  
          // res.json(msg);
          // break;
          default:
            res.status(404);
            res.json({
              status: false,
              message: 'Permintaan tidak valid'
            })
          break;
        }
      }
    })
    //get contact
    app.post('/contact', async  (req, res) => {
      if(req.headers.apikey != API_KEY){
        res.status(401);
        res.json({
          status: false,
          message: 'Api key salah'
        })
      }else if(req.xhr){
        res.status(405);
        res.json({
          status: false,
          message: 'Permintaan ditolak'
        })

      }else{
        const ctk = await client.contacts[`${req.body.phone}@s.whatsapp.net`]
        res.json({
          status: true,
          phone: req.body.phone,
          message: req.body.message,
          detail: ctk
        });
      }
    })

  }
  
  // running bot
  try {
    run();
    app.listen(3000)
  } catch (e) {
    console.log(e);
    run();
    app.listen(3000)
}
