const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  // App Password de Gmail, no tu contraseña normal
  }
});

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

module.exports = { enviarBienvenida };