const Contact = require('../models/contact');

const listContacts = async (body) => {
  console.log(body);
  return await Contact.find();
};

const getById = async (req) => {
  const { id } = req.params;

  return await Contact.findById({id: id, owner: req.user.id });
};

const addContact = async (req) => {
  const { name, email, phone, favorite } = req.body;
  
  const newContact = new Contact({
    name,
    email,
    phone,
    favorite,
    owner: req.user.id,
  });

  return await newContact.save();
};

const removeContact = async (req) => {
  const { id } = req.params;

  return await Contact.findByIdAndRemove({ _id: id, owner: req.user.id });
};

const updateContact = async (req) => {
  const { id } = req.params;
  const { name, email, phone, favorite } = req.body;

  return await Contact.findByIdAndUpdate(
    { _id: id, owner: req.user.id },
    { name, email, phone, favorite },
    { new: true }
  );
};

const updateStatusContact = async (id, body) => {
  return await Contact.findByIdAndUpdate(id, body, { new: true });
};

module.exports = {
  listContacts,
  getById,
  addContact,
  removeContact,
  updateContact,
  updateStatusContact,
};
