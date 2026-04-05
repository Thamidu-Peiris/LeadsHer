const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
    emailVerificationRequired: {
      type: Boolean,
      default: true,
    },
  },
  { collection: 'appsettings' }
);

appSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findById('singleton');
  if (!doc) {
    const def = process.env.EMAIL_VERIFICATION_REQUIRED === 'false' ? false : true;
    doc = await this.create({ _id: 'singleton', emailVerificationRequired: def });
  }
  return doc;
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
