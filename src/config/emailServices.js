const nodemailer = require('nodemailer');

// ══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL TRANSPORTADOR
// ══════════════════════════════════════════════════════════════════
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ══════════════════════════════════════════════════════════════════
// CORREO DE BIENVENIDA
// Se envía cuando un cliente crea su cuenta
// ══════════════════════════════════════════════════════════════════
const enviarBienvenida = async (nombre, email) => {
  const mailOptions = {
    from: `"PonteGuapa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '¡Bienvenida a PonteGuapa! 💅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9b59b6;">¡Hola, ${nombre}!</h2>
        <p>Tu cuenta en <strong>PonteGuapa</strong> ha sido creada exitosamente.</p>
        <p>Ya puedes iniciar sesión y reservar tus citas favoritas.</p>
        <br>
        <p style="color: #888;">El equipo de PonteGuapa</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// ══════════════════════════════════════════════════════════════════
// CORREO DE CONTRASEÑA TEMPORAL
// Se envía cuando el cliente solicita recuperar su contraseña
// Incluye una contraseña temporal tipo PonteGuapa#4821
// El usuario debe cambiarla al iniciar sesión
// ══════════════════════════════════════════════════════════════════
const enviarPasswordTemporal = async (nombre, email, passwordTemporal) => {
  const mailOptions = {
    from: `"PonteGuapa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña - PonteGuapa',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9b59b6;">¡Hola, ${nombre}!</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Usa la siguiente contraseña temporal para iniciar sesión:</p>

        <!-- Contraseña destacada visualmente -->
        <div style="
          background-color: #f3e5ff;
          border: 2px dashed #9b59b6;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        ">
          <span style="
            font-size: 28px;
            font-weight: bold;
            color: #9b59b6;
            letter-spacing: 4px;
          ">${passwordTemporal}</span>
        </div>

        <p style="color: #e74c3c;">
        Por seguridad deberás cambia esta contraseña al iniciar sesión.
        </p>
        
        <p>Si no solicitaste este cambio ignora este correo.
           Tu contraseña actual seguirá siendo la misma.</p>
        <br>
        <p style="color: #888;">El equipo de PonteGuapa</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { enviarBienvenida, enviarPasswordTemporal };