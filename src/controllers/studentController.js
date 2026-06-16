// Controleur CRUD des eleves.
// Protege en amont par requireAuth + loadCompany : req.company est toujours defini.
const studentService = require('../services/studentService');
const { validateStudent } = require('../validators/studentValidator');
const password = require('../utils/password');
const mailer = require('../services/mailer');
const { parseId, notFound } = require('../utils/http');

const EMAIL_TAKEN = 'Cet email est déjà utilisé.';

// GET /students
async function index(req, res, next) {
  try {
    const students = await studentService.findAllByCompany(req.company.id);
    res.render('students/index', { title: 'Élèves', students });
  } catch (err) {
    next(err);
  }
}

// GET /students/new
function newForm(req, res) {
  res.render('students/new', {
    title: 'Nouvel élève',
    errors: {},
    values: {},
  });
}

// POST /students
async function create(req, res, next) {
  try {
    const { isValid, errors, value } = validateStudent(req.body, { isCreate: true });

    if (!isValid) {
      return res.status(400).render('students/new', {
        title: 'Nouvel élève',
        errors,
        values: req.body,
      });
    }

    const existing = await studentService.findByEmail(value.email);
    if (existing) {
      return res.status(400).render('students/new', {
        title: 'Nouvel élève',
        errors: { email: EMAIL_TAKEN },
        values: req.body,
      });
    }

    const passwordHash = await password.hash(value.password);
    await studentService.createForCompany(req.company.id, {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
      passwordHash,
      // Mot de passe defini par le gerant -> l'eleve doit le changer a sa 1re connexion.
      mustChangePassword: true,
    });

    // Envoi des identifiants a l'eleve (best-effort : ne bloque pas la creation
    // si SMTP est absent ou en panne ; le mailer journalise et renvoie false).
    const sent = await mailer.sendStudentCredentials({
      to: value.email,
      firstName: value.firstName,
      email: value.email,
      password: value.password,
      companyName: req.company.businessName,
    });

    req.flash(
      'success',
      sent
        ? 'Élève créé avec succès. Ses identifiants lui ont été envoyés par email.'
        : 'Élève créé avec succès.'
    );
    res.redirect('/students');
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).render('students/new', {
        title: 'Nouvel élève',
        errors: { email: EMAIL_TAKEN },
        values: req.body,
      });
    }
    next(err);
  }
}

// GET /students/:id/edit
async function editForm(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const student = await studentService.findOwnedById(req.company.id, id);
    if (!student) return notFound(res);

    res.render('students/edit', {
      title: 'Modifier un élève',
      errors: {},
      student,
      values: student,
    });
  } catch (err) {
    next(err);
  }
}

// POST /students/:id/update
async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return notFound(res);

  try {
    const student = await studentService.findOwnedById(req.company.id, id);
    if (!student) return notFound(res);

    const { isValid, errors, value } = validateStudent(req.body, { isCreate: false });
    if (!isValid) {
      return res.status(400).render('students/edit', {
        title: 'Modifier un élève',
        errors,
        student,
        values: req.body,
      });
    }

    const existing = await studentService.findByEmail(value.email);
    if (existing && existing.id !== id) {
      return res.status(400).render('students/edit', {
        title: 'Modifier un élève',
        errors: { email: EMAIL_TAKEN },
        student,
        values: req.body,
      });
    }

    const data = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
    };
    if (value.password) {
      data.passwordHash = await password.hash(value.password);
      // Mot de passe (re)defini par le gerant -> a changer a la prochaine connexion.
      data.mustChangePassword = true;
    }

    await studentService.updateOwned(req.company.id, id, data);
    req.flash('success', 'Élève mis à jour.');
    res.redirect('/students');
  } catch (err) {
    if (err.code === 'P2002') {
      const student = await studentService.findOwnedById(req.company.id, id).catch(() => null);
      return res.status(400).render('students/edit', {
        title: 'Modifier un élève',
        errors: { email: EMAIL_TAKEN },
        student,
        values: req.body,
      });
    }
    next(err);
  }
}

// POST /students/:id/resend-credentials
// Regenere un mot de passe temporaire et le renvoie par email (l'ancien mot de passe
// n'etant pas recuperable car hache). L'eleve devra le changer a sa prochaine connexion.
async function resendCredentials(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const student = await studentService.findOwnedById(req.company.id, id);
    if (!student) return notFound(res);

    if (!student.email) {
      req.flash('error', "Cet élève n'a pas d'email : impossible d'envoyer les identifiants.");
      return res.redirect('/students');
    }

    const newPassword = password.generateTemporary();
    const passwordHash = await password.hash(newPassword);
    await studentService.updateOwned(req.company.id, id, {
      passwordHash,
      mustChangePassword: true,
    });

    const sent = await mailer.sendStudentCredentials({
      to: student.email,
      firstName: student.firstName,
      email: student.email,
      password: newPassword,
      companyName: req.company.businessName,
    });

    req.flash(
      sent ? 'success' : 'error',
      sent
        ? "Nouveaux identifiants envoyés par email à l'élève."
        : "Mot de passe régénéré, mais l'email n'a pas pu être envoyé (SMTP non configuré ?)."
    );
    res.redirect('/students');
  } catch (err) {
    next(err);
  }
}

// POST /students/:id/delete
async function destroy(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const student = await studentService.findOwnedById(req.company.id, id);
    if (!student) return notFound(res);

    await studentService.deleteOwned(req.company.id, id);
    req.flash('success', 'Élève supprimé.');
    res.redirect('/students');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, newForm, create, editForm, update, destroy, resendCredentials };
