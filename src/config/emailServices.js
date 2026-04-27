const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Convierte links de Google Drive al formato directo de imagen
const convertirLinkImagen = (url) => {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
};

// Genera el bloque HTML de la imagen
const generarBloqueImagen = (url) => {
  if (!url) return '';
  return `
    <div style="margin: 20px 0; text-align: center;">
      <img src="${url}" alt="Imagen PonteGuapa"
        style="width: 100%; max-width: 560px; border-radius: 10px; object-fit: cover;">
    </div>
  `;
};

const enviarBienvenida = async (nombre, email) => {
  const mailOptions = {
    from: `"PonteGuapa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '¡Bienvenida a PonteGuapa! ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9b59b6, #6c3483); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">PonteGuapa </h1>
        </div>
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #9b59b6;">¡Hola, ${nombre}!</h2>
          <p>Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión y reservar tus citas favoritas.</p>
          <br>
          <p style="color: #888;">El equipo de PonteGuapa</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

const enviarPasswordTemporal = async (nombre, email, passwordTemporal) => {
  const mailOptions = {
    from: `"PonteGuapa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña - PonteGuapa 🔐',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9b59b6, #6c3483); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">PonteGuapa 💅</h1>
        </div>
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #9b59b6;">¡Hola, ${nombre}!</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña. Usa la siguiente clave temporal para ingresar:</p>
          <div style="background-color: #f3e5ff; border: 2px dashed #9b59b6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; color: #9b59b6; letter-spacing: 4px;">${passwordTemporal}</span>
          </div>
          <p style="color: #e74c3c;">Al ingresar deberás establecer una nueva contraseña.</p>
          <p>Si no solicitaste este cambio, ignora este correo.</p>
          <br>
          <p style="color: #888;">El equipo de PonteGuapa</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Notificación general con posición de imagen configurable
const enviarNotificacion = async (nombre, email, asunto, mensaje, imagenUrl = null, posicionImagen = 'medio', mensajeCierre = null) => {
  const urlImagen    = convertirLinkImagen(imagenUrl);
  const bloqueImagen = generarBloqueImagen(urlImagen);

  // Construye el cuerpo según la posición elegida por el admin
  const cuerpo = `
    ${posicionImagen === 'arriba' ? bloqueImagen : ''}

    <div style="background: #f9f9f9; border-left: 4px solid #9b59b6; padding: 16px; border-radius: 4px; margin: 16px 0;">
      <p style="margin: 0; color: #333; line-height: 1.8;">
        ${mensaje.replace(/\n/g, '<br>')}
      </p>
    </div>

    ${posicionImagen === 'medio' ? bloqueImagen : ''}

    ${mensajeCierre ? `
      <p style="color: #555; font-style: italic; margin-top: 16px;">
        ${mensajeCierre}
      </p>
    ` : ''}

    ${posicionImagen === 'abajo' ? bloqueImagen : ''}
  `;

  const mailOptions = {
    from: `"PonteGuapa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: asunto,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9b59b6, #6c3483); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">PonteGuapa </h1>
        </div>
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #9b59b6;">¡Hola, ${nombre}!</h2>
          ${cuerpo}
          <br>
          <p style="color: #888; font-size: 13px;">
            Este mensaje fue enviado por el equipo de PonteGuapa.<br>
            Si tienes dudas, visítanos directamente en el salón.
          </p>
        </div>
        <div style="background: #f3e5ff; padding: 16px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; color: #9b59b6; font-size: 13px;">© 2026 PonteGuapa — Todos los derechos reservados</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { enviarBienvenida, enviarPasswordTemporal, enviarNotificacion };