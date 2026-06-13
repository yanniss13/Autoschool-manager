// Controleur CRUD des vehicules + affectation employe <-> vehicule.
// Protege en amont par requireAuth + loadCompany : req.company est toujours defini.
const vehicleService = require('../services/vehicleService');
const { validateVehicle, TRANSMISSIONS } = require('../validators/vehicleValidator');
const { parseId, notFound } = require('../utils/http');

const REG_TAKEN = 'Cette immatriculation est déjà utilisée.';

// GET /vehicles
async function index(req, res, next) {
  try {
    const [vehicles, assignableEmployees] = await Promise.all([
      vehicleService.findAllByCompany(req.company.id),
      vehicleService.findAssignableEmployees(req.company.id),
    ]);
    res.render('vehicles/index', { title: 'Véhicules', vehicles, assignableEmployees });
  } catch (err) {
    next(err);
  }
}

// GET /vehicles/new
function newForm(req, res) {
  res.render('vehicles/new', {
    title: 'Nouveau véhicule',
    errors: {},
    values: {},
    transmissions: TRANSMISSIONS,
  });
}

// POST /vehicles
async function create(req, res, next) {
  try {
    const { isValid, errors, value } = validateVehicle(req.body);
    if (!isValid) {
      return res.status(400).render('vehicles/new', {
        title: 'Nouveau véhicule',
        errors,
        values: req.body,
        transmissions: TRANSMISSIONS,
      });
    }

    const existing = await vehicleService.findByRegistration(value.registrationNumber);
    if (existing) {
      return res.status(400).render('vehicles/new', {
        title: 'Nouveau véhicule',
        errors: { registrationNumber: REG_TAKEN },
        values: req.body,
        transmissions: TRANSMISSIONS,
      });
    }

    await vehicleService.createForCompany(req.company.id, value);
    req.flash('success', 'Véhicule créé avec succès.');
    res.redirect('/vehicles');
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).render('vehicles/new', {
        title: 'Nouveau véhicule',
        errors: { registrationNumber: REG_TAKEN },
        values: req.body,
        transmissions: TRANSMISSIONS,
      });
    }
    next(err);
  }
}

// GET /vehicles/:id/edit
async function editForm(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const vehicle = await vehicleService.findOwnedById(req.company.id, id);
    if (!vehicle) return notFound(res);

    res.render('vehicles/edit', {
      title: 'Modifier un véhicule',
      errors: {},
      vehicle,
      values: vehicle,
      transmissions: TRANSMISSIONS,
    });
  } catch (err) {
    next(err);
  }
}

// POST /vehicles/:id/update
async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return notFound(res);

  try {
    const vehicle = await vehicleService.findOwnedById(req.company.id, id);
    if (!vehicle) return notFound(res);

    const { isValid, errors, value } = validateVehicle(req.body);
    if (!isValid) {
      return res.status(400).render('vehicles/edit', {
        title: 'Modifier un véhicule',
        errors,
        vehicle,
        values: req.body,
        transmissions: TRANSMISSIONS,
      });
    }

    const existing = await vehicleService.findByRegistration(value.registrationNumber);
    if (existing && existing.id !== id) {
      return res.status(400).render('vehicles/edit', {
        title: 'Modifier un véhicule',
        errors: { registrationNumber: REG_TAKEN },
        vehicle,
        values: req.body,
        transmissions: TRANSMISSIONS,
      });
    }

    await vehicleService.updateOwned(req.company.id, id, value);
    req.flash('success', 'Véhicule mis à jour.');
    res.redirect('/vehicles');
  } catch (err) {
    if (err.code === 'P2002') {
      const vehicle = await vehicleService.findOwnedById(req.company.id, id).catch(() => null);
      return res.status(400).render('vehicles/edit', {
        title: 'Modifier un véhicule',
        errors: { registrationNumber: REG_TAKEN },
        vehicle,
        values: req.body,
        transmissions: TRANSMISSIONS,
      });
    }
    next(err);
  }
}

// POST /vehicles/:id/delete
async function destroy(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const vehicle = await vehicleService.findOwnedById(req.company.id, id);
    if (!vehicle) return notFound(res);

    // Supprimer le vehicule libere automatiquement l'employe referent.
    await vehicleService.deleteOwned(req.company.id, id);
    req.flash('success', 'Véhicule supprimé.');
    res.redirect('/vehicles');
  } catch (err) {
    next(err);
  }
}

// POST /vehicles/:id/assign
async function assign(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const employeeId = parseId(req.body.employeeId);
    if (!employeeId) {
      req.flash('error', 'Veuillez sélectionner un employé valide.');
      return res.redirect('/vehicles');
    }

    const result = await vehicleService.assignEmployee(req.company.id, id, employeeId);
    if (!result.ok) {
      // Vehicule d'une autre entreprise : 404, sans fuite d'information.
      if (result.reason === 'vehicle_not_found') return notFound(res);

      const messages = {
        vehicle_occupied: 'Ce véhicule est déjà affecté.',
        employee_not_found: "L'employé sélectionné est introuvable.",
        employee_busy: 'Cet employé a déjà un véhicule.',
      };
      req.flash('error', messages[result.reason] || "L'affectation a échoué.");
      return res.redirect('/vehicles');
    }

    req.flash('success', 'Employé affecté au véhicule.');
    res.redirect('/vehicles');
  } catch (err) {
    // Filet de securite si la contrainte @unique(employeeId) est violee.
    if (err.code === 'P2002') {
      req.flash('error', 'Cet employé a déjà un véhicule.');
      return res.redirect('/vehicles');
    }
    next(err);
  }
}

// POST /vehicles/:id/unassign
async function unassign(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return notFound(res);

    const vehicle = await vehicleService.findOwnedById(req.company.id, id);
    if (!vehicle) return notFound(res);

    await vehicleService.unassignEmployee(req.company.id, id);
    req.flash('success', 'Véhicule désaffecté.');
    res.redirect('/vehicles');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, newForm, create, editForm, update, destroy, assign, unassign };
