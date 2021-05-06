const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

// Importer le model
const User = require("../models/User");
const Offer = require("../models/Offer");

// Configuration cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// INSCRIPTION

router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    const user = await User.findOne({ email: email });
    if (!user) {
      if (req.files.avatar) {
        // Envoi de la photo vers Cloudinary
        let pictureToUpload = req.files.avatar.path;
        // Récupération de l'objet photo dans la variable result
        const result = await cloudinary.uploader.upload(pictureToUpload, {
          folder: "/vinted/offers",
        });
        newUser.account.avatar = result;
      }
      if (username && password) {
        const salt = uid2(16);
        const hash = SHA256(salt + password).toString(encBase64);
        const token = uid2(64);
        // Créer nouveau user
        const newUser = new User({
          email: email,
          account: {
            username: username,
            phone: phone,
            avatar: result.secure_url,
          },
          token: token,
          hash: hash,
          salt: salt,
        });
        await newUser.save();
        res.status(200).json({
          _id: newUser.id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res
          .status(400)
          .json("Vous devez renseigner un username / mot de passe.");
      }
    } else {
      res.status(409).json("Cet email est déjà lié à un compte");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// CONNEXION

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    const userToLog = await User.findOne({ email: email });
    if (userToLog) {
      if (email && password) {
        const newHash = SHA256(userToLog.salt + password).toString(encBase64);
        if (newHash === userToLog.hash) {
          res.status(200).json({
            _id: userToLog.id,
            token: userToLog.token,
            account: userToLog.account,
          });
        } else {
          res.status(401).json("Unauthorized");
        }
      } else {
        res.status(400).json("Merci de renseigner les champs manquants");
      }
    } else {
      res.status(400).json("L'email que vous avez rentré n'existe pas");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// /author/update, /author/delete, /author

// export du fichier user.js
module.exports = router;
