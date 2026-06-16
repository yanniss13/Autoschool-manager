// Controleur CRUD des eleves.
// Protege en amont par requireAuth + loadCompany : req.company est toujours defini.
const studentService = require('../services/studentService');
const { validateStudent } = require('../validators/studentValidator');
const password = require('../utils/password');
const { parseId, notFound } = require('../utils/http');

const EMAIL_TAKEN = 'Cet email est deja utilise.';

// GET /students
async function index(req, res, next) {
  try {
    const students = await studentService.findAllByCompany(req.company.id);
    res.render('students/index', { title: 'Eleves', students });
  } catch (err) {
    next(err);
  }
}

// GET /students/new
function newForm(req, res) {
  res.render('students/new', {
    title: 'Nouvel eleve',
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
        title: 'Nouvel eleve',
        errors,
        values: req.body,
      });
    }

    const existing = await studentService.findByEmail(value.email);
    if (existing) {
      return res.status(400).render('students/new', {
        title: 'Nouvel eleve',
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
    });
    req.flash('success', 'Eleve cree avec succes.');
    res.redirect('/students');
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).render('students/new', {
        title: 'Nouvel eleve',
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
      title: 'Modifier un eleve',
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
        title: 'Modifier un eleve',
        errors,
        student,
        values: req.body,
      });
    }

    const existing = await studentService.findByEmail(value.email);
    if (existing && existing.id !== id) {
      return res.status(400).render('students/edit', {
        title: 'Modifier un eleve',
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
    }

    await studentService.updateOwned(req.company.id, id, data);
    req.flash('success', 'Eleve mis a jour.');
    res.redirect('/students');
  } catch (err) {
    if (err.code === 'P2002') {
      const student = await studentService.findOwnedById(req.company.id, id).catch(() => null);
      return res.status(400).render('students/edit', {
        title: 'Modifier un eleve',
        errors: { email: EMAIL_TAKEN },
        student,
        values: req.body,
      });
    }
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
    req.flash('success', 'Eleve supprime.');
    res.redirect('/students');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, newForm, create, editForm, update, destroy };
