
/*-----------------------------------------------------------------------------------------------------------------
//*  MesaAyuda.js debe copiarse al directorio del proyecto express como index.js
//*
//*  REST API 
//*  UADER - FCyT - Ingenieria de Software I 
//*  Caso de estudio MesaAyuda
//*
//*  Dr. Pedro E. Colla 2023,2025
 *----------------------------------------------------------------------------------------------------------------*/
//AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1

import express from 'express';
import crypto from 'crypto';
console.log("Comenzando servidor");

// const crypto = require('crypto');
console.log("crypto Ok!");

//const express = require('express');
//console.log("express Ok!");

const app = express();
console.log("express ready!");

const PORT = 8080;

import cors from 'cors';

//const cors = require('cors');
console.log("cors ok!");

app.use(cors());
console.log("CORS ready!");

import AWS from 'aws-sdk'
//var AWS = require('aws-sdk');
console.log("aws-sdk ready!");

/*----
Acquire critical security resources from an external file out of the path
*/

//const accessKeyId = require('../accessKeyId.js');
//const secretAccessKey = require('../secretAccessKey.js');

import accessKeyId from '../accessKeyId.js';
import secretAccessKey  from '../secretAccessKey.js';

let awsConfig = {
    "region"         : "us-east-1",
    "endpoint"       : "http://dynamodb.us-east-1.amazonaws.com",
    "accessKeyId"    : accessKeyId, 
    "secretAccessKey": secretAccessKey
};

AWS.config.update(awsConfig);
console.log("Servidor listo!");
let docClient = new AWS.DynamoDB.DocumentClient();

/*----
   Application server in LISTEN mode
*/

app.listen(
    PORT,
    () => console.log(`Servidor listo en http://localhost:${PORT}`)
);

app.use(express.json());

/*-------------------------------------------------------------------------------------------
                            Funciones y Servicios
 *-------------------------------------------------------------------------------------------*/

/*-----------
función para hacer el parse de un archivo JSON
*/
function jsonParser(keyValue,stringValue) {
    var string = JSON.stringify(stringValue);
    var objectValue = JSON.parse(string);
    return objectValue[keyValue];
}

/*-------------------------------------------------------------------------------------------
                            SERVER API 
 *-------------------------------------------------------------------------------------------*/
/*==*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
 *                       API REST Cliente                                                   *
 *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*==*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

app.get('/api/cliente', (req,res) => {
    res.status(200).send({response : "OK", message : "API Ready"});
    console.log("API cliente: OK");
});



/*---
   ---->>>> ESTO QUE SIGUE DEBAJO ES EL CODIGO ORIGINAL, QUE FUE COMENTADO POR LAS DUDAS PERO EN UN FUTURO HABRIA QUE BORRARLO <<<<----
  /api/loginCliente
  Esta API permite acceder a un cliente por ID y comparar la password pasada en un JSON en el cuerpo con la indicada en el DB
*/  
// app.post('/api/loginCliente', (req,res) => {

//     const { id } = req.body;
//     const {password} = req.body;

//     console.log("loginCliente: id("+id+") password ("+password+")");

//     if (!password) {
//         res.status(400).send({response : "ERROR" , message : "Password no informada"});
//         return;
//     }    
//     if (!id) {
//         res.status(400).send({response : "ERROR" , message : "id no informado"});
//         return;
//     }    

//     let getClienteByKey = function () {
//         var params = {
//             TableName: "cliente",
//             Key: {
//                 "id" : id
//             }
//         };
//         docClient.get(params, function (err, data) {
//             if (err) {
//                 res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
//             }
//             else {
//                 if (Object.keys(data).length == 0) {
//                     res.status(400).send({response : "ERROR" , message : "Cliente invalido"});
//                 } else {
//                     const paswd=jsonParser('password',data.Item);
//                     const activo=jsonParser('activo',data.Item);
//                     const id=jsonParser('id',data.Item);
//                     const contacto=jsonParser('contacto',data.Item);
//                     if (password == paswd) {
//                         if (activo == true) {
//                             const nombre=jsonParser('nombre',data.Item);
//                             const fecha_ultimo_ingreso=jsonParser('fecha_ultimo_ingreso',data.Item);
//                             res.status(200).send(JSON.stringify({response : "OK", "id" : id, "nombre" : nombre, "contacto" : contacto, "fecha_ultimo_ingreso": fecha_ultimo_ingreso}));    
//                         } else {
//                             res.status(400).send(JSON.stringify({response : "ERROR", message : "Cliente no activo"}));    
//                         }
//                     } else {
//                        res.status(400).send(JSON.stringify({response : "ERROR" , message : "usuario incorrecto"}));
//                     }    
//             }    
//             }
//         })
//     }
//     getClienteByKey();

