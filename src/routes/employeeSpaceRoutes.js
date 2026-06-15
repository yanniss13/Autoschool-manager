// Route de l'espace employe (montee derriere requireEmployeeAuth + loadEmployee).
const express = require('express');
const employeeSpaceController = require('../controllers/employeeSpaceController');

const router = express.Router();

router.get('/', employeeSpaceController.index);

module.exports = router;
