const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
    emailVerificationRequired: { type: Boolean, default: true },
  },
  { collection: 'appsettings' }
);

appSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findById('singleton');
  if (!doc) {
    doc = await this.create({ _id: 'singleton', emailVerificationRequired: true });
  }
  return doc;
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
