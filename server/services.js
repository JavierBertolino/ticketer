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
    logger.error("Unable to get items. Error JSON:", error);
    throw error;
  }
}

async function createTicket(ticket) {
  try {
    const emailData = await generateEmailData(ticket);
    const params = {
      TableName: "assistants",
      Item: {
        nombre: ticket.nombre,
        mail: ticket.mail,
        cel: ticket.cel,
        codigoEntrada: ticket.codigoEntrada,
        type: ticket.type,
        fechaDeCompra: ticket.fechaDeCompra,
        scanned: ticket.scanned,
        usado: ticket.usado,
        qrCodeDataURL: emailData.qrCodeDataURL,
      },
    };
    logger.info("Create params", params)
    await docClient.put(params).promise();
    logger.info("Item added successfully");
    await sendEmail(ticket.mail, emailData);
    return { success: true };
  } catch (error) {
    logger.error("Unable to add item. Error JSON:", JSON.stringify(error, null, 2));
    throw error
  }
}

async function patchTicket(codigoEntrada, scanned, usado) {
  try {
    const params = {
      TableName: "assistants",
      Key: {
        codigoEntrada,
      },
      UpdateExpression: "set scanned = :scanned, usado = :usado",
      ExpressionAttributeValues: {
        ":scanned": scanned,
        ":usado": usado,
      },
      ReturnValues: "UPDATED_NEW",
    };

    logger.info(`Updating ${codigoEntrada} with scanned: ${scanned} and usado: ${usado}`);
    await docClient.update(params).promise();
    logger.info("Item updated successfully");
  } catch (error) {
    logger.error("Unable to update item. Error JSON:", error);
    throw error;
  }
}

async function sendEmail(recipient, emailData) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const base64Data = emailData.qrCodeDataURL.replace(/^data:image\/png;base64,/, "");

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: recipient,
      subject: emailData.Subject.Data,
      text: emailData.Body.Text.Data,
      html: emailData.Body.Html.Data,
      attachments: [
        {
          filename: 'flyer.jpg', // Adjust the filename if needed
          path: './flyer.jpg', // Path to the flyer image file
          cid: 'flyer@party', // Same cid value as in the HTML content
        },
        {
          filename: 'qrcode.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode@party',
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully");
  } catch (error) {
    logger.error("Error sending email: ", error);
    throw error;
  }
}

async function generateEmailData(ticket) {
  const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(ticket));
  const ticketType = ticket.type === "FreeMujeres" ? "Free Mujeres" : "General";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; text-align: center;">
      <!-- Center the flyer image and make it larger -->
      <img src="cid:flyer@party" alt="Flyer" style="display: block; margin: 0 auto; max-width: 100%; height: auto; user-select: none;" />
      
      <h2 style="color: #333; margin-top: 20px;">Tu Entrada</h2>
      <p><strong>Nombre:</strong> ${ticket.nombre}</p>
      <p><strong>Email:</strong> ${ticket.mail}</p>
      <p><strong>Celular:</strong> ${ticket.cel}</p>
      <p><strong>Tipo de entrada:</strong> ${ticketType}</p>
      <p><strong>Código Entrada:</strong> ${ticket.codigoEntrada}</p>
      <p><strong>Fecha de Compra:</strong> ${ticket.fechaDeCompra}</p>
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
        Data: `Tu entrada\n\nNombre: ${ticket.nombre}\nCodigo Entrada: ${ticket.codigoEntrada}\nFecha de Compra: ${ticket.fechaDeCompra}\nEscanea el código QR debajo para usar tu entrada.`,
      },
    },
    qrCodeDataURL,
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
    logger.error("Unable to add item. Error JSON:", JSON.stringify(error, null, 2));
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
      const user = result.Items[0];
      const decryptedPassword = decodePassword(user.password);

      if (decryptedPassword === password) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        return { status: "OK", token };
      } else {
        return { status: "Unauthorized" };
      }
    } else {
      return { status: "Unauthorized" };
    }
  } catch (error) {
    logger.error("Error logging in:", error);
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

module.exports = { getAssistants, createTicket, getUsers, addUser, loginUser, updateTicket: patchTicket };