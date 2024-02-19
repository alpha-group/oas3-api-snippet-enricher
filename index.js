"use strict";

const fs = require("fs");
const OpenAPISnippet = require("openapi-snippet");
const yaml = require("js-yaml");
const args = require("yargs").argv;

let targets = [
  "shell_curl",
  "ruby_native",
  "python_python3",
  "node_fetch",
  "go_native",
  "php_http2",
  "java_okhttp"
];

if (args.targets) {
  targets = args.targets.split(",");
}

/**
 * Format the given target into a simple title.
 *
 * @param  {string} targetStr String defining a target, e.g., node_request
 * @return {string}           String containing simple title, e.g., Node.js
 */
const formatTitle = function (targetStr) {
  const targetTitleMap = {
    shell_curl: "curl",
    ruby_native: "Ruby",
    python_python3: "Python",
    node_native: "Node.js",
    node_request: "Node.js",
    node_unirest: "Node.js",
    node_fetch: "Node.js",
    go_native: "Go",
    php_curl: "PHP",
    php_http1: "PHP",
    php_http2: "PHP",
    java_unirest: "Java",
    java_okhttp: "Java",
  };

  return targetTitleMap[targetStr];
};

function enrichSchema(schema) {
  for (var path in schema.paths) {
    for (var method in schema.paths[path]) {
      var generatedCode = OpenAPISnippet.getEndpointSnippets(
        schema,
        path,
        method,
        targets
      );

      schema.paths[path][method]["x-codeSamples"] = [];

      for (var snippetIdx in generatedCode.snippets) {
        var snippet = generatedCode.snippets[snippetIdx];
        var shortTitle = formatTitle(snippet.id);
        var title =
          typeof shortTitle !== "undefined" ? shortTitle : snippet.title

        schema.paths[path][method]["x-codeSamples"][snippetIdx] = {
          lang: title,
          source: snippet.content,
        };
      }
    }
  }
  return schema;
}

if (!args.input) {
  throw new Error("Please pass the OpenAPI JSON schema as argument.");
}

// Try to interpret as YAML first, based on file extension

if (args.input.indexOf("yml") !== -1 || args.input.indexOf("yaml") !== -1) {
  try {
    let schema = yaml.safeLoad(fs.readFileSync(args.input, "utf8"));
    schema = enrichSchema(schema);
    console.log(JSON.stringify(schema));
  } catch (e) {
    // Do something with this
    console.log(e);
  }
} else {
  fs.readFile(args.input, (err, data) => {
    if (err) throw err;
    let schema = JSON.parse(data);
    schema = enrichSchema(schema);
    console.log(JSON.stringify(schema));
  });
}
