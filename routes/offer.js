const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");

cloudinary.config({
  cloud_name: "dibnkdlfo",
  api_key: "746126567576122",
  api_secret: "c2Iv_OBEntZ-UZYKahfefy2gQQ4",
});

const User = require("../models/User");
const Offer = require("../models/Offer");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
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
            etat,
          },
          {
            location,
          },
        ],
        owner: req.user,
      });
      let pictureToUpload = req.files.picture.path;
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `/vinted/offers/${newOffer._id}`,
      });
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
      res.status(400).json("Vous ne respectez pas les règles.");
    }
  } catch (error) {
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
      .select("product_name product_price")
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

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.fields.id);
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
    if (!offer) {
      res.status(400).json("This offer doesnt exist.");
    } else {
      let pictureToUpload = req.files.picture.path;
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: "/vinted/offers",
      });
      offer.product_name = name;
      offer.product_description = description;
      offer.product_price = price;
      offer.product_details = [
        { brand },
        { etat },
        { size },
        { color },
        { location },
      ];
      offer.product_image = result;
      await offer.save();
      res.status(200).json({
        _id: offer._id,
        product_name: offer.product_name,
        product_description: offer.product_description,
        product_price: offer.product_price,
        product_details: offer.product_details,
        product_image: result.secure_url,
        owner: {
          id: req.user.id,
          account: req.user.account,
        },
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    const offerToDelete = await Offer.findById(req.query.id);
    if (offerToDelete) {
      offerToDelete.delete();
      res.status(200).json("The offer has been deleted.");
    } else {
      res.status(200).json("The offer you want to delete doesnt exist.");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// router.get("/offer/:id", async (req, res) => {
//   try {
//     const offer = await Offer.findById(req.params.id).populate(
//       "owner",
//       "account.username"
//     );
//     res.json(offer);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

module.exports = router;
