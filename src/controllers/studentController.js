// Controleur CRUD des eleves.
// Protege en amont par requireAuth + loadCompany : req.company est toujours defini.
const studentService = require('../services/studentService');
const { validateStudent } = require('../validators/studentValidator');
const { parseId, notFound } = require('../utils/http');

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
    const { isValid, errors, value } = validateStudent(req.body);

    if (!isValid) {
      return res.status(400).render('students/new', {
        title: 'Nouvel élève',
        errors,
        values: req.body,
      });
    }

    await studentService.createForCompany(req.company.id, value);
    req.flash('success', 'Élève créé avec succès.');
    res.redirect('/students');
  } catch (err) {
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

    const { isValid, errors, value } = validateStudent(req.body);
    if (!isValid) {
      return res.status(400).render('students/edit', {
        title: 'Modifier un élève',
        errors,
        student,
        values: req.body,
      });
    }

    await studentService.updateOwned(req.company.id, id, value);
    req.flash('success', 'Élève mis à jour.');
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

module.exports = { index, newForm, create, editForm, update, destroy };
