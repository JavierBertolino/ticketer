const AWS = require("aws-sdk");
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: "us-east-1" });

async function getAssistants() {
  const params = {
    TableName: "assistants",
  };

  try {
    const result = await docClient.scan(params).promise();
    return result.Items;
  } catch (error) {
    console.error("Unable to get items. Error JSON:", error);
    throw error;
  }
}

async function addAssistant(assistant) {
  try {
    const emailData = await generateEmailData(assistant);
    const params = {
      TableName: "assistants",
      Item: {
        nombre: assistant.nombre,
        mail: assistant.mail,
        cel: assistant.cel,
        codigoEntrada: assistant.codigoEntrada,
        fechaDeCompra: assistant.fechaDeCompra,
        scanned: assistant.scanned,
        usado: assistant.usado,
        qrCodeDataURL: emailData.qrCodeDataURL,
      },
    };
    logger.info("params", params)
    await docClient.put(params).promise();
    logger.info("Item added successfully");
    await sendEmail(assistant.mail, emailData);
    return { success: true };
  } catch (error) {
    console.error("Unable to add item. Error JSON:", JSON.stringify(error, null, 2));
    throw error
  }
}

async function sendEmail(recipient, emailData) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ADDRESS,  // Replace with your Gmail address
        pass: process.env.EMAIL_PASSWORD, // Replace with your app-specific password
      },
    });

    // Extract base64 content safely
    const base64Data = emailData.qrCodeDataURL.replace(/^data:image\/png;base64,/, "");

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS, // Sender address
      to: recipient, // List of recipients
      subject: emailData.Subject.Data, // Subject line
      text: emailData.Body.Text.Data, // Plain text body
      html: emailData.Body.Html.Data, // HTML body
      attachments: [
        {
          filename: 'qrcode.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode@party', // Content ID to embed the image in the email
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully");
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error
  }
}


async function generateEmailData(assistant) {
  const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(assistant));

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333;">Tu Entrada</h2>
      <p><strong>Nombre:</strong> ${assistant.nombre}</p>
      <p><strong>Email:</strong> ${assistant.mail}</p>
      <p><strong>Celular:</strong> ${assistant.cel}</p>
      <p><strong>Código Entrada:</strong> ${assistant.codigoEntrada}</p>
      <p><strong>Fecha de Compra:</strong> ${assistant.fechaDeCompra}</p>
      <div style="margin-top: 20px; text-align: center;">
        <p style="margin-bottom: 10px;">Escanea el código QR debajo para usar tu entrada:</p>
        <img src="cid:qrcode@party" alt="QR Code" style="max-width: 200px;" />
      </div>
      <p style="margin-top: 20px; color: #888; font-size: 12px;">Por favor no compartas este ticket con nadie. Es único para ti y solo se puede usar una vez.</p>
    </div>
  `;

  return {
    Subject: {
      Data: "Tu entrada para el evento",
    },
    Body: {
      Html: {
        Data: htmlContent,
      },
      Text: {
        Data: `Tu entrada\n\nNombre: ${assistant.nombre}\nEmail: ${assistant.mail}\nCel: ${assistant.cel}\nCodigo Entrada: ${assistant.codigoEntrada}\nFecha de Compra: ${assistant.fechaDeCompra}\Escanea el código QR debajo para usar tu entrada.`,
      },
    },
    qrCodeDataURL,  // Pass the QR code data URL for the attachment
  };
}

async function getUsers() {
  const params = {
    TableName: "users",
  };

  const results = await docClient.scan(params).promise();
  return results.Items;
}

async function addUser(user) {
  // generate and id for the user
  user.id = crypto.randomBytes(8).toString("hex");
  try {
    const params = {
      TableName: "users",
      Item: {
        id: user.id,
        nombre: user.nombre,
        password: encodePassword(user.password),
      },
    };
    await docClient.put(params).promise();
  } catch (error) {
    console.error("Unable to add item. Error JSON:", JSON.stringify(error, null, 2));
    throw error;
  }
}

async function loginUser(usuario, password) {
  try {
    const params = {
      TableName: "users",
      FilterExpression: "nombre = :usuario",
      ExpressionAttributeValues: {
        ":usuario": usuario
      }
    };

    const result = await docClient.scan(params).promise();

    if (result.Items.length > 0) {
      const user = result.Items[0]; // Assuming 'nombre' is unique and you only get one result
      const decryptedPassword = decodePassword(user.password);

      if (decryptedPassword === password) {
        // Create JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        return { status: "OK", token };
      } else {
        return { status: "Unauthorized" };
      }
    } else {
      return { status: "Unauthorized" };
    }
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}


function encodePassword(password) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.PWD_HASH);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decodePassword(encryptedPassword) {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.PWD_HASH);
  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { getAssistants, addAssistant, getUsers, addUser, loginUser };