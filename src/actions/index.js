const req = require.context('.', false, /Actions.js$/);
const files = req.keys();

// Looks for all actions in this folder
// and returns them in the same object
files.forEach(file => {
  const actions = req(file);
  Object.keys(actions).forEach(action => {
    if (module.exports[action]) throw new Error(`Duplicate actions ${action} delclared. Check ${file}`);
    module.exports[action] = actions[action];
  });
});