// });

/*---
  /api/loginClienteEmail
  Permite loguear a un cliente usando su correo electrónico (campo "contacto")
  en vez de su ID, que es largo y difícil de recordar (TP Final Integrador).

  Diferencia clave con /api/loginCliente: ese endpoint usa docClient.get()
  porque conoce la clave primaria exacta (el id). Acá NO tenemos el id, solo
  el contacto (que no es la clave primaria de la tabla) - por eso hay que
  recorrer la tabla con un scan() y filtrar por el campo contacto, en vez
  de pedir un único registro por clave.
*/
app.post('/api/loginClienteEmail', (req,res) => {

    const { contacto } = req.body;
    const { password } = req.body;

    console.log("loginClienteEmail: Intento de acceso de contacto("+contacto+")");

    if (!password) {
        res.status(400).send({response : "ERROR" , message : "Password no informada"});
        return;
    }
    if (!contacto) {
        res.status(400).send({response : "ERROR" , message : "contacto (e-mail) no informado"});
        return;
    }

    var paramsScan = {
        TableName: "cliente",
        FilterExpression: 'contacto = :contacto',
        ExpressionAttributeValues: { ':contacto': contacto }
    };

    docClient.scan(paramsScan, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
            return;
        }
        if (!data.Items || data.Items.length == 0) {
            res.status(400).send({response : "ERROR" , message : "Cliente invalido"});
            return;
        }

        // console.log("Cantidad encontrada para " + contacto + ": " + data.Items.length);
        // console.log(JSON.stringify(data.Items, null, 2));

        const cliente = data.Items[0];
        const paswd = jsonParser('password', cliente);
        const activo = jsonParser('activo', cliente);
        const id = jsonParser('id', cliente);
        const nombre = jsonParser('nombre', cliente);
        const fecha_ultimo_ingreso = jsonParser('fecha_ultimo_ingreso', cliente);

        if (password != paswd) {
            res.status(400).send(JSON.stringify({response : "INVALIDO" , message : "usuario incorrecto"}));
            return;
        }
        if (activo != true) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "Cliente no activo"}));
            return;
        }
        res.status(200).send(JSON.stringify({response : "OK", "id" : id, "nombre" : nombre, "contacto" : contacto, "fecha_ultimo_ingreso": fecha_ultimo_ingreso}));
    });
});


// /*-----------
//   /api/getCliente
//   Esta API permite acceder a un cliente dado su id
// */

app.post('/api/getCliente/:id', (req,res) => {
    const { id } = req.params;
    console.log("getCliente: id("+id+")");
    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
        } else {

            if (Object.keys(data).length != 0) {
               res.status(200).send(JSON.stringify({"response":"OK","cliente" : data.Item}),null,2);
            } else {
               res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
            }
        }    
    })


} );


/*---------
Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB)
*/
async function scanDb(contacto) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=contacto;
    const paramsScan = { // ScanInput
      TableName: "cliente", // required
      Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
      FilterExpression : 'contacto = :contacto OR id = :contacto', // TPF punto 3: busca el correo en contacto (clientes originales) o en id (altas anteriores)
      ExpressionAttributeValues : {':contacto' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
          return data.Items 
    });  
    return objectPromise;
}

