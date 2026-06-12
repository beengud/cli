import { type CodegenConfig } from "@graphql-codegen/cli";

const schemaUrl = process.env.OBSERVE_GQL_SPEC ?? "";

const config: CodegenConfig = {
  schema: {
    [schemaUrl]: {
      headers: {
        Authorization: `Bearer ${process.env.OBSERVE_GQL_TOKEN}`,
      },
    },
  },
  documents: ["src/gql/**/*.graphql"],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    "./src/gql/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
        dedupeFragments: true,
        extractAllFieldsToTypes: true,
        printFieldsOnNewLines: true,
      },
      config: {
        useTypeImports: true,
        dedupeFragments: true,
        useImplementingTypes: true,
        enumType: "const",
        scalars: {
          CustomerId: "string",
          Duration: "string",
          Int64: "string",

          Number: "number",
          ORN: "string",
          ORNTYPE: "string",
          ObjectId: "string",
          UserId: "string",
          // PaginatedResults: TODO
        },
      },
    },
  },
};

export default config;
