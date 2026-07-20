Validate the current Gyxer Studio schema without generating code.

## Instructions

1. Call `get_project` to fetch the current project state
2. Check the schema for problems:
   - Project has at least one entity, and every entity has at least one field
   - Entity names are PascalCase, field names are camelCase
   - Enum fields include a non-empty `enumValues` array
   - Relations reference entities that exist
   - Module constraints hold: `auth-oauth` requires `auth-jwt`; `auth-jwt` and `auth-keycloak` are not enabled together
3. If a schema file path is passed as an argument instead, run `npx @gyxer-studio/cli validate <path>` and relay its output
4. Report the result: either "schema is valid" or a list of problems with a suggested fix for each

## Output

A validation verdict. No files are generated or modified.
