// Service d'envoi d'emails (SMTP via nodemailer).
//
// Philosophie (alignee sur groqClient) : l'envoi est *optionnel*. Si la
// configuration SMTP est absente (ou en environnement de test), on n'effectue
// AUCUN appel reseau et on ne leve jamais d'erreur — une action metier (creation
// d'eleve, demande de reset) ne doit jamais echouer parce que l'email n'est pas
// parti. Les echecs reels sont seulement journalises.
const nodemailer = require('nodemailer');

const FROM_FALLBACK = 'AutoSchool Manager <no-reply@autoschool.local>';

// En test, on ne veut pas dependre du reseau ni envoyer de vrais emails dans le
// bac a sable a chaque `npm test`. Le flux reste teste (token persiste en base) ;
// seule la livraison SMTP est court-circuitee.
function isTestEnv() {
  return process.env.NODE_ENV === 'test';
}

// Indique si un transport SMTP est configure (sinon on n'envoie pas).
function isConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_HOST.trim() &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

// Transport cree paresseusement (et reutilise) pour ne pas ouvrir de pool si
// l'email n'est jamais utilise.
let transport = null;
function getTransport() {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port: Number(process.env.SMTP_PORT) || 2525,
    // Mailtrap sandbox ecoute en clair sur 2525 puis passe en STARTTLS : `secure`
    // doit rester false pour les ports != 465.
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transport;
}

// Envoi bas niveau. Renvoie true si l'email est parti, false sinon (config
// absente, env de test, ou erreur SMTP). Ne leve jamais : l'appelant continue.
async function sendMail({ to, subject, text, html }) {
  if (isTestEnv() || !isConfigured()) {
    return false;
  }
  try {
    await getTransport().sendMail({
      from: (process.env.MAIL_FROM || FROM_FALLBACK).trim(),
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    // On journalise sans interrompre le flux applicatif appelant.
    console.error('[mailer] echec envoi email :', err.message);
    return false;
  }
}

// URL de base pour les liens (sans slash final).
function baseUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
}

// Echappe le HTML pour injecter des donnees utilisateur dans les emails HTML.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Couleurs alignees sur le theme de l'app (public/css/style.css).
const BRAND = {
  primary: '#2f57d6',
  soft: '#eaf0fd',
  ink: '#1f2933',
  muted: '#6b7280',
  bg: '#f4f5f7',
  card: '#ffffff',
};

// Bouton compatible mail : un <a> stylise seul ne s'affiche pas en bouton sur Outlook,
// on l'enveloppe donc dans une <table> coloree.
function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0;">
        <tr>
          <td style="background:${BRAND.primary};border-radius:8px;">
            <a href="${escapeHtml(href)}"
               style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(label)}</a>
          </td>
        </tr>
      </table>`;
}

// Enveloppe HTML commune des emails : layout en <table> + styles inline (la seule
// approche fiable d'un client mail a l'autre ; pas de feuille externe ni de flex/grid).
function layout({ heading, bodyHtml, footerText }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${BRAND.bg};padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="width:100%;max-width:600px;background:${BRAND.card};border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${BRAND.primary};padding:22px 28px;">
              <span style="color:#ffffff;font-size:18px;font-weight:bold;">AutoSchool Manager</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:${BRAND.ink};font-size:15px;line-height:1.6;">
              <h1 style="margin:0 0 18px;font-size:20px;color:${BRAND.ink};">${escapeHtml(heading)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:${BRAND.soft};color:${BRAND.muted};font-size:12px;line-height:1.5;">
              ${escapeHtml(footerText)}
            </td>
          </tr>
        </table>
        <p style="color:${BRAND.muted};font-size:11px;margin:16px 0 0;">Email envoyé automatiquement, merci de ne pas y répondre.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// --- Email 1 : identifiants envoyes a la creation d'un eleve ---
function sendStudentCredentials({ to, firstName, email, password, companyName }) {
  const loginUrl = `${baseUrl()}/student-login`;
  const subject = 'Vos identifiants AutoSchool Manager';
  const text = [
    `Bonjour ${firstName},`,
    '',
    `Un espace élève a été créé pour vous${companyName ? ` par ${companyName}` : ''}.`,
    'Vous pouvez vous connecter avec les identifiants suivants :',
    '',
    `  Email        : ${email}`,
    `  Mot de passe : ${password}`,
    '',
    `Connexion : ${loginUrl}`,
    '',
    'Pour votre sécurité, pensez à modifier votre mot de passe après la première connexion.',
  ].join('\n');
  const bodyHtml = `<p style="margin:0 0 16px;">Bonjour <strong>${escapeHtml(firstName)}</strong>,</p>
      <p style="margin:0 0 16px;">Un espace élève a été créé pour vous${companyName ? ` par <strong>${escapeHtml(companyName)}</strong>` : ''}. Voici vos identifiants de connexion :</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.soft};border-radius:8px;margin:0 0 22px;">
        <tr>
          <td style="padding:16px 18px;color:${BRAND.ink};font-size:15px;line-height:1.8;">
            <strong>Email</strong>&nbsp;: ${escapeHtml(email)}<br>
            <strong>Mot de passe</strong>&nbsp;: ${escapeHtml(password)}
          </td>
        </tr>
      </table>
      ${button(loginUrl, "Se connecter à mon espace")}`;
  const html = layout({
    heading: 'Bienvenue 👋',
    bodyHtml,
    footerText: 'Pour votre sécurité, pensez à modifier votre mot de passe après la première connexion.',
  });
  return sendMail({ to, subject, text, html });
}

// --- Email 2 : lien de reinitialisation de mot de passe ---
function sendPasswordReset({ to, firstName, token }) {
  const resetUrl = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Réinitialisation de votre mot de passe';
  const text = [
    `Bonjour ${firstName || ''},`.trim(),
    '',
    'Vous avez demandé la réinitialisation de votre mot de passe.',
    'Cliquez sur le lien ci-dessous (valable 1 heure) pour en choisir un nouveau :',
    '',
    `  ${resetUrl}`,
    '',
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.",
  ].join('\n');
  const bodyHtml = `<p style="margin:0 0 16px;">Bonjour <strong>${escapeHtml(firstName || '')}</strong>,</p>
      <p style="margin:0 0 18px;">Vous avez demandé la réinitialisation de votre mot de passe. Ce lien est valable <strong>1 heure</strong> :</p>
      ${button(resetUrl, 'Choisir un nouveau mot de passe')}
      <p style="margin:18px 0 0;color:${BRAND.muted};font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.</p>`;
  const html = layout({
    heading: 'Réinitialisation du mot de passe',
    bodyHtml,
    footerText: "AutoSchool Manager — gestion de votre auto-école.",
  });
  return sendMail({ to, subject, text, html });
}

module.exports = {
  isConfigured,
  sendMail,
  sendStudentCredentials,
  sendPasswordReset,
};
