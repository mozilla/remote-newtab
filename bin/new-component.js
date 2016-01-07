const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const COMPONENTS_DIR = './src/components';
const MAIN_CSS_PATH = './src/main.scss';
const name = args[0];
const dirPath = path.join(COMPONENTS_DIR, name);

function camelToHyphenated(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function jsTemplate(name) {
  return (
`const React = require('react');

const ${name} = React.createClass({
  render: function () {
    return (<div className="${camelToHyphenated(name)}">
    </div>);
  }
});

module.exports = ${name};
`);
}

function cssTemplate(name) {
  return (
`.${camelToHyphenated(name)} {

}
`);
}

if (fs.existsSync(dirPath)) throw new Error(`Component "${name}" already exists`);

fs.mkdirSync(dirPath);
fs.writeFileSync(path.join(dirPath, name + '.js'), jsTemplate(name));
fs.writeFileSync(path.join(dirPath, name + '.scss'), cssTemplate(name));
fs.appendFileSync(MAIN_CSS_PATH, `@import './components/${name}/${name}';\n`);