/*----
addCliente
Revisa si el contacto (e-mail) existe y en caso que no da de alta el cliente generando un id al azar
*/
app.post('/api/addCliente', (req,res) => {

    const {contacto} = req.body;
    const {password} = req.body;
    const {nombre}   = req.body;
    console.log("addCliente: Se ha registrado el contacto("+contacto+"), con nombre("+nombre+")");
    
    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informada"});
        return;
    }

    if (!nombre) {
        res.status(400).send({response : "ERROR", message : "Nombre no informado"});
        return;
    }

    if (!contacto){
        res.status(400).send({response : "ERROR" , message : "Contacto no informado"});
        return;
    } 

    scanDb(contacto)
    .then(resultDb => {
      if (Object.keys(resultDb).length != 0) {
        res.status(400).send({response : "ERROR" , message : "Cliente ya existe"});
        return;
      } else {
        var hoy = new Date();
        var dd = String(hoy.getDate()).padStart(2, '0');
        var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = hoy.getFullYear();
        hoy = dd + '/' + mm + '/' + yyyy;
    
        const newCliente = {
            id                    : crypto.randomUUID(),
            contacto              : contacto,   // TPF punto 3: guarda el correo también en contacto, que es donde lo busca el login por e-mail
            nombre                : nombre,
            password              : password,
            activo                : true,
            registrado            : true,
            primer_ingreso        : false,
            fecha_alta            : hoy,
            fecha_cambio_password : hoy,
            fecha_ultimo_ingreso  : hoy,
        };
    
        const paramsPut = { //Sirve para dar de alta un nuevo cliente en la tabla "cliente".
          TableName: "cliente",
          Item: newCliente,
          ConditionExpression:'attribute_not_exists(id)',
        };

        docClient.put(paramsPut, function (err, data) {
            if (err) {
                res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
            } else {
                res.status(200).send(JSON.stringify({response : "OK", "cliente": newCliente}));
            }
        });
    }
    });

});
/*----------
/api/updateCliente
Permite actualizar datos del cliente contacto, nombre, estado de activo y registrado
*/
app.post('/api/updateCliente', (req,res) => {
    
    const {id} = req.body;
    const {nombre}   = req.body; 
    const {password} = req.body;

    var activo = ((req.body.activo+'').toLowerCase() === 'true')
    var registrado = ((req.body.registrado+'').toLowerCase() === 'true')

    console.log("updateCliente: id("+id+") nombre("+nombre+") password("+password+") activo("+activo+") registrado("+registrado+")");

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!nombre) {
        res.status(400).send({response : "ERROR" , message: "Nombre no informado"});
        return;
    }

    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informado"});
        return;
    }

    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 
   
                    ExpressionAttributeNames: { 
                         "#a": "activo", 
                         "#n": "nombre",
                         "#p": "password",
                         "#r": "registrado"

                    }, 
                    ExpressionAttributeValues: { 
                        ":a": activo , 
                        ":p": password,
                        ":n": nombre , 
                        ":r": registrado 
                   }, 
                   Key: { 
                       "id": id 
                   }, 
                   ReturnValues: "ALL_NEW", 
                   TableName: "cliente", 
                   UpdateExpression: "SET #n = :n, #p = :p, #a = :a, #r = :r" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": data}));
                    }    
                });    
            }
        }    
    })


});
/*-------
/api/resetCliente
Permite cambiar la password de un cliente
*/
// Funcion de resetCliente original comentada
// app.post('/api/resetCliente', (req,res) => {
    
//     const {id}       = req.body;
//     const {password} = req.body;
 
//     if (!id) {
//         res.status(400).send({response : "ERROR" , message: "Id no informada"});
//         return;
//     }

//     if (!password) {
//         res.status(400).send({response : "ERROR" , message: "Password no informada"});
//         return;
//     }

//     var params = {
//         TableName: "cliente",
//         Key: {
//             "id" : id
//             //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
//              }
//         };
        
//     docClient.get(params, function (err, data) {
//         if (err)  {
//             res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
//             return;
//         } else {

//             if (Object.keys(data).length == 0) {
//                 res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
//                 return;
//             } else {

//                 const paramsUpdate = { 
   
