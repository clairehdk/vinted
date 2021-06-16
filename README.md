# VINTED BACKEND

Vinted est un projet que j'ai réalisé au cours de ma formation au Réacteur, qui consistait à réaliser une réplique du site du même nom, qui consiste en la vente de vetement d'occasion.

Ce repo est la partie back-end de mon projet.

## Langages

**Javascript**

**HTML 5**

**CSS 3**

## Outils

**Node JS** : Plateforme de traitement de requêtes Javascript

**Visual Studio Code** : Editeur de code source

**Heroku** : Herbergement du serveur

**MongoDB Atlas** : Base de données

## Packages utilisés

- **NPM** : Initialisation du projet
- **Stripe** : Achat et paiement d'un produit
- **Crypto Js** : Encryptage du mot de passe
- **Cloudinary** : Hebergement des photos
- **Cors** : Autorisation des demandes exterieures 
- **Dotenv** : Dissimulation des données sensibles
- **Express** : Création du serveur
- **Express Formidable** : Traitement des requêtes utilisant la méthode HTTP POST
- **Mongoose** : Manipulation de bases de données MongoDB

## Middlewares

Création d'un middleware permettant de vérifier que l'utilisateur est authentifié afin de le laisser effectuer certaines actions s'il est connecté, ou de le rediriger vers l'inscription/connexion.
Exemple : Publication d'une offre, modification d'une offre, suppression d'une offre.

## Modèles MongoDB

* User 
* Offres

## Fonctionnalités 

### Utilisateur

- Inscription
- Connexion

### Offres

- Publication d'une offre
- Affiichage de toutes les offres, avec mise en place de filtres
- Modifier une offre
- Supprimer une offre
- Récupérer les offres créées par un utilisateur


