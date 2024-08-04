const http = require('http');
const ngrok = require('@ngrok/ngrok');
const fs = require('fs').promises;

fs.readFile('env.json', 'utf8')
    .then(data => {
        try {
            const ENVjsonObject = JSON.parse(data);
            console.log('JSON content:', ENVjsonObject);

            const send = require('gmail-send')({
                user: ENVjsonObject.gmailAccountSender,
                pass: ENVjsonObject.gmailAccountPassword,
                to: ENVjsonObject.gmailAccountTo,
                subject: '[MSAVT] Notification',
            });

            fs.readFile('index.html', 'utf8')
                .then(indexHtmlData => {

                    ngrok.connect({ addr: 8889, authtoken: ENVjsonObject.ngrokAuthtoken })
                        .then(listener => {

                            http.createServer((req, res) => {
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.end(
                                    indexHtmlData.replace("${listener.url()}",listener.url())
                                );
                            }).listen(15418, () => console.log('Node.js web server at 15418 is running...'));

                            //console.log(`Ingress established at: ${listener.url()}`);

                            ngrok.connect({ addr: 15418, authtoken: ENVjsonObject.ngrokAuthtoken })
                                .then(listener => {
                                    send({
                                        text: `Ingress established at: ${listener.url()}`,
                                    }, (error, result, fullResult) => {
                                        if (error) console.error(error);
                                        console.log(result);
                                    })
                                });
                        });

                })
                .catch(err9 => {
                    console.error('[HTML code part] Error reading the file:', err9);
                });

        } catch (parseErr) {
            console.error('[env code part] Error parsing JSON:', parseErr);
        }
    })
    .catch(err => {
        console.error('[env code part] Error reading the file:', err);
    });



