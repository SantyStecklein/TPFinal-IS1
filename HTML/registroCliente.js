document.getElementById('btnEnviarRegistro').addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value.trim();
    const contacto = document.getElementById('contacto').value.trim();
    const password = document.getElementById('password').value.trim();
    const aceptaTerminos = document.getElementById('termscondition').checked;
    const resultado = document.getElementById('resultadoRegistro');

    resultado.textContent = '';

    if (!nombre || !contacto || !password) {
        resultado.textContent = 'Por favor completa todos los campos (Nombre, Correo y Contraseña).';
        return;
    }

    if (!aceptaTerminos) {
        resultado.textContent = 'Debes aceptar los términos y condiciones para continuar.';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/addCliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, contacto, password })
        });

        const data = await response.json();

        if (response.ok && data.response === 'OK') {
            alert('¡Registro exitoso! Serás redirigido al inicio de sesión.');
            window.location.href = 'loginClient.html';
        } else {
            resultado.textContent = data.message || 'Error al registrar el cliente.';
        }
    } catch (error) {
        console.error('Error:', error);
        resultado.textContent = 'No se pudo conectar con el servidor.';
    }
});
