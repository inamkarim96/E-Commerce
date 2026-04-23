const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, FRONTEND_URL } = require("../../config/env");

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.warn("SendGrid API Key or From Email not configured.");
    return;
  }

  const msg = {
    to,
    from: SENDGRID_FROM_EMAIL,
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("Email send failed:", error.response ? error.response.body : error.message);
  }
};

const sendVerificationEmail = async (to, name, verifyUrl) => {
  const subject = "Welcome to NaturaDry - Verify Your Email";
  const text = `Hi ${name},\n\nWelcome to NaturaDry! Please verify your email by clicking the link below:\n\n${verifyUrl}\n\nBest regards,\nNaturaDry Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2>Welcome to NaturaDry!</h2>
      <p>Hi ${name},</p>
      <p>Welcome to NaturaDry! We're excited to have you on board. Please verify your email by clicking the button below:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>${verifyUrl}</p>
      <p>Best regards,<br>NaturaDry Team</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

const sendOTPEmail = async (to, name, otp) => {
  const subject = "NaturaDry - Your Password Reset Code";
  const text = `Hi ${name},\n\nYour password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nBest regards,\nNaturaDry Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2>Password Reset Code</h2>
      <p>Hi ${name},</p>
      <p>Your password reset code is:</p>
      <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Best regards,<br>NaturaDry Team</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

const sendOrderConfirmation = async (to, name, order) => {
  const itemsList = order.items.map(item => `- ${item.product_name} x ${item.quantity}: Rs. ${item.subtotal}`).join('\n');
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs. ${item.subtotal}</td>
    </tr>
  `).join('');

  const subject = `Order Confirmation - #${order.id}`;
  const text = `Hi ${name},\n\nThank you for your order #${order.id}!\n\nOrder Details:\n${itemsList}\n\nTotal: Rs. ${order.total}\n\nShipping Address:\n${order.shipping_address}\n\nBest regards,\nNaturaDry Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2>Order Confirmation</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your order <strong>#${order.id}</strong>!</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: left;">Qty</th>
            <th style="padding: 10px; text-align: left;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p><strong>Total: Rs. ${order.total}</strong></p>
      <p><strong>Shipping Address:</strong><br>${order.shipping_address}</p>
      <p>Best regards,<br>NaturaDry Team</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

const sendOrderStatusUpdate = async (to, name, order, newStatus) => {
  let extraInfoText = "";
  let extraInfoHtml = "";

  if (newStatus.toLowerCase() === 'shipped' && order.tracking_number) {
    extraInfoText = `\nTracking Number: ${order.tracking_number}\nCourier: ${order.courier}`;
    extraInfoHtml = `<p><strong>Tracking Number:</strong> ${order.tracking_number}<br><strong>Courier:</strong> ${order.courier}</p>`;
  }

  const subject = `Update on Order #${order.id}`;
  const text = `Hi ${name},\n\nYour order #${order.id} status has been updated to: ${newStatus}.${extraInfoText}\n\nBest regards,\nNaturaDry Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2>Order Status Update</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>#${order.id}</strong> status has been updated to: <span style="text-transform: capitalize;">${newStatus}</span>.</p>
      ${extraInfoHtml}
      <p>Best regards,<br>NaturaDry Team</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

const sendLowStockAlert = async (adminEmail, product, variant, currentStock) => {
  const subject = `Low Stock Alert: ${product.name}`;
  const text = `Admin,\n\nLow stock alert for ${product.name} (${variant.label}). Current stock: ${currentStock}.\n\nBest regards,\nNaturaDry System`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-top: 4px solid #dc3545;">
      <h2 style="color: #dc3545;">Low Stock Alert</h2>
      <p>Low stock alert for <strong>${product.name}</strong> (${variant.label}).</p>
      <p>Current stock: <strong style="color: #dc3545;">${currentStock}</strong></p>
      <p>Please restock soon.</p>
      <p>Best regards,<br>NaturaDry System</p>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject, text, html });
};

module.exports = {
  sendVerificationEmail,
  sendOTPEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendLowStockAlert,
};
