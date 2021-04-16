const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    //   console.log("On rentre dans le middleware");
    // Récupérer le token
    if (req.headers.authorization) {
      const newToken = req.headers.authorization.replace("Bearer ", "");
      // Chercher le user qui possède ce token dans la BDD
      const user = await User.findOne({ token: newToken });
      // Si le user n'est pas null
      if (user) {
        // ajouter à req l'objet user
        req.user = user;
        // On passe
        next();
      } else {
        res.status(401).json("Unauthorized");
      }
    } else {
      res.status(401).json("Unauthorized");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