//                     ExpressionAttributeNames: { 
//                          "#p": "password" 
//                     }, 
//                     ExpressionAttributeValues: { 
//                         ":p": password 
//                    }, 
//                    Key: { 
//                        "id": id 
//                    }, 
//                    ReturnValues: "ALL_NEW", 
//                    TableName: "cliente", 
//                    UpdateExpression: "SET #p = :p" 
//                 };
//                 docClient.update(paramsUpdate, function (err, data) {
//                     if (err)  {
//                         res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
//                         return;
//                     } else {
//                         res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": data}));
//                     }    
//                 });    
//             }
//         }    
//     })
// });

app.post('/api/resetCliente', (req,res) => {

    const {contacto} = req.body;
    const {password} = req.body;

    if (!contacto) {
        res.status(400).send({response : "ERROR" , message: "Contacto no informado"});
        return;
    }

    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informada"});
        return;
    }

    // TPF punto 5: busca al cliente por su correo (contacto), igual que loginClienteEmail
    var paramsScan = {
        TableName: "cliente",
        FilterExpression: 'contacto = :contacto',
        ExpressionAttributeValues: { ':contacto': contacto }
    };

    docClient.scan(paramsScan, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
            return;
        }

        if (!data.Items || data.Items.length == 0) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "Cliente no existe"}));
            return;
        }

        // --- VALIDACIÓN DE CONTRASEÑA REPETIDA ---
        const passwordActual = jsonParser('password', data.Items[0]); 

        if (password === passwordActual) {
            res.status(400).send(JSON.stringify({
                response: "ERROR", 
                message: "La nueva contraseña no puede ser igual a la que ya tenías"
            }));
            return;
        }

        // id interno del cliente encontrado: es la clave de la tabla para poder actualizarlo
        const id = jsonParser('id', data.Items[0]);

        // fecha de hoy (dd/mm/aaaa), el mismo formato que usa el alta
        var hoy = new Date();
        var dd = String(hoy.getDate()).padStart(2, '0');
        var mm = String(hoy.getMonth() + 1).padStart(2, '0');
        var yyyy = hoy.getFullYear();
        hoy = dd + '/' + mm + '/' + yyyy;

        const paramsUpdate = {

            ExpressionAttributeNames: {
                 "#p": "password",
                 "#f": "fecha_cambio_password"
            },
            ExpressionAttributeValues: {
                ":p": password,
                ":f": hoy
           },
           Key: {
               "id": id
           },
           ReturnValues: "ALL_NEW",
           TableName: "cliente",
           UpdateExpression: "SET #p = :p, #f = :f"
        };
        docClient.update(paramsUpdate, function (err, data) {
            if (err)  {
                res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                return;
            } else {
                res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": data}));
            }
        });
    });
});
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
/*                                                       API REST ticket                                                             *
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

/*---------
Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB)
*/
async function scanDbTicket(clienteID) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=clienteID;
    const paramsScan = { // ScanInput
      TableName: "ticket", // required
      Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
      FilterExpression : 'clienteID = :clienteID',
      ExpressionAttributeValues : {':clienteID' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
          return data.Items 
    });  
    return objectPromise;
}
/*----------
  listarTicket
  API REST para obtener todos los tickets de un clienteID
*/  
app.post('/api/listarTicket', (req,res) => {

    const {ID}  = req.body;
    console.log("listarTicket: ID("+ID+")");
 
    if (!ID) {
        res.status(400).send({response : "ERROR" , message: "ID cliente  no informada"});
        return;
    }

    scanDbTicket(ID)
    .then(resultDb => {
      if (Object.keys(resultDb).length == 0) {
        res.status(400).send({response : "ERROR" , message : "clienteID no tiene tickets"});
        return;
      } else {
        res.status(200).send(JSON.stringify({response : "OK",  "data": resultDb}));
    }

    });

});

