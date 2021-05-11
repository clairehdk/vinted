const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const isAuthenticated = require("../middlewares/isAuthenticated");
app.use(cors());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API,
  api_secret: process.env.CLOUD_SECRET,
});

const stripe = require("stripe")(process.env.STRIPE_SK);
const User = require("../models/User");
const Offer = require("../models/Offer");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  console.log("Hello");
  try {
    const {
      name,
      description,
      price,
      brand,
      etat,
      size,
      color,
      location,
    } = req.fields;
    // Créer notre nouvelle offre
    if (description.length <= 500 && name.length <= 50 && price < 10000) {
      const newOffer = new Offer({
        product_name: name,
        product_description: description,
        product_price: price,
        product_details: [
          {
            brand,
          },
          {
            etat,
          },
          {
            size,
          },
          {
            color,
          },
          {
            location,
          },
        ],
        owner: req.user,
      });
      let pictureToUpload = req.files.picture.path;
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `api/vinted/offers/${newOffer._id}`,
        public_id: "preview",
        // cloud_name: "my-project-vinted",
      });
      //   "vinted_upload",

      // );
      console.log(req.files.picture);
      newOffer.product_image = result;
      await newOffer.save();
      res.status(200).json({
        _id: newOffer._id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        product_image: result.secure_url,
        owner: {
          id: req.user.id,
          account: req.user.account,
        },
      });
    } else {
      res.status(401).json("Vous ne respectez pas les règles.");
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page, limit } = req.query;
    // On définit la variable des filtres
    let filters = {};

    // Si le titre existe, on l'ajoute à l'objet filter
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    // Si le priceMin existe, on l'ajoute à l'objet filter
    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }
    // Si le priceMax existe mais que le priceMin n'existe pas, on l'ajoute à l'objet filter
    if (priceMax && !priceMin) {
      filters.product_price = { $lte: Number(priceMax) };
      // Si le priceMax et le priceMin existent, on l'ajoute à l'objet filter
    } else if (priceMax && priceMin) {
      filters.product_price = {
        $gte: Number(priceMin),
        $lte: Number(priceMax),
      };
    }

    // On définit la variable de sort
    let sorting = {};
    if (sort === "price_asc") {
      sorting.product_price = 1;
    } else if (sort === "price_desc") {
      sorting.product_price = -1;
    }

    // const paging = Number(page - 1) * limit;

    let results = await Offer.find(filters)
      .populate("owner", "account _id")
      .sort(sorting)
      .skip(page > 1 ? (page - 1) * Number(limit) : 0)
      .limit(Number(limit));

    const count = await Offer.countDocuments(filters);
    res.status(200).json({ count: count, results: results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
  const offerToModify = await Offer.findById(req.params.id);
  try {
    if (req.fields.title) {
      offerToModify.product_name = req.fields.title;
    }
    if (req.fields.description) {
      offerToModify.product_description = req.fields.description;
    }
    if (req.fields.price) {
      offerToModify.product_price = req.fields.price;
    }

    const details = offerToModify.product_details;
    for (i = 0; i < details.length; i++) {
      if (details[i].MARQUE) {
        if (req.fields.brand) {
          details[i].MARQUE = req.fields.brand;
        }
      }
      if (details[i].TAILLE) {
        if (req.fields.size) {
          details[i].TAILLE = req.fields.size;
        }
      }
      if (details[i].ÉTAT) {
        if (req.fields.condition) {
          details[i].ÉTAT = req.fields.condition;
        }
      }
      if (details[i].COULEUR) {
        if (req.fields.color) {
          details[i].COULEUR = req.fields.color;
        }
      }
      if (details[i].EMPLACEMENT) {
        if (req.fields.location) {
          details[i].EMPLACEMENT = req.fields.location;
        }
      }
    }

    // Notifie Mongoose que l'on a modifié le tableau product_details
    offerToModify.markModified("product_details");

    if (req.files.picture) {
      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        public_id: `api/vinted/offers/${offerToModify._id}/preview`,
      });
      offerToModify.product_image = result;
    }

    await offerToModify.save();

    res.status(200).json("Offer modified succesfully !");
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    //Je supprime ce qui il y a dans le dossier
    await cloudinary.api.delete_resources_by_prefix(
      `api/vinted/offers/${req.params.id}`
    );
    //Une fois le dossier vide, je peux le supprimer !
    await cloudinary.api.delete_folder(`api/vinted/offers/${req.params.id}`);

    offerToDelete = await Offer.findById(req.params.id);

    await offerToDelete.delete();

    res.status(200).json("Offer deleted succesfully !");
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/payment", async (req, res) => {
  try {
    const { name, amount, currency, stripeToken } = req.fields;
    const response = await stripe.charges.create({
      amount: Number(amount),
      currency,
      name,
      source: stripeToken,
    });
    console.log(response.status);
    res.json(response);
  } catch (e) {
    console.log(e.message);
  }
  // TODO
  // Sauvegarder la transaction dans une BDD MongoDB
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account email"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
