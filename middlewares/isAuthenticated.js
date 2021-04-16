const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  //   console.log("On rentre dans le middleware");
  // Récupérer le token
  const newToken = req.headers.authorization.replace("Bearer ", "");
  // Chercher le user qui possède ce token dans la BDD
  const user = await User.findOne({ token: newToken });

  // Si le user n'est pas null
  if (user) {
    //Si le token du user correspond au token entré en header
    if (user.token === newToken) {
      // ajouter à req l'objet user
      req.user = user;
      // On passe
      next();
    }
  } else {
    res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;