/*---------
  getTicket
  API REST para obtener los detalles de un ticket
*/
app.post('/api/getTicket', (req,res) => {
    const {id}  = req.body;
    console.log("getTicket: id("+id+")");
 
    if (!id) {
        res.status(400).send({response : "ERROR" , message: "ticket id no informada"});
        return;
    }
    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //"clienteID": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            //"id"       : "e08905a8-4aab-45bf-9948-4ba2b8602ced"
        }
    };
    docClient.get(params, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
        }
        else {
            if (Object.keys(data).length == 0) {
                res.status(400).send({response : "ERROR" , message : "ticket invalido"});
            } else {
                res.status(200).send(JSON.stringify({response : "OK", "data" : data}));    
            }    
        }
    })
});

/*-----------------
/api/addTicket
API REST para agregar ticket (genera id)
*/
app.post('/api/addTicket', (req,res) => {

    const {clienteID} = req.body;
    const estado_solucion = 1;
    const {solucion} = req.body;
    const {descripcion} = req.body;

    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const newTicket = {
     id                    : crypto.randomUUID(),
     clienteID             : clienteID,
     estado_solucion       : estado_solucion,
     solucion              : solucion,
     descripcion           : descripcion,
     fecha_apertura        : hoy,
     ultimo_contacto       : hoy
    };

    const paramsPut = {
      TableName: "ticket",
      Item: newTicket,
      ConditionExpression:'attribute_not_exists(id)',
    };

    docClient.put(paramsPut, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
        } else {
            res.status(200).send(JSON.stringify({response : "OK", "ticket": newTicket}));
        }
    });
}
)

/*--------
/api/updateTicket
Dado un id actualiza el ticket, debe informarse la totalidad del ticket excepto ultimo_contacto
*/
app.post('/api/updateTicket', (req,res) => {

    const {id} = req.body;
    const {clienteID} = req.body;
    const {estado_solucion} = req.body;
    const {solucion} = req.body;
    const {descripcion} = req.body;
    const {fecha_apertura} = req.body;

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!clienteID) {
        res.status(400).send({response : "ERROR" , message: "clienteID no informada"});
        return;
    }

    if (!estado_solucion) {
        res.status(400).send({response : "ERROR" , message: "estado_solucion no informada"});
        return;
    }

    if (!solucion) {
        res.status(400).send({response : "ERROR" , message: "solucion no informado"});
        return;
    }

    if (!fecha_apertura) {
        res.status(400).send({response : "ERROR" , message: "fecha apertura"});
        return;
    }
    
    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const ultimo_contacto = hoy;

    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "ticket no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 
   
                    ExpressionAttributeNames: { 
                         "#c": "clienteID", 
                         "#e": "estado_solucion",
                         "#s": "solucion",
                         "#a": "fecha_apertura",
                         "#u": "ultimo_contacto",
                         "#d": "descripcion"
                    }, 
                    ExpressionAttributeValues: { 
                        ":c":  clienteID, 
                        ":e":  estado_solucion , 
                        ":s":  solucion , 
                        ":a":  fecha_apertura,
                        ":u":  ultimo_contacto,
                        ":d":  descripcion 
                   }, 
                   Key: { 
                       "id": id 
                   }, 
                   ReturnValues: "ALL_NEW", 
                   TableName: "ticket", 
                   UpdateExpression: "SET #c = :c, #e = :e, #a = :a, #s = :s, #d = :d, #u = :u" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK",  "data": data}));
                    }    
                });    
            }
        }    
    })

});

/*=========================================================================
 * PUNTO 6: Estadística de tickets (/resumenTickets)
 * Función REST API (sin GUI). Acepta GET y POST.
 *========================================================================*/

