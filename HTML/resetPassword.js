document.getElementById('btnReset').addEventListener('click', async () => {
    const contacto = document.getElementById('contacto').value.trim();
    const password = document.getElementById('password1').value.trim();
    const password2 = document.getElementById('password2').value.trim();
    const resultado = document.getElementById('resultadoReset');

    resultado.textContent = '';

    if (!contacto || !password || !password2) {
        resultado.textContent = 'Por favor completa todos los campos.';
        return;
    }

    if (password !== password2) {
        resultado.textContent = 'Las contraseñas no coinciden.';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/resetCliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacto, password })
        });

        const data = await response.json();

        if (response.ok && data.response === 'OK') {
            alert('¡Contraseña actualizada con éxito!');
            window.location.href = 'loginClient.html';
        } else {
            resultado.textContent = data.message || 'Error al actualizar la contraseña.';
        }
    } catch (error) {
        console.error('Error:', error);
        resultado.textContent = 'No se pudo conectar con el servidor.';
    }
});