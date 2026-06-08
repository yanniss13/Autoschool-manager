// Controleur CRUD des employes.
// Protege en amont par requireAuth + loadCompany : req.company est toujours defini.
const employeeService = require('../services/employeeService');
const { validateEmployee, GENDERS } = require('../validators/employeeValidator');
const password = require('../utils/password');

const EMAIL_TAKEN = 'Cet email est déjà utilisé dans votre entreprise.';

// Renvoie l'id numerique de l'URL, ou null si invalide.
function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function notFound(res) {
  return res.status(404).render('errors/404', { title: 'Introuvable' });
}

// GET /employees
async function index(req, res, next) {
  try {
    const employees = await employeeService.findAllByCompany(req.company.id);
    res.render('employees/index', { title: 'Employés', employees });
  } catch (err) {
    next(err);
  }
}

// GET /employees/new
function newForm(req, res) {
  res.render('employees/new', {
    title: 'Nouvel employé',
    errors: {},
    values: {},
    genders: GENDERS,
  });
}

// POST /employees
async function create(req, res, next) {
  try {
    const { isValid, errors, value } = validateEmployee(req.body, { isCreate: true });

    if (!isValid) {
      return res.status(400).render('employees/new', {
        title: 'Nouvel employé',
        errors,
        values: req.body,
        genders: GENDERS,
      });
    }

    // Unicite de l'email dans l'entreprise (controle applicatif).
    const existing = await employeeService.findByEmailInCompany(req.company.id, value.email);
    if (existing) {
      return res.status(400).render('employees/new', {
        title: 'Nouvel employé',
        errors: { email: EMAIL_TAKEN },
        values: req.body,
        genders: GENDERS,
      });
    }

    const passwordHash = await password.hash(value.password);
    await employeeService.createForCompany(req.company.id, {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      passwordHash,
      age: value.age,
      gender: value.gender,
    });

    req.flash('success', 'Employé créé avec succès.');
    res.redirect('/employees');
  } catch (err) {
    // Filet de securite si la contrainte @@unique([companyId, email]) est violee.
    if (err.code === 'P2002') {
      return res.status(400).render('employees/new', {
        title: 'Nouvel employé',
        errors: { email: EMAIL_TAKEN },
        values: req.body,
        genders: GENDERS,
      });
    }
    next(err);
  }
}

// GET /employees/:id/edit
async function editForm(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const employee = await employeeService.findOwnedById(req.company.id, id);
    if (!employee) return notFound(res);

    res.render('employees/edit', {
      title: 'Modifier un employé',
      errors: {},
      employee,
      values: employee,
      genders: GENDERS,
    });
  } catch (err) {
    next(err);
  }
}

// POST /employees/:id/update
async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return notFound(res);

  try {
    const employee = await employeeService.findOwnedById(req.company.id, id);
    if (!employee) return notFound(res);

    const { isValid, errors, value } = validateEmployee(req.body, { isCreate: false });
    if (!isValid) {
      return res.status(400).render('employees/edit', {
        title: 'Modifier un employé',
        errors,
        employee,
        values: req.body,
        genders: GENDERS,
      });
    }

    // Unicite de l'email : autorise si c'est l'employe lui-meme.
    const existing = await employeeService.findByEmailInCompany(req.company.id, value.email);
    if (existing && existing.id !== id) {
      return res.status(400).render('employees/edit', {
        title: 'Modifier un employé',
        errors: { email: EMAIL_TAKEN },
        employee,
        values: req.body,
        genders: GENDERS,
      });
    }

    const data = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      age: value.age,
      gender: value.gender,
    };
    // Mot de passe modifie uniquement si un nouveau est fourni.
    if (value.password) {
      data.passwordHash = await password.hash(value.password);
    }

    await employeeService.updateOwned(req.company.id, id, data);
    req.flash('success', 'Employé mis à jour.');
    res.redirect('/employees');
  } catch (err) {
    if (err.code === 'P2002') {
      const employee = await employeeService.findOwnedById(req.company.id, id).catch(() => null);
      return res.status(400).render('employees/edit', {
        title: 'Modifier un employé',
        errors: { email: EMAIL_TAKEN },
        employee,
        values: req.body,
        genders: GENDERS,
      });
    }
    next(err);
  }
}

// POST /employees/:id/delete
async function destroy(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const employee = await employeeService.findOwnedById(req.company.id, id);
    if (!employee) return notFound(res);

    await employeeService.deleteOwned(req.company.id, id);
    req.flash('success', 'Employé supprimé.');
    res.redirect('/employees');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, newForm, create, editForm, update, destroy };