// Saca el usuario y la password del pedido:
//  - GET : van en la URL   -> /resumenTickets?ID=usuario&PASSWORD=clave
//          (también acepta el formato de la consigna: ?ID=usuario?PASSWORD=clave)
//  - POST: van en un JSON  -> {"ID":"usuario","PASSWORD":"clave"}
function obtenerCredencialesResumen(req) {
    let idUsuario = null;
    let password = null;

    if (req.method === 'POST') {
        const cuerpo = req.body || {};
        idUsuario = cuerpo.ID || cuerpo.id || cuerpo.contacto;
        password = cuerpo.PASSWORD || cuerpo.password;
    } else if (req.method === 'GET') {
        idUsuario = req.query.ID || req.query.id || req.query.contacto;
        password = req.query.PASSWORD || req.query.password;

        // Formato literal de la consigna: ?ID={usuario}?PASSWORD={password}
        if (idUsuario && !password) {
            if (idUsuario.includes('?PASSWORD=')) {
                const partes = idUsuario.split('?PASSWORD=');
                idUsuario = partes[0];
                password = partes[1];
            } else if (idUsuario.includes('?password=')) {
                const partes = idUsuario.split('?password=');
                idUsuario = partes[0];
                password = partes[1];
            }
        }
    }

    return {
        idUsuario: idUsuario ? String(idUsuario).trim() : null,
        password: password ? String(password).trim() : null
    };
}

const resumenTickets = (req, res) => {
    const { idUsuario, password } = obtenerCredencialesResumen(req);

    // 1. Tienen que venir el usuario y la password
    if (!idUsuario || !password) {
        return res.status(400).json({
            response: "ERROR",
            mensaje: "Faltan parámetros requeridos: ID y PASSWORD."
        });
    }

    // 2. Trae todos los clientes de la base
    const paramsCliente = {
        TableName: "cliente"
    };

    docClient.scan(paramsCliente, (errCliente, dataClientes) => {
        if (errCliente) {
            console.error("Error al escanear tabla cliente en resumenTickets:", errCliente);
            return res.status(500).json({
                response: "ERROR",
                mensaje: "Error interno al consultar la base de datos de clientes."
            });
        }

        const clientes = dataClientes.Items || [];

        // 3. Valida que el usuario exista (por ID o por correo), que la password coincida y que esté activo
        const usuarioAutenticado = clientes.find(
            (c) => (String(c.id) === idUsuario || String(c.ID) === idUsuario || c.contacto === idUsuario) &&
                   String(c.password) === password && c.activo == true   // TPF punto 6: igual que el login, un cliente inactivo no entra
        );

        if (!usuarioAutenticado) {
            return res.status(401).json({
                response: "invalido",
                mensaje: "Usuario o password inválidos."
            });
        }

        // 4. Trae todos los tickets de la base
        const paramsTicket = {
            TableName: "ticket"
        };

        docClient.scan(paramsTicket, (errTicket, dataTickets) => {
            if (errTicket) {
                console.error("Error al escanear tabla ticket en resumenTickets:", errTicket);
                return res.status(500).json({
                    response: "ERROR",
                    mensaje: "Error interno al consultar la base de datos de tickets."
                });
            }

            const tickets = dataTickets.Items || [];

            // 5. Arma el JSON anidado: para cada cliente, su id, su correo, la cantidad de tickets y el detalle de cada uno
            const resumenPorCliente = clientes.map((cliente) => {
                const idClienteActual = cliente.id || cliente.ID;
                const correoClienteActual = cliente.contacto;

                // TPF punto 6: el ticket guarda el id del cliente, se compara solo por id (así no se cuenta dos veces)
                const ticketsCliente = tickets.filter(
                    (t) => String(t.clienteID) === String(idClienteActual)
                );

                const detalleTickets = ticketsCliente.map((t) => ({
                    id_ticket: t.id || t.ID,
                    fecha_apertura: t.fecha_apertura || t.ultima_fecha || t.fecha || "Sin fecha registrada",
                    estado: t.estado !== undefined ? t.estado : t.estado_solucion
                }));

                return {
                    id_cliente: idClienteActual,
                    correo: correoClienteActual,
                    numero_tickets: detalleTickets.length,
                    tickets: detalleTickets
                };
            });

            // 6. Devuelve el JSON final
            return res.status(200).json({
                response: "OK",
                clientes: resumenPorCliente
            });
        });
    });
};

// GET y POST, con y sin el prefijo /api
app.get('/resumenTickets', resumenTickets);
app.post('/resumenTickets', resumenTickets);
app.get('/api/resumenTickets', resumenTickets);
app.post('/api/resumenTickets', resumenTickets);

