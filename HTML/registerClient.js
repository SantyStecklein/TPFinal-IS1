const formE1 = document.querySelector('.form');
const emailInput = document.querySelector('input[name="contacto"]');
const submitBtn = document.querySelector('button[type="submit"]');
const resultado1 = document.getElementById('resultado1');
const resultado2 = document.getElementById('resultado2');

/*---
    Reactivar el botón si el usuario cambia el email después de un error
*/
emailInput.addEventListener('input', () => {
    submitBtn.disabled = false;
    resultado1.textContent = '';
});

/*---
    Intercepta el submit del formulario de registro
*/
formE1.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(formE1);
    const data = Object.fromEntries(formData);
    
    console.log('Intentando registrar usuario:', data.contacto);

    // 1. Validaciones locales (incluyendo el nuevo campo de nombre)
    if (data.nombre == '' || data.contacto == '' || data.password == '') {
        resultado1.style.color = 'RED';
        resultado1.style.textAlign = 'center';
        resultado1.textContent = 'Debe informar nombre, correo y contraseña';
        return;
    }

    if (data.termscondition != 'on') {
        resultado2.style.color = 'RED';
        resultado2.style.textAlign = 'center';
        resultado2.textContent = 'Debe aceptar los T&C para poder registrarse';
        return;
    }

    // 2. Armar el paquete de datos con los valores exactos del HTML
    const nuevoCliente = {
        contacto: data.contacto,
        password: data.password,
        nombre: data.nombre
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoCliente),
    };

    // 3. Llamar al servidor
    fetch('http://localhost:8080/api/addCliente', options)
        .then((res) => res.json())
        .then((respuesta) => {
            console.log("Respuesta del servidor:", respuesta);
            
            if (respuesta.response === 'OK') {
                alert('¡Registro exitoso! Volviendo a la pantalla de inicio de sesión...');
                window.location.href = 'http://127.0.0.1:5500/HTML/loginClient.html';
                
            } else if (respuesta.message === 'Cliente ya existe') {
                submitBtn.disabled = true;
                resultado1.style.color = 'RED';
                resultado1.style.textAlign = 'center';
                resultado1.textContent = 'El usuario ya existe. Registración deshabilitada.';
                
            } else {
                resultado1.style.color = 'RED';
                resultado1.textContent = 'Error: ' + respuesta.message;
            }
        })
        .catch(error => console.log("Error de red:", error));
});