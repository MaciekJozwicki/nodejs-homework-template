const Contact = require('./contact');

const listContacts = async () => {
  return await Contact.find();
};

const getById = async (id) => {
  return await Contact.findById(id);
};

const addContact = async (body) => {
  const newContact = new Contact(body);
  return await newContact.save();
};

const removeContact = async (id) => {
  return await Contact.findByIdAndRemove(id);
};

const updateContact = async (id, body) => {
  return await Contact.findByIdAndUpdate(id, body, { new: true });
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