/*=========================================================================
 * PUNTO 7: Acceso a Tickets (/getTicket)
 * Función REST API (sin GUI). Acepta GET y POST.
 *========================================================================*/

// Saca usuario, password y ticket del pedido:
//  - GET : van en la URL   -> /getTicket?ID=usuario&PASSWORD=clave&TICKET=idTicket
//          (también acepta el formato de la consigna: ?ID=usuario?PASSWORD=clave?TICKET=idTicket)
//  - POST: van en un JSON  -> {"ID":"usuario","PASSWORD":"clave","TICKET":"idTicket"}
function obtenerCredencialesTicket(req) {
    const origen = (req.method === 'POST') ? (req.body || {}) : (req.query || {});
    let idUsuario = origen.ID || origen.id || origen.contacto;
    let password  = origen.PASSWORD || origen.password;
    let ticketId  = origen.TICKET || origen.ticket;

    if (req.method === 'GET') {
        // Formato literal de la consigna: todo queda pegado dentro del primer valor
        if (idUsuario && !password) {
            const m = String(idUsuario).match(/^(.*?)\?PASSWORD=(.*?)(?:\?TICKET=(.*))?$/i);
            if (m) {
                idUsuario = m[1];
                password = m[2];
                ticketId = ticketId || m[3];
            }
        } else if (password && !ticketId) {
            const m = String(password).match(/^(.*?)\?TICKET=(.*)$/i);
            if (m) {
                password = m[1];
                ticketId = m[2];
            }
        }
    }

    return {
        idUsuario: idUsuario ? String(idUsuario).trim() : null,
        password: password ? String(password) : null,
        ticketId: ticketId ? String(ticketId).trim() : null
    };
}

const getTicketValidado = (req, res) => {
    const { idUsuario, password, ticketId } = obtenerCredencialesTicket(req);

    // 1. Tienen que venir el usuario, la password y el ticket
    if (!idUsuario || !password || !ticketId) {
        return res.status(400).json({
            response: "ERROR",
            message: "Faltan parámetros requeridos: ID, PASSWORD y TICKET."
        });
    }

    // 2. Primero se valida al cliente (existe, password correcta y activo).
    //    Si no es válido se devuelve error SIN consultar el ticket.
    const paramsCliente = {
        TableName: "cliente",
        FilterExpression: 'contacto = :u OR id = :u',
        ExpressionAttributeValues: { ':u': idUsuario }
    };

    docClient.scan(paramsCliente, (errCliente, dataClientes) => {
        if (errCliente) {
            console.error("Error al buscar el cliente en getTicket:", errCliente);
            return res.status(500).json({
                response: "ERROR",
                message: "Error interno al consultar la base de datos de clientes."
            });
        }

        const cliente = (dataClientes.Items || []).find(
            (c) => String(c.password) === password && c.activo == true
        );

        if (!cliente) {
            return res.status(401).json({
                response: "invalido",
                message: "Usuario o password inválidos."
            });
        }

        // 3. Recién ahora se consulta el ticket
        const paramsTicket = {
            TableName: "ticket",
            Key: { "id": ticketId }
        };

        docClient.get(paramsTicket, (errTicket, dataTicket) => {
            if (errTicket) {
                console.error("Error al buscar el ticket en getTicket:", errTicket);
                return res.status(500).json({
                    response: "ERROR",
                    message: "Error interno al consultar la base de datos de tickets."
                });
            }

            if (!dataTicket || !dataTicket.Item) {
                return res.status(400).json({
                    response: "ERROR",
                    message: "ticket invalido"
                });
            }

            // 4. Devuelve el id del cliente, su correo y todos los datos del ticket
            return res.status(200).json({
                response: "OK",
                id_cliente: cliente.id,
                correo: cliente.contacto,
                ticket: dataTicket.Item
            });
        });
    });
};

// GET y POST sobre /getTicket (el /api/getTicket original del profe queda como estaba)
app.get('/getTicket', getTicketValidado);
app.post('/getTicket', getTicketValidado);
/*-------------------------------------------------[ Fin del API REST ]-------------------------------------------------------------*/