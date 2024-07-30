const express = require("express");
const Joi = require("joi");
const {
  listContacts,
  getById,
  removeContact,
  updateContact,
  updateStatusContact,
} = require("../../controllers/contacts");
const Contact = require('../../models/contact');

const router = express.Router();

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});

const favoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
});

router.get("/", async (req, res, next) => {
  try {
    const contacts = await listContacts({ owner: req.user.id });
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const contact = await getById(req.params.contactId);
    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  console.log(req.user)
  // const { name, email, phone, favorite } = req.body;
  // const newContact = new Contact({
  //   name,
  //   email,
  //   phone,
  //   favorite,
  //   owner: req.user.id,
  // });

  // try {
  //   const savedContact = await newContact.save();
  //   res.status(201).json(savedContact);
  // } catch (error) {
  //   res.status(400).json({ message: error.message });
  // }

  try {
    const { name, email, phone, favorite } = req.body;
    const newContact = new Contact({
      name,
      email,
      phone,
      favorite,
      owner: req.user.id,
    });

    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({
          message: `missing required ${error.details[0].path[0]} - field`,
        });
    }
    const savedContact = await newContact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const result = await removeContact(req.params.contactId);
    if (result) {
      res.status(200).json({ message: "contact deleted" });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "missing fields" });
    }
    const updatedContact = await updateContact(req.params.contactId, req.body);
    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", async (req, res, next) => {
  try {
    const { error } = favoriteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "missing field favorite" });
    }
    const updatedContact = await updateStatusContact(
      req.params.contactId,
      req.body
    );
    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
