// Charge l'eleve connecte et son entreprise.
// Si la session reference un eleve inexistant, elle est detruite.
const studentService = require('../services/studentService');

module.exports = async function loadStudent(req, res, next) {
  try {
    const student = await studentService.findByIdWithAccess(req.session.studentId);

    if (!student) {
      return req.session.destroy(() => res.redirect('/espace-login'));
    }

    req.student = student;
    res.locals.currentStudent = student;
    next();
  } catch (err) {
    next(err);
  }
};
