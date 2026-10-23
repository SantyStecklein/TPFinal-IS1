/*-----------------------------------------------------------------------------------------------------------------
//*  registroCliente.js
//*
//*  Script de la pantalla de registración de un cliente nuevo (registroCliente.html)
//*  UADER - FCyT - Ingenieria de Software I - Trabajo Práctico Final Integrador
//*
//*  Misma estructura que loginClient.js: intercepta el submit del formulario, valida los datos
//*  en el navegador, se los manda al servidor (API REST) y actúa según la respuesta.
 *----------------------------------------------------------------------------------------------------------------*/

const formE1 = document.getElementById('registroForm');
const mensaje = document.getElementById('resultadoRegistro');

/*---
    Intercepta el submit del formulario.
    El navegador ya valida antes los campos obligatorios y el formato del correo (required y type="email"),
    así que este script solo se ejecuta si eso está bien.
    */

formE1.addEventListener('submit', (event) => {
	event.preventDefault();
	const data = Object.fromEntries(new FormData(formE1));

	// Limpia el mensaje de un intento anterior
	mensaje.textContent = '';

	/*---
        Validaciones propias, antes de molestar al servidor
        */

	// Correo, nombre y password son obligatorios (el nombre no puede ser solo espacios)
	if (data.contacto == '' || data.nombre.trim() == '' || data.password == '') {
		mensaje.textContent =
			'Debe informar correo electrónico, nombre y password para registrarse';
		return;
	}

	// La aceptación de términos y condiciones también es obligatoria
	if (data.termscondition != 'on') {
		mensaje.textContent = 'Debe aceptar los T&C para poder usar el sistema';
		return;
	}

	/*---
        Datos que se envían al servidor: son los que espera /api/addCliente
        */

	const alta = {
		contacto: data.contacto,
		nombre: data.nombre.trim(),
		password: data.password,
	};

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(alta),
	};

	const API = 'http://localhost:8080/api/addCliente';

	/*---
        Llama al API REST y actúa según la respuesta
        */

	fetch(API, options)
		.then((res) => {
			return res.json();
		})
		.then((r) => {
			if (r.response == 'OK') {
				// Alta correcta: vuelve a la pantalla de login
				window.location.href = 'loginClient.html';
			} else if (r.message == 'Cliente ya existe') {
				// El correo ya está registrado
				mensaje.textContent = 'El correo electrónico ya está registrado.';
			} else {
				// Cualquier otro error informado por el servidor
				mensaje.textContent = 'Error en el registro, intente nuevamente';
			}
		})
		.catch(() => {
			// El servidor no responde (por ejemplo, no está levantado node IS1_MesaAyuda.js)
			mensaje.textContent = 'No se pudo conectar con el servidor';
		});
});