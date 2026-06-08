// Controleur CRUD des ordinateurs + affectation employe <-> ordinateur.
// Protege en amont par requireAuth + loadCompany : req.company est toujours defini.
const computerService = require('../services/computerService');
const { validateComputer } = require('../validators/computerValidator');

const MAC_TAKEN = 'Cette adresse MAC est déjà utilisée.';

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function notFound(res) {
  return res.status(404).render('errors/404', { title: 'Introuvable' });
}

// GET /computers
async function index(req, res, next) {
  try {
    const [computers, assignableEmployees] = await Promise.all([
      computerService.findAllByCompany(req.company.id),
      computerService.findAssignableEmployees(req.company.id),
    ]);
    res.render('computers/index', { title: 'Ordinateurs', computers, assignableEmployees });
  } catch (err) {
    next(err);
  }
}

// GET /computers/new
function newForm(req, res) {
  res.render('computers/new', { title: 'Nouvel ordinateur', errors: {}, values: {} });
}

// POST /computers
async function create(req, res, next) {
  try {
    const { isValid, errors, value } = validateComputer(req.body);
    if (!isValid) {
      return res.status(400).render('computers/new', { title: 'Nouvel ordinateur', errors, values: req.body });
    }

    const existing = await computerService.findByMac(value.macAddress);
    if (existing) {
      return res.status(400).render('computers/new', {
        title: 'Nouvel ordinateur',
        errors: { macAddress: MAC_TAKEN },
        values: req.body,
      });
    }

    await computerService.createForCompany(req.company.id, { macAddress: value.macAddress });
    req.flash('success', 'Ordinateur créé avec succès.');
    res.redirect('/computers');
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).render('computers/new', {
        title: 'Nouvel ordinateur',
        errors: { macAddress: MAC_TAKEN },
        values: req.body,
      });
    }
    next(err);
  }
}

// GET /computers/:id/edit
async function editForm(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const computer = await computerService.findOwnedById(req.company.id, id);
    if (!computer) return notFound(res);

    res.render('computers/edit', { title: 'Modifier un ordinateur', errors: {}, computer, values: computer });
  } catch (err) {
    next(err);
  }
}

// POST /computers/:id/update
async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return notFound(res);

  try {
    const computer = await computerService.findOwnedById(req.company.id, id);
    if (!computer) return notFound(res);

    const { isValid, errors, value } = validateComputer(req.body);
    if (!isValid) {
      return res.status(400).render('computers/edit', { title: 'Modifier un ordinateur', errors, computer, values: req.body });
    }

    const existing = await computerService.findByMac(value.macAddress);
    if (existing && existing.id !== id) {
      return res.status(400).render('computers/edit', {
        title: 'Modifier un ordinateur',
        errors: { macAddress: MAC_TAKEN },
        computer,
        values: req.body,
      });
    }

    await computerService.updateOwned(req.company.id, id, { macAddress: value.macAddress });
    req.flash('success', 'Ordinateur mis à jour.');
    res.redirect('/computers');
  } catch (err) {
    if (err.code === 'P2002') {
      const computer = await computerService.findOwnedById(req.company.id, id).catch(() => null);
      return res.status(400).render('computers/edit', {
        title: 'Modifier un ordinateur',
        errors: { macAddress: MAC_TAKEN },
        computer,
        values: req.body,
      });
    }
    next(err);
  }
}

// POST /computers/:id/delete
async function destroy(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const computer = await computerService.findOwnedById(req.company.id, id);
    if (!computer) return notFound(res);

    // Supprimer le poste libere automatiquement l'employe affecte.
    await computerService.deleteOwned(req.company.id, id);
    req.flash('success', 'Ordinateur supprimé.');
    res.redirect('/computers');
  } catch (err) {
    next(err);
  }
}

// POST /computers/:id/assign
async function assign(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const employeeId = parseId(req.body.employeeId);
    if (!employeeId) {
      req.flash('error', 'Veuillez sélectionner un employé valide.');
      return res.redirect('/computers');
    }

    const result = await computerService.assignEmployee(req.company.id, id, employeeId);
    if (!result.ok) {
      // Ordinateur d'une autre entreprise : 404, sans fuite d'information.
      if (result.reason === 'computer_not_found') return notFound(res);

      const messages = {
        computer_occupied: 'Cet ordinateur est déjà affecté.',
        employee_not_found: "L'employé sélectionné est introuvable.",
        employee_busy: 'Cet employé a déjà un poste.',
      };
      req.flash('error', messages[result.reason] || "L'affectation a échoué.");
      return res.redirect('/computers');
    }

    req.flash('success', 'Employé affecté à l\'ordinateur.');
    res.redirect('/computers');
  } catch (err) {
    // Filet de securite si la contrainte @unique(employeeId) est violee.
    if (err.code === 'P2002') {
      req.flash('error', 'Cet employé a déjà un poste.');
      return res.redirect('/computers');
    }
    next(err);
  }
}

// POST /computers/:id/unassign
async function unassign(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const computer = await computerService.findOwnedById(req.company.id, id);
    if (!computer) return notFound(res);

    await computerService.unassignEmployee(req.company.id, id);
    req.flash('success', 'Ordinateur désaffecté.');
    res.redirect('/computers');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, newForm, create, editForm, update, destroy, assign, unassign };
